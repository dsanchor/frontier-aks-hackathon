# Challenge 08 — AKS Security Hardening — Coach Solution

[< Previous Solution](./Solution-07.md) | [Home](../../README.md) | [Next Solution >](./Solution-09.md)

## Notes & Guidance

- **Azure Policy enforcement delay:** After assigning a policy, allow up to 15–20 minutes
  before enforcement begins while Gatekeeper syncs. Teams testing immediately may not see
  the block yet.
- `az aks enable-addons --addons azure-policy` installs OPA Gatekeeper into
  `gatekeeper-system`. Pods should appear within 2–3 minutes.
- For the network policy demo, Cilium policies allow L7 HTTP filtering — this is a powerful
  differentiator from standard Kubernetes NetworkPolicy.
- **Entra ID group creation** may require Azure AD permissions the team doesn't have.
  An alternative: use `--aad-admin-group-object-ids` with an existing group they belong to.

### Common Issues

- **`kubectl auth can-i` always returns yes even for non-admin:** The cluster may not have
  Entra ID integration enabled. Verify: `az aks show --query "aadProfile"`
- **Network policy not blocking traffic:** Check that the cluster was created with a network
  policy engine (`--network-policy cilium` or `--network-policy azure`). Network policies
  applied to a cluster without a policy engine are silently ignored.
- **OPA Gatekeeper constraint not showing:** The `ConstraintTemplate` must be created before
  the `Constraint`. Azure Policy installs both, but check `kubectl get constrainttemplates`.

## Solution

### Part 1: Entra ID Integration & RBAC

```bash
RG=rg-frontier-aks
CLUSTER_NAME=aks-frontier

# Get or create an Entra ID group for admins
ADMIN_GROUP_ID=$(az ad group create --display-name "AKS-Admins" \
  --mail-nickname "aks-admins" --query id -o tsv)

az aks update \
  --resource-group $RG \
  --name $CLUSTER_NAME \
  --enable-aad \
  --enable-azure-rbac \
  --aad-admin-group-object-ids $ADMIN_GROUP_ID

AKS_ID=$(az aks show --resource-group $RG --name $CLUSTER_NAME --query id -o tsv)
DEVELOPER_GROUP_ID=$(az ad group create --display-name "AKS-Developers" \
  --mail-nickname "aks-developers" --query id -o tsv)

# Example Azure RBAC for Kubernetes authorization
az role assignment create \
  --assignee-object-id $DEVELOPER_GROUP_ID \
  --assignee-principal-type Group \
  --role "Azure Kubernetes Service RBAC Reader" \
  --scope $AKS_ID

# Disable local admin accounts — forces all access through Entra ID,
# preventing bypass via `az aks get-credentials --admin`
az aks update \
  --resource-group $RG \
  --name $CLUSTER_NAME \
  --disable-local-accounts

# Refresh credentials
az aks get-credentials --resource-group $RG --name $CLUSTER_NAME --overwrite-existing
kubelogin convert-kubeconfig -l azurecli
```

- `--enable-aad`: enables Entra authentication (**who you are**).
- `--enable-azure-rbac`: enables Azure RBAC for Kubernetes authorization (**what you can do**),
  using Azure role assignments instead of or alongside Kubernetes RoleBindings.

Optional Kubernetes RBAC example (**not** an Azure RBAC role assignment):

```yaml
# developer-rbac.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: developer
  namespace: fabtech
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log", "services", "configmaps"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods/exec"]
  verbs: ["create"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: developer-binding
  namespace: fabtech
subjects:
- kind: Group
  name: "<DEVELOPER_GROUP_ID>"
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: developer
  apiGroup: rbac.authorization.k8s.io
```

```bash
kubectl apply -f developer-rbac.yaml

# Test Kubernetes RBAC RoleBinding behavior
kubectl auth can-i delete pods -n fabtech --as-group="<DEVELOPER_GROUP_ID>"
# Expected: no
kubectl auth can-i get pods -n fabtech --as-group="<DEVELOPER_GROUP_ID>"
# Expected: yes
```

### Part 2: Azure Policy Add-on

```bash
az aks enable-addons \
  --resource-group $RG \
  --name $CLUSTER_NAME \
  --addons azure-policy

kubectl get pods -n kube-system | grep azure-policy
kubectl get pods -n gatekeeper-system
```

Test policy blocking privileged pods:

```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: priv-test
  namespace: fabtech
spec:
  containers:
  - name: c
    image: nginx
    securityContext:
      privileged: true
EOF
# Expected: Error from server: admission webhook "validation.gatekeeper.sh" denied the request
```

### Part 3: Network Policy

```yaml
# network-policies.yaml
---
# Default deny all ingress traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: fabtech
spec:
  podSelector: {}
  policyTypes:
  - Ingress
---
# Allow Gateway (App Routing) → web
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-gateway-to-web
  namespace: fabtech
spec:
  podSelector:
    matchLabels:
      app: fabtech-web
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: app-routing-system
---
# Allow web → api
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-web-to-api
  namespace: fabtech
spec:
  podSelector:
    matchLabels:
      app: fabtech-api
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: fabtech-web
    ports:
    - protocol: TCP
      port: 3001
```

```bash
kubectl apply -f network-policies.yaml

# Test: unauthorized pod cannot reach api
kubectl run -it --rm test-pod --image=busybox --restart=Never -n fabtech -- \
  wget -qO- --timeout=5 http://fabtech-api:3001/api/health
# Expected: connection refused or timeout
```

### Part 4: Microsoft Defender for Containers (Optional)

```bash
az security pricing create \
  --name Containers \
  --tier Standard

# Review recommendations
az security assessment list \
  --query "[?displayName.contains(@,'container')]" -o table
```
