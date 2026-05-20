// ── UI.JS ───────────────────────────────────────────────────────────────────
// Chips, tabs, text panel toggle, legend, mode switching.
// Calls into graph.js for rendering; reads state from main.js.

// ── STATE ─────────────────────────────────────────────────────────────────────
let selected    = [];   // array of dataset ids currently selected
let activeTab   = null; // id of the text tab currently shown
let mode        = "individual";
let textVisible = true;

// ── NAVIGATION ────────────────────────────────────────────────────────────────
function goto(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

// ── CHIPS ─────────────────────────────────────────────────────────────────────
function buildChips() {
  const el = document.getElementById("chips");
  datasets.forEach(ds => {
    const c = document.createElement("div");
    c.className   = "chip";
    c.dataset.id  = ds.id;
    c.innerHTML   = `<span class="dot" style="background:${ds.color}"></span>${ds.label}`;
    c.addEventListener("click", () => toggleFile(ds.id));
    el.appendChild(c);
  });
}

function toggleFile(id) {
  if (selected.includes(id)) {
    selected  = selected.filter(s => s !== id);
    if (activeTab === id) activeTab = selected[0] || null;
  } else {
    selected.push(id);
    activeTab = id;
  }
  render();
}

// ── MODE TABS ─────────────────────────────────────────────────────────────────
function setMode(m) {
  mode = m;
  ["individual", "merged", "overlaid"].forEach(x =>
    document.getElementById("tab-" + x).classList.toggle("active", x === m)
  );
  renderGraph();
}

// ── TEXT PANEL TOGGLE ─────────────────────────────────────────────────────────
function toggleText() {
  textVisible = !textVisible;
  document.getElementById("main-panel").classList.toggle("text-hidden", !textVisible);
  document.getElementById("toggle-label").textContent = textVisible ? "Hide text" : "Show text";
  document.getElementById("toggle-icon").style.transform = textVisible ? "" : "scaleX(-1)";
  setTimeout(renderGraph, 320); // re-render after CSS transition completes
}

// ── FULL RENDER ───────────────────────────────────────────────────────────────
function render() {
  renderChips();
  renderTabs();
  renderTextBody();
  renderLegend();
  renderGraph();
}

function renderChips() {
  document.querySelectorAll("#chips .chip").forEach(c =>
    c.classList.toggle("active", selected.includes(c.dataset.id))
  );
}

// ── TEXT TABS ─────────────────────────────────────────────────────────────────
function renderTabs() {
  const row = document.getElementById("tab-row");
  row.innerHTML = "";
  selected.forEach(id => {
    const ds = datasets.find(d => d.id === id);
    const t  = document.createElement("div");
    t.className = "tab-btn" + (activeTab === id ? " active" : "");
    t.innerHTML = `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${ds.color};margin-right:5px;vertical-align:1px"></span>${ds.label}`;
    t.addEventListener("click", () => { activeTab = id; renderTabs(); renderTextBody(); });
    row.appendChild(t);
  });
}

// ── TEXT BODY ─────────────────────────────────────────────────────────────────
function renderTextBody() {
  const el = document.getElementById("text-body");
  if (!activeTab) {
    el.innerHTML = `<div class="text-placeholder">Select a file to read its content</div>`;
    return;
  }
  const ds = datasets.find(d => d.id === activeTab);
  if (ds._text) {
    el.innerHTML = ds._text;
  } else {
    el.innerHTML = `<div class="text-placeholder">Loading…</div>`;
    fetchDataset(ds).then(() => { if (activeTab === ds.id) el.innerHTML = ds._text; });
  }
}

// ── LEGEND ────────────────────────────────────────────────────────────────────
function renderLegend() {
  const el = document.getElementById("legend-row");
  el.innerHTML = "";
  selected.forEach(id => {
    const ds   = datasets.find(d => d.id === id);
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `<div class="legend-dot" style="background:${ds.color}"></div>${ds.label}`;
    el.appendChild(item);
  });
}

// ── GRAPH RENDER ──────────────────────────────────────────────────────────────
async function renderGraph() {
  const vp        = document.getElementById("graph-viewport");
  const empty     = document.getElementById("graph-empty");
  const count     = document.getElementById("graph-count");
  const crossNote = document.getElementById("cross-note");

  // Remove previous SVG
  vp.querySelectorAll("svg").forEach(s => s.remove());
  vp.querySelectorAll(".zoom-hint").forEach(h => h.remove());

  if (!selected.length) {
    empty.style.display  = "flex";
    count.textContent    = "";
    crossNote.style.display = "none";
    return;
  }

  empty.style.display = "none";
  count.textContent   = `${selected.length} file${selected.length > 1 ? "s" : ""}`;

  // Fetch all selected datasets (cached after first fetch)
  const resolvedDatasets = await Promise.all(
    selected.map(id => fetchDataset(datasets.find(d => d.id === id)))
  );

  const hasCross = mode !== "individual" && selected.length > 1;
  crossNote.style.display = hasCross ? "flex" : "none";

  if      (mode === "individual") renderIndividual(vp, resolvedDatasets);
  else if (mode === "merged")     renderMerged(vp, resolvedDatasets);
  else if (mode === "overlaid")   renderOverlaid(vp, resolvedDatasets);
}

// ── CONTENT POPULATION (from content.json) ────────────────────────────────────
function populateContent(content) {
  // Page & nav
  document.getElementById("page-title").textContent  = content.site.pageTitle;
  document.getElementById("nav-logo").textContent    = content.site.title;

  // Hero
  document.getElementById("hero-tag").textContent        = content.hero.tag;
  document.getElementById("hero-headline").textContent   = content.hero.headline;
  document.getElementById("hero-subheading").textContent = content.hero.subheading;
  document.getElementById("hero-cta").textContent        = content.hero.ctaLabel;

  // About
  document.getElementById("about-label").textContent   = content.about.label;
  document.getElementById("about-heading").textContent = content.about.heading;
  document.getElementById("about-body").textContent    = content.about.body;
  const details = document.getElementById("about-details");
  details.innerHTML = "";
  content.about.details.forEach(d => {
    const div = document.createElement("div");
    div.className = "detail-item";
    div.innerHTML = `<h4>${d.title}</h4><p>${d.body}</p>`;
    details.appendChild(div);
  });

  // Demo
  document.getElementById("demo-label").textContent      = content.demo.label;
  document.getElementById("demo-heading").textContent    = content.demo.heading;
  document.getElementById("demo-subheading").textContent = content.demo.subheading;

  // Highlights
  document.getElementById("highlights-label").textContent   = content.highlights.label;
  document.getElementById("highlights-heading").textContent = content.highlights.heading;
  const cards = document.getElementById("highlights-cards");
  cards.innerHTML = "";
  content.highlights.cards.forEach(c => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<div class="card-num">${c.number}</div><h4>${c.title}</h4><p>${c.body}</p>`;
    cards.appendChild(div);
  });

  // Footer
  document.getElementById("footer-left").textContent  = content.footer.left;
  document.getElementById("footer-right").textContent = content.footer.right;
}
