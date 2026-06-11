# Student Resources — Frontier AKS Hackathon

This folder contains the source code and supporting files students need to complete
the hack challenges.

## How to Get These Resources

The source code lives directly in this repository under the `src/` folder.
Participants can clone the repo and work directly from `Student/Resources/src/`.

## Contents

| Folder / File | Used In | Description |
|---------------|---------|-------------|
| `src/content-web/` | Challenge 01 | React frontend source code and Dockerfile |
| `src/content-api/` | Challenge 01 | Node.js REST API source code and Dockerfile |
| `src/manifests/chart/` | Challenge 03 | Helm chart skeleton — deploys app pods and services only |
| `src/manifests/secretproviderclass.yaml` | Challenge 04 | Starter template for the Key Vault CSI `SecretProviderClass` |

## Pre-built Images (Fallback)

If you run into issues building the images locally in Challenge 01, pre-built public
images are available on Docker Hub and can be imported directly into your ACR:

```bash
# Import pre-built images into your ACR (replace <ACR_NAME> with yours)
az acr import --name <ACR_NAME> --source docker.io/whatthehackmsft/api:latest --image fabtech-api:v1
az acr import --name <ACR_NAME> --source docker.io/whatthehackmsft/web:latest --image fabtech-web:v1
```

## Sample Application — FabTechOps

**FabTechOps** is a three-tier web application used throughout this hack:

| Tier | Description |
|------|-------------|
| **Frontend** (`web`) | React-based conference info site |
| **API** (`api`) | Node.js REST API (serves JSON data; connects to PostgreSQL if `DATABASE_URL` is set) |
| **Database** | Azure Database for PostgreSQL — optional (API falls back to bundled JSON without it) |
