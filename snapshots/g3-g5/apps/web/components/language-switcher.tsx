'use client';

import {Languages} from 'lucide-react';
import {useSearchParams} from 'next/navigation';
import {Suspense} from 'react';

import {Link, usePathname} from '@/i18n/navigation';
import type {Locale} from '@/content/types';
import {languageSwitchHref, PRIVATE_CALIBRATION_PATH} from '@/lib/language-switch-href';

type Props = {
  locale: Locale;
  label: string;
  names: Record<Locale, string>;
};

function LanguageLink({
  locale,
  label,
  names,
  href,
}: Props & {href: string}) {
  const targetLocale: Locale = locale === 'en' ? 'es' : 'en';

  return (
    <Link
      aria-label={`${label}: ${names[targetLocale]}`}
      className="language-switcher"
      href={href}
      locale={targetLocale}
    >
      <Languages aria-hidden="true" size={18} />
      <span>{names[targetLocale]}</span>
    </Link>
  );
}

function CalibrationLanguageLink({pathname, ...props}: Props & {pathname: string}) {
  const query = useSearchParams();
  return <LanguageLink {...props} href={languageSwitchHref(pathname, query)} />;
}

export function LanguageSwitcher(props: Props) {
  const pathname = usePathname();
  // Other routes retain their existing pathname-only links and never opt into
  // a query-driven client-rendering boundary.
  if (pathname !== PRIVATE_CALIBRATION_PATH) return <LanguageLink {...props} href={pathname} />;
  const targetLocale = props.locale === 'en' ? 'es' : 'en';
  return <Suspense fallback={<span className="language-switcher" aria-disabled="true" aria-busy="true">
    <Languages aria-hidden="true" size={18} /><span>{props.names[targetLocale]}</span>
  </span>}>
    <CalibrationLanguageLink {...props} pathname={pathname} />
  </Suspense>;
}
