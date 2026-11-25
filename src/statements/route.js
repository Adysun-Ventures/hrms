// #/statements              -> dashboard
// #/statements/edit/<id>     -> editor for that statement
export function parseHash(hash = location.hash) {
  const m = /^#\/statements\/edit\/([^/]+)/.exec(hash);
  return { id: m ? decodeURIComponent(m[1]) : null };
}

export const go = id => {
  location.hash = id ? `#/statements/edit/${encodeURIComponent(id)}` : '#/statements';
};
