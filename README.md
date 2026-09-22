# InSitu SQL

> A local-first, in-browser SQL analytics and tabular exploration studio powered by DuckDB-WASM and Apache Arrow.

---

## Core Value Propositions

- **100% Client-Side Execution**: Vectorized analytical SQL execution inside an isolated Web Worker via DuckDB-WASM and Apache Arrow IPC without server round-trips.
- **Zero-Backend Architecture**: Completely serverless, stateless, and self-contained within the browser runtime.
- **Complete Data Privacy**: Zero remote telemetry, tracking, or network ingestion—sensitive datasets, PII, and query strings never leave the local machine.
- **Zero Infrastructure Cost**: Deploys as a static Next.js frontend with zero cloud database overhead or backend maintenance fees.

---

## Key Capabilities

- **Multi-Format Ingestion**: Native drag-and-drop and file-picker ingestion supporting:
  - Apache Parquet (`.parquet`)
  - Delimited text (`.csv`, `.tsv`, `.txt`) with automatic dialect & type sniffing
  - Structured JSON (`.json`, `.ndjson`) with automatic schema flattening
  - Excel Workbooks (`.xlsx`, `.xls`) parsed in-memory via SheetJS
- **Querying Engine**: Full SQL support (DDL, DML, aggregations, window functions) with DuckDB syntax error coordinate tracking (exact line and column highlighting).
- **Auto-Refresh Live Polling**: Configurable query execution intervals (Off, 5s, 10s, 30s, 60s) for live local monitoring.
- **Code Editor**: Monaco SQL Editor featuring multi-tab sessions, query history tracking, syntax highlighting, and `localStorage` session persistence.
- **Virtualized Data Grid**: TanStack Table v8 + TanStack Virtual v3 rendering 50,000+ rows at consistent 60 FPS with instant cell-to-clipboard copying, column sorting, and cross-column search filtering.
- **Interactive Data Visualization**: Automated dimension and metric inference into configurable Bar, Line, and Area charts powered by Recharts with row-limit controls.
- **Multi-Format Export**: One-click memory-to-disk exports formatted as RFC-compliant CSV, pretty-printed JSON, or GitHub-Flavored Markdown tables.
- **5 Studio Themes**: Live hot-swappable color themes: Obsidian Dark, Midnight Navy, Tokyo Neon, Nordic Slate, and high-contrast Paper Minimal Light.

---

## Core Tech Stack

| Component | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, React 19) |
| **Language** | TypeScript 5 (Strict Mode) |
| **Database Engine** | DuckDB-WASM (`@duckdb/duckdb-wasm`) + Apache Arrow |
| **SQL Editor** | Monaco Editor (`@monaco-editor/react`) |
| **Table & Virtualization** | TanStack Table v8 (`@tanstack/react-table`) + TanStack Virtual v3 |
| **Visualization** | Recharts |
| **File Parsers** | SheetJS (`xlsx`) for Excel, native DuckDB readers for Parquet, CSV, and JSON |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/postcss`, CSS Variables) |

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm run start
```

---

## Deployment Note

When deploying to Vercel, Cloudflare Pages, or Netlify, ensure `SharedArrayBuffer` support is enabled via the Cross-Origin Isolation headers configured in [`next.config.mjs`](next.config.mjs):

```javascript
{
  key: 'Cross-Origin-Opener-Policy',
  value: 'same-origin',
},
{
  key: 'Cross-Origin-Embedder-Policy',
  value: 'credentialless',
}
```

---

## License

Released under the [MIT License](LICENSE).
