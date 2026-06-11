# Challenge 05 — Observability — Coach Solution

[< Previous Solution](./Solution-04.md) | [Home](../../README.md) | [Next Solution >](./Solution-06.md)

## Notes & Guidance

- Data takes **3–5 minutes** to appear in Grafana after enabling Managed Prometheus.
  Coach teams to wait and refresh before assuming something is broken.
- Pre-built dashboards appear under **Dashboards > Azure Managed Prometheus** in Grafana.
  The **Kubernetes / Compute Resources / Cluster** dashboard is the most impressive out-of-box.
- Use `ContainerLogV2` table in KQL (not `ContainerLog`) — it is the current schema with
  structured fields (`Namespace`, `PodName`, `LogLevel`).
- `az monitor account create` is a relatively new command — requires az CLI >= 2.50. If it
  fails, update with `az upgrade`.
- The canonical modern command for Container Insights is
  `az aks addon enable --addon monitoring`. It still covers log collection, but **NOT** metrics
  — for metrics, use Managed Prometheus.

### Common Issues

- **Grafana permission denied:** After creation, grant yourself the `Grafana Admin` role:
  `az role assignment create --role "Grafana Admin" --assignee <your-email> --scope <grafana-id>`
- **`ama-metrics` pods CrashLooping:** Usually a permissions issue between the cluster and
  the Azure Monitor workspace. Check the managed identity permissions.

## Solution

### Part 1: Azure Managed Prometheus

```bash
RG=rg-frontier-aks
CLUSTER_NAME=aks-frontier
MONITOR_WS=amw-frontier
LOCATION=eastus

# Create Azure Monitor workspace (Managed Prometheus store)
az monitor account create \
  --name $MONITOR_WS \
  --resource-group $RG \
  --location $LOCATION

MONITOR_WS_ID=$(az monitor account show \
  --name $MONITOR_WS \
  --resource-group $RG \
  --query id -o tsv)

# Link cluster to the workspace
az aks update \
  --resource-group $RG \
  --name $CLUSTER_NAME \
  --enable-azure-monitor-metrics \
  --azure-monitor-workspace-resource-id $MONITOR_WS_ID

# Verify
kubectl get pods -n kube-system | grep ama-metrics
```

### Part 2: Azure Managed Grafana

```bash
GRAFANA_NAME=grafana-frontier

az grafana create \
  --name $GRAFANA_NAME \
  --resource-group $RG \
  --location $LOCATION

GRAFANA_ID=$(az grafana show \
  --name $GRAFANA_NAME \
  --resource-group $RG \
  --query id -o tsv)

# Link Grafana to the Prometheus workspace
az aks update \
  --resource-group $RG \
  --name $CLUSTER_NAME \
  --enable-azure-monitor-metrics \
  --azure-monitor-workspace-resource-id $MONITOR_WS_ID \
  --grafana-resource-id $GRAFANA_ID

# Get Grafana URL
az grafana show --name $GRAFANA_NAME --resource-group $RG \
  --query properties.endpoint -o tsv
```

### Part 3: Container Insights (Log Collection)

```bash
LOG_WS_NAME=law-frontier

az monitor log-analytics workspace create \
  --resource-group $RG \
  --workspace-name $LOG_WS_NAME \
  --location $LOCATION

LOG_ANALYTICS_WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group $RG \
  --workspace-name $LOG_WS_NAME \
  --query id -o tsv)

az aks addon enable \
  --resource-group $RG \
  --name $CLUSTER_NAME \
  --addon monitoring \
  --workspace-resource-id $LOG_ANALYTICS_WORKSPACE_ID
```

### Part 4: KQL Query Examples

Run these in the Log Analytics workspace → Logs blade:

```kusto
// Container logs from fabtech namespace
ContainerLogV2
| where TimeGenerated > ago(10m)
| where Namespace == "fabtech"
| project TimeGenerated, PodName, ContainerName, LogMessage
| order by TimeGenerated desc
| limit 50
```

```kusto
// Error logs in the last hour
ContainerLogV2
| where TimeGenerated > ago(1h)
| where LogLevel == "Error"
| summarize count() by ContainerName, bin(TimeGenerated, 5m)
| render timechart
```

### Part 5: Custom Grafana Dashboard Panels (PromQL)

Panels to create in a new Grafana dashboard:

```promql
# CPU Usage by Namespace
sum(rate(container_cpu_usage_seconds_total{container!=""}[5m])) by (namespace)

# Memory Usage by Pod
sum(container_memory_working_set_bytes{container!=""}) by (pod, namespace)

# Pod Restart Count
sum(kube_pod_container_status_restarts_total) by (namespace, pod)
```

### Part 6: Azure Monitor Alert Rule + Action Group

Alerts close the loop from observation to action. Create an Action Group and a
Prometheus-based alert rule for high pod restart rates:

```bash
ACTION_GROUP_NAME=ag-aks-ops

# Create an email Action Group
az monitor action-group create \
  --resource-group $RG \
  --name $ACTION_GROUP_NAME \
  --short-name aks-ops \
  --action email ops-team ops-team@example.com

ACTION_GROUP_ID=$(az monitor action-group show \
  --resource-group $RG \
  --name $ACTION_GROUP_NAME \
  --query id -o tsv)

# Create a Prometheus alert rule targeting the Azure Monitor workspace
az monitor alert-processing-rule create \
  --resource-group $RG \
  --name alert-high-restart-rate \
  --rule-type AddActionGroups \
  --action-groups $ACTION_GROUP_ID \
  --scopes $MONITOR_WS_ID

# Alert rule YAML (for reference — applied via az monitor metrics alert create
# or Bicep for production use)
# Condition: container_restart_rate > 5 in last 5 min triggers the action group
cat <<EOF
apiVersion: azuremonitor.microsoft.com/v1
kind: PrometheusRuleGroup
metadata:
  name: aks-pod-restart-alerts
  namespace: default
spec:
  clusterName: $CLUSTER_NAME
  rules:
  - alert: HighPodRestartRate
    expr: |
      increase(kube_pod_container_status_restarts_total[5m]) > 5
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "Pod {{ \$labels.pod }} is restarting frequently"
EOF
```
