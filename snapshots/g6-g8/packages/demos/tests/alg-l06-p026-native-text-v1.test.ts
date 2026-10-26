import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P026NativeTextV1} from '../src/alg-l06-p026-native-text-v1';

test('source English native copy retains blue term runs and Spanish UI policy',()=>{
 const html=renderToStaticMarkup(React.createElement(P026NativeTextV1,{frame:145,language:'es',onGlossary:()=>{}}));
 assert.match(html,/data-p026-language-policy="source-en-fallback"/u);
 assert.match(html,/lang="en"/u);
 assert.match(html,/The dependent variable is the /u);
 assert.match(html,/data-source-color-rgb="0,0,204"/u);
 assert.match(html,/data-source-button-instance-id="sprite-55\/depth-19\/generation-1"/u);
 assert.match(html,/data-source-label-instance-id="sprite-55\/depth-16\/generation-2"/u);
 assert.match(html,/data-source-button-visual-state="full-hit-and-own-blue-glyph"/u);
 assert.match(html,/data-p026-glossary-key="Range"/u);
 assert.match(html,/glosario/u);
 assert.doesNotMatch(html,/La variable dependiente es/u);
});

test('native suppression is instance-scoped while incomplete masks stay on canvas',()=>{
 const invisible=renderToStaticMarkup(React.createElement(P026NativeTextV1,{frame:2,onGlossary:()=>{}}));
 assert.doesNotMatch(invisible,/data-source-button-instance-id=/u);
 const early=renderToStaticMarkup(React.createElement(P026NativeTextV1,{frame:31}));
 assert.match(early,/data-p026-suppressed-text-ids="17,15"/u);
 assert.doesNotMatch(early,/data-source-text-id="character-20"/u);
 const complete=renderToStaticMarkup(React.createElement(P026NativeTextV1,{frame:131}));
 assert.match(complete,/data-p026-suppressed-text-ids="17,15,20,23"/u);
 assert.match(complete,/data-source-text-id="character-23"/u);
 const letters=renderToStaticMarkup(React.createElement(P026NativeTextV1,{frame:200}));
 assert.match(letters,/data-p026-canvas-fallback-instance-ids="[^"]*depth-28\/generation-2/u);
 assert.doesNotMatch(letters,/data-source-text-id="character-32"/u);
});
