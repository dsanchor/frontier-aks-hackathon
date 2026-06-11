# Challenge 12 — AKS Fleet Manager — Coach Solution

[< Previous Solution](./Solution-11.md) | [Home](../../README.md) | [Next Solution (Optional) >](./Solution-13.md)

## Notes & Guidance

- **Fleet hub creation takes ~5 minutes.** Set expectations early.
- `ClusterResourcePlacement` resources are applied on the **Fleet hub cluster** kubeconfig,
  not the member cluster kubeconfig. Teams frequently apply to the wrong cluster.
- The `placement.kubernetes-fleet.io` CRDs only exist on the Fleet hub cluster.
- For teams with only one cluster: have them create a second cheap cluster (1 node,
  `Standard_B2s`, single zone) just for the Fleet demo. It only needs to run long enough
  to demonstrate propagation.
- The **upgrade run** demo is impressive — show the staged strategy even if not fully
  executing it (describing it is sufficient for the success criterion).

### Common Issues

- **`az fleet` commands not found:** Requires `az fleet` extension:
  `az extension add --name fleet`
- **Member cluster join fails:** The Fleet hub and member clusters must be in the same or
  peered subscription. Cross-subscription requires additional RBAC.
- **ClusterResourcePlacement stuck in Scheduled but not Applied:** Check the member cluster
  has the required CRDs. Simple resources (ConfigMap, Namespace) are safest for the demo.

## Solution

### Part 1: Create Fleet Hub

```bash
RG=rg-frontier-aks
LOCATION=eastus
FLEET_NAME=fleet-frontier

az extension add --name fleet --upgrade

az fleet create \
  --resource-group $RG \
  --name $FLEET_NAME \
  --location $LOCATION \
  --enable-hub

echo "Fleet hub created: $FLEET_NAME"
```

### Part 2: Join Member Clusters

```bash
CLUSTER_1=aks-frontier
CLUSTER_2=aks-frontier-private  # or a second cluster from challenge 11

# Join cluster 1
az fleet member create \
  --resource-group $RG \
  --fleet-name $FLEET_NAME \
  --name member1 \
  --member-cluster-id \
    $(az aks show -g $RG -n $CLUSTER_1 --query id -o tsv)

# Join cluster 2
az fleet member create \
  --resource-group $RG \
  --fleet-name $FLEET_NAME \
  --name member2 \
  --member-cluster-id \
    $(az aks show -g $RG -n $CLUSTER_2 --query id -o tsv)

# Get fleet hub kubeconfig
az fleet get-credentials \
  --resource-group $RG \
  --name $FLEET_NAME \
  --overwrite-existing

# List members
kubectl get memberclusters
```

### Part 3: Workload Propagation with ClusterResourcePlacement

First, create the resource to propagate on the fleet hub:

```yaml
# fabtech-namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: fabtech
  labels:
    fleet.azure.com/managed: "true"
```

```bash
kubectl apply -f fabtech-namespace.yaml
```

`ClusterResourcePlacement` to propagate to all members:

```yaml
# crp-fabtech.yaml
apiVersion: placement.kubernetes-fleet.io/v1beta1
kind: ClusterResourcePlacement
metadata:
  name: fabtech-namespace
spec:
  resourceSelectors:
  - group: ""
    kind: Namespace
    version: v1
    name: fabtech
  policy:
    placementType: PickAll
```

```bash
kubectl apply -f crp-fabtech.yaml
kubectl get clusterresourceplacement fabtech-namespace -w

# Verify on member clusters
kubectl config use-context <CLUSTER_1_CONTEXT>
kubectl get namespace fabtech
```

### Part 4: Staged Rollout Strategy for Upgrades

```bash
# Member clusters must be assigned to update groups before creating the update run.
az fleet member update \
  --resource-group $RG \
  --fleet-name $FLEET_NAME \
  --name member1 \
  --update-group group1

az fleet member update \
  --resource-group $RG \
  --fleet-name $FLEET_NAME \
  --name member2 \
  --update-group group1

# Create a stages definition file (controls rollout order across update groups)
cat > stages.json << 'EOF'
{
  "stages": [
    {
      "name": "stage1",
      "groups": [
        {
          "name": "group1"
        }
      ],
      "afterStageWaitInSeconds": 60
    }
  ]
}
EOF

# Create and start the upgrade run
az fleet updaterun create \
  --resource-group $RG \
  --fleet-name $FLEET_NAME \
  --name upgrade-1-33 \
  --upgrade-type Full \
  --kubernetes-version 1.33 \
  --stages @stages.json

# Show the run
az fleet updaterun show \
  --resource-group $RG \
  --fleet-name $FLEET_NAME \
  --name upgrade-1-33
```
