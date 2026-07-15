# Coach Guide — Frontier AKS Hackathon

> **COACHES ONLY — Do not share with participants.**

This guide provides an index of all solution files, coaching philosophy, Azure
requirements, and a suggested agenda.

---

## Solution Index

| Challenge | Title | Solution File |
|-----------|-------|---------------|
| 00 | Prerequisites | [Solution-00.md](./Solutions/Solution-00.md) |
| 01 | Containers & ACR | [Solution-01.md](./Solutions/Solution-01.md) |
| 02 | AKS Cluster Deployment | [Solution-02.md](./Solutions/Solution-02.md) |
| 03 | App Deployment & Gateway API | [Solution-03.md](./Solutions/Solution-03.md) |
| 04 | Workload Identity & Secrets | [Solution-04.md](./Solutions/Solution-04.md) |
| 05 | Observability | [Solution-05.md](./Solutions/Solution-05.md) |
| 06 | Autoscaling | [Solution-06.md](./Solutions/Solution-06.md) |
| 07 | GitOps with Flux v2 | [Solution-07.md](./Solutions/Solution-07.md) |
| 08 | AKS Security Hardening | [Solution-08.md](./Solutions/Solution-08.md) |
| 09 | Storage | [Solution-09.md](./Solutions/Solution-09.md) |
| 10 | Enterprise Networking | [Solution-10.md](./Solutions/Solution-10.md) |
| 11 | AKS Fleet Manager | [Solution-11.md](./Solutions/Solution-11.md) |
| 12 | Service Mesh with AKS Istio | [Solution-12.md](./Solutions/Solution-12.md) |
| 13 | FinOps & Cost Management *(optional)* | [Solution-13.md](./Solutions/Solution-13.md) |
| AI-01 | AI on AKS Foundations *(optional)* | [Solution-AI-01.md](./Solutions/Solution-AI-01.md) |
| AI-02 | LLM Inference with KAITO *(optional)* | [Solution-AI-02.md](./Solutions/Solution-AI-02.md) |

---

## Azure Requirements

| Resource | Requirement |
|----------|-------------|
| **Role** | Owner on the subscription (required for `--attach-acr`, RBAC assignments) |
| **Region** | `swedencentral` recommended (best service availability) |
| **vCPU quota** | ~10 Standard D-series vCPUs per team (Standard_D2s_v3 × 5 nodes minimum) |
| **GPU quota** *(AI track)* | `Standard_NC4as_T4_v3` — must request 24–48 hours in advance |
| **Resource providers** | `Microsoft.ContainerService`, `Microsoft.Monitor`, `Microsoft.Dashboard`, `Microsoft.KubernetesConfiguration`, `Microsoft.ContainerRegistry` |

Resource providers to pre-register:
```bash
for ns in Microsoft.ContainerService Microsoft.Monitor Microsoft.Dashboard \
           Microsoft.KubernetesConfiguration Microsoft.ContainerRegistry; do
  az provider register --namespace $ns
done
```

---

## Suggested Agenda

> Times below include **15 min of coach intro/guidance** per challenge on top of the hands-on estimate. Total core track (Ch 00–12): **~16.5 h**. Full event incl. optional challenges: **~23.5 h**.

### Full 3-Day Event (Recommended)

| Day | Block | Challenges | Est. Time | Focus |
|-----|-------|-----------|-----------|-------|
| Day 1 | AM (3 h) | Ch 00–02 | 45 + 60 + 75 min | Toolchain, Containers & ACR, AKS Cluster |
| Day 1 | PM (3 h) | Ch 03–04 | 90 + 90 min | App Deployment & Gateway API, Workload Identity |
| Day 2 | AM (4.25 h) | Ch 05–07 | 75 + 90 + 90 min | Observability, Autoscaling, GitOps |
| Day 2 | PM (3 h) | Ch 08–09 | 90 + 90 min | Security Hardening, Service Mesh (Istio) |
| Day 3 | AM (3 h) | Ch 10–11 | 75 + 105 min | Storage, Enterprise Networking |
| Day 3 | PM (2.75 h) | Ch 12–13 | 90 + 75 min | Fleet Manager, FinOps *(optional)* |
| Day 3 | PM (3.25 h, optional) | AI-01–02 | 105 + 90 min | GPU Foundations, LLM Inference with KAITO |

> **Tip:** Ch 11 (Enterprise Networking) is the longest single challenge at 105 min — front-load it in Day 3 AM when energy is highest. Teams finishing Day 2 PM early can start Ch 10.

### Focused 2-Day Event

| Day | Block | Challenges | Est. Time | Focus |
|-----|-------|-----------|-----------|-------|
| Day 1 | AM (4.5 h) | Ch 00–03 | 45 + 60 + 75 + 90 min | Setup, Containers, Cluster, App Deploy |
| Day 1 | PM (4.25 h) | Ch 04–06 | 90 + 75 + 90 min | Identity & Secrets, Observability, Autoscaling |
| Day 2 | AM (4.5 h) | Ch 07–09 | 90 + 90 + 90 min | GitOps, Security, Service Mesh |
| Day 2 | PM (4.5 h) | Ch 10–12 | 75 + 105 + 90 min | Storage, Networking, Fleet |
| Day 2 | PM (optional) | Ch 13, AI-01 | 75 + 105 min | FinOps, GPU — for teams finishing early |

> **Note:** The 2-day format is very full (~9 h/day). Skip Ch 13 and AI track unless all teams are on pace.

### Focused 1-Day Event

Challenges 00–08 cover the core AKS lifecycle (~11 h with coach intros). Challenges 09–12 are recommended for teams with strong Kubernetes experience. The AI track and Ch 13 are strictly optional.

---

## Coaching Philosophy

1. **Don't give away answers.** When a team is stuck, ask guiding questions:
   - "What does `kubectl describe` tell you about that pod?"
   - "Have you checked the Azure Policy assignment status?"
   - "Is the namespace label set correctly for sidecar injection?"

2. **Use the solution files for yourself, not for participants.** Show CLI output
   and error messages — not the commands to fix them — unless a team is truly blocked
   and time is running out.

3. **Let teams choose their path.** AKS Automatic vs Standard in Ch 02. The solution files cover the primary path; coaches decide when to steer.

4. **Timebox each challenge.** Suggested max times (includes 15 min coach intro):
   - Ch 00: 45 min | Ch 01: 60 min | Ch 02: 75 min
   - Ch 03–04: 90 min each | Ch 05: 75 min | Ch 06–09: 90 min each
   - Ch 10: 75 min | Ch 11: 105 min | Ch 12: 90 min | Ch 13: 75 min *(optional)*
   - AI-01: 105 min | AI-02: 90 min *(both optional)*

5. **The AI track is optional.** GPU quota issues should not block the core track.
   Teams without GPU quota can read the challenge and discuss the concepts.

---

## Per-Challenge Coach Guide

Use this table as your quick reference during the event. Each row links to the detailed
solution file. The "When to intervene" column is a suggestion — trust your read of the room.

| Ch | Title | Key Concepts to Introduce | Known Blockers & Hints | Est. Time | When to Intervene |
|----|-------|--------------------------|------------------------|-----------|-------------------|
| 00 | Prerequisites | Cloud-native toolchain; Azure resource providers | WSL1 vs WSL2; missing `kubelogin`; unregistered providers | **45 min** | After 30 min if still installing tools |
| 01 | Containers & ACR | Docker layering; ACR Tasks; managed identity auth | `az acr login` token expiry; ACR SKU must be **Premium** (private endpoints required in Ch-11, geo-replication in Ch-01 success criteria) | **60 min** | If images fail to push after 45 min |
| 02 | AKS Cluster Deployment | Azure CNI Overlay; Workload Identity; availability zones | Quota exceeded (request increase ahead of time); `--enable-oidc-issuer` required for WI | **75 min** | If cluster stuck Provisioning > 20 min |
| 03 | App Deployment & Gateway API | Helm chart structure; App Routing add-on; Gateway API routing | Helm values file versus `--set`; verify GatewayClass exists before applying Gateway | **90 min** | After 60 min if app not accessible |
| 04 | Workload Identity & Secrets | Federated credentials; UAMI; Secrets Store CSI | Namespace of service account must match federated credential; CSI driver pod must be Running | **90 min** | After 60 min on federated credential config |
| 05 | Observability | Managed Prometheus scrape config; Container Insights; Grafana | DCR must be linked to cluster; Grafana datasource must point to correct workspace | **75 min** | After 50 min if no metrics appear |
| 06 | Autoscaling | HPA vs KEDA; Karpenter / NAP; VPA | HPA shows `<unknown>` for CPU if resource **requests** are not set on the target containers; KEDA ScaledObject must reference correct deployment; NAP/Karpenter requires cluster created in Ch 02 with `--node-provisioning-mode Auto`, `--network-dataplane cilium`, and `--network-plugin-mode overlay` — verify with `az aks show --query agentPoolProfiles[].nodeProvisioningMode` | **90 min** | After 65 min if nodes not provisioning |
| 07 | GitOps with Flux v2 | GitRepository; Kustomization; source vs reconcile | PAT token scopes; HelmRelease **must** be in the same namespace as the GitRepository (`cross-namespace references not allowed`) — use `spec.targetNamespace` to deploy into the app namespace; bump `Chart.yaml` version to force re-render on template-only changes; add `spec.driftDetection.mode: enabled` to restore resources deleted outside Git; `flux reconcile` is your friend | **90 min** | After 60 min if Kustomization stuck |
| 08 | AKS Security Hardening | Entra RBAC; Azure Policy / OPA Gatekeeper; Defender | Allow 15–20 min for Gatekeeper to sync; two constraints may coexist (SecurityCenterBuiltIn=dryrun + custom=deny — wait 5–10 min before testing); default-deny network policy **also blocks the Istio gateway pod** in `fabtech` namespace — apply `allow-external-to-gateway` policy; Defender plan must be enabled at subscription level | **90 min** | After 60 min on policy assignment |
| 09 | Istio Service Mesh | mTLS PeerAuthentication; VirtualService; sidecar injection | App Routing Istio and Mesh add-on **cannot coexist** — run `az aks update --disable-app-routing-istio` before enabling the mesh add-on; NAP/Karpenter may provision ARM64 nodes causing `exec format error` — restrict NodePool to `amd64`; namespace label `istio.io/rev` must match revision; restart all pods after enabling sidecar injection | **90 min** | After 60 min if traffic routing broken |
| 10 | Storage | StorageClass; PVC dynamic provisioning; Azure Disk vs Files | RWX requires Azure Files; disk PVCs are RWO only; `fabtech-db-secret` missing `password` key — patch it; postgres needs `securityContext.fsGroup: 999` + `runAsUser: 999` (not 100); Azure Backup instance creation is more reliable via Portal than CLI | **75 min** | After 50 min if PVC stuck Pending |
| 11 | Enterprise Networking | Private API server; Cilium network policies; NAT Gateway vs Firewall | Private API server reachable only from VNet — use `az aks command invoke` for kubectl access without a jumpbox; ACR private endpoint requires **two** DNS A records (registry + data endpoint); disabling public ACR access breaks clusters not on the same VNet; NAT Gateway is a budget egress alternative to Firewall | **105 min** | After 75 min on network policy |
| 12 | AKS Fleet Manager | Fleet hub; member clusters; cluster propagation | Must assign **two** RBAC roles on the hub (`Fleet Manager RBAC Cluster Admin` + `Fleet Manager Contributor`) before kubectl works; `az fleet updaterun create` does NOT start the run — follow with `az fleet updaterun start`; `az fleet get-credentials` has no `--admin` flag — use `kubelogin convert-kubeconfig` | **90 min** | After 60 min if member join fails |
| 13 *(opt)* | FinOps & Cost Management | Cost Analysis add-on; spot toleration; resource requests | Cost Analysis requires Standard/Premium tier; spot nodes need both taint toleration and node selector | **75 min** | After 50 min if spot pod not scheduling |
| AI-01 *(opt)* | GPU Foundations | GPU node pool; NVIDIA device plugin; nvidia-smi | GPU quota must be requested 24–48 h in advance; device plugin DaemonSet must be Running | **105 min** | If no GPU nodes after 30 min |
| AI-02 *(opt)* | LLM Inference with KAITO | KAITO workspace CRD; model preset; inference endpoint | First workspace creation triggers GPU node provisioning (~10 min); model download can take 5–15 min | **90 min** | After 60 min if workspace not Ready |

> **Detailed solutions** (step-by-step commands, screenshots, and extended hints) are in the
> [`Solutions/`](./Solutions/) folder. Share only CLI *output* with teams — not the commands.

---

The FabTechOps source code (Dockerfiles, app code, and sample manifests) is available in
[`Student/Resources/src/`](../Student/Resources/src/).

---

## Cleanup

Remind all teams to delete resources at the end:

```bash
az group delete --name rg-frontier-aks --no-wait --yes
```
