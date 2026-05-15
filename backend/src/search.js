const Fuse = require("fuse.js");

function debugLog(hypothesisId, location, message, data) {
  fetch("http://127.0.0.1:7478/ingest/1f81b619-cb46-4d3e-afe6-474efdacd3ff", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "f9a326",
    },
    body: JSON.stringify({
      sessionId: "f9a326",
      runId: "search-vm-repro-1",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}

function flattenTerms(mapping) {
  const all = [];
  const pushSide = (entries, side) => {
    entries.forEach((item) => {
      all.push({
        side,
        text: item.name,
        weight: 1,
      });
      (item.aliases || []).forEach((alias) =>
        all.push({ side, text: alias, weight: 0.8 })
      );
      (item.acronyms || []).forEach((acronym) =>
        all.push({ side, text: acronym, weight: 0.9 })
      );
    });
  };
  pushSide(mapping.nutanixTerms, "nutanix");
  pushSide(mapping.vmwareTerms, "vmware");
  return all;
}

function makeSearchDocs(mappings) {
  return mappings.map((mapping) => {
    const terms = flattenTerms(mapping);
    return {
      id: mapping.termId,
      mapping,
      termBlob: terms.map((item) => item.text).join(" | "),
      nutanixBlob: terms
        .filter((term) => term.side === "nutanix")
        .map((term) => term.text)
        .join(" | "),
      vmwareBlob: terms
        .filter((term) => term.side === "vmware")
        .map((term) => term.text)
        .join(" | "),
    };
  });
}

function createSearchIndex(input) {
  const docs =
    input.length && input[0] && input[0].mapping && input[0].termBlob
      ? input
      : makeSearchDocs(input);
  const fuse = new Fuse(docs, {
    includeScore: true,
    threshold: 0.35,
    ignoreLocation: true,
    keys: [
      { name: "termBlob", weight: 0.7 },
      { name: "nutanixBlob", weight: 0.15 },
      { name: "vmwareBlob", weight: 0.15 },
    ],
  });

  return {
    search(query, limit = 20) {
      // #region agent log
      debugLog("S1-S4", "backend/src/search.js:search:entry", "Search request received", {
        query,
        limit,
      });
      // #endregion
      const raw = fuse.search(query, { limit: 200 });
      // #region agent log
      // eslint-disable-next-line no-console
      console.log("[agent-debug][S1-S4] raw-ranking", {
        query,
        rawCount: raw.length,
        top3: raw.slice(0, 3).map((entry) => ({
          termId: entry.item.mapping.termId,
          score: entry.score,
          nutanix: entry.item.mapping.nutanixTerms?.[0]?.name || null,
          vmware: entry.item.mapping.vmwareTerms?.[0]?.name || null,
        })),
      });
      // #endregion
      // #region agent log
      debugLog(
        "S1-S4",
        "backend/src/search.js:search:raw",
        "Raw Fuse ranking before direction filter",
        {
          query,
          rawCount: raw.length,
          top5: raw.slice(0, 5).map((entry) => ({
            termId: entry.item.mapping.termId,
            score: entry.score,
            sourceSide: entry.item.mapping.sourceSide,
            nutanix: entry.item.mapping.nutanixTerms?.[0]?.name || null,
            vmware: entry.item.mapping.vmwareTerms?.[0]?.name || null,
            termBlob: entry.item.termBlob,
          })),
        }
      );
      // #endregion
      // #region agent log
      // eslint-disable-next-line no-console
      console.log("[agent-debug][S1-S4] filtered-ranking", {
        query,
        filteredCount: raw.length,
        top3: raw.slice(0, 3).map((entry) => ({
          termId: entry.item.mapping.termId,
          score: entry.score,
          nutanix: entry.item.mapping.nutanixTerms?.[0]?.name || null,
          vmware: entry.item.mapping.vmwareTerms?.[0]?.name || null,
        })),
      });
      // #endregion
      // #region agent log
      debugLog(
        "S1-S4",
        "backend/src/search.js:search:filtered",
        "Search ranking after direction filter",
        {
          query,
          filteredCount: raw.length,
          top5: raw.slice(0, 5).map((entry) => ({
            termId: entry.item.mapping.termId,
            score: entry.score,
            sourceSide: entry.item.mapping.sourceSide,
            nutanix: entry.item.mapping.nutanixTerms?.[0]?.name || null,
            vmware: entry.item.mapping.vmwareTerms?.[0]?.name || null,
          })),
        }
      );
      // #endregion
      return raw.slice(0, limit).map((entry) => ({
        score: entry.score,
        ...entry.item.mapping,
      }));
    },
  };
}

module.exports = { createSearchIndex };
