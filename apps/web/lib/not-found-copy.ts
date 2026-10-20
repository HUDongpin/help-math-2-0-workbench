export type NotFoundLocale = 'en' | 'es';

export const NOT_FOUND_COPY = {
  en: {
    title: 'Page not found',
    body: 'The page you requested is not part of the HELP Math website.',
    home: 'Return home',
    homeHref: '/',
  },
  es: {
    title: 'Página no encontrada',
    body: 'La página que buscas no forma parte del sitio web de HELP Math.',
    home: 'Volver al inicio',
    homeHref: '/es',
  },
} as const;

export function notFoundLocaleForPath(pathname: string): NotFoundLocale {
  return pathname === '/es' || pathname.startsWith('/es/') ? 'es' : 'en';
}

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

/**
 * Self-contained branded 404 document the proxy returns for denied paths.
 * It is built here rather than by rewriting to an app route: a rewrite to a
 * path the proxy itself denies re-enters the proxy whenever Next.js has to
 * forward the rewrite as a subrequest (loopback hosts are canonicalised to
 * `localhost`, so the origins differ), and that loop never answers.
 */
export function brandedNotFoundDocument(locale: NotFoundLocale): string {
  const copy = NOT_FOUND_COPY[locale];
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(copy.title)} · HELP Math</title>
<link rel="icon" href="/favicon.ico" sizes="48x48">
<style>
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#14213d;background:#fff}
header{padding:16px 24px;border-bottom:1px solid #e3e8ef}
header a{font-weight:700;color:#1768d4;text-decoration:none;font-size:1.125rem}
main{background:#ffe17a;padding:64px 24px}
.copy{max-width:720px;margin:0 auto}
.eyebrow{font-weight:700;letter-spacing:.08em;margin:0 0 8px}
h1{font-size:2.25rem;margin:0 0 16px}
.action{display:inline-block;margin-top:16px;padding:12px 20px;border-radius:8px;background:#1768d4;color:#fff;font-weight:700;text-decoration:none}
a:focus-visible{outline:3px solid #14213d;outline-offset:3px}
</style>
</head>
<body>
<header><a href="${copy.homeHref}">HELP Math</a></header>
<main id="main-content">
<div class="copy">
<p class="eyebrow">404</p>
<h1>${escapeHtml(copy.title)}</h1>
<p>${escapeHtml(copy.body)}</p>
<a class="action" href="${copy.homeHref}">${escapeHtml(copy.home)}</a>
</div>
</main>
</body>
</html>
`;
}
