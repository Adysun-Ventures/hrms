# FAILED EXPERIMENT & FIX: esbuild Inlined React-PDF Bundling

## Metadata
- **ID**: EXP-001
- **Date**: 2026-11-13
- **Status**: RESOLVED EXPERIMENT
- **Feature**: Standalone CLI Rendering

---

## Problem
We needed to run `StatementDocument.jsx` from Node.js CLI without starting the Vite dev server.

---

## What We Tried
We bundled `StatementDocument.jsx` into a single standalone file using `npx esbuild app/pdf/StatementDocument.jsx --bundle --format=esm --outfile=bundle.mjs`.

---

## Result: Failed
The bundle failed at runtime with:
```
Error: Cannot find module '#standard-fonts/Helvetica'
```
Because `@react-pdf/renderer` internally relies on subpath imports and font binary assets that cannot be inlined cleanly by esbuild without specialized loaders.

---

## Solution
Use `--packages=external` when bundling with esbuild:
```bash
npx esbuild scripts/render_cli.jsx --bundle --format=esm --packages=external --outfile=scripts/render_cli.mjs --jsx=automatic
```
This leaves `@react-pdf/renderer` as an external import that Node resolves from `node_modules`, while bundling all project JSX cleanly.

---

## Lessons Learned
Never try to fully inline `@react-pdf/renderer` into a standalone JS file; always keep `--packages=external` for CLI bundles.
