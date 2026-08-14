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
          src="/brand/help-math-2-logo.svg"
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

  return (
    <header className="site-header">
      <div className="status-strip">
        <div className="container status-strip__inner">
          <span aria-hidden="true" className="status-strip__icon">
            <Sparkles size={14} />
          </span>
          <span>
            <strong>{content.statusLabel}</strong> {content.statusMessage}
          </span>
        </div>
      </div>
      <div className="container site-header__inner">
        <Brand homeLabel={navigation.homeLabel} />
        <nav aria-label={navigation.ariaLabel} className="desktop-nav">
          {navigation.links.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
          <Link href="/library">{locale === 'es' ? 'Biblioteca' : 'Library'}</Link>
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
          <Link className="header-support" href={navigation.supportAction.href}>
            {navigation.supportAction.label}
          </Link>
        </div>
        <nav aria-label={navigation.ariaLabel} className="mobile-nav-shell">
          <details className="mobile-nav">
            <summary aria-label={navigation.openMenuLabel}>
              <Menu aria-hidden="true" size={24} />
              <span>{navigation.openMenuLabel}</span>
            </summary>
            <div className="mobile-nav__panel">
              {navigation.links.map((link) => (
                <Link href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
              <Link href="/library">{locale === 'es' ? 'Biblioteca' : 'Library'}</Link>
              {process.env.NODE_ENV !== 'production' ||
              process.env.MIGRATION_STATUS_ENABLED === '1' ? (
                <Link href="/migration-status">{locale === 'es' ? 'Migración' : 'Migration'}</Link>
              ) : null}
              <Link href={navigation.supportAction.href}>{navigation.supportAction.label}</Link>
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
