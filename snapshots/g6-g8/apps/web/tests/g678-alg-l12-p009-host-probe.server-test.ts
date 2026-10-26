import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, realpathSync} from 'node:fs';
import {test} from 'node:test';

import {hasLocalOnlyAnimationModule, localOnlyAnimationModuleRegistration,
  registeredLocalOnlyAnimationKeys} from
  '../../../packages/demos/src/local-only-animation-registry-metadata';
import {P009_GLOSSARY_TERMS} from '../../../packages/demos/src/alg-l12-p009-glossary';
import {algL12P006CurrentJsDescriptor} from '../lib/g678-alg-l12-p006-current-js.server';
import {ALG_L12_P009_ID, algL12P009HostProbeDescriptor} from
  '../lib/g678-alg-l12-p009-host-probe.server';
import {supplementP009Glossary} from '../lib/g678-alg-l12-p009-glossary.server';
import {isG678LocalPreviewRequestHeaders} from '../lib/g678-preview-policy';
import type {PageOnlyLessonGlossaryEntry} from '../lib/whole-lesson-player-descriptor';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_FILE = `${SOURCE_ROOT}/G6-G8-shared/ALG001/L12/VB/L12VB04.swf`;
const SOURCE_SHA = 'd8bb6bfb4632fc528a0e14092277d95b2d96998aaeab2f0c1252a0233f35f533';
const DICTIONARY_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
const DICTIONARIES = [
  {path: `${DICTIONARY_ROOT}/L1KTE01.xml`, bytes: 345838, sha256: '14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'},
  {path: `${DICTIONARY_ROOT}/L1KTS01.xml`, bytes: 344456, sha256: '3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'},
] as const;
const SUPPLEMENTAL_KEYS = ['Pair', 'Locate', 'X-coordinate', 'Y-coordinate'] as const;
const env: Record<string, string | undefined> = process.env;
const ENV_KEYS = ['NODE_ENV', 'VERCEL_ENV', 'HELP_MATH_G678_LOCAL_PREVIEW',
  'HELP_MATH_G678_LOCAL_PREVIEW_BIND', 'HELP_MATH_G678_SOURCE_ROOT'] as const;
const hash = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex');

function local(run: () => void) {
  const before = Object.fromEntries(ENV_KEYS.map(key => [key, env[key]]));
  try {
    env.NODE_ENV = 'development'; delete env.VERCEL_ENV;
    env.HELP_MATH_G678_LOCAL_PREVIEW = '1'; env.HELP_MATH_G678_LOCAL_PREVIEW_BIND = '127.0.0.1';
    env.HELP_MATH_G678_SOURCE_ROOT = SOURCE_ROOT;
    run();
  } finally {
    for (const key of ENV_KEYS) {
      if (before[key] === undefined) delete env[key]; else env[key] = before[key];
    }
  }
}
const registryFiles = [
  new URL('../../../packages/demos/src/registry.local-only.metadata.generated.ts', import.meta.url),
  new URL('../../../packages/demos/src/local-only-animation-registry-metadata.ts', import.meta.url),
];
function registrySnapshot() {
  return {keys: [...registeredLocalOnlyAnimationKeys],
    files: registryFiles.map(file => ({path: file.pathname, sha256: hash(readFileSync(file))}))};
}

type DictionaryRecord = Readonly<{
  key: string; firstLine: number; lastLine: number; sourceTagName: string; sourceAttributes: string;
  sourceLabelEn: string; sourceLabelEs: string; definitionEn: string; definitionEs: string; definitionSha256: string;
}>;
type KeytermAudit = Readonly<{animationId: string; sourceSha256: string;
  sources: readonly Readonly<{path: string; bytes: number; sha256: string; records: readonly DictionaryRecord[]}>[]}>;
function readableSourceText(text: string) { return text.replaceAll('&nbsp;', ' ').replace(/\s+/gu, ' ').trim(); }

test('P009 probe is bounded before registration and rejects the registered placement', () => local(() => {
  const registryBefore = registrySnapshot();
  if (hasLocalOnlyAnimationModule(ALG_L12_P009_ID)) {
    assert.throws(() => algL12P009HostProbeDescriptor(), /unregistered local-only probe/u);
    assert.deepEqual(registrySnapshot(), registryBefore);
    return;
  }
  const official = algL12P006CurrentJsDescriptor();
  const before = JSON.stringify(official);
  const probe = algL12P009HostProbeDescriptor();
  assert.equal(probe.pages.length, 52); assert.equal(official.pages.length, 52);
  assert.equal(official.productBridge.registeredAnimationCount, 20);
  assert.equal(probe.productBridge.registeredAnimationCount, 21);
  const old = official.pages[8]!, page = probe.pages[8]!;
  assert.equal(old.rendererAvailability.kind, 'unavailable'); assert.equal(page.rendererAvailability.kind, 'registered');
  assert.equal(page.animationId, ALG_L12_P009_ID); assert.equal(page.placementId, ALG_L12_P009_ID);
  assert.equal(page.globalPageOrdinal, 9); assert.equal(page.sectionCode, 'VB'); assert.equal(page.sectionPageOrdinal, 3);
  assert.equal(page.previousPlacementId, 'shared-alg001-l12-p008');
  assert.equal(page.nextPlacementId, 'shared-alg001-l12-p010');
  assert.equal(page.source.assetId, `swf-${SOURCE_SHA}`);
  assert.deepEqual(page.source, old.source);
  const {rendererAvailability: _oldRenderer, runtimeEvidenceBoundary: _oldBoundary, ...oldPlacement} = old;
  const {rendererAvailability: _probeRenderer, runtimeEvidenceBoundary: _probeBoundary, ...probePlacement} = page;
  assert.deepEqual(probePlacement, oldPlacement, 'source placement, title and navigation remain the predecessor record');
  assert.deepEqual(probe.pages.filter((_, index) => index !== 8), official.pages.filter((_, index) => index !== 8));
  assert.deepEqual(probe.pages.map(item => item.placementId), official.pages.map(item => item.placementId));
  assert.deepEqual(probe.sections, official.sections);
  assert.equal(new Set(probe.productBridge.selectedAnimationIds).size, 21);
  assert.deepEqual(probe.productBridge.selectedAnimationIds.filter(id => id !== ALG_L12_P009_ID),
    official.productBridge.selectedAnimationIds);
  assert.deepEqual(page.rendererAvailability, {kind: 'registered', moduleKey: ALG_L12_P009_ID,
    runtimeQuery: {frameDomain: 'sprite-62', language: 'fixed-en', scenario: 'source-static-frame', seed: '0'}});
  assert.equal(page.runtimeEvidenceBoundary?.actionScriptExecution, 'not-executed');
  assert.equal(page.runtimeEvidenceBoundary?.audioAcceptance, 'not-established');
  assert.equal(page.runtimeEvidenceBoundary?.naturalTraceValidation, 'not-established');
  assert.equal(page.runtimeEvidenceBoundary?.productVisualBehaviorComposite, 'not-established');
  assert.deepEqual(probe.productBridge.acceptanceEffects, official.productBridge.acceptanceEffects);
  assert.ok(Object.values(probe.productBridge.acceptanceEffects).every(value => value === false));
  assert.equal(probe.calibrationId, 'g678-alg-l12-p009-unregistered-host-probe-v1');
  assert.match(probe.descriptorId, /p009-unregistered-host-probe$/u);
  assert.match(probe.releaseId, /p009-unregistered-host-probe$/u);
  assert.notEqual(probe.persistence.storageKey, official.persistence.storageKey);
  assert.equal(probe.course.href, `/migration-status/g678-calibration/${ALG_L12_P009_ID}`);
  assert.equal(JSON.stringify(official), before);
  assert.equal(realpathSync(SOURCE_FILE), SOURCE_FILE);
  const swf = readFileSync(SOURCE_FILE); assert.equal(swf.length, 165405); assert.equal(hash(swf), SOURCE_SHA);
  assert.equal(hasLocalOnlyAnimationModule(ALG_L12_P009_ID), false);
  assert.equal(localOnlyAnimationModuleRegistration(ALG_L12_P009_ID), undefined);
  assert.deepEqual(registrySnapshot(), registryBefore, 'the probe does not modify registry metadata or registrations');
  assert.equal(algL12P006CurrentJsDescriptor().pages[8]?.rendererAvailability.kind, 'unavailable');
  assert.equal(algL12P006CurrentJsDescriptor().productBridge.registeredAnimationCount, 20);
}));

test('four supplemental terms retain the actual bilingual dictionary labels, definitions and source identity', () => local(() => {
  const base = algL12P006CurrentJsDescriptor(), probe = {glossary: supplementP009Glossary(base.glossary)};
  assert.equal(probe.glossary.length, base.glossary.length + 4);
  assert.deepEqual(probe.glossary.slice(0, base.glossary.length), base.glossary);
  assert.deepEqual(probe.glossary.slice(base.glossary.length).map(entry => entry.sourceKeyAttribute), SUPPLEMENTAL_KEYS);
  const auditBytes = readFileSync(new URL('../../../migrations/shared-alg001-l12-p009/audit/source-keyterms.json', import.meta.url));
  assert.equal(auditBytes.length, 20166);
  assert.equal(hash(auditBytes), '927aec6318e3b90e63e80c2670cce36e4ed9b76c10ef808872c9b0381181ffc3');
  const audit = JSON.parse(auditBytes.toString()) as KeytermAudit;
  assert.equal(audit.animationId, ALG_L12_P009_ID); assert.equal(audit.sourceSha256, SOURCE_SHA);
  assert.equal(audit.sources.length, 2);
  const origin = base.glossary.find(entry => entry.source.en.sha256 === DICTIONARIES[0].sha256 &&
    entry.source.es.sha256 === DICTIONARIES[1].sha256)!.source;
  for (const [index, dictionary] of DICTIONARIES.entries()) {
    assert.equal(realpathSync(dictionary.path), dictionary.path);
    const physical = readFileSync(dictionary.path);
    assert.equal(physical.length, dictionary.bytes); assert.equal(hash(physical), dictionary.sha256);
    const audited = audit.sources[index]!;
    assert.equal(audited.path, dictionary.path); assert.equal(audited.sha256, dictionary.sha256);
    const lines = physical.toString().split(/\r?\n/u);
    for (const key of SUPPLEMENTAL_KEYS) {
      const records = audited.records.filter(record => record.key === key); assert.equal(records.length, 1);
      const record = records[0]!;
      const raw = lines.slice(record.firstLine - 1, record.lastLine).join('\n').trim();
      const opening = `<${record.sourceTagName} ${record.sourceAttributes}>`;
      const closing = `</${record.sourceTagName}>`;
      assert.ok(raw.startsWith(opening)); assert.ok(raw.endsWith(closing));
      const definitions = raw.slice(opening.length, -closing.length);
      assert.equal(hash(definitions), record.definitionSha256);
      assert.deepEqual(definitions.split('~LNG~'), [record.definitionEn, record.definitionEs]);
      assert.deepEqual(record.sourceTagName.split('~LNG~').map(label => label.replaceAll('~', ' ')),
        [record.sourceLabelEn, record.sourceLabelEs]);
      const entries = probe.glossary.filter(entry => entry.sourceKeyAttribute === key); assert.equal(entries.length, 1);
      const entry = entries[0]!;
      assert.equal(entry.id, key.toLowerCase());
      assert.deepEqual(entry.labels, {en: readableSourceText(record.sourceLabelEn), es: readableSourceText(record.sourceLabelEs)});
      assert.deepEqual(entry.definitions, {en: readableSourceText(record.definitionEn), es: readableSourceText(record.definitionEs)});
      assert.deepEqual(entry.source, origin);
      assert.equal(entry.source.en.assetId, 'G678L1KTE01.xml'); assert.equal(entry.source.es.assetId, 'G678L1KTS01.xml');
    }
  }
  for (const term of P009_GLOSSARY_TERMS)
    assert.equal(probe.glossary.filter(entry => entry.sourceKeyAttribute === term.sourceKeyAttribute).length, 1,
      `one exact dictionary entry for the literal source button key ${term.sourceKeyAttribute}`);
}));

test('glossary supplement preserves predecessor entries and rejects missing identity, duplicate keys and ID collisions', () => local(() => {
  const base = algL12P006CurrentJsDescriptor().glossary, before = JSON.stringify(base);
  const supplemented = supplementP009Glossary(base);
  assert.equal(supplemented.length, base.length + 4); assert.ok(Object.isFrozen(supplemented));
  base.forEach((entry, index) => assert.equal(supplemented[index], entry));
  assert.equal(JSON.stringify(base), before);
  assert.throws(() => supplementP009Glossary([]), /no matching canonical dictionary identity/u);
  const missingIdentity = base.map(entry => ({...entry, source: {
    en: {...entry.source.en, sha256: '0'.repeat(64)}, es: {...entry.source.es, sha256: '0'.repeat(64)},
  }}));
  assert.throws(() => supplementP009Glossary(missingIdentity), /no matching canonical dictionary identity/u);
  const template = base[0]!;
  for (const key of SUPPLEMENTAL_KEYS) {
    const duplicate: PageOnlyLessonGlossaryEntry = {...template, id: `duplicate-${key}`, sourceKeyAttribute: key};
    assert.throws(() => supplementP009Glossary([...base, duplicate]), /duplicate supplemental key/u);
  }
  const collision: PageOnlyLessonGlossaryEntry = {...template, id: 'pair', sourceKeyAttribute: 'Unrelated source key'};
  assert.throws(() => supplementP009Glossary([...base, collision]), /supplemental entry ID collision/u);
  assert.throws(() => supplementP009Glossary(supplemented), /duplicate supplemental key/u);
  assert.equal(JSON.stringify(base), before);
}));

test('P009 probe rejects missing opt-in, provider environments, production and broad binding', () => {
  const cases: ReadonlyArray<readonly [typeof ENV_KEYS[number], string | undefined]> = [
    ['HELP_MATH_G678_LOCAL_PREVIEW', undefined], ['HELP_MATH_G678_LOCAL_PREVIEW', '0'],
    ['HELP_MATH_G678_LOCAL_PREVIEW', 'TRUE'], ['VERCEL_ENV', 'preview'], ['VERCEL_ENV', 'production'],
    ['NODE_ENV', 'production'], ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', undefined],
    ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', '0.0.0.0'], ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', '::1'],
  ];
  for (const [key, value] of cases) local(() => {
    if (value === undefined) delete env[key]; else env[key] = value;
    assert.throws(() => algL12P009HostProbeDescriptor(), /unregistered local-only probe/u);
  });
});

test('P009 probe rejects absent, wrong, normalized or compatibility source-root substitution', () => {
  for (const root of [undefined, '/nonexistent', `${SOURCE_ROOT}/`,
    '/Volumes/WestWorld/HELP MATH 2.0/source-assets/G6-G8-shared']) local(() => {
    if (root === undefined) delete env.HELP_MATH_G678_SOURCE_ROOT; else env.HELP_MATH_G678_SOURCE_ROOT = root;
    assert.throws(() => algL12P009HostProbeDescriptor(), hasLocalOnlyAnimationModule(ALG_L12_P009_ID)
      ? /unregistered local-only probe/u : /P009 local typography binding required/u);
  });
});

test('P009 formal page limits locales and loopback headers and requires strict registration', () => local(() => {
  for (const host of ['127.0.0.1:3317', 'localhost:3317', '[::1]:3317'])
    assert.equal(isG678LocalPreviewRequestHeaders(new Headers({host})), true);
  for (const headers of [new Headers(), new Headers({host: 'helpmath.ai'}),
    new Headers({host: '127.0.0.1:3317', 'x-forwarded-host': 'helpmath.ai'}),
    new Headers({host: '127.0.0.1:3317,example.com'}),
    new Headers({host: '127.0.0.1:3317', 'x-forwarded-host': 'localhost:3317,example.com'})])
    assert.equal(isG678LocalPreviewRequestHeaders(headers), false);
  const page = readFileSync(new URL(
    '../app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p009/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /process\.env\.NODE_ENV === 'production'/u);
  assert.match(page, /locale !== 'en' && locale !== 'es'/u);
  assert.match(page, /isG678LocalPreviewRequestHeaders\(await headers\(\)\)/u);
  assert.match(page, /catch \{notFound\(\);\}/u);
  assert.match(page, /robots: \{index: false, follow: false, noarchive: true\}/u);
  assert.match(page, /data-p009-current-js=\{formal \? "source-bound-local" : "unregistered-probe"\}/u);
  assert.match(page, /initialPlacementId=\{ALG_L12_P009_CURRENT_JS_ID\}/u);
  assert.match(page, /audioEnabled=\{false\}/u);
  assert.match(page, /releasePublished=\{false\} strictCompleteMemberCount=\{0\}/u);
  assert.match(page, /registered\.has\(page\.animationId\)/u);
  assert.match(page, /formal \? algL12P009CurrentJsDescriptor\(\) : algL12P009HostProbeDescriptor\(\)/u);
  assert.match(page, /const formal = registeredLocalOnlyAnimationKeys\.includes\(ALG_L12_P009_CURRENT_JS_ID\)/u);
  assert.match(page, /This page is unpublished/u);
  assert.match(page, /English source text is not a Spanish translation/u);
}));
