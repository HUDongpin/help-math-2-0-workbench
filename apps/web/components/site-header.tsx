import {Menu, Sparkles} from 'lucide-react';
import Image from 'next/image';

import type {Locale, SharedContent} from '@/content/types';
import {Link} from '@/i18n/navigation';

import {LanguageSwitcher} from './language-switcher';

export function Brand({
  homeLabel,
  location = 'header',
}: {
  homeLabel: string;
  location?: 'header' | 'footer';
}) {
  return (
    <Link aria-label={homeLabel} className={`brand brand--${location}`} href="/">
      {location === 'header' ? (
        <Image
          alt=""
          aria-hidden="true"
          className="brand__logo"
          height={64}
          preload
          src="/brand/help-math-2-logo.png"
          width={64}
        />
      ) : (
        <>
          <span aria-hidden="true" className="brand__mark">
            <span>+</span>
            <span>×</span>
          </span>
          <span className="brand__name">
            HELP <strong>Math</strong>
          </span>
        </>
      )}
    </Link>
  );
}

export function SiteHeader({content, locale}: {content: SharedContent; locale: Locale}) {
  const {navigation} = content;
  const spanish = locale === 'es';
  const platformLinks = [
    {href: '/', label: spanish ? 'Inicio' : 'Home'},
    {href: '/courses/4/3', label: spanish ? 'Mi lección' : 'My lesson'},
    {href: '/#progress', label: spanish ? 'Progreso' : 'Progress'},
    {href: '/#learning-supports', label: spanish ? 'Apoyos' : 'Learning supports'},
  ];

  return (
    <header className="site-header">
      <div className="status-strip">
        <div className="container status-strip__inner">
          <span aria-hidden="true" className="status-strip__icon">
            <Sparkles size={14} />
          </span>
          <span>
            <strong>{spanish ? 'Grado 4 · Lección 3' : 'Grade 4 · Lesson 3'}</strong>{' '}
            {spanish
              ? 'Negative Numbers: muestra navegable de 39 páginas en JavaScript actual; no implica fidelidad Flash ni aceptación de publicación.'
              : 'Negative Numbers: a navigable 39-page current-JavaScript showcase—not Flash fidelity or publication acceptance.'}
          </span>
        </div>
      </div>
      <div className="container site-header__inner">
        <Brand homeLabel={navigation.homeLabel} />
        <nav aria-label={navigation.ariaLabel} className="desktop-nav">
          {platformLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
          {process.env.NODE_ENV !== 'production' || process.env.MIGRATION_STATUS_ENABLED === '1' ? (
            <Link href="/migration-status">{locale === 'es' ? 'Migración' : 'Migration'}</Link>
          ) : null}
        </nav>
        <div className="site-header__actions">
          <LanguageSwitcher
            label={navigation.languageLabel}
            locale={locale}
            names={navigation.languageNames}
          />
          <Link className="header-support" href="/support">
            {spanish ? 'Obtener ayuda' : 'Get help'}
          </Link>
        </div>
        <nav aria-label={navigation.ariaLabel} className="mobile-nav-shell">
          <details className="mobile-nav">
            <summary aria-label={navigation.openMenuLabel}>
              <Menu aria-hidden="true" size={24} />
              <span>{navigation.openMenuLabel}</span>
            </summary>
            <div className="mobile-nav__panel">
              {platformLinks.map((link) => (
                <Link href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
              {process.env.NODE_ENV !== 'production' ||
              process.env.MIGRATION_STATUS_ENABLED === '1' ? (
                <Link href="/migration-status">{locale === 'es' ? 'Migración' : 'Migration'}</Link>
              ) : null}
              <Link href="/support">{spanish ? 'Obtener ayuda' : 'Get help'}</Link>
              <LanguageSwitcher
                label={navigation.languageLabel}
                locale={locale}
                names={navigation.languageNames}
              />
            </div>
          </details>
        </nav>
      </div>
    </header>
  );
}
