---
marp: true
paginate: true
footer: 'Frontier AKS Hackathon · Coach Briefing'
style: |
  section {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #323130;
    background: #ffffff;
    padding: 44px 60px 54px 60px;
    position: relative;
  }
  section::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 5px;
    background: linear-gradient(90deg, #003667 0%, #0078D4 55%, #50ABF1 100%);
  }
  section::after {
    font-size: 0.6em;
    color: #A19F9D;
  }
  h1 {
    color: #003667;
    font-size: 1.65em;
    margin: 8px 0 2px 0;
    line-height: 1.2;
  }
  h2 {
    color: #0078D4;
    font-size: 0.82em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin: 0 0 12px 0;
    padding-bottom: 6px;
    border-bottom: 1px solid #C7E0F4;
  }
  h3 {
    color: #323130;
    font-size: 0.9em;
    margin: 12px 0 3px 0;
  }
  ul { margin: 0; padding-left: 18px; }
  li { font-size: 0.85em; line-height: 1.55; margin-bottom: 2px; }
  p { font-size: 0.85em; line-height: 1.5; margin: 4px 0; }
  table {
    font-size: 0.78em;
    border-collapse: collapse;
    width: 100%;
    margin-top: 6px;
  }
  th {
    background: #EFF6FC;
    color: #003667;
    padding: 5px 10px;
    text-align: left;
    border: 1px solid #C7E0F4;
  }
  td {
    padding: 4px 10px;
    border: 1px solid #EDEBE9;
    vertical-align: top;
  }
  blockquote {
    border-left: 4px solid #0078D4;
    background: #EFF6FC;
    margin: 12px 0 0 0;
    padding: 8px 14px;
    border-radius: 0 4px 4px 0;
    font-style: normal;
    font-size: 0.8em;
    color: #003667;
  }
  blockquote p { margin: 0; font-size: 1em; }
  code {
    background: #F3F2F1;
    color: #A4262C;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 0.88em;
  }
  pre {
    background: #F8F8F8;
    border-left: 3px solid #0078D4;
    border-radius: 0 4px 4px 0;
    padding: 10px 14px;
    margin: 8px 0;
    font-size: 0.78em;
    line-height: 1.45;
    overflow: hidden;
  }
  pre code {
    background: none;
    color: #323130;
    padding: 0;
    font-size: 1em;
  }
  strong { color: #003667; }
  footer { color: #A19F9D; font-size: 0.6em; }

  section.cover {
    background: linear-gradient(140deg, #003667 0%, #0078D4 65%, #50ABF1 100%);
    color: white;
    padding: 60px 80px;
  }
  section.cover::before { display: none; }
  section.cover h1 {
    color: white;
    font-size: 2.4em;
    margin-bottom: 10px;
    line-height: 1.15;
  }
  section.cover h2 {
    color: rgba(255,255,255,0.75);
    border: none;
    text-transform: none;
    font-size: 1.1em;
    font-weight: 400;
    letter-spacing: 0;
    margin-bottom: 20px;
    padding: 0;
  }
  section.cover p { color: rgba(255,255,255,0.85); font-size: 1em; }
  section.cover footer { color: rgba(255,255,255,0.45); }

  section.divider {
    background: linear-gradient(140deg, #003667 0%, #0078D4 65%, #50ABF1 100%);
    color: white;
    padding: 60px 80px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  section.divider::before { display: none; }
  section.divider h1 { color: white; font-size: 2.2em; }
  section.divider h2 {
    color: rgba(255,255,255,0.75);
    border: none;
    text-transform: none;
    font-size: 1.15em;
    font-weight: 400;
    letter-spacing: 0;
    padding: 0;
  }
  section.divider footer { color: rgba(255,255,255,0.45); }
---

<!-- _class: cover -->

# Frontier AKS Hackathon
## Concept Slides

---

# Challenge 00 · The Kubernetes Toolchain

## Concepts: kubectl, Azure CLI, kubelogin, Helm, Flux CLI · ⏱ 30 min

### Why a dedicated toolchain?
- Kubernetes has its own client (`kubectl`) — separate from `az` and cloud-specific CLIs
- Each tool has a defined responsibility; they work together, not interchangeably

### The tools and what they do
- **`az` (Azure CLI):** provision Azure resources, create the AKS cluster, manage ACR
- **`kubectl`:** speak directly to the Kubernetes API server — create, inspect, delete resources
- **`kubelogin`:** converts the kubeconfig to use Entra ID tokens — required for AAD-integrated clusters
- **`helm`:** Kubernetes package manager — installs and upgrades complex workloads from a chart
- **`flux`:** GitOps CLI — inspect and manually trigger Flux reconciliation

### How authentication flows
```
az login  →  az aks get-credentials  →  kubelogin convert-kubeconfig
                                                  ↓
                              Entra ID token injected into kubeconfig
                                                  ↓
                              kubectl → AKS API server (authenticated)
```

### kubelogin login modes

| Mode | Use case |
|---|---|
| `azurecli` | Local dev — uses your `az login` session |
| `interactive` | MFA / Conditional Access required |
| `workloadidentity` | CI/CD pipelines — federated, no secrets |
| `msi` | Azure VMs / hosted agents with Managed Identity |

**Recommended one-liner for humans:** `az aks get-credentials … && kubelogin convert-kubeconfig -l azurecli`

**For pipelines:** `kubelogin convert-kubeconfig -l workloadidentity` — no SPN secrets stored anywhere.

> **Version mismatches are the #1 silent failure cause.** When something inexplicably breaks, check `az --version`, `kubectl version --client`, and `helm version` before anything else.

📖 **Resources:** [AKS quickstart](https://learn.microsoft.com/azure/aks/learn/quick-kubernetes-deploy-cli) · [kubelogin auth](https://learn.microsoft.com/azure/aks/kubelogin-authentication)

---

# Challenge 01 · Container Images & Azure Container Registry

## Concepts: Docker images, image layers, private registries, ACR · ⏱ 45 min

### What is a container image?
- A container image is a **read-only, layered filesystem snapshot** — your app + its runtime + its dependencies, frozen in one artifact
- Built from a `Dockerfile`: each instruction (`RUN`, `COPY`, `FROM`) adds an immutable layer
- Layers are **cached** — unchanged layers are reused on rebuild, making incremental builds fast
- Images are tagged: `fabtech-api:v1`, `fabtech-api:latest`

### What is a container registry?
- A registry is a **storage and distribution service** for images — like npm for containers
- **Azure Container Registry (ACR)** is a private, managed registry inside your Azure tenant
- Images never leave your organisation; access is controlled via Azure RBAC

### Why ACR Premium SKU matters
- **Standard/Basic** lacks: private endpoints, geo-replication, image signing
- **Premium** unlocks all of the above — and features cannot be retroactively added by upgrading later (private endpoint configuration differs)
- Choosing Premium from day one avoids recreating the registry mid-hackathon

> **ACR Tasks** builds images inside Azure — no local Docker Desktop required. The build runs in the cloud; only the final image is stored in the registry.

### Image signing — Notation + Ratify (replaces Docker Content Trust)
- **Docker Content Trust (Notary v1) is deprecated** — cannot be enabled after 31 May 2026, fully removed 31 Mar 2028
- **Notation** (Notary v2 / OCI-native): signs images with keys backed by Azure Key Vault; signatures stored as OCI artifacts alongside the image
- **Ratify**: a Kubernetes admission controller that verifies signatures at deploy time — unsigned images are rejected before the pod starts

```
notation sign --key <akv-key> myacr.azurecr.io/fabtech-api:v1
```

### ABAC repository-level permissions (GA, May 2025)
- Replaces registry-wide RBAC with **per-repository or per-prefix** access grants
- Example: give team A push access only to `fabtech/*` — team B cannot see or push other repos

### Artifact Streaming (Premium, Preview)
- Large images (multi-GB AI models, debug-fat images) pull in seconds — pods start before full download completes
- Enable per-repository: `az acr repository update --name <acr> --repository <repo> --streaming-state enabled`

📖 **Resources:** [ACR overview](https://learn.microsoft.com/azure/container-registry/container-registry-intro) · [ACR Tasks](https://learn.microsoft.com/azure/container-registry/container-registry-tasks-overview) · [Notation signing](https://learn.microsoft.com/azure/container-registry/container-registry-tutorial-sign-build-push) · [Ratify](https://learn.microsoft.com/azure/container-registry/container-registry-artifact-policy)

---

# Challenge 02 · Azure Kubernetes Service — Core Concepts

## Concepts: Managed control plane, CNI Overlay, Cilium, OIDC, NAP · Deployments, StatefulSets, DaemonSets, Jobs/CronJobs, Pod lifecycle & probes · ⏱ 45 min

### What AKS manages for you
- The **Kubernetes control plane** (API server, etcd, scheduler, controller manager) is fully managed by Azure — zero-downtime upgrades, HA across zones
- You are responsible for: **node pools** (the VMs where workloads run), networking, and add-ons

### Networking: Azure CNI Overlay + Cilium
- **Azure CNI Overlay:** pods get IPs from a private overlay network (not from the VNet CIDR) — eliminates IP exhaustion in large clusters
- **Cilium:** replaces kube-proxy with eBPF-based networking; faster, L7-aware, powers NetworkPolicy (Challenge 08)

### OIDC Issuer — foundation for Workload Identity
- AKS exposes an **OIDC issuer URL** so pods can federate with Entra ID using short-lived tokens
- This is the prerequisite for Workload Identity (Challenge 04) — **must be enabled at cluster creation**
- Also required for KEDA's `TriggerAuthentication` (Challenge 06)

### Advanced Container Networking Services (ACNS)
- **L7 / FQDN network policies:** allow/deny traffic by DNS name (e.g., `*.database.windows.net`) — no IP management required
- **Hubble observability:** Cilium-native real-time flow visibility, DNS queries, and per-workload network metrics, surfaced in Azure Monitor
- Enable: `az aks update --enable-acns`

### Node Auto Provisioning (NAP)
- Uses **Karpenter** under the hood — provisions the right-sized VM for a pending pod just-in-time
- Must be configured at cluster creation with Cilium + Overlay (cannot be retrofitted)
- NodePool and AKSNodeClass use **`karpenter.sh/v1`** (stable API) — `v1beta1` references in older docs are superseded

> **AKS Automatic (GA):** ships with Azure CNI Overlay + Cilium, KEDA, VPA, NAP, hardened security defaults, and a **99.9% pod-readiness SLA** — ideal for teams that want production defaults without deep Kubernetes expertise. Standard = full control over every setting.

📖 **Resources:** [Cilium + Azure CNI](https://learn.microsoft.com/azure/aks/azure-cni-powered-by-cilium) · [OIDC issuer](https://learn.microsoft.com/azure/aks/use-oidc-issuer)

---

# AKS Networking Deep Dive · CNI Options & IP Planning

## Challenge 02 · Networking reference — Kubenet, Azure CNI, CNI Overlay, Cilium, BYOCNI, IP addressing

### Choosing a CNI is a one-way door
- The network plugin is set at **cluster creation and cannot be changed** later (except kubenet → Overlay migration) — pick deliberately
- The single biggest failure mode in large clusters is **VNet IP exhaustion**; the CNI choice decides how many VNet IPs each pod consumes

| Model | Pod IP source | VNet IP per pod | Max pods/node | Status | Best for |
|---|---|---|---|---|---|
| **Kubenet** | Internal range (NAT'd) | No | 110 (default 30) | Legacy — **retires Mar 2028** | Small clusters, tight on IPs (legacy only) |
| **Azure CNI** | VNet subnet | Yes (1:1) | 250 | Supported | Pods needing direct VNet routing |
| **Azure CNI Overlay** | Private overlay CIDR | No (nodes only) | 250 | **Recommended default** | Nearly all new clusters — scale + IP efficiency |
| **Azure CNI + Cilium** | Overlay or pod subnet | No (overlay mode) | 250 | Recommended (eBPF) | Scale + NetworkPolicy, L7, Hubble observability |

### When to use each
- **Azure CNI Overlay** → default for new deployments; only nodes take VNet IPs, each node gets a `/24` from the overlay; overlay CIDR can overlap across clusters
- **Azure CNI Powered by Cilium** → Overlay + eBPF dataplane; replaces kube-proxy, powers high-performance NetworkPolicy, FQDN policy and Hubble
- **Azure CNI (classic / node subnet)** → only when pods must be **directly reachable on the VNet** (legacy integrations, some appliances)
- **BYOCNI (`--network-plugin none`)** → bring Calico, Cilium OSS, Flannel, etc.; you own IPAM, upgrades and support
- **Kubenet** → avoid for new clusters (400-route UDR limit, no Windows nodes, no VMSS/virtual-node scale features, retiring 2028)

### Key constraints
- **Kubenet:** Linux only (no Windows node pools), limited by Azure's **400 user-defined routes** per route table
- **Overlay:** pods are SNAT'd behind the node IP for egress — not directly addressable from outside the cluster
- **Migration path:** kubenet and classic Azure CNI clusters can be **upgraded in-place to CNI Overlay** (`az aks update ... --network-plugin-mode overlay`)

### Dynamic IP allocation (Azure CNI, node-subnet mode)
- Assigns pod IPs on demand from a **dedicated pod subnet** instead of pre-reserving `max-pods` per node — far better VNet IP utilisation than classic CNI
- Enable at create with a separate pod subnet: `--vnet-subnet-id <node-subnet>` + `--pod-subnet-id <pod-subnet>`

### Key commands
```bash
# Azure CNI Overlay (recommended default)
az aks create -g rg -n aks --network-plugin azure --network-plugin-mode overlay \
  --pod-cidr 10.244.0.0/16

# Azure CNI Overlay + Cilium (eBPF dataplane)
az aks create -g rg -n aks --network-plugin azure --network-plugin-mode overlay \
  --network-dataplane cilium

# Azure CNI with dynamic IP allocation (dedicated pod subnet)
az aks create -g rg -n aks --network-plugin azure \
  --vnet-subnet-id <node-subnet-id> --pod-subnet-id <pod-subnet-id>

# BYOCNI — install your own CNI after creation
az aks create -g rg -n aks --network-plugin none

# Migrate an existing cluster to Overlay (kubenet / classic CNI)
az aks update -g rg -n aks --network-plugin-mode overlay --pod-cidr 10.244.0.0/16
```

> **Sizing rule of thumb:** with Overlay you only size the **node subnet** for `(nodes + max surge during upgrade)` VNet IPs — the overlay pod CIDR (e.g. a `/16`) is private and reusable. With classic Azure CNI you must reserve `nodes × (1 + max-pods)` VNet IPs, which exhausts subnets fast.

📖 **Resources:** [AKS networking concepts](https://learn.microsoft.com/azure/aks/concepts-network) · [IP address planning](https://learn.microsoft.com/azure/aks/concepts-network-ip-address-planning) · [CNI Overlay](https://learn.microsoft.com/azure/aks/azure-cni-overlay) · [CNI + Cilium](https://learn.microsoft.com/azure/aks/azure-cni-powered-by-cilium) · [Configure Azure CNI](https://learn.microsoft.com/azure/aks/configure-azure-cni) · [BYOCNI](https://learn.microsoft.com/azure/aks/use-byo-cni) · [Kubenet deprecation](https://learn.microsoft.com/azure/aks/kubenet-deprecation)

---

# Kubernetes Deep Dive · Deployments & Rollout Strategies

## Challenge 02 · Workloads reference — Concepts: Deployment → ReplicaSet → Pod, rolling updates, PDBs, zero-downtime

### The object hierarchy — you manage the top, Kubernetes manages the rest
```
Deployment            # you edit this — declares desired state (image, replicas, strategy)
   └── ReplicaSet     # created & owned by the Deployment — one per template revision
          └── Pod     # created & owned by the ReplicaSet — the running workload
```
- You **never manage ReplicaSets directly** — updating the Pod template creates a *new* ReplicaSet, scales it up while scaling the old one down, and keeps the old one at 0 replicas for **rollback history**
- The Deployment controller reconciles: change `replicas` or `image`, and it drives the actual state toward your declared state

### Anatomy of a Deployment spec
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 5                     # desired Pod count
  selector:
    matchLabels: { app: web }     # MUST match template labels (immutable)
  minReadySeconds: 30             # Pod must stay Ready 30s before counting as available
  progressDeadlineSeconds: 600    # rollout marked Failed if no progress in 10 min
  strategy:
    type: RollingUpdate           # RollingUpdate (default) | Recreate
    rollingUpdate:
      maxSurge: 25%               # extra Pods above replicas (rounds up)
      maxUnavailable: 25%         # Pods allowed down during update (rounds down)
  template:                       # the Pod blueprint — changing it triggers a rollout
    metadata:
      labels: { app: web }
    spec:
      containers:
        - name: web
          image: myrepo/web:v2
          readinessProbe:         # gates "available" — critical for safe rollouts
            httpGet: { path: /healthz, port: 8080 }
```

> **Pitfall:** a rollout is only as safe as your `readinessProbe`. Without one, Kubernetes treats a Pod as "available" the instant it starts — traffic hits it before the app is ready and `maxUnavailable` gives you no real protection.

---

# Deployments · Strategies, Rollout Control & PodDisruptionBudgets

## Challenge 02 · Workloads reference (continued)

## Concepts: RollingUpdate vs Recreate, `kubectl rollout`, PDBs

### RollingUpdate vs Recreate
| | **RollingUpdate** (default) | **Recreate** |
|---|---|---|
| **How** | Incrementally replace old Pods with new, honoring `maxSurge`/`maxUnavailable` | Terminate **all** old Pods, then create new ones |
| **Downtime** | Zero (with readiness probes + PDB) | **Full outage** during the swap |
| **Versions running together** | Yes — old & new coexist briefly | No — never two versions at once |
| **Use when** | Stateless web/API services, the common case | Breaking DB schema changes, singleton apps, **GPU workloads needing exclusive device access** |

- `maxSurge` / `maxUnavailable` accept an **integer or percentage**; surge rounds **up**, unavailable rounds **down**. Setting `maxUnavailable: 0` + `maxSurge: 1` gives the safest (but slowest) rollout — always full capacity
- **Defaults are 25% / 25%** — fine for many services, but tune for HA-critical or resource-tight workloads

### `kubectl rollout` cheat-sheet
```bash
kubectl rollout status  deployment/web          # watch progress, exits non-zero on failure
kubectl rollout history deployment/web          # list revisions
kubectl rollout history deployment/web --revision=3   # inspect a specific revision
kubectl rollout undo    deployment/web          # roll back to previous revision
kubectl rollout undo    deployment/web --to-revision=3
kubectl rollout pause   deployment/web          # stage multiple edits without triggering rollouts
kubectl rollout resume  deployment/web          # apply the staged changes as one rollout
kubectl rollout restart deployment/web          # re-roll all Pods (e.g. to pick up a rotated secret)
```

### PodDisruptionBudget (PDB) — protect availability during *voluntary* disruptions
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: web-pdb }
spec:
  minAvailable: 3                 # OR maxUnavailable — never both
  selector:
    matchLabels: { app: web }
```
- A PDB caps how many Pods can be **voluntarily** evicted at once (node drain, cluster upgrade, autoscaler consolidation) — it does **not** guard against node crashes
- During `kubectl drain` / an **AKS node-image or Kubernetes upgrade**, the drain **blocks** rather than violate the PDB — this is what keeps upgrades from taking your service down
- Set `minAvailable`/`maxUnavailable` so it can't deadlock: a PDB of `minAvailable: 100%` will **stall every node drain forever**

> **Best practice:** pair a PDB with a multi-replica Deployment and `readinessProbe`s, and spread Pods across zones/nodes with `topologySpreadConstraints`. RollingUpdate gives zero-downtime *deploys*; the PDB gives zero-downtime *node maintenance & upgrades*. You want both.

📖 **Resources:** [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) · [Rolling update without downtime](https://kubernetes.io/docs/tasks/run-application/update-deployment-rolling/) · [PodDisruptionBudget](https://kubernetes.io/docs/tasks/run-application/configure-pdb/) · [Disruptions concept](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/) · [AKS clusters & workloads](https://learn.microsoft.com/azure/aks/concepts-clusters-workloads) · [AKS upgrade & drain](https://learn.microsoft.com/azure/aks/upgrade-cluster)

---

# Kubernetes Deep Dive · DaemonSets, Jobs & CronJobs

## Challenge 02 · Workloads reference — Concepts: Node-level workloads, Batch processing, Scheduled tasks

### DaemonSet (Run on every node)
- **Purpose**: Ensures a copy of a Pod runs on all (or selected) nodes.
- **Use cases**: Log forwarders (Fluentbit), monitoring (Prometheus node-exporter), CNI agents.
- **Node selection**: Use `nodeSelector` or `nodeAffinity` to restrict target nodes.
- **Toleration pattern**: DaemonSets often use tolerations to run on tainted system or master nodes.

### Job (Run to completion)
- **Purpose**: Runs finite tasks to completion.
- **Key fields**: 
  - `completions` + `parallelism`: Matrix determining how many total pods run, and how many concurrently.
  - `backoffLimit`: Number of retries before marking Job as failed.
- **Restart Policy**: Must be `Never` or `OnFailure` (cannot be `Always`).

### CronJob (Scheduled Jobs)
- **Purpose**: Creates Jobs on a repeating schedule using cron syntax (e.g., `0 0 * * *` for midnight).
- **History Limits**: Retain older jobs using `successfulJobsHistoryLimit` & `failedJobsHistoryLimit`.
- **Concurrency Policy**:
| Policy | Behavior |
|--------|----------|
| **Allow** | Default. Jobs can run concurrently if the previous hasn't finished. |
| **Forbid** | Skips the new run if the previous run hasn't finished. |
| **Replace** | Cancels the currently running job and starts a new one. |

### Quick Commands
```bash
kubectl get ds -n kube-system
kubectl create job my-job --image=busybox -- echo "Done"
kubectl create cronjob my-cron --image=busybox --schedule="* * * * *" -- echo "Tick"
```

---

# Kubernetes Deep Dive · Pod Lifecycle & Health Probes

## Challenge 02 · Workloads reference — Concepts: Pending, Running, Readiness, Liveness, Startup

### Pod Lifecycle Phases
- **Pending**: Accepted by API, containers not yet created (e.g., waiting for scheduling, pulling images).
- **Running**: Bound to a node, containers created, at least one is running/starting.
- **Succeeded**: All containers terminated successfully, no restarts will occur.
- **Failed**: All containers terminated, at least one failed (non-zero exit).
- **Unknown**: State cannot be obtained (often due to node network partition).

### Health Probes Side-by-Side
- **Liveness probe**: Evaluates health. _On failure_: Kills and restarts container.
- **Readiness probe**: Evaluates readiness to serve traffic. _On failure_: Removes pod from Service endpoints.
- **Startup probe**: Evaluates initialization. _On failure_: Kills container. Disables Liveness/Readiness until successful.

### Probe Mechanisms
| Mechanism | Description |
|-----------|-------------|
| **`httpGet`** | Expects HTTP 2xx or 3xx status code. |
| **`exec`** | Runs a shell command; expects exit code `0`. |
| **`tcpSocket`** | Attempts to open a TCP connection to a specified port. |
| **`grpc`** | Uses gRPC Health Checking Protocol. |

### Annotated YAML
```yaml
startupProbe:
  httpGet: { path: /healthz, port: 8080 }
  failureThreshold: 30       # Gives slow apps 30 * 10s = 300s to start
  periodSeconds: 10
livenessProbe:
  httpGet: { path: /healthz, port: 8080 }
  initialDelaySeconds: 5     # Wait 5s before first liveness check
  failureThreshold: 3        # Restart after 3 failures (30s)
readinessProbe:
  httpGet: { path: /ready, port: 8080 }
  successThreshold: 1        # Require 1 success to become ready again
```

> **Common Pitfalls:** Missing a **Readiness probe** means traffic is sent to non-ready pods resulting in errors! Missing a **Startup probe** on slow-starting apps means the Liveness probe might repeatedly kill the container before it finishes initialization!

📖 **Resources:** [DaemonSets](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/) · [Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/) · [CronJobs](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/) · [Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)

---

# Kubernetes Deep Dive · StatefulSets & Stateful Workloads

## Challenge 02 · Workloads reference — stable identity, ordered lifecycle, per-pod storage, canary rollouts

### Why StatefulSet (not Deployment) for stateful apps?
- **Stable identity:** pods keep ordinal names (`app-0`, `app-1`) and predictable DNS
- **Ordered lifecycle:** create/terminate in order by default (`OrderedReady`)
- **Per-pod persistent storage:** `volumeClaimTemplates` creates one PVC per replica
- Common workloads: PostgreSQL, Redis, Kafka, Elasticsearch, ZooKeeper

### Headless Service + DNS identity
- StatefulSets use `serviceName` pointing to a **headless Service** (`clusterIP: None`)
- DNS pattern: **`<pod-name>.<headless-svc>.<namespace>.svc.cluster.local`**
- Example: `postgres-0.postgres.db.svc.cluster.local`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  clusterIP: None # headless: DNS returns individual pod IPs
  selector:
    app: postgres
```

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres            # must match headless Service
  replicas: 3                      # postgres-0..2
  podManagementPolicy: OrderedReady # or Parallel
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: managed-csi-premium-v2
      resources:
        requests:
          storage: 64Gi
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      partition: 2 # canary: update pods with ordinal >=2 first
```

---

# Kubernetes Deep Dive · StatefulSets & Stateful Workloads

### Deployment vs StatefulSet

| Capability | Deployment | StatefulSet |
|---|---|---|
| Pod identity | Ephemeral/random | Stable ordinal (`pod-0`, `pod-1`) |
| Storage model | Shared or external PVC patterns | One PVC per pod (`volumeClaimTemplates`) |
| Start/stop ordering | No guarantees | Ordered by default (`OrderedReady`) |
| Typical use cases | Stateless APIs, web apps, workers | Databases, brokers, clustered stateful systems |

### Scaling & update gotchas
- Scale-up/down is ordered with `OrderedReady`; use `Parallel` only if ordering is unnecessary
- **Scale-down does not delete PVCs** by default; data stays for safe scale-up/recovery
- `RollingUpdate` + `partition` enables ordinal canary rollout (e.g., keep `0-1` old, update `2+`)
- `OnDelete` strategy gives full manual control: pods change only when you delete them

> **AKS tip:** for StatefulSets on Azure Disk CSI, use `volumeBindingMode: WaitForFirstConsumer` and zone-aware storage classes (for example ZRS where appropriate) to avoid Pending pods from zone mismatch.

📖 **Resources:** [Kubernetes StatefulSet](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/) · [Headless Service](https://kubernetes.io/docs/concepts/services-networking/service/#headless-services) · [AKS storage concepts](https://learn.microsoft.com/azure/aks/concepts-storage) · [Azure Disk CSI](https://learn.microsoft.com/azure/aks/azure-disk-csi)

---

# Challenge 03 (1 of 2) · Helm — Kubernetes Package Manager

## Concepts: Charts, values, releases, templating, lifecycle · ⏱ 60 min total

### The problem Helm solves
- A real app needs: `Deployment`, `Service`, `ConfigMap`, `HPA`, `PodDisruptionBudget`, `Ingress`...
- Without Helm: a pile of raw YAML files with hard-coded values, duplicated per environment
- With Helm: one **chart** templates everything; a **values file** customises per environment

### Key Helm concepts
- **Chart:** a directory of Kubernetes manifest templates with `{{ .Values.* }}` placeholders
- **Values:** a YAML file of inputs — `image.tag`, `replicaCount`, `ingress.host`
- **Release:** a named, versioned installation of a chart in a specific namespace

### The Helm lifecycle
```
helm install  fabtech ./chart -f values.yaml      # create release
helm upgrade  fabtech ./chart --set image.tag=v2  # update release
helm rollback fabtech 1                            # revert to revision 1
helm history  fabtech                              # audit trail of changes
```

### OCI-based chart distribution (modern pattern)
- Helm charts can be stored **directly in ACR** alongside container images — one registry for everything:
```
helm push ./chart oci://myacr.azurecr.io/charts
helm install fabtech oci://myacr.azurecr.io/charts/fabtech --version 1.2.0
```
- Flux `HelmRepository` supports `type: oci` — enables fully air-gapped, private chart distribution

### Values override priority (low → high)
`chart defaults` → `values.yaml` → `-f override.yaml` → `--set`

> **Helm is GitOps-compatible:** commit your `values.yaml` and chart version to Git, and Flux's `HelmRelease` CRD drives the lifecycle automatically — covered in Challenge 07.

📖 **Resources:** [Helm on AKS](https://learn.microsoft.com/azure/aks/quickstart-helm)

---

# Challenge 03 (2 of 2) · Gateway API — Modern Kubernetes Ingress

## Concepts: GatewayClass, Gateway, HTTPRoute, App Routing · (continued)

### Why replace the old Ingress API?
- The original `Ingress` resource has **very limited routing rules** — everything complex lived in controller-specific annotations (nginx.ingress.kubernetes.io/...)
- Annotations are not portable — an nginx config breaks on any other controller
- **Gateway API** is the CNCF-standard replacement: expressive, role-oriented, extensible, and portable

### The Gateway API object hierarchy
```
GatewayClass        ─── which controller handles traffic (azure, nginx, istio...)
    └── Gateway     ─── a listener instance (port 80, port 443 + TLS cert)
          └── HTTPRoute  ─── routing rules (host match, path match → backend Service)
```
- **Different teams own different objects:** platform team owns `GatewayClass` + `Gateway`; developers own `HTTPRoute`

### AKS ingress options — current landscape

| Option | Status | Notes |
|---|---|---|
| **App Routing + Gateway API** (Istio-based) | ✅ GA | Recommended default path; default on AKS Automatic ≥ 1.36 |
| **Application Gateway for Containers (AGC)** | ✅ GA | Production scale, WAF integration, external load balancing |
| **Managed NGINX Ingress** (App Routing) | ⚠️ Security patches only until Nov 2026 | Migrate to Gateway API — Ingress-NGINX maintenance ends Mar 2026 |

> ⚠️ **Migration required:** If using managed NGINX Ingress, migrate to App Routing Gateway API before November 2026. `az aks approuting update --nginx Disabled` and switch HTTPRoute resources.

> ⚠️ App Routing uses an **Istio-based (Envoy) gateway**. This gateway must be **disabled before enabling the full Istio mesh add-on** in Challenge 09: `az aks update --disable-app-routing-istio`.

📖 **Resources:** [App Routing Gateway API](https://learn.microsoft.com/azure/aks/app-routing-gateway-api) · [AGC overview](https://learn.microsoft.com/azure/application-gateway/for-containers/overview)

---

# AKS Networking Deep Dive · Load Balancing & Ingress

## Concepts: Service exposure modes, L4 vs L7 ingress stacks, platform choice

### Service exposure in AKS
- **ClusterIP:** internal-only service discovery (pod-to-pod inside cluster)
- **NodePort:** exposes a static port on every node (usually a building block, not the final edge)
- **LoadBalancer (Azure Standard LB, L4):** allocates public/private frontend IP and maps to Service backends
- **Internal LB:** keep traffic private with  
  `service.beta.kubernetes.io/azure-load-balancer-internal: "true"`

### AKS ingress / load balancing options

| Option | Layer | Status | WAF support | TLS termination | Best for |
|---|---|---|---|---|---|
| **Azure Load Balancer (Service type LoadBalancer)** | L4 | ✅ GA (Standard) | ❌ | App/pod or sidecar handles TLS | Simple TCP/UDP exposure, private/public service VIPs |
| **AGIC (Application Gateway Ingress Controller)** | L7 | ⚠️ Legacy / migration target to AGC | ✅ (AppGW WAF_v2) | ✅ at App Gateway | Existing App Gateway + Ingress estates |
| **AGC (Application Gateway for Containers)** | L7 | ✅ GA | ✅ (WAF policies) | ✅ + end-to-end TLS/mTLS patterns | High-scale app delivery, modern Gateway API/Ingress |
| **App Routing (Gateway API, Istio-based)** | L7 | ✅ GA (recommended AKS path) | ➖ Use external WAF/edge if required | ✅ (Gateway listeners + Key Vault integration) | Managed Kubernetes-native ingress with Gateway API |

> **Reality check:** AKS Standard Load Balancer is default for `Service.type=LoadBalancer`. Basic LB support ended in AKS (retired).

---

# AKS Networking Deep Dive · Load Balancing & Ingress

## Concepts: App Routing operations, DNS/TLS automation, multi-cluster patterns

### App Routing add-on (what AKS manages)
- Deploys/operates ingress control plane (managed NGINX legacy path or Gateway API path)
- For Gateway API mode, uses `GatewayClass` + `Gateway` + `HTTPRoute` (and `GRPCRoute`) flow
- Managed NGINX path is in retirement timeline; migrate to Gateway API before Nov 2026 support end

### External DNS + cert automation
- App Routing can manage DNS records in **Azure DNS** via managed `external-dns`
- Use `az aks approuting zone add --attach-zones` to grant DNS record management
- With Gateway API DNS/TLS integration, operator can sync Key Vault certs and wire `certificateRefs`
- `TLSRoute` SNI passthrough support is still limited on AKS App Routing Gateway API today

### Key commands (by approach)
```bash
# Azure Standard LB (public)
kubectl expose deploy web --type LoadBalancer --port 80 --target-port 8080

# Internal LB (private VIP)
kubectl annotate svc web service.beta.kubernetes.io/azure-load-balancer-internal="true" --overwrite

# AGIC (legacy add-on path)
az aks enable-addons -g <rg> -n <cluster> --addons ingress-appgw --appgw-id <appgw-resource-id>

# AGC (new, GA) on AKS
az aks update -g <rg> -n <cluster> --enable-gateway-api --enable-application-load-balancer

# App Routing + Gateway API
az aks approuting enable -g <rg> -n <cluster>
az aks approuting gateway istio enable -g <rg> -n <cluster>
az aks approuting zone add -g <rg> -n <cluster> --ids <dns-zone-id> --attach-zones
```

### Multi-cluster ingress options
- **Global DNS steering:** Azure Traffic Manager / Azure Front Door → per-cluster ingress endpoints
- **Per-cluster AGC/App Routing gateways:** common pattern for regional active-active
- **Single AGC can serve multi-site/multi-tenant within a cluster**; cross-cluster still typically uses global DNS/edge orchestration

📖 **Resources:** [AKS Standard LB](https://learn.microsoft.com/azure/aks/load-balancer-standard) · [AKS Internal LB](https://learn.microsoft.com/azure/aks/internal-lb) · [App Routing (NGINX)](https://learn.microsoft.com/azure/aks/app-routing) · [App Routing Gateway API](https://learn.microsoft.com/azure/aks/app-routing-gateway-api) · [App Routing DNS/TLS](https://learn.microsoft.com/azure/aks/app-routing-gateway-api-dns-tls) · [AGC overview](https://learn.microsoft.com/azure/application-gateway/for-containers/overview) · [AGIC→AGC migration](https://learn.microsoft.com/azure/application-gateway/for-containers/migrate-from-agic-to-agc)

---

# Challenge 04 (1 of 2) · Workload Identity — No Passwords in Pods

## Concepts: Managed Identity, OIDC federation, federated credentials · ⏱ 60 min total

### The “secret zero” problem
- To call Azure Key Vault, Storage, or a database, an app needs credentials
- Storing credentials in the pod spec or environment variables = credentials that expire, rotate, leak, and accumulate

### What Workload Identity provides
- A **Managed Identity (MI)** is an Entra ID identity with **no password** — Azure manages the key material
- The pod's `ServiceAccount` receives a short-lived **JWT token** signed by the cluster's OIDC issuer
- That token is exchanged for an Entra ID **access token** — the app uses this to call Azure services
- No password is ever stored anywhere in the cluster

### The full trust chain
```
AKS cluster (OIDC issuer)
    │  signs a JWT and mounts it into the pod
    ↓
Entra ID
    │  validates the JWT against the registered Federated Credential
    │  issues a short-lived Azure access token
    ↓
Azure Key Vault / Storage / SQL  ←  app authenticates with that token
```

### Setup (all GA — no preview flags needed)
```bash
# 1. Enable on cluster (idempotent — safe to run on existing cluster)
az aks update -g <rg> -n <cluster> \
  --enable-oidc-issuer --enable-workload-identity

# 2. Create User-Assigned Managed Identity + federated credential
OIDC=$(az aks show -g <rg> -n <cluster> --query oidcIssuerProfile.issuerUrl -o tsv)
az identity federated-credential create \
  --identity-name <mi> -g <rg> \
  --issuer "$OIDC" \
  --subject "system:serviceaccount:<namespace>:<serviceaccount>"

# 3. Annotate the ServiceAccount
kubectl annotate sa <serviceaccount> \
  azure.workload.identity/client-id=<mi-client-id>
```

> **Two required annotations:** `ServiceAccount` must have `azure.workload.identity/client-id: <MI-client-id>`, and every pod template must have label `azure.workload.identity/use: "true"`. Missing either = silent auth failure.

📖 **Resources:** [Workload Identity on AKS](https://learn.microsoft.com/azure/aks/workload-identity-overview)

---

# Challenge 04 (2 of 2) · Key Vault & the CSI Secrets Store Driver

## Concepts: Azure Key Vault, SecretProviderClass, volume-based secret mounting · (continued)

### Azure Key Vault
- A **hardened, audited secret store** for secrets, certificates, and encryption keys
- Every read/write is logged; access requires an explicit RBAC assignment (`Key Vault Secrets User`)
- Centrally managed rotation: update the secret in Key Vault once — all pods automatically get the new value

### Secrets Store CSI Driver
- A CSI driver that **mounts Key Vault secrets as files inside pods** — the secrets never touch etcd
- Configured via a `SecretProviderClass` resource in the pod's namespace
- Uses the pod's Workload Identity token to authenticate to Key Vault — no credentials to configure

```yaml
# SecretProviderClass (simplified)
spec:
  provider: azure
  parameters:
    keyvaultName: "my-vault"
    tenantId: "<tenant-id>"
    objects: |
      - objectName: db-connection-string
        objectType: secret
```

### Why this is better than `env:` or K8s Secrets
| | Environment Var | Kubernetes Secret | Key Vault + CSI |
|---|---|---|---|
| **In etcd?** | Via Secret | Yes | **No** |
| **Visible in pod spec?** | Yes | Encoded | **No** |
| **Auto-rotation?** | No | No | **Yes** |

> **`secretObjects` block** in `SecretProviderClass` syncs a copy to a Kubernetes Secret — useful for legacy apps that only read env vars. It is a convenience, not the canonical path.

> **Enable auto-rotation** so pods always see the latest secret value: `az aks enable-addons -a azure-keyvault-secrets-provider --enable-secret-rotation`. The CSI add-on polls Key Vault on a configurable interval (default: 2 min) and updates the mounted file — no pod restart needed.

📖 **Resources:** [Key Vault CSI driver on AKS](https://learn.microsoft.com/azure/aks/csi-secrets-store-driver) · [Secret auto-rotation](https://learn.microsoft.com/azure/aks/csi-secrets-store-configuration-options)

---

# Challenge 05 · Observability — Metrics, Logs & Dashboards

## Concepts: Prometheus, Grafana, Container Insights, Log Analytics, KQL · ⏱ 60 min

| Pillar | Azure tool | Answers |
|---|---|---|
| **Metrics** | Azure Managed Prometheus | "Is CPU high right now? How many pod restarts?" |
| **Logs** | Container Insights + Log Analytics | "What did that container print at 14:32?" |
| **Dashboards** | Azure Managed Grafana | "Show me the last 24 hours in one view" |

### How Managed Prometheus works
- An **Azure Monitor workspace** scrapes metrics from the cluster automatically
- Pre-built scrape configs cover: nodes, pods, kube-state-metrics, and the control plane
- No in-cluster PVC to manage — data lives in Azure Monitor
- Custom scrape targets via CRD-based `PodMonitor`/`ServiceMonitor` (`azmonitoring.coreos.com/v1`) or `ama-metrics-settings-configmap` v2

### KQL — Kusto Query Language
- Used to query the **Log Analytics workspace** where Container Insights sends logs
- Basic anatomy: `Table | where TimeGenerated > ago(1h) | project PodName, LogMessage | summarize count() by PodName`
- Key table: **`ContainerLogV2`** (not the deprecated `ContainerLog`)

### Grafana dashboards
- Pre-built dashboards under **Kubernetes / Compute Resources** cover cluster, namespace, and pod views
- Custom dashboards can query Managed Prometheus directly using PromQL

### OpenTelemetry — application-level telemetry
- **OTel SDK** (or auto-instrumentation) collects distributed traces and custom metrics from your app code
- Send via OTLP to the **Azure Monitor OpenTelemetry Distro** — traces appear in Application Insights; metrics flow to the same Azure Monitor Workspace
- Full observability stack:
```
App (OTel traces + metrics)  ─┐
Infra (Prometheus scrape)    ─┼─→  Azure Monitor Workspace  →  Grafana / KQL
Container logs (ContainerLogV2) ─┘
```

> **Metrics take a few minutes to appear** after Managed Prometheus is enabled. An initial pod restart on `ama-metrics-*` pods is normal during reconciliation. Use `kubectl get pods -n kube-system -l component=ama-metrics` to verify readiness.

📖 **Resources:** [Monitor AKS](https://learn.microsoft.com/azure/azure-monitor/containers/kubernetes-monitoring-enable) · [Azure Managed Grafana](https://learn.microsoft.com/azure/managed-grafana/overview)

---

# Challenge 06 (1 of 2) · Pod Autoscaling — HPA & VPA

## Concepts: Horizontal Pod Autoscaler, Vertical Pod Autoscaler, resource requests · ⏱ 60 min total

### Why resource requests are non-negotiable
```
resources:
  requests:
    cpu: "250m"    ← scheduler uses this to place the pod
  limits:
    cpu: "500m"    ← kernel enforces this at runtime
```
- Without `requests`: HPA reports `<unknown>` metrics; Karpenter can't right-size nodes; cost analysis is meaningless

### Horizontal Pod Autoscaler (HPA)
- Scales the **number of replicas** based on observed CPU or memory vs. the requested amount
- `targetCPUUtilizationPercentage: 70` means: "keep average CPU ≤ 70% of the requested value"
- Reads from the Kubernetes **Metrics Server** (CPU/memory) — or KEDA for external metrics

### Vertical Pod Autoscaler (VPA)
- Recommends (or enforces) **right-sized requests** per container based on historical usage
- Modes:
  - `Off` — recommendations only, nothing changes → **start here**
  - `Initial` — apply on pod creation only
  - `Auto` — continuously resize (triggers pod restarts)
- Use `Off` mode to discover actual usage before setting requests in your Helm values

> **Practical flow:** Deploy → enable VPA in `Off` mode → run load → `kubectl describe vpa` → copy recommendations into `values.yaml` → disable VPA → HPA now works correctly.

📖 **Resources:** [AKS scaling concepts](https://learn.microsoft.com/azure/aks/concepts-scale) · [VPA on AKS](https://learn.microsoft.com/azure/aks/vertical-pod-autoscaler)

---

# Challenge 06 (2 of 2) · Event-Driven Scaling & Node Autoprovisioning

## Concepts: KEDA, scale-to-zero, Karpenter / Node Auto Provisioning (NAP) · (continued)

### KEDA — Kubernetes Event-Driven Autoscaler
- Extends HPA to scale on **any external metric source**: Service Bus queue depth, Kafka lag, HTTP req/s, cron schedule, Prometheus query — not just CPU
- Enables **scale-to-zero**: when the queue is empty, replica count drops to 0 — pods (and eventually nodes) disappear entirely
- `ScaledObject` defines the trigger; `TriggerAuthentication` holds credentials (via Workload Identity)
- Current stable release: **KEDA 2.16+** (AKS add-on tracks latest supported version)

### KEDA authentication patterns

| Method | Recommended for | Notes |
|---|---|---|
| **Workload Identity** (`azure-workload`) | All production Azure scalers | No secrets; uses pod's federated token |
| `TriggerAuthentication` + K8s Secret | Non-Azure or legacy | Secret must be rotated manually |
| Inline secret ref | Dev/testing only | Never in production |

```yaml
# TriggerAuthentication using Workload Identity (recommended)
apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
spec:
  podIdentity:
    provider: azure-workload
    identityId: <managed-identity-client-id>
```

**Azure-native scalers:** Service Bus queue depth · Event Hub consumer lag · Azure Monitor metric value · Storage Queue length

### Node Auto Provisioning (NAP) / Karpenter
- When no existing node can fit a pending pod, Karpenter **provisions the exact right VM SKU** in ~60 seconds
- Reads the pod's `nodeSelector`, `affinity`, and resource requests to choose the optimal node
- **Consolidation:** periodically checks for underutilised nodes and terminates them to reduce cost

### When to use each scaler

| Scaler | Signal | Use case |
|---|---|---|
| **HPA** | CPU / memory | Web servers, CPU-bound APIs |
| **KEDA** | Queue depth / events | Workers, batch jobs, async consumers |
| **Karpenter/NAP** | Pending pods | Node-level capacity management |
| **VPA** | Historical usage | Right-sizing resource requests |

> **Scale-to-zero is the most impressive demo moment:** clear the Service Bus queue → watch all pods disappear → send messages → pods and nodes spin up within ~30 seconds.

📖 **Resources:** [KEDA on AKS](https://learn.microsoft.com/azure/aks/keda-about) · [Node Auto Provisioning](https://learn.microsoft.com/azure/aks/node-auto-provisioning)

---

# Challenge 07 · GitOps with Flux v2

## Concepts: Git as source of truth, reconciliation loop, drift detection, HelmRelease · ⏱ 60 min

### What is GitOps?
- **Git is the single source of truth** for the desired state of the cluster — no ad-hoc `kubectl apply` in production
- A GitOps controller continuously **reconciles** what is in Git into the cluster, automatically
- Benefits: audit trail (git log), peer review (pull requests), rollback (git revert), self-healing

### How Flux v2 works
```
GitHub repository
       │  Flux Source Controller polls for changes (every N minutes)
       ↓
Kustomization Controller  ─── applies raw Kubernetes manifests
HelmRelease Controller    ─── runs helm upgrade / rollback on chart changes
```
- **Reconciliation interval:** how often Flux polls Git (default: 10 minutes)
- Force immediate sync: `flux reconcile source git <name>`

### Drift detection and self-healing
- If someone manually deletes a resource (`kubectl delete deploy fabtech-api`), Flux detects the drift and **restores it within one reconciliation cycle**
- The cluster always converges back to the desired state in Git — unreviewed changes don't survive

### HelmRelease CRD
- Declare chart name, version, and values in a YAML file in Git — Flux handles the actual `helm upgrade`
- Current stable API versions: `helm.toolkit.fluxcd.io/**v2**` · `kustomize.toolkit.fluxcd.io/**v1**` · `source.toolkit.fluxcd.io/**v1**`
- ⚠️ `v2beta*` and `v1beta*` APIs are **removed** in `microsoft.flux` extension ≥ 1.23 — update any manifests using old versions before upgrading

> **Cross-namespace restriction:** `HelmRelease` must live in the same namespace as its `GitRepository`, or use `spec.targetNamespace` explicitly. This is the most common config error.

> **API migration check:** Before upgrading the Flux extension, run: `flux check --pre` and scan your manifests for deprecated `v2beta1`/`v1beta2` API versions. The extension supports N-2 Flux versions — stay current.

📖 **Resources:** [GitOps Flux tutorial](https://learn.microsoft.com/azure/azure-arc/kubernetes/tutorial-use-gitops-flux2)

---

# Challenge 08 (1 of 2) · RBAC & Admission Control

## Concepts: Kubernetes RBAC, Azure RBAC for AKS, OPA Gatekeeper, Azure Policy add-on · ⏱ 60 min total

### Kubernetes RBAC — who can do what
- **Role / ClusterRole:** a named set of allowed verbs on API resources (`get`, `list`, `create`, `delete`, `watch`)
- **RoleBinding / ClusterRoleBinding:** assigns a Role to a subject (user, group, ServiceAccount)
- With **AKS Azure RBAC mode**, subjects are Entra ID users and groups — no local kubeconfig credentials

### The request pipeline
```
kubectl apply ...
  1. AuthN  — Who are you?      ← Entra ID token (via kubelogin)
  2. AuthZ  — Are you allowed?  ← RBAC (Role + RoleBinding)
  3. Admission — Is this valid? ← OPA Gatekeeper / Azure Policy
  4. Persist to etcd
```

### Admission Control — what can be deployed
- **OPA Gatekeeper** intercepts every API write request _before_ it is stored
- Azure Policy add-on installs Gatekeeper and syncs built-in and custom policies as `ConstraintTemplates`
- Example enforcement: deny privileged containers, require images from `myacr.azurecr.io` only, require CPU limits
- **CEL-based ValidatingAdmissionPolicy (VAP):** built into Kubernetes 1.30+ — lightweight policy without Gatekeeper overhead; Azure Policy add-on can generate VAP rules alongside Gatekeeper ConstraintTemplates
- **Kyverno** is a popular self-managed alternative (not managed by Azure Policy) — uses familiar YAML policies instead of Rego

### Built-in AKS Azure RBAC roles

| Role | Scope |
|---|---|
| Azure Kubernetes Service Cluster Admin Role | Full cluster access |
| Azure Kubernetes Service Cluster User Role | Read kubeconfig only |
| Custom Role (namespace-scoped) | Developer read-only |

> **Azure Policy sync delay:** new assignments take **15–20 minutes** to propagate to Gatekeeper (the add-on polls on a ~15-minute cycle). Apply policies early and verify with a deliberate policy violation. CEL-based VAP rules take effect immediately after admission.

📖 **Resources:** [Azure RBAC for AKS](https://learn.microsoft.com/azure/aks/manage-azure-rbac) · [Azure Policy for K8s](https://learn.microsoft.com/azure/governance/policy/concepts/policy-for-kubernetes)

---

# Challenge 08 (2 of 2) · Network Policy & Runtime Security

## Concepts: Kubernetes NetworkPolicy, Cilium eBPF, Microsoft Defender for Containers · (continued)

### The default problem: all pods can reach all pods
- In a default Kubernetes cluster, every pod in every namespace can connect to every other pod
- A single compromised container can enumerate and attack the entire cluster network

### Kubernetes NetworkPolicy
- A `NetworkPolicy` selects pods and defines explicit allow rules — **everything else is denied**
- The pattern: one `NetworkPolicy` with no `ingress` rules = **default deny all inbound**; then add explicit allow policies

```
external traffic
    → Gateway pod    (lives in fabtech namespace — must be explicitly allowed)
    → Web pods       (allowed by: podSelector → gateway)
    → API pods       (allowed by: podSelector → web)
    → DB pods        (allowed by: podSelector → api)
```
⚠️ The App Routing Istio gateway pod runs **inside the `fabtech` namespace** (not in `app-routing-system`), so the default-deny rule blocks it too — add an explicit allow rule for external → gateway traffic on port 80 and 15021.

### Cilium — eBPF dataplane
- NetworkPolicy is enforced by the **CNI plugin**, not Kubernetes itself
- Cilium enforces policy at the **Linux kernel level** (eBPF) — faster than iptables, supports L7 rules
- L7 example: allow only `GET /api/sessions` from web pods to API pods
- **NPM (Azure Network Policy Manager) is deprecated**: Linux NPM is deprecated; migrate to Cilium. Windows NPM support ends **2026**
- **Advanced Container Networking Services (ACNS):** extends Cilium with FQDN-based egress policies (`*.database.windows.net`) and Hubble-powered network flow observability

### Microsoft Defender for Containers
- Agentless runtime threat detection — detects crypto mining, reverse shells, privilege escalation
- **Agentless container posture (2025):** image vulnerability scanning, Kubernetes security benchmarks, and attack-path analysis — no agents required on nodes
- **Node snapshot scanning:** malware detection via OS-level snapshots without DaemonSet agents
- Alerts surface in **Defender for Cloud** with attack-path context showing blast radius

> **Defence-in-depth stack:** RBAC controls who can _deploy_. NetworkPolicy controls what workloads can _reach_. Defender detects what they actually _do_ at runtime.

📖 **Resources:** [Network policies on AKS](https://learn.microsoft.com/azure/aks/use-network-policies) · [Defender for Containers](https://learn.microsoft.com/azure/defender-for-cloud/defender-for-containers-introduction)

---

# Challenge 09 · Istio Service Mesh

## Concepts: Sidecar pattern, Envoy proxy, mTLS, VirtualService, canary deployments · ⏱ 60 min

### Why a service mesh?
- In a microservices architecture, every inter-service call is a network call — and network calls fail, are slow, and are unencrypted by default
- A **service mesh** provides retries, timeouts, circuit breaking, encryption, and distributed tracing — **without changing application code**

### How Istio works — the sidecar pattern
- Istio injects an **Envoy proxy container** alongside every app container in mesh-enabled namespaces
- All inbound and outbound traffic flows through the sidecar — the application is unaware
- **istiod** (control plane) pushes routing config and certificates to all sidecars in real time
- **Native sidecar mode** (default on AKS 1.33+ with asm-1-29+): sidecars are injected as Kubernetes native init containers — survive pod lifecycle events more cleanly than classic sidecar injection

### mTLS — mutual TLS between services
- Each sidecar gets a short-lived **x.509 certificate** from istiod's built-in CA
- Services authenticate **each other** (mutual) — not just the server proving its identity
- `STRICT` PeerAuthentication mode: only mesh-to-mesh traffic is accepted; non-sidecar pods are blocked

### Traffic management primitives
- **`VirtualService`:** routing rules — send 80% of traffic to `v1` pods, 20% to `v2` (canary split — matches solution guide)
- **`DestinationRule`:** subset definitions (v1 / v2 label selectors), load balancing policy, outlier detection

### Mesh deployment modes on AKS

| Mode | Status | Description |
|---|---|---|
| **Managed Istio add-on** (sidecar) | ✅ GA | `az aks mesh enable` — classic Envoy sidecar injection |
| **Native sidecar** (asm-1-29+) | ✅ GA on AKS 1.33+ | Sidecars as native init containers — cleaner lifecycle |
| **Ambient mesh** (sidecarless) | 🔬 Preview | Azure Kubernetes Application Network — no per-pod sidecars |

> **AKS managed Istio** is installed as an add-on (`az aks mesh enable`) — no Helm required. It **cannot coexist with the App Routing Istio gateway** — disable first: `az aks approuting update --nginx Disabled`. **Ambient mesh (sidecarless)** is available in preview via Azure Kubernetes Application Network (`az aks approuting enable --gateway`) — not for production use yet.

📖 **Resources:** [Istio add-on for AKS](https://learn.microsoft.com/azure/aks/istio-about) · [Deploy Istio add-on](https://learn.microsoft.com/azure/aks/istio-deploy-addon)

---

# Challenge 10 · Kubernetes Persistent Storage

## Concepts: PVC/PV lifecycle, CSI drivers, Azure Disk vs Azure Files, StatefulSet, Azure Container Storage · ⏱ 45 min

### Ephemeral vs persistent storage
- A container's filesystem is **ephemeral** — all writes are lost when the pod is deleted or rescheduled
- A **PersistentVolume (PV)** is a piece of storage provisioned in Azure; a **PersistentVolumeClaim (PVC)** is a pod's request for a PV
- **CSI (Container Storage Interface) drivers** provision and attach Azure storage to pods automatically when a PVC is created

### Azure Disk vs Azure Files

| | Azure Disk | Azure Files |
|---|---|---|
| **Access mode** | ReadWriteOnce (RWO) | ReadWriteMany (RWX) |
| **Protocol** | Block device | SMB / NFS share |
| **Multi-pod access** | No — one node at a time | Yes — all pods simultaneously |
| **Best for** | Databases, write-heavy | Shared config, media, logs |

### Storage class recommendations (2025)

| Workload | Recommended storage class | Notes |
|---|---|---|
| High-performance DB | `managed-csi-premium-v2` | Premium SSD v2 — lower latency, online resize |
| Cross-zone HA | `managed-csi-premium-zrs` | Zone Redundant Storage — survives AZ failure |
| Shared config / media | `azurefile-csi-premium` | NFS preferred over SMB for Linux workloads |
| AI model weights / training | **Azure Container Storage** | High-throughput volume pooling for GPU nodes |

### Azure Container Storage (ACS)
- A managed volume orchestration layer that pools underlying Azure storage for Kubernetes
- Enables **fast volume attach/detach** for stateful workloads that move between nodes (e.g., AI inference pods)
- Install: `az aks create/update --enable-azure-container-storage azureDisk`

### StatefulSet vs Deployment for stateful workloads
- `Deployment` with a single PVC: all replicas share one volume — only safe with RWX
- **`StatefulSet`** with `volumeClaimTemplates`: one dedicated PVC _per replica_, with stable pod names (`pod-0`, `pod-1`) — correct for databases

> **Pod stuck in Pending?** Check `kubectl describe pvc <name>` — common causes: storage class not found, availability zone mismatch between the PVC and the node, or wrong access mode for the storage class.

📖 **Resources:** [AKS storage concepts](https://learn.microsoft.com/azure/aks/concepts-storage) · [Azure Disk CSI](https://learn.microsoft.com/azure/aks/azure-disk-csi)

---

# Challenge 11 · Private Networking on AKS

## Concepts: Private API server, egress control, Private Endpoints, Private DNS · ⏱ 60 min

### The default public surface area
- A standard AKS cluster has a **public API server endpoint** — anyone on the internet can attempt to authenticate
- Outbound traffic from nodes uses a **public Load Balancer** with a shared public IP — uncontrolled and unaudited

### Private AKS cluster
- `--enable-private-cluster` moves the API server endpoint **inside your VNet** — no public DNS, no public IP
- Cluster management from outside the VNet uses **`az aks command invoke`** — runs `kubectl` commands through the Azure control plane, no VPN or jumpbox needed
- ⚠️ Cannot convert an existing public cluster to private — must be configured at creation time
- **API Server VNet Integration (GA, recommended for new deployments):** places the API server directly in a **delegated subnet** in your VNet — no Private Link Service required, simpler NSG rules, lower latency
- Enable at creation: `az aks create --enable-apiserver-vnet-integration --apiserver-subnet-id <subnet-id>`

### Egress control options

| Option | How | Best for |
|---|---|---|
| **NAT Gateway** | Stable outbound IP, simple config | Most workloads |
| **Azure Firewall** | FQDN-based L7 rules, centralised policy | Regulated environments |

### Private Endpoint for ACR
- A **Private Endpoint** allocates a private IP for ACR inside your VNet
- Image pulls never traverse the public internet — traffic stays on the Azure backbone
- Requires a **Private DNS Zone** (`privatelink.azurecr.io`) so the registry hostname resolves to the private IP

> **ACR has two private IPs** — one for the registry frontend, one for the data plane. Both need DNS A records or `docker pull` will fail with a connection error.

> **API Server VNet Integration vs classic private cluster:** VNet Integration is the recommended approach for new deployments — it avoids Private Link Service complexity and places the API server NIC directly in your network. Classic `--enable-private-cluster` remains supported for existing deployments.

📖 **Resources:** [Private AKS cluster](https://learn.microsoft.com/azure/aks/private-cluster) · [ACR private endpoints](https://learn.microsoft.com/azure/container-registry/container-registry-private-link)

---

# AKS Networking Deep Dive · Egress Control & DNS

## Concepts: Outbound types, Hub-Spoke topology, Azure Firewall, CoreDNS customization

### AKS Outbound/Egress Options

| Outbound Type          | How it works                                                 | SNAT IP Stability        | Cost               | Best for                                |
|------------------------|--------------------------------------------------------------|--------------------------|--------------------|-----------------------------------------|
| **Load Balancer** (default) | Nodes use Azure Standard LB public IP for SNAT               | Dynamic or Static Public | Included with LB   | Default, simple egress, small workloads |
| **NAT Gateway**        | Dedicated managed NAT Gateway attached to node subnets       | Dedicated, Stable IP(s)  | $$$ per GB + base  | High scale, managing SNAT exhaustion    |
| **UserDefinedRouting** | Forces egress traffic to an NVA (e.g., Azure Firewall)       | Managed by NVA           | NVA/Firewall cost  | Strict security, custom routing rules   |

### Hub-Spoke Topology with UserDefinedRouting

```text
    [ Internet ]
         ^
         | Egress traffic
    +----|-----------------+
    | Azure Firewall       |
    | (Hub VNet)           |
    +----^-----------------+
         | VNet Peering
    +----|-----------------+
    | AKS Cluster          |
    | (Spoke VNet)         |
    | OutboundType: UDR    |
    +----------------------+
```

### Essential Azure Firewall Rules for AKS

When using `outboundType: userDefinedRouting`, AKS requires specific allowed destinations:
- **FQDN / App Rules**: `*.azurecr.io`, `*.data.mcr.microsoft.com` (for image pulls), `management.azure.com` (for Azure API), `*.ubuntu.com` (for OS updates)
- **Network Rules**: UDP/TCP `53` to DNS resolvers, TCP `123` for NTP (Time sync)

---

# AKS Networking Deep Dive · CoreDNS Customization

## Concepts: Conditional forwarding, custom domains, hybrid DNS

### CoreDNS Customization

By default, CoreDNS uses the VNet's DNS server (usually Azure-provided `168.63.129.16`) to resolve external queries.

You can customize this to conditionally forward specific domains to private DNS resolvers (e.g., an on-premises datacenter over ExpressRoute/VPN, or custom DNS in a hub VNet).

**Steps to customize CoreDNS in AKS**:
1. Edit the `coredns-custom` ConfigMap in the `kube-system` namespace.
2. Add a server block for your specific domain and set the forwarder.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: coredns-custom
  namespace: kube-system
data:
  corp.server: |
    corp.local:53 {
        forward . 10.0.0.4
    }
```
*CoreDNS automatically reloads the configuration within a few minutes.*

📖 **Resources:** [Egress outbound type](https://learn.microsoft.com/azure/aks/egress-outboundtype) · [NAT Gateway with AKS](https://learn.microsoft.com/azure/aks/nat-gateway) · [Customize CoreDNS](https://learn.microsoft.com/azure/aks/coredns-custom)

---

# Challenge 12 · AKS Fleet Manager — Multi-Cluster Orchestration

## Concepts: Fleet hub, ClusterResourcePlacement, staged rollouts, UpdateRun · ⏱ 45 min

### Why multi-cluster?
- A single cluster is a single blast radius: a bad rollout, a misapplied policy, or a regional outage affects everything
- Organisations use multiple clusters for: **environment isolation**, **regional availability**, **compliance boundaries**, **team autonomy**
- Managing N clusters individually = N times the operational effort and N independent drift risks
- Fleet Manager supports **Azure Arc-enabled Kubernetes** members — hybrid and multi-cloud clusters join the fleet alongside AKS clusters

### Fleet Manager — hub-and-spoke model
- **Fleet hub:** a lightweight management plane (not a full AKS cluster) that aggregates member clusters
- **Member clusters:** your real AKS clusters, joined to the Fleet via `az fleet member create`
- Operations applied to the hub propagate to members — one control point for many clusters

### ClusterResourcePlacement — declarative workload propagation
- Declare _what_ to deploy (namespace, deployment, configmap...) and _where_ (label selectors)
- Fleet reconciles member clusters to the desired state — no per-cluster `kubectl apply`
- **Placement policies:** `PickAll` (broadcast to all members) · `PickN` (exactly N clusters, with label affinity) · `PickFixed` (specific named clusters)
- **Eviction policies** and rollout strategies mirror Kubernetes Deployment semantics — canary, surge, and maxUnavailable are all configurable

### Staged rollouts with UpdateRun
- Define **update groups** (e.g., `canary`, `production`) — groups upgrade sequentially
- `UpdateRun` runs Kubernetes version upgrades across the fleet in order, waiting for health validation between groups

> **All ClusterResourcePlacement resources are applied against the Fleet hub kubeconfig** — not against individual member cluster kubeconfigs. This is the most common first-time mistake.

📖 **Resources:** [Fleet Manager overview](https://learn.microsoft.com/azure/kubernetes-fleet/overview) · [Resource placement](https://learn.microsoft.com/azure/kubernetes-fleet/concepts-resource-placement) · [ClusterResourcePlacement API](https://learn.microsoft.com/azure/kubernetes-fleet/concepts-resource-placement)

---

# Challenge 13 · FinOps — Cost Visibility & Optimisation

## Concepts: AKS Cost Analysis, spot node pools, resource requests, Azure Advisor · ⏱ 45 min

### Where AKS cost comes from
- **Node VMs:** by far the largest cost — the right SKU and right-sizing have the most impact
- **Managed disks:** PVCs backed by Azure Disk or Files add up with many StatefulSets
- **Load balancers, egress, ACR bandwidth:** smaller but real, especially in multi-region setups
- **AKS Cost Analysis add-on (GA)** breaks costs down by **namespace, workload, and team** — requires AKS Standard tier; powered by **OpenCost** for granular pod-level allocation
- View in **Azure Cost Management** directly — costs are tagged by Kubernetes namespace, controller, and label

### Spot node pools — cheapest compute with a trade-off
- Spot VMs use **spare Azure data centre capacity** — up to 90% discount vs. regular pricing
- Azure may **evict** a spot VM with 30 seconds notice when capacity is reclaimed
- AKS automatically taints spot nodes: `kubernetes.azure.com/scalesetpriority=spot:NoSchedule`
- Workloads must use the matching toleration and handle eviction gracefully via `PodDisruptionBudget` + `terminationGracePeriodSeconds`

### Why resource requests drive both scheduling and cost
- The scheduler packs pods onto nodes based on **requests** — not actual usage, not limits
- Oversized requests = pods that use 20% but claim 100% → stranded node capacity → wasted money
- VPA recommendations (Challenge 06) provide data-driven request values to right-size before enabling spot nodes

> **Azure Advisor** surfaces specific rightsizing recommendations for underutilised VMs, with estimated monthly savings per resource. Check it before deciding on node SKUs.

📖 **Resources:** [AKS cost analysis](https://learn.microsoft.com/azure/aks/cost-analysis) · [Spot node pools](https://learn.microsoft.com/azure/aks/spot-node-pool)

---

<!-- _class: divider -->

# AI Track
## Challenges AI-01 & AI-02

Running open-source LLMs on Kubernetes with GPU acceleration

---

# Challenge AI-01 · GPU Workloads on Kubernetes

## Concepts: GPU device plugin, GPU Operator, resource scheduling, GPU node pools, MIG, time-slicing · ⏱ 60 min

### How Kubernetes sees GPUs
- GPUs are **not a built-in Kubernetes resource** — they are exposed via a Device Plugin
- The **NVIDIA device plugin** (automatically installed by AKS on GPU node pools) advertises `nvidia.com/gpu` as a schedulable, countable resource
- Pods request GPUs exactly like CPU or memory:

```yaml
resources:
  requests:
    nvidia.com/gpu: 1
  limits:
    nvidia.com/gpu: 1
```

### GPU node pool essentials
- GPU nodes carry a **NoSchedule taint** by default — only pods with the matching toleration are placed on them, keeping GPU nodes intentional and cost-controlled
- **T4 (Standard_NC4as_T4_v3):** 16 GB VRAM, cost-effective for inference of models up to ~7B parameters
- AKS supports T4, A100, H100 families — choose based on model size and latency requirements

### GPU time-slicing
- By default: one pod gets exclusive access to one GPU
- **Time-slicing** lets multiple pods share one GPU — increases utilisation, reduces throughput per pod
- Configured via NVIDIA device plugin `ConfigMap` — useful when running many small inference jobs

### NVIDIA GPU Operator (recommended)
- Automates installation of GPU drivers, container toolkit, device plugin, and MIG configuration
- Required for advanced GPUs (A100, H100) and production workloads
- Install via Helm: managed through AKS node pool configuration or self-deployed

### Multi-Instance GPU (MIG) — hardware-level partitioning
- Available on A100 and H100 GPUs: **splits one physical GPU into isolated instances** (up to 7 on A100)
- Each MIG instance gets dedicated memory + compute — stronger isolation than time-slicing
- Use MIG for inference serving where isolation matters; use time-slicing for development/batch

### Modern GPU families on AKS

| Family | Model | VRAM | Best for |
|---|---|---|---|
| NCasT4_v3 | T4 | 16 GB | Inference ≤ 7B params, cost-effective |
| NCads_A100_v4 | A100 | 80 GB | Large models (13B–70B), training |
| ND_H100_v5 | H100 | 80 GB | Frontier LLMs, distributed training |

> **GPU quota takes 24–48 hours to approve** in most regions. Request quota before the hackathon starts. The GPU family name in the Azure Portal differs from the CLI name — use `az vm list-skus` to find the exact quota string.

📖 **Resources:** [GPU workloads on AKS](https://learn.microsoft.com/azure/aks/gpu-cluster)

---

# Challenge AI-02 · KAITO — Kubernetes AI Toolchain Operator

## Concepts: KAITO operator, Workspace CRD, model lifecycle, inference endpoint · ⏱ 60 min

### The LLM deployment problem (without KAITO)
Deploying an open-source LLM manually requires:
1. Find a compatible GPU node SKU for the model size
2. Provision and configure the GPU node pool
3. Create a PVC and download model weights (~4–70 GB)
4. Choose and configure a serving framework (vLLM, TGI, llama.cpp...)
5. Write Deployment + Service + health probes
6. Handle restarts, model re-downloads, and GPU reattachment

### What KAITO provides
- KAITO is a **Kubernetes operator** that automates the entire lifecycle above for supported models
- One `Workspace` CRD declaration is all that is needed:

```yaml
apiVersion: kaito.sh/v1alpha1   # transitioning to v1 for GA
kind: Workspace
metadata:
  name: workspace-phi-4
  namespace: kaito-workspace
spec:
  resource:
    instanceType: "Standard_NC4as_T4_v3"
    count: 1
  inference:
    preset:
      name: phi-4               # 8B model, fits T4 16 GB VRAM
```

### Model readiness states
- `ResourceProvisioned=True` → GPU node is up and joined the cluster
- `Ready=True` → model weights are loaded into VRAM; endpoint is accepting requests
- Inference endpoint: **OpenAI-compatible `POST /v1/chat/completions`** — works with any OpenAI SDK client

### Supported models (2025)
- **Phi family:** `phi-3-mini-4k-instruct`, `phi-3-medium-128k-instruct`, **`phi-4`** (8B, recommended for T4)
- **Llama family:** `llama-3-8b-instruct`, `llama-3.1-8b-instruct`, `llama-3.1-70b-instruct` (multi-GPU)
- **Mistral:** `mistral-7b-instruct`
- All models served via **vLLM** for high-throughput paged attention — significantly faster than naive inference

> **Deleting the `Workspace` resource releases the KAITO-managed GPU nodes automatically.** Always delete the Workspace after demos — GPU nodes left running overnight add up quickly.

📖 **Resources:** [KAITO on AKS — AI toolchain operator](https://learn.microsoft.com/azure/aks/ai-toolchain-operator) · [KAITO supported models](https://github.com/kaito-project/kaito/tree/main/presets)

---

# Challenge AI-03 (Optional) · AI Foundry on AKS

## Concepts: AKS as AI compute substrate, Model Context Protocol, agent integration · ⏱ 45 min

### AKS as the enterprise AI compute platform
- **Azure AI Foundry** uses AKS as the underlying compute for hosting and running AI agents and model deployments
- Custom model deployments, fine-tuning workloads, and RAG pipelines run as Kubernetes workloads
- Same AKS operational practices apply: Workload Identity, KEDA scaling, Cilium policies, Flux GitOps

### Model Context Protocol (MCP)
- An open standard that lets AI agents **securely call external tools and APIs** — similar to function calling but standardised
- AKS hosts MCP servers as standard Kubernetes Services, secured with Workload Identity and NetworkPolicy
- Agents built with AI Foundry SDK can discover and call MCP tools running in the cluster

### Storage for large-scale AI
- **Azure Managed Lustre:** high-throughput parallel filesystem for distributed training data — mounts as a PVC
- **Azure Container Storage:** fast attach/detach for model weights across GPU pods during inference scale-out
- Pattern: store training data on Lustre → train on H100 nodes → publish model to ACR → serve with KAITO

> **AI workloads amplify every earlier challenge:** they need the largest nodes (GPU, NAP), the most storage (Lustre/ACS), the tightest security (Workload Identity, NetworkPolicy), and the best observability (OTel traces, GPU metrics in Grafana).

📖 **Resources:** [AI Foundry on AKS](https://learn.microsoft.com/azure/ai-studio/how-to/deploy-models-managed-compute) · [Azure Managed Lustre](https://learn.microsoft.com/azure/azure-managed-lustre/amlfs-overview)
