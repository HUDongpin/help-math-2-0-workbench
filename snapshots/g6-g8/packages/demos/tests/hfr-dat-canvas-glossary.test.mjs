/** Exact retained source/AOT tests. Hit predicate and media I/O are isolated;
 * these tests do not establish real Canvas hits, browser focus, or listening. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), ROOT = process.env.HFR_GLOSSARY_TEST_SOURCE_ROOT ?? HERE;
const file = p => fs.existsSync(path.resolve(HERE, p)) ? path.resolve(HERE, p) : path.resolve(ROOT, p), read = p => fs.readFileSync(file(p), 'utf8'), sha = b => createHash('sha256').update(b).digest('hex'), ts = createRequire(ROOT + '/package.json')('typescript');
const load = p => import(pathToFileURL(path.resolve(ROOT, p)));
const { LessonRuntime } = await load('packages/demos/src/hfr/lesson-runtime.ts'), { MovieClip, ButtonObj, apply, mul } = await load('packages/demos/src/hfr/display.ts'), { HfrPlayer } = await load('packages/demos/src/hfr/player.ts'), { resolveHfrCanvasGlossaryControl: resolve, withHfrCanvasGlossary } = await load('packages/demos/src/hfr/source-canvas-glossary.ts'), { createHfrGlossaryRelease, bridgeHostCall, resumeHfrGlossarySource } = await load('packages/demos/src/hfr/host-bridge.ts'), { createDatL3FeedbackHost } = await load('packages/demos/src/hfr/dat-l03-feedback-host.ts'), { hfrCanvasGlossaryProjection } = await load('apps/web/lib/hfr-canvas-glossary-projection.ts'), { createMemoryOnlyLessonHost } = await load('packages/demos/src/lesson-host-contract.ts'), { transitionDescriptorGlossaryPause } = await load('apps/web/lib/descriptor-driven-glossary-pause.ts');
const dat = JSON.parse(read('catalog/g678-dat-l03-canvas-glossary-v1.json')), nms = JSON.parse(read('catalog/g678-nms-l07-canvas-glossary-v1.json'));
const rendererSource = read('packages/demos/src/hfr/renderer.tsx'), descriptorSource = read('apps/web/components/descriptor-driven-whole-lesson-player.tsx');
function expr(source, choose, context) { const ast = ts.createSourceFile('actual.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX); let selected; function visit(n) { selected ??= choose(n, ast); ts.forEachChild(n, visit); } visit(ast); assert(selected); return vm.runInNewContext(ts.transpileModule('const actual=' + selected.getText(ast) + '; actual;', { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText, context); }
function rendererHandlers(context) { const ast = ts.createSourceFile('renderer.tsx', rendererSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX), functions = [], props = {}; function visit(n) { if (ts.isFunctionDeclaration(n) && ['sourceControl', 'executeGlossary'].includes(n.name?.text))
    functions.push(n.getText(ast)); if (ts.isPropertyAssignment(n) && ['onHost', 'sourceButtonInput', 'onSourceButtonRelease'].includes(n.name.getText(ast)))
    props[n.name.getText(ast)] = n.initializer.getText(ast); ts.forEachChild(n, visit); } visit(ast); assert.equal(functions.length, 2); assert.equal(Object.keys(props).length, 3); return vm.runInNewContext(ts.transpileModule('let pendingGlossary=null;' + functions.join('\n') + ';({' + Object.entries(props).map(([k, v]) => k + ':' + v).join(',') + '});', { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText, context); }
function descriptor(page, locale = 'en', allowed = true) { const h = createMemoryOnlyLessonHost({ releaseId: 'source-fixture', releaseMemberIds: [page.meta.key], currentAnimationId: page.meta.key, enabledCapabilities: allowed ? ['glossary'] : [] }), frames = [], pauses = []; const context = { lessonHost: h, currentPageSessionId: page.meta.key, glossaryFocusSessionId: page.meta.key + ':1:' + locale, activeGlossaryPageSession: { current: page.meta.key + ':1:' + locale }, currentPage: { animationId: page.meta.key }, descriptor: { schemaVersion: 2, glossary: page.descriptorEntries, pages: [] }, paused: false, seekRequest: null, glossaryPauseSessionRef: { current: null }, glossaryTrigger: { current: null }, setLessonHostRevision: () => { }, setPaused: v => pauses.push(v), setSeekRequest: () => { }, transitionDescriptorGlossaryPause, requestAnimationFrame: f => frames.push(f), document: { activeElement: null } }; const handle = expr(descriptorSource, (n, a) => ts.isVariableDeclaration(n) && n.name.getText(a) === 'handleLessonHostRequest' ? n.initializer.arguments[0] : undefined, context); return { handle, h, frames, pauses, context }; }
async function fixture(page, control, atFrame) {
    const contract = page.meta.key.includes('dat001') ? dat : nms, binding = page.binding, source = contract.inputs.find(p => p.sha256 === binding.dataSha256), aot = contract.inputs.find(p => p.path.endsWith('/hfr-pages/' + page.meta.key + '.ts'));
    assert(source && aot);
    const bytes = fs.readFileSync(file(source.path));
    assert.equal(sha(bytes), source.sha256);
    const data = JSON.parse(bytes), factory = (await import(pathToFileURL(file(aot.path)))).default, lesson = new LessonRuntime();
    let target = null;
    const stops = [];
    const lease = lesson.enter({ lessonKey: page.meta.lessonKey, pageKey: page.meta.key, sourceSha256: page.meta.sourceSha256, compiler: page.meta.compiler, seed: 0 }, data, factory, { audio: { streamFrame: () => null, streamStop: c => stops.push(c), playEvent: () => { }, stopAll: () => { } }, hitTest: o => o === target }), rt = lesson.active(lease), main = () => rt.page_.children.get(binding.depth), feedback = page.meta.key.includes('dat001') ? createDatL3FeedbackHost(rt, { validatedDataSha256: binding.dataSha256, seed: 0, isCurrent: () => lesson.active(lease) === rt }) : null;
    const hold = page.meta.key.includes('dat001') ? ({ p029: 185, p034: 209, p037: 203, p044: 136 }[page.meta.key.slice(-4)]) : 20;
    const at = atFrame ?? Math.max(hold, control.ancestors?.[0]?.firstFrame ?? control.firstFrame);
    let count = 0, answered = false;
    while ((!(main() instanceof MovieClip) || main().frame < at) && count++ < binding.frames + 150) {
        if (main()?.frame === hold && !main().playing && at > hold && !answered) {
            const candidate = rt.allObjects().find(o => o.parentClip === main() && o.name.startsWith('AnsBtn') && o.def.conds?.some(c => String(rt.scripts[c.script]).includes('showRightFeed')));
            assert(candidate);
            rt.click(candidate);
            feedback.afterSourceUpdate();
            answered = true;
        }
        assert(lesson.tick(lease));
        feedback?.afterSourceUpdate();
    }
    assert(count < binding.frames + 150, 'natural source path reaches target');
    if (control.ancestors?.length) {
        const nmh = rt.allObjects().find(o => o.parentClip === main() && o.name === 'NMHBtn');
        assert(nmh);
        rt.click(nmh);
        feedback.afterSourceUpdate();
    }
    let parent = main();
    for (const a of control.ancestors ?? [])
        parent = parent.children.get(a.depth);
    const button = parent.children.get(control.depth);
    assert(button instanceof ButtonObj);
    assert.equal(button.charId, control.sourceButtonCharacterId);
    target = button;
    const rec = control.hitRecord, world = mul(button.worldMatrix(), { a: rec.m[0], b: rec.m[1], c: rec.m[2], d: rec.m[3], tx: rec.m[4], ty: rec.m[5] }), bounds = control.hitBounds, point = apply(world, (bounds.xmin + bounds.xmax) / 2, (bounds.ymin + bounds.ymax) / 2).map(n => n / 20), meta = withHfrCanvasGlossary(page.meta);
    return { rt, main, button, point, meta, stops, lesson, lease, control, binding, feedback, setTarget: o => target = o, close() { feedback?.dispose(); lesson.close(); } };
}
function renderer(f, page, locale = 'en', allowed = true) { const host = descriptor(page, locale, allowed), calls = [], denied = [], pauses = [], lease = { token: 1 }; let focuses = 0; const canvas = { isConnected: true, focus: () => focuses++, closest: () => null }; const player = { rt: f.rt, sourceReleaseButton: null, destroyed: false, opts: { onError: e => { throw e; } }, runSourceButtonRelease: HfrPlayer.prototype.runSourceButtonRelease, pause: () => pauses.push(f.rt.tickCount), redraw: () => { }, destroy: () => { player.rt = null; } }; const context = { disposed: false, player, playerRef: { current: player }, lease, isPageSessionCurrent: q => q === lease && context.current && f.lesson.active(f.lease) === f.rt, live: { current: { paused: false, reducedMotion: false, onLessonHostRequest: (request, c) => { calls.push({ request, trigger: c?.trigger, sourcePlaying: f.main().playing }); return host.handle(request, c); } } }, document: { hidden: false }, nativeText: undefined, preparedNative: null, resolveHfrCanvasGlossaryControl: resolve, validatedDataSha256: f.binding.dataSha256, ButtonObj, MovieClip, createHfrGlossaryRelease, bridgeHostCall, canvas, meta: f.meta, glossaryHold: { current: null }, setGlossaryDenied: v => denied.push(v), flags: { activity: false, lessonFinished: false }, current: true, isPractice: false }; const handlers = rendererHandlers(context); Object.assign(player.opts, handlers); f.rt.hostCb = handlers.onHost; return { ...host, handlers, context, player, calls, denied, pauses, focuses: () => focuses, release: () => { f.rt.pointerMove(...f.point); const down = f.rt.pointerDown(true); let up; handlers.onSourceButtonRelease(f.rt, f.button, f.point, () => { up = f.rt.pointerUp(true); }); return { down, up }; } }; }
for (const page of [...dat.pages, ...nms.pages])
    test(page.meta.key + ': every exact retained placement resolves, source release stops primary, and Close/Play preserve source state', async () => { for (const control of page.binding.controls) {
        const f = await fixture(page, control);
        try {
            const found = resolve(f.meta, f.rt, f.button, f.point, f.binding.dataSha256);
            assert(found, control.placementId ?? control.sourceButtonCharacterId);
            assert.equal(found.sourceTimeline, f.main());
            assert.equal(found.liveButton, f.button);
            const before = { frame: f.main().frame, playing: f.main().playing }, r = renderer(f, page);
            assert.equal(r.handlers.sourceButtonInput(f.rt, f.button, f.point), 'allowed');
            const event = r.release();
            assert.deepEqual(event.up.sourceActionScripts, [control.handler]);
            assert.equal(r.calls.length, 1);
            assert.equal(r.calls[0].request.entryId, control.dictionaryEntryId);
            assert.equal(r.calls[0].sourcePlaying, false);
            assert.equal(r.context.glossaryHold.current.clip, f.main());
            assert.equal(r.context.glossaryHold.current.resumeSource, before.playing);
            assert.equal(f.rt.Global.get('KeyAttribute'), control.sourceKeyAttribute);
            assert.equal(f.main().playing, false);
            assert(f.stops.includes(f.main()));
            assert.deepEqual(f.rt.errors, []);
            assert.equal(r.handle({ type: 'close-glossary' }).status, 'allowed');
            assert.deepEqual(r.pauses.length > 0, true);
            assert.equal(r.focuses(), 0);
            r.frames[0]();
            assert.equal(r.focuses(), 1);
            assert.equal(f.main().playing, false);
            const held = r.context.glossaryHold.current;
            assert(resumeHfrGlossarySource(f.rt, held));
            assert.equal(f.main().playing, before.playing);
            if (control.ancestors?.length) {
                assert.equal(f.main().children.get(control.ancestors[0].depth).visible, true, 'closing glossary preserves authored help popup');
                assert.equal(f.main().playing, false, 'explicit Play cannot bypass authored question hold');
            }
            assert.equal(f.main().frame, before.frame);
        }
        finally {
            f.close();
        }
    } });
for (const page of dat.pages)
    test(page.meta.key + ': wrong data/action/placement/ancestor/current owner cannot grant source release', async () => { const control = page.binding.controls.find(c => c.ancestors.length), f = await fixture(page, control); try {
        const check = () => resolve(f.meta, f.rt, f.button, f.point, f.binding.dataSha256);
        assert(check());
        for (const [obj, key, bad] of [[f.button, 'depth', 999], [f.button, 'scriptMoved', true], [f.button, 'removed', true], [f.button.m, 'tx', f.button.m.tx + 1], [f.button.parentClip, 'charId', 999], [f.button.parentClip, 'scriptMoved', true], [f.button.parentClip.m, 'tx', f.button.parentClip.m.tx + 1], [f.main(), 'frame', f.main().frame + 1]]) {
            const old = obj[key];
            obj[key] = bad;
            assert.equal(check(), null, key);
            obj[key] = old;
        }
        assert.equal(resolve(f.meta, f.rt, f.button, f.point, '0'.repeat(64)), null);
        assert.equal(resolve(f.meta, f.rt, f.button, null, f.binding.dataSha256), null);
        assert.equal(resolve(f.meta, f.rt, f.button, [801, 1], f.binding.dataSha256), null);
        f.setTarget(null);
        assert.equal(check(), null);
        f.setTarget(f.button);
        const condition = f.button.def.conds[0], handler = condition.script;
        condition.script = 'foreign_release';
        assert.equal(check(), null);
        condition.script = handler;
        const r = renderer(f, page);
        r.context.current = false;
        r.release();
        assert.equal(r.calls.length, 0);
        assert.equal(f.rt.hostLog.filter(x => x[1] === 'shell.DoHyperLinks').length, 0);
        r.context.current = true;
        r.context.document.hidden = true;
        r.release();
        assert.equal(r.calls.length, 0);
        r.context.document.hidden = false;
        f.lesson.release(f.lease);
        r.release();
        assert.equal(r.calls.length, 0);
    }
    finally {
        f.close();
    } });
test('DAT metadata and descriptor projection preserve retained packets, require exact own source/data and exact bilingual definitions', () => { for (const page of dat.pages) {
    const original = structuredClone(page.meta), meta = withHfrCanvasGlossary(original);
    assert.equal(original.sourceGlossary, undefined);
    assert.deepEqual(meta.sourceGlossary, page.binding.sourceGlossary);
    const packet = { source: { sha256: page.binding.sourceSwfSha256 }, entry: { key: page.meta.key, artifacts: { data: { sha256: page.binding.dataSha256 } } }, meta: original }, before = JSON.stringify(packet), projection = hfrCanvasGlossaryProjection(packet);
    assert.deepEqual(projection.sourceGlossary, page.binding.sourceGlossary);
    assert.deepEqual(projection.descriptorEntries, page.descriptorEntries);
    assert.equal(JSON.stringify(packet), before);
    assert(page.descriptorEntries.every(e => e.definitions.en && e.definitions.es && e.source.en.sha256 && e.source.es.sha256));
    for (const change of [m => m.sourceSha256 = '0'.repeat(64), m => m.progressTimeline++, m => m.progressFrameCount--, m => m.stage.fps = 24, m => m.hasSpanishNarration = false, m => m.sourceGlossary = { ...page.binding.sourceGlossary, terms: [] }]) {
        const m = structuredClone(page.meta);
        change(m);
        assert.throws(() => withHfrCanvasGlossary(m), /HFR_CANVAS_GLOSSARY/);
    }
    packet.entry.artifacts.data.sha256 = '0'.repeat(64);
    assert.throws(() => hfrCanvasGlossaryProjection(packet), /exact data/);
} });
test('actual descriptor EN/ES Close returns exact trigger and keeps source paused; stale focus never touches successor', () => { for (const page of dat.pages)
    for (const locale of ['en', 'es'])
        for (const entry of page.descriptorEntries) {
            const h = descriptor(page, locale), request = { type: 'open-glossary', entryId: entry.id, sourceAnimationId: page.meta.key, playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume' };
            let focused = 0;
            const trigger = { isConnected: true, focus: () => focused++, closest: () => null };
            assert.equal(h.handle(request, { trigger }).status, 'allowed');
            assert.equal(h.handle({ type: 'close-glossary' }).status, 'allowed');
            assert.deepEqual(h.pauses, [true, true]);
            h.frames[0]();
            assert.equal(focused, 1);
            h.handle(request, { trigger });
            h.handle({ type: 'close-glossary' });
            h.context.activeGlossaryPageSession.current = 'successor';
            h.frames[1]();
            assert.equal(focused, 1);
        } });
test('actual complete server glossary projection composes DAT4 without changing a historical packet', async () => { const { hfrSourceGlossaryRequests } = await load('apps/web/lib/hfr-source-glossary-requests.ts'), { hfrGlossaryCaseAlias } = await load('apps/web/lib/hfr-glossary-case-alias.ts'), source = read('apps/web/lib/hfr-local-pages.server.ts'), ast = ts.createSourceFile('server.ts', source, ts.ScriptTarget.Latest, true), node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'hfrGlossaryProjection'); assert(node); const projection = new Function('assert', 'hfrCanvasGlossaryProjection', 'hfrSourceGlossaryRequests', 'hfrGlossaryCaseAlias', ts.transpileModule(node.getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText + ';return hfrGlossaryProjection;')(assert, hfrCanvasGlossaryProjection, hfrSourceGlossaryRequests, hfrGlossaryCaseAlias); let base = { glossary: [], support: { lessonHostCapabilities: [] } }; for (const page of dat.pages) {
    const pin = dat.inputs.find(p => p.path.startsWith('catalog/product-bridge-calibrations/') && p.path.includes(page.meta.key));
    assert(pin);
    const bytes = fs.readFileSync(file(pin.path));
    assert.equal(sha(bytes), pin.sha256);
    const packet = JSON.parse(bytes), before = JSON.stringify(packet), result = projection(base, packet);
    assert.equal(JSON.stringify(packet), before);
    assert(result.support.lessonHostCapabilities.includes('glossary'));
    for (const entry of page.descriptorEntries)
        assert.deepEqual(result.glossary.find(e => e.id === entry.id), entry);
    assert.deepEqual(hfrSourceGlossaryRequests(page.meta.key, page.meta.sourceSha256, { sourceGlossary: page.binding.sourceGlossary }).map(r => r.dictionaryEntryId).sort(), page.descriptorEntries.map(e => e.id).sort());
    const changed = structuredClone(page.binding.sourceGlossary);
    changed.terms[0].sourceActionSha256 = '0'.repeat(64);
    assert.throws(() => hfrSourceGlossaryRequests(page.meta.key, page.meta.sourceSha256, { sourceGlossary: changed }), /button releases/);
    base = { ...base, ...result };
} });
test('shared generator reproduces both reviewed binding outputs from stable current input pins', async () => { const { renderCanvasGlossaryBindings } = await import(pathToFileURL(file('scripts/generate-hfr-canvas-glossary-bindings.mjs'))); for (const [family, contract] of [['dat-l03', dat], ['nms-l07', nms]]) {
    for (const pin of contract.inputs) {
        const bytes = fs.readFileSync(file(pin.path));
        assert.equal(bytes.length, pin.bytes, pin.path);
        assert.equal(sha(bytes), pin.sha256, pin.path);
    }
    assert.equal(read(`packages/demos/src/hfr/${family}-canvas-glossary-source-binding.ts`), renderCanvasGlossaryBindings(contract));
} });
function replace(t, key, value) { const old = Object.getOwnPropertyDescriptor(globalThis, key); Object.defineProperty(globalThis, key, { value, configurable: true, writable: true }); t.after(() => { if (old)
    Object.defineProperty(globalThis, key, old);
else
    delete globalThis[key]; }); }
test('actual player preserves English/Spanish pause and explicit-resume lifecycle after DAT source glossary stop', async (t) => { const { Renderer } = await load('packages/demos/src/hfr/render.ts'), { AudioEngine } = await load('packages/demos/src/hfr/audio.ts'), { beginPageSession, disposeLessonSession } = await load('packages/demos/src/hfr/session.ts'); let resumes = 0, suspends = 0, plays = 0, pauses = 0; const players = [], scopes = []; t.after(() => { for (const p of players)
    p.destroy(); for (const s of scopes)
    disposeLessonSession(s); }); replace(t, 'document', { hidden: false, createElement: () => ({ getContext: () => ({}) }) }); replace(t, 'cancelAnimationFrame', () => { }); replace(t, 'requestAnimationFrame', () => 1); replace(t, 'AudioContext', class {
    state = 'suspended';
    destination = {};
    createGain() { return { gain: { value: 1 }, connect() { }, disconnect() { } }; }
    async suspend() { suspends++; this.state = 'suspended'; }
    async resume() { resumes++; this.state = 'running'; }
    async close() { this.state = 'closed'; }
}); replace(t, 'Audio', class {
    paused = true;
    volume = 1;
    constructor(src) { assert.equal(src, '/fixture/media/spanish.mp3'); this.src = src; }
    addEventListener() { }
    removeEventListener() { }
    async play() { plays++; this.paused = false; }
    pause() { pauses++; this.paused = true; }
}); const original = { preload: Renderer.prototype.preload, render: Renderer.prototype.render, audioPreload: AudioEngine.prototype.preload }; Renderer.prototype.preload = async () => { }; Renderer.prototype.render = () => { }; AudioEngine.prototype.preload = async () => { }; t.after(() => { Renderer.prototype.preload = original.preload; Renderer.prototype.render = original.render; AudioEngine.prototype.preload = original.audioPreload; }); for (const page of dat.pages)
    for (const spanish of [false, true]) {
        const binding = page.binding, pin = dat.inputs.find(p => p.sha256 === binding.dataSha256), data = JSON.parse(read(pin.path)), aot = dat.inputs.find(p => p.path.endsWith('/hfr-pages/' + page.meta.key + '.ts')), factory = (await import(pathToFileURL(file(aot.path)))).default, scope = { id: page.meta.key + ':' + spanish };
        scopes.push(scope);
        const session = beginPageSession({ hostScope: scope, lessonKey: page.meta.lessonKey, pageKey: page.meta.key, sourceSha256: page.meta.sourceSha256, compiler: page.meta.compiler, seed: 0 }, () => new LessonRuntime()), player = new HfrPlayer({ getContext: () => ({}), addEventListener: () => { }, removeEventListener: () => { }, width: 800, height: 600 });
        players.push(player);
        assert(await player.load(data, factory, '/fixture/', { audio: true, session, dataSha256: binding.dataSha256, progressTimeline: binding.characterId, seed: 0 }));
        const rt = player.rt, main = () => rt.page_.children.get(binding.depth);
        while (!(main() instanceof MovieClip) || main().frame < 40)
            rt.tick();
        player.setSpanish(spanish);
        player.start();
        await Promise.resolve();
        assert(player.running);
        assert.equal(player.audio.ctx.state, 'running');
        if (spanish) {
            assert.equal(player.spanish.paused, false);
            assert.equal(player.audio.muted, true);
        }
        const control = binding.controls.find(c => !c.ancestors.length && c.firstFrame === 1), button = main().children.get(control.depth), meta = withHfrCanvasGlossary(page.meta), r = control.hitRecord, m = mul(button.worldMatrix(), { a: r.m[0], b: r.m[1], c: r.m[2], d: r.m[3], tx: r.m[4], ty: r.m[5] }), point = apply(m, (control.hitBounds.xmin + control.hitBounds.xmax) / 2, (control.hitBounds.ymin + control.hitBounds.ymax) / 2).map(v => v / 20);
        rt.hitTestFn = o => o === button;
        player.opts.sourceButtonInput = (runtime, b, at) => resolve(meta, runtime, b, at, binding.dataSha256) ? 'allowed' : 'blocked';
        const held = { runtime: rt, clip: main(), frame: main().frame, resumeSource: main().playing }, before = { resumes, suspends, plays, pauses };
        let sourceStops = 0;
        const stop = player.audio.streamStop.bind(player.audio);
        player.audio.streamStop = c => { if (c === main())
            sourceStops++; stop(c); };
        assert(player.runSourceButtonRelease(rt, button, point, () => rt.click(button)));
        assert.equal(main().playing, false);
        assert(sourceStops > 0);
        player.pause();
        await Promise.resolve();
        assert.equal(player.audio.ctx.state, 'suspended');
        assert(suspends > before.suspends);
        if (spanish) {
            assert.equal(player.spanish.paused, true);
            assert(pauses > before.pauses);
        }
        assert.equal(player.running, false);
        const stoppedAt = rt.tickCount;
        assert(resumeHfrGlossarySource(rt, held));
        player.start();
        await Promise.resolve();
        assert(player.running);
        assert.equal(player.audio.ctx.state, 'running');
        assert(resumes > before.resumes);
        if (spanish) {
            assert.equal(player.spanish.paused, false);
            assert(plays > before.plays);
        }
        assert.equal(rt.tickCount, stoppedAt);
        rt.tick();
        assert.equal(main().frame, 41);
        player.pause();
    } });
test('exact DAT source loop ends resume on explicit Play; an authored question hold and terminal action stay held', async () => { for (const page of dat.pages) {
    const control = page.binding.controls.find(c => !c.ancestors.length && c.firstFrame === 1), f = await fixture(page, control, page.binding.frames);
    try {
        assert.equal(f.main().frame, page.binding.frames);
        assert.equal(f.main().playing, true);
        const r = renderer(f, page);
        r.release();
        assert.equal(r.calls.length, 1);
        const hold = r.context.glossaryHold.current;
        assert.equal(hold.resumeSource, true);
        assert.equal(f.main().playing, false);
        const last = f.main().def.frames.at(-1);
        last.push({ op: 'action', script: 'unexpected_terminal_action' });
        assert(resumeHfrGlossarySource(f.rt, hold));
        assert.equal(f.main().playing, false);
        last.pop();
        assert(resumeHfrGlossarySource(f.rt, hold));
        assert.equal(f.main().playing, true);
        f.rt.tick();
        assert.equal(f.main().frame, 1);
        assert.deepEqual(f.rt.errors, []);
    }
    finally {
        f.close();
    }
} });
