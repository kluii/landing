// SPDX-License-Identifier: AGPL-3.0-only
// dist-relative HTML path -> OG png name. Shared by the renderer (scripts/og-images.mjs)
// and the page heads so every page's og:image matches a rendered file.
export function ogNameFor(rel: string): string {
  if (rel === 'index') return 'home.png';
  if (rel === '404') return '404.png';
  return `${rel.replace(/\//g, '-')}.png`;
}

// Route path (Base/Starlight) -> dist-relative html path (directory format).
export function routeToRel(path: string): string {
  if (path === '/') return 'index';
  if (path === '/404') return '404';
  return `${path.replace(/^\//, '').replace(/\/$/, '')}/index`;
}
