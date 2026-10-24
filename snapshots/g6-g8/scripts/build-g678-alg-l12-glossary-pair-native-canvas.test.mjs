import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createContext, Script} from 'node:vm';
import {parse} from 'acorn';
import {PAIR_OUTPUT,PAIR_PAGES} from './build-g678-alg-l12-glossary-pair-inputs.mjs';
import {buildNativeGlossaryPairCanvas,buildNativeGlossaryPairCanvasCandidates} from './build-g678-alg-l12-glossary-pair-native-canvas.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=value=>createHash('sha256').update(value).digest('hex');
const plain=value=>JSON.parse(JSON.stringify(value));
const built=buildNativeGlossaryPairCanvasCandidates();
const byShort=new Map(PAIR_PAGES.map(page=>{
  const base=`${PAIR_OUTPUT}/native-candidates/${page.short}`;
  const sourceBase=`${PAIR_OUTPUT}/candidates/${page.short}`;
  return [page.short,{page,base,sourceBase,
    manifest:JSON.parse(fs.readFileSync(path.join(ROOT,PAIR_OUTPUT,'native-text',`${page.short}-suppression-manifest.json`))),
    source:fs.readFileSync(path.join(ROOT,sourceBase,'canvas-renderer.js'),'utf8'),
    swf:fs.readFileSync(path.join(ROOT,PAIR_OUTPUT,page.short,`${page.stem}.swf`)),
    runtime:built.output.get(`${base}/canvas-renderer.js`),
    metadata:JSON.parse(built.output.get(`${base}/runtime-meta.json`))}];
}));

function walk(node,visit,scope={}) {
  if(!node||typeof node!=='object')return;
  if(node.type==='FunctionDeclaration')scope={...scope,function:node.id.name};
  if(node.type==='SwitchCase')scope={...scope,frame:node.test?.value};
  if(node.type)visit(node,scope);
  for(const value of Object.values(node)) {
    if(Array.isArray(value))value.forEach(child=>walk(child,visit,scope));
    else if(value&&typeof value==='object')walk(value,visit,scope);
  }
}
function literal(node) {
  if(node?.type==='Literal')return node.value;
  if(node?.type==='UnaryExpression'&&node.operator==='-')return -literal(node.argument);
  if(node?.type==='ArrayExpression')return node.elements.map(literal);
  throw Error('nonliteral placement');
}
function functions(code){
  const result=new Map();walk(parse(code,{ecmaVersion:2022}),node=>{
    if(node.type==='FunctionDeclaration'&&/^(?:font|text|shape|button|sprite)\d+$|^main$/.test(node.id.name))
      result.set(node.id.name,code.slice(node.start,node.end));
  });return result;
}
class MockContext {
  constructor(canvas){this.canvas=canvas;this.depth=0;}
  save(){this.depth++;}
  restore(){assert(this.depth>0);this.depth--;}
  transform(){} setTransform(){} resetTransform(){} scale(){} rotate(){} translate(){}
  beginPath(){} moveTo(){} lineTo(){} quadraticCurveTo(){} bezierCurveTo(){} closePath(){}
  fill(){} stroke(){} fillRect(){} drawImage(){}
}
class MockCanvas {
  constructor(width=1600,height=1200){this.width=width;this.height=height;this.style={};this.attributes={};this.context=new MockContext(this);}
  getContext(kind){assert.equal(kind,'2d');return this.context;}
  setAttribute(name,value){this.attributes[name]=value;}
}
function load(code,page){
  const context=createContext({document:{createElement(kind){assert.equal(kind,'canvas');return new MockCanvas(0,0);}}});
  new Script(code).runInContext(context,{timeout:5000});
  const registry=context.HELP_MATH_GLOSSARY_PAIR_NATIVE_ASSETS??context.HELP_MATH_CANVAS_ASSETS;
  return {context,asset:registry[page.id],target:new MockCanvas()};
}
const expectedIds=(manifest,frame)=>manifest.rules.filter(rule=>
  frame>=rule.firstFrame&&frame<rule.lastFrameExclusive).map(rule=>rule.id).concat(
    manifest.rootCompanionShapeSuppression.filter(rule=>
      frame>=rule.firstFrame&&frame<rule.lastFrameExclusive).map(rule=>rule.id));
const request=(page,manifest,frame)=>({frame,frameDomain:manifest.frameDomain,rootFrame:6,
  scenario:'source-static-frame',lang:'en',seed:0,text:{suppressInstanceIds:expectedIds(manifest,frame)}});

test('two source-pinned native variants reproduce immutable output with separate registry and honest gates',()=>{
  assert.equal(built.output.size,4);
  for(const {page,base,manifest,source,runtime,metadata} of byShort.values()){
    assert.equal(hash(source),manifest.sourceCanvasSha256);
    assert.equal(hash(runtime),metadata.runtimeSha256);
    assert.equal(Buffer.byteLength(runtime),metadata.runtimeBytes);
    assert.equal(metadata.animationId,page.id);
    assert.equal(metadata.sourceSwfSha256,page.sha256);
    assert.deepEqual(metadata.requiredCanvas,{width:1600,height:1200});
    assert.equal(metadata.renderScale,2);
    assert.equal(metadata.nativeTextSuppressionApplied,true);
    assert.equal(metadata.nativeTextReplacementRequired,true);
    assert.equal(metadata.retainedUntargetedSourceText,true);
    for(const key of ['registered','audioPlaybackEnabled','originalRuntimeAccepted','fidelityAccepted',
      'audioAccepted','humanAccepted','ownerAccepted','strictComplete','published'])
      assert.equal(metadata[key],false,`${page.short}: ${key}`);
    assert.equal(fs.readFileSync(path.join(ROOT,base,'canvas-renderer.js'),'utf8'),runtime);
    assert.equal(fs.readFileSync(path.join(ROOT,base,'runtime-meta.json'),'utf8'),built.output.get(`${base}/runtime-meta.json`));
    const {context,asset}=load(runtime,page);
    assert.equal(context.HELP_MATH_CANVAS_ASSETS,undefined);
    assert.equal(asset.metadata.animationId,page.id);
    assert.equal(asset.metadata.nativeTextSuppressionApplied,true);
    assert.equal(typeof asset.renderWithText,'function');
    assert.equal(typeof asset.render,'function');
  }
});

test('source-only and native derivatives can coexist without reusing a registry key',()=>{
  const {page,source,runtime}=byShort.get('p013');
  const context=createContext({});
  new Script(source).runInContext(context,{timeout:5000});
  const sourceAsset=context.HELP_MATH_CANVAS_ASSETS[page.id];
  new Script(runtime).runInContext(context,{timeout:5000});
  assert.equal(context.HELP_MATH_CANVAS_ASSETS[page.id],sourceAsset);
  assert.notEqual(context.HELP_MATH_GLOSSARY_PAIR_NATIVE_ASSETS[page.id],sourceAsset);
  assert.equal(sourceAsset.renderWithText,undefined);
  assert.equal(typeof context.HELP_MATH_GLOSSARY_PAIR_NATIVE_ASSETS[page.id].renderWithText,'function');
});

test('two prose placements and the root title are wrapped; source leaves and graph labels remain exact',()=>{
  for(const {page,manifest,source,runtime,metadata} of byShort.values()){
    assert.equal(manifest.rules.length,2);
    assert.equal(manifest.claimBoundary.diagramLabelsRetainedInCanvas,true);
    assert.equal(manifest.rootCompanionShapeSuppression.length,1);
    const before=functions(source),after=functions(runtime);
    for(const [name,body] of before){
      if(name===`sprite${page.sprite}`)continue;
      assert.equal(after.get(name),body,`${page.short} source function ${name}`);
    }
    const ast=parse(runtime,{ecmaVersion:2022}),perFrame=Array.from({length:page.frames},()=>[]);
    let wrappedCount=0,unwrappedText=0,titleCount=0;
    walk(ast,(node,scope)=>{
      if(node.type!=='CallExpression')return;
      if(node.callee.type==='MemberExpression'&&node.callee.object.name==='__pairNativeText'&&
        node.callee.property.name==='place'){
        wrappedCount++;
        const [id,frame,thunk]=node.arguments;
        assert.equal(thunk.type,'ArrowFunctionExpression');
        assert.equal(thunk.body.callee.name,'place');
        const rule=manifest.rules.find(item=>item.id===id.value)??
          manifest.rootCompanionShapeSuppression.find(item=>item.id===id.value);
        assert(rule);
        if(rule.placementScope==='render-root-companion'){
          assert.equal(scope.function,'render');assert.equal(frame.value,null);titleCount++;
        }else{
          assert.equal(scope.function,`sprite${page.sprite}`);
          assert.equal(frame.value,scope.frame+1);
          perFrame[frame.value-1].push(id.value);
        }
        assert.equal(thunk.body.arguments[0].value,rule.object);
        assert.deepEqual(literal(thunk.body.arguments[3]),rule.canvasCallMatrix);
      }
      if(node.callee.name==='place'&&/^text\d+$/.test(node.arguments[0]?.value)&&
        scope.function===`sprite${page.sprite}`)unwrappedText++;
    });
    // Wrapped source calls are still present inside thunks; all other graph
    // text calls remain ordinary. Exact per-frame target closure is stronger
    // than counting two occurrences in the source definition alone.
    assert.equal(titleCount,1);
    assert(wrappedCount>page.frames);
    assert(unwrappedText>wrappedCount);
    assert.equal(metadata.placedTextCalls,wrappedCount);
    for(let frame=1;frame<=page.frames;frame++)
      assert.deepEqual(perFrame[frame-1].sort(),manifest.rules.filter(rule=>
        frame>=rule.firstFrame&&frame<rule.lastFrameExclusive).map(rule=>rule.id).sort(),
        `${page.short} frame ${frame} suppression closure`);
  }
});

test('real Canvas draw transaction suppresses exact active prose and rejects false requests',()=>{
  for(const {page,manifest,runtime} of byShort.values()){
    const {asset,target}=load(runtime,page);
    const frames=[1,manifest.rules[0].firstFrame,manifest.rules[1].firstFrame,page.frames];
    for(const frame of frames){
      const input=request(page,manifest,frame),unchanged=JSON.stringify(input);
      const result=asset.renderWithText(target,input);
      assert.equal(JSON.stringify(input),unchanged);
      assert.deepEqual(plain(result.suppressedInstanceIds).sort(),expectedIds(manifest,frame).sort());
      assert.deepEqual(plain(result.unfulfilledSuppressionIds),[]);
      assert.deepEqual(plain(result.diagnostics),[]);
      assert.equal(result.state.localFrame,frame);
      assert.equal(result.state.audioRendered,false);
      assert.equal(target.attributes['data-flash-frame'],String(frame));
      assert.equal(target.context.depth,0);
    }
    const valid=request(page,manifest,page.frames);
    for(const ids of [[],[valid.text.suppressInstanceIds[0]],
      [...valid.text.suppressInstanceIds,'unknown'],
      [valid.text.suppressInstanceIds[0],valid.text.suppressInstanceIds[0]]])
      assert.throws(()=>asset.renderWithText(target,{...valid,text:{suppressInstanceIds:ids}}),
        /suppression must match/);
    for(const changed of [{frame:0},{frame:page.frames+1},{frameDomain:'root'},
      {rootFrame:5},{scenario:'glossary-open'},{lang:'es'},{seed:1}])
      assert.throws(()=>asset.renderWithText(target,{...valid,...changed}),/unsupported native Canvas source context/);
    assert.equal(asset.renderWithText(target,valid).state.localFrame,page.frames,
      'transaction is released after validation failures');
    assert.equal(asset.render(target,{frame:page.frames}).localFrame,page.frames,
      'ordinary source-only draw remains available');
  }
});

test('physical source and reviewed manifest drift fail closed before native instrumentation',()=>{
  const {page,source,swf,manifest}=byShort.get('p013');
  const changed=structuredClone(manifest);changed.rules[0].canvasCallMatrix[4]+=1;
  assert.throws(()=>buildNativeGlossaryPairCanvas(page,source,changed,swf));
  const unbound=structuredClone(manifest);unbound.rules[0].nativeReplacementId='missing';
  assert.throws(()=>buildNativeGlossaryPairCanvas(page,source,unbound,swf));
  const sourceDrift=Buffer.from(swf);sourceDrift[sourceDrift.length-1]^=1;
  assert.throws(()=>buildNativeGlossaryPairCanvas(page,source,manifest,sourceDrift));
  assert.throws(()=>buildNativeGlossaryPairCanvas(page,source+'\n',manifest,swf),/candidate changed/);
});
