const crypto = require("node:crypto");

function toSlug(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function canonicalPairKey(nutanixTerm = "", vmwareTerm = "") {
  return `${String(nutanixTerm).trim().toLowerCase()}|${String(vmwareTerm)
    .trim()
    .toLowerCase()}`;
}

function deterministicSourceId(nutanixTerm = "", vmwareTerm = "") {
  const key = canonicalPairKey(nutanixTerm, vmwareTerm);
  const hash = crypto.createHash("sha1").update(key).digest("hex").slice(0, 10);
  return `term-${toSlug(nutanixTerm)}-${toSlug(vmwareTerm)}-${hash}`;
}

function parseSourceRefString(sourceRef = "") {
  const trimmed = String(sourceRef || "").trim();
  const match = trimmed.match(/^([^()]+)\((\d+)-(\d+)\)$/);
  if (match) {
    return {
      path: match[1].trim(),
      startLine: Number(match[2]),
      endLine: Number(match[3]),
    };
  }
  return { path: trimmed || "@docs/ntnx-translation.md" };
}

function formatSourceRef(sourceRef) {
  if (!sourceRef) return "@docs/ntnx-translation.md";
  if (
    typeof sourceRef.startLine === "number" &&
    typeof sourceRef.endLine === "number"
  ) {
    return `${sourceRef.path} (${sourceRef.startLine}-${sourceRef.endLine})`;
  }
  return sourceRef.path;
}

module.exports = {
  toSlug,
  canonicalPairKey,
  deterministicSourceId,
  parseSourceRefString,
  formatSourceRef,
};
