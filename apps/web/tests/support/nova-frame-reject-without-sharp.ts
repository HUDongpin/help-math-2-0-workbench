import assert from 'node:assert/strict';

import {
  NovaFrameNormalizationError,
  normalizeNovaTutorFrame,
} from '../../lib/nova-frame-normalization.server';
import {
  AVIF_FTYP_BYTES,
  GARBAGE_BYTES,
  frameDataUrl,
  novaFrame,
} from './nova-frame-bytes';

interface HookedSharpModule {
  readonly __novaBlockedOperations: () => readonly string[];
  readonly __novaDecodeCalls: () => number;
}

const untrustedFrames = [
  {
    label: 'AVIF bytes declared as image/png',
    dataUrl: frameDataUrl('image/png', AVIF_FTYP_BYTES),
  },
  {
    label: 'garbage bytes declared as image/png',
    dataUrl: frameDataUrl('image/png', GARBAGE_BYTES),
  },
] as const;

const hookedSharp = await import('sharp') as unknown as HookedSharpModule;
assert.equal(typeof hookedSharp.__novaDecodeCalls, 'function');
assert.equal(typeof hookedSharp.__novaBlockedOperations, 'function');

for (const untrustedFrame of untrustedFrames) {
  await assert.rejects(
    () => normalizeNovaTutorFrame(novaFrame(untrustedFrame.dataUrl)),
    (error: unknown) => {
      assert.ok(
        error instanceof NovaFrameNormalizationError,
        `${untrustedFrame.label} should raise NovaFrameNormalizationError`,
      );
      assert.equal(error.message, 'Nova Tutor frame is invalid');
      return true;
    },
  );
}

assert.deepEqual(hookedSharp.__novaBlockedOperations(), ['VipsForeignLoadHeif']);
assert.equal(
  hookedSharp.__novaDecodeCalls(),
  0,
  'untrusted frames must be rejected before sharp decodes them',
);
