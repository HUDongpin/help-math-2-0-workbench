#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {lstat, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT), '..');
export const OUTPUT = 'catalog/g678-alg-l11-instructional-successor-glossary-v1.json';
export const INPUTS = Object.freeze({
  a: {path: 'work/g678-shared-page-factory/g678-alg-l11-a-special-instructional-visuals-v2/manifest.json',
    bytes: 12819, sha256: 'd1daafb416c645730376b420b433d90e28c7dcaa02304491a8be91487ede44c3'},
  b: {path: 'work/g678-shared-page-factory/g678-alg-l11-b-source-glossary-v1/manifest.json',
    bytes: 5578, sha256: 'd62de341d9531e581d795e96896e820726eb476773d24fbd79cd890e4399ef43'},
  audit: {path: 'catalog/g678-alg-l11-simple-glossary-tranche1-audit-v1.json',
    bytes: 173916, sha256: '1f3eef83660ec8cd554a8954223a3a6f06eda1729c4c14da1541dfc081f9ec9d'},
  recovery: {path: 'catalog/g678-ts07-l1-keyterm-recovery-v1.json',
    bytes: 174337, sha256: '78fda81f5336991b563d173d9266494f1d7e2f17812f6aa2a84506eadf6144f7'},
  existingFreeze: {path: 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.json',
    bytes: 2275220, sha256: '16a8e04786520f62e1e5a833cb9b23aa0e9c25c5e2c1a610970c4774e1bae646'},
});
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const exact = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const json = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const identity = ({path: file, bytes, sha256}) => ({path: file, bytes, sha256});
function requireFact(value, message) {
  if (!value) throw new Error(`BLOCKED_SUCCESSOR_GLOSSARY: ${message}`);
}
async function bound(file, expected, root = ROOT) {
  const target = path.resolve(root, file);
  requireFact(!path.isAbsolute(file) && target.startsWith(`${root}${path.sep}`), 'source path escapes its root');
  const [canonical, before] = await Promise.all([realpath(target), lstat(target, {bigint: true})]);
  requireFact(canonical === target && before.isFile() && before.nlink === 1n, `${file}: noncanonical source`);
  const buffer = await readFile(target);
  const after = await lstat(target, {bigint: true});
  requireFact(['dev', 'ino', 'size', 'mtimeNs', 'mode', 'nlink'].every((key) => before[key] === after[key]), `${file}: changed during read`);
  const actual = {path: file, bytes: buffer.length, sha256: hash(buffer)};
  requireFact(!expected || exact(actual, expected), `${file}: source hash/size drift`);
  return {...actual, buffer};
}

// Legacy element names contain ~LNG~ and are not XML-name compliant. Apply
// the frozen audit's bounded record grammar; never repair or rewrite source.
export function decodeGlossaryText(value) {
  const named = {nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>'};
  const numeric = {'003c': '<', '003e': '>', '2260': '≠', '2264': '≤', '2265': '≥', '00b0': '°', '00b3': '³'};
  return value.replace(/&(?:#x([a-f0-9]+)|(#\d+)|([a-z]+));/giu, (entity, hex, decimal, name) => {
    const result = hex ? numeric[hex.toLowerCase()] : decimal ? undefined : named[name];
    requireFact(result !== undefined, `unsupported source entity ${entity}`);
    return result;
  }).replace(/\s+/gu, ' ').trim();
}
const normalize = (value) => decodeGlossaryText(value).toLowerCase();
const termId = (key) => normalize(key).replace(/[^a-z0-9]+/gu, '-').replace(/(^-|-$)/gu, '');
export function resolveSourceGlossary(xmlByLanguage, keys, source) {
  const selected = {};
  for (const lang of ['en', 'es']) {
    selected[lang] = new Map();
    for (const match of xmlByLanguage[lang].matchAll(/<([^\s>]+~LNG~[^\s>]+)\s+([^>]*)>([\s\S]*?)<\/\1\s*>/gu)) {
      const attrs = Object.fromEntries([...match[2].matchAll(/([A-Za-z]+)\s*=\s*"([^"]*)"/gu)].map((row) => [row[1], row[2]]));
      const key = attrs.ScreenkeyTerm;
      if (!key || !keys.some((requested) => normalize(requested) === normalize(key))) continue;
      const labels = match[1].split('~LNG~').map((label) => decodeGlossaryText(label.replaceAll('~', ' ')));
      if (normalize(labels[0]) !== normalize(key)) continue;
      const definitions = match[3].split('~LNG~');
      requireFact(definitions.length === 2 && attrs.ExFileName?.endsWith('.swf'), `${key}: malformed legacy entry`);
      const bucket = selected[lang].get(normalize(key)) ?? [];
      bucket.push({key, labels: {en: key, es: labels[1]},
        definitions: {en: decodeGlossaryText(definitions[0]), es: decodeGlossaryText(definitions[1])},
        sha256: hash(Buffer.from(match[0])),
        lfNormalizedSha256: hash(Buffer.from(match[0].replace(/\r\n?/gu, '\n')))});
      selected[lang].set(normalize(key), bucket);
    }
  }
  return [...new Set(keys.map(normalize))].sort().map((key) => {
    const left = selected.en.get(key), right = selected.es.get(key);
    requireFact(left?.length === 1 && right?.length === 1, `${key}: missing or ambiguous exact bilingual entry`);
    requireFact(exact(left[0].labels, right[0].labels) && exact(left[0].definitions, right[0].definitions), `${key}: bilingual source definition/label disagreement`);
    return {id: termId(key), sourceKeyAttribute: left[0].key, labels: left[0].labels,
      definitions: left[0].definitions, source,
      sourceEntrySha256: {en: left[0].sha256, es: right[0].sha256},
      extractionLfNormalizedEntrySha256: {en: left[0].lfNormalizedSha256, es: right[0].lfNormalizedSha256}};
  });
}
const productEntry = ({id, sourceKeyAttribute, labels, definitions, source}) => ({id, sourceKeyAttribute, labels, definitions, source});
export function assertEntryMatchesSource(candidate, resolved, label = 'entry') {
  const normalized = (entry) => ({id: entry.id, sourceKeyAttribute: normalize(entry.sourceKeyAttribute),
    labels: Object.fromEntries(['en', 'es'].map((lang) => [lang, decodeGlossaryText(entry.labels[lang])])),
    definitions: Object.fromEntries(['en', 'es'].map((lang) => [lang, decodeGlossaryText(entry.definitions[lang])])),
    source: entry.source});
  requireFact(exact(normalized(candidate), normalized(resolved)), `${label}/${candidate.id}: existing or candidate source conflict`);
  return true;
}

export async function buildSuccessorGlossary({check = false, recoveryRoot = process.env.PRIVATE_RECOVERY_CONTAINERS} = {}) {
  requireFact(typeof recoveryRoot === 'string' && recoveryRoot.length > 0, 'PRIVATE_RECOVERY_CONTAINERS required for actual XML recheck');
  const privateRoot = path.resolve(recoveryRoot);
  requireFact(await realpath(privateRoot) === privateRoot && (await lstat(privateRoot)).isDirectory(), 'noncanonical recovery root');
  const files = Object.fromEntries(await Promise.all(Object.entries(INPUTS).map(async ([key, file]) =>
    [key, JSON.parse((await bound(file.path, file)).buffer)])));
  const xml = {}, source = {};
  for (const lang of ['en', 'es']) {
    const expected = files.audit.keyTermSources[lang];
    const recovered = files.recovery.selectedSources.find((row) => row.localeRole === lang);
    requireFact(exact(expected, recovered?.casObject), 'recovery/audit XML binding disagreement');
    xml[lang] = (await bound(expected.path, expected, privateRoot)).buffer.toString('utf8');
    source[lang] = {assetId: `G678L1KT${lang === 'en' ? 'E' : 'S'}01.xml`, path: recovered.reference, sha256: expected.sha256};
  }
  const selections = files.existingFreeze.selectedPages.filter((page) => page.animationId.startsWith('shared-alg001-l11-'));
  const existing = selections.flatMap((page) => (page.glossaryEntries ?? []).map((entry) => ({animationId: page.animationId, entry})));
  const configs = [];
  for (const [family, manifest] of [['a-special3', files.a], ['b10', files.b]]) {
    for (const member of manifest.members) {
      const config = JSON.parse((await bound(member.config.path, member.config)).buffer);
      const entries = config.glossaryEntries ?? config.entries;
      for (const script of config.sourceScripts) await bound(script.path, script);
      configs.push({animationId: member.animationId, family, sourceConfig: member.config,
        sourceSha256: config.source?.sha256 ?? config.sourceSha256, entries});
    }
  }
  requireFact(exact(configs.map((row) => row.animationId), [6, 9, 10, 26, 27, 28, 29, 30, 31, 32, 40, 41, 42]
    .map((n) => `shared-alg001-l11-p${String(n).padStart(3, '0')}`)), 'exact13 page set drift');
  const bEntries = JSON.parse((await bound(files.b.entries.path, files.b.entries)).buffer);
  const keys = [...existing.map(({entry}) => entry.sourceKeyAttribute), ...configs.flatMap((row) => row.entries.map((entry) => entry.key))];
  const resolved = resolveSourceGlossary(xml, keys, source);
  const byId = new Map(resolved.map((entry) => [entry.id, entry]));
  for (const {animationId, entry} of existing) assertEntryMatchesSource(entry, byId.get(entry.id), animationId);
  for (const entry of [...configs.flatMap((row) => row.entries), ...bEntries.entries]) {
    const actual = byId.get(entry.id);
    assertEntryMatchesSource({...entry, sourceKeyAttribute: entry.key, source}, actual, 'extracted-config');
    requireFact(exact(entry.sourceEntries, actual.extractionLfNormalizedEntrySha256) &&
      entry.entrySha256 === actual.extractionLfNormalizedEntrySha256.en,
      `${entry.id}: extracted entry hashes do not match actual XML`);
  }
  const priorIds = [...new Set(existing.map(({entry}) => entry.id))].sort();
  const successorIds = [...new Set(configs.flatMap((row) => row.entries.map((entry) => entry.id)))].sort();
  const simpleIds = new Set(files.audit.terms.map((entry) => entry.id));
  const artifact = {schemaVersion: 1, artifactType: 'g678-alg-l11-instructional-successor-glossary-v1',
    scope: 'private-local-source-verified-glossary-projection-only', inputs: INPUTS,
    builder: identity(await bound(path.relative(ROOT, SCRIPT))),
    keyTermSources: files.audit.keyTermSources, source,
    sourceEntryHashConvention: {sourceEntrySha256: 'exact-raw-UTF8-fragment-bytes',
      extractionLfNormalizedEntrySha256: 'Python-read_text-universal-newline-CRLF-or-CR-to-LF; no source mutation'},
    sourceEntryBindings: resolved.map(({id, sourceEntrySha256, extractionLfNormalizedEntrySha256}) =>
      ({id, sourceEntrySha256, extractionLfNormalizedEntrySha256})),
    members: configs.map(({entries, ...row}) => ({...row,
      glossaryEntries: entries.map((entry) => productEntry(byId.get(entry.id)))})),
    existingLessonReconciliation: {placementCount: selections.length, entryOccurrenceCount: existing.length,
      uniqueExistingIds: priorIds, conflicts: [],
      overlapWithSimpleGlossaryIds: successorIds.filter((id) => simpleIds.has(id)),
      addedAgainstExistingLessonIds: successorIds.filter((id) => !priorIds.includes(id)),
      mergedGlossaryEntries: resolved.map(productEntry)},
    counts: {successorPages: configs.length, successorUniqueTerms: successorIds.length,
      existingUniqueTerms: priorIds.length, mergedUniqueTerms: resolved.length},
    acceptanceEffects: {currentJavaScriptRegistered: false, productCalibrationPassed: false,
      engineeringPreviewReady: false, authoritativeOriginalRuntime: false, audioAccepted: false,
      visualFidelityAccepted: false, humanVisualAccepted: false, ownerAccepted: false,
      strictComplete: false, releaseEligible: false, published: false},
    limitation: 'Actual recovered English/Spanish XML bytes and exact entry fragments were rehashed. This prepares source-exact host glossary entries only; it does not promote recovered sources, add product registration, prove runtime stop/resume, implement legacy example SWFs/sublinks, or grant any acceptance/release decision.'};
  const bytes = json(artifact);
  if (check) requireFact((await bound(OUTPUT)).buffer.equals(bytes), 'projection changed; preserve and use a successor');
  else await writeFile(path.join(ROOT, OUTPUT), bytes, {flag: 'wx', mode: 0o444});
  return {path: OUTPUT, bytes: bytes.length, sha256: hash(bytes), ...artifact.counts};
}
if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT) {
  requireFact(process.argv.slice(2).every((arg) => arg === '--check') && process.argv.length <= 3, 'usage: builder [--check]');
  buildSuccessorGlossary({check: process.argv.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
