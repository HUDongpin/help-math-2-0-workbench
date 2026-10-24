import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';
import {getCourseG04L03In002FrameState, COURSE_G04_L03_IN_002_RUNTIME} from '../modules/course-g04-l03-in-002';
import {readTextSourceAsset} from '../../../../scripts/build-lesson-text-source-catalog-v1.mjs';
import {
  G4L3In002ModernRenderer, G4_L3_IN002_BEATS, G4_L3_IN002_AXIS_RATIOS, G4_L3_IN002_SIGN_SOURCE, G4_L3_IN002_KEY_TERMS, G4_L3_IN002_KEY_TERMS_CAPABILITY,
  G4_L3_IN002_TEXT_BINDING, G4_L3_IN002_TEXT_PRESENTATION, G4_L3_IN002_TICK_REVEALS,
  G4_L3_IN002_WORD_REVEALS, getG4L3In002TeachingState, getG4L3In002TextSnapshot,
} from './g4-l3-in002';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const sourceHash = '60a1a78e5e927d6732c69518699caf71307e4f30da3b9e2bab29d0bab241989d';
const context = (frame: number, changes: Partial<RuntimeContext> = {}): RuntimeContext => ({frame, frameDomain: 'sprite-88', rootFrame: 6, scenario: 'source-static-frame', lang: 'en', seed: 0, replay: 0, ...changes});
const snapshot = (frame: number, changes: Partial<RuntimeContext> = {}) => {
  const request = context(frame, changes);
  return getG4L3In002TextSnapshot(getCourseG04L03In002FrameState(frame, request), request);
};
const text = (frame: number, id: string) => snapshot(frame).blocks.find((block) => block.id === id);
const sourceAsset = (async () => {
  const index = JSON.parse(await readFile(`${root}catalog/typography-v1/source-catalog/index.json`, 'utf8'));
  return readTextSourceAsset(root, index.assets.find((entry: {sourceSha256: string}) => entry.sourceSha256 === sourceHash));
})();

test('modern capability retains the exact placement and source timeline contract', async () => {
  assert.equal(G4_L3_IN002_TEXT_BINDING.placementId, 'g04-l03-placement-013');
  assert.equal(G4_L3_IN002_TEXT_BINDING.sourceSwfSha256, sourceHash);
  assert.equal(G4_L3_IN002_TEXT_PRESENTATION.Renderer, G4L3In002ModernRenderer);
  assert.equal(COURSE_G04_L03_IN_002_RUNTIME.fps, 12);
  assert.equal(COURSE_G04_L03_IN_002_RUNTIME.frameCount, 10);
  assert.deepEqual(COURSE_G04_L03_IN_002_RUNTIME.frameDomains?.find((domain) => domain.id === 'sprite-88'), {id:'sprite-88',frameCount:492,fps:12,rootFrame:6});
  const source = await sourceAsset;
  assert.equal(source.sourceSha256, sourceHash);
  assert.equal(source.summary.unresolvedRuns, 0);
  const ids = new Set(source.textDefinitions.flatMap((definition: any) => definition.runs.map((run: any) => run.sourceTextId)));
  for (const block of G4_L3_IN002_TEXT_BINDING.blocks) for (const id of block.sourceTextIds) assert.ok(ids.has(id), id);
});

test('every complete-word threshold follows the source wipe, including its holds', async () => {
  const source = await sourceAsset;
  const definition = source.textDefinitions.find((entry: any) => entry.characterId === 8);
  assert.equal(definition.runs.map((run: any) => run.text).join('').trimEnd(), 'A number line is a line for ordering numbers by their value.');
  const sourceCode = await readFile(`${root}apps/web/public/flash-assets/courses/course-g04-l03-in-002/canvas-renderer.js`, 'utf8');
  const font = sourceCode.slice(sourceCode.indexOf('function font1('), sourceCode.indexOf('function text2('));
  const maxX: Record<string, number> = {};
  for (const glyph of font.matchAll(/case "([^"]+)":([\s\S]*?)(?:break;)/g)) {
    const coordinates = [...glyph[2].matchAll(/pathData="([^"]+)"/g)].flatMap((match) => (match[1].match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number).filter((_, index) => index % 2 === 0));
    maxX[glyph[1]] = Math.max(...coordinates);
  }
  const timeline = source.timelines.find((entry: any) => entry.timelineId === 'sprite-88');
  const masks = timeline.events.filter((entry: any) => entry.instanceId === 'sprite-88/depth-1/generation-1' && entry.matrix);
  let cursor = 0, word = '', right = 0;
  const expected: {text: string; frame: number}[] = [];
  for (const run of definition.runs) for (const glyph of run.glyphs) {
    if (glyph.unicode === ' ') {
      if (word) {
        const reveal = masks.find((event: any) => event.matrix[0] * 5029 + event.matrix[4] >= right - 4919);
        assert.ok(reveal, word);
        expected.push({text: word, frame: reveal.frame});
        word = '';
      }
    } else {
      word += glyph.unicode;
      right = Math.max(right, cursor + maxX[glyph.unicode] * 400 / 1024);
    }
    cursor += glyph.advanceTwips;
  }
  assert.deepEqual(G4_L3_IN002_WORD_REVEALS, expected);
  for (let index = 0; index < expected.length; index += 1) {
    const entry = expected[index];
    assert.equal(getG4L3In002TeachingState(entry.frame - 1).definition, expected.slice(0, index).map((word) => word.text).join(' '));
    assert.equal(getG4L3In002TeachingState(entry.frame).definition, expected.slice(0, index + 1).map((word) => word.text).join(' '));
  }
  assert.equal(text(3, 'definition')?.visible, false);
  assert.equal(getG4L3In002TeachingState(19).definition, 'A number line');
  assert.equal(getG4L3In002TeachingState(31).definition, 'A number line is a line');
});

test('signed ticks enter in the source order rather than displaying the final number line at frame one', async () => {
  assert.deepEqual(getG4L3In002TeachingState(70).tickValues, []);
  assert.deepEqual(getG4L3In002TeachingState(71).tickValues, [0]);
  const source = await sourceAsset;
  const timeline = source.timelines.find((entry: any) => entry.timelineId === 'sprite-88');
  const positiveIds = [21,26,31,36,41,46,51,56,62,66];
  for (const [index, frame] of G4_L3_IN002_TICK_REVEALS.entries()) {
    assert.equal(Math.min(...timeline.instances.filter((instance: any) => instance.characterId === positiveIds[index]).map((instance: any) => instance.firstFrame)), frame);
    assert.equal(getG4L3In002TeachingState(frame - 1).maximumTick, index);
    assert.equal(getG4L3In002TeachingState(frame).maximumTick, index + 1);
    assert.equal(text(frame, `tick-negative-${index + 1}`)?.text, `−${index + 1}`);
    assert.equal(text(frame, `tick-negative-${index + 1}`)?.visible, true);
  }
  assert.equal(getG4L3In002TeachingState(90).axisExtent, 10.8);
  assert.equal(getG4L3In002TeachingState(90).arrowsVisible, false);
  assert.equal(getG4L3In002TeachingState(91).arrowsVisible, true);
});

test('axis growth uses every authored 16-bit ratio rather than an approximate linear ramp', async () => {
  const source = await sourceAsset;
  const timeline = source.timelines.find((entry: any) => entry.timelineId === 'sprite-88');
  for (const characterId of [17,18]) {
    const instance = timeline.instances.find((entry: any) => entry.characterId === characterId);
    const events = timeline.events.filter((entry: any) => entry.instanceId === instance.instanceId && entry.kind === 'place');
    assert.deepEqual(events.map((entry: any) => entry.frame), Array.from({length:19}, (_,i) => 71+i));
    assert.deepEqual(events.map((entry: any) => entry.ratio ?? 0), G4_L3_IN002_AXIS_RATIOS);
    for (const event of events) assert.equal(getG4L3In002TeachingState(event.frame).axisExtent, ((event.ratio ?? 0)/65535)*10.8);
  }
  assert.equal(getG4L3In002TeachingState(70).axisExtent,0);
  assert.equal(getG4L3In002TeachingState(90).axisExtent,10.8);
});

test('shape-derived minus signs and outline emphasis have exact source definitions and frame spans', async () => {
  const source = await sourceAsset;
  const timeline = source.timelines.find((entry: any) => entry.timelineId === 'sprite-88');
  const shapeIds = new Set(source.shapeDefinitions.map((entry: any) => entry.characterId));
  for (const id of [...G4_L3_IN002_SIGN_SOURCE.negativeSignCharacters, 77,78,87]) assert.ok(shapeIds.has(id), `shape ${id}`);
  for (const [character, expected] of [[77,[123,149]], [78,[155,173]], [87,[442,483]]] as const) {
    const instance = timeline.instances.find((instance: any) => instance.characterId === character);
    assert.deepEqual([instance.firstFrame,instance.lastFrameExclusive], expected);
  }
  for (const [frame, positive, negative] of [[122,false,false],[123,true,false],[148,true,false],[149,false,false],[154,false,false],[155,false,true],[172,false,true],[173,false,false]] as const) {
    const state=getG4L3In002TeachingState(frame);
    assert.equal(state.positiveOutline,positive);assert.equal(state.negativeOutline,negative);
  }
  assert.equal(getG4L3In002TeachingState(481).negativeSignEmphasis,true);
  assert.equal(getG4L3In002TeachingState(482).negativeSignEmphasis,false,'zero-alpha source emphasis must be absent even before RemoveObject');
});

test('category names remain absent until their first nonzero source alpha', async () => {
  const source = await sourceAsset;
  const timeline = source.timelines.find((entry: any) => entry.timelineId === 'sprite-88');
  for (const [id, character, start] of [['positive-name',75,232],['negative-name',79,310]] as const) {
    const instance = timeline.instances.find((entry: any) => entry.characterId === character);
    const firstVisible = timeline.events.find((entry: any) => entry.instanceId === instance.instanceId && entry.colorTransform?.multiply[3] > 0);
    assert.equal(firstVisible.frame,start);
    assert.equal(text(start-1,id)?.visible,false);assert.equal(text(start,id)?.visible,true);
  }
});

test('plus signs enter one by one and disappear on the transparent source frame', async () => {
  const source = await sourceAsset;
  const timeline = source.timelines.find((entry: any) => entry.timelineId === 'sprite-88');
  const signs = timeline.instances.filter((entry: any) => entry.characterId === 83);
  assert.deepEqual(signs.map((entry: any) => entry.firstFrame), [360,363,366,369,372,375,378,381,384,387]);
  for (const [index, instance] of signs.entries()) {
    const value = index+1;
    assert.equal(text(instance.firstFrame-1,`tick-positive-${value}`)?.text,String(value));
    assert.equal(text(instance.firstFrame,`tick-positive-${value}`)?.text,`+${value}`);
    const transparent = timeline.events.find((event: any) => event.instanceId === instance.instanceId && event.colorTransform?.multiply[3] === 0);
    assert.equal(transparent.frame,417);
  }
  assert.equal(getG4L3In002TeachingState(416).positiveSignCount,10);
  assert.equal(getG4L3In002TeachingState(417).positiveSignCount,0);
});

test('every frame preserves mathematical order and the same seed/replay identity', () => {
  for (let frame=1;frame<=492;frame+=1) {
    const state=snapshot(frame,{seed:41,replay:2});
    assert.equal(state.status,'ready');assert.equal(state.identity.seed,41);assert.equal(state.identity.replay,2);
    assert.equal(state.identity.frame,frame);assert.equal(state.identity.rootFrame,6);
    const values=state.blocks.filter((block)=>block.visible&&block.id.startsWith('tick-')).map((block)=>Number(block.text.replace('−','-')));
    assert.deepEqual(values,[...values].sort((a,b)=>a-b));
    assert.equal(new Set(values).size,values.length);
    assert.ok(state.blocks.every((block)=>block.language==='en'));
    assert.deepEqual(state.suppressedInstances,[],'whole-renderer replacement must not fabricate per-instance suppression');
  }
});

test('unrelated root and companion definitions do not leak into the student text', () => {
  const markup=renderToStaticMarkup(createElement(G4L3In002ModernRenderer,{...context(492)}));
  assert.doesNotMatch(markup,/Perimeter and Area|Negative Numbers: Learn It|source-assets|60a1a78e|Engineering candidate/);
  assert.match(markup.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ''),/A number line is a line for ordering numbers by their value\./);
  assert.match(markup,/data-flash-frame="492"/);
  assert.match(markup,/<span[^>]+data-lesson-text-block="tick-negative-10"[^>]*>−10<\/span>/);
  assert.doesNotMatch(markup,/<canvas|<image/);
});

test('Replay clears the final teaching state without adding a clock or changing metadata', () => {
  assert.equal(snapshot(492).blocks.filter((block)=>block.visible).length,24);
  assert.deepEqual(snapshot(1,{replay:1}).blocks.filter((block)=>block.visible),[]);
  assert.equal(snapshot(1,{replay:1}).identity.replay,1);
  assert.deepEqual(snapshot(56,{replay:2,seed:0}).blocks,snapshot(56,{replay:0,seed:999}).blocks);
});

test('unsupported language, source, frame domain, scenario and mismatched state fail closed', () => {
  for(const changes of [{lang:'es'},{frameDomain:'root'},{scenario:'not-a-source-scenario'},{rootFrame:5}] as const){
    assert.equal(snapshot(492,changes).status,'blocked');
    assert.deepEqual(snapshot(492,changes).blocks,[]);
  }
  const request=context(492);const original=getCourseG04L03In002FrameState(492,request);
  assert.equal(getG4L3In002TextSnapshot({...original,sourceSwfSha256:'1'.repeat(64)},request).status,'blocked');
  assert.equal(getG4L3In002TextSnapshot(original,context(100)).status,'blocked');
});

test('the page binding records source hashes and remaining acceptance work separately', async () => {
  const receipt=JSON.parse(await readFile(`${root}catalog/typography-v1/page-bindings/g04-l03-placement-013.json`,'utf8'));
  assert.deepEqual(Object.fromEntries(Object.keys(G4_L3_IN002_TEXT_BINDING).map(key=>[key,receipt[key]])),G4_L3_IN002_TEXT_BINDING);
  assert.equal(receipt.implementation.status,'candidate');
  assert.equal(receipt.implementation.replacementMode,'whole-maintained-renderer');
  assert.equal(receipt.acceptanceEffects.humanReviewAccepted,false);
  assert.equal(receipt.acceptanceEffects.originalRuntimeAccepted,false);
  assert.ok(receipt.implementation.files.length>=29);
  assert.ok(receipt.implementation.files.some((file:{path:string})=>file.path==='packages/demos/src/lesson-text-completion.ts'));
  for(const file of receipt.implementation.files)assert.equal(createHash('sha256').update(await readFile(root+file.path)).digest('hex'),file.sha256,file.path);
  assert.ok(Array.isArray(receipt.unresolved));
  assert.ok(receipt.independentPending.includes('named-human-visual-review-pending'));
  assert.ok(!receipt.unresolved.includes('named-human-visual-review-pending'));
  const sourceCanvas=await readFile(`${root}${receipt.sourceEvidence.canvas.path}`);
  assert.equal(createHash('sha256').update(sourceCanvas).digest('hex'),receipt.sourceEvidence.canvas.sha256);
  assert.deepEqual(receipt.teachingBeats,G4_L3_IN002_BEATS);
});


test('source glossary buttons bind exact English index entries only after their words are visible', async () => {
  const bytes=await readFile(root+'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),G4_L3_IN002_KEY_TERMS_CAPABILITY.sourceSha256);
  const index=JSON.parse(await readFile(root+'apps/web/public/generated/g4-grade-wide-keyterms-en.json','utf8'));
  const actions=gunzipSync(await readFile(root+'migrations/course-g04-l03-in-002/audit/machine/ffdec-scripts.txt.gz')).toString();
  for(const term of G4_L3_IN002_KEY_TERMS){
    assert.equal(index.entries.find((entry:any)=>entry.id===term.entryId)?.titles.en,term.keyAttribute);
    assert.ok(actions.includes(`DefineButton2_${term.characterId}/BUTTONCONDACTION`));
    assert.ok(actions.includes(`_global.KeyAttribute = "${term.keyAttribute}"`));
    const before=renderToStaticMarkup(createElement(G4L3In002ModernRenderer,{...context(term.firstVisibleFrame-1),onLessonHostRequest:()=>undefined}));
    const after=renderToStaticMarkup(createElement(G4L3In002ModernRenderer,{...context(term.firstVisibleFrame),onLessonHostRequest:()=>undefined}));
    assert.ok(!before.includes(`data-source-keyterm="${term.keyAttribute}"`));
    assert.ok(after.includes(`data-source-keyterm="${term.keyAttribute}"`));
  }
});

test('keyboard help follows the UI language while the source definition stays English', () => {
  const spanish = renderToStaticMarkup(createElement(G4L3In002ModernRenderer, {...context(492), uiLanguage: 'es'}));
  const english = renderToStaticMarkup(createElement(G4L3In002ModernRenderer, {...context(492), uiLanguage: 'en'}));
  assert.match(spanish, /class="in002-scroll-help" lang="es"/);
  assert.ok(spanish.includes('Con la recta numérica enfocada'));
  assert.ok(english.includes('With the number line focused'));
  assert.ok(!spanish.includes('With the number line focused'));
  for (const markup of [spanish, english]) {
    assert.match(markup, /lesson-text-presentation--complex-figure" lang="en"/);
    assert.ok(markup.replace(/<[^>]*>/g, '').includes('A number line is a line for ordering numbers by their value.'));
    const helpId = markup.match(/<p id="([^"]+)" class="in002-scroll-help"/)?.[1];
    assert.ok(helpId);
    assert.ok(markup.includes(`aria-describedby="${helpId}"`));
  }
});

test('modern source-stop audio copies the original English cue and preserves the Spanish track',async()=>{
  const {default:original}=await import('../modules/course-g04-l03-in-002');
  const {G4_L3_IN002_SOURCE_AUDIO_CUES}=await import('./g4-l3-in002');
  assert.deepEqual(G4_L3_IN002_SOURCE_AUDIO_CUES,original.audioCues);
  assert.equal(G4_L3_IN002_SOURCE_AUDIO_CUES[0].frame,3);assert.equal(G4_L3_IN002_SOURCE_AUDIO_CUES[0].endFrame,493);
  assert.equal(G4_L3_IN002_SOURCE_AUDIO_CUES[0].language,'en');
  for(const cue of G4_L3_IN002_SOURCE_AUDIO_CUES)assert.equal(createHash('sha256').update(await readFile(root+'apps/web/public'+cue.source)).digest('hex'),cue.sha256);
  assert.equal(original.audioTracks?.find(track=>track.language==='es')?.sha256,'65fbaef6b2a96b18da2bed86118a754d64c075af251bd5f0074ed16f5c40aafa');
});
