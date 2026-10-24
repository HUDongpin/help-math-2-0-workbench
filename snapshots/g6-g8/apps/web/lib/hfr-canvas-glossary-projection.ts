import assert from 'node:assert/strict';
import type {HfrPageMeta} from '../../../packages/demos/src/hfr/types';
import {hfrCanvasGlossaryBinding} from '../../../packages/demos/src/hfr/source-canvas-glossary';
import {NMS_L07_CANVAS_GLOSSARY_ENTRIES} from '../../../packages/demos/src/hfr/nms-l07-canvas-glossary-source-binding';

/** Called after exact packet admission and source occurrence verification.
 * This is a current shared-host addition; the historical packet stays untouched. */
export function hfrCanvasGlossaryProjection(packet: Readonly<{
  source:Readonly<{sha256:string}>;
  entry:Readonly<{key:string;artifacts:Readonly<{data:Readonly<{sha256:string}>}>}>;
  meta:Readonly<Partial<HfrPageMeta>>;
}>) {
  if (!Object.hasOwn(NMS_L07_CANVAS_GLOSSARY_ENTRIES,packet.entry.key)) return undefined;
  assert.equal(packet.meta.key,packet.entry.key,'Canvas glossary packet identity');
  const binding=hfrCanvasGlossaryBinding(packet.meta);
  assert(binding,'Canvas glossary binding');
  assert.equal(packet.source.sha256,binding.sourceSwfSha256,'Canvas glossary original source');
  assert.equal(packet.entry.artifacts.data.sha256,binding.dataSha256,'Canvas glossary exact data');
  const descriptorEntries=NMS_L07_CANVAS_GLOSSARY_ENTRIES[packet.entry.key as keyof typeof NMS_L07_CANVAS_GLOSSARY_ENTRIES];
  return {sourceGlossary:binding.sourceGlossary,descriptorEntries};
}
