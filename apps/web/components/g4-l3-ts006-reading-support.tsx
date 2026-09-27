import {G4_L3_TS006_PRODUCT} from '@/lib/g4-l3-ts006-product';

export function G4L3Ts006ReadingSupport({locale}: {locale: 'en' | 'es'}) {
  return <section
    aria-label={locale === 'es' ? 'Plan de cuatro pasos: texto original en inglés' : 'Four step plan'}
    className="g4-l3-ts006-reading-support"
    data-modern-enhancement="source-bound-readable-summary"
    data-source-animation-id={G4_L3_TS006_PRODUCT.animationId}
    data-source-swf-sha256={G4_L3_TS006_PRODUCT.sourceSwfSha256}
    lang="en"
  >
    <ol>
      {G4_L3_TS006_PRODUCT.steps.map((step, index) => <li key={step}>
        <strong aria-hidden="true">{index + 1}. </strong>{step}
      </li>)}
    </ol>
  </section>;
}
