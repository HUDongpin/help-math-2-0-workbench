import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

import {G4L5ProductBridgePlayer} from '@/components/g4-l5-product-bridge-player';
import {
  buildG4L5ProductBridgeDescriptor,
  type G4L5ProductBridgeLocale,
} from '@/lib/g4-l5-product-bridge-descriptor';
import {loadG4L5ProductBridgeSourceCoverage} from '@/lib/g4-l5-product-bridge-source.server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Private G4 L5 Current-JS Product Bridge',
  robots: {index: false, follow: false},
};

export default async function G4L5ProductBridgePage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const {locale} = await params;
  if (locale !== 'en' && locale !== 'es') notFound();
  const descriptor = buildG4L5ProductBridgeDescriptor(
    loadG4L5ProductBridgeSourceCoverage(),
  );
  return (
    <main id="main-content">
      <G4L5ProductBridgePlayer
        descriptor={descriptor}
        locale={locale as G4L5ProductBridgeLocale}
      />
    </main>
  );
}
