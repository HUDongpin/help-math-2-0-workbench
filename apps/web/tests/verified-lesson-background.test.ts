import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {getEventListeners} from 'node:events';
import {setImmediate} from 'node:timers/promises';
import test from 'node:test';
import {LessonBackgroundError, loadVerifiedLessonBackground} from '../lib/verified-lesson-background';

const source = '/lesson-assets/source-composite.svg';
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 960 540"><text>Fracción</text></svg>';
const expected = createHash('sha256').update(svg).digest('hex');
const isError = (kind: 'load' | 'integrity') => (error: unknown) =>
  error instanceof LessonBackgroundError && error.kind === kind;

test('returns only verified original bytes as SVG, independent of intrinsic image dimensions', async (t) => {
  const controller = new AbortController();
  let requestSignal: AbortSignal | undefined;
  t.mock.timers.enable({apis: ['setTimeout']});
  const fetch = t.mock.method(globalThis, 'fetch', async (url: RequestInfo | URL, options?: RequestInit) => {
    assert.equal(url, source);
    assert.equal(options?.credentials, 'same-origin');
    assert.equal(options?.redirect, 'error');
    assert.equal(options?.cache, 'default');
    requestSignal = options?.signal as AbortSignal;
    return new Response(svg);
  });

  const blob = await loadVerifiedLessonBackground(source, expected, controller.signal);
  assert.equal(blob.type, 'image/svg+xml');
  assert.deepEqual(Buffer.from(await blob.arrayBuffer()), Buffer.from(svg));
  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
  t.mock.timers.tick(30_000);
  assert.equal(requestSignal?.aborted, false, 'successful request timeout was cleared');
});

test('rejects same-length tampering without retrying or returning a Blob', async (t) => {
  const tampered = svg.replace('960', '961');
  assert.equal(Buffer.byteLength(tampered), Buffer.byteLength(svg));
  const controller = new AbortController();
  const fetch = t.mock.method(globalThis, 'fetch', async () => new Response(tampered));

  await assert.rejects(loadVerifiedLessonBackground(source, expected, controller.signal), isError('integrity'));
  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
});

test('rejects missing or malformed expected digests before requesting an asset', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => new Response(svg));
  for (const digest of ['', 'f'.repeat(63), 'g'.repeat(64), expected.toUpperCase()]) {
    await assert.rejects(
      loadVerifiedLessonBackground(source, digest, new AbortController().signal),
      isError('integrity'),
    );
  }
  assert.equal(fetch.mock.callCount(), 0);
});

for (const failure of ['http', 'network', 'body'] as const) {
  test(`retries one transient ${failure} failure using the same URL and fresh cache`, async (t) => {
    const controller = new AbortController();
    let attempts = 0;
    const fetch = t.mock.method(globalThis, 'fetch', async (url: RequestInfo | URL, options?: RequestInit) => {
      assert.equal(url, source);
      assert.equal(options?.cache, attempts === 0 ? 'default' : 'reload');
      assert.equal(options?.credentials, 'same-origin');
      assert.equal(options?.redirect, 'error');
      attempts += 1;
      if (attempts === 1) {
        if (failure === 'http') return new Response('Unavailable', {status: 503});
        if (failure === 'network') throw new TypeError('Network request failed');
        return new Response(new ReadableStream({
          start(stream) { stream.error(new TypeError('Incomplete body')); },
        }));
      }
      return new Response(svg);
    });

    const blob = await loadVerifiedLessonBackground(source, expected, controller.signal);
    assert.equal(await blob.text(), svg);
    assert.equal(fetch.mock.callCount(), 2);
    assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
  });
}

test('still checks integrity after a transient failure', async (t) => {
  let attempts = 0;
  const fetch = t.mock.method(globalThis, 'fetch', async () => {
    attempts += 1;
    return attempts === 1 ? new Response('', {status: 503}) : new Response(svg.replace('960', '961'));
  });
  await assert.rejects(
    loadVerifiedLessonBackground(source, expected, new AbortController().signal),
    isError('integrity'),
  );
  assert.equal(fetch.mock.callCount(), 2);
});

test('stops persistent transport failures after two attempts and removes the abort listener', async (t) => {
  const controller = new AbortController();
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Offline'); });
  await assert.rejects(loadVerifiedLessonBackground(source, expected, controller.signal), isError('load'));
  assert.equal(fetch.mock.callCount(), 2);
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
});

test('an already cancelled load makes no request', async (t) => {
  const controller = new AbortController();
  controller.abort();
  const fetch = t.mock.method(globalThis, 'fetch', async () => new Response(svg));
  await assert.rejects(loadVerifiedLessonBackground(source, expected, controller.signal), {name: 'AbortError'});
  assert.equal(fetch.mock.callCount(), 0);
});

test('cancellation aborts an active request without retrying', async (t) => {
  const controller = new AbortController();
  let requestSignal: AbortSignal | undefined;
  const fetch = t.mock.method(globalThis, 'fetch', (_url: RequestInfo | URL, options?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    requestSignal = options?.signal as AbortSignal;
    requestSignal.addEventListener('abort', () => reject(requestSignal?.reason), {once: true});
  }));
  const load = loadVerifiedLessonBackground(source, expected, controller.signal);
  controller.abort();
  await assert.rejects(load, {name: 'AbortError'});
  assert.equal(requestSignal?.aborted, true);
  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
});

test('cancellation while hashing cannot return a stale background', async (t) => {
  const controller = new AbortController();
  const digest = crypto.subtle.digest.bind(crypto.subtle);
  t.mock.method(crypto.subtle, 'digest', async (algorithm: AlgorithmIdentifier, bytes: BufferSource) => {
    const result = await digest(algorithm, bytes);
    controller.abort();
    return result;
  });
  const fetch = t.mock.method(globalThis, 'fetch', async () => new Response(svg));
  await assert.rejects(loadVerifiedLessonBackground(source, expected, controller.signal), {name: 'AbortError'});
  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
});

test('each stalled request times out at 15 seconds and only one retry is made', async (t) => {
  t.mock.timers.enable({apis: ['setTimeout']});
  const controller = new AbortController();
  const requestSignals: AbortSignal[] = [];
  const fetch = t.mock.method(globalThis, 'fetch', (_url: RequestInfo | URL, options?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    const signal = options?.signal as AbortSignal;
    requestSignals.push(signal);
    signal.addEventListener('abort', () => reject(signal.reason), {once: true});
  }));
  const result = assert.rejects(loadVerifiedLessonBackground(source, expected, controller.signal), isError('load'));
  t.mock.timers.tick(14_999);
  assert.equal(requestSignals[0].aborted, false);
  t.mock.timers.tick(1);
  await setImmediate();
  assert.equal(requestSignals[0].aborted, true);
  assert.equal(fetch.mock.callCount(), 2);
  t.mock.timers.tick(14_999);
  assert.equal(requestSignals[1].aborted, false);
  t.mock.timers.tick(1);
  await result;
  assert.equal(requestSignals[1].aborted, true);
  assert.equal(fetch.mock.callCount(), 2);
  assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
});
