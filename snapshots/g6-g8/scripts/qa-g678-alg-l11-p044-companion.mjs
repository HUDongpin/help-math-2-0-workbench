#!/usr/bin/env node
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {createAlgL11Advanced3AssessmentState,G678_ALG_L11_ADVANCED3_TRANCHE_D_ANSWER_KEY as KEY} from '../packages/demos/src/g678-alg-l11-advanced3-tranche-d-state.ts';
import {G678_ALG_L11_P044_LITERAL_CONTENT as LITERALS} from '../packages/demos/src/generated/g678-alg-l11-p044-literal-content-v1.ts';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);assert.ok(args.length===2&&args[0]==='--run'&&/^[a-z0-9-]+$/.test(args[1]));
const OUTPUT=`output/playwright/g678-alg-l11-p044-companion-${args[1]}`,out=path.join(ROOT,OUTPUT);await mkdir(out);
const ENTRY='scripts/harness-g678-alg-l11-p044-companion.tsx',hash=b=>createHash('sha256').update(b).digest('hex'),json=x=>JSON.stringify(x,null,2)+'\n';
const save=(p,b)=>writeFile(path.join(out,p),b,{flag:'wx'});
async function binding(p){const b=await readFile(path.resolve(ROOT,p));return{path:p,bytes:b.length,sha256:hash(b)};}
const predecessor=JSON.parse(await readFile(path.join(ROOT,'catalog/g678-alg-l11-p044-host-score-candidate-v1.json'),'utf8'));
const files=[...new Set([...predecessor.files.map(f=>f.path),ENTRY,'scripts/qa-g678-alg-l11-p044-companion.mjs',
  'packages/demos/src/g678-alg-l11-p044-companion-candidate.tsx','packages/demos/src/g678-alg-l11-p044-companion-controller.ts',
  'packages/demos/src/generated/g678-alg-l11-p044-literal-content-v1.ts','packages/demos/tests/g678-alg-l11-p044-companion-candidate.test.tsx',
  'catalog/g678-alg-l11-p044-literal-content-source-map-v1.json','scripts/build-g678-alg-l11-p044-literal-content.mjs'])];
const inputs=await Promise.all(files.map(binding));await save('inputs.json',json(inputs));
const bundle=await build({entryPoints:[path.join(ROOT,ENTRY)],bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',
  define:{'process.env.NODE_ENV':'"production"'},metafile:true,
  alias:{'@helpmath/demos/runtime':path.join(ROOT,'packages/demos/src/runtime.ts'),'@helpmath/demos/prototype-manifest':path.join(ROOT,'packages/demos/src/prototype-manifest.ts')},
  plugins:[{name:'p044-companion-test-loader',setup(b){b.onResolve({filter:/^@\/lib\/load-animation-module\.client$/},()=>({path:'p044-companion-loader',namespace:'p044-companion-test'}));
    b.onLoad({filter:/.*/,namespace:'p044-companion-test'},()=>({contents:'export async function loadClientAnimationModule(key){return window.__P044_COMPANION_MODULES[key];}',loader:'js'}));}}]});
const script=bundle.outputFiles[0].text;await save('harness.js',script);await save('esbuild-inputs.json',json(bundle.metafile.inputs));
assert.ok(!Object.keys(bundle.metafile.inputs).some(p=>/literal-content-source-map|config\/g678-alg-l11-p044/.test(p)),'source review/config entered learner bundle');
const browser=await chromium.launch({headless:true}),records=[];let step='mount',activePage;
const evidence={artifactType:'p044-literal-math-companion-real-score-host-mounted-candidate-qa',inputs,harness:{bytes:Buffer.byteLength(script),sha256:hash(script)},
  browser:{version:browser.version(),executable:await binding(chromium.executablePath())},records,literalContentSourceMapBundled:false,
  boundary:'Actual AnimationRuntime + real memory-only fq-scoring host, explicit unregistered loader with fixed-stage/marked companion fixture; not registered My Lesson. Source art and literal graph descriptions, no audio/server/network.',
  registered:false,productCalibrationPassed:false,authoritativeOriginalRuntime:false,visualFidelityAccepted:false,audioIntegrated:false,audioAccepted:false,
  humanVisualAccepted:false,ownerAccepted:false,screenReaderHumanAccepted:false,strictComplete:false,released:false,published:false};
async function snapshot(page){return page.evaluate(()=>{const s=document.querySelector('[data-p044-companion-successor]'),h=document.querySelector('[data-test-loader]');
  return{question:Number(document.querySelector('[data-source-question]')?.getAttribute('data-source-question')?.slice(1)),
    phase:s?.getAttribute('data-assessment-phase'),gate:s?.getAttribute('data-host-score-gate'),ack:s?.getAttribute('data-host-acknowledged-source-questions'),selection:s?.getAttribute('data-random-selection'),
    attempted:Number(h?.getAttribute('data-real-host-attempted')),awarded:Number(h?.getAttribute('data-real-host-awarded')),possible:Number(h?.getAttribute('data-real-host-possible')),
    ids:h?.getAttribute('data-real-host-source-ids'),completions:Number(h?.getAttribute('data-completions')),trees:document.querySelectorAll('[data-p044-action-tree]').length,
    placement:document.querySelector('[data-companion-placement]')?.getAttribute('data-companion-placement'),audit:window.__P044_COMPANION_AUDIT};});}
async function shot(page,name){const b=await page.screenshot({fullPage:true});await save(name+'.png',b);return{path:`${OUTPUT}/${name}.png`,bytes:b.length,sha256:hash(b)};}
async function mount(config){const page=await browser.newPage({viewport:{width:config.width,height:1000},reducedMotion:config.motion,hasTouch:config.touch??false});activePage=page;
  const record={config,errors:[],requests:[],trace:[],geometry:[],screenshots:[],status:'running'};records.push(record);
  page.on('pageerror',e=>record.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')record.errors.push(m.text());});
  await page.route('**/*',route=>{record.requests.push(route.request().url());return route.abort();});
  await page.setContent('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:"><style>body{margin:0;font-family:Arial}.runtime-stage{width:100%;max-width:800px}.runtime-stage svg{max-width:100%}</style></head><body><div id="root"></div></body></html>');
  await page.evaluate(c=>{window.__P044_COMPANION_CASE=c;},config);await page.addScriptTag({content:script});
  await page.locator(`[data-host-score-gate="${config.permission?'ready':'blocked'}"]`).waitFor();await page.locator(`[data-companion-placement="${config.provided&&config.present&&config.valid?'portal':'fallback'}"]`).waitFor();return{page,record};}
const choice=(page,q,option)=>page.locator(`[data-source-instance-name="A${q}Opt${option}"]`);
async function act(page,locator,input){if(input==='touch')await locator.tap();else if(['Enter','Space'].includes(input)){await locator.focus();await page.keyboard.press(input);}else await locator.click();}
async function answer(page,index,input){const s=await snapshot(page);await act(page,choice(page,s.question,index%2?KEY[s.question-1]:KEY[s.question-1]%4+1),input);return s;}
async function replay(page){await page.locator('[data-p044-action-tree]').getByRole('button',{name:'Replay',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('[data-host-score-gate]')?.getAttribute('data-host-score-gate')==='ready'&&document.querySelector('[data-test-loader]')?.getAttribute('data-real-host-attempted')==='0');}
async function geometry(page,record){const state=await snapshot(page),literal=LITERALS.find(q=>q.number===state.question);assert.ok(literal);
  const g=await page.locator('[data-p044-action-tree]').evaluate(root=>{const choices=root.querySelector('.p044-math-companion__choices'),prompt=root.querySelector('[data-visible-prompt]');
    const measure=(node)=>{const b=node.getBoundingClientRect(),style=getComputedStyle(node);return{x:b.x,y:b.y,width:b.width,height:b.height,fontSize:parseFloat(style.fontSize),lineHeight:parseFloat(style.lineHeight),scrollWidth:node.scrollWidth,clientWidth:node.clientWidth};};
    return{viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,prompt:{text:prompt.textContent,spoken:root.querySelector('[data-spoken-prompt]').textContent,...measure(prompt)},
      graphDescription:root.querySelector('[data-literal-graph-description]')?.textContent??null,gap:parseFloat(getComputedStyle(choices).gap),
      choices:[...root.querySelectorAll('[data-source-instance-name]')].map(button=>({id:button.getAttribute('data-source-instance-name'),label:button.getAttribute('aria-label'),...measure(button),
        literal:{text:button.querySelector('[data-literal-choice]').textContent,...measure(button.querySelector('[data-literal-choice]'))}})),
      sourceButtons:document.querySelectorAll('[data-p044-source-plane] button').length,trees:document.querySelectorAll('[data-p044-action-tree]').length,
      duplicateSvgIds:(()=>{const ids=[...document.querySelectorAll('svg [id]')].map(n=>n.id);return ids.length-new Set(ids).size;})()};});
  assert.equal(g.trees,1);assert.equal(g.sourceButtons,0);assert.equal(g.choices.length,4);assert.ok(g.documentWidth<=g.viewport+1);assert.ok(g.gap>=8);
  assert.equal(g.duplicateSvgIds,0);
  assert.equal(g.prompt.text,literal.prompt);assert.equal(g.prompt.spoken,literal.promptSpoken);assert.equal(g.prompt.fontSize,20);assert.equal(g.graphDescription,literal.promptGraphDescription);
  for(let i=0;i<4;i++){const a=g.choices[i],b=literal.choices[i];assert.equal(a.id,b.sourceInstanceName);assert.equal(a.label,`${String.fromCharCode(65+i)}. ${b.spoken}`);assert.equal(a.literal.text,b.text);
    assert.equal(a.literal.fontSize,20);assert.ok(a.width>=44&&a.height>=44);assert.ok(a.scrollWidth<=a.clientWidth+1);assert.ok(a.literal.scrollWidth<=a.literal.clientWidth+1);}
  assert.equal(new Set(g.choices.map(c=>Math.round(c.x))).size,1);record.geometry.push({question:state.question,...g});return g;}
async function finish(page,record){record.final=await snapshot(page);assert.equal(record.final.trees,1);assert.deepEqual(record.errors,[]);assert.deepEqual(record.requests,[]);
  for(const item of record.final.audit)assert.deepEqual(Object.keys(item.request),item.request.type==='record-fq-score'?['type','questionId','correct','pointsAwarded','pointsPossible']:['type']);
  record.status='passed';await page.close();}
const seeds=new Map();for(let seed=0;seeds.size<24&&seed<1000;seed++){const q=createAlgL11Advanced3AssessmentState(seed).questionNumbers[0];if(!seeds.has(q))seeds.set(q,seed);}assert.equal(seeds.size,24);
try{
  for(let q=1;q<=24;q++){
    step=`q${q}-375-literal`;const{page,record}=await mount({kind:'literal-24',width:375,motion:'reduce',touch:true,permission:true,provided:true,present:true,valid:true,seed:seeds.get(q)});
    assert.equal((await snapshot(page)).question,q);await geometry(page,record);assert.equal((await snapshot(page)).attempted,0);assert.equal((await snapshot(page)).completions,0);
    record.screenshots.push(await shot(page,`q${String(q).padStart(2,'0')}-375-literal`));record.accessibility=await page.locator('[data-p044-action-tree]').ariaSnapshot();await finish(page,record);
  }
  for(const[width,motion,touch]of[[1100,'no-preference',false],[390,'reduce',true]]){
    const name=`full-${width}-${motion}`;step=name;const{page,record}=await mount({kind:'full-score-review',width,motion,touch,permission:true,provided:true,present:true,valid:true,seed:31});
    await geometry(page,record);await choice(page,(await snapshot(page)).question,1).focus();await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>parseFloat(getComputedStyle(document.activeElement).outlineWidth)>=3));
    await answer(page,0,touch?'touch':'Enter');await answer(page,1,touch?'touch':'Space');let state=await snapshot(page);assert.equal(state.attempted,2);
    await page.getByRole('button',{name:'Reject score records in real host',exact:true}).click();const before=await snapshot(page);await answer(page,2,touch?'touch':'mouse');
    state=await snapshot(page);assert.equal(state.gate,'blocked');assert.equal(state.question,before.question);assert.equal(state.attempted,2);assert.equal(state.completions,0);assert.equal(state.ack,before.ack);
    record.trace.push({step:'blocked-record-no-local-advance',state});await page.getByRole('button',{name:'Reject score records in real host',exact:true}).click();await replay(page);
    state=await snapshot(page);assert.equal(state.ids,'');assert.equal(state.ack,'');assert.equal(state.awarded,0);assert.equal(state.possible,0);record.trace.push({step:'real-score-reset-before-new-quiz',state});
    for(let i=0;i<10;i++){assert.equal((await snapshot(page)).completions,0);await geometry(page,record);await answer(page,i,touch?'touch':i%2?'Space':'Enter');}
    await page.getByText('Score: 5 / 10',{exact:true}).last().waitFor();await page.waitForFunction(()=>document.querySelector('[data-test-loader]')?.getAttribute('data-completions')==='1');
    state=await snapshot(page);assert.equal(state.attempted,10);assert.equal(state.awarded,5);assert.equal(state.possible,10);assert.equal(state.ack,state.ids);
    const scored=state.audit.filter(a=>a.request.type==='record-fq-score').length;record.trace.push({step:'ten-acks-before-completion',state});
    await page.locator('[data-p044-action-tree]').getByRole('button',{name:'Review answers',exact:true}).click();
    for(let i=0;i<10;i++){await geometry(page,record);assert.equal(await page.locator('[data-review-selected="true"]').count(),1);assert.equal(await page.locator('[data-review-correct="true"]').count(),1);
      assert.equal(await page.locator('[data-source-review-visual="true"]').count(),1);assert.equal(await page.locator('[data-source-art-selected="true"]').count(),1);assert.equal(await page.locator('[data-source-art-correct="true"]').count(),1);
      const next=page.getByRole('button',{name:i<9?'Next review':'Finish review',exact:true});await page.getByRole('button',{name:'Pause test runtime',exact:true}).click();assert.equal(await next.isDisabled(),true);
      const held=(await snapshot(page)).question;await page.waitForTimeout(30);assert.equal((await snapshot(page)).question,held);await page.getByRole('button',{name:'Pause test runtime',exact:true}).click();
      if(i===0)record.screenshots.push(await shot(page,`${name}-source-and-literal-review`));await act(page,next,touch?'touch':i%2?'Space':'Enter');}
    state=await snapshot(page);assert.equal(state.audit.filter(a=>a.request.type==='record-fq-score').length,scored);assert.equal(state.attempted,10);assert.equal(state.awarded,5);assert.equal(state.completions,1);
    record.trace.push({step:'full-review-no-rescore-and-pause-preserved',state});record.screenshots.push(await shot(page,`${name}-results`));await replay(page);assert.equal((await snapshot(page)).ids,'');await finish(page,record);
  }
  step='standalone-390';{const{page,record}=await mount({kind:'standalone',width:390,motion:'no-preference',touch:true,permission:true,provided:false,present:false,valid:false,seed:seeds.get(22)});
    await geometry(page,record);record.screenshots.push(await shot(page,'standalone-390-q22'));await answer(page,0,'touch');assert.equal((await snapshot(page)).attempted,1);await replay(page);await finish(page,record);}
  step='portal-lifecycle';{const{page,record}=await mount({kind:'target-lifecycle',width:390,motion:'reduce',touch:true,permission:true,provided:true,present:false,valid:true,seed:31});
    const before=await snapshot(page);await page.getByRole('button',{name:'Toggle companion target',exact:true}).click();await page.locator('[data-companion-placement="portal"]').waitFor();
    assert.equal((await snapshot(page)).audit.length,before.audit.length);await answer(page,0,'touch');const scored=await snapshot(page);
    await page.getByRole('button',{name:'Toggle companion target',exact:true}).click();await page.locator('[data-companion-placement="fallback"]').waitFor();
    assert.equal((await snapshot(page)).question,scored.question);assert.equal((await snapshot(page)).ack,scored.ack);assert.equal((await snapshot(page)).trees,1);
    await page.getByRole('button',{name:'Toggle companion target',exact:true}).click();await page.locator('[data-companion-placement="portal"]').waitFor();
    await page.getByRole('button',{name:'Toggle valid target marker',exact:true}).click();await page.locator('[data-companion-placement="fallback"]').waitFor();
    await page.getByRole('button',{name:'Toggle valid target marker',exact:true}).click();await page.locator('[data-companion-placement="portal"]').waitFor();
    assert.equal((await snapshot(page)).ack,scored.ack);await geometry(page,record);record.trace.push({step:'target-lifecycle-preserves-score-question-controller',state:await snapshot(page)});await finish(page,record);}
  step='missing-capability';{const{page,record}=await mount({kind:'missing-capability',width:390,motion:'reduce',touch:true,permission:false,provided:true,present:true,valid:true,seed:31});
    assert.equal((await snapshot(page)).gate,'blocked');assert.equal(await page.locator('[data-source-instance-name]:disabled').count(),4);assert.equal((await snapshot(page)).completions,0);await geometry(page,record);await finish(page,record);}
  assert.equal(records.length,29);assert.deepEqual(await Promise.all(files.map(binding)),inputs,'input changed during mounted QA');evidence.status='passed';await save('evidence.json',json(evidence));
  console.log(json({status:'passed',output:OUTPUT,records:29}));
}catch(error){evidence.status='failed';evidence.failure={step,message:error.message,state:activePage&&!activePage.isClosed()?await snapshot(activePage):null};
  if(activePage&&!activePage.isClosed())evidence.failure.screenshot=await shot(activePage,'failed-state');await save('evidence.failed.json',json(evidence));
  console.error(json({status:'failed',output:OUTPUT,step,message:error.message}));process.exitCode=1;
}finally{await browser.close();}
