const fs = require("node:fs");
const path = require("node:path");

const outputPath = path.resolve(__dirname, "../data/normalized/mappings.generated.json");
const records = [];

for (let i = 1; i <= 500; i += 1) {
  records.push({
    termId: `auto-${i}`,
    sourceSide: i % 2 === 0 ? "nutanix" : "vmware",
    nutanixTerms: [{ name: `Nutanix Term ${i}`, aliases: [`NT${i}`], acronyms: [] }],
    vmwareTerms: [{ name: `VMware Term ${i}`, aliases: [`VT${i}`], acronyms: [] }],
    equivalenceType: i % 5 === 0 ? "partial" : "direct",
    explanation: `Synthetic mapping record ${i} for scale validation.`,
    definition: `Synthetic definition for mapping ${i}.`,
    prismCentralPath: i % 7 === 0 ? null : `Prism > Section ${i}`,
    myNutanixLink: i % 7 === 0 ? "https://portal.nutanix.com/" : null,
    tags: ["synthetic", "scale"],
    lastReviewedAt: new Date().toISOString(),
    owner: "qa-bot",
  });
}

const payload = {
  version: "1.0.0-scale",
  generatedAt: new Date().toISOString(),
  mappings: records,
};

fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
console.log(`Wrote ${records.length} records to ${outputPath}`);
