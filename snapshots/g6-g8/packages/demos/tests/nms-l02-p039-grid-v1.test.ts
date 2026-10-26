import assert from 'node:assert/strict';
import test from 'node:test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P039Grid,p039GridArtAt} from '../src/nms-l02-p039-grid-v1';
import {p039Initial,p039Advance,p039SetPercent} from '../src/nms-l02-p039-state-v1';
import {p039IntroAt} from '../src/nms-l02-p039-intro-v1';

test('source vector diagram matches audited source fill, alpha, handle and pointer across all intro frames',()=>{
 for(let frame=1;frame<=545;frame++){
  const poses=p039GridArtAt(frame),audit=p039IntroAt(frame);
  assert.equal(poses.find(p=>p.depth===2)?.characterId,String(audit.sourceFillId));
  assert.equal(poses.find(p=>p.depth===3)?.opacity,audit.gridAlpha);
  assert.equal(poses.find(p=>p.depth===5)?.matrix[4],audit.sourceHandleX);
  assert.deepEqual(poses.find(p=>p.depth===120)?.matrix??null,audit.pointer?.matrix??null);
  assert.deepEqual(poses.filter(p=>p.depth===118||p.depth===119).map(p=>Number(p.characterId)),audit.emphasisIds);
 }
});
test('native practice renders exactly the selected cell count and localized accessible name',()=>{
 const initial=p039Advance(p039Initial(),545);
 for(let percent=0;percent<=100;percent++){
  const html=renderToStaticMarkup(createElement(P039Grid,{state:p039SetPercent(initial,percent),language:'es'}));
  assert.equal((html.match(/data-cell-index=/g)||[]).length,100);
  assert.equal((html.match(/data-filled="true"/g)||[]).length,percent);
  assert(html.includes(`aria-label="${percent} de 100 cuadros sombreados"`));
 }
});
