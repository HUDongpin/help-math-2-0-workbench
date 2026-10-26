import assert from 'node:assert/strict';
import test, {type TestContext} from 'node:test';
import {createHash} from 'node:crypto';
import {DisplayObject, Runtime} from '../src/hfr/display';
import {HfrPlayer} from '../src/hfr/player';
import {LessonRuntime} from '../src/hfr/lesson-runtime';
import {beginPageSession, disposeLessonSession, isPageSessionCurrent} from '../src/hfr/session';
import {Renderer} from '../src/hfr/render';
import {createHfrAnimationModule} from '../src/hfr/module';
import {assertHfrMetaMatchesData} from '../src/hfr/meta';
import type {HfrPageMeta, PageData} from '../src/hfr/types';

function fixture() {
  const data: PageData = {schema: 'hfr-page/1', compiler: 'clock-fixture',
    placement: {animationId: 'shared-nms002-l07-p001', module: 'NMS002', course: 'fixture', lesson: 7, lessonTitle: 'fixture', sectionCode: 'RW', ordinal: 1},
    source: {path: 'fixture.swf', sha256: 'a'.repeat(64), bytes: 0, swfVersion: 6},
    stage: {width: 800, height: 600, fps: 12, background: [255,255,255]}, module: 'fixture.js',
    dictionary: {113: {kind: 'sprite', frameCount: 136, labels: {}, frames: Array.from({length: 136}, () => [])}},
    root: {frameCount: 10, labels: {}, frames: Array.from({length: 10}, (_, index) => index === 4 ? [{op: 'place', depth: 1, charId: 113, name: 'content'}] : [])},
    exports: {}, streams: [], stats: {scripts: 0, codeBodies: 0, fallbackBodies: 0, characters: 1, mediaFiles: 0}};
  const meta: HfrPageMeta = {key: data.placement.animationId, lessonKey: 'shared-nms002-l07', dataUrl: '/fixture.data.json',
    sourceSha256: data.source.sha256, compiler: data.compiler, sourceRootFrameCount: 10, stage: {width: 800, height: 600, fps: 12},
    progressTimeline: 113, progressFrameCount: 136, completionMode: 'timeline', lessonPagesByFile: {}, previousKey: null, nextKey: null, hasSpanishNarration: false};
  return {data, meta};
}


// The player gets its Runtime through the public session/load path. These small
// DOM/audio ports exercise production ownership; they are not browser evidence.
async function loadedPlayer(t: TestContext) {
  const {data,meta}=fixture(),context={setTransform(){},clearRect(){},fillRect(){},save(){},beginPath(){},rect(){},clip(){},restore(){}};
  const canvas=Object.assign(new EventTarget(),{width:800,height:600,isConnected:true,style:{cursor:''},getContext:()=>context,
    getBoundingClientRect:()=>({left:0,top:0,width:800,height:600}),setPointerCapture(){}});
  class AudioPort {
    state='suspended';currentTime=0;destination={};
    createGain(){return {gain:{value:1},connect(){}};}
    async resume(){this.state='running';} async suspend(){this.state='suspended';} async close(){this.state='closed';}
  }
  let serial=0;const frames=new Map<number,FrameRequestCallback>();
  const ports={document:{hidden:false,createElement:()=>({width:1,height:1,getContext:()=>context})},window:{devicePixelRatio:1},AudioContext:AudioPort,
    requestAnimationFrame:(callback:FrameRequestCallback)=>{const id=++serial;frames.set(id,callback);return id;},cancelAnimationFrame:(id:number)=>frames.delete(id)};
  const previous=new Map(Object.keys(ports).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  const hostScope={id:'clock-fixture'};let player:HfrPlayer|undefined;
  t.after(()=>{try{player?.destroy();disposeLessonSession(hostScope);}finally{for(const [key,descriptor] of previous){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}}});
  for(const [key,value] of Object.entries(ports))Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
  const session=beginPageSession({hostScope,lessonKey:meta.lessonKey,pageKey:meta.key,sourceSha256:data.source.sha256,compiler:data.compiler,seed:0},()=>new LessonRuntime());
  player=new HfrPlayer(canvas as unknown as HTMLCanvasElement);
  const dataSha256=createHash('sha256').update(JSON.stringify(data)).digest('hex');
  assert.equal(await player.load(data,()=>({}),'/fixture/',{audio:false,session,dataSha256,progressTimeline:meta.progressTimeline}),true);
  assert.equal(isPageSessionCurrent(session),true);assert.equal(Object.hasOwn(player,'rt'),false);
  const rt=player.rt;assert(rt,'public load creates an active Runtime lease');
  return {player,rt,canvas,frames};
}

test('module metadata keeps the source root separate from the real content domain', () => {
  const {data, meta} = fixture();
  assert.doesNotThrow(() => assertHfrMetaMatchesData(meta, data));
  const module = createHfrAnimationModule(meta, () => ({}));
  assert.equal(module.movie.frameCount, 10);
  assert.equal(module.runtime?.frameCount, 10);
  assert.deepEqual(module.runtime?.frameDomains, [{id: 'sprite-113', frameCount: 136, fps: 12}]);
  assert.equal(module.runtime?.defaultFrameDomain, 'sprite-113');
  assert.doesNotThrow(() => assertHfrMetaMatchesData({...meta, progressFrameCount: 10}, data));
  for (const changed of [{...meta, sourceRootFrameCount: 136}, {...meta, progressFrameCount: 999},
    {...meta, progressTimeline: 999}, {...meta, sourceSha256: 'b'.repeat(64)}, {...meta, compiler: 'different'}]) {
    assert.throws(() => assertHfrMetaMatchesData(changed, data), /HFR_SOURCE_RUNTIME_METADATA_MISMATCH/u);
  }
});

test('progress reports the actual root until the selected source clip exists', async (t) => {
  const {player,rt}=await loadedPlayer(t);
  assert.deepEqual(player.progress(), {frame: 1, frameCount: 10, domain: 'root', settled: false, reachedEnd: false});
  rt.page_.gotoFrame(5);
  assert.deepEqual(player.progress(), {frame: 1, frameCount: 136, domain: 'sprite-113', settled: false, reachedEnd: false});
});

test('native redraw has before/draw/report ordering and never advances the source clock', async (t) => {
  const {player,rt}=await loadedPlayer(t),events:string[]=[];
  const render=player.renderer.render.bind(player.renderer);
  player.renderer.render=(runtime:Runtime)=>{assert.equal(runtime,rt);events.push('canvas');render(runtime);};
  player.opts.onBeforeRender=()=>events.push('hide-old-native');player.opts.onTick=()=>events.push('read-current-native');
  const ticks = rt.tickCount, frame = rt.page_.frame;
  player.redraw();
  assert.deepEqual(events, ['hide-old-native', 'canvas', 'read-current-native']);
  assert.equal(rt.tickCount, ticks); assert.equal(rt.page_.frame, frame);
  events.length = 0;
  player.renderer.render(rt);
  assert.deepEqual(events, ['canvas'], 'native commit repaint bypasses source draw/tick callbacks');
  assert.equal(rt.tickCount, ticks);
});

test('Canvas suppression is exact text-only and opt-in; geometry remains drawn', () => {
  const {data} = fixture(); const rt = new Runtime(data); rt.loadPage();
  const calls: string[] = [];
  const renderer = Object.assign(Object.create(Renderer.prototype), {rt,
    drawText: () => calls.push('text'), drawShape: () => calls.push('shape')}) as Renderer;
  // Use source leaf instances, not mocked suppression callbacks that alter geometry.
  const label = new DisplayObject(rt, null, {kind: 'text'}, rt.page_, 1, 'label', 1);
  const shape = new DisplayObject(rt, null, {kind: 'shape', draws: []}, rt.page_, 2, 'shape', 2);
  const m = {a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0}, cx = [256,256,256,256,0,0,0,0];
  renderer.drawObject(label, m, cx); assert.deepEqual(calls, ['text']);
  renderer.shouldSuppressText = (_runtime, object) => object === label;
  renderer.drawObject(label, m, cx); renderer.drawObject(shape, m, cx);
  assert.deepEqual(calls, ['text', 'shape']);
  renderer.shouldSuppressText = undefined; renderer.drawObject(label, m, cx);
  assert.deepEqual(calls, ['text', 'shape', 'text']);
});

test('pause cancels held source input and paused Canvas events cannot run source handlers', async (t) => {
  const {player,rt,canvas,frames}=await loadedPlayer(t);player.start();assert.equal(frames.size,1);
  const key = () => Object.assign(new Event('keydown'), {keyCode: 65, key: 'a'});
  canvas.dispatchEvent(key()); assert.equal(rt.keysDown.has(65), true);
  rt.mouse.down = true; rt.pressed = rt.page_; rt.drag = {};
  const tick = rt.tickCount; player.pause();assert.equal(frames.size,0);
  assert.equal(rt.keysDown.size, 0); assert.equal(rt.mouse.down, false); assert.equal(rt.pressed, null); assert.equal(rt.drag, null);
  canvas.dispatchEvent(key());
  canvas.dispatchEvent(Object.assign(new Event('pointerdown'), {clientX: 1, clientY: 1, pointerId: 1}));
  assert.equal(rt.keysDown.size, 0); assert.equal(rt.mouse.down, false); assert.equal(rt.tickCount, tick);
});
