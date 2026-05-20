// ── MAIN.JS ──────────────────────────────────────────────────────────────────
// Entry point. Loads config.json and content.json, then initialises the UI.

// ── FETCH HELPERS ─────────────────────────────────────────────────────────────

// Fetch and cache a dataset's text + graph data.
// Attaches _text (HTML string) and _graph (parsed JSON) to the dataset object.
async function fetchDataset(ds) {
  if (ds._text && ds._graph) return ds; // already cached
  const [textRes, graphRes] = await Promise.all([
    fetch(ds.textPath),
    fetch(ds.graphPath),
  ]);
  ds._text  = await textRes.text();
  ds._graph = await graphRes.json();
  // Expose graph data under ds.graph for graph.js
  ds.graph  = ds._graph;
  return ds;
}

// ── INIT ──────────────────────────────────────────────────────────────────────
async function init() {
  try {
    // 1. Load config and content in parallel
    const [configRes, contentRes] = await Promise.all([
      fetch("data/config.json"),
      fetch("data/content.json"),
    ]);
    const config  = await configRes.json();
    const content = await contentRes.json();

    // 2. Apply config — group colors and directed flag (read by graph.js)
    groupColors = {};
    config.groups.forEach(g => { groupColors[g.id] = g.color; });
    isDirected = config.graph.directed;

    // 3. Populate all static site text from content.json
    populateContent(content);

    // 4. Build chips and initialise UI
    buildChips();

  } catch (err) {
    console.error("Failed to load config or content:", err);
  }
}

document.addEventListener("DOMContentLoaded", init);
