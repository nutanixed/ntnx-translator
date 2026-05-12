const { DataStore } = require("./data-store");

const store = new DataStore();
store.load();

const cases = [
  { q: "vMotion", direction: "vmwareToNutanix" },
  { q: "PC", direction: "nutanixToVmware" },
  { q: "hyprevisor", direction: "both" },
];

let failed = 0;
for (const test of cases) {
  const results = store.search.search(test.q, test.direction, 5);
  if (!results.length) {
    // eslint-disable-next-line no-console
    console.error(`No results for ${test.q}`);
    failed += 1;
  }
}

if (failed > 0) process.exit(1);
// eslint-disable-next-line no-console
console.log("search tests passed");
