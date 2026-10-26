import assert from 'node:assert/strict';
import type {HfrPageMeta} from '../../../packages/demos/src/hfr/types';
import {hfrCanvasGlossaryBinding, hfrCanvasGlossaryEntries} from '../../../packages/demos/src/hfr/source-canvas-glossary';

/** Called after exact packet admission and source occurrence verification.
 * This is a current shared-host addition; the historical packet stays untouched. */
export function hfrCanvasGlossaryProjection(packet: Readonly<{
  source:Readonly<{sha256:string}>;
  entry:Readonly<{key:string;artifacts:Readonly<{data:Readonly<{sha256:string}>}>}>;
  meta:Readonly<Partial<HfrPageMeta>>;
}>) {
  const descriptorEntries = hfrCanvasGlossaryEntries(packet.entry.key);
  if (!descriptorEntries) return undefined;
  assert.equal(packet.meta.key,packet.entry.key,'Canvas glossary packet identity');
  const binding=hfrCanvasGlossaryBinding(packet.meta);
  assert(binding,'Canvas glossary binding');
  assert.equal(packet.source.sha256,binding.sourceSwfSha256,'Canvas glossary original source');
  assert.equal(packet.entry.artifacts.data.sha256,binding.dataSha256,'Canvas glossary exact data');
  return {sourceGlossary:binding.sourceGlossary,descriptorEntries};
}
