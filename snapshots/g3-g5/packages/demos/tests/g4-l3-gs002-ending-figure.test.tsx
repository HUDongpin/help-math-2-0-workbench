import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {Gs002EndingFigure} from '../src/modern-lessons/g4-l3-gs002-ending-figure';
import paints from '../src/modern-lessons/generated/g4-l3-gs002-ending-paints.json';
import ending from '../src/modern-lessons/generated/g4-l3-gs002-ending.json';
test('ending paint closure covers each source identity with closed fills and exact embedded JPEG',()=>{
  assert.deepEqual([...paints.staticShapes,...paints.morphShapes].map(s=>[s.characterId,s.sourceTagSha256]).sort((a,b)=>Number(a[0])-Number(b[0])),
    ending.shapes.map(s=>[s.characterId,s.sourceTagSha256]).sort((a,b)=>Number(a[0])-Number(b[0])));
  assert.deepEqual(paints.openFills,[]);assert.deepEqual(paints.sentinelBitmapFills,[]);
  assert.deepEqual(paints.bitmapIds,[167]);assert.equal(paints.bitmaps[0].width,534);assert.equal(paints.bitmaps[0].height,426);
});
test('all186 vector frames render with source mask, without Canvas or outlined teaching text',()=>{
  for(let frame=1;frame<=186;frame++){
    const html=renderToStaticMarkup(<Gs002EndingFigure elapsedMs={(frame-1)*1000/12}/>);
    assert(html.includes(`data-gs002-ending-frame="${frame}"`));assert(html.includes('<clipPath'));
    assert(!html.includes('<canvas'));assert(!html.includes('<text'));
    // SVG clipping accepts direct geometry, not a nested grouping container.
    assert(!/<clipPath[^>]*>\s*<g[\s>]/.test(html));
  }
  const frozen=renderToStaticMarkup(<Gs002EndingFigure elapsedMs={0} reducedMotion/>);
  assert(frozen.includes('data-gs002-ending-frame="186"'));
});
