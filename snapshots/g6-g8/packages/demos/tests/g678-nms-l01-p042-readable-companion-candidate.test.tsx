import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {G678_NMS_L01_P042_CANDIDATE_MODULE as BASE, G678_NMS_L01_P042_CONFIG as BASE_CONFIG} from '../src/g678-nms-l01-p042-candidate';
import {G678_NMS_L01_P042_SOURCE_VISUAL as SOURCE} from '../src/generated/g678-nms-l01-p042-source-visual-v1';
import {G678_NMS_L01_P042_READABLE_COMPANION_CANDIDATE_MODULE as MODULE, G678_NMS_L01_P042_READABLE_COMPANION_CONFIG as CONFIG,
  NmsL01P042ReadableCompanionRenderer, resolveNmsL01P042ReadableTarget} from '../src/g678-nms-l01-p042-readable-companion-candidate';
const context = {frame:1,frameDomain:'sprite-23',rootFrame:6,scenario:BASE_CONFIG.scenario,lang:'en' as const,seed:0,replay:0};
test('readable successor replaces only Renderer; source clock/state/Replay/capabilities/audio retain exact base identities',()=>{
  for(const key of Object.keys(BASE) as (keyof typeof BASE)[]) if(key !== 'Renderer') assert.equal(MODULE[key],BASE[key]);
  assert.notEqual(MODULE.Renderer,BASE.Renderer);
  for(let frame=1;frame<=125;frame++)assert.deepEqual(MODULE.getFrameState(frame,{...context,frame}),BASE.getFrameState(frame,{...context,frame}));
});
test('SSR has one semantic native literal representation, all original vectors, English language and zero invented controls',()=>{
  const html=renderToStaticMarkup(<NmsL01P042ReadableCompanionRenderer {...context}/>);
  assert.equal([...html.matchAll(/data-p042-readable-content="true"/g)].length,1);
  assert.match(html,/data-companion-placement="fallback" lang="en"/);
  assert.match(html,/data-p042-readable-source-plane="true" aria-hidden="true"/);
  assert.equal([...html.matchAll(/<li\b/g)].length,4); for(const literal of SOURCE.literalSteps)assert.ok(html.includes(`>${literal}</li>`));
  assert.match(html,/<h2[^>]*>Positive &amp; Negative Numbers: Test Skills<\/h2>/);
  assert.match(html,/<svg/); assert.match(html,/font-size:20px;line-height:1.5/);
  assert.doesNotMatch(html,/<button|<input|<audio|<video|<canvas|tabindex|aria-live/);
  const blocked=renderToStaticMarkup(<NmsL01P042ReadableCompanionRenderer {...context} lang="es"/>);
  assert.match(blocked,/data-source-state="blocked"/);assert.match(blocked,/<p lang="en" role="alert"/);
  assert.doesNotMatch(blocked,/data-p042-readable-content|<svg|aria-hidden="true"/);
});
function targetFixture() {
  const owner={},document={querySelectorAll:()=>[] as unknown[]};
  const target={id:`native-${CONFIG.pageInteractionCompanionTargetIdSuffix}`,isConnected:true,tagName:'DIV',namespaceURI:'http://www.w3.org/1999/xhtml',
    ownerDocument:document,dataset:{pageInteractionCompanionHost:'true'},parentElement:owner,closest:()=>owner};
  document.querySelectorAll=()=>[target];
  const source={isConnected:true,ownerDocument:document,closest:()=>owner,contains:()=>false};
  return{source,target,document,owner};
}
test('portal policy admits only a unique exact marked DIV directly owned by the same native learning column',()=>{
  const f=targetFixture();assert.equal(resolveNmsL01P042ReadableTarget(f.source as unknown as HTMLElement,f.target.id),f.target);
  for(const mutate of [(f:ReturnType<typeof targetFixture>)=>f.target.tagName='BUTTON',f=>f.target.dataset.pageInteractionCompanionHost='false',
    f=>f.target.isConnected=false,f=>f.source.isConnected=false,f=>f.target.parentElement={},f=>f.target.closest=()=>({}),
    f=>f.source.closest=()=>null as never,f=>f.source.contains=()=>true,f=>f.target.ownerDocument={} as never,
    f=>f.document.querySelectorAll=()=>[f.target,f.target],f=>f.document.querySelectorAll=()=>[],f=>f.target.namespaceURI='http://www.w3.org/2000/svg']) {
    const f=targetFixture();mutate(f);assert.equal(resolveNmsL01P042ReadableTarget(f.source as unknown as HTMLElement,f.target.id),null);
  }
  assert.equal(resolveNmsL01P042ReadableTarget(f.source as unknown as HTMLElement,'arbitrary-id'),null);
  assert.equal(resolveNmsL01P042ReadableTarget(null,f.target.id),null);
});
test('explicit ink/surface contrast exceeds4.5; native typography is20px with1.5 line height and8px spacing',()=>{
  const luminance=(hex:string)=>hex.slice(1).match(/../g)!.map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4)
    .reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);
  assert.ok((luminance(CONFIG.color.surface)+.05)/(luminance(CONFIG.color.ink)+.05)>=4.5);
  assert.ok(CONFIG.stepFontPx>=20);assert.ok(CONFIG.lineHeight>=1.5);assert.ok(CONFIG.stepGapPx>=8);
});
