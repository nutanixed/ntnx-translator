# Deployment Runbook (Docker Compose)

This runbook covers initial deployment, updates, and rollback on the Nutanix VM.

## Prerequisites

- VM is bootstrapped (see `docs/vm-bootstrap.md`)
- GitHub repository exists and VM has access
- Domain + DNS configured (optional but recommended)

## 1) Initial Deploy

```bash
cd /opt
git clone <your-github-repo-url> ntnx-translator
cd /opt/ntnx-translator
cp .env.example .env
```

Edit `.env` values for your environment (at minimum `NEXT_PUBLIC_API_BASE` and `PORT`).

Build and start:

```bash
docker compose build
docker compose up -d
docker compose ps
```

## 2) Health Checks

Backend:

```bash
curl http://localhost:4000/api/health
```

Frontend:

```bash
curl -I http://localhost:3000
```

Logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

## 3) Standard Update (Manual Now)

```bash
cd /opt/ntnx-translator
git fetch --all --tags
git checkout main
git pull
docker compose up -d --build
```

For tag-based deploy:

```bash
git fetch --all --tags
git checkout v0.1.0-beta.1
docker compose up -d --build
```

## 4) Rollback

```bash
cd /opt/ntnx-translator
git fetch --all --tags
git checkout <previous-release-tag>
docker compose up -d --build
```

## 5) Data Persistence Notes

- `docker-compose.yml` mounts `./data` and `./docs` into backend container.
- Mapping data and markdown source remain in the repository workspace on VM and survive container rebuilds.

