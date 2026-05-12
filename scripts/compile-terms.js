const fs = require("node:fs");
const path = require("node:path");
const {
  validateSourceRecordsFile,
  validateCompiledByIdFile,
  validateCompiledSearchFile,
} = require("../shared/src/schema");
const {
  canonicalPairKey,
  formatSourceRef,
} = require("./source-record-utils");

const SOURCE_PATH = path.resolve(__dirname, "../data/source/records.json");
const COMPILED_DIR = path.resolve(__dirname, "../data/compiled");
const COMPILED_BY_ID_PATH = path.join(COMPILED_DIR, "terms.byId.json");
const COMPILED_SEARCH_PATH = path.join(COMPILED_DIR, "terms.search.json");

function toMapping(record) {
  return {
    termId: record.id,
    sourceSide: record.sourceSide,
    nutanixTerms: record.nutanixTerms,
    vmwareTerms: record.vmwareTerms,
    equivalenceType: record.equivalenceType,
    explanation: record.explanation,
    definition: record.definition,
    sourceRef: formatSourceRef(record.sourceRefs[0]),
    tags: record.tags,
    lastReviewedAt:
      record.review?.reviewedAt || record.updatedAt || new Date().toISOString(),
    owner: record.owner || "unassigned",
  };
}

function flattenTerms(mapping) {
  const generateInitialism = (value = "") => {
    const parts = String(value)
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length < 2) return "";
    return parts.map((part) => part[0]).join("").toUpperCase();
  };

  const pushSide = (entries) => {
    const out = [];
    for (const item of entries) {
      out.push(item.name);
      for (const alias of item.aliases || []) out.push(alias);
      for (const acronym of item.acronyms || []) out.push(acronym);
      const generated = generateInitialism(item.name);
      if (generated) out.push(generated);
    }
    return out.filter(Boolean);
  };
  return {
    termBlob: [...pushSide(mapping.nutanixTerms, "nutanix"), ...pushSide(mapping.vmwareTerms, "vmware")].join(" | "),
    nutanixBlob: pushSide(mapping.nutanixTerms, "nutanix").join(" | "),
    vmwareBlob: pushSide(mapping.vmwareTerms, "vmware").join(" | "),
  };
}

function compile({ checkOnly = false } = {}) {
  const raw = fs.readFileSync(SOURCE_PATH, "utf8");
  const validated = validateSourceRecordsFile(JSON.parse(raw));

  const deduped = new Map();
  for (const record of validated.records) {
    const key = canonicalPairKey(
      record.nutanixTerms?.[0]?.name,
      record.vmwareTerms?.[0]?.name
    );
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, record);
      continue;
    }
    const rank = { approved: 3, review: 2, draft: 1 };
    const existingRank = rank[existing.state] || 0;
    const currentRank = rank[record.state] || 0;
    if (currentRank > existingRank) {
      deduped.set(key, record);
      continue;
    }
    if (currentRank === existingRank) {
      const existingTs = Date.parse(existing.updatedAt || 0) || 0;
      const currentTs = Date.parse(record.updatedAt || 0) || 0;
      if (currentTs >= existingTs) deduped.set(key, record);
    }
  }

  const records = Array.from(deduped.values());
  const byId = {};
  const docs = [];

  for (const record of records) {
    const mapping = toMapping(record);
    byId[mapping.termId] = mapping;
    const flattened = flattenTerms(mapping);
    docs.push({
      id: mapping.termId,
      ...flattened,
      mapping,
    });
  }

  const now = new Date().toISOString();
  const byIdArtifact = {
    version: "1.0.0",
    generatedAt: now,
    count: Object.keys(byId).length,
    byId,
  };
  const searchArtifact = {
    version: "1.0.0",
    generatedAt: now,
    count: docs.length,
    docs,
  };

  validateCompiledByIdFile(byIdArtifact);
  validateCompiledSearchFile(searchArtifact);

  if (checkOnly) return { count: docs.length };

  fs.mkdirSync(COMPILED_DIR, { recursive: true });
  fs.writeFileSync(COMPILED_BY_ID_PATH, JSON.stringify(byIdArtifact, null, 2));
  fs.writeFileSync(COMPILED_SEARCH_PATH, JSON.stringify(searchArtifact, null, 2));
  return { count: docs.length };
}

if (require.main === module) {
  const checkOnly = process.argv.includes("--check");
  const result = compile({ checkOnly });
  // eslint-disable-next-line no-console
  console.log(
    checkOnly
      ? `Source records validated (${result.count} records)`
      : `Compiled terms artifacts generated (${result.count} records)`
  );
}

module.exports = { compile };
