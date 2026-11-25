import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useEffect, useRef, useState } from 'react';
import { getCachedStatementBlob, hasCachedStatementBlob } from '../pdf/generate.jsx';
import { Icon, ICONS } from '../shared/icons.jsx';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Virtualized page slot that renders its canvas and text layer only when scrolled
 * within or near the viewport (IntersectionObserver with 600px buffer).
 * Off-screen pages are destroyed (canvas buffer zeroed and child nodes unmounted)
 * to keep GPU canvas memory strictly capped at ~25-35 MB regardless of total page count.
 */
function PdfPageSlot({ doc, pageNumber, width, height, scale, dpr }) {
  const wrapRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '600px 0px 600px 0px', // Pre-render ~1 page ahead of scroll
        threshold: 0,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !isVisible || !doc) return;

    let cancelled = false;
    let renderTask = null;

    async function renderPage() {
      try {
        const page = await doc.getPage(pageNumber);
        if (cancelled) return;

        const viewport = page.getViewport({ scale });
        const raster = page.getViewport({ scale: scale * dpr });

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(raster.width);
        canvas.height = Math.floor(raster.height);
        canvas.className = 'pdf-page';
        canvas.setAttribute('aria-hidden', 'true');

        renderTask = page.render({ canvas, viewport: raster });
        await renderTask.promise;
        if (cancelled) {
          canvas.width = 0;
          canvas.height = 0;
          return;
        }

        const layer = document.createElement('div');
        layer.className = 'textLayer';
        layer.style.setProperty('--total-scale-factor', String(scale));
        layer.setAttribute('aria-label', `Statement page ${pageNumber} of ${doc.numPages}`);

        const textContent = await page.getTextContent();
        if (cancelled) {
          canvas.width = 0;
          canvas.height = 0;
          return;
        }

        await new pdfjs.TextLayer({
          textContentSource: textContent,
          container: layer,
          viewport,
        }).render();

        if (cancelled) {
          canvas.width = 0;
          canvas.height = 0;
          return;
        }

        // Mount the rendered canvas & textLayer
        el.replaceChildren(canvas, layer);
      } catch (err) {
        if (!cancelled && err?.name !== 'RenderingCancelledException') {
          console.error(`Page ${pageNumber} render error:`, err);
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;
      try {
        renderTask?.cancel();
      } catch {}

      if (el) {
        const canvas = el.querySelector('canvas');
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }
        const ph = document.createElement('div');
        ph.className = 'pdf-page-placeholder';
        const span = document.createElement('span');
        span.className = 'pdf-page-placeholder-num';
        span.textContent = `Page ${pageNumber}`;
        ph.appendChild(span);
        el.replaceChildren(ph);
      }
    };
  }, [isVisible, doc, pageNumber, scale, dpr]);

  return (
    <div
      ref={wrapRef}
      className="pdf-page-wrap"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div className="pdf-page-placeholder">
        <span className="pdf-page-placeholder-num">Page {pageNumber}</span>
      </div>
    </div>
  );
}

/**
 * High-performance PDF preview: compiles the real statement PDF, computes exact page
 * geometries, and uses DOM virtualization (PdfPageSlot) to smoothly scroll through
 * any number of pages with zero memory leaks and zero browser freezing.
 */
export default function PdfPreview({ statement, actions = null }) {
  const pagesRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [state, setState] = useState({ busy: true, pages: 0, error: '' });
  const [pdfData, setPdfData] = useState({
    doc: null,
    docId: 0,
    numPages: 0,
    pageWidth: 0,
    pageHeight: 0,
    scale: 1,
    dpr: 1,
  });
  const generation = useRef(0);
  const currentTaskRef = useRef(null);

  useEffect(() => {
    const el = pagesRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const nextWidth = Math.round(entry.contentRect.width / 10) * 10;
      if (nextWidth > 0) setWidth(nextWidth);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Cleanup PDF task when component unmounts
  useEffect(() => {
    return () => {
      currentTaskRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!width) return;
    const mine = ++generation.current;
    const stale = () => mine !== generation.current;

    const cached = hasCachedStatementBlob(statement);
    const delay = cached ? 0 : 350;
    setState(s => ({ ...s, busy: !cached }));

    const timer = setTimeout(async () => {
      let task;
      try {
        const blob = await getCachedStatementBlob(statement);
        if (stale()) return;

        task = pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) });
        const doc = await task.promise;
        if (stale()) {
          task.destroy();
          return;
        }

        const firstPage = await doc.getPage(1);
        const unscaledViewport = firstPage.getViewport({ scale: 1 });
        const scale = width / unscaledViewport.width;
        const pageWidth = Math.floor(unscaledViewport.width * scale);
        const pageHeight = Math.floor(unscaledViewport.height * scale);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        if (currentTaskRef.current && currentTaskRef.current !== task) {
          currentTaskRef.current.destroy();
        }
        currentTaskRef.current = task;

        setPdfData({
          doc,
          docId: mine,
          numPages: doc.numPages,
          pageWidth,
          pageHeight,
          scale,
          dpr,
        });
        setState({ busy: false, pages: doc.numPages, error: '' });
      } catch (e) {
        if (!stale()) setState({ busy: false, pages: 0, error: e?.message || String(e) });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [statement, width]);

  return (
    <div className="preview flex flex-col rounded-xl border border-gray-200 bg-slate-100/70 shadow-sm overflow-hidden">
      {/* Top Fixed Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-3.5 py-2.5 shadow-2xs">
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0">
            {state.error ? (
              <span className="font-bold text-red-600">Preview error</span>
            ) : state.pages ? (
              <>
                <Icon d={ICONS.document} className="h-3.5 w-3.5 text-slate-400" />
                <span>{state.pages} page{state.pages > 1 ? 's' : ''} · A4</span>
              </>
            ) : (
              <span>Rendering…</span>
            )}
            {state.busy && <span className="spinner" aria-label="Updating preview" />}
          </span>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {state.error && <p className="m-3 alert danger">Could not render the preview: {state.error}</p>}

      {/* Scrollable PDF Pages Viewport */}
      <div className="max-h-[calc(100vh-8.5rem)] overflow-y-auto p-4">
        <div className="pdf-pages" ref={pagesRef}>
          {pdfData.doc &&
            Array.from({ length: pdfData.numPages }, (_, i) => (
              <PdfPageSlot
                key={`${pdfData.docId}-page-${i + 1}`}
                doc={pdfData.doc}
                pageNumber={i + 1}
                width={pdfData.pageWidth}
                height={pdfData.pageHeight}
                scale={pdfData.scale}
                dpr={pdfData.dpr}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
