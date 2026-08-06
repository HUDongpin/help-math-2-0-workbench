import {notFound} from 'next/navigation';

import {ReferencePlayer} from '@/components/reference-player';
import {Container} from '@/components/ui';
import {Link} from '@/i18n/navigation';
import {findAnimation, resolveCatalogSource} from '@/lib/catalog';

export const dynamic = 'force-dynamic';
export const metadata = {title: 'Local SWF reference', robots: {index: false, follow: false}};

export default async function ReferencePage({params}: {params: Promise<{locale: 'en' | 'es'; animationId: string}>}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const {locale, animationId} = await params;
  const animation = findAnimation(animationId);
  if (!animation || !resolveCatalogSource(animation)) notFound();
  const spanish = locale === 'es';
  const width = animation.source.swf.stage?.width ?? 780; const height = animation.source.swf.stage?.height ?? 379;
  return <main className="reference-page" id="main-content"><Container><p className="eyebrow">{spanish ? 'Solo auditoría local' : 'Local audit only'}</p><h1>{animation.classification.titleDisplay}</h1><p>{spanish ? 'Ruffle es una referencia forense y nunca la implementación de producción.' : 'Ruffle is a forensic reference, never the production implementation.'}</p><ReferencePlayer animationId={animationId} height={height} title={animation.classification.titleDisplay} width={width} /><p><Link href={`/animations/${animationId}`}>← {spanish ? 'Volver a la implementación' : 'Back to implementation'}</Link></p></Container></main>;
}
