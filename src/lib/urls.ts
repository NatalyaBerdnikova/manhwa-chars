function clean(routePath: string): string {
  return routePath.replace(/^\/+|\/+$/g, '');
}

/** Site path with the configured base and a trailing slash. One URL per page. */
export function href(routePath = ''): string {
  const base = import.meta.env.BASE_URL || '/';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  const path = clean(routePath);
  return path ? `${prefix}${path}/` : prefix;
}

export function abs(routePath = ''): string {
  const path = href(routePath);
  const site = import.meta.env.SITE;
  if (!site) return path;
  return new URL(path, site).href;
}
