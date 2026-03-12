import {
  AlignmentType,
  BorderStyle,
  Document as DocxDocument,
  Footer,
  Header,
  ImageRun,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

const COMPANY = {
  name: "ADYSUN VENTURES PVT. LTD.",
  contact: "info@adysunventures.com | hr@adysunventures.com | www.AdysunVentures.com",
  addressLine1: "Adysun Ventures, WorkPlex, S no 47, near Bhapkar petrol pump",
  addressLine2: "Pune - Satara Rd, Bibwewadi, Pune, Maharashtra 411009",
  logoPath: "/assets/adysunventures_logo.png",
  footerLine1: "Adysun Ventures Pvt. Ltd.",
  footerLine2: "S no 47, WorkPlex, Pune-Satara Road, Pune 411009",
  footerLine3: "www.adysunventures.com | hr@adysunventures.com",
  brandHex: "D85604",
};

export async function fetchArrayBuffer(src: string | null | undefined) {
  if (!src) return null;
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export async function getAdysunLogoBuffer() {
  return await fetchArrayBuffer(COMPANY.logoPath);
}

export function buildAdysunHeader(logoBuf: ArrayBuffer | null) {
  return new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 75, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: COMPANY.name,
                        bold: true,
                        color: COMPANY.brandHex,
                        size: 36,
                      }),
                    ],
                  }),
                  new Paragraph({ children: [new TextRun({ text: COMPANY.contact, size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: COMPANY.addressLine1, size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: COMPANY.addressLine2, size: 20 })] }),
                ],
              }),
              new TableCell({
                width: { size: 25, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: logoBuf
                      ? [
                          new ImageRun({
                            type: "png",
                            data: new Uint8Array(logoBuf),
                            transformation: { width: 60, height: 60 },
                          }),
                        ]
                      : [],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
      }),
    ],
  });
}

export function buildAdysunFooter() {
  return new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: COMPANY.footerLine1,
            bold: true,
            color: COMPANY.brandHex,
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: COMPANY.footerLine2, size: 20 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: COMPANY.footerLine3, size: 20 })],
      }),
    ],
  });
}

export async function createAdysunDocx(opts: { children: Paragraph[] | (Paragraph | Table)[]; includeHeader?: boolean; includeFooter?: boolean }) {
  const { children, includeHeader = true, includeFooter = true } = opts;
  const logoBuf = includeHeader ? await getAdysunLogoBuffer() : null;
  return new DocxDocument({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
          paragraph: { spacing: { line: 276 } }, // ~1.15
        },
      },
    },
    sections: [
      {
        properties: {},
        headers: includeHeader ? { default: buildAdysunHeader(logoBuf) } : undefined,
        footers: includeFooter ? { default: buildAdysunFooter() } : undefined,
        children,
      },
    ],
  });
}

