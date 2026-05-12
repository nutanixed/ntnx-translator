const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const XLSX = require("xlsx");
const { parse } = require("csv-parse/sync");
const axios = require("axios");
const cheerio = require("cheerio");
const pdfParse = require("pdf-parse");
const { mappingSchema } = require("../../shared/src/schema");

const OUTPUT_PATH = path.resolve(
  __dirname,
  "../../data/normalized/review-needed.json"
);

function debugLog(hypothesisId, location, message, data) {
  fetch("http://127.0.0.1:7478/ingest/1f81b619-cb46-4d3e-afe6-474efdacd3ff", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "f9a326",
    },
    body: JSON.stringify({
      sessionId: "f9a326",
      runId: "repro-1",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}

function normalizeObject(raw, fallbackId) {
  const candidate = {
    termId: raw.termId || fallbackId,
    sourceSide: raw.sourceSide || "nutanix",
    nutanixTerms: raw.nutanixTerms || [],
    vmwareTerms: raw.vmwareTerms || [],
    equivalenceType: raw.equivalenceType || "closest",
    explanation:
      raw.explanation || "Auto-ingested content. Needs human review for accuracy.",
    definition:
      raw.definition ||
      "Auto-ingested definition. Verify against official documentation.",
    sourceRef: raw.sourceRef,
    tags: raw.tags || ["imported"],
    lastReviewedAt: raw.lastReviewedAt || new Date().toISOString(),
    owner: raw.owner || "unassigned",
  };
  return mappingSchema.safeParse(candidate);
}

function inferSourceRef(sourceType, payload = {}) {
  const originalName = payload.originalName || "";
  const filePath = payload.filePath || "";
  if (sourceType === "md") {
    if (originalName) return `@docs/${originalName}`;
    return "@docs/ntnx-translation.md";
  }
  if (sourceType === "json") return originalName ? `@data/${originalName}` : "@data/normalized/mappings.json";
  if (sourceType === "csv" || sourceType === "xlsx") {
    return originalName ? `@data/${originalName}` : "@data/imports";
  }
  if (sourceType === "pdf" || sourceType === "ppt") {
    if (originalName) return `@uploads/${originalName}`;
    if (filePath) return `@uploads/${path.basename(filePath)}`;
  }
  if (sourceType === "url" && payload.url) return String(payload.url);
  return "@data/normalized/mappings.json";
}

function toSlug(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function deterministicMarkdownTermId(nutanixName = "", vmwareName = "") {
  const pairKey = `${String(nutanixName).trim().toLowerCase()}|${String(vmwareName)
    .trim()
    .toLowerCase()}`;
  const hash = crypto.createHash("sha1").update(pairKey).digest("hex").slice(0, 10);
  const nutanixSlug = toSlug(nutanixName) || "nutanix";
  const vmwareSlug = toSlug(vmwareName) || "vmware";
  return `md-${nutanixSlug}-${vmwareSlug}-${hash}`;
}

function fromJson(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const source = Array.isArray(raw) ? raw : raw.mappings || [];
  return source.map((item, idx) => normalizeObject(item, `json-${idx}`));
}

function fromCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const rows = parse(text, { columns: true, skip_empty_lines: true });
  return rows.map((row, idx) =>
    normalizeObject(
      {
        termId: row.termId,
        sourceSide: row.sourceSide,
        nutanixTerms: [
          { name: row.nutanixTerm || "", aliases: [], acronyms: [] },
        ],
        vmwareTerms: [{ name: row.vmwareTerm || "", aliases: [], acronyms: [] }],
        equivalenceType: row.equivalenceType,
        explanation: row.explanation,
        definition: row.definition,
        owner: row.owner || "unassigned",
        tags: row.tags ? row.tags.split("|") : [],
      },
      `csv-${idx}`
    )
  );
}

function fromXlsx(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);
  return rows.map((row, idx) =>
    normalizeObject(
      {
        termId: row.termId,
        sourceSide: row.sourceSide,
        nutanixTerms: [{ name: row.nutanixTerm || "", aliases: [], acronyms: [] }],
        vmwareTerms: [{ name: row.vmwareTerm || "", aliases: [], acronyms: [] }],
        equivalenceType: row.equivalenceType,
        explanation: row.explanation,
        definition: row.definition,
        owner: row.owner || "unassigned",
        tags: typeof row.tags === "string" ? row.tags.split("|") : [],
      },
      `xlsx-${idx}`
    )
  );
}

function fromMarkdown(filePath) {
  const raw = fs.readFileSync(filePath);
  const text = raw.toString("utf8");
  const originalLines = text.split(/\r?\n/);
  const normalizedLines = originalLines
    .map((rawLine, index) => ({ line: rawLine.trim(), lineNumber: index + 1 }))
    .filter((entry) => entry.line.length > 0);
  const replacementChars = (text.match(/\uFFFD/g) || []).length;
  const binaryScore = raw.length ? replacementChars / raw.length : 0;
  if (binaryScore > 0.01) {
    throw new Error(
      "File appears to be binary, not markdown text. Please choose the correct source type."
    );
  }
  const lines = normalizedLines.map((entry) => entry.line);

  const tableLikeRows = lines.filter(
    (line) => line.includes("|") && !line.startsWith("|---")
  );
  // #region agent log
  // eslint-disable-next-line no-console
  console.log("[agent-debug][H4] fromMarkdown", {
    filePath,
    textLength: text.length,
    linesCount: lines.length,
    tableLikeRowsCount: tableLikeRows.length,
    firstCharCodes: text
      .slice(0, 12)
      .split("")
      .map((ch) => ch.charCodeAt(0)),
  });
  // #endregion
  // #region agent log
  debugLog("H4", "backend/src/ingestion.js:fromMarkdown:scan", "Markdown parser scanned input", {
    filePath,
    textLength: text.length,
    linesCount: lines.length,
    tableLikeRowsCount: tableLikeRows.length,
    sampleRow: tableLikeRows[0]?.slice(0, 120) || null,
  });
  // #endregion

  if (!tableLikeRows.length) {
    const blockEntries = [];
    let currentSection = "";
    let nutanixTerm = "";
    let vmwareTerm = "";
    let mappingType = "";
    let notes = [];
    let definitionHeaderCount = 0;
    let explanationHeaderCount = 0;
    let definitionBulletCount = 0;
    let explanationBulletCount = 0;
    let sourceStartLine = null;
    let sourceEndLine = null;
    let definitionStartLine = null;
    let definitionEndLine = null;
    let explanationStartLine = null;
    let explanationEndLine = null;
    let inDefinitionBlock = false;
    let inExplanationBlock = false;
    let definitionLines = [];
    let explanationLines = [];

    function flushSection(sectionIdx) {
      if (!nutanixTerm || !vmwareTerm) return;
      const typeRaw = (mappingType || "").toLowerCase();
      let equivalenceType = "closest";
      if (typeRaw.includes("direct")) equivalenceType = "direct";
      else if (typeRaw.includes("partial") || typeRaw.includes("approx")) {
        equivalenceType = "partial";
      }

      const resolvedDefinition = definitionLines.join(" ").trim();
      const resolvedExplanation = explanationLines.join(" ").trim();
      const referenceStart = definitionStartLine || sourceStartLine;
      const referenceEnd = explanationEndLine || definitionEndLine || sourceEndLine;
      const sourceRef =
        referenceStart && referenceEnd
          ? `@ntnx-translation.md (${referenceStart}-${referenceEnd})`
          : "@ntnx-translation.md";

      blockEntries.push(
        normalizeObject(
          {
            termId: deterministicMarkdownTermId(nutanixTerm, vmwareTerm),
            sourceSide: "nutanix",
            nutanixTerms: [{ name: nutanixTerm, aliases: [], acronyms: [] }],
            vmwareTerms: [{ name: vmwareTerm, aliases: [], acronyms: [] }],
            equivalenceType,
            explanation:
              resolvedExplanation ||
              notes.join(" ").trim() ||
              `${currentSection}: conceptual mapping extracted from markdown.`,
            definition:
              resolvedDefinition ||
              `${nutanixTerm} mapped to ${vmwareTerm} from markdown source.`,
            sourceRef,
            owner: "unassigned",
            tags: ["imported", "markdown"],
          },
          `md-section-${sectionIdx}`
        )
      );
      // #region agent log
      debugLog(
        "H5",
        "backend/src/ingestion.js:fromMarkdown:flushSection",
        "Markdown section flushed",
        {
          sectionIdx,
          currentSection,
          nutanixTerm,
          vmwareTerm,
          notesCount: notes.length,
          definitionHeaderCount,
          explanationHeaderCount,
          definitionBulletCount,
          explanationBulletCount,
          resolvedDefinitionLength: resolvedDefinition.length,
          resolvedExplanationLength: resolvedExplanation.length,
          definitionStartLine,
          definitionEndLine,
          explanationStartLine,
          explanationEndLine,
          sourceStartLine,
          sourceEndLine,
          sourceRef,
        }
      );
      // #endregion
    }

    let sectionIdx = 0;
    for (const [lineIdx, entry] of normalizedLines.entries()) {
      const line = entry.line;
      const sourceLineNumber = entry.lineNumber;
      if (line.startsWith("## ")) {
        flushSection(sectionIdx);
        sectionIdx += 1;
        currentSection = line.replace(/^##\s+/, "").trim();
        nutanixTerm = "";
        vmwareTerm = "";
        mappingType = "";
        notes = [];
        definitionHeaderCount = 0;
        explanationHeaderCount = 0;
        definitionBulletCount = 0;
        explanationBulletCount = 0;
        sourceStartLine = sourceLineNumber;
        sourceEndLine = sourceLineNumber;
        definitionStartLine = null;
        definitionEndLine = null;
        explanationStartLine = null;
        explanationEndLine = null;
        inDefinitionBlock = false;
        inExplanationBlock = false;
        definitionLines = [];
        explanationLines = [];
        continue;
      }
      if (/^-?\s*Nutanix\s*:/i.test(line)) {
        nutanixTerm = line.replace(/^-?\s*Nutanix\s*:/i, "").trim();
        continue;
      }
      if (/^-?\s*VMware\s*:/i.test(line)) {
        vmwareTerm = line.replace(/^-?\s*VMware\s*:/i, "").trim();
        continue;
      }
      if (/^-?\s*Mapping Type\s*:/i.test(line)) {
        mappingType = line.replace(/^-?\s*Mapping Type\s*:/i, "").trim();
        sourceEndLine = sourceLineNumber || sourceEndLine;
        continue;
      }
      if (/^-?\s*Definition\s*:/i.test(line)) {
        definitionHeaderCount += 1;
        inDefinitionBlock = true;
        inExplanationBlock = false;
        definitionStartLine = sourceLineNumber || definitionStartLine;
        definitionEndLine = sourceLineNumber || definitionEndLine;
        sourceEndLine = sourceLineNumber || sourceEndLine;
        continue;
      }
      if (/^-?\s*Explanation\s*:/i.test(line)) {
        explanationHeaderCount += 1;
        inDefinitionBlock = false;
        inExplanationBlock = true;
        explanationStartLine = sourceLineNumber || explanationStartLine;
        explanationEndLine = sourceLineNumber || explanationEndLine;
        sourceEndLine = sourceLineNumber || sourceEndLine;
        continue;
      }
      if (line.startsWith("- ") && inDefinitionBlock) {
        definitionBulletCount += 1;
        definitionLines.push(line.replace(/^- /, "").trim());
        definitionEndLine = sourceLineNumber || definitionEndLine;
        sourceEndLine = sourceLineNumber || sourceEndLine;
        continue;
      }
      if (line.startsWith("- ") && inExplanationBlock) {
        explanationBulletCount += 1;
        explanationLines.push(line.replace(/^- /, "").trim());
        explanationEndLine = sourceLineNumber || explanationEndLine;
        sourceEndLine = sourceLineNumber || sourceEndLine;
        continue;
      }
      if (line.startsWith("- ") && !/^-?\s*(Nutanix|VMware|Mapping Type)\s*:/i.test(line)) {
        notes.push(line.replace(/^- /, "").trim());
        sourceEndLine = sourceLineNumber || sourceEndLine;
      }
      if (lineIdx === lines.length - 1 && sourceLineNumber) {
        sourceEndLine = sourceLineNumber;
      }
    }
    flushSection(sectionIdx);

    // #region agent log
    debugLog(
      "H1-H2",
      "backend/src/ingestion.js:fromMarkdown:blockParse",
      "Markdown block parser produced entries",
      {
        blockEntriesCount: blockEntries.length,
        firstBlockNutanixName: blockEntries[0]?.success
          ? blockEntries[0].data.nutanixTerms?.[0]?.name || null
          : null,
        firstBlockVmwareName: blockEntries[0]?.success
          ? blockEntries[0].data.vmwareTerms?.[0]?.name || null
          : null,
      }
    );
    // #endregion

    if (blockEntries.length) return blockEntries;

    return [
      normalizeObject(
        {
          termId: `md-unparsed-${crypto
            .createHash("sha1")
            .update(filePath)
            .digest("hex")
            .slice(0, 10)}`,
          sourceSide: "nutanix",
          nutanixTerms: [{ name: "Markdown import requires explicit term pairs", aliases: [], acronyms: [] }],
          vmwareTerms: [{ name: "Review required", aliases: [], acronyms: [] }],
          equivalenceType: "none",
          explanation:
            "No parseable Nutanix/VMware term pairs were found in markdown. Add lines like 'Nutanix: X' and 'VMware: Y'.",
          definition: "Markdown import did not detect structured term mappings.",
          owner: "unassigned",
          tags: ["imported", "markdown"],
        },
        `md-${Date.now()}`
      ),
    ];
  }

  const entries = [];
  for (const [idx, row] of tableLikeRows.entries()) {
    const cols = row
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
    if (cols.length < 2) continue;
    entries.push(
      normalizeObject(
        {
          termId: deterministicMarkdownTermId(cols[0], cols[1] || ""),
          sourceSide: "nutanix",
          nutanixTerms: [{ name: cols[0], aliases: [], acronyms: [] }],
          vmwareTerms: [{ name: cols[1], aliases: [], acronyms: [] }],
          equivalenceType: "closest",
          explanation: cols[2] || "Imported from markdown table row.",
          definition: cols[3] || "Imported markdown mapping definition.",
          owner: "unassigned",
          tags: ["imported", "markdown"],
        },
        `md-${idx}`
      )
    );
  }
  // #region agent log
  debugLog(
    "H1-H2",
    "backend/src/ingestion.js:fromMarkdown:entries",
    "Markdown parser produced entries",
    {
      entriesCount: entries.length,
      firstEntryTermId: entries[0]?.success ? entries[0].data.termId : null,
      firstNutanixName: entries[0]?.success
        ? entries[0].data.nutanixTerms?.[0]?.name || null
        : null,
      firstVmwareName: entries[0]?.success
        ? entries[0].data.vmwareTerms?.[0]?.name || null
        : null,
    }
  );
  // #endregion
  return entries;
}

async function fromUrl(url) {
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const text = $("body").text().replace(/\s+/g, " ").slice(0, 500);
  return [
    normalizeObject(
      {
        termId: `url-${Date.now()}`,
        sourceSide: "nutanix",
        nutanixTerms: [{ name: "Imported URL content", aliases: [], acronyms: [] }],
        vmwareTerms: [{ name: "Review required", aliases: [], acronyms: [] }],
        equivalenceType: "closest",
        explanation: `URL content captured for review: ${text}`,
        definition: "Imported from URL source. Mapping requires human validation.",
        owner: "unassigned",
      },
      `url-${Date.now()}`
    ),
  ];
}

async function fromPdf(filePath) {
  const data = fs.readFileSync(filePath);
  const parsed = await pdfParse(data);
  return [
    normalizeObject(
      {
        termId: `pdf-${Date.now()}`,
        sourceSide: "nutanix",
        nutanixTerms: [{ name: "Imported PDF content", aliases: [], acronyms: [] }],
        vmwareTerms: [{ name: "Review required", aliases: [], acronyms: [] }],
        equivalenceType: "closest",
        explanation: parsed.text.slice(0, 500),
        definition: "Imported from PDF source. Mapping requires human validation.",
        owner: "unassigned",
      },
      `pdf-${Date.now()}`
    ),
  ];
}

function fromPpt(filePath) {
  return [
    normalizeObject(
      {
        termId: `ppt-${Date.now()}`,
        sourceSide: "nutanix",
        nutanixTerms: [{ name: path.basename(filePath), aliases: [], acronyms: [] }],
        vmwareTerms: [{ name: "Review required", aliases: [], acronyms: [] }],
        equivalenceType: "closest",
        explanation:
          "PowerPoint ingestion captured file metadata. Extracted mappings must be reviewed.",
        definition: "Imported from PowerPoint source.",
        owner: "unassigned",
      },
      `ppt-${Date.now()}`
    ),
  ];
}

async function ingest(sourceType, payload) {
  // #region agent log
  debugLog("H1-H4", "backend/src/ingestion.js:ingest:entry", "Ingest called", {
    sourceType,
    filePath: payload?.filePath || null,
    hasUrl: Boolean(payload?.url),
  });
  // #endregion
  const sourceRef = inferSourceRef(sourceType, payload);
  let rows = [];
  if (sourceType === "json") rows = fromJson(payload.filePath);
  else if (sourceType === "csv") rows = fromCsv(payload.filePath);
  else if (sourceType === "xlsx") rows = fromXlsx(payload.filePath);
  else if (sourceType === "md") rows = fromMarkdown(payload.filePath);
  else if (sourceType === "url") rows = await fromUrl(payload.url);
  else if (sourceType === "pdf") rows = await fromPdf(payload.filePath);
  else if (sourceType === "ppt") rows = fromPpt(payload.filePath);
  else throw new Error(`Unsupported source type: ${sourceType}`);

  const accepted = rows.filter((item) => item.success).map((item) => item.data);
  const acceptedWithSource = accepted.map((item) => ({
    ...item,
    sourceRef: item.sourceRef || sourceRef,
  }));
  const rejected = rows
    .filter((item) => !item.success)
    .map((item) => item.error.flatten());
  // #region agent log
  debugLog("H1-H3", "backend/src/ingestion.js:ingest:result", "Ingest parse results", {
    sourceType,
    rowsCount: rows.length,
    acceptedCount: acceptedWithSource.length,
    rejectedCount: rejected.length,
    firstAcceptedName: acceptedWithSource[0]?.nutanixTerms?.[0]?.name || null,
    sourceRef,
  });
  // #endregion

  const output = {
    generatedAt: new Date().toISOString(),
    sourceType,
    accepted: acceptedWithSource,
    rejected,
  };
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  return output;
}

module.exports = { ingest };
