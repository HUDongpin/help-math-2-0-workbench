#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {G678_ALG_L11_D_INSTRUCTIONAL_VISUALS as DATA} from '../packages/demos/src/generated/g678-alg-l11-tranche-d-instructional-visuals-v1.ts';
import {G678_ALG_L11_ADVANCED3_TRANCHE_D_ANSWER_KEY,createAlgL11Advanced3AssessmentState} from '../packages/demos/src/g678-alg-l11-advanced3-tranche-d-state.ts';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);assert.ok(args.length===2&&args[0]==='--run'&&/^[a-z0-9-]+$/.test(args[1]));
const OUTPUT=`output/playwright/g678-alg-l11-d-instructional-${args[1]}`;
const out=path.join(ROOT,OUTPUT);await mkdir(out);
const ENTRY='scripts/harness-g678-alg-l11-d-instructional-runtime.tsx';
const hash=b=>createHash('sha256').update(b).digest('hex');
const save=(p,b)=>writeFile(path.join(out,p),b,{flag:'wx'});
const json=v=>JSON.stringify(v,null,2)+'\n';
async function binding(p){const b=await readFile(path.resolve(ROOT,p));return{path:p,bytes:b.length,sha256:hash(b)};}
const files=[ENTRY,'scripts/qa-g678-alg-l11-d-instructional-runtime.mjs',
  'apps/web/components/animation-runtime.tsx','packages/demos/src/runtime.ts','packages/demos/src/contract.ts','packages/demos/src/lesson-host-contract.ts',
  'packages/demos/src/g678-alg-l11-p033-instructional-candidate.tsx','packages/demos/src/g678-alg-l11-tranche-d-instructional-candidates.tsx',
  'packages/demos/src/g678-alg-l11-p034-source-reveal.ts','packages/demos/src/g678-alg-l11-p034-source-fade.ts',
  'packages/demos/src/g678-alg-l11-advanced3-tranche-d-state.ts','packages/demos/src/g678-alg-l11-advanced3-tranche-d-candidates.tsx',
  ...['g678-alg-l11-tranche-d-instructional-visuals-v1','g678-alg-l11-p033-instructional-sequence-v1','g678-alg-l11-p034-source-reveal-v1','g678-alg-l11-p034-source-fade-v1'].map(n=>`packages/demos/src/generated/${n}.ts`)];
const inputs=await Promise.all(files.map(binding));await save('inputs.json',json(inputs));
const compiled=await build({entryPoints:[path.join(ROOT,ENTRY)],bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',
  define:{'process.env.NODE_ENV':'"production"'},metafile:true,
  alias:{'@helpmath/demos/runtime':path.join(ROOT,'packages/demos/src/runtime.ts'),'@helpmath/demos/prototype-manifest':path.join(ROOT,'packages/demos/src/prototype-manifest.ts')},
  plugins:[{name:'explicit-d-candidate-test-loader',setup(builder){
    builder.onResolve({filter:/^@\/lib\/load-animation-module\.client$/},()=>({path:'d-only-test-loader',namespace:'d-only-test'}));
    builder.onLoad({filter:/.*/,namespace:'d-only-test'},()=>({contents:'export async function loadClientAnimationModule(key){return window.__D_TEST_MODULES[key];}',loader:'js'}));
  }}]});
const script=compiled.outputFiles[0].text;await save('harness.js',script);await save('esbuild-inputs.json',json(compiled.metafile.inputs));
assert.deepEqual(await Promise.all(files.map(binding)),inputs);
const browser=await chromium.launch({headless:true});const records=[];let step='start';let activePage=null;
const evidence={artifactType:'d-instructional-mounted-candidate-runtime-qa',inputs,
  boundary:'actual AnimationRuntime and memory-only lesson host; explicit unregistered test-loader; no Next or registry',
  browser:{version:browser.version(),executable:await binding(chromium.executablePath())},
  harness:{bytes:Buffer.byteLength(script),sha256:hash(script)},records,
  registered:false,productCalibrationPassed:false,authoritativeOriginalRuntime:false,visualFidelityAccepted:false,
  audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,releaseEligible:false,published:false};

async function shot(page,name){const b=await page.screenshot({fullPage:true});await save(name+'.png',b);return{path:`${OUTPUT}/${name}.png`,bytes:b.length,sha256:hash(b)};}
async function snapshot(page){return page.evaluate(()=>({
  active:document.querySelector('[data-test-loader]')?.getAttribute('data-current-page'),
  frame:document.querySelector('[data-source-main-frame]')?.getAttribute('data-source-main-frame'),
  paused:document.querySelector('[data-runtime-transport]')?.getAttribute('data-runtime-paused'),
  held:document.querySelector('[data-runtime-transport]')?.getAttribute('data-runtime-host-seek-held'),
  replay:document.querySelector('[data-runtime-transport]')?.getAttribute('data-runtime-replay'),
  completions:document.querySelector('[data-test-loader]')?.getAttribute('data-test-completion-count'),
  question:document.querySelector('[data-source-question]')?.getAttribute('data-source-question'),
  selection:document.querySelector('[data-random-selection]')?.getAttribute('data-random-selection'),
  phase:document.querySelector('[data-feedback-phase]')?.getAttribute('data-feedback-phase'),
  complete:document.querySelector('[data-source-interaction-complete]')?.getAttribute('data-source-interaction-complete'),
  audit:window.__D_AUDIT,pointer:window.__D_POINTER}));}
async function mount(id,motion='no-preference',seed=31){
  const page=await browser.newPage({viewport:{width:1050,height:950},reducedMotion:motion});
  activePage=page;
  const record={id,motion,seed,status:'running',errors:[],requests:[],trace:[]};records.push(record);
  page.on('pageerror',e=>record.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')record.errors.push(m.text());});
  await page.route('**/*',route=>{record.requests.push(route.request().url());return route.abort();});
  await page.setContent('<html><head><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:"><style>body{margin:0;background:white;font-family:Arial}.runtime-stage{width:800px}.runtime-stage svg{max-width:100%}button:focus-visible{outline:3px solid #df6000}</style></head><body><div id="root"></div></body></html>');
  await page.evaluate(value=>{window.__D_CASE=value;},{animationId:id,seed});await page.addScriptTag({content:script});
  await page.locator(`[data-animation-id="${id}"]`).last().waitFor();
  return{page,record};
}
async function finish(page,record){assert.deepEqual(record.errors,[]);assert.deepEqual(record.requests,[]);record.status='passed';record.final=await snapshot(page);await page.close();}
async function activate(page,locator,input='mouse'){if(input==='mouse')await locator.click();else{await locator.focus();await page.keyboard.press(input);}}
async function pause(page,on=true){const b=page.getByRole('button',{name:'Pause test runtime',exact:true});if(await b.getAttribute('aria-pressed')!==String(on))await b.click();await page.waitForFunction(value=>document.querySelector('[data-runtime-transport]')?.getAttribute('data-runtime-paused')===String(value),on);}
const replayButton=page=>page.locator('[data-animation-id]').last().getByRole('button',{name:'Replay',exact:true});

try{
  step='p033 initial handoff';
  {
    const{page,record}=await mount('shared-alg001-l11-p033');
    await activate(page,page.getByRole('button',{name:'Level 2',exact:true}));
    record.trace.push({step:'level2-selected',state:await snapshot(page),selected:await page.getByRole('button',{name:'Level 2',exact:true}).getAttribute('aria-pressed')});
    assert.equal(record.trace.at(-1).selected,'true','p033 Level2 click did not persist selection');
    await activate(page,page.getByRole('button',{name:'Start',exact:true}));
    record.trace.push({step:'start-clicked',state:await snapshot(page)});
    await page.locator('[data-source-level="2"]').waitFor();
    record.trace.push({step:'initial-level2-handoff',state:await snapshot(page)});
    assert.equal(record.trace.at(-1).state.audit[0].request.handoff.level,2);
    assert.equal(record.trace.at(-1).state.audit[0].status,'allowed');
    record.screenshot=await shot(page,'p033-initial-handoff-level2');await finish(page,record);
  }
  step='p033 authored controls and terminal handoff';
  {
    const{page,record}=await mount('shared-alg001-l11-p033');
    await page.getByRole('button',{name:'Level 1',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:'Level 1',exact:true}).getAttribute('aria-pressed'),'true');
    await page.locator('[data-source-instance-name="mcRepeat"]').click();
    await page.waitForFunction(()=>Number(document.querySelector('[data-source-main-frame]')?.getAttribute('data-source-main-frame'))>=11);
    record.trace.push({step:'initial-source-repeat-to11-play',state:await snapshot(page)});
    await activate(page,page.getByRole('button',{name:'Skip directions',exact:true}),'Enter');
    await page.waitForFunction(()=>document.querySelector('[data-source-main-frame]')?.getAttribute('data-source-main-frame')==='605');
    assert.equal((await snapshot(page)).held,'true');
    record.trace.push({step:'keyboard-skip-to605-stop',state:await snapshot(page)});
    assert.equal(await page.getByRole('button',{name:'Level 1',exact:true}).getAttribute('aria-pressed'),'true',
      'Source selected level must survive RepeatDirection and SelectLevel jumps');
    await pause(page,true);assert.equal(await page.getByRole('button',{name:'Level 1',exact:true}).isDisabled(),true);await pause(page,false);
    await page.getByRole('button',{name:'Repeat directions',exact:true}).click();
    await page.getByRole('dialog',{name:'Game directions'}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Level 1',exact:true}).isDisabled(),true);
    record.popupScreenshot=await shot(page,'p033-terminal-source-directions-popup');
    await page.getByRole('button',{name:'Close directions',exact:true}).click();
    await activate(page,page.getByRole('button',{name:'Level 1',exact:true}),'Space');
    await activate(page,page.getByRole('button',{name:'Start',exact:true}),'Enter');
    await page.locator('[data-source-level="1"]').waitFor();record.trace.push({step:'terminal-keyboard-level1-handoff',state:await snapshot(page)});
    await finish(page,record);
  }
  step='p033 reduced terminal';
  {
    const{page,record}=await mount('shared-alg001-l11-p033','reduce');
    await page.locator('[data-source-main-frame="605"]').waitFor();record.screenshot=await shot(page,'p033-reduced-source605');
    await page.getByRole('button',{name:'Repeat directions',exact:true}).click();await page.getByRole('dialog',{name:'Game directions'}).waitFor();
    await page.getByRole('button',{name:'Close directions',exact:true}).click();await finish(page,record);
  }
  step='p034 source matching and fade';
  for(const motion of['no-preference','reduce']){
    const{page,record}=await mount('shared-alg001-l11-p034',motion);
    for(const level of[1,2]){
      if(level===2)await page.getByRole('button',{name:'Level 2',exact:true}).click();
      assert.equal((await snapshot(page)).completions,String(level-1),'Matching completed before source pairs were answered');
      const cards=DATA.cards.filter(c=>c.level===level);
      await page.locator(`[data-source-card-id="${cards[0].id}"]`).click();await page.locator(`[data-source-card-id="${cards.find(c=>c.pairId!==cards[0].pairId).id}"]`).click();
      await page.locator('[data-feedback-phase="wrong-feedback"]').waitFor();await page.getByRole('button',{name:'Continue',exact:true}).click();
      for(let pair=1;pair<=6;pair++){
        assert.equal((await snapshot(page)).completions,String(level-1),'Matching completed with unresolved source pairs');
        const match=cards.filter(c=>c.pairId===pair);await page.locator(`[data-source-card-id="${match[0].id}"]`).click();await activate(page,page.locator(`[data-source-card-id="${match[1].id}"]`),pair%2?'Enter':'Space');
        await page.locator('[data-feedback-phase="correct-feedback"]').waitFor();
        const fade=page.locator(`[data-source-card-id="${match[0].id}"] [data-source-fade-tick]`);
        if(motion==='no-preference'&&pair===1){
          await pause(page,true);const pausedTick=await fade.getAttribute('data-source-fade-tick');await page.waitForTimeout(250);assert.equal(await fade.getAttribute('data-source-fade-tick'),pausedTick);await pause(page,false);
        }
        await page.waitForFunction(id=>document.querySelector(`[data-source-card-id="${id}"] [data-source-fade-tick]`)?.getAttribute('data-source-fade-tick')==='4',match[0].id);
        assert.equal(await fade.getAttribute('data-source-card-visible'),'false');assert.equal(await fade.getAttribute('data-source-tile-visible'),'true');
        record.trace.push({step:`level${level}-pair${pair}-revealed`,tick:4,sourceTiles:await page.locator(`[data-source-card-id^="level-${level}-"] [data-source-tile-visible="true"]`).count()});
        await page.getByRole('button',{name:'Continue',exact:true}).click();
      }
      await page.locator('[data-feedback-phase="complete"]').waitFor();record[`level${level}Screenshot`]=await shot(page,`p034-level${level}-${motion}-completed`);
      await page.waitForFunction(count=>document.querySelector('[data-test-loader]')?.getAttribute('data-test-completion-count')===String(count),level);
      assert.equal((await snapshot(page)).phase,'complete','Completion resolution lost the matching result');
      await replayButton(page).click();await page.locator('[data-feedback-phase="choosing"]').waitFor();assert.equal(await page.locator('[data-source-tile-visible="true"]').count(),0);
    }
    await finish(page,record);
  }
  step='p044 all24 actual questions';
  const seeds=new Map();for(let seed=0;seed<20000&&seeds.size<24;seed++){const q=createAlgL11Advanced3AssessmentState(seed).questionNumbers[0];if(!seeds.has(q))seeds.set(q,seed);}assert.equal(seeds.size,24);
  for(let q=1;q<=24;q++){
    const{page,record}=await mount('shared-alg001-l11-p044','reduce',seeds.get(q));await page.locator(`[data-source-question="Q${q}"]`).waitFor();
    assert.equal((await snapshot(page)).completions,'0','Unanswered assessment incorrectly completed');
    const source=DATA.questions[q-1];for(const choice of source.choices)assert.equal(await page.locator(`[data-source-instance-name="${choice.sourceInstanceName}"] svg`).count(),1);
    assert.equal(await page.locator(`[data-source-vector-sha256="${source.prompt.sha256}"]`).count(),1);
    record.screenshot=await shot(page,`p044-source-q${String(q).padStart(2,'0')}`);await finish(page,record);
  }
  step='p044 ten answers review pause and replay';
  {
    const{page,record}=await mount('shared-alg001-l11-p044','no-preference',31);const selection=(await snapshot(page)).selection;
    for(let i=0;i<10;i++){assert.equal((await snapshot(page)).completions,'0','Assessment completed before ten responses');const q=Number((await snapshot(page)).question.slice(1));const correct=G678_ALG_L11_ADVANCED3_TRANCHE_D_ANSWER_KEY[q-1];const option=i%2?correct:correct%4+1;await page.locator(`[data-source-instance-name="A${q}Opt${option}"]`).click();}
    await page.getByText('Score: 5 / 10',{exact:true}).waitFor();assert.equal(await page.getByText('Partially Proficient',{exact:true}).count(),1);
    await page.waitForFunction(()=>document.querySelector('[data-test-loader]')?.getAttribute('data-test-completion-count')==='1');
    assert.equal(await page.getByText('Score: 5 / 10',{exact:true}).count(),1,'Completion resolution lost the assessment score');
    await page.getByRole('button',{name:'Review answers',exact:true}).click();
    for(let i=0;i<10;i++){
      const button=page.getByRole('button',{name:i<9?'Next review':'Finish review',exact:true});
      await pause(page,true);assert.equal(await button.isDisabled(),true);const before=(await snapshot(page)).question;await page.waitForTimeout(40);assert.equal((await snapshot(page)).question,before);await pause(page,false);
      assert.equal(await page.locator('[data-review-selected="true"]').count(),1);assert.equal(await page.locator('[data-review-correct="true"]').count(),1);if(i===0)record.reviewScreenshot=await shot(page,'p044-review-source-content');await button.click();
    }
    await replayButton(page).click();await page.locator('[data-source-question]').waitFor();assert.notEqual((await snapshot(page)).selection,selection);assert.equal(await page.getByRole('button',{name:'Review answers',exact:true}).count(),0);await finish(page,record);
  }
  assert.deepEqual(await Promise.all(files.map(binding)),inputs,'source changed during mounted QA');
  evidence.status='passed';await save('evidence.json',json(evidence));console.log(json({status:'passed',output:OUTPUT,records:records.length}));
}catch(error){evidence.status='failed';evidence.failure={step,message:error.message};
  if(activePage&&!activePage.isClosed()){
    evidence.failure.state=await snapshot(activePage).catch(()=>null);
    evidence.failure.body=await activePage.locator('body').innerText().catch(()=>null);
    evidence.failure.screenshot=await shot(activePage,'failed-current-state').catch(()=>null);
  }
  await save('evidence.failed.json',json(evidence));console.error(json({status:'failed',output:OUTPUT,step,message:error.message,state:evidence.failure.state}));process.exitCode=1;}
finally{await browser.close();}
