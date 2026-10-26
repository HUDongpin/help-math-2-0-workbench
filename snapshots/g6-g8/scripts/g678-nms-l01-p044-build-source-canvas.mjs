#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {parse} from 'acorn';
import {mapSource} from './g678-nms-l01-p044-canvas-source-map.mjs';
import {createMethods} from './lib/g678-nms-l01-p044-canvas-runtime.mjs';
import {file,inventory,enforceLimit,GATES} from './g678-nms-l01-p044-extract-visual-slice.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const RAW='work/g678-shared-page-factory/g678-nms-l01-p044-visual-slice-v2';
export const RUN='work/g678-shared-page-factory/g678-nms-l01-p044-source-canvas-v1';
export const GENERATED='packages/demos/src/generated/g678-nms-l01-p044-source-canvas-v1.ts';
const H=b=>createHash('sha256').update(b).digest('hex'),json=v=>`${JSON.stringify(v,null,2)}\n`;
const one=(s,a,b)=>{assert.equal(s.split(a).length-1,1,`Exact source marker missing:${a.slice(0,50)}`);return s.replace(a,b);};
function stripHelperViewer(raw){const s=raw.replace(/\r\n/g,'\n'),begin="window.addEventListener('load', function () {",end='\nfunction drawMorphPath(ctx, p, ratio, doStroke, scaleMode) {';
  assert.equal(s.split(begin).length-1,1);assert.equal(s.split(end).length-1,1);const a=s.indexOf(begin),b=s.indexOf(end,a);assert.ok(b>a);return s.slice(0,a)+s.slice(b);}
export function sanitizeHelper(raw){let s=stripHelperViewer(raw);s=one(s,'Filters = {};','var Filters = {};');
  s=one(s,'    //temporary add to document to get this work (getImageData, etc.)\n    document.body.appendChild(c);\n    document.body.removeChild(c);\n','    // Maintained adapter uses detached helper canvases.\n');
  s=one(s,'eval(obj + "(ctx,new cxform(0,0,0,0,255,255,255,255),frame,ratio,time);");','resolveSourceObject(obj)(ctx,new cxform(0,0,0,0,255,255,255,255),frame,ratio,time);');
  s=one(s,'eval(obj + "(ctx,ctrans,frame,ratio,time);");','resolveSourceObject(obj)(ctx,ctrans,frame,ratio,time);');
  return s;}
function scopeFontFill(definitions){const fonts=[...definitions.matchAll(/function (font\d+)\(ctx,ch,textColor\)\{/g)].map(m=>m[1]);
  const re=/(function (font\d+)\(ctx,ch,textColor\)\{\n\s*)defaultFill = textColor;/g;assert.deepEqual([...definitions.matchAll(re)].map(m=>m[2]),fonts);return definitions.replace(re,'$1var defaultFill = textColor;');}
export function rootLayer(raw){assert.ok(!/<(?:script|foreignObject|animate|set)\b|<!DOCTYPE|<!ENTITY|\bon\w+=/i.test(raw));
  const matches=[...raw.matchAll(/<use\b[^>]*ffdec:characterId="293"[^>]*\/>/g)];assert.equal(matches.length,1);assert.ok(matches[0][0].includes('transform="matrix(1.0, 0.0, 0.0, 1.0, 412.35, 282.9)"'));
  return raw.replace(matches[0][0],'<!-- main293 is drawn by the separately source-mapped Canvas layer. -->');}
export function forbidden(code){for(const re of [/\beval\s*\(/,/\bFunction\s*\(/,/\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/,/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|Worker|localStorage|sessionStorage|indexedDB)\b/,/document\.body/,/\b(?:addEventListener|removeEventListener)\s*\(/])assert.ok(!re.test(code),`Forbidden generated runtime:${re}`);}
export async function compile(){const source=await mapSource(),helper=sanitizeHelper(source.helper),defs=scopeFontFill(source.annotated);
  const imageNames=[...defs.matchAll(/var (imageObj\d+) = document\.createElement\("img"\);/g)].map(m=>m[1]);assert.equal(imageNames.length,10);
  const rootSvg=rootLayer(await readFile(`${RAW}/root-svg/6.svg`,'utf8')),rootUri=`data:image/svg+xml;base64,${Buffer.from(rootSvg).toString('base64')}`;
  const objects=source.placedNames.map(name=>`${JSON.stringify(name)}:${name}`).join(',');
  const signature=`export function createP044SourceCanvasAdapter(targetCanvas) {`;
  const code=`// Generated only by g678-nms-l01-p044-build-source-canvas.mjs. Private candidate; distribution and acceptance closed.\n${signature}\n"use strict";\nvar canvas=targetCanvas;var ACTIVE_PATH=null,ACTIVE_OVERRIDES=null;\n${helper}\n${defs}\nconst SOURCE_OBJECTS=Object.freeze({${objects}});\nconst SOURCE_PLACEMENTS=${JSON.stringify(source.placements)};\nconst SOURCE_DOMAINS=${JSON.stringify(source.domains)};\nconst ROOT_STEP=${JSON.stringify(source.root)};\nconst rootImage=document.createElement("img");rootImage.src=${JSON.stringify(rootUri)};\nconst SOURCE_IMAGES=[rootImage,${imageNames.join(',')}];\nfunction resolveSourceObject(name){const renderer=SOURCE_OBJECTS[name];if(typeof renderer!=="function"||!Object.prototype.hasOwnProperty.call(SOURCE_OBJECTS,name))throw Error("Unknown source drawing object");return renderer;}\nfunction placeSource(obj,target,ctx,matrix,ctrans,blendMode,frame,ratio,time,index){const p=SOURCE_PLACEMENTS[index];if(!p||p.drawingFunction!==obj||!ACTIVE_PATH)throw Error("Unmapped source drawing call");const previous=ACTIVE_PATH;const step={parentDomain:p.parentDomain,depth:p.depth,sourceObjectId:p.sourceObjectId,placementFrame:p.placementFrame};const next=previous.concat(step);const key=JSON.stringify(next.map(s=>[s.parentDomain,s.depth,s.sourceObjectId,s.placementFrame]));const override=ACTIVE_OVERRIDES.get(key);if(override&&!override.visible)return;ACTIVE_PATH=next;try{place(obj,target,ctx,matrix,ctrans,blendMode,override?override.frame-1:frame,ratio,time);}finally{ACTIVE_PATH=previous;}}\nconst methods=(${createMethods.toString()})({targetCanvas,sourceImages:SOURCE_IMAGES,placements:SOURCE_PLACEMENTS,domains:SOURCE_DOMAINS,rootStep:ROOT_STEP,sourceDraw(state){const ctx=targetCanvas.getContext("2d");if(!ctx)throw Error("Missing source canvas context");if(!ctx.__p044SourceEnhanced){enhanceContext(ctx);Object.defineProperty(ctx,"__p044SourceEnhanced",{value:true});}ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";ctx.clearRect(0,0,800,600);ctx.drawImage(rootImage,0,0,800,600);ctx.save();ACTIVE_PATH=[ROOT_STEP];ACTIVE_OVERRIDES=state.overrideMap;try{ctx.transform(1,0,0,1,39.1,-386.8);sprite293(ctx,new cxform(0,0,0,0,255,255,255,255),state.request.mainFrame-1,0,0);}finally{ctx.restore();ACTIVE_PATH=null;ACTIVE_OVERRIDES=null;}}});return methods;\n}\n`;
  forbidden(code);parse(code,{ecmaVersion:2022,sourceType:'module'});
  const rawDefinitions=scopeFontFill(source.definitions),rawCode=`// Isolated raw-FFDec drawing probe only; not imported by product.\nexport function createP044RawCanvasProbe(targetCanvas){var canvas=targetCanvas;var Filters;\n${stripHelperViewer(source.helper)}\n${rawDefinitions}\nconst rootImage=document.createElement("img");rootImage.src=${JSON.stringify(rootUri)};const images=[rootImage,${imageNames.join(',')}];return {async ready(){await Promise.all(images.map(i=>i.complete&&i.naturalWidth?Promise.resolve():new Promise((r,j)=>{i.onload=r;i.onerror=j})))},render(mainFrame){const ctx=targetCanvas.getContext("2d");if(!ctx.__rawEnhanced){enhanceContext(ctx);ctx.__rawEnhanced=true;}ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,800,600);ctx.drawImage(rootImage,0,0,800,600);ctx.save();try{ctx.transform(1,0,0,1,39.1,-386.8);sprite293(ctx,new cxform(0,0,0,0,255,255,255,255),mainFrame-1,0,0)}finally{ctx.restore()}}};}\n`;
  // The raw probe intentionally retains original eval/helper semantics in its
  // isolated QA-only artifact. It is never the maintained adapter or product import.
  return {code,rawCode,rootSvg,source};}
export async function build(){const paths=['scripts/g678-nms-l01-p044-build-source-canvas.mjs','scripts/g678-nms-l01-p044-build-source-canvas.test.mjs','scripts/g678-nms-l01-p044-canvas-source-map.mjs','scripts/lib/g678-nms-l01-p044-canvas-runtime.mjs',`${RAW}/run.json`,
    'work/g678-shared-page-factory/g678-nms-l01-p044-visual-projection-v1/run.json','work/g678-shared-page-factory/g678-nms-l01-p044-visual-projection-v1/source-projection.json','work/g678-shared-page-factory/g678-nms-l01-p044-structural-crosscheck-v4/crosscheck.json',fileURLToPath(import.meta.resolve('acorn'))];
  const inputs=await Promise.all(paths.map(file)),{code,rawCode,rootSvg,source}=await compile(),out=path.join(ROOT,RUN);await mkdir(out);const save=(p,b)=>writeFile(path.join(out,p),b,{flag:'wx',mode:0o444});
  await save('raw-ffdec-probe.mjs',rawCode);await save('root-title-offstage-layer.svg',rootSvg);
  await save('source-instance-placements.json',json({root:source.root,placements:source.placements}));await save('source-call-map.json.gz',gzipSync(JSON.stringify(source.mapping)));
  const typed=`// @ts-nocheck -- generated source glyph/morph frontend; typed adapter contract is root-owned.\n${code}`;
  await writeFile(path.join(ROOT,GENERATED),typed,{flag:'wx',mode:0o444});
  const outputs=await inventory(out),generated=await file(GENERATED);const size=enforceLimit([...outputs,generated]);
  assert.deepEqual(await Promise.all(inputs.map(i=>file(i.path))),inputs);
  const receipt={schemaVersion:1,artifactType:'exact-p044-source-canvas-compiler-candidate',inputs,inputsUnchanged:true,outputs,generated,size,
    sourceCallCount:source.mapping.length,placementIdentityCount:source.placements.length,canvasSpriteDomainCount:Object.keys(source.domains).length,
    sourceObjectMapping:'Each annotated sprite place call matches exact XML depth/object/placement and six source matrix values. Full path includes every parent instance.',
    rawProbe:'QA-only original helper/eval, viewer autoplay removed; never imported into maintained product adapter.',
    maintainedSafety:'No eval/Function/timers/network/storage/listeners/document.body; all drawing names mapped to source allowlist.',
    namespace:'No existing course-* adapter gate or product/registry changed.',gates:GATES};await save('run.json',json(receipt));return {receipt:await file(`${RUN}/run.json`),generated,size};}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert.equal(process.argv.length,2);console.log(json(await build()));}
