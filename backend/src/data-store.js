const fs = require("node:fs");
const path = require("node:path");
const {
  validateCompiledByIdFile,
  validateCompiledSearchFile,
} = require("../../shared/src/schema");
const { createSearchIndex } = require("./search");

const COMPILED_BY_ID_PATH = path.resolve(
  __dirname,
  "../../data/compiled/terms.byId.json"
);
const COMPILED_SEARCH_PATH = path.resolve(
  __dirname,
  "../../data/compiled/terms.search.json"
);

class DataStore {
  constructor() {
    this.records = [];
    this.search = createSearchIndex([]);
    this.byId = {};
  }

  load() {
    const byIdRaw = fs.readFileSync(COMPILED_BY_ID_PATH, "utf-8");
    const searchRaw = fs.readFileSync(COMPILED_SEARCH_PATH, "utf-8");
    const byIdParsed = validateCompiledByIdFile(JSON.parse(byIdRaw));
    const searchParsed = validateCompiledSearchFile(JSON.parse(searchRaw));
    this.byId = byIdParsed.byId;
    this.records = Object.values(this.byId);
    this.search = createSearchIndex(searchParsed.docs);
  }

  getById(id) {
    return this.byId[id] || null;
  }
}

module.exports = {
  DataStore,
  COMPILED_BY_ID_PATH,
  COMPILED_SEARCH_PATH,
};
