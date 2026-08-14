import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {describe, it} from 'node:test';
import {NOVA_REQUEST_LIMITS} from '../lib/nova-request-schema';
import {
  NOVA_CLIENT_LIMITS,
  boundedNovaHistory,
  novaFrameDataUrlByteLength,
  novaFrameFitsRequest,
} from '../lib/nova-client';

describe('Nova client request boundaries', () => {
  it('stays locked to the server history and frame limits', () => {
    assert.deepEqual(NOVA_CLIENT_LIMITS, {
      historyMessages: NOVA_REQUEST_LIMITS.historyMessages,
      historyMessageCharacters: NOVA_REQUEST_LIMITS.historyMessageCharacters,
      historyTotalCharacters: NOVA_REQUEST_LIMITS.historyTotalCharacters,
      frameBytes: NOVA_REQUEST_LIMITS.frameBytes,
      frameDataUrlCharacters: NOVA_REQUEST_LIMITS.frameDataUrlCharacters,
    });
  });

  it('keeps only newest history under every count and character limit', () => {
    const history = boundedNovaHistory(Array.from({length: 12}, (_, index) => ({
      role: index % 2 === 0 ? 'user' as const : 'assistant' as const,
      text: `${index}:`.padEnd(1_002, String(index % 10)),
    })));
    assert.ok(history.length <= 8);
    assert.ok(history.every((entry) => entry.text.length <= 800));
    assert.ok(history.reduce((sum, entry) => sum + entry.text.length, 0) <= 4_800);
    assert.match(history.at(-1)?.text ?? '', /^11:/);
    assert.doesNotMatch(history.map((entry) => entry.text).join('|'), /^0:/);
  });

  it('drops blank history and correctly bounds base64 frame bytes', () => {
    assert.deepEqual(boundedNovaHistory([
      {role: 'user', text: '   '},
      {role: 'assistant', text: ' useful reply '},
    ]), [{role: 'assistant', text: 'useful reply'}]);

    const onePixelPng =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    assert.equal(novaFrameDataUrlByteLength(onePixelPng), 68);
    assert.equal(novaFrameFitsRequest(onePixelPng), true);
    assert.equal(novaFrameFitsRequest('data:image/svg+xml;base64,PHN2Zz4='), false);
    assert.equal(novaFrameFitsRequest(
      `data:image/jpeg;base64,${'A'.repeat(24_580)}`,
    ), false);
  });

  it('wires both visible tutor surfaces without any device-camera API', async () => {
    const source = await readFile(
      new URL('../components/lesson-nova-tutor.tsx', import.meta.url),
      'utf8',
    );
    assert.match(source, /fetch\('\/api\/nova'/);
    assert.match(source, /window\.SpeechRecognition/);
    assert.match(source, /prepareNovaFrame/);
    assert.match(source, /mode: 'classroom'/);
    assert.match(source, /onClick=\{\(\) => void sendQuestion\(choice\.prompt\)\}/);
    assert.match(source, /Help me understand \$\{word\}/);
    assert.match(source, /Nova is instructed to offer hints and guiding questions/);
    assert.doesNotMatch(source, /getUserMedia|mediaDevices|capture="user"|type="file"/);
  });
});
