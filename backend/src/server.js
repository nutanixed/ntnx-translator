const express = require("express");
const cors = require("cors");
const fs = require("node:fs");
const path = require("node:path");
const multer = require("multer");
const { DataStore } = require("./data-store");
const { ingest } = require("./ingestion");
const { validateSourceRecordsFile } = require("../../shared/src/schema");
const { compile } = require("../../scripts/compile-terms");
const {
  deterministicSourceId,
  toSlug,
  canonicalPairKey,
  parseSourceRefString,
} = require("../../scripts/source-record-utils");

const app = express();
const store = new DataStore();
const SOURCE_PATH = path.resolve(__dirname, "../../data/source/records.json");

const UPLOAD_DIR = path.resolve(__dirname, "../../data/raw/uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 20 * 1024 * 1024 },
});

function debugLog(hypothesisId, location, message, data) {
  // #region agent log
  fetch("http://127.0.0.1:7478/ingest/1f81b619-cb46-4d3e-afe6-474efdacd3ff", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "f9a326",
    },
    body: JSON.stringify({
      sessionId: "f9a326",
      runId: "mobile-fetch-backend-trace",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

function inferSourceType(fileName = "", explicitSourceType = "") {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".json") return "json";
  if (ext === ".csv") return "csv";
  if (ext === ".xls" || ext === ".xlsx") return "xlsx";
  if (ext === ".pdf") return "pdf";
  if (ext === ".ppt" || ext === ".pptx") return "ppt";
  if (ext === ".md" || ext === ".markdown") return "md";
  if (explicitSourceType) return explicitSourceType.toLowerCase();
  return "";
}

function loadSourceFile() {
  try {
    const raw = fs.readFileSync(SOURCE_PATH, "utf8");
    return validateSourceRecordsFile(JSON.parse(raw));
  } catch (_error) {
    return {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      records: [],
    };
  }
}

function saveSourceFile(records) {
  const next = {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    records,
  };
  fs.mkdirSync(path.dirname(SOURCE_PATH), { recursive: true });
  fs.writeFileSync(SOURCE_PATH, JSON.stringify(next, null, 2));
}

function mappingToSourceRecord(mapping, state = "draft") {
  const now = new Date().toISOString();
  const nutanixName = mapping?.nutanixTerms?.[0]?.name || "nutanix";
  const vmwareName = mapping?.vmwareTerms?.[0]?.name || "vmware";
  const id = deterministicSourceId(nutanixName, vmwareName);
  return {
    id,
    slug: toSlug(`${nutanixName}-${vmwareName}`) || id,
    sourceSide: mapping.sourceSide || "nutanix",
    state,
    nutanixTerms: mapping.nutanixTerms || [{ name: nutanixName, aliases: [], acronyms: [] }],
    vmwareTerms: mapping.vmwareTerms || [{ name: vmwareName, aliases: [], acronyms: [] }],
    equivalenceType: mapping.equivalenceType || "closest",
    explanation: mapping.explanation || "",
    definition: mapping.definition || "",
    tags: Array.from(new Set(mapping.tags || [])),
    sourceRefs: [parseSourceRefString(mapping.sourceRef || "@docs/ntnx-translation.md")],
    owner: mapping.owner || "unassigned",
    createdAt: mapping.lastReviewedAt || now,
    updatedAt: now,
    version: 1,
  };
}

function upsertSourceRecords(records) {
  const current = loadSourceFile();
  const byPair = new Map();
  for (const item of current.records) {
    byPair.set(
      canonicalPairKey(item.nutanixTerms?.[0]?.name, item.vmwareTerms?.[0]?.name),
      item
    );
  }
  for (const item of records) {
    const key = canonicalPairKey(item.nutanixTerms?.[0]?.name, item.vmwareTerms?.[0]?.name);
    const existing = byPair.get(key);
    if (existing) {
      byPair.set(key, {
        ...existing,
        ...item,
        id: existing.id || item.id,
        createdAt: existing.createdAt || item.createdAt,
        updatedAt: new Date().toISOString(),
      });
    } else {
      byPair.set(key, item);
    }
  }
  const nextRecords = Array.from(byPair.values());
  saveSourceFile(nextRecords);
  compile();
  store.load();
  return {
    upsertedCount: records.length,
    totalSourceRecords: nextRecords.length,
    totalRuntimeRecords: store.records.length,
  };
}

function resolveSourceRef(item) {
  if (item?.sourceRef) return item.sourceRef;
  if (item?.tags?.includes("markdown") || String(item?.termId || "").startsWith("md-")) {
    return "@docs/ntnx-translation.md";
  }
  return "@data/normalized/mappings.json";
}

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mappings: store.records.length });
});

app.get("/api/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  const direction = String(req.query.direction || "both");
  if (!q) return res.status(400).json({ error: "q is required" });
  const results = store.search.search(q, direction, 25);
  // #region agent log
  debugLog("BF1", "backend/src/server.js:/api/search", "Search API request served", {
    q,
    direction,
    count: results.length,
    host: req.headers.host || "",
    origin: req.headers.origin || "",
    referer: req.headers.referer || "",
    userAgent: req.headers["user-agent"] || "",
    forwardedFor: req.headers["x-forwarded-for"] || "",
    remoteAddress: req.socket?.remoteAddress || "",
  });
  // #endregion
  res.json({ query: q, direction, count: results.length, results });
});

app.get("/api/terms/:id", async (req, res) => {
  const item = store.getById(req.params.id);
  if (!item) return res.status(404).json({ error: "Term not found" });
  const responseItem = { ...item, sourceRef: resolveSourceRef(item) };
  res.json(responseItem);
});

app.post("/api/import/:sourceType", async (req, res) => {
  try {
    const output = await ingest(req.params.sourceType, req.body || {});
    const sourceRecords = (output.accepted || []).map((item) =>
      mappingToSourceRecord(item, "draft")
    );
    const mergeStats = upsertSourceRecords(sourceRecords);
    res.json({ ...output, sourceRecords, ...mergeStats, compiled: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/upload-and-import", upload.single("file"), async (req, res) => {
  try {
    const sourceType = inferSourceType(
      req.file?.originalname || "",
      String(req.body?.sourceType || "")
    );
    if (!sourceType) {
      return res.status(400).json({ error: "Unsupported source type." });
    }

    const payload =
      sourceType === "url"
        ? { url: req.body?.url }
        : { filePath: req.file?.path, originalName: req.file?.originalname };

    const output = await ingest(sourceType, payload);
    const sourceRecords = (output.accepted || []).map((item) =>
      mappingToSourceRecord(item, "draft")
    );
    const mergeStats = upsertSourceRecords(sourceRecords);

    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_error) {
        // Ignore cleanup failures for uploaded temporary files.
      }
    }
    return res.json({ ...output, sourceRecords, ...mergeStats, compiled: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post("/api/reload", (_req, res) => {
  store.load();
  res.json({ ok: true, mappings: store.records.length });
});

app.post("/api/compile", (_req, res) => {
  compile();
  store.load();
  res.json({ ok: true, mappings: store.records.length });
});

const port = Number(process.env.PORT || 4000);
compile();
store.load();
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${port}`);
});
