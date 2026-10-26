'use client';

import dynamic from 'next/dynamic';

// Keep the unregistered renderer out of the production client graph.
const Candidate = process.env.NODE_ENV === 'production' ? () => null :
  dynamic(() => import('./g678-nms-l09-p003-candidate-player').then(
    module => module.G678NmsL09P003CandidatePlayer), {ssr: false});

export function G678NmsL09P003CandidateEntry({locale}: {locale: 'en' | 'es'}) {
  return <Candidate locale={locale}/>;
}
