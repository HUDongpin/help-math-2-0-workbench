import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P027NativeTextV1} from '../src/alg-l06-p027-native-text-v1';

test('source English runs remain English under the Spanish host policy',()=>{
 const html=renderToStaticMarkup(React.createElement(P027NativeTextV1,
  {frame:248,language:'es',onGlossary:()=>{}}));
 assert.match(html,/lang="en"/u);
 assert.match(html,/data-p027-language-policy="source-en-fallback"/u);
 assert.match(html,/data-p027-source-canvas-preserved="true"/u);
 assert.match(html,/data-p027-suppressed-text-instance-ids=""/u);
 assert.match(html,/>The <\/span>/u);
 assert.match(html,/vertical-line test/u);
 assert.match(html,/data-source-color-rgb="0,0,204"/u);
 assert.match(html,/the graph at more than one /u);
 assert.match(html,/data-p027-glossary-key="Point"/u);
 assert.match(html,/Abrir glosario: Point/u);
 assert.doesNotMatch(html,/Prueba de la línea vertical/u);
});

test('partial masked ink stays in Canvas while current controls are keyboard-native buttons',()=>{
 const early=renderToStaticMarkup(React.createElement(P027NativeTextV1,
  {frame:2,onGlossary:()=>{}}));
 assert.match(early,/data-p027-partial-instance-ids="sprite-46\/depth-3\/generation-1"/u);
 assert.doesNotMatch(early,/data-source-text-id="character-5"/u);
 assert.doesNotMatch(early,/data-source-button-instance-id=/u);
 const first=renderToStaticMarkup(React.createElement(P027NativeTextV1,
  {frame:16,onGlossary:()=>{}}));
 assert.match(first,/type="button"/u);
 assert.match(first,/data-p027-glossary-key="Vertical-line test"/u);
 assert.match(first,/data-source-button-visual-state="full-hit-and-own-blue-glyph"/u);
 assert.match(first,/data-source-label-instance-id="sprite-46\/depth-3\/generation-1"/u);
 const split=renderToStaticMarkup(React.createElement(P027NativeTextV1,
  {frame:194,onGlossary:()=>{}}));
 assert.match(split,/data-source-label-segment="vertical"/u);
 assert.match(split,/data-source-label-segment="line"/u);
 assert.match(split,/data-source-label-run-id="character-15\/run-1"/u);
 assert.match(split,/data-p027-glossary-key="Line"/u);
 const noHandler=renderToStaticMarkup(React.createElement(P027NativeTextV1,{frame:194}));
 assert.match(noHandler,/type="button"[^>]*disabled=""/u);
});

test('graph number source definitions emerge after frame 265 and Replay clears later copy',()=>{
 const graph=renderToStaticMarkup(React.createElement(P027NativeTextV1,{frame:266}));
 assert.match(graph,/data-source-text-id="character-25"/u);
 assert.match(graph,/data-source-text-id="character-35"/u);
 const replay=renderToStaticMarkup(React.createElement(P027NativeTextV1,{frame:1}));
 assert.doesNotMatch(replay,/data-source-text-id=/u);
 assert.doesNotMatch(replay,/data-source-button-instance-id=/u);
 assert.match(replay,/data-p027-native-ready-instance-ids=""/u);
});

test('the source-key button passes its current trigger through the native click contract',()=>{
 const received:{key:string;trigger:HTMLButtonElement}[]=[];
 const root=P027NativeTextV1({frame:194,onGlossary:(key,trigger)=>received.push({key,trigger})});
 const children=React.Children.toArray(root.props.children);
 const controls=children.find(child=>React.isValidElement<{children:React.ReactNode}>(child)&&
  child.props['data-p027-section' as keyof typeof child.props]==='source-glossary-controls');
 assert(React.isValidElement<{children:React.ReactNode}>(controls));
 const buttons=React.Children.toArray(controls.props.children)
  .filter((child):child is React.ReactElement<Record<string,unknown>>=>React.isValidElement(child));
 const line=buttons.find(button=>button.props['data-p027-glossary-key']==='Line');
 assert(line);assert.equal(line.props.type,'button');assert.equal(line.props.disabled,false);
 const trigger={type:'button'} as HTMLButtonElement;
 (line.props.onClick as (event:{currentTarget:HTMLButtonElement})=>void)({currentTarget:trigger});
 assert.deepEqual(received,[{key:'Line',trigger}]);
});
