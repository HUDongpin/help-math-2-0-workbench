import {headers} from 'next/headers';

import {Container} from '@/components/ui';
import {Link} from '@/i18n/navigation';

const copy = {
  en: {
    title: 'Page not found',
    body: 'The page you requested is not part of the HELP Math website.',
    home: 'Return home',
  },
  es: {
    title: 'Página no encontrada',
    body: 'La página que buscas no forma parte del sitio web de HELP Math.',
    home: 'Volver al inicio',
  },
} as const;

export default async function NotFound() {
  const locale = (await headers()).get('x-help-math-not-found-locale');
  const text = locale === 'es' ? copy.es : copy.en;
  return (
    <main className="page-hero page-hero--yellow" id="main-content">
      <Container>
        <div className="page-hero__copy">
          <p className="eyebrow">404</p>
          <h1>{text.title}</h1>
          <p>{text.body}</p>
          <div className="page-hero__actions">
            <Link className="action action--primary" href="/">{text.home}</Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
