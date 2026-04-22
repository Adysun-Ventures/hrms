import { Font } from '@react-pdf/renderer';

export const BODY_FONT_FAMILY = 'Lato';
export const HEADER_FOOTER_FONT_FAMILY = 'Helvetica';

let registered = false;

export function ensureDocumentFonts(): void {
  if (registered) return;
  Font.register({
    family: BODY_FONT_FAMILY,
    fonts: [
      {
        src: '/fonts/lato/Lato-Regular.ttf',
      },
      {
        src: '/fonts/lato/Lato-Bold.ttf',
        fontWeight: 'bold',
      },
      {
        src: '/fonts/lato/Lato-Italic.ttf',
        fontStyle: 'italic',
      },
      {
        src: '/fonts/lato/Lato-BoldItalic.ttf',
        fontWeight: 'bold',
        fontStyle: 'italic',
      },
    ],
  });

  registered = true;
}
