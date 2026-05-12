# Nutanix VMware Translator

Nutanix-to-VMware terminology translator application with:
- `frontend/`: Next.js UI
- `backend/`: Express API + ingestion
- `shared/`: shared schema validation
- `data/`: normalized mappings data
- `docs/`: source markdown and operational docs

## Local Development

Prerequisites:
- Node.js 20+
- npm 10+

Install dependencies:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
npm --prefix shared install
```

Run frontend + backend:

```bash
npm run dev
```

Run health check:

```bash
curl http://localhost:4000/api/health
```

## Always-Fresh Markdown Behavior

The backend automatically syncs `docs/ntnx-translation.md` on `/api/search` and `/api/terms/:id` when the markdown file has changed.
Manual import is still available for explicit ingestion workflows:

```bash
curl -X POST http://localhost:4000/api/import/md \
  -H "Content-Type: application/json" \
  -d '{"filePath":"./docs/ntnx-translation.md"}'
```

## GitHub Packaging and Release Strategy

- Keep `main` as stable deployable branch.
- Optional: use `develop` for integration work.
- Use semantic tags for releases, for example:
  - `v0.1.0-beta.1`
  - `v0.1.0`
- For each release:
  1. Merge to `main`
  2. Tag release
  3. Deploy tag on VM

First-time GitHub push:

```bash
git init
git add .
git commit -m "Initial translator baseline"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Docker Compose Deployment

This repository includes:
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.yml`

Run in production mode:

```bash
cp .env.example .env
docker compose build
docker compose up -d
```

Check containers:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

## Nutanix VM Deployment Runbook

See:
- `docs/vm-bootstrap.md` for VM provisioning + OS setup
- `docs/deploy-runbook.md` for deploy/update/rollback flow

## CI (Skeleton)

CI skeleton workflow is available in `.github/workflows/ci.yml`:
- installs dependencies
- runs backend tests
- builds frontend

You can later extend with:
- image build/push
- remote deploy job

