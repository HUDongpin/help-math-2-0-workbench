import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import GLOSSARY from '../../../packages/demos/src/generated/geo001-l06-p002-glossary-v1.json';
import {geoL06P001Descriptor} from './g678-geo-l06-p001.server';
import type {PageOnlyLessonGlossaryEntry, PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

export const GEO_L06_P002_ID = 'shared-geo001-l06-p002';
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_PATH = 'G6-G8-shared/GEO001/L6/RW/L6RW02.swf';
const SOURCE_SHA256 = '3f340d0201e0f4eed1c8e73d364641d5de4b625e64c33680059842b523002c44';
const GLOSSARY_IDS = ['area', 'figure', 'surface', 'two-dimensional'];

function demand(value: unknown, reason: string): asserts value {
  if (!value) throw Error(`GEO_L06_P002_HOST_PROBE_INVALID: ${reason}`);
}

/** A local-only host test fixture. It intentionally does not write the
 * official registry or claim P002's Current-JS admission. */
export function geoL06P002HostProbeDescriptor(): PageOnlyLessonPlayerDescriptor {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  demand(process.env.HELP_MATH_G678_SOURCE_ROOT === SOURCE_ROOT &&
    realpathSync(SOURCE_ROOT) === SOURCE_ROOT, 'physical source root');
  const swf = path.join(SOURCE_ROOT, SOURCE_PATH);
  const stat = lstatSync(swf);
  demand(stat.isFile() && !stat.isSymbolicLink() && stat.size === 1117764 &&
    realpathSync(swf) === swf &&
    createHash('sha256').update(readFileSync(swf)).digest('hex') === SOURCE_SHA256,
  'source SWF identity');
  const base = geoL06P001Descriptor();
  demand(base.course.moduleCode === 'GEO001' && base.course.lesson === 6 &&
    base.course.activePageCount === 54 && base.pages.length === 54 &&
    base.productBridge.registeredAnimationCount ===
      base.pages.filter(item => item.rendererAvailability.kind === 'registered').length,
  'source-ordered lesson');
  const page = base.pages[1];
  demand(page?.animationId === GEO_L06_P002_ID && page.placementId === GEO_L06_P002_ID &&
    page.globalPageOrdinal === 2 && page.sectionCode === 'RW' && page.sectionPageOrdinal === 1 &&
    page.previousPlacementId === 'shared-geo001-l06-p001' &&
    page.source.assetId === `swf-${SOURCE_SHA256}` &&
    page.rendererAvailability.kind === 'unavailable', 'exact second placement');
  demand(GLOSSARY.animationId === GEO_L06_P002_ID &&
    GLOSSARY.sourceSwfSha256 === SOURCE_SHA256 && GLOSSARY.entries.length === 4 &&
    GLOSSARY_IDS.every(id => GLOSSARY.entries.some(entry => entry.id === id)), 'glossary source');
  const glossary = new Map(base.glossary.map(entry => [entry.id, entry]));
  for (const source of GLOSSARY.entries) {
    demand(source.source.en.assetId === 'G678L1KTE01.xml' &&
      source.source.es.assetId === 'G678L1KTS01.xml', 'source index identities');
    const entry: PageOnlyLessonGlossaryEntry = {
      id: source.id, sourceKeyAttribute: source.sourceKeyAttribute,
      labels: source.labels, definitions: source.definitions,
      source: {
        en: {...source.source.en, assetId: 'G678L1KTE01.xml'},
        es: {...source.source.es, assetId: 'G678L1KTS01.xml'},
      },
    };
    const prior = glossary.get(entry.id);
    demand(!prior || JSON.stringify(prior) === JSON.stringify(entry), 'glossary conflict');
    glossary.set(entry.id, prior ?? entry);
  }
  const pages = base.pages.map(item => item.animationId === GEO_L06_P002_ID
    ? {...item, rendererAvailability: {kind: 'registered' as const, moduleKey: GEO_L06_P002_ID,
      runtimeQuery: {frameDomain: 'sprite-230', language: 'fixed-en' as const,
        scenario: 'default', seed: '0'}},
      runtimeEvidenceBoundary: {
        runtimeKind: 'source-static-current-js-candidate' as const,
        actionScriptExecution: 'not-executed' as const,
        naturalTraceValidation: 'not-established' as const,
        audioAcceptance: 'not-established' as const,
        replaySemantics: 'product-complete-state-reset-original-runtime-parity-not-established' as const,
        productVisualBehaviorComposite: 'not-established' as const,
      }} : item);
  const selected = pages.filter(item => item.rendererAvailability.kind === 'registered')
    .map(item => item.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 &&
    selected[0] === 'shared-geo001-l06-p001' &&
    selected[1] === GEO_L06_P002_ID, 'candidate order');
  return {
    ...base, descriptorId: `${base.descriptorId}:p002-unregistered-host-probe`,
    calibrationId: 'g678-geo-l06-p002-unregistered-host-probe-v1',
    releaseId: `${base.releaseId}:p002-unregistered-host-probe`,
    course: {...base.course, href: `/migration-status/g678-calibration/${GEO_L06_P002_ID}/host`},
    persistence: {...base.persistence,
      storageKey: `${base.persistence.storageKey}:p002-unregistered-host-probe`},
    support: {...base.support, lessonHostCapabilities: [...new Set([
      ...base.support.lessonHostCapabilities, 'audio', 'glossary'] as const)]},
    pages, glossary: [...glossary.values()],
    productBridge: {...base.productBridge, selectedAnimationIds: selected,
      registeredAnimationCount: selected.length},
  };
}
