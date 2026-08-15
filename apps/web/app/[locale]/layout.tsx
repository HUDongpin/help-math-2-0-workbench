import type {Metadata, Viewport} from 'next';
import {notFound} from 'next/navigation';
import {Analytics} from '@vercel/analytics/next';

import {ClerkLocalAuthProvider} from '@/components/auth/clerk-local-auth-provider';
import {SiteFooter} from '@/components/site-footer';
import {SiteHeader} from '@/components/site-header';
import {getSiteContent} from '@/content';
import type {Locale} from '@/content/types';
import {LocaleProvider} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';
import {getSiteUrl, SITE_DESCRIPTION, SITE_NAME} from '@/lib/site';

import 'katex/dist/katex.min.css';
import '../globals.css';

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {default: `${SITE_NAME} · Math language made visible`, template: `%s · ${SITE_NAME}`},
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: 'education',
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {index: true, follow: true}
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#1768d4'
};

const learningThemeBootstrap = `(() => {
  let theme = 'light';
  try {
    const saved = localStorage.getItem('helpmath:learning-workspace-theme:v1');
    if (saved === 'light' || saved === 'dark') theme = saved;
    else if (matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
  } catch {}
  document.documentElement.dataset.learningPlatformTheme = theme;
})();`;

export function generateStaticParams() {
  return [{locale: 'en'}, {locale: 'es'}];
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>) {
  const {locale} = await params;
  if (!routing.locales.some((candidate) => candidate === locale)) notFound();
  const appLocale = locale as Locale;
  const content = getSiteContent(appLocale).shared;
  const organizationData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: SITE_NAME,
    url: getSiteUrl().toString(),
    description: SITE_DESCRIPTION,
    availableLanguage: ['English', 'Spanish']
  }).replaceAll('<', '\\u003c');

  return (
    <html data-scroll-behavior="smooth" lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html: learningThemeBootstrap}} />
      </head>
      <body>
        <ClerkLocalAuthProvider locale={appLocale}>
          <LocaleProvider locale={appLocale}>
            <a className="skip-link" href="#main-content">
              {content.skipToContent}
            </a>
            <SiteHeader content={content} locale={appLocale} />
            {children}
            <SiteFooter content={content} locale={appLocale} />
          </LocaleProvider>
        </ClerkLocalAuthProvider>
        <script
          dangerouslySetInnerHTML={{__html: organizationData}}
          type="application/ld+json"
        />
        {process.env.NODE_ENV === 'production' ? <Analytics /> : null}
      </body>
    </html>
  );
}
