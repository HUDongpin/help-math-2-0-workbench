import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { P043_AUDIO_PLANS } from '../src/generated/nms-l02-p043-audio-plan-v1';
import { p043PrepareSourcePcm, type P043AudioDomain } from '../src/nms-l02-p043-audio-pcm-v1';
const audit = new URL('../../../migrations/shared-nms002-l02-p043/audit/', import.meta.url);
const inventory = JSON.parse(readFileSync(new URL('source-pcm-inventory-v1.json', audit), 'utf8'));
for (const domain of Object.keys(P043_AUDIO_PLANS) as P043AudioDomain[]) {
  test(`domain${domain} retains full audible source samples and zero gaps`, () => {
    const raw = readFileSync(new URL(`sprite-${domain}-whole-pcm-v1.f32le`, audit));
    const pin = inventory.streams.find((s: {domain: string}) => s.domain === `sprite-${domain}`).pcm;
    assert.equal(createHash('sha256').update(raw).digest('hex'), pin.sha256);
    const samples = new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
    const result = p043PrepareSourcePcm(domain, samples), plan = P043_AUDIO_PLANS[domain];
    let cursor = 0;
    for (const segment of plan.segments) {
      assert.ok(result.subarray(cursor, segment.outputStart).every(x => x === 0));
      const stop = Math.min(result.length, segment.outputEnd);
      assert.deepEqual(result.subarray(segment.outputStart, stop), samples.subarray(segment.sourceStart, segment.sourceStart + stop - segment.outputStart));
      cursor = stop;
    }
    assert.ok(result.subarray(cursor).every(x => x === 0));
    assert.throws(() => p043PrepareSourcePcm(domain, samples.subarray(1)), /IDENTITY/);
    const invalid = samples.slice(); invalid[5000] = NaN;
    assert.throws(() => p043PrepareSourcePcm(domain, invalid), /NONFINITE/);
    if (domain === '250') {
      const changed = samples.slice(); changed[changed.length - 1] = .01;
      assert.throws(() => p043PrepareSourcePcm(domain, changed), /NONZERO_TAIL/);
    }
  });
}
