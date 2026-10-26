import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,Script} from 'node:vm';
import {parse} from 'acorn';
import test from 'node:test';
import {
  P010_ID,P010_SOURCE_CANVAS_PINS,P010_SOURCE_CANVAS_GATES,buildP010SourceCanvas,
  composeP010Canvas,p010CanvasFunctions,replaceP010Once,auditP010SourceMasks,
  validateP010SourceRuntime,validateP010StrictDirectives,
} from './build-g678-alg-l12-p010-source-canvas.mjs';

const input={};for(const n of ['helper','main','root','xml','catalog','behavior','sourceAuditReceipt','canvasReceipt'])input[n]=readFileSync(new URL('../'+P010_SOURCE_CANVAS_PINS[n].path,import.meta.url));
const candidate=buildP010SourceCanvas(input),runtimeScript=new Script(candidate.runtime),plain=v=>JSON.parse(JSON.stringify(v));
function load(createElement=()=>{throw Error('unexpected DOM allocation');}){const context=createContext({document:{createElement}},{codeGeneration:{strings:false,wasm:false}});runtimeScript.runInContext(context,{timeout:3000});return{context,asset:context.HELP_MATH_CANVAS_ASSETS[P010_ID]};}

test('composition preserves every source function and root97 without guessed title or suppression',()=>{
  const main=input.main.toString().replace(/\r\n?/g,'\n'),root=input.root.toString().replace(/\r\n?/g,'\n');
  const original=p010CanvasFunctions(main),parent=p010CanvasFunctions(root),composed=p010CanvasFunctions(composeP010Canvas(main,root));
  assert.equal(composed.size,original.size+2);for(const[n,b]of original)assert.equal(composed.get(n),b,n);
  assert.equal(composed.get('shape97'),parent.get('shape97'));assert.equal(composed.get('main'),parent.get('main'));
  assert.equal(candidate.sourceTextFunctions.length,28);assert.equal(candidate.sourceShapeFunctions.length,58);
  assert.deepEqual(candidate.spec.timeline.stageRenderOffset,{x:40.5,y:78.45});assert.deepEqual(candidate.spec.composition.stageRenderOffsetTwips,{x:810,y:1569});
  assert.throws(()=>composeP010Canvas(main.replace('371.9,204.85','371.9,204.86'),root));
  assert.throws(()=>composeP010Canvas(main,root.replace('function shape97(','function shape999(')));
  assert.throws(()=>composeP010Canvas(main,root.replace('0.05,412.4,283.3','0.05,412.4,283.4')));
  assert.throws(()=>replaceP010Once('x x','x','replacement'));
});
test('raw mask paths/colors and compositor are retained; opacity and terminal parity remain pending',()=>{
  const masks=auditP010SourceMasks(input.xml,JSON.parse(input.catalog));assert.equal(masks.opacityCorrectionApplied,false);assert.equal(masks.uses.length,4);
  const tree=parse(candidate.runtime,{ecmaVersion:2020});const functions=new Map();function walk(n){if(!n||typeof n!=='object')return;if(n.type==='FunctionDeclaration')functions.set(n.id.name,candidate.runtime.slice(n.start,n.end));for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}walk(tree);
  const raw=p010CanvasFunctions(input.main.toString());for(const n of['shape18','shape30'])assert.equal(functions.get(n),raw.get(n));
  assert.match(functions.get('shape18'),/102,153,0,0\.6431373/);assert.match(functions.get('shape30'),/153,204,0,0\.72156864/);
  assert.equal(candidate.spec.timeline.local.playbackMode,'state-explorer');assert.equal(candidate.spec.timeline.local.originalTerminalStopEstablished,false);
  const corrupted=input.xml.toString().replace('alpha="164" blue="0" green="153" red="102"','alpha="165" blue="0" green="153" red="102"');assert.throws(()=>auditP010SourceMasks(Buffer.from(corrupted),JSON.parse(input.catalog)));
});
test('every465 frame state is pure in forward/reverse/mixed seeks and rejects unsupported requests',async()=>{
  const{asset,context}=load();await asset.ready();assert.equal(asset.metadata.rootInspectionFrame,6);assert.equal(asset.metadata.sourceOnly,true);
  const forward=Array.from({length:465},(_,i)=>JSON.stringify(asset.resolveFrameState({frame:i+1})));
  for(let frame=465;frame>=1;frame--){const s=asset.resolveFrameState({frame,rootFrame:6,frameDomain:'sprite-96'});assert.equal(JSON.stringify(s),forward[frame-1]);assert.equal(s.exportFrame,frame-1);assert.equal(s.rootFrame,6);assert.equal(s.frameDomain,'sprite-96');assert.equal(s.audioRendered,false);assert(Object.isFrozen(s));}
  for(const frame of[465,1,173,10,407,465])assert.equal(JSON.stringify(asset.resolveFrameState({frame})),forward[frame-1]);
  const request={frame:273,seed:37};const s=asset.resolveFrameState(request);assert.equal(s.seed,37);assert.deepEqual(request,{frame:273,seed:37});
  for(const frame of[0,466,1.5,NaN,Infinity,'1'])assert.throws(()=>asset.resolveFrameState({frame}));
  for(const extra of[{rootFrame:10},{frameDomain:'root'},{lang:'es'},{scenario:'glossary-position'},{seed:-1},{seed:4294967296},{autoplay:true}])assert.throws(()=>asset.resolveFrameState({frame:1,...extra}));
  assert.throws(()=>runtimeScript.runInContext(context),/already registered/);
});

class MockContext{
  constructor(canvas){this.canvas=canvas;this.calls=[];this.depth=0;}
  save(){this.depth++;}restore(){assert(this.depth>0);this.depth--;}
  transform(...v){this.calls.push(['transform',...v]);}setTransform(...v){this.calls.push(['setTransform',...v]);}
  resetTransform(){}scale(){}rotate(){}translate(){}beginPath(){}moveTo(){}lineTo(){}quadraticCurveTo(){}bezierCurveTo(){}closePath(){}
  fill(rule){this.calls.push(['fill',this.fillStyle,rule]);}stroke(){}fillRect(...v){this.calls.push(['fillRect',...v]);}drawImage(){this.calls.push(['drawImage',this.globalCompositeOperation]);}
}
class MockCanvas{
  constructor(w=0,h=0){this.width=w;this.height=h;this.style={};this.attributes={};this.context=new MockContext(this);}
  getContext(kind){assert.equal(kind,'2d');return this.context;}setAttribute(k,v){this.attributes[k]=v;}
}
test('2x representative renders preserve source offsets/mask lifetimes and balanced context',async()=>{
  const created=[];const{asset}=load(kind=>{assert.equal(kind,'canvas');const c=new MockCanvas();created.push(c);return c;});await asset.ready();assert.equal(created.length,0);
  const target=new MockCanvas(1600,1200),catalog=JSON.parse(input.catalog),masks=catalog.timelines.find(t=>t.timelineId==='sprite-96').instances.filter(i=>[18,30].includes(i.characterId));
  for(const frame of[1,9,10,11,68,69,112,113,172,173,232,273,277,290,341,407,416,453,465,1]){
    created.length=0;target.context.calls.length=0;const s=asset.render(target,{frame});assert.equal(s.localFrame,frame);assert.equal(target.attributes['data-flash-root-frame'],'6');
    assert.deepEqual(target.context.calls[0],['setTransform',2,0,0,2,0,0]);assert(target.context.calls.some(c=>JSON.stringify(c)===JSON.stringify(['transform',1,0,0,1,40.5,78.45])));
    assert(target.context.calls.some(c=>JSON.stringify(c)===JSON.stringify(['fillRect',0,0,800,600])));
    assert.equal(target.context.depth,0);assert.equal(target.context._savedMatrices.length,1);assert.deepEqual(plain(target.context._matrix),[2,0,0,2,0,0]);
    const active=masks.filter(i=>frame>=i.firstFrame&&frame<i.lastFrameExclusive).length;assert.equal(created.length,active*2,`mask lifetimes frame${frame}`);
    for(const c of created){assert.equal(c.width,1600);assert.equal(c.height,1200);assert.equal(c.context.depth,0);assert.equal(c.context._savedMatrices.length,1);}
    assert.equal(created.filter(c=>c.context.calls.some(x=>x[0]==='drawImage'&&x[1]==='destination-in')).length,active);
  }
  assert.throws(()=>asset.render(new MockCanvas(800,600),{frame:1}),/1600x1200/);assert.throws(()=>asset.render(null,{frame:1}),/2D canvas context/);
  const foreign=new MockCanvas(1600,1200);foreign.context.__helpMathFfdecAssetId='other';assert.throws(()=>asset.render(foreign,{frame:1}),/different FFDec adapter/);
});
test('strict directive boundaries parse/execute and reject non-simple-parameter directives',()=>{
  const audit=validateP010StrictDirectives(candidate.runtime);assert.equal(audit.currentStrict,true);assert.equal(audit.simpleParameterBoundary,true);assert.equal(audit.nonSimpleParameterStrictDirectiveCount,0);load();
  for(const parameters of['{frame}','[frame]','frame = 1','...frames'])assert.throws(()=>validateP010StrictDirectives(candidate.runtime+'\nfunction invalid('+parameters+'){"use strict";return 1;}'),/Illegal 'use strict' directive|simple identifier parameters/);
  assert.throws(()=>validateP010StrictDirectives(candidate.runtime.replace('(function (global) {','(function ({global}) {')),/Illegal 'use strict' directive/);
  assert.throws(()=>validateP010StrictDirectives(candidate.runtime.replace('"use strict";','/* omitted strict directive */')),/strict directive required/);
});
test('runtime and pinned input boundary deny ambient behavior and source byte drift',()=>{
  validateP010SourceRuntime(candidate.runtime);
  for(const suffix of['\neval("x")','\nfetch("x")','\nsetInterval(x,1)','\ndocument.body','\nnew Audio()','\n_root.DoHyperLinks()','\nvar remote="https://invalid.test/x";','\nimport("x")'])assert.throws(()=>validateP010SourceRuntime(candidate.runtime+suffix));
  for(const name of['helper','main','root','xml','catalog','behavior','sourceAuditReceipt','canvasReceipt']){const b=Buffer.from(input[name]);b[b.length-1]^=1;assert.throws(()=>buildP010SourceCanvas({...input,[name]:b}),/input hash drift/);}
  assert(Object.values(P010_SOURCE_CANVAS_GATES).every(v=>v===false));assert.equal(candidate.metadata.textSuppressionApplied,false);assert.equal(candidate.metadata.originalTerminalPolicyEstablished,false);assert.equal(candidate.metadata.maskAudit.opacityCorrectionApplied,false);
});
