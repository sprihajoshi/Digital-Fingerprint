# Digital-Fingerprint

An interactive network graph explorer for visualising relationships in text. Built with plain HTML, CSS, and D3.js — no build tools required.

---

## File structure

```
research-demo/
├── index.html               ← page shell (no text to edit here)
├── assets/
│   ├── css/
│   │   └── style.css        ← all styles
│   └── js/
│       ├── datasets.js      ← dataset registry (add new files here)
│       ├── graph.js         ← D3 rendering logic
│       ├── ui.js            ← UI components and state
│       └── main.js          ← entry point, loads config + content
├── data/
│   ├── config.json          ← graph type, node groups and colors
│   ├── content.json         ← all site text (hero, about, highlights, footer)
│   ├── texts/
│   │   ├── climate.html     ← left-panel text per dataset
│   │   ├── urban.html
│   │   ├── language.html
│   │   └── ecology.html
│   └── graphs/
│       ├── climate.json     ← nodes and links per dataset
│       ├── urban.json
│       ├── language.json
│       └── ecology.json
└── README.md
```

---

## Where to edit things

| What you want to change | File to edit |
|---|---|
| Hero, about, highlights, footer text | `data/content.json` |
| Node group names and colors | `data/config.json` |
| Directed vs undirected graph | `data/config.json` |
| Add / remove a dataset | `assets/js/datasets.js` + new files in `data/` |
| Left-panel text for a dataset | `data/texts/<name>.html` |
| Nodes and edges for a dataset | `data/graphs/<name>.json` |
| Page styles | `assets/css/style.css` |

---

## Adding a new dataset

**Step 1 — Create the text file** `data/texts/myfile.html`

```html
<h3>My Dataset Title</h3>
<p>First paragraph describing the content...</p>
<p>Second paragraph with more detail.</p>
```

**Step 2 — Create the graph file** `data/graphs/myfile.json`

```json
{
  "nodes": [
    { "id": "node1", "label": "Concept A", "group": 1 },
    { "id": "node2", "label": "Concept B", "group": 2 },
    { "id": "node3", "label": "Outcome C", "group": 3 }
  ],
  "links": [
    { "source": "node1", "target": "node2", "weight": 3 },
    { "source": "node2", "target": "node3", "weight": 2 }
  ]
}
```

**Step 3 — Register the dataset** in `assets/js/datasets.js`

```javascript
{
  id:        "myfile",
  label:     "My Dataset",
  color:     "#e07b39",
  textPath:  "data/texts/myfile.html",
  graphPath: "data/graphs/myfile.json",
},
```

That's it. The dataset will appear as a chip in the demo automatically.

---

## Graph JSON reference

### Nodes

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique internal key, no spaces |
| `label` | string | Text shown on the node in the graph |
| `group` | number | Group id (1, 2, or 3) — controls node color |

### Links

| Field | Type | Description |
|---|---|---|
| `source` | string | `id` of the source node |
| `target` | string | `id` of the target node |
| `weight` | number | Edge thickness: 1 = thin, 2 = medium, 3 = thick |

### Cross-file edges

Cross-file edges are **automatic**. If two datasets share a node with the same `label`, the app draws an orange dashed edge between them in Merged and Overlaid modes. No extra configuration needed.

---

## Configuring groups and colors (`data/config.json`)

```json
{
  "graph": {
    "directed": false
  },
  "groups": [
    { "id": 1, "name": "Primary",   "color": "#378ADD" },
    { "id": 2, "name": "Secondary", "color": "#1D9E75" },
    { "id": 3, "name": "Outcomes",  "color": "#7F77DD" }
  ]
}
```

- Set `directed` to `true` to draw arrows on edges
- Add more groups by adding entries to the `groups` array and using the new `id` in your graph JSON files
- Change any `color` value to update that group's color site-wide

---

## Deploying to GitHub Pages

1. Push this repository to GitHub
2. Go to **Settings → Pages**
3. Under **Source**, select `Deploy from a branch`
4. Set branch to `main`, folder to `/ (root)`
5. Click **Save**

Your site will be live at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

> **Note:** GitHub Pages serves files over HTTPS, which allows the `fetch()` calls in `main.js` to load the JSON and HTML files correctly. Do not open `index.html` directly from your file system — use a local server instead (e.g. `npx serve .` or the VS Code Live Server extension).

---

## Running locally

```bash
# Using Node.js
npx serve .

# Using Python
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.
