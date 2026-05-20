// ── DATASET REGISTRY ───────────────────────────────────────────────────────
// To add a new dataset:
//   1. Create data/texts/yourfile.html
//   2. Create data/graphs/yourfile.json
//   3. Add one entry below — id, label, color, textPath, graphPath

const datasets = [
  {
    id:        "climate",
    label:     "Climate Systems",
    color:     "#3B6D11",
    textPath:  "data/texts/climate.html",
    graphPath: "data/graphs/climate.json",
  },
  {
    id:        "urban",
    label:     "Urban Networks",
    color:     "#185FA5",
    textPath:  "data/texts/urban.html",
    graphPath: "data/graphs/urban.json",
  },
  {
    id:        "language",
    label:     "Language Models",
    color:     "#534AB7",
    textPath:  "data/texts/language.html",
    graphPath: "data/graphs/language.json",
  },
  {
    id:        "ecology",
    label:     "Ecosystem Dynamics",
    color:     "#993C1D",
    textPath:  "data/texts/ecology.html",
    graphPath: "data/graphs/ecology.json",
  },
];
