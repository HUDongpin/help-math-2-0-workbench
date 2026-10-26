import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P053ReadableDirections,P053_POPUP_PARAGRAPHS} from '../src/nms-l02-p053-readable-directions-v1';
import {p053ReviewedScene} from '../src/nms-l02-p053-source-scene-v1';

test('readable popup follows the actual sprite-104 fields in source reading order',()=>{
 let popup:any;
 const walk=(scene:any)=>{for(const instance of scene.instances){
  if(instance.name?.text==='Mc_Popup')popup=instance.child;
  else if(instance.child)walk(instance.child);
 }};
 walk(p053ReviewedScene({frame:693,popupVisible:true}));
 assert.equal(popup.domainId,'sprite-104');
 const fields=popup.instances.filter((item:any)=>item.definitionKind==='text')
  .sort((a:any,b:any)=>a.matrix[5]-b.matrix[5]).map((item:any)=>item.characterId);
 assert.deepEqual(P053_POPUP_PARAGRAPHS.map(item=>item.characterId),fields);
 assert.equal(P053_POPUP_PARAGRAPHS.length,4);
 const text=P053_POPUP_PARAGRAPHS.map(item=>item.text).join('\n');
 assert.match(text,/correct match you get 10 points/);
 assert.match(text,/incorrect match 2 points are subtracted/);
 assert.match(text,/choose a level and then click Start/);
 const html=renderToStaticMarkup(<P053ReadableDirections uiLanguage="es"/>);
 assert.match(html,/Instrucciones del juego \(inglés\)/);assert.match(html,/lang="en"/);
 assert.equal((html.match(/data-p053-source-text-id=/g)||[]).length,4);
});
