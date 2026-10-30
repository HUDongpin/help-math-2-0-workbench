export const SITE_NAME = 'HELP Math';
export const SITE_DESCRIPTION =
  'Interactive, language-rich mathematics learning for multilingual students and the educators who support them.';
const SITE_DESCRIPTION_ES =
  'Aprendizaje de matemáticas interactivo y rico en lenguaje para estudiantes multilingües y los educadores que los apoyan.';

export function siteDescription(locale: 'en' | 'es'): string {
  return locale === 'es' ? SITE_DESCRIPTION_ES : SITE_DESCRIPTION;
}

const fallbackUrl = 'https://www.helpmath.ai';

export function getSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  try {
    return new URL(configured || fallbackUrl);
  } catch {
    return new URL(fallbackUrl);
  }
}

export function localizedPath(locale: 'en' | 'es', path = '/'): string {
  const normalized = path === '/' ? '' : path;
  return locale === 'es' ? `/es${normalized || ''}` || '/es' : normalized || '/';
}
