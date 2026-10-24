import React from 'react';
import {createPortal} from 'react-dom';
import {P050_DECIMAL_NOTATION, P050_GLOSSARY} from './generated/nms-l02-p050-glossary-v1';
import type {P050Language} from './nms-l02-p050-text-v1';

export type P050Term = typeof P050_GLOSSARY[number]['id'];

const COPY = {
 en: {group: 'Key terms', close: 'Close'},
 es: {group: 'Términos clave', close: 'Cerrar'},
} as const;

/** Help-owned glossary. Opening or closing a definition never emits a practice event. */
export function P050GlossaryTerms({language = 'en'}: {language?: P050Language}) {
 const copy = COPY[language];
 const groupId = React.useId();
 const [term, setTerm] = React.useState<P050Term | null>(null);
 const triggers = React.useRef(new Map<P050Term, HTMLButtonElement>());
 const entry = P050_GLOSSARY.find(item => item.id === term);
 const mounted = React.useRef(false);
 const close = React.useCallback(() => { if (mounted.current) setTerm(null); }, []);
 React.useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
 return <section className="p050-glossary-terms" aria-labelledby={groupId}>
  <h4 id={groupId}>{copy.group}</h4>
  <div role="group" aria-labelledby={groupId}>
   {P050_GLOSSARY.map(item => <button key={item.id} type="button" className="p050-term" data-p050-term={item.id}
    ref={node => { if (node) triggers.current.set(item.id, node); else triggers.current.delete(item.id); }}
   aria-haspopup="dialog" onClick={() => setTerm(item.id)}>{item.labels[language]}</button>)}
  </div>
  {entry && <P050GlossaryDialog key={entry.id} entry={entry} language={language} closeLabel={copy.close}
   trigger={() => triggers.current.get(entry.id) ?? null} onClose={close}/>}
 </section>;
}

function P050GlossaryDialog({entry, language, closeLabel, trigger, onClose}: {
 entry: typeof P050_GLOSSARY[number]; language: P050Language; closeLabel: string;
 trigger: () => HTMLButtonElement | null; onClose: () => void;
}) {
 const id = React.useId();
 const dialog = React.useRef<HTMLDialogElement>(null);
 const heading = React.useRef<HTMLHeadingElement>(null);
 const latest = React.useRef(onClose);
 const triggerNow = React.useRef(trigger);
 latest.current = onClose;
 triggerNow.current = trigger;
 React.useEffect(() => {
  const node = dialog.current;
  if (!node) return;
  node.showModal();
  heading.current?.focus({preventScroll: true});
  node.scrollTop = 0;
  return () => {
   node.close();
   const target = triggerNow.current();
   if (target?.isConnected && !target.disabled) target.focus({preventScroll: true});
  };
 }, []);
 const close = () => latest.current();
 return typeof document === 'undefined' ? null : createPortal(<dialog ref={dialog} className="p050-glossary" aria-labelledby={id} lang={language}
  data-p050-glossary={entry.id}
  onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }}
  onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); } }}>
  <h3 ref={heading} id={id} tabIndex={-1}>{entry.labels[language]}</h3>
  <p>{entry.definitions[language]}</p>
  {language === 'es' && entry.id === 'decimal' && <p data-p050-decimal-notation>{P050_DECIMAL_NOTATION.es}</p>}
  <button type="button" onClick={close}>{closeLabel}</button>
 </dialog>, document.body);
}
