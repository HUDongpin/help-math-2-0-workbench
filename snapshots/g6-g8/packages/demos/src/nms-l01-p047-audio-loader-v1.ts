import type {P047AudioAsset} from './nms-l01-p047-audio-v1';
import {P047_SOURCE} from './nms-l01-p047-source-data-v1';

export function p047AudioSource(asset: P047AudioAsset) {
  if (!P047_SOURCE.audio.some(source => source === asset)) throw Error('P047_AUDIO_IDENTITY');
  return `/flash-assets/g678-local/shared-nms002-l01-p047/quiz-audio/${asset.id}?sha256=${asset.sha256}`;
}
export async function readP047AudioAsset(asset: P047AudioAsset, signal: AbortSignal): Promise<ArrayBuffer> {
  const response = await fetch(p047AudioSource(asset), {signal, redirect: 'error', credentials: 'same-origin', cache: 'no-store'});
  if (!response.ok || !response.headers.get('content-type')?.startsWith('audio/mpeg')) throw Error('P047_AUDIO_RESPONSE');
  const declared = response.headers.get('content-length');
  if (declared !== null && Number(declared) !== asset.bytes) throw Error('P047_AUDIO_BYTES');
  const reader = response.body?.getReader(); if (!reader) throw Error('P047_AUDIO_BODY');
  const chunks: Uint8Array[] = []; let total = 0;
  try {
    while (true) {
      const {done, value} = await reader.read(); if (done) break;
      total += value.byteLength;
      if (total > asset.bytes) { await reader.cancel(); throw Error('P047_AUDIO_BYTES'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  if (total !== asset.bytes) throw Error('P047_AUDIO_BYTES');
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes.buffer;
}
