import 'server-only';

import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';

import {hasLocalOnlyAnimationModule} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import {P006_GLOSSARY_BUTTONS} from
  '../../../packages/demos/src/alg-l12-p006-glossary-state';
import {SHARED_ALG001_L12_P006_CONFIG, SHARED_ALG001_L12_P006_SOURCE} from
  '../../../packages/demos/src/timelines/shared-alg001-l12-p006';
import {getWorkspaceRoot} from './catalog';
import {algL12P003Descriptor} from './g678-alg-l12-p003.server';
import {algL12P006Canvas} from './g678-alg-l12-p006.server';
import {decodeG678GlossaryXmlText} from './g678-calibration-product-bridge.server';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';
import type {PageOnlyLessonGlossaryEntry, PageOnlyLessonPlayerDescriptor} from
  './whole-lesson-player-descriptor';

export const ALG_L12_P006_ID = 'shared-alg001-l12-p006';
const SOURCE_SHA256 = '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6';
const RUNTIME_SHA256 = 'b2fd1788ce5bab5efab167bf303608da66621ead66f6d276979fb09558b39ddc';
const GLOSSARY_AUDIT = Object.freeze({
  path: 'migrations/shared-alg001-l12-p006/audit/glossary-disposition-v1.json',
  bytes: 26891,
  sha256: '7c0dcbfa455ad06a1a72c4d9550d6aabd4131c4c3e498ecad50193f1d5395bab',
});
const GLOSSARY_CATALOG = Object.freeze({
  path: 'catalog/g678-vb02-l1-family-audit-v1.json',
  bytes: 230498,
  sha256: 'e5ff597b123c3097f2784d497b5f9ba1be0a750ffbd36b36e8038ea6bcd36763',
});

type BilingualText = Readonly<Record<'en' | 'es', string>>;
type SourceTerm = Readonly<{
  id: string;
  sourceKeyAttribute: string;
  labels: BilingualText;
  definitions: BilingualText;
  localeSourceResolution: BilingualText;
  sourceEntrySha256: BilingualText;
}>;
type AuditTerm = Omit<SourceTerm, 'id'> & Readonly<{entryId: string}>;

function demand(value: unknown, reason: string): asserts value {
  if (!value) throw Error(`ALG_L12_P006_HOST_PROBE_INVALID: ${reason}`);
}

function readPinnedJson(pin: typeof GLOSSARY_AUDIT | typeof GLOSSARY_CATALOG): unknown {
  const file = path.join(getWorkspaceRoot(), pin.path);
  const stat = lstatSync(file);
  demand(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 &&
    realpathSync(file) === file, `ordinary glossary evidence: ${pin.path}`);
  const bytes = readFileSync(file);
  demand(bytes.length === pin.bytes &&
    createHash('sha256').update(bytes).digest('hex') === pin.sha256,
  `pinned glossary evidence: ${pin.path}`);
  return JSON.parse(bytes.toString());
}

function sourceBoundInequality(
  base: PageOnlyLessonPlayerDescriptor,
): PageOnlyLessonGlossaryEntry {
  const audit = readPinnedJson(GLOSSARY_AUDIT) as {
    schemaVersion: number; animationId: string; source: {sha256: string};
    buttons: Array<{characterId: number; sourceKeyAttribute: string; depth: number}>;
    existingDefinitionCandidate: {
      catalogSha256: string;
      keyTermSources: Record<'en' | 'es', {sha256: string}>;
      entries: AuditTerm[];
    };
  };
  const catalog = readPinnedJson(GLOSSARY_CATALOG) as {
    artifactType: string; terms: SourceTerm[];
  };
  demand(audit.schemaVersion === 1 && audit.animationId === ALG_L12_P006_ID &&
    audit.source.sha256 === SOURCE_SHA256 &&
    audit.existingDefinitionCandidate.catalogSha256 === GLOSSARY_CATALOG.sha256 &&
    catalog.artifactType === 'g678-vb02-l1-family-audit-v1' &&
    Array.isArray(audit.buttons) && Array.isArray(audit.existingDefinitionCandidate.entries) &&
    Array.isArray(catalog.terms) && audit.buttons.length === 4 &&
    audit.existingDefinitionCandidate.entries.length === 4 &&
    isDeepStrictEqual(audit.buttons.map(({characterId, sourceKeyAttribute, depth}) =>
      [characterId, sourceKeyAttribute, depth]),
    P006_GLOSSARY_BUTTONS.map(({characterId, term, depth}) =>
      [characterId, term, depth])),
  'exact four P006 source buttons and pinned catalog');

  let inequality: PageOnlyLessonGlossaryEntry | undefined;
  for (const [index, button] of P006_GLOSSARY_BUTTONS.entries()) {
    const audited = audit.existingDefinitionCandidate.entries[index];
    const matches = catalog.terms.filter(term =>
      term.sourceKeyAttribute === button.term);
    demand(audited?.sourceKeyAttribute === button.term && matches.length === 1,
      `unique audited term: ${button.term}`);
    const source = matches[0]!;
    demand(audited.entryId === source.id &&
      isDeepStrictEqual(audited.labels, source.labels) &&
      isDeepStrictEqual(audited.definitions, source.definitions) &&
      isDeepStrictEqual(audited.localeSourceResolution,
        source.localeSourceResolution) &&
      isDeepStrictEqual(audited.sourceEntrySha256, source.sourceEntrySha256),
    `catalog content: ${button.term}`);
    const decode = (value: string) => {
      const decoded = decodeG678GlossaryXmlText(value);
      demand(decoded, `decoded glossary text: ${button.term}`);
      return decoded;
    };
    const entry: PageOnlyLessonGlossaryEntry = Object.freeze({
      id: source.id,
      sourceKeyAttribute: source.sourceKeyAttribute,
      labels: Object.freeze({en: decode(source.labels.en), es: decode(source.labels.es)}),
      definitions: Object.freeze({
        en: decode(source.definitions.en), es: decode(source.definitions.es),
      }),
      source: Object.freeze({
        en: Object.freeze({assetId: 'G678L1KTE01.xml' as const,
          path: source.localeSourceResolution.en,
          sha256: audit.existingDefinitionCandidate.keyTermSources.en.sha256}),
        es: Object.freeze({assetId: 'G678L1KTS01.xml' as const,
          path: source.localeSourceResolution.es,
          sha256: audit.existingDefinitionCandidate.keyTermSources.es.sha256}),
      }),
    });
    const existing = base.glossary.filter(item => item.id === source.id);
    if (source.id === 'inequality') {
      demand(existing.length === 0, 'inequality must be private-probe-only');
      inequality = entry;
    } else {
      demand(existing.length === 1 && isDeepStrictEqual(existing[0], entry),
        `preserve existing lesson glossary: ${source.id}`);
    }
  }
  demand(inequality, 'audited inequality entry required');
  return inequality;
}

/** Simulates only P006 in the real local My Lesson host. No registry write. */
export function algL12P006HostProbeDescriptor(): PageOnlyLessonPlayerDescriptor {
  demand(isG678LocalPreviewEnabled(), 'local loopback opt-in required');
  demand(!SHARED_ALG001_L12_P006_SOURCE.currentJavaScriptRegistered &&
    !SHARED_ALG001_L12_P006_SOURCE.productCalibrationPassed &&
    !SHARED_ALG001_L12_P006_SOURCE.audioPlaybackEnabled &&
    SHARED_ALG001_L12_P006_SOURCE.strictAcceptanceEffect === 'none' &&
    SHARED_ALG001_L12_P006_SOURCE.spanishTextPolicy ===
      'english-source-fallback-translation-pending' &&
    SHARED_ALG001_L12_P006_SOURCE.source.sha256 === SOURCE_SHA256 &&
    SHARED_ALG001_L12_P006_CONFIG.animationId === ALG_L12_P006_ID &&
    SHARED_ALG001_L12_P006_CONFIG.assetSha256 === RUNTIME_SHA256 &&
    !hasLocalOnlyAnimationModule(ALG_L12_P006_ID),
  'source candidate must remain unregistered and unaccepted');
  const runtime = algL12P006Canvas(); // Checks physical SWF and pinned v2 bytes.
  demand(runtime.sha256 === RUNTIME_SHA256 && runtime.bytes.length === 11507597,
    'mask-corrected v2 runtime');

  const base = algL12P003Descriptor();
  const target = base.pages[5];
  demand(base.course.moduleCode === 'ALG001' && base.course.lesson === 12 &&
    base.course.activePageCount === 52 && base.pages.length === 52 &&
    base.productBridge.pageOnlyDescriptorMemberCount === 52 &&
    base.productBridge.registeredAnimationCount === 19 &&
    base.productBridge.registeredAnimationCount === base.pages.filter(page =>
      page.rendererAvailability.kind === 'registered').length &&
    target?.animationId === ALG_L12_P006_ID &&
    target.placementId === ALG_L12_P006_ID &&
    target.globalPageOrdinal === 6 && target.sectionCode === 'RW' &&
    target.sectionPageOrdinal === 5 &&
    target.previousPlacementId === 'shared-alg001-l12-p005' &&
    target.nextPlacementId === 'shared-alg001-l12-p007' &&
    target.source.assetId === `swf-${SOURCE_SHA256}` &&
    target.rendererAvailability.kind === 'unavailable',
  'exact sixth source placement in P003 predecessor');

  const pages = base.pages.map((page, index) => index === 5
    ? Object.freeze({...page,
      presentation: Object.freeze({...page.presentation,
        pageInteractionCompanionTargetIdSuffix: 'p006-glossary-candidate'}),
      rendererAvailability: Object.freeze({kind: 'registered' as const,
        moduleKey: ALG_L12_P006_ID,
        runtimeQuery: Object.freeze({
          frameDomain: SHARED_ALG001_L12_P006_CONFIG.mainFrameDomain,
          language: 'fixed-en' as const,
          scenario: 'source-static-frame', seed: '0',
        })}),
      runtimeEvidenceBoundary: Object.freeze({
        runtimeKind: 'source-static-current-js-candidate' as const,
        actionScriptExecution: 'not-executed' as const,
        naturalTraceValidation: 'not-established' as const,
        audioAcceptance: 'not-established' as const,
        replaySemantics: 'renderer-restart-only-source-behavior-not-established' as const,
        productVisualBehaviorComposite: 'not-established' as const,
      }),
    }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered')
    .map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 &&
    selected.length === new Set(selected).size && selected[4] === ALG_L12_P006_ID &&
    selected.filter(id => id !== ALG_L12_P006_ID).every(id =>
      base.productBridge.selectedAnimationIds.includes(id)) &&
    Object.values(base.productBridge.acceptanceEffects).every(value => value === false),
  'one simulated page and no accepted gates');
  const inequality = sourceBoundInequality(base);

  return Object.freeze({...base,
    descriptorId: `${base.descriptorId}:p006-unregistered-host-probe`,
    calibrationId: 'g678-alg-l12-p006-unregistered-host-probe-v1',
    releaseId: `${base.releaseId}:p006-unregistered-host-probe`,
    course: Object.freeze({...base.course,
      href: `/migration-status/g678-calibration/${ALG_L12_P006_ID}`}),
    persistence: Object.freeze({...base.persistence,
      storageKey: `${base.persistence.storageKey}:p006-unregistered-host-probe`}),
    pages: Object.freeze(pages),
    glossary: Object.freeze([...base.glossary, inequality]),
    productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected),
      registeredAnimationCount: selected.length}),
  });
}
