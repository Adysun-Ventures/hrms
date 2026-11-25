import { PDFDocument } from '@cantoo/pdf-lib';

/**
 * Strips all metadata (producer, creator, title, dates, Info dictionary) from a PDF.
 *
 * @param {Blob|Uint8Array|ArrayBuffer} pdfInput - PDF to sanitize
 * @returns {Promise<Blob>} Clean PDF Blob with empty metadata
 */
export async function stripPdfMetadata(pdfInput) {
  let buffer;
  if (pdfInput instanceof Blob) {
    buffer = await pdfInput.arrayBuffer();
  } else if (pdfInput instanceof ArrayBuffer) {
    buffer = pdfInput;
  } else if (pdfInput?.buffer instanceof ArrayBuffer) {
    buffer = pdfInput.buffer;
  } else {
    buffer = pdfInput;
  }

  const doc = await PDFDocument.load(buffer, { updateMetadata: false });
  delete doc.context.trailerInfo.Info;
  const cleanBytes = await doc.save();
  return new Blob([cleanBytes], { type: 'application/pdf' });
}

/**
 * Encrypts a PDF blob or buffer with a user password using AES-256 via @cantoo/pdf-lib,
 * while ensuring all metadata is completely stripped.
 *
 * @param {Blob|Uint8Array|ArrayBuffer} pdfInput - Original unencrypted PDF
 * @param {string} password - User password required to view the PDF
 * @returns {Promise<Blob>} Encrypted PDF Blob
 */
export async function encryptPdfBlob(pdfInput, password) {
  if (!password || !String(password).trim()) {
    return pdfInput;
  }

  let buffer;
  if (pdfInput instanceof Blob) {
    buffer = await pdfInput.arrayBuffer();
  } else if (pdfInput instanceof ArrayBuffer) {
    buffer = pdfInput;
  } else if (pdfInput?.buffer instanceof ArrayBuffer) {
    buffer = pdfInput.buffer;
  } else {
    buffer = pdfInput;
  }

  const doc = await PDFDocument.load(buffer, { updateMetadata: false });
  delete doc.context.trailerInfo.Info;
  doc.encrypt({
    userPassword: String(password).trim(),
  });
  const encryptedBytes = await doc.save();
  return new Blob([encryptedBytes], { type: 'application/pdf' });
}
