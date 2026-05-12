import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const FILE_TYPES = ["md", "pdf", "ppt", "pptx", "csv", "json"];
const EXTENSION_TO_TYPE = {
  md: "md",
  markdown: "md",
  pdf: "pdf",
  ppt: "ppt",
  pptx: "ppt",
  csv: "csv",
  json: "json",
};

function App() {
  const [query, setQuery] = useState("");
  const [direction, setDirection] = useState("both");
  const [results, setResults] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sourceType, setSourceType] = useState("md");
  const [uploadFile, setUploadFile] = useState(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedId(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${API_BASE}/api/search?q=${encodeURIComponent(query)}&direction=${direction}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Search failed");
        setResults(data.results || []);
        if (data.results?.[0]) {
          setSelectedId(data.results[0].termId);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [query, direction]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedTerm(null);
      return;
    }
    async function loadDetails() {
      const res = await fetch(`${API_BASE}/api/terms/${selectedId}`);
      const data = await res.json();
      if (res.ok) setSelectedTerm(data);
    }
    loadDetails();
  }, [selectedId]);

  useEffect(() => {
    if (!selectedTerm) return;
    // #region agent log
    fetch("http://127.0.0.1:7478/ingest/1f81b619-cb46-4d3e-afe6-474efdacd3ff", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "f9a326",
      },
      body: JSON.stringify({
        sessionId: "f9a326",
        runId: "repro-2",
        hypothesisId: "H5",
        location: "frontend/src/App.jsx:selectedTerm:effect",
        message: "Selected term rendered in details panel",
        data: {
          termId: selectedTerm.termId,
          nutanixName: selectedTerm.nutanixTerms?.[0]?.name || null,
          vmwareName: selectedTerm.vmwareTerms?.[0]?.name || null,
          definition: selectedTerm.definition?.slice?.(0, 120) || null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [selectedTerm]);

  const statusText = useMemo(() => {
    if (!query.trim()) return "Start typing a Nutanix or VMware term.";
    if (isLoading) return "Searching...";
    if (error) return error;
    return `${results.length} result(s)`;
  }, [query, isLoading, error, results.length]);

  async function refreshSearchSelection() {
    if (!query.trim()) return;
    const res = await fetch(
      `${API_BASE}/api/search?q=${encodeURIComponent(query)}&direction=${direction}`
    );
    const data = await res.json();
    if (res.ok) {
      setResults(data.results || []);
      if (data.results?.[0]) {
        setSelectedId(data.results[0].termId);
      }
    }
  }

  async function handleImportSubmit(event) {
    event.preventDefault();
    setUploadStatus("");
    setIsUploading(true);
    // #region agent log
    fetch("http://127.0.0.1:7478/ingest/1f81b619-cb46-4d3e-afe6-474efdacd3ff", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "f9a326",
      },
      body: JSON.stringify({
        sessionId: "f9a326",
        runId: "repro-1",
        hypothesisId: "H1-H3",
        location: "frontend/src/App.jsx:handleImportSubmit:start",
        message: "Import submit started with UI state",
        data: {
          sourceType,
          uploadFileName: uploadFile?.name || null,
          uploadFileType: uploadFile?.type || null,
          hasUrl: Boolean(sourceUrl?.trim()),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    try {
      let res;
      if (sourceType === "url") {
        res = await fetch(`${API_BASE}/api/upload-and-import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceType: "url", url: sourceUrl.trim() }),
        });
      } else {
        if (!uploadFile) throw new Error("Select a file before importing.");
        const formData = new FormData();
        formData.append("sourceType", sourceType);
        formData.append("file", uploadFile);
        res = await fetch(`${API_BASE}/api/upload-and-import`, {
          method: "POST",
          body: formData,
        });
      }

      const data = await res.json();
      // #region agent log
      fetch("http://127.0.0.1:7478/ingest/1f81b619-cb46-4d3e-afe6-474efdacd3ff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "f9a326",
        },
        body: JSON.stringify({
          sessionId: "f9a326",
          runId: "repro-1",
          hypothesisId: "H1-H3",
          location: "frontend/src/App.jsx:handleImportSubmit:response",
          message: "Import endpoint responded",
          data: {
            sourceType,
            responseOk: res.ok,
            responseSourceType: data?.sourceType || null,
            acceptedCount: data?.accepted?.length || 0,
            rejectedCount: data?.rejected?.length || 0,
            firstAcceptedTermId: data?.accepted?.[0]?.termId || null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      if (!res.ok) throw new Error(data.error || "Import failed");

      setUploadStatus(
        `Imported ${data.accepted?.length || 0} accepted, ${
          data.rejected?.length || 0
        } rejected. Search index refreshed.`
      );
      await refreshSearchSelection();
      setUploadFile(null);
    } catch (err) {
      setUploadStatus(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">Nutanix Terminology Translator</p>
        <h1>Nutanix ↔ VMware Translator</h1>
        <p className="lede">
          Bidirectional term mapping with definitions and equivalence guidance.
        </p>
      </header>

      <section className="uploadCard">
        <h2>Add New Source</h2>
        <form className="uploadForm" onSubmit={handleImportSubmit}>
          <select
            value={sourceType}
            onChange={(event) => {
              setSourceType(event.target.value);
              setUploadStatus("");
            }}
          >
            <option value="md">Markdown (.md)</option>
            <option value="pdf">PDF (.pdf)</option>
            <option value="ppt">PowerPoint (.ppt/.pptx)</option>
            <option value="csv">CSV (.csv)</option>
            <option value="json">JSON (.json)</option>
            <option value="url">URL</option>
          </select>

          {sourceType === "url" ? (
            <input
              type="url"
              placeholder="https://example.com/doc"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              required
            />
          ) : (
            <input
              type="file"
              accept={FILE_TYPES.map((type) => `.${type}`).join(",")}
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setUploadFile(file);
                if (file?.name?.includes(".")) {
                  const ext = file.name.split(".").pop().toLowerCase();
                  const inferredType = EXTENSION_TO_TYPE[ext];
                  if (inferredType) setSourceType(inferredType);
                }
              }}
              required
            />
          )}

          <button type="submit" disabled={isUploading}>
            {isUploading ? "Importing..." : "Import and Refresh"}
          </button>
        </form>
        {uploadStatus ? <p className="status">{uploadStatus}</p> : null}
      </section>

      <section className="searchCard">
        <div className="searchTop">
          <input
            type="text"
            placeholder="Try vMotion, DRS, PC, AHV..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            value={direction}
            onChange={(event) => setDirection(event.target.value)}
          >
            <option value="both">Both directions</option>
            <option value="nutanixToVmware">Nutanix → VMware</option>
            <option value="vmwareToNutanix">VMware → Nutanix</option>
          </select>
        </div>
        <p className="status">{statusText}</p>
      </section>

      <main className="content">
        <section className="results">
          {results.map((item) => (
            <button
              key={item.termId}
              className={`result ${selectedId === item.termId ? "active" : ""}`}
              onClick={() => setSelectedId(item.termId)}
            >
              <strong>{item.nutanixTerms[0]?.name}</strong>
              <span>{item.vmwareTerms[0]?.name}</span>
              <em className={`badge ${item.equivalenceType}`}>
                {item.equivalenceType}
              </em>
            </button>
          ))}
        </section>

        <section className="details">
          {!selectedTerm ? (
            <p className="placeholder">Select a result to view details.</p>
          ) : (
            <>
              <h2>{selectedTerm.termId}</h2>
              <p>
                <strong>Nutanix:</strong>{" "}
                {selectedTerm.nutanixTerms.map((item) => item.name).join(", ")}
              </p>
              <p>
                <strong>VMware:</strong>{" "}
                {selectedTerm.vmwareTerms.map((item) => item.name).join(", ")}
              </p>
              <p>
                <strong>Definition:</strong> {selectedTerm.definition}
              </p>
              <p>
                <strong>Explanation:</strong> {selectedTerm.explanation}
              </p>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
