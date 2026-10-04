import assert from 'node:assert/strict';
import {test, type TestContext} from 'node:test';

import {loadCanvasAsset} from '../../../packages/demos/src/source-static-canvas-candidate';
import {loadLoadedSwfHostCanvasAsset} from '../components/loaded-swf-host-canvas';

const digest = 'a'.repeat(64);
const integrity = `sha256-${Buffer.from(digest, 'hex').toString('base64')}`;
const source = '/flash-assets/courses/test/canvas-renderer.js';

function browserFixture(t: TestContext) {
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const registry: Record<string, {ready: () => Promise<void>}> = {};
  const scripts: Script[] = [];
  let appendCount = 0;
  class Script extends EventTarget {
    dataset: Record<string, string> = {};
    integrity = '';
    crossOrigin: string | null = null;
    async = false;
    private absoluteSource = '';
    set src(value: string) { this.absoluteSource = new URL(value, 'https://helpmath.test/').href; }
    get src() { return this.absoluteSource; }
    remove() {
      const index = scripts.indexOf(this);
      if (index >= 0) scripts.splice(index, 1);
    }
  }
  const document = {
    baseURI: 'https://helpmath.test/',
    querySelector: () => scripts[0] ?? null,
    createElement: (tag: string) => {
      assert.equal(tag, 'script');
      return new Script();
    },
    head: {appendChild: (script: Script) => { scripts.push(script); appendCount += 1; }},
  };
  Object.defineProperty(globalThis, 'document', {configurable: true, value: document});
  Object.defineProperty(globalThis, 'window', {configurable: true, value: {HELP_MATH_CANVAS_ASSETS: registry}});
  t.after(() => {
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
    else Reflect.deleteProperty(globalThis, 'document');
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  });
  return {registry, scripts, document, appendCount: () => appendCount};
}

const loaders = [
  {name: 'source-static', load: (animationId: string) => loadCanvasAsset({animationId, assetSource: source, assetSha256: digest})},
  {name: 'loaded-SWF', load: (registryKey: string) => loadLoadedSwfHostCanvasAsset({
    registryKey, assetSource: source, assetSha256: digest, sourceProvenLanguage: 'en',
    backgroundDisposition: 'ignore-loaded-child-swf-standalone-stage-background',
  })},
];

for (const [index, loader] of loaders.entries()) {
  const key = (scenario: string) => `course-loader-${index}-${scenario}`;

  test(`${loader.name}: network failure removes the script and permits an intact-SRI retry`, async (t) => {
    const fixture = browserFixture(t);
    const id = key('network');
    const first = loader.load(id);
    const rejected = assert.rejects(first, /could not load/);
    fixture.scripts[0].dispatchEvent(new Event('error'));
    await rejected;
    assert.equal(fixture.scripts.length, 0);

    const retry = loader.load(id);
    const script = fixture.scripts[0];
    assert.equal(fixture.appendCount(), 2);
    assert.equal(script.src, `https://helpmath.test${source}?sha256=${digest}`);
    assert.equal(script.integrity, integrity);
    assert.equal(script.crossOrigin, 'anonymous');
    const asset = {ready: async () => {}};
    fixture.registry[id] = asset;
    script.dispatchEvent(new Event('load'));
    assert.equal(await retry, asset);
    assert.equal(await loader.load(id), asset);
    assert.equal(fixture.appendCount(), 2);
  });

  test(`${loader.name}: concurrent callers wait for one preparation without another script`, async (t) => {
    const fixture = browserFixture(t);
    const id = key('concurrent');
    const first = loader.load(id);
    assert.equal(loader.load(id), first);
    let finishReady!: () => void;
    let readyCalls = 0;
    const asset = {ready: () => { readyCalls += 1; return new Promise<void>((resolve) => { finishReady = resolve; }); }};
    fixture.registry[id] = asset;
    fixture.scripts[0].dispatchEvent(new Event('load'));
    await Promise.resolve();
    assert.equal(loader.load(id), first);
    assert.equal(readyCalls, 1);
    finishReady();
    assert.equal(await first, asset);
    assert.equal(fixture.appendCount(), 1);
  });

  test(`${loader.name}: image readiness failure clears its registration and retries`, async (t) => {
    const fixture = browserFixture(t);
    const id = key('decode');
    const first = loader.load(id);
    const rejected = assert.rejects(first, /image decode failed/);
    fixture.registry[id] = {ready: async () => { throw new Error('image decode failed'); }};
    fixture.scripts[0].dispatchEvent(new Event('load'));
    await rejected;
    assert.equal(fixture.scripts.length, 0);
    assert.equal(fixture.registry[id], undefined);
    const retry = loader.load(id);
    const asset = {ready: async () => {}};
    fixture.registry[id] = asset;
    fixture.scripts[0].dispatchEvent(new Event('load'));
    assert.equal(await retry, asset);
  });

  for (const stage of ['script', 'images']) {
    test(`${loader.name}: stalled ${stage} preparation has a bounded timeout and can retry`, async (t) => {
      t.mock.timers.enable({apis: ['setTimeout']});
      const fixture = browserFixture(t);
      const id = key(`timeout-${stage}`);
      const first = loader.load(id);
      const rejected = assert.rejects(first, /timed out/);
      const oldScript = fixture.scripts[0];
      if (stage === 'images') {
        fixture.registry[id] = {ready: () => new Promise<void>(() => {})};
        oldScript.dispatchEvent(new Event('load'));
        await Promise.resolve();
      }
      t.mock.timers.tick(60_000);
      await rejected;
      assert.equal(fixture.scripts.length, 0);
      assert.equal(fixture.registry[id], undefined);
      const retry = loader.load(id);
      const asset = {ready: async () => {}};
      fixture.registry[id] = asset;
      oldScript.dispatchEvent(new Event('error'));
      fixture.scripts[0].dispatchEvent(new Event('load'));
      assert.equal(await retry, asset);
      assert.equal(fixture.appendCount(), 2);
    });
  }

  test(`${loader.name}: a mismatched existing script still fails closed`, async (t) => {
    const fixture = browserFixture(t);
    const script = fixture.document.createElement('script');
    script.src = source;
    script.integrity = 'sha256-wrong';
    fixture.document.head.appendChild(script);
    await assert.rejects(async () => loader.load(key('mismatch')), /mismatched integrity/);
    assert.equal(fixture.appendCount(), 1);
    assert.equal(fixture.scripts[0], script);
  });
}
