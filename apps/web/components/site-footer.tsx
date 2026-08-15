import {Brand} from './site-header';
import type {SharedContent} from '@/content/types';
import {Link} from '@/i18n/navigation';

export function SiteFooter({content, locale}: {content: SharedContent; locale: 'en' | 'es'}) {
  const {navigation} = content;
  const year = new Date().getUTCFullYear();
  const spanish = locale === 'es';
  const links = [
    {href: '/', label: spanish ? 'Inicio' : 'Home'},
    {href: '/privacy', label: spanish ? 'Privacidad' : 'Privacy'},
    {href: '/terms', label: spanish ? 'Términos' : 'Terms'},
  ];

  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__about">
          <Brand homeLabel={navigation.homeLabel} location="footer" />
          <p>{spanish
            ? 'Un espacio bilingüe de aprendizaje de matemáticas con límites claros de privacidad y evidencia.'
            : 'A bilingual mathematics learning workspace with clear privacy and evidence boundaries.'}</p>
        </div>
        <div>
          <h2>{spanish ? 'Enlaces esenciales' : 'Essential links'}</h2>
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="container site-footer__base">
        <span>© {year} HELP Math.</span>
        <span>{spanish
          ? 'La disponibilidad de cada lección depende de las puertas explícitas del servidor.'
          : 'Lesson availability follows explicit server gates.'}</span>
      </div>
    </footer>
  );
}
