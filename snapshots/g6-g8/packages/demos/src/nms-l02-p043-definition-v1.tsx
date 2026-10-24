import * as React from 'react';
import type { P043Row } from './nms-l02-p043-matching-v1';
export type P043GlossaryTerm = 'fraction' | 'power' | 'whole' | 'part' | 'group' | 'value';
const sourceLinks = {
  en: { 1: [['fractions', 'fraction'], ['power', 'power'], ['whole', 'whole']], 2: [['part', 'part'], ['whole', 'whole'], ['group', 'group']], 3: [], 4: [['value', 'value']] },
  es: { 1: [['Fracciones', 'fraction'], ['potencia', 'power'], ['todo', 'whole']], 2: [['parte', 'part'], ['todo', 'whole'], ['grupo', 'group']], 3: [], 4: [['valor', 'value']] },
} as const;
/** Source buttons69/70/71/76/77/78: only the first linked occurrence in each definition. */
export function p043DefinitionParts(text: string, row: P043Row, language: 'en' | 'es'): readonly { text: string; term?: P043GlossaryTerm }[] {
  const matches = sourceLinks[language][row].map(([word, term]) => {
    const start = text.toLowerCase().indexOf(word.toLowerCase());
    if (start < 0) throw Error('P043_GLOSSARY_WORD_BINDING');
    return { start, end: start + word.length, term };
  }).sort((a, b) => a.start - b.start);
  const parts: { text: string; term?: P043GlossaryTerm }[] = []; let cursor = 0;
  for (const match of matches) {
    if (match.start < cursor) throw Error('P043_GLOSSARY_OVERLAP');
    if (match.start > cursor) parts.push({ text: text.slice(cursor, match.start) });
    parts.push({ text: text.slice(match.start, match.end), term: match.term }); cursor = match.end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}
export function P043Definition({ text, row, language, enabled, onTerm }: { text: string; row: P043Row; language: 'en' | 'es'; enabled: boolean; onTerm: (term: P043GlossaryTerm) => void }) {
  return <p>{p043DefinitionParts(text, row, language).map((part, index) => part.term
    ? <button className="p043-presentation__term-link" type="button" key={index} disabled={!enabled} data-source-term={part.term} onClick={() => onTerm(part.term!)}>{part.text}</button>
    : <React.Fragment key={index}>{part.text}</React.Fragment>)}</p>;
}
