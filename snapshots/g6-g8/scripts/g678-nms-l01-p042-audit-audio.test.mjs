import assert from 'node:assert/strict';
import test from 'node:test';
import {validateProbe} from './g678-nms-l01-p042-audit-audio.mjs';
const valid = () => ({streams: [{codec_name: 'mp3', codec_type: 'audio', nb_read_frames: '4', sample_rate: '22050', channels: 1}], format: {}});
test('audio probe validates a complete nonempty MP3 stream without inventing unreported duration', () => {
  assert.deepEqual(validateProbe(valid()), {codec: 'mp3', sampleRate: 22050, channels: 1, decodedPacketFrameCount: 4, durationReported: null});
});
test('audio probe rejects empty, wrong codec, missing frames and zero channels', () => {
  assert.throws(() => validateProbe({streams: [], format: {}}));
  for (const override of [{codec_name:'aac'}, {codec_type:'video'}, {nb_read_frames:'0'}, {channels:0}, {sample_rate:'N/A'}]) {
    const probe = valid(); Object.assign(probe.streams[0], override); assert.throws(() => validateProbe(probe));
  }
});
