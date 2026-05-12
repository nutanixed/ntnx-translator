const fs = require("node:fs");
const path = require("node:path");
const { ingest } = require("../backend/src/ingestion");
const { validateSourceRecordsFile } = require("../shared/src/schema");
const {
  deterministicSourceId,
  toSlug,
  parseSourceRefString,
} = require("./source-record-utils");

const MARKDOWN_PATH = path.resolve(__dirname, "../docs/ntnx-translation.md");
const SOURCE_DIR = path.resolve(__dirname, "../data/source");
const SOURCE_PATH = path.join(SOURCE_DIR, "records.json");

async function migrateMarkdownToSource() {
  const output = await ingest("md", {
    filePath: MARKDOWN_PATH,
    originalName: "ntnx-translation.md",
  });

  const records = (output.accepted || []).map((item) => {
    const nutanixName = item.nutanixTerms?.[0]?.name || "nutanix";
    const vmwareName = item.vmwareTerms?.[0]?.name || "vmware";
    const id = deterministicSourceId(nutanixName, vmwareName);
    return {
      id,
      slug: toSlug(`${nutanixName}-${vmwareName}`) || id,
      sourceSide: item.sourceSide,
      state: "approved",
      nutanixTerms: item.nutanixTerms,
      vmwareTerms: item.vmwareTerms,
      equivalenceType: item.equivalenceType,
      explanation: item.explanation,
      definition: item.definition,
      tags: Array.from(new Set([...(item.tags || []), "markdown"])),
      sourceRefs: [parseSourceRefString(item.sourceRef)],
      owner: item.owner || "unassigned",
      review: {
        reviewedBy: item.owner || "migration",
        reviewedAt: item.lastReviewedAt || new Date().toISOString(),
        notes: "Migrated from docs/ntnx-translation.md",
      },
      createdAt: item.lastReviewedAt || new Date().toISOString(),
      updatedAt: item.lastReviewedAt || new Date().toISOString(),
      version: 1,
    };
  });

  const artifact = {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    records,
  };
  validateSourceRecordsFile(artifact);

  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.writeFileSync(SOURCE_PATH, JSON.stringify(artifact, null, 2));
  return { count: records.length };
}

if (require.main === module) {
  migrateMarkdownToSource()
    .then((result) => {
      // eslint-disable-next-line no-console
      console.log(`Migrated markdown to source records (${result.count} records)`);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error);
      process.exit(1);
    });
}

module.exports = { migrateMarkdownToSource };
