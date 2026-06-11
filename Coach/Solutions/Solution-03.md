# Challenge 03 — App Deployment & Gateway API — Coach Solution

[< Previous Solution](./Solution-02.md) | [Home](../../README.md) | [Next Solution >](./Solution-04.md)

## Notes & Guidance

- Teams must complete the Helm chart and get the app running before choosing a routing option.
- Option A (Gateway API via App Routing) is the recommended first path — same add-on, no extra infra.
- Option B (AGC) requires a Managed Identity and ALB Controller install — allow 20–30 extra minutes.
- For the database, steer teams toward **Azure Database for PostgreSQL Flexible Server** unless
  time is tight.

### Common Issues

- **App Routing already enabled:** AKS Automatic clusters may have it on by default.
  Check: `kubectl get gatewayclass` before enabling it again.
- **GatewayClass not found:** Run `az aks approuting enable` and wait 2–3 minutes for the
  GatewayClass to be registered.
- **Helm chart rendering errors:** Run `helm template ./chart` to debug before installing.
- **Gateway API — route not accepted:** Confirm the `parentRef` gateway name matches exactly
  and the `allowedRoutes.namespaces` selector includes the `fabtech` namespace.
- **AGC — frontend not resolving:** ALB Controller pods must be running in `azure-alb-system`
  before the `ApplicationLoadBalancer` resource is created.

## Solution

### Part 0 — Database (Optional)

Challenge 03 asks teams to deploy a database, but the app can still run without one while they
finish the platform work.

#### Option A — Azure Database for PostgreSQL Flexible Server (Recommended)

```bash
az postgres flexible-server create \
  --resource-group $RG \
  --name fabtech-pg \
  --location eastus \
  --admin-user fabadmin \
  --admin-password <DB_PASS> \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 16 \
  --public-access None

az postgres flexible-server db create \
  --resource-group $RG \
  --server-name fabtech-pg \
  --database-name fabtech

# Get connection string (used in Challenge 04)
DB_HOST=$(az postgres flexible-server show -g $RG -n fabtech-pg --query fullyQualifiedDomainName -o tsv)
echo "postgresql://fabadmin:<DB_PASS>@${DB_HOST}:5432/fabtech?sslmode=require"
```

> **Note:** If skipping the database, the API falls back to serving data from bundled JSON files —
> `DATABASE_URL` is optional. You can add it in Challenge 04 via Key Vault.

#### Option B — In-cluster PostgreSQL (development only)

Use an in-cluster PostgreSQL instance only for local or short-lived development environments. This
path is covered in detail in **Challenge 10**, so do not spend time on it during Challenge 03
unless the team explicitly wants a dev-only setup.

### Part 1 — Enable App Routing & Deploy the Helm Chart

```bash
RG=rg-frontier-aks
CLUSTER_NAME=aks-frontier
ACR_NAME=<ACR_NAME>
NAMESPACE=fabtech

# On AKS Automatic, App Routing may already be enabled.
# Check for the GatewayClass first:
kubectl get gatewayclass

# Enable App Routing if the GatewayClass is not present
az aks approuting enable \
  --resource-group $RG \
  --name $CLUSTER_NAME

# Verify Gateway API support is ready before applying gateway.yaml
kubectl get gatewayclass
# Expected: webapprouting.kubernetes.azure.com

ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)

# Optional: include the next flag only when using PostgreSQL; it maps to DATABASE_URL
helm upgrade --install fabtech ./chart \
  --namespace $NAMESPACE \
  --create-namespace \
  --set api.image.repository=$ACR_LOGIN_SERVER/fabtech-api \
  --set api.env.databaseUrl="<DATABASE_URL>" \
  --set web.image.repository=$ACR_LOGIN_SERVER/fabtech-web

kubectl get pods,svc -n $NAMESPACE
```

### Part 2 — Option A: Gateway API via App Routing

> **Note:** In current AKS versions, `az aks approuting enable` installs the Gateway API CRDs
> and registers the `webapprouting.kubernetes.azure.com` `GatewayClass`. No manual CRD install
> is needed, but allow a couple of minutes for the `GatewayClass` to appear.

```yaml
# gateway.yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: fabtech-gateway
  namespace: fabtech
  annotations:
    service.beta.kubernetes.io/azure-load-balancer-internal: "false"
spec:
  gatewayClassName: webapprouting.kubernetes.azure.com
  listeners:
  - name: http
    protocol: HTTP
    port: 80
    allowedRoutes:
      namespaces:
        from: Same
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: fabtech-route
  namespace: fabtech
spec:
  parentRefs:
  - name: fabtech-gateway
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /
    backendRefs:
    - name: fabtech-web
      port: 3000
```

```bash
kubectl apply -f gateway.yaml
kubectl get gateway -n fabtech          # wait for READY=True
kubectl get httproute -n fabtech        # confirm status: Accepted
```

### Part 3 — Option B: Gateway API via Application Gateway for Containers (AGC)

```bash
# Install the ALB Controller via Helm with Workload Identity
IDENTITY_NAME=alb-controller-identity
CLUSTER_RG=$(az aks show -g $RG -n $CLUSTER_NAME \
  --query nodeResourceGroup -o tsv)

az identity create -g $RG -n $IDENTITY_NAME
IDENTITY_CLIENT_ID=$(az identity show -g $RG -n $IDENTITY_NAME \
  --query clientId -o tsv)

# Assign AppGw for Containers Configuration Manager role
az role assignment create \
  --assignee-object-id $(az identity show -g $RG -n $IDENTITY_NAME \
    --query principalId -o tsv) \
  --role "AppGw for Containers Configuration Manager" \
  --scope $(az group show -g $RG --query id -o tsv)

# Federate the identity
OIDC_ISSUER=$(az aks show -g $RG -n $CLUSTER_NAME \
  --query oidcIssuerProfile.issuerUrl -o tsv)

az identity federated-credential create \
  --name alb-controller \
  --identity-name $IDENTITY_NAME \
  --resource-group $RG \
  --issuer $OIDC_ISSUER \
  --subject "system:serviceaccount:azure-alb-system:alb-controller-sa"

# Install ALB Controller
helm install alb-controller oci://mcr.microsoft.com/application-lb/charts/alb-controller \
  --namespace azure-alb-system \
  --create-namespace \
  --set albController.namespace=azure-alb-system \
  --set albController.podIdentity.clientID=$IDENTITY_CLIENT_ID

kubectl wait --namespace azure-alb-system \
  --for=condition=ready pod \
  --selector=app=alb-controller \
  --timeout=90s
```

AGC bring-your-own mode needs three resources:

1. `ApplicationLoadBalancer`
2. `Gateway` bound to that ALB
3. `HTTPRoute` that points to the `Gateway`

```yaml
# agc.yaml — ApplicationLoadBalancer + Gateway + HTTPRoute
apiVersion: alb.networking.azure.io/v1
kind: ApplicationLoadBalancer
metadata:
  name: fabtech-alb
  namespace: azure-alb-system
spec:
  associations:
  - /subscriptions/<SUB_ID>/resourceGroups/<NODE_RG>/providers/Microsoft.Network/virtualNetworks/<VNET>/subnets/<AGC_SUBNET>
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: fabtech-agc-gateway
  namespace: fabtech
  annotations:
    alb.networking.azure.io/alb-namespace: azure-alb-system
    alb.networking.azure.io/alb-name: fabtech-alb
spec:
  gatewayClassName: azure-alb-external
  listeners:
  - name: http
    port: 80
    protocol: HTTP
    allowedRoutes:
      namespaces:
        from: Same
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: fabtech-agc-route
  namespace: fabtech
spec:
  parentRefs:
  - name: fabtech-agc-gateway
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /
    backendRefs:
    - name: fabtech-web
      port: 3000
```

### Helm Upgrade & Rollback

```bash
helm upgrade fabtech ./chart \
  --namespace $NAMESPACE \
  --set api.replicaCount=4

kubectl rollout status deployment/fabtech-api -n $NAMESPACE

helm rollback fabtech --namespace $NAMESPACE
helm history fabtech --namespace $NAMESPACE
```

### Production Readiness: PodDisruptionBudget

A `PodDisruptionBudget` ensures at least one replica stays available during node
drains and voluntary disruptions (upgrades, scale-down):

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: fabtech-api-pdb
  namespace: fabtech
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: fabtech-api
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: fabtech-web-pdb
  namespace: fabtech
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: fabtech-web
```

### Production Readiness: Zone Spread

Add `topologySpreadConstraints` to each Deployment's pod spec to distribute
pods evenly across availability zones:

```yaml
topologySpreadConstraints:
- maxSkew: 1
  topologyKey: topology.kubernetes.io/zone
  whenUnsatisfiable: DoNotSchedule
  labelSelector:
    matchLabels:
      app: fabtech-api
```

```bash
kubectl apply -f pdb.yaml
kubectl get pdb -n fabtech
```
