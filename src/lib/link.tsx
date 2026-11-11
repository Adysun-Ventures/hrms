import type { AnchorHTMLAttributes } from 'react';
import { Link as RouterLink } from 'react-router-dom';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  replace?: boolean;
  prefetch?: boolean;
  scroll?: boolean;
};

export const isExternal = (href: string) => /^([a-z][a-z\d+.-]*:|\/\/|#)/i.test(href);

/** `<Link href>` as pages wrote it under Next; internal paths go through the router. */
export default function Link({ href, replace, prefetch: _prefetch, scroll: _scroll, ...rest }: Props) {
  if (isExternal(href) || rest.target === '_blank' || rest.download !== undefined) return <a href={href} {...rest} />;
  return <RouterLink to={href} replace={replace} {...rest} />;
}
