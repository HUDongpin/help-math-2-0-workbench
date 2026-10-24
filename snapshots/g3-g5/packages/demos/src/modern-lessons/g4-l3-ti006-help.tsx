import React from 'react';
import source from './generated/g4-l3-ti006-help.json';

export const TI006_HELP_DATA = source;
export const TI006_KEY_TERMS = {...source.keyTerms, indexLanguage: 'en' as const};
export type Ti006OpenTerm = (entryId: string, trigger: HTMLButtonElement) => void;
const terms: Readonly<Record<string, keyof typeof source.keyTerms.entries>> = {
  position: 'Position', 'number line': 'Number line', owes: 'Owe', owing: 'Owe',
  'negative numbers': 'Negative number', 'positive numbers': 'Positive number',
};

export function Ti006SourceText({text, onKeyTerm}: {text: string; onKeyTerm?: Ti006OpenTerm}) {
  return <>{text.split(/(\bposition\b|\bnumber line\b|\bowes\b|\bowing\b|\bnegative numbers\b|\bpositive numbers\b)/gi).map((part, i) => {
    const term = terms[part.toLowerCase()];
    return term && onKeyTerm ? <button key={i} type="button" data-ti006-keyterm={source.keyTerms.entries[term]}
      onClick={event => onKeyTerm(source.keyTerms.entries[term], event.currentTarget)}
      style={{font: 'inherit', lineHeight: 'inherit', border: 0, padding: 0, minHeight: 0,
        minWidth: 0, maxWidth: '100%', overflowWrap: 'anywhere', textAlign: 'inherit',
        color: '#153d8a', background: 'transparent', textDecoration: 'underline'}}>{part}</button>
      : <React.Fragment key={i}>{part}</React.Fragment>;
  })}</>;
}

/** Full help-only diagram, never substitute the main exercise's -8..+8 axis. */
export function Ti006Help({onKeyTerm}: {onKeyTerm?: Ti006OpenTerm}) {
  return <div data-ti006-native-help="true" lang="en" style={{display: 'grid', gap: '1rem', minWidth: 0}}>
    {source.prose.map(p => <p key={p.characterId} data-lesson-text-block={`help-${p.characterId}`}
      style={{font: 'inherit', lineHeight: 1.6, margin: 0}}><Ti006SourceText text={p.text} onKeyTerm={onKeyTerm}/></p>)}
    <div role="group" aria-label="Help number line from negative ten to ten. Scroll horizontally to explore."
      tabIndex={0} style={{overflowX: 'auto', maxWidth: '100%', paddingBlock: '.5rem'}}>
      <div data-ti006-help-axis="true" style={{position: 'relative', width: '60rem', height: '7rem'}}>
        <svg aria-hidden="true" viewBox="0 0 960 70" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, width: '100%', height: '4.375rem'}}>
          <path d="M 20 35 H 940 M 30 27 L 20 35 L 30 43 M 930 27 L 940 35 L 930 43" fill="none" stroke="#172033" strokeWidth="2"/>
          {source.labels.map((t, i) => <path key={t.value} d={`M ${40+i*44} 23 V 47`} stroke={t.value < 0 ? '#9f2222' : t.value > 0 ? '#153d8a' : '#172033'} strokeWidth="2"/>)}
        </svg>
        {source.labels.map((t, i) => <span key={t.value} data-lesson-text-block={`help-tick-${t.value}`} data-source-text={t.characterId}
          style={{position: 'absolute', left: `${(40+i*44)/960*100}%`, top: '3.1rem', transform: 'translateX(-50%)',
            fontSize: '1.125rem', lineHeight: 1.6, fontWeight: t.value === 0 ? 800 : 600,
            color: t.value < 0 ? '#9f2222' : t.value > 0 ? '#153d8a' : '#172033'}}>{t.label}</span>)}
      </div>
    </div>
  </div>;
}
