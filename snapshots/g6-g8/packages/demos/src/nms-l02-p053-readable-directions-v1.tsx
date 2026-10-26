import React from 'react';
import {P053_DISPLAY_DATA} from './generated/nms-l02-p053-display-data-v1';

// Sprite 104's source text fields in reading order (ascending source y), not
// translated or reconstructed wording. The native scene retains its vectors.
export const P053_POPUP_PARAGRAPHS=Object.freeze([13,16,102,103].map(characterId=>{
 const field=P053_DISPLAY_DATA.definitions.texts.find(item=>item.characterId===characterId);
 if(!field||field.kind==='dynamic-field')throw Error('P053_POPUP_TEXT_SOURCE');
 return Object.freeze({characterId,text:field.runs.map(run=>run.text).join('').trim()});
}));

/** Reflow the same source instructions on narrow screens; expose the complete
 * source wording to assistive technology at every width. */
export function P053ReadableDirections({uiLanguage='en'}:{uiLanguage?:'en'|'es'}){
 return <section className="p053-readable-directions" data-p053-readable-directions
  aria-label={uiLanguage==='es'?'Instrucciones del juego en inglés':'English game directions'}>
  <h2>{uiLanguage==='es'?'Instrucciones del juego (inglés)':'Game directions'}</h2>
  <div lang="en">{P053_POPUP_PARAGRAPHS.map(item=><p key={item.characterId}
   data-p053-source-text-id={item.characterId}>{item.text}</p>)}</div>
 </section>;
}
