import { Document as DocxDocument, ImageRun, Paragraph, Packer } from "docx";
import { createAdysunDocx } from "@/utils/docxAdysun";

// Creates a DOCX that is an exact visual copy of the given PDF by
// rasterizing each PDF page to an image and inserting it into the DOCX.
// This is "exact" but not editable text.

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dataURLToUint8Array(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function buildExactDocxFromPdfBlob(pdfBlob: Blob) {
  // Lazy import to keep bundle smaller and avoid SSR issues.
  // `pdfjs-dist/webpack.mjs` is the officially supported entry for webpack bundlers
  // and auto-wires the worker via `workerPort`.
  const pdfjsModule = await import("pdfjs-dist/webpack.mjs");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjsLib: any = (pdfjsModule as any)?.default ?? pdfjsModule;

  const pdfBytes = new Uint8Array(await pdfBlob.arrayBuffer());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!pdfjsLib?.getDocument) {
    throw new Error("PDF.js getDocument not found (module shape mismatch)");
  }
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdf = (await loadingTask.promise) as any;

  const pages: Paragraph[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = (await pdf.getPage(pageNum)) as any;

    // Scale controls quality; higher = sharper but larger file.
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not available");

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    const pngBlob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Failed to create PNG blob"))),
        "image/png"
      )
    );
    const dataUrl = await blobToDataURL(pngBlob);
    const imageBytes = dataURLToUint8Array(dataUrl);

    pages.push(
      new Paragraph({
        children: [
          new ImageRun({
            // `type` disambiguates docx's union types (PNG vs SVG options)
            type: "png",
            data: imageBytes as unknown as Uint8Array,
            transformation: { width: canvas.width, height: canvas.height },
          }),
        ],
      })
    );

    // Page break between pages
    if (pageNum !== pdf.numPages) {
      pages.push(new Paragraph({ children: [], pageBreakBefore: true }));
    }
  }

  // Use the same Adysun header/footer wrapper so DOCX still has company header/footer
  // around the page images. If you want "only pages", set includeHeader/Footer false.
  const doc = await createAdysunDocx({ children: pages, includeHeader: false, includeFooter: false });
  return doc as DocxDocument;
}

export async function exactDocxBlobFromPdfBlob(pdfBlob: Blob) {
  const doc = await buildExactDocxFromPdfBlob(pdfBlob);
  return await Packer.toBlob(doc);
}

