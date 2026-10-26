import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {GeoL06P002SourceAudioTransport} from
  '../src/geo-l06-p002-source-audio-transport-v1';

const mp3 = readFileSync(new URL('../../../migrations/shared-geo001-l06-p002/audit/' +
  'sprite-230-source-stream-v1.mp3', import.meta.url));

test('intact source MP3 schedules three native-rate runs and stops on seek or close', async () => {
  const originalFetch = globalThis.fetch;
  const originalAudioContext = globalThis.AudioContext;
  const starts: Array<[number, number, number]> = [];
  const sources: Array<{stopped: boolean}> = [];
  const destination = {};
  const gain = {gain: {value: 1}, connect(target: unknown) {
    assert.equal(target, destination);
  }};
  let fetches = 0;
  let closes = 0;
  class FakeAudioContext {
    readonly sampleRate = 22050;
    readonly currentTime = 10;
    readonly destination = destination;
    createGain() { return gain; }
    async resume() {}
    async decodeAudioData(bytes: ArrayBuffer) {
      assert.equal(bytes.byteLength, 496600);
      return {numberOfChannels: 1, sampleRate: 22050, length: 2200320};
    }
    createBufferSource() {
      const source = {stopped: false, buffer: null, onended: null,
        connect(destination: unknown) { assert.equal(destination, gain); },
        start(when: number, offset: number, duration: number) {
          starts.push([when, offset, duration]);
        },
        stop() { source.stopped = true; }};
      sources.push(source);
      return source;
    }
    async close() { closes += 1; }
  }
  Object.defineProperty(globalThis, 'AudioContext', {configurable: true, writable: true,
    value: FakeAudioContext});
  globalThis.fetch = async (input) => {
    assert.match(String(input), /source-stream\.mp3\?sha256=2109aaa8/);
    fetches += 1;
    return new Response(mp3, {status: 200});
  };
  try {
    const transport = new GeoL06P002SourceAudioTransport();
    transport.setVolume(0.4);
    assert.throws(() => transport.setVolume(1.1), /VOLUME_INVALID/);
    assert.equal(await transport.startAt(1), true);
    assert.equal(gain.gain.value, 0.4);
    transport.setVolume(0);
    assert.equal(gain.gain.value, 0);
    assert.equal(fetches, 1);
    assert.equal(starts.length, 3);
    assert.equal(starts[0]![0], 10 + 7 / 12);
    assert.equal(starts[1]![0], 10 + 422 / 12);
    assert.equal(starts[2]![0], 10 + 468 / 12);
    assert.equal(starts[0]![1], 1673 / 22050);
    assert.equal(starts[1]![1], 753084 / 22050);
    assert.equal(starts[2]![1], 826642 / 22050);
    transport.stop();
    assert(sources.slice(0, 3).every(source => source.stopped));

    assert.equal(await transport.startAt(423), true);
    assert.equal(fetches, 1, 'verified decoded stream is cached in this candidate instance');
    assert.equal(starts.length, 5);
    assert.equal(starts[3]![0], 10);
    assert.equal(starts[4]![0], 10 + 46 / 12);
    transport.close();
    assert(sources.every(source => source.stopped));
    assert.equal(closes, 1);
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, 'AudioContext', {configurable: true, writable: true,
      value: originalAudioContext});
  }
});

test('pause during source fetch cannot schedule decoded playback later', async () => {
  const originalFetch = globalThis.fetch;
  const originalAudioContext = globalThis.AudioContext;
  let resolveFetch: ((response: Response) => void) | undefined;
  let starts = 0;
  class FakeAudioContext {
    readonly sampleRate = 22050;
    readonly currentTime = 0;
    readonly destination = {};
    createGain() { return {gain: {value: 1}, connect() {}}; }
    async resume() {}
    async decodeAudioData() {
      return {numberOfChannels: 1, sampleRate: 22050, length: 2200320};
    }
    createBufferSource() { starts += 1; throw Error('UNEXPECTED_SOURCE'); }
    async close() {}
  }
  Object.defineProperty(globalThis, 'AudioContext', {configurable: true, writable: true,
    value: FakeAudioContext});
  globalThis.fetch = async () => new Promise<Response>(resolve => { resolveFetch = resolve; });
  try {
    const transport = new GeoL06P002SourceAudioTransport();
    const pending = transport.startAt(1);
    await new Promise(resolve => setImmediate(resolve));
    assert(resolveFetch, 'fetch has started');
    transport.stop();
    resolveFetch(new Response(mp3));
    assert.equal(await pending, false);
    assert.equal(starts, 0);
    transport.close();
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, 'AudioContext', {configurable: true, writable: true,
      value: originalAudioContext});
  }
});
