import {Menu} from 'lucide-react';
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
    {href: '/privacy', label: spanish ? 'Privacidad' : 'Privacy'},
    {href: '/terms', label: spanish ? 'Términos' : 'Terms'},
  ];

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Brand homeLabel={navigation.homeLabel} />
        <nav aria-label={navigation.ariaLabel} className="desktop-nav">
          {platformLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="site-header__actions">
          <LanguageSwitcher
            label={navigation.languageLabel}
            locale={locale}
            names={navigation.languageNames}
          />
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
