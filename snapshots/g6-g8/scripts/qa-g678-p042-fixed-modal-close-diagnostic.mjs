#!/usr/bin/env node
// Narrow actual378 diagnostic only; no product state/clock/loader injection.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {allowedRequest} from './qa-g678-nms-l01-p042-readable-my-lesson.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = 'output/playwright/g678-nms-l01-p042-fixed-modal-close-diagnostic-v1';
const SELF = 'scripts/qa-g678-p042-fixed-modal-close-diagnostic.mjs';
const hash = b => createHash('sha256').update(b).digest('hex');
const binding = async p => {const b = await readFile(path.join(ROOT,p));return {path:p,bytes:b.length,sha256:hash(b)};};
const PREFIX = 'catalog/product-bridge-calibrations/g678-current-js-378-page-registration-v1';
const pins = {
  'packages/demos/private-current-js-registry.json':'c075c204a21c020da2cef54bec74a2e713d7eba1c4fc3d55b158e0d8a8d464e2',
  [`${PREFIX}.json`]:'cf4921508fcaff5270c2dc4a3bd2571397b9c456b0ff5c1cae46378081e71cf5',
  [`${PREFIX}.fragment.json`]:'ae0be0d61384d2f95049b0b37b464174b7829ff93a219272ddf4692f4e72a869',
  [`${PREFIX}.activation.json`]:'68a61339c66a0a46b740b4a6f06db0698a07a5a2057f5e78b3dce6e7a1e4d009',
};
const paths = [SELF,'scripts/qa-g678-nms-l01-p042-readable-my-lesson.mjs',...Object.keys(pins),
  'apps/web/app/globals.css','apps/web/components/legacy-responsive-lesson-shell.tsx',
  'apps/web/components/descriptor-driven-whole-lesson-player.tsx'];
const inputs = await Promise.all(paths.map(binding));
for (const b of inputs) if (pins[b.path]) assert.equal(b.sha256,pins[b.path]);
await mkdir(path.join(ROOT,OUT));
const save = (name,b) => writeFile(path.join(ROOT,OUT,name),b,{flag:'wx'});
await save('qa-runner-source.mjs',await readFile(path.join(ROOT,SELF)));
const evidence = {scope:'Narrow actual378 fixed-modal Close diagnostic; not full case or product calibration.',inputs,errors:[],requests:[],screenshots:[],productCalibrationPassed:false};
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference',serviceWorkers:'block'});
await context.route('**/*',async route => {const url=route.request().url(),allowed=allowedRequest(url);evidence.requests.push({url,allowed});if(allowed)await route.continue();else await route.abort();});
await context.routeWebSocket('**/*',ws => {const allowed=allowedRequest(ws.url(),true);evidence.requests.push({url:ws.url(),allowed});if(allowed)ws.connectToServer();else ws.close();});
const page=await context.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')evidence.errors.push(m.text());});
const HOST='[data-lesson-player][data-current-animation-id]';
const shot=async name=>{const b=await page.screenshot({fullPage:false});await save(name,b);evidence.screenshots.push({path:`${OUT}/${name}`,bytes:b.length,sha256:hash(b)});};
try {
  await page.goto('http://127.0.0.1:3324/en/migration-status/g678-calibration/shared-nms002-l01-p042',{waitUntil:'networkidle'});
  await page.waitForFunction(HOST=>document.querySelector(HOST)?.getAttribute('data-hydrated')==='true'&&document.querySelector('[data-p042-readable-content]'),HOST);
  const trigger=page.locator(`${HOST} button[data-responsive-focus-key="key-terms"]:visible`).first();
  await trigger.scrollIntoViewIfNeeded();await trigger.click();
  const panel=page.locator(`[id=${JSON.stringify(await trigger.getAttribute('aria-controls'))}]`);await panel.waitFor({state:'visible'});
  const close=panel.getByRole('button',{name:'Close tool',exact:true});
  evidence.geometry=await close.evaluate(node=>{
    const rect=n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
    const chain=[];for(let a=node;a;a=a.parentElement){const s=getComputedStyle(a);chain.push({tag:a.tagName,id:a.id,className:String(a.className),rect:rect(a),position:s.position,overflowX:s.overflowX,overflowY:s.overflowY,transform:s.transform,translate:s.translate,rotate:s.rotate,scale:s.scale,filter:s.filter,backdropFilter:s.backdropFilter,perspective:s.perspective,contain:s.contain,containerType:s.containerType,willChange:s.willChange,contentVisibility:s.contentVisibility,clipPath:s.clipPath,maskImage:s.maskImage,display:s.display,visibility:s.visibility,opacity:s.opacity,inert:a.inert,ariaHidden:a.getAttribute('aria-hidden')});}
    const b=rect(node),coords=[[b.left+4,b.top+4],[b.right-4,b.top+4],[(b.left+b.right)/2,(b.top+b.bottom)/2],[b.left+4,b.bottom-4],[b.right-4,b.bottom-4]];
    return {viewport:{width:innerWidth,height:innerHeight,scrollX,scrollY},chain,points:coords.map(([x,y])=>{const h=document.elementFromPoint(x,y);return {x,y,unobstructed:node.contains(h),hitTag:h?.tagName,hitClass:String(h?.className)};})};
  });
  await shot('close-before-normal-activation.png');
  assert.ok(evidence.geometry.points.every(p=>p.unobstructed));
  await close.click();
  await page.waitForFunction(()=>document.activeElement?.getAttribute('data-responsive-focus-key')==='key-terms');
  evidence.closed=await panel.isVisible()===false;evidence.focusReturned=true;
  await shot('close-after-normal-activation.png');
  assert.ok(evidence.closed);assert.deepEqual(evidence.errors,[]);assert.ok(evidence.requests.every(r=>r.allowed));
  evidence.status='passed';
} catch(error) {evidence.status='failed';evidence.failure=String(error);process.exitCode=1;}
finally {await browser.close();evidence.inputsAfter=await Promise.all(paths.map(binding));assert.deepEqual(evidence.inputsAfter,inputs);evidence.inputsUnchanged=true;await save('evidence.json',`${JSON.stringify(evidence,null,2)}\n`);}
console.log(JSON.stringify({status:evidence.status,geometry:evidence.geometry,closed:evidence.closed,focusReturned:evidence.focusReturned,errors:evidence.errors,output:OUT},null,2));
