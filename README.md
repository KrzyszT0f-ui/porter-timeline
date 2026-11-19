# Porter's Five Forces Timeline Engine

**Live Application:** [https://porter-timeline.vercel.app](https://porter-timeline.vercel.app)

An interactive, multi-company strategic analysis web application (PWA) designed to visualize how competitive dynamics and industry moats evolve over multi-decade financial trajectories.

---

## Core Capabilities

* **Historical Timeline Scrubbing (1993–2026):** Smoothly navigate through distinct strategic eras (starting with NVIDIA Corporation) to observe structural shifts in competitive positioning alongside annual financial KPIs (revenue, gross margin, operating margin, net income, R&D spend).
* **Dynamic Five Forces Radar:** Interactive SVG pentagon chart scoring Competitive Rivalry, Supplier Power, Buyer Power, Threat of Substitution, and Threat of New Entry on a 1–5 scale, paired with historical rationale for each selected year.
* **Year-over-Year Strategic Comparison:** Overlay any two historical periods on the radar chart to quantify structural moat expansion or compression.
* **Financial & Segment Breakdown:** Multi-decade revenue trajectory chart supporting both linear and logarithmic scales, combined with revenue mix breakdowns by business segment.
* **Offline-First Progressive Web App (PWA):** Installable as a standalone application on desktop (Windows/macOS) and mobile devices (Android/iOS) with local service worker caching.

---

## Architecture & Extensibility

The engine decouples UI visualization from company datasets through a modular registry pattern:

```text
src/
├── data/
│   ├── nvda.json        # Historical dataset (1993–2026)
│   └── registry.js      # Central company index and selector binding
├── components/          # Radar chart, revenue trajectory, and mobile-docked timeline controls
└── App.jsx              # Core state management and comparison engine
