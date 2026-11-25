// Fallback used only if the PDF worker cannot start. Loaded on demand.
import { pdf } from '@react-pdf/renderer';
import { compute } from '../lib/calc.js';
import StatementDocument from './StatementDocument.jsx';

export const renderOnMainThread = (statement, generatedAt) =>
  pdf(<StatementDocument statement={statement} computed={compute(statement)} generatedAt={generatedAt} />).toBlob();
