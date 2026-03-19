# Team Graph

An interactive force-directed graph visualizer for exploring, filtering, and editing team/company data. Built with React, D3.js, TypeScript, and Vite.

## Overview

Team Graph renders a collection of teams (and companies) as a zoomable, force-directed bubble graph. Each node represents a team — its size scales with member count, and its shape/color encodes metadata like validity, company status, and filter matches.

## Features

### Graph Visualization
- **Force-directed layout** powered by D3 — nodes repel, collide, and orbit radially by member count.
- **Dual renderer**: SVG for ≤300 nodes (interactive DOM elements), Canvas for >300 nodes (performant pixel rendering).
- **Zoom & pan** with mouse wheel / drag.
- **Dot grid background** for spatial reference.

### Node Encoding
| Visual | Meaning |
|---|---|
| **Circle** | Team |
| **Diamond (rhombus)** | Company |
| **Red fill** | Member count out of valid range (not 4–10) |
| **Red stroke ring** | Invalid team (takes priority over other rings) |
| **Green stroke ring** | Passes current filter criteria |
| **Dashed ring** | Unverified validity (`isValid === null`) |
| **Pulsing glow** | Member name matches search query |
| **★ above node** | Bookmarked |

### Filtering (Sidebar)
- **Search** — matches team names and individual member names.
- **Member count range** — slider for min/max (4–10 valid range).
- **Validity filter** — all / valid / invalid / unknown.
- **Type filter** — all / teams / companies.
- **Hide invalid** — removes invalid teams from the graph.
- **Hide filtered** — hides nodes that *match* the current filter.
- **Hide not filtered** — hides nodes that *don't match* the current filter (isolates results).

### Detail Panel
Click any node to open a slide-in panel with three tabs:
- **View** — member list with avatars, profile links, GitHub links, and company details.
- **Edit** — modify team name, member count, validity, company status, and company details. Changes are live and persisted to localStorage.
- **JSON** — raw JSON view with copy-to-clipboard.

### Bookmarks
- Star any team to save it. Switch to the **Saved** tab (bottom nav) to see only bookmarked teams.
- Bookmarks persist across sessions via localStorage.

### Data Management
- **Sample data** — ships with a bundled `sample.json` dataset.
- **Load custom JSON** — import your own team data file (must be an array of `TeamData` objects).
- **Export** — download the current working dataset as JSON.
- **Reset to sample** — discard edits and revert to built-in data.
- Data source indicator in the top bar shows whether you're viewing sample or custom data.

### Theming
- Dark mode (default) and light mode toggle in the top bar.
- All colors use CSS custom properties for consistent theming.

## Data Format

The app expects a JSON array of objects matching this schema:

```json
{
  "teamName": "string",
  "memberCount": 4,
  "isValid": true | false | null,
  "isCompany": true | false | null,
  "companyDetails": {
    "facebook": "https://..." | null,
    "website": "https://..." | null
  } | null,
  "members": [
    {
      "name": "string",
      "profileUrl": "https://...",
      "initials": "AB" | null,
      "githubId": "12345" | null,
      "picture": "https://..." | null
    }
  ]
}
```

### Validity Rules
- Teams with `memberCount` outside 4–10 are automatically marked invalid.
- Within range, validity can be manually set to valid, invalid, or unknown.

## Scraper

`scripts/scrape.js` is a browser console script for extracting team data from a SkillsRanker-style page. It scrapes team names, member names, profile URLs, avatars, and GitHub IDs, then copies the result as JSON to the clipboard.

## Tech Stack

- **React 18** + **TypeScript**
- **D3.js v7** — force simulation, zoom, SVG/Canvas rendering
- **Vite** — dev server and bundler
- **Tailwind CSS** — utility classes (used primarily for the design system tokens)
- **IBM Plex Mono** — monospace font throughout the UI

## Project Structure

```
src/
├── components/team-graph/
│   ├── TeamGraph.tsx        # Main orchestrator — state, filters, data management
│   ├── GraphRenderer.tsx    # D3 force graph (SVG + Canvas dual renderer)
│   ├── Sidebar.tsx          # Filter controls and saved teams list
│   ├── DetailPanel.tsx      # Slide-in panel (view/edit/json tabs)
│   ├── TopBar.tsx           # Header bar — stats, export, theme toggle
│   ├── BottomNav.tsx        # Explore / Saved tab switcher
│   ├── MiniTooltip.tsx      # Hover tooltip showing member names
│   ├── EmptyStates.tsx      # Loading and no-results overlays
│   ├── sampleData.ts        # Loads bundled sample.json
│   └── types.ts             # TypeScript interfaces and type definitions
├── data/
│   └── sample.json          # Bundled sample dataset
├── pages/
│   └── Index.tsx            # Root page — renders TeamGraph
└── index.css                # CSS variables / design tokens (dark + light themes)
scripts/
└── scrape.js                # Browser console scraper for data extraction
```

## Getting Started

```bash
npm install
npm run dev
```

Open the preview and explore the sample dataset. Use the sidebar to filter, click nodes to inspect, and load your own JSON file via the top bar.
