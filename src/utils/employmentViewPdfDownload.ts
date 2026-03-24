import { toCanvas } from 'html-to-image';
import jsPDF from 'jspdf';

/**
 * Rasterize DOM using the browser’s own layout/paint (via html-to-image).
 * Matches on-screen output including oklch(), SVG icons, and gradients —
 * unlike html2canvas, which re-parses CSS and breaks on modern color syntax.
 */
function settleLayout(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export async function downloadElementAsMultiPagePdf(
  element: HTMLElement,
  fileName: string
): Promise<void> {
  await settleLayout();

  const canvas = await toCanvas(element, {
    cacheBust: true,
    pixelRatio: Math.min(2.5, window.devicePixelRatio || 2),
    backgroundColor: '#ffffff',
    /** Avoids html-to-image embed-webfonts crash when a @font-face rule has no fontFamily. */
    skipFonts: true,
    filter: (domNode) => {
      if (!(domNode instanceof Element)) return true;
      return !domNode.hasAttribute('data-html2canvas-ignore');
    },
  });

  if (!canvas || canvas.width < 2 || canvas.height < 2) {
    throw new Error('Could not capture page content.');
  }

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
}
