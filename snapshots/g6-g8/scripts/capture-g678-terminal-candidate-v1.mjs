#!/usr/bin/env node
// One bounded generated drawing asset, every source frame, selected teaching-beat screenshots.
// This capture supplies Current-JS evidence only. It grants no original-runtime authority.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const ROOT=path.resolve(import.meta.dirname,'..');
const args=Object.fromEntries(Array.from({length:(process.argv.length-2)/2},(_,i)=>[process.argv[2+2*i],process.argv[3+2*i]]));
assert.deepEqual(Object.keys(args).sort(),['--builder','--frames','--output']);
assert(/^scripts\/build-g678-[a-z0-9-]+\.mjs$/u.test(args['--builder']));
const {ID,FREEZE,pin,encode}=await import(pathToFileURL(path.join(ROOT,args['--builder'])));
const packet=JSON.parse(await readFile(path.join(ROOT,FREEZE))),asset=packet.entry.artifacts.runtime;
const runtime=await readFile(path.join(ROOT,asset.path));assert.deepEqual(pin(asset.path,runtime),asset);
const out=args['--output'];assert(path.isAbsolute(out));await mkdir(out);
const frames=args['--frames'].split(',').map(Number),last=packet.selectedPages[0].runtime.frameCount;
assert(frames.every(f=>Number.isSafeInteger(f)&&f>=1&&f<=last));
const receipt={animationId:ID,asset,freeze:pin(FREEZE,await readFile(path.join(ROOT,FREEZE))),frameCount:last,states:[],screenshots:[],errors:[],requests:[],status:'running',originalRuntimeAccepted:false,strictComplete:false};
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:800,height:600}});
 page.on('pageerror',e=>receipt.errors.push(e.message));await page.route('**/*',route=>{receipt.requests.push(route.request().url());return route.abort();});
 await page.setContent('<html><body style="margin:0"><canvas id="stage" width="800" height="600"></canvas></body></html>');
 await page.addScriptTag({content:runtime.toString()});
 await page.evaluate(async id=>{await window.HELP_MATH_CANVAS_ASSETS[id].ready;},ID);
 receipt.states=await page.evaluate(({ID,last})=>{
  const a=window.HELP_MATH_CANVAS_ASSETS[ID],c=document.getElementById('stage'),states=[];
  for(let frame=1;frame<=last;frame++)states.push(a.render(c,{frame,scenario:'source-static-frame',lang:'en',seed:0}));return states;
 },{ID,last});
 assert.equal(receipt.states.length,last);receipt.states.forEach((s,i)=>{assert.equal(s.localFrame,i+1);assert.equal(s.frameDomain,packet.selectedPages[0].runtime.frameDomain);});
 for(const frame of frames){await page.evaluate(({ID,frame})=>window.HELP_MATH_CANVAS_ASSETS[ID].render(document.getElementById('stage'),{frame,scenario:'source-static-frame',lang:'en',seed:0}),{ID,frame});
  const file=path.join(out,`frame-${frame}.png`);await page.locator('canvas').screenshot({path:file});receipt.screenshots.push({...pin(file,await readFile(file)),frame});}
 const replay=await page.evaluate(({ID,last})=>{const a=window.HELP_MATH_CANVAS_ASSETS[ID],c=document.getElementById('stage');const q={frame:1,scenario:'source-static-frame',lang:'en',seed:0};a.render(c,q);const first=c.toDataURL();a.render(c,{...q,frame:Math.min(487,last)});a.render(c,q);return first===c.toDataURL();},{ID,last});
 assert(replay);receipt.replayDrawingDeterministic=true;
 assert.deepEqual(receipt.errors,[]);assert.deepEqual(receipt.requests,[]);assert.deepEqual(pin(asset.path,await readFile(path.join(ROOT,asset.path))),asset);receipt.status='passed';
}catch(e){receipt.status='failed';receipt.failure=e.stack;process.exitCode=1;}finally{await browser.close();await writeFile(path.join(out,'receipt.json'),encode(receipt),{flag:'wx'});await writeFile(path.join(out,'runner.mjs'),await readFile(new URL(import.meta.url)),{flag:'wx'});console.log(JSON.stringify({output:out,status:receipt.status,frames:receipt.states.length,shots:receipt.screenshots.length,failure:receipt.failure}));}
