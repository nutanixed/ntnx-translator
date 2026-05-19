# Project Fix Summary: Nutanix VMware Translator

## Overview of Issues
The application was experiencing a critical backend failure and a frontend connectivity issue that prevented the search functionality from working.

## 1. Backend: Missing Dependencies & Scripts
### The Problem
The backend container was crashing with a `MODULE_NOT_FOUND` error. It was attempting to require the shared schema (`shared/src/schema.js`), which depends on the `zod` library. However, the Dockerfile was only installing dependencies for the `backend` folder and was not copying the `scripts` folder required for data processing.

### The Fix
Updated `./backend/Dockerfile` to:
- **Install Shared Dependencies**: Added commands to copy `shared/package.json` and run `npm ci` for the shared directory.
- **Copy Scripts Directory**: Added a instruction to copy the `./scripts` folder into the container.

### Detailed Diff (`backend/Dockerfile`)
```diff
- RUN npm --prefix backend ci --omit=dev
+ COPY shared/package*.json ./shared/
+ RUN npm --prefix backend ci --omit=dev && npm --prefix shared ci --omit=dev

  COPY backend/src ./backend/src
  COPY shared/src ./shared/src
+ COPY scripts ./scripts
```

---

## 2. Frontend: API Endpoint Connectivity
### The Problem
The frontend is a "Client-Side" application, meaning the code runs in the user's browser. It was originally configured to look for the API at `http://localhost:4000`. Since the code runs on the user's laptop, it was trying to find the API on their local machine instead of the Nutanix VM.

### The Fix
- **Environment Variable**: Updated `NEXT_PUBLIC_API_BASE` in the `./.env` file to the public proxy URL: `https://sandbox.nutanixed.com/translate`.
- **Static Build**: Performed a clean `docker compose build frontend --no-cache`. Because Next.js injects `NEXT_PUBLIC` variables at **build time**, a full rebuild was necessary to bake the correct URL into the JavaScript files sent to the browser.

---

## 3. Comparison with Backup
The current project directory contains these structural fixes, whereas `/home/reerii/ntnx-translator-backup` represents the "broken" state:
- **Backup**: Missing shared dependency installation (causes crash).
- **Backup**: Missing `./scripts` folder in container (causes runtime errors).
- **Current**: Fully functional and synchronized with the Nginx proxy.
