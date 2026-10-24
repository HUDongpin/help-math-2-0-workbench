import * as React from 'react';
import type { P043CompletionDomain } from './nms-l02-p043-clock-v1';
export const P043_COMPLETION_TEXT = {
  '143': { en: 'Excellent!', es: '¡Excelente!', sourceTextIds: [140, 141], tone: 'burst' },
  '171': { en: 'Good Job!', es: '¡Buen trabajo!', sourceTextIds: [167, 168], tone: 'water' },
  '183': { en: 'Great Job!', es: '¡Muy buen trabajo!', sourceTextIds: [177, 178], tone: 'star' },
  '204': { en: 'Well done!', es: '¡Bien hecho!', sourceTextIds: [202, 203], tone: 'warm' },
  '232': { en: 'Excellent!', es: '¡Excelente!', sourceTextIds: [140, 141], tone: 'glow' },
} as const;
/** Native steady feedback: source praise text and audio identity, not bitmap/morph parity. */
export function P043CompletionFeedback({ domain, language }: { domain: P043CompletionDomain; language: 'en' | 'es' }) {
  const text = P043_COMPLETION_TEXT[domain];
  return <section className="p043-completion" role="status" data-feedback-domain={domain} data-feedback-tone={text.tone}>
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {text.tone === 'star' ? <path d="M50 5 63 35 96 38 71 60 78 94 50 77 22 94 29 60 4 38 37 35Z" />
        : text.tone === 'water' ? <><ellipse cx="50" cy="68" rx="43" ry="19" fill="none" /><ellipse cx="50" cy="68" rx="29" ry="11" fill="none" /><path d="M50 8Q28 35 36 47Q50 63 64 47Q72 35 50 8Z" /></>
        : text.tone === 'burst' || text.tone === 'warm' ? <path d="M50 5 60 25 80 12 78 35 98 42 78 56 90 79 66 77 51 98 38 77 13 89 22 65 2 49 24 37 14 15 38 24Z" />
        : <><circle cx="50" cy="50" r="40" /><circle cx="50" cy="50" r="27" fill="none" /></>}
    </svg>
    <h3>{text[language]}</h3>
  </section>;
}
