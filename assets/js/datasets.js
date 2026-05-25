// ── DATASET REGISTRY ───────────────────────────────────────────────────────
// To add a new dataset:
//   1. Create data/texts/yourfile.html
//   2. Create data/graphs/yourfile.json
//   3. Add one entry below — id, label, color, textPath, graphPath

const datasets = [
  {
    id:        "Hades_1",
    label:     "Hades Report 1",
    color:     "#3B6D11",
    textPath:  "data/texts/Hades_1.html",
    graphPath: "data/graphs/Hades_1.json",
  },
  {
    id:        "Hades_2",
    label:     "Hades Report 2",
    color:     "#185FA5",
    textPath:  "data/texts/Hades_2.html",
    graphPath: "data/graphs/Hades_2.json",
  },
  {
    id:        "nepagent",
    label:     "Nepagent Report",
    color:     "#534AB7",
    textPath:  "data/texts/nepagent.html",
    graphPath: "data/graphs/nepagent.json",
  },
];
