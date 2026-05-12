const fs = require("node:fs");
const path = require("node:path");
const { validateSourceRecordsFile } = require("../shared/src/schema");
const { formatSourceRef } = require("./source-record-utils");

const SOURCE_PATH = path.resolve(__dirname, "../data/source/records.json");
const MARKDOWN_PATH = path.resolve(__dirname, "../docs/ntnx-translation.md");

function headingFromRecord(record) {
  return (
    record.nutanixTerms?.[0]?.name ||
    record.vmwareTerms?.[0]?.name ||
    record.slug ||
    record.id
  );
}

function generateMarkdown() {
  const raw = fs.readFileSync(SOURCE_PATH, "utf8");
  const parsed = validateSourceRecordsFile(JSON.parse(raw));

  const lines = [];
  lines.push("# Nutanix ↔ VMware Translation Reference");
  lines.push("");
  lines.push(`Generated At: ${new Date().toISOString()}`);
  lines.push("");

  const records = [...parsed.records].sort((a, b) =>
    headingFromRecord(a).localeCompare(headingFromRecord(b))
  );

  for (const record of records) {
    lines.push("---");
    lines.push("");
    lines.push(`## ${headingFromRecord(record)}`);
    lines.push(`- Nutanix: ${record.nutanixTerms.map((item) => item.name).join(", ")}`);
    lines.push(`- VMware: ${record.vmwareTerms.map((item) => item.name).join(", ")}`);
    lines.push(`- Mapping Type: ${record.equivalenceType}`);
    lines.push("- Definition:");
    lines.push(`  - ${record.definition}`);
    lines.push("- Explanation:");
    lines.push(`  - ${record.explanation}`);
    lines.push(`- Lifecycle State: ${record.state}`);
    lines.push(`- Source: ${formatSourceRef(record.sourceRefs[0])}`);
    lines.push("");
  }

  fs.writeFileSync(MARKDOWN_PATH, `${lines.join("\n")}\n`);
  return { count: records.length };
}

if (require.main === module) {
  const result = generateMarkdown();
  // eslint-disable-next-line no-console
  console.log(`Generated markdown from source records (${result.count} records)`);
}

module.exports = { generateMarkdown };
