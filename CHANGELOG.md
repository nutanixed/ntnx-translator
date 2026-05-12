# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog and uses semantic versioning.

## [Unreleased]
- Deployment packaging for GitHub + Nutanix VM hosting.
- Docker Compose runtime with frontend and backend services.
- Markdown ingestion stability improvements:
  - deterministic markdown term IDs
  - stale markdown deduplication on re-import
  - source reference + line-range enrichment
  - auto-sync on read endpoints for always-fresh results

