import assert from 'node:assert/strict';
import {P009_NATIVE} from '../../../packages/demos/src/hfr/nms-l11-p009-native-binding';
import {P010_NATIVE} from '../../../packages/demos/src/hfr/nms-l11-p010-native-binding';
import {P014_META} from '../../../packages/demos/src/hfr/nms-l11-p014-meta';
import {NMS_L07_CANVAS_GLOSSARY_SOURCE_BINDINGS} from '../../../packages/demos/src/hfr/nms-l07-canvas-glossary-source-binding';
import {DAT_L03_CANVAS_GLOSSARY_SOURCE_BINDINGS} from '../../../packages/demos/src/hfr/dat-l03-canvas-glossary-source-binding';
import type {HfrOwnGlossarySource} from './hfr-p009-source-html-glossary';

type SourceRequest = Readonly<{dictionaryEntryId: string; sourceKeyAttribute?: string}>;
/** Pages whose packet glossary must equal their own reviewed source binding exactly. */
const HFR_REVIEWED_OWN_GLOSSARIES: readonly Readonly<{animationId: string; sourceSha256: string; sourceGlossary: unknown; sourceHtmlLinks?: unknown}>[] = [
  P009_NATIVE, P010_NATIVE, {animationId: P014_META.key, sourceSha256: P014_META.sourceSha256, sourceGlossary: P014_META.sourceGlossary},
  ...Object.values({...NMS_L07_CANVAS_GLOSSARY_SOURCE_BINDINGS, ...DAT_L03_CANVAS_GLOSSARY_SOURCE_BINDINGS}).map(binding => ({animationId: binding.animationId,
    sourceSha256: binding.sourceSwfSha256, sourceGlossary: binding.sourceGlossary})),
];

/** Packet byte integrity is verified by the existing reader first. A page's source
 * glossary requests are its button releases plus its separately identified source
 * HTML function links, one per dictionary entry; requests for the same entry (two
 * buttons, or a button and an HTML call) must carry the same source key. HTML links
 * have no button identity, so they are accepted only on a page whose packet glossary
 * equals its own reviewed source binding exactly. */
export function hfrSourceGlossaryRequests(pageKey: string, sourceSha256: string, addition: HfrOwnGlossarySource): readonly SourceRequest[] {
  const reviewed = HFR_REVIEWED_OWN_GLOSSARIES.find(own => own.animationId === pageKey);
  if (reviewed) {
    assert.equal(sourceSha256, reviewed.sourceSha256, 'HFR reviewed glossary source identity');
    assert.deepEqual(addition.sourceGlossary, reviewed.sourceGlossary, 'HFR reviewed exact source button releases');
    assert.deepEqual(addition.sourceHtmlLinks, reviewed.sourceHtmlLinks, 'HFR reviewed exact source HTML function links');
  } else {
    assert.equal(addition.sourceHtmlLinks, undefined, 'HTML glossary links require an exact reviewed page');
  }
  const byEntry = new Map<string, SourceRequest>();
  for (const request of [...addition.sourceGlossary.terms, ...(addition.sourceHtmlLinks ?? [])]) {
    const prior = byEntry.get(request.dictionaryEntryId);
    if (prior) assert.equal(prior.sourceKeyAttribute, request.sourceKeyAttribute, 'HFR source requests for one entry must agree on the source key');
    else byEntry.set(request.dictionaryEntryId, request);
  }
  return [...byEntry.values()];
}
