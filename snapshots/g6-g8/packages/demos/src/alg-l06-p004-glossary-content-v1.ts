import {P004_GLOSSARY_CONTENT} from './alg-l06-p004-glossary-content.generated';
import type {P004GlossaryState} from './alg-l06-p004-glossary-state-v1';

/** Exact authored lookup; lowercase output has its own explicit source crosswalk. */
export function p004GlossaryContent(key:string,locale:'en'|'es'){
 if(locale!=='en'&&locale!=='es')throw Error('P004_UNSUPPORTED_GLOSSARY_LOCALE');
 const entry=P004_GLOSSARY_CONTENT.find(row=>row.key===key);
 if(!entry)throw Error('P004_UNBOUND_GLOSSARY_KEY');
 return Object.freeze({key:entry.key,canonicalDictionaryKey:entry.canonicalDictionaryKey,
  label:entry.labels[locale],definition:entry.definitions[locale]});
}

/** Closing or Replay immediately removes the selected definition. */
export function p004SelectedGlossaryContent(state:P004GlossaryState,locale:'en'|'es'){
 return state.keyAttribute===null?null:p004GlossaryContent(state.keyAttribute,locale);
}
