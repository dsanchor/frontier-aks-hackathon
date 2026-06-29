# Challenge AI-02 — LLM Inference with KAITO — Coach Solution

[< Previous Solution](./Solution-AI-01.md) | [Home](../../README.md)

## Notes & Guidance

- **Model download takes 5–15 minutes** (Phi-3.5-mini is ~4 GB). Teams must plan for this
  wait time during the challenge.
- **Cost alert:** GPU nodes for KAITO (`Standard_NC4as_T4_v3`) cost roughly
  $0.50–$0.75/hour. Scale down immediately after the challenge.
- **KAITO AI Toolchain Operator is GA as of AKS 1.30.** No feature flag registration is
  required for clusters running AKS 1.30+. For older clusters or regions still in preview,
  register in advance and wait up to 60 minutes for propagation:
  `az feature register --namespace Microsoft.ContainerService --name AIToolchainOperatorPreview`
- If the AI Toolchain Operator is not available in the team's region, teams can
  install KAITO manually via Helm.
- Verify the installed KAITO version with `kubectl api-resources | grep kaito` and use the
  appropriate `apiVersion` for the installed CRDs.

### Common Issues

- **Workspace stuck in Pending:** Check `kubectl describe workspace`. Common cause: no GPU
  nodes available or taint/toleration mismatch.
- **Model download OOMKilled:** Node does not have enough memory. Minimum: 16 GiB RAM
  plus GPU VRAM for the model.

### Workspace Status Check

```bash
kubectl describe workspace workspace-phi3-mini -n kaito-workspace
# Look for: Status.Conditions[*].Type == Ready
# Model is downloading when: WorkspaceConditionTypeResourceProvisioned == True but Ready != True
```

## Solution

### Part 1: Enable KAITO via AKS Add-on (Preview)

```bash
RG=rg-frontier-aks
CLUSTER_NAME=aks-frontier

# Enable the KAITO add-on (GA since AKS 1.30 — no feature flag required)
az aks update \
  --resource-group $RG \
  --name $CLUSTER_NAME \
  --enable-ai-toolchain-operator

# Create the workspace namespace used by KAITO workspaces
kubectl create namespace kaito-workspace --dry-run=client -o yaml | kubectl apply -f -

# Verify KAITO pods
kubectl get pods -n kube-system | grep kaito
```

### Alternative: Install KAITO via Helm (if add-on not available)

```bash
helm repo add kaito https://kaito-project.github.io/kaito/
helm repo update

helm install kaito kaito/workspace \
  --namespace kaito-workspace \
  --create-namespace
```

### Part 2: Deploy Phi-3-mini with KAITO Workspace

```yaml
# workspace-phi3-mini.yaml
# Verify the installed KAITO API version:
# kubectl api-resources | grep kaito
# Use v1alpha1 if that is what your add-on version serves.
apiVersion: kaito.sh/v1beta1
kind: Workspace
metadata:
  name: workspace-phi3-mini
  namespace: kaito-workspace
spec:
  resource:
    count: 1 # Number of GPU nodes to provision (not replica count)
    instanceType: "Standard_NC4as_T4_v3"
    labelSelector:
      matchLabels:
        app: workspace-phi3-mini
  inference:
    preset:
      name: phi-3-mini-4k-instruct
```

```bash
kubectl apply -f workspace-phi3-mini.yaml

# Watch workspace status (model downloading)
kubectl get workspace workspace-phi3-mini -n kaito-workspace -w

# Detailed status
kubectl describe workspace workspace-phi3-mini -n kaito-workspace
```

### Part 3: Test Inference

```bash
# Get the inference service endpoint
SVC_IP=$(kubectl get svc workspace-phi3-mini \
  -n kaito-workspace \
  -o jsonpath='{.spec.clusterIP}')

# Port-forward for testing
kubectl port-forward svc/workspace-phi3-mini 8080:80 -n kaito-workspace &

# Send an inference request
curl -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Explain Kubernetes in 3 sentences."}
    ],
    "max_length": 200
  }'
```

### Part 4: Scale Inference Deployment

```bash
# KAITO manages inference pod replicas automatically based on the node count
# To scale, update spec.resource.count (provisions more GPU nodes)
kubectl patch workspace workspace-phi3-mini -n kaito-workspace \
  --type merge \
  -p '{"spec":{"resource":{"count":2}}}'

kubectl get workspace workspace-phi3-mini -n kaito-workspace

# Delete the KAITO workspace to release GPU nodes provisioned by KAITO's gpu-provisioner
kubectl delete workspace workspace-phi3-mini -n kaito-workspace
```

KAITO provisions GPU nodes through its own `gpu-provisioner`, separate from any manually
created AKS node pool such as `gpupool`. Clean up the `Workspace` resource to trigger
release of those KAITO-managed nodes.

### Part 5 (Optional): KAITO with Workload Identity

```yaml
# workspace-with-identity.yaml
apiVersion: kaito.sh/v1beta1
kind: Workspace
metadata:
  name: workspace-phi3-private
  namespace: kaito-workspace
  annotations:
    azure.workload.identity/client-id: "<MANAGED_IDENTITY_CLIENT_ID>"
spec:
  resource:
    count: 1 # Number of GPU nodes to provision (not replica count)
    instanceType: "Standard_NC4as_T4_v3"
    labelSelector:
      matchLabels:
        app: workspace-phi3-private
  inference:
    preset:
      name: phi-3-mini-4k-instruct
    # For models from Azure model catalog / private registry
    # template:
    #   spec:
    #     serviceAccountName: kaito-sa
```
