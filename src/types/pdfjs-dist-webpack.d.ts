declare module "pdfjs-dist/webpack.mjs" {
  // pdfjs-dist's webpack entrypoint doesn't ship TS typings for this path.
  // We only need it for dynamic import to auto-wire the worker in the browser.
  const pdfjs: unknown;
  export = pdfjs;
}

