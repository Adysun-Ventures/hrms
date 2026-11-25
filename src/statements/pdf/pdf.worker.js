// Builds the PDF off the main thread so typing stays responsive while the preview regenerates.
if (typeof window === 'undefined') {
  self.window = self;
}

import { createElement } from 'react';
import { pdf } from '@react-pdf/renderer';
import { compute } from '../lib/calc.js';
import StatementDocument from './StatementDocument.jsx';

self.onmessage = async ({ data: { id, statement, generatedAt } }) => {
  try {
    const doc = createElement(StatementDocument, {
      statement,
      computed: compute(statement),
      generatedAt,
    });
    const blob = await pdf(doc).toBlob();
    const buffer = await blob.arrayBuffer();
    self.postMessage({ id, buffer }, [buffer]);
  } catch (e) {
    self.postMessage({ id, error: e?.message || String(e) });
  }
};
