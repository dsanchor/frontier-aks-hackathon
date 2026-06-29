# Challenge 09 — Service Mesh with AKS Istio — Coach Solution

[< Previous Solution](./Solution-08.md) | [Home](../../README.md) | [Next Solution >](./Solution-10.md)

## Notes & Guidance

- The Istio revision label format is `asm-1-XX` — get the exact value with:
  `az aks mesh get-revisions --location $LOCATION`
- After enabling the namespace label for sidecar injection, **all pods must be restarted**
  to get the Envoy sidecar injected. Teams forget this step.
- The canary traffic split via `VirtualService` is the most visually engaging demo.
  Set up two Deployments (`v1` and `v2`) with different `version` labels and a 
  `DestinationRule` that defines the subsets.
- `istioctl manifest apply` was **removed in Istio 1.7**. Never use it — use `istioctl install`
  or (better) the AKS managed add-on.

### Common Issues

- **Sidecars not injecting:** Verify the namespace label:
  `kubectl get namespace fabtech --show-labels | grep istio.io/rev`
  Then restart pods: `kubectl rollout restart deployment -n fabtech`
- **mTLS blocking traffic from the Gateway:** The App Routing Gateway is not
  part of the mesh by default. Create an exception in the `PeerAuthentication` or configure
  the Gateway to go through an Istio ingress gateway.
- **Kiali not available in AKS managed Istio:** Managed Istio ships without Kiali by default.
  Teams can observe traffic via the Istio metrics in Grafana (Managed Prometheus integration).

## Solution

### Part 1: Enable AKS Managed Istio

```bash
RG=rg-frontier-aks
CLUSTER_NAME=aks-frontier
LOCATION=eastus

# Check available revisions
az aks mesh get-revisions --location $LOCATION -o table

# Enable managed Istio (use the latest asm revision)
az aks mesh enable \
  --resource-group $RG \
  --name $CLUSTER_NAME

# Verify
kubectl get pods -n aks-istio-system
```

### Part 2: Enable Sidecar Injection

```bash
# Label the namespace for automatic injection
# Get the exact revision label first:
REVISION=$(az aks mesh get-revisions --location $LOCATION -o tsv --query 'meshRevisions[-1].revision')
kubectl label namespace fabtech istio.io/rev=$REVISION

# Restart all pods to inject sidecars
kubectl rollout restart deployment -n fabtech

# Verify sidecars
kubectl get pods -n fabtech
# Each pod should now show 2/2 or 3/3 containers (app + istio-proxy)
```

### Part 3: Configure mTLS (STRICT Mode)

```yaml
# peer-auth.yaml
apiVersion: security.istio.io/v1
kind: PeerAuthentication
metadata:
  name: default
  namespace: fabtech
spec:
  mtls:
    mode: STRICT
```

```bash
kubectl apply -f peer-auth.yaml

# Verify — traffic from a non-mesh pod should fail.
# Run this from the default namespace so the pod is outside the mesh (no sidecar);
# pods outside the mesh cannot reach a service protected by STRICT mTLS.
kubectl run test-plain -n default --image=curlimages/curl --restart=Never -- \
  curl -s http://fabtech-api.fabtech.svc.cluster.local:3001/api/health
# Expected: connection reset or SSL handshake failure
```

### Part 4: Canary Traffic Split

First, make sure the main `fabtech-api` Service only selects v1 pods. Otherwise,
the `fabtech-api-v2` pods will receive live traffic before the `VirtualService`
canary is in place.

```yaml
# fabtech-api-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: fabtech-api
  namespace: fabtech
spec:
  selector:
    app: fabtech-api
    version: v1
  ports:
  - port: 3001
    targetPort: 3001
```

> **Coach Note:** The `version: v1` label added to the Service selector is outside the Helm chart. A subsequent `helm upgrade` will revert this change. During the canary exercise, either update the Helm chart values to include this selector, or temporarily suspend Flux/Helm reconciliation for the Service.

Then deploy a v2 of the API (the existing v1 pods should keep `app: fabtech-api`
and `version: v1` labels):

```yaml
# fabtech-api-v2-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fabtech-api-v2
  namespace: fabtech
spec:
  replicas: 1
  selector:
    matchLabels:
      app: fabtech-api
      version: v2
  template:
    metadata:
      labels:
        app: fabtech-api
        version: v2
    spec:
      containers:
      - name: api
        image: <ACR>/fabtech-api:v2
        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop: ["ALL"]
```

```yaml
# destination-rule.yaml
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata:
  name: fabtech-api
  namespace: fabtech
spec:
  host: fabtech-api
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
---
# virtual-service.yaml
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: fabtech-api
  namespace: fabtech
spec:
  hosts:
  - fabtech-api
  http:
  - route:
    - destination:
        host: fabtech-api
        subset: v1
      weight: 80
    - destination:
        host: fabtech-api
        subset: v2
      weight: 20
```

```bash
kubectl apply -f destination-rule.yaml
kubectl apply -f virtual-service.yaml

# Generate traffic and observe split in Grafana
for i in {1..50}; do
  kubectl exec -n fabtech deploy/fabtech-web -- \
    curl -s http://fabtech-api:3001/api/version
done
```

### Part 5 (Optional): AuthorizationPolicy

```yaml
# authz-policy.yaml
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: allow-web-to-api
  namespace: fabtech
spec:
  selector:
    matchLabels:
      app: fabtech-api
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/fabtech/sa/fabtech-web-sa"]
```
