import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile, mkdir, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from 'acorn';
import {buildSafeRuntime} from './build-safe-ffdec-canvas-adapter.mjs';
import {validateP003Runtime} from './validate-g678-alg-l12-p003-runtime.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'shared-alg001-l12-p003', WORK = `migrations/${ID}`;
const OUT = `${WORK}/candidate-v1`, EXPORT = `${WORK}/audit/ffdec-26.2.1-canvas-v1`;
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE = 'G6-G8-shared/ALG001/L12/RW/L12RW03.swf';
const SHA = '384f7e8e269768063d8e6ca410350ccbd5c321596fd6f55d68903cc1b6d2bccb';
const hash = b => createHash('sha256').update(b).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;
async function pinned(file, sha) {
  const b = await readFile(path.resolve(ROOT, file));
  assert.equal(hash(b), sha, `input drift: ${file}`); return b;
}
function once(text, marker, replacement) {
  assert.equal(text.split(marker).length, 2, `nonunique marker: ${marker.slice(0,60)}`);
  return text.replace(marker, replacement);
}
function definitions(html) {
  const start = html.indexOf('var scalingGrids = {};'), end = html.indexOf('\nvar frame = -1;');
  assert(start >= 0 && end > start); return html.slice(start, end);
}
export function composeP003Definitions(mainHtml, rootHtml) {
  const functions = html => {
    const source = definitions(html);
    return new Map(parse(source,{ecmaVersion:2020}).body.filter(n => n.type === 'FunctionDeclaration')
      .map(n => [n.id.name, source.slice(n.start,n.end)]));
  };
  const main = functions(mainHtml), root = functions(rootHtml);
  assert.deepEqual([...root.keys()].filter(k => !main.has(k)), ['text2','shape165','sprite166','shape167','main']);
  assert.deepEqual([...main.keys()].filter(k => root.has(k) && main.get(k) !== root.get(k)), ['sprite164']);
  // Only the standalone main has the export-bounds wrapper. Retain it and offset once.
  assert.match(main.get('sprite164'), /ctx.transform\(1,0,0,1,131\.4,406\.4\)/);
  // Root main is retained only for the audited safe dispatch allowlist; never executed.
  const additions = ['text2','shape165','sprite166','shape167','main'].map(k => root.get(k)).join('\n');
  return once(mainHtml,'\nvar frame = -1;',`${additions}\nvar frame = -1;`);
}
async function main() {
  const promote = process.argv[2] === '--promote';
  const check = process.argv[2] === '--check' || promote;
  assert(process.argv.length === 2 || (process.argv.length === 3 && check));
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE_ROOT);
  assert.equal(await realpath(SOURCE_ROOT), SOURCE_ROOT);
  const sourceFile = path.join(SOURCE_ROOT,SOURCE);
  assert.equal(await realpath(sourceFile), sourceFile);
  const source = await pinned(sourceFile,SHA); assert.equal(source.length,439040);
  const mainPath = `${EXPORT}/sprites/DefineSprite_164/frames.html`, rootPath = `${EXPORT}/frames/frames.html`;
  const mainBytes = await pinned(mainPath,'33babd900c40d5e224d181dec13a079ac413eaf08c88de2a8eec4b8eacba24f7');
  const rootBytes = await pinned(rootPath,'63da1832e0f313042b421ce2bbf0f33b69c0e10274ebcd926e6efcdf3e1b8e03');
  const helperPath = `${EXPORT}/sprites/DefineSprite_164/canvas.js`;
  const helper = await pinned(helperPath,'78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93');
  const structure = JSON.parse(await readFile(path.join(ROOT,WORK,'audit/source-structure.json')));
  assert.equal(structure.source.sha256,SHA);
  assert.deepEqual(structure.root.placements.map(x=>[x.frame,x.objectID,x.depth,x.matrix]),[
    [6,'2','1',{transX:'2407',transY:'-2760'}], [6,'164','2',{transX:'4189',transY:'5670'}],
    [6,'166','146',{transX:'8000',transY:'869'}], [6,'167','148',{transX:'0',transY:'0'}],
  ]);
  const spec = JSON.parse(await pinned('migrations/shared-alg001-l12-p011/candidate-v2/adapter-spec.json','bf1e93fc87b09cc967f9fa1b3dea253334141e34c7a58fb78c4f5de4b0cfaa3b'));
  const html = composeP003Definitions(mainBytes.toString().replace(/\r\n?/g,'\n'),rootBytes.toString().replace(/\r\n?/g,'\n'));
  const defs = definitions(html);
  const placed = [...new Set([...defs.matchAll(/place\("([\w$]+)"/g)].map(m=>m[1]))].sort();
  const fonts = [...defs.matchAll(/function\s+(font\d+)\s*\(/g)].map(m=>m[1]);
  assert.deepEqual(fonts,['font1','font4','font23']);
  assert.deepEqual([...defs.matchAll(/document\.createElement\("([a-z]+)"\)/g)].map(m=>m[1]),['img']);
  const images = [...defs.matchAll(/var\s+(imageObj\d+)\s*=\s*document\.createElement\("img"\);/g)].map(m=>m[1]);
  assert.deepEqual(images,['imageObj9']);
  const briefPath = `${WORK}/audit/SOURCE_SPEC_2026-09-26.md`, brief = await readFile(path.join(ROOT,briefPath));
  Object.assign(spec,{animationId:`course-${ID}`,builderAnimationId:`course-${ID}`,finalAnimationId:ID,classification:'private-four-layer-glossary-drawing-candidate',title:'Page 2'});
  spec.source = {swf:`$HELP_MATH_G678_SOURCE_ROOT/${SOURCE}`,swfBytes:source.length,swfSha256:SHA};
  spec.evidence = {scenarioInventory:briefPath,scenarioInventorySha256:hash(brief),audioAudit:briefPath,audioAuditSha256:hash(brief)};
  Object.assign(spec.ffdecExport,{helper:helperPath,helperSha256:hash(helper),helperBytes:helper.length,
    framesHtml:mainPath,framesHtmlSha256:hash(mainBytes),framesHtmlBytes:mainBytes.length,
    targetSpriteObjectId:164,targetSpriteFunction:'sprite164',exportCanvas:{width:665,height:720},
    exportInternalTranslation:{x:131.4,y:406.4},expectedPlacedFunctionCount:placed.length,
    expectedPlacedFunctionsSha256:hash(JSON.stringify(placed)),expectedFontFunctionCount:fonts.length,
    expectedFontFunctionsSha256:hash(JSON.stringify(fonts)),embeddedImageVariableCount:1,embeddedImageVariablesSha256:hash(JSON.stringify(images))});
  Object.assign(spec.timeline.root,{placementDepth:'2',placementTwips:{x:4189,y:5670},placementPixels:{x:209.45,y:283.5}});
  spec.timeline.local = {timelineId:'sprite-164',frameCount:1008,livePlaybackEndFrame:1008,playbackMode:'once',publicFrameIndexing:'one-indexed'};
  spec.timeline.stageRenderOffset = {x:209.45-131.4,y:283.5-406.4};
  spec.runtimeContract.unresolved = ['Source-frame drawing only; original host/child clock and six glossary traces pending.','Audio is required but disabled; timing, language and listening unresolved.','Spanish drawing, typography, original fidelity, human/Owner review and publication pending.'];
  spec.output = {script:`${OUT}/canvas-renderer.js`,manifest:`${OUT}/adapter-manifest.json`,spec:`${OUT}/adapter-spec.json`,globalRegistry:'HELP_MATH_CANVAS_ASSETS'};
  spec.sourceComposition = {rootFrame:6,rootExport:rootPath,rootExportSha256:hash(rootBytes),layers:structure.root.placements,nestedSprite22:'source-exported single-frame child retained inside sprite164'};
  let runtime = buildSafeRuntime({helperSource:helper.toString(),framesHtml:html,spec}).runtime;
  const call = `ctx.transform(1, 0, 0, 1, ${spec.timeline.stageRenderOffset.x}, ${spec.timeline.stageRenderOffset.y});\n        sprite164(ctx, new cxform(0,0,0,0,255,255,255,255), state.exportFrame, 0, 0);`;
  runtime = once(runtime,call,`place("text2",canvas,ctx,[0.05,0,0,0.05,120.35,-138],new cxform(0,0,0,0,255,255,255,255),1,0,0,0);\nctx.save();${call}\nctx.restore();\nplace("sprite166",canvas,ctx,[0.05,0,0,0.05,400,43.45],new cxform(0,0,0,0,255,255,255,255),1,0,5,0);\nplace("shape167",canvas,ctx,[0.05,0,0,0.05,0,0],new cxform(0,0,0,0,255,255,255,255),1,0,0,0);`);
  runtime = runtime.split(JSON.stringify(spec.animationId)).join(JSON.stringify(ID));
  runtime = once(runtime,'var registry = global[',`var sourceFrameRender = render;
render = function(targetCanvas,request) {
    if (targetCanvas.width !== 800 || targetCanvas.height !== 600) throw new Error("targetCanvas must be exactly 800x600");
    var surface = document.createElement("canvas"); surface.width=800; surface.height=600;
    var state=sourceFrameRender(surface,request), ctx=targetCanvas.getContext("2d");
    ctx.save();try{ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation="copy";ctx.drawImage(surface,0,0);}finally{ctx.restore();}
    ["data-flash-frame","data-flash-frame-domain","data-flash-root-frame","data-runtime-scenario","data-runtime-seed"].forEach(function(name){targetCanvas.setAttribute(name,surface.getAttribute(name));});
    return state;
};
var registry = global[`);
  validateP003Runtime(runtime);
  const manifest = {schemaVersion:1,animationId:ID,status:'unregistered-composed-drawing-candidate',sourceSha256:SHA,runtimeSha256:hash(runtime),runtimeBytes:Buffer.byteLength(runtime),composition:spec.sourceComposition,acceptanceEffects:{currentJavaScriptRegistered:false,audioAccepted:false,fidelityAccepted:false,strictComplete:false}};
  if(!check) await mkdir(path.join(ROOT,OUT));
  for(const [name,data] of [['adapter-spec.json',json(spec)],['canvas-renderer.js',runtime],['adapter-manifest.json',json(manifest)]]) {
    const file=path.join(ROOT,OUT,name);
    if(check) assert.equal(await readFile(file,'utf8'),data,`generated drift: ${name}`);
    else await writeFile(file,data,{flag:'wx'});
  }
  if(promote) {
    const directory=path.join(ROOT,`work/g678-shared-page-factory/g678-alg-l12-p003-current-js-v1/members/${ID}`);
    await mkdir(directory,{recursive:true});
    const target=path.join(directory,'canvas-renderer.js');
    try {await writeFile(target,runtime,{flag:'wx'});}
    catch(error) {if(error.code!=='EEXIST')throw error;assert.equal(await readFile(target,'utf8'),runtime,'custody runtime drift');}
    // Local custody only, not registry or product acceptance.
  }
  console.log(json(manifest));
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().catch(error=>{console.error(error);process.exitCode=1;});
