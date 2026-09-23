import type {Metadata} from 'next';
import {notFound, redirect} from 'next/navigation';

import {NovaSettings} from '@/components/nova-settings';
import {isLocale} from '@/content';
import {readAuthSession} from '@/lib/clerk-auth-session.server';
import {listNovaSettings} from '@/lib/nova-class-policy.server';
import {isAuthEnabled, localizedAuthPath} from '@/lib/local-auth-access';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: {index: false, follow: false},
  title: 'Nova Tutor settings',
};

export default async function NovaSettingsPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!isLocale(locale) || !isAuthEnabled()) notFound();
  const session = await readAuthSession();
  if (session.status !== 'signed-in') {
    redirect(localizedAuthPath(locale, '/sign-in'));
  }
  let settings: Awaited<ReturnType<typeof listNovaSettings>> | null = null;
  try {
    settings = await listNovaSettings(session);
  } catch {
    // No setting can be changed when the policy database is unavailable.
  }
  if (!settings) {
    return <main id="main-content" style={{margin: '3rem auto', maxWidth: 720, padding: '1rem'}}>
      <h1>{locale === 'es' ? 'Controles de Nova' : 'Nova controls'}</h1>
      <p role="status">{locale === 'es'
        ? 'Los controles no están disponibles. Nova permanece desactivada.'
        : 'Controls are unavailable. Nova remains off.'}</p>
    </main>;
  }
  return <NovaSettings
    classes={settings.classes}
    locale={locale}
    schools={settings.schools}
  />;
}
