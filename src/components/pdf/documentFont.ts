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
        src: 'https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wXg.woff',
      },
      {
        src: 'https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh6UVSwiPGQ.woff',
        fontWeight: 'bold',
      },
      {
        src: 'https://fonts.gstatic.com/s/lato/v24/S6u8w4BMUTPHjxsAXC-v.woff',
        fontStyle: 'italic',
      },
    ],
  });

  registered = true;
}
