# Coach Docker Resources

Dockerfiles and a Docker Compose file for building and running the full FabTechOps stack locally.

| File | Description |
|------|-------------|
| `Dockerfile.api` | Node.js REST API — port 3001 |
| `Dockerfile.web` | Node.js/Express frontend — port 3000 |
| `docker-compose.yml` | Full stack: web + api + PostgreSQL |

## Run the full stack locally (Docker Compose)

```bash
# From the repo root — copy Dockerfiles into source folders first
cp Coach/Solutions/Resources/docker/Dockerfile.api Student/Resources/src/content-api/Dockerfile
cp Coach/Solutions/Resources/docker/Dockerfile.web Student/Resources/src/content-web/Dockerfile

# Start web + api + postgres
docker compose -f Coach/Solutions/Resources/docker/docker-compose.yml up --build
```

- Frontend: http://localhost:3000  
- API: http://localhost:3001  
- PostgreSQL: `localhost:5432` (user: `fabadmin`, password: `fabpassword`, db: `fabtech`)

The API automatically creates the schema and seeds data on first start.  
Remove the `DATABASE_URL` env var from the `api` service in `docker-compose.yml` to run in JSON fallback mode (no database required).

To tear everything down including the database volume:

```bash
docker compose -f Coach/Solutions/Resources/docker/docker-compose.yml down -v
```

## Build locally

```bash
ACR_NAME=<ACR_NAME>
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)

# API
cp Dockerfile.api ../../Student/Resources/src/content-api/Dockerfile
docker build -t $ACR_LOGIN_SERVER/fabtech-api:v1 ../../Student/Resources/src/content-api/
docker push $ACR_LOGIN_SERVER/fabtech-api:v1

# Web
cp Dockerfile.web ../../Student/Resources/src/content-web/Dockerfile
docker build -t $ACR_LOGIN_SERVER/fabtech-web:v1 ../../Student/Resources/src/content-web/
docker push $ACR_LOGIN_SERVER/fabtech-web:v1
```

## Build with ACR Tasks (no local Docker required)

```bash
ACR_NAME=<ACR_NAME>

az acr build \
  --registry $ACR_NAME \
  --image fabtech-api:v1 \
  --file Dockerfile.api \
  ../../Student/Resources/src/content-api/

az acr build \
  --registry $ACR_NAME \
  --image fabtech-web:v1 \
  --file Dockerfile.web \
  ../../Student/Resources/src/content-web/
```

## Pre-built fallback

If teams hit build issues, import the public images directly:

```bash
az acr import --name $ACR_NAME --source docker.io/whatthehackmsft/api:latest --image fabtech-api:v1
az acr import --name $ACR_NAME --source docker.io/whatthehackmsft/web:latest --image fabtech-web:v1
```
