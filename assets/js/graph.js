// ── GRAPH.JS ────────────────────────────────────────────────────────────────
// All D3 rendering: individual, merged, overlaid modes.
// Zoom, pan, node drag, and tooltips are all handled here.
// Reads groupColors and directed from config (set by main.js).

const CROSS_COLOR = "#e07b39";

// Set by main.js after config loads
let groupColors = {};
let isDirected  = false;

// ── TOOLTIP ──────────────────────────────────────────────────────────────────
const tt = document.getElementById("tt");
function showTT(e, text) { tt.textContent = text; tt.style.opacity = "1"; moveTT(e); }
function moveTT(e)        { tt.style.left = (e.clientX + 12) + "px"; tt.style.top = (e.clientY - 28) + "px"; }
function hideTT()         { tt.style.opacity = "0"; }

// ── ZOOM ─────────────────────────────────────────────────────────────────────
function applyZoom(svg, g) {
  const zoom = d3.zoom().scaleExtent([0.15, 5]).on("zoom", e => g.attr("transform", e.transform));
  svg.call(zoom);
}

// ── NODE DRAG ─────────────────────────────────────────────────────────────────
function nodeDrag(sim) {
  return d3.drag()
    .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
    .on("drag",  (e, d) => { d.fx = e.x; d.fy = e.y; })
    .on("end",   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });
}

// ── ARROW MARKER (directed graphs) ───────────────────────────────────────────
function addArrowMarker(svg, id, color) {
  svg.append("defs").append("marker")
    .attr("id", id)
    .attr("viewBox", "0 -4 8 8")
    .attr("refX", 24).attr("refY", 0)
    .attr("markerWidth", 6).attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path").attr("d", "M0,-4L8,0L0,4").attr("fill", color);
}

// ── ZOOM HINT ─────────────────────────────────────────────────────────────────
function addZoomHint(vp) {
  const h = document.createElement("div");
  h.className = "zoom-hint";
  h.textContent = "scroll to zoom · drag to pan";
  vp.appendChild(h);
}

// ── INDIVIDUAL MODE ───────────────────────────────────────────────────────────
function renderIndividual(vp, resolvedDatasets) {
  const n    = resolvedDatasets.length;
  const cols = Math.min(n, 2);
  const rows = Math.ceil(n / cols);
  const W    = vp.clientWidth  || 600;
  const H    = vp.clientHeight || 520;
  const cw   = W / cols;
  const ch   = H / rows;

  const svg  = d3.select(vp).append("svg").attr("width", W).attr("height", Math.max(H, rows * 280));
  const root = svg.append("g");
  applyZoom(svg, root);

  if (isDirected) addArrowMarker(svg, "arrow-ind", "#bbb");

  resolvedDatasets.forEach((ds, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const ox  = col * cw,  oy  = row * ch;
    const g   = root.append("g");

    g.append("rect")
      .attr("x", ox + 4).attr("y", oy + 4)
      .attr("width", cw - 8).attr("height", ch - 8)
      .attr("rx", 8).attr("fill", "#fff").attr("stroke", "#e5e5e5").attr("stroke-width", 0.5);

    g.append("text")
      .attr("x", ox + 16).attr("y", oy + 22)
      .attr("font-size", "10px").attr("fill", "#aaa")
      .attr("font-weight", "500").attr("letter-spacing", "0.06em")
      .text(ds.label.toUpperCase());

    const nodes = ds.graph.nodes.map(n => ({
      ...n,
      x: ox + cw / 2 + (Math.random() - 0.5) * 60,
      y: oy + ch / 2 + (Math.random() - 0.5) * 60,
    }));
    const links = ds.graph.links.map(l => ({ source: l.source, target: l.target, weight: l.weight }));

    const sim = d3.forceSimulation(nodes)
      .force("link",    d3.forceLink(links).id(n => n.id).distance(55).strength(0.6))
      .force("charge",  d3.forceManyBody().strength(-160))
      .force("center",  d3.forceCenter(ox + cw / 2, oy + ch / 2 + 10))
      .force("collide", d3.forceCollide(26))
      .force("bound",   () => nodes.forEach(n => {
        n.x = Math.max(ox + 20, Math.min(ox + cw - 20, n.x));
        n.y = Math.max(oy + 30, Math.min(oy + ch - 12, n.y));
      }));

    const link = g.append("g").selectAll("line").data(links).join("line")
      .attr("stroke", "#ddd")
      .attr("stroke-width", l => Math.sqrt(l.weight))
      .attr("marker-end", isDirected ? "url(#arrow-ind)" : null);

    const node = g.append("g").selectAll("g").data(nodes).join("g").call(nodeDrag(sim));
    node.append("circle")
      .attr("r", 16)
      .attr("fill",   n => (groupColors[n.group] || "#888") + "22")
      .attr("stroke", n =>  groupColors[n.group] || "#888")
      .attr("stroke-width", 1.5);
    node.append("text")
      .attr("text-anchor", "middle").attr("dy", "0.35em")
      .attr("font-size", "9px").attr("fill", "#333").attr("pointer-events", "none")
      .text(n => n.label.length > 9 ? n.label.slice(0, 8) + "…" : n.label);
    node.on("mouseover", (e, n) => showTT(e, n.label)).on("mousemove", moveTT).on("mouseout", hideTT);

    sim.on("tick", () => {
      link.attr("x1", l => l.source.x).attr("y1", l => l.source.y)
          .attr("x2", l => l.target.x).attr("y2", l => l.target.y);
      node.attr("transform", n => `translate(${n.x},${n.y})`);
    });
  });

  addZoomHint(vp);
}

// ── MERGED MODE ───────────────────────────────────────────────────────────────
function renderMerged(vp, resolvedDatasets) {
  const W = vp.clientWidth  || 600;
  const H = vp.clientHeight || 520;

  // Merge nodes: same label => one node, tagged with all source datasets
  const nodeMap = {};
  resolvedDatasets.forEach(ds => {
    ds.graph.nodes.forEach(n => {
      if (!nodeMap[n.label]) nodeMap[n.label] = { id: n.label, label: n.label, group: n.group, sources: [ds.id] };
      else if (!nodeMap[n.label].sources.includes(ds.id)) nodeMap[n.label].sources.push(ds.id);
    });
  });
  const nodes = Object.values(nodeMap);

  // Build links (deduplicated)
  const linkSet = new Set(), links = [];
  resolvedDatasets.forEach(ds => {
    const byId = Object.fromEntries(ds.graph.nodes.map(n => [n.id, n.label]));
    ds.graph.links.forEach(l => {
      const sl = byId[l.source], tl = byId[l.target];
      if (!sl || !tl) return;
      const key = [sl, tl].sort().join("|||");
      if (!linkSet.has(key)) { linkSet.add(key); links.push({ source: sl, target: tl, weight: l.weight }); }
    });
  });

  const svg  = d3.select(vp).append("svg").attr("width", W).attr("height", H);
  const root = svg.append("g");
  applyZoom(svg, root);
  if (isDirected) addArrowMarker(svg, "arrow-mrg", "#bbb");

  const sim = d3.forceSimulation(nodes)
    .force("link",    d3.forceLink(links).id(d => d.id).distance(80).strength(0.5))
    .force("charge",  d3.forceManyBody().strength(-220))
    .force("center",  d3.forceCenter(W / 2, H / 2))
    .force("collide", d3.forceCollide(30));

  const link = root.append("g").selectAll("line").data(links).join("line")
    .attr("stroke", "#ddd")
    .attr("stroke-width", l => Math.sqrt(l.weight))
    .attr("marker-end", isDirected ? "url(#arrow-mrg)" : null);

  const node = root.append("g").selectAll("g").data(nodes).join("g").call(nodeDrag(sim));

  // Pie-segment fill for shared nodes; solid fill for single-source nodes
  node.each(function(d) {
    const g = d3.select(this);
    const r = d.sources.length > 1 ? 22 : 17;
    if (d.sources.length > 1) {
      d.sources.forEach((sid, i) => {
        const ds  = resolvedDatasets.find(x => x.id === sid);
        const a0  = (i / d.sources.length) * 2 * Math.PI - Math.PI / 2;
        const a1  = ((i + 1) / d.sources.length) * 2 * Math.PI - Math.PI / 2;
        const path = `M0,0 L${r * Math.cos(a0)},${r * Math.sin(a0)} A${r},${r},0,0,1,${r * Math.cos(a1)},${r * Math.sin(a1)} Z`;
        g.append("path").attr("d", path).attr("fill", ds.color + "66");
      });
      g.append("circle").attr("r", r).attr("fill", "none")
        .attr("stroke", CROSS_COLOR).attr("stroke-width", 2).attr("stroke-dasharray", "5,2");
    } else {
      const color = groupColors[d.group] || "#888";
      g.append("circle").attr("r", r).attr("fill", color + "22").attr("stroke", color).attr("stroke-width", 1.5);
    }
  });

  node.append("text")
    .attr("text-anchor", "middle").attr("dy", "0.35em")
    .attr("font-size", "9px").attr("fill", "#333").attr("pointer-events", "none")
    .text(d => d.label.length > 9 ? d.label.slice(0, 8) + "…" : d.label);

  node.on("mouseover", (e, d) => {
    const src = d.sources.length > 1
      ? `${d.label} — shared: ${d.sources.map(sid => resolvedDatasets.find(x => x.id === sid).label).join(", ")}`
      : d.label;
    showTT(e, src);
  }).on("mousemove", moveTT).on("mouseout", hideTT);

  sim.on("tick", () => {
    link.attr("x1", l => l.source.x).attr("y1", l => l.source.y)
        .attr("x2", l => l.target.x).attr("y2", l => l.target.y);
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  });

  addZoomHint(vp);
}

// ── OVERLAID MODE ─────────────────────────────────────────────────────────────
function renderOverlaid(vp, resolvedDatasets) {
  const n    = resolvedDatasets.length;
  const cols = Math.min(n, 2);
  const rows = Math.ceil(n / cols);
  const W    = vp.clientWidth  || 600;
  const H    = vp.clientHeight || 520;
  const cw   = W / cols;
  const ch   = H / rows;

  const allNodes = [], nodeReg = {};

  resolvedDatasets.forEach((ds, fi) => {
    const cx = (fi % cols) * cw + cw / 2;
    const cy = Math.floor(fi / cols) * ch + ch / 2;
    nodeReg[ds.id] = {};
    ds.graph.nodes.forEach(n => {
      const node = { uid: `${ds.id}::${n.id}`, id: n.id, label: n.label, datasetId: ds.id, group: n.group, cx, cy,
        x: cx + (Math.random() - 0.5) * 70, y: cy + (Math.random() - 0.5) * 70 };
      allNodes.push(node);
      nodeReg[ds.id][n.id] = node;
    });
  });

  const allLinks = [];
  resolvedDatasets.forEach(ds => {
    ds.graph.links.forEach(l => {
      const s = nodeReg[ds.id][l.source], t = nodeReg[ds.id][l.target];
      if (s && t) allLinks.push({ source: s.uid, target: t.uid, weight: l.weight, cross: false });
    });
  });

  // Cross-file edges between nodes sharing the same label
  for (let i = 0; i < resolvedDatasets.length; i++) {
    for (let j = i + 1; j < resolvedDatasets.length; j++) {
      const da = resolvedDatasets[i], db = resolvedDatasets[j];
      da.graph.nodes.forEach(na => {
        const nb = db.graph.nodes.find(nb => nb.label === na.label);
        if (nb) allLinks.push({ source: nodeReg[da.id][na.id].uid, target: nodeReg[db.id][nb.id].uid, weight: 2, cross: true });
      });
    }
  }

  const nodeById  = Object.fromEntries(allNodes.map(n => [n.uid, n]));
  const resolved  = allLinks.map(l => ({ ...l, source: nodeById[l.source] || l.source, target: nodeById[l.target] || l.target }));

  const svg  = d3.select(vp).append("svg").attr("width", W).attr("height", Math.max(H, rows * 280));
  const root = svg.append("g");
  applyZoom(svg, root);
  if (isDirected) addArrowMarker(svg, "arrow-ovl", "#bbb");

  const sim = d3.forceSimulation(allNodes)
    .force("link",    d3.forceLink(resolved).id(d => d.uid).distance(d => d.cross ? 130 : 55).strength(d => d.cross ? 0.04 : 0.6))
    .force("charge",  d3.forceManyBody().strength(-150))
    .force("cluster", () => allNodes.forEach(n => { n.vx += (n.cx - n.x) * 0.05; n.vy += (n.cy - n.y) * 0.05; }))
    .force("collide", d3.forceCollide(24));

  const linkSel = root.append("g").selectAll("line").data(resolved).join("line")
    .attr("stroke",           l => l.cross ? CROSS_COLOR : "#ddd")
    .attr("stroke-width",     l => l.cross ? 1.8 : Math.sqrt(l.weight))
    .attr("stroke-dasharray", l => l.cross ? "6,3" : "none")
    .attr("opacity",          l => l.cross ? 0.75 : 1)
    .attr("marker-end", isDirected ? l => l.cross ? null : "url(#arrow-ovl)" : null);

  const nodeSel = root.append("g").selectAll("g").data(allNodes).join("g").call(nodeDrag(sim));
  nodeSel.append("circle").attr("r", 17)
    .attr("fill",   d => { const ds = resolvedDatasets.find(x => x.id === d.datasetId); return ds.color + "22"; })
    .attr("stroke", d => { const ds = resolvedDatasets.find(x => x.id === d.datasetId); return ds.color; })
    .attr("stroke-width", 1.5);
  nodeSel.append("text")
    .attr("text-anchor", "middle").attr("dy", "0.35em")
    .attr("font-size", "9px").attr("fill", "#333").attr("pointer-events", "none")
    .text(d => d.label.length > 9 ? d.label.slice(0, 8) + "…" : d.label);

  nodeSel.on("mouseover", (e, d) => {
    const ds = resolvedDatasets.find(x => x.id === d.datasetId);
    showTT(e, `${d.label} (${ds.label})`);
  }).on("mousemove", moveTT).on("mouseout", hideTT);

  sim.on("tick", () => {
    linkSel.attr("x1", l => l.source.x).attr("y1", l => l.source.y)
           .attr("x2", l => l.target.x).attr("y2", l => l.target.y);
    nodeSel.attr("transform", d => `translate(${d.x},${d.y})`);
  });

  addZoomHint(vp);
}
