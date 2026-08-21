import 'server-only';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import {applyCompletionLedger, normalizeClassificationEvidence, normalizeMissingReference, normalizeXmlReferences, strictCompletionSummaryMatchesEntries, type CompletionDiagnostic, type CompletionEntry, type MigrationStatus} from './catalog-overlays';
import {catalogInputIdentity} from './catalog-cache-identity';
import {
  G4_L3_ATOMIC_RELEASE_ID,
  deriveLessonReleaseStates,
  isProtectedAtomicReleaseId,
  isReleasePublished,
  isTargetPublished,
  protectedAtomicReleaseIdForScope,
  type LessonReleaseDefinition,
  type LessonReleaseLedgerEntry,
  type PublicationCatalog,
} from './lesson-release-publication';

type R = Record<string, unknown>;
const rec = (value: unknown): R => value && typeof value === 'object' && !Array.isArray(value) ? value as R : {};
const str = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;
const num = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : undefined;
const grade = (value: unknown): number | 'elementary' | null => value === 'elementary' ? value : typeof value === 'number' && value >= 3 && value <= 5 ? value : null;

export interface CatalogAnimation {
  animationId: string; assetId: string; canonicalAnimationId: string; isCanonical: boolean;
  source: {path: string; bytes?: number; sha256?: string; swf: {stage?: {width?: number; height?: number}; fps?: number; frameCount?: number; durationMs?: number; signature?: string; version?: number}};
  pairedFla: {path: string; bytes?: number; sha256?: string} | null;
  classification: {collection: 'course' | 'keyterm' | 'formula' | 'unknown'; grade: number | 'elementary' | null; lesson: number | null; lessonTitleRaw?: string; lessonTitleDisplay?: string; lessonDomain?: string; section: {code: string; label: string; titleEnglish?: string; titleSpanish?: string} | null; page: {number: number | null; ordinal: number | null} | null; domain: string; titleRaw: string; titleDisplay: string; titleEnglish?: string; titleSpanish?: string; evidence: ReturnType<typeof normalizeClassificationEvidence>; status: 'confirmed' | 'inferred' | 'unresolved'};
  references: {courseXml: ReturnType<typeof normalizeXmlReferences>; keytermXml: ReturnType<typeof normalizeXmlReferences>};
  audio: Array<{path: string; bytes?: number; sha256?: string; language?: string; association?: string}>; audioGroupIds: string[];
  flags: {referenced: boolean; unreferenced: boolean; variant: boolean; variantKind?: string; shell: boolean}; migration: {status: MigrationStatus; [key: string]: unknown};
}
export interface MissingReference {id: string; path: string; collection: 'course' | 'keyterm'; grade: number | 'elementary' | null; lesson: number | null; titleEnglish: string; titleSpanish?: string; occurrenceCount: number}
export interface AnimationCatalog {
  schemaVersion: 1;
  animations: CatalogAnimation[];
  missingReferences: MissingReference[];
  origin: 'generated' | 'fallback';
  completionLedger: {generatedMarker: string; entries: CompletionEntry[]; diagnostics: CompletionDiagnostic[]};
  publication: PublicationCatalog;
}

const RELEASE_MANIFEST_PATH = 'catalog/lesson-releases.json';
const RELEASE_LEDGER_PATH = 'catalog/lesson-release-ledger.json';
const COMPLETION_LEDGER_PATH = 'catalog/completion-ledger.json';
const CATALOG_PATH = 'catalog/animations.json';
const MISSING_REFERENCES_PATH = 'catalog/missing-references.json';
const G4_L3_PROTECTED_FALLBACK: LessonReleaseDefinition = Object.freeze({
  releaseId: G4_L3_ATOMIC_RELEASE_ID,
  publicationMode: 'atomic',
  expectedMemberCount: 39,
  scope: Object.freeze({collection: 'course', grade: 4, lesson: 3, excludeNonMembers: true}),
  members: Object.freeze([]),
});

function rootDirectory() {
  const candidates = [process.cwd(), path.resolve(process.cwd(), '../..')];
  return candidates.find((candidate) => existsSync(path.join(candidate, 'catalog/animations.json'))) ?? candidates[1]!;
}
export const getWorkspaceRoot = () => rootDirectory();

function normalizeAnimation(value: unknown, index: number): CatalogAnimation {
  const item = rec(value), source = rec(item.source), swf = rec(source.swf), stage = rec(swf.stage), c = rec(item.classification), section = rec(c.section), page = rec(c.page), references = rec(item.references), flags = rec(item.flags), audio = rec(item.audio), paired = rec(item.pairedFla);
  const sourcePath = str(source.path, `unknown-${index + 1}.swf`), animationId = str(item.animationId, `unresolved-${index + 1}`), assetId = str(item.assetId, `unresolved-asset-${index + 1}`), rawCollection = str(c.collection, 'unknown');
  const collection = (['course', 'keyterm', 'formula'].includes(rawCollection) ? rawCollection : 'unknown') as CatalogAnimation['classification']['collection'];
  const titleRaw = str(c.titleRaw, path.basename(sourcePath, '.swf')), rawStatus = str(c.status);
  const audioEntries = Array.isArray(audio.exact) ? audio.exact : [];
  return {
    animationId, assetId, canonicalAnimationId: str(item.canonicalAnimationId, animationId), isCanonical: item.isCanonical !== false,
    source: {path: sourcePath, bytes: num(source.bytes), sha256: str(source.sha256) || undefined, swf: {stage: Object.keys(stage).length ? {width: num(stage.width), height: num(stage.height)} : undefined, fps: num(swf.fps), frameCount: num(swf.frameCount), durationMs: num(swf.durationMs), signature: str(swf.signature) || undefined, version: num(swf.version)}},
    pairedFla: Object.keys(paired).length ? {path: str(paired.path), bytes: num(paired.bytes), sha256: str(paired.sha256) || undefined} : null,
    classification: {collection, grade: grade(c.grade), lesson: num(c.lesson) ?? null, lessonTitleRaw: str(c.lessonTitleRaw) || undefined, lessonTitleDisplay: str(c.lessonTitleDisplay) || undefined, lessonDomain: str(c.lessonDomain) || undefined, section: Object.keys(section).length ? {code: str(section.code), label: str(section.label, str(section.code)), titleEnglish: str(section.titleEnglish) || undefined, titleSpanish: str(section.titleSpanish) || undefined} : null, page: Object.keys(page).length ? {number: num(page.number) ?? null, ordinal: num(page.ordinal) ?? null} : null, domain: str(c.domain, collection === 'formula' ? 'formula-reference' : collection === 'keyterm' ? 'vocabulary' : 'unknown'), titleRaw, titleDisplay: str(c.titleDisplay, titleRaw), titleEnglish: str(c.titleEnglish) || undefined, titleSpanish: str(c.titleSpanish) || undefined, evidence: normalizeClassificationEvidence(c.evidence), status: rawStatus === 'confirmed' || rawStatus === 'inferred' ? rawStatus : 'unresolved'},
    references: {courseXml: normalizeXmlReferences(references.courseXml), keytermXml: normalizeXmlReferences(references.keytermXml)},
    audio: audioEntries.map((entry) => {const v = rec(entry); return {path: str(v.path), bytes: num(v.bytes), sha256: str(v.sha256) || undefined, language: str(v.language) || undefined, association: str(v.association) || undefined};}),
    audioGroupIds: Array.isArray(audio.groupIds) ? audio.groupIds.filter((value): value is string => typeof value === 'string') : [],
    flags: {referenced: flags.referenced === true, unreferenced: flags.unreferenced === true, variant: flags.variant === true, variantKind: str(flags.variantKind) || undefined, shell: flags.shell === true},
    migration: {status: 'discovered'}
  };
}

interface BoundJson {
  value: unknown;
  bytes: number;
  sha256: string;
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function readBoundJson(root: string, relativePath: string): BoundJson {
  const bytes = readFileSync(path.join(root, relativePath));
  return {value: JSON.parse(bytes.toString('utf8')) as unknown, bytes: bytes.length, sha256: sha256(bytes)};
}

function readLedger(document: BoundJson) {
  const value = rec(document.value);
  if (value.schemaVersion !== 1 || !Array.isArray(value.entries) || !Array.isArray(value.diagnostics)) throw new Error('Malformed completion ledger');
  if (!strictCompletionSummaryMatchesEntries(value.summary, value.entries)) throw new Error('Completion ledger strictComplete summary does not match entries');
  const generatedMarker = str(value.generatedMarker);
  if (!/^sha256:[a-f0-9]{64}$/.test(generatedMarker)) throw new Error('Malformed completion ledger marker');
  const entries = value.entries.flatMap((entry): CompletionEntry[] => {
    const v = rec(entry);
    const validation = rec(v.validation);
    if (!str(v.animationId) || !str(v.assetId) ||
      validation.mode !== 'strict' || validation.generatedMarker !== generatedMarker) {
      throw new Error('Malformed strict completion-ledger entry');
    }
    return [{animationId: str(v.animationId), assetId: str(v.assetId), workspace: str(v.workspace), manifestSha256: str(v.manifestSha256), route: str(v.route), registryModule: str(v.registryModule)}];
  });
  if (new Set(entries.map((entry) => entry.animationId)).size !== entries.length) throw new Error('Duplicate completion-ledger animationId');
  const statuses = new Set<MigrationStatus>(['discovered', 'preserved', 'audited', 'baseline-ready', 'specified', 'implementing', 'validating', 'complete', 'blocked', 'missing-source']);
  const diagnostics = value.diagnostics.flatMap((entry): CompletionDiagnostic[] => {const v = rec(entry), status = str(v.status) as MigrationStatus; return str(v.animationId) && statuses.has(status) ? [{animationId: str(v.animationId), status, workspace: str(v.workspace) || undefined, manifestSha256: str(v.manifestSha256) || undefined, errorCount: num(v.errorCount), errors: Array.isArray(v.errors) ? v.errors.filter((x): x is string => typeof x === 'string') : undefined}] : [];});
  return {generatedMarker, entries, diagnostics};
}

function normalizeReleaseDefinitions(value: unknown, animations: readonly CatalogAnimation[]): LessonReleaseDefinition[] {
  const document = rec(value);
  if (document.schemaVersion !== 1 || !Array.isArray(document.releases)) throw new Error('Malformed lesson release manifest');
  const animationById = new Map(animations.map((animation) => [animation.animationId, animation]));
  const definitions = document.releases.map((entry): LessonReleaseDefinition => {
    const release = rec(entry), expected = rec(release.expectedCounts), scope = rec(release.scope);
    if (!str(release.releaseId) || release.publicationMode !== 'atomic' || !Array.isArray(release.members) ||
      !Number.isInteger(expected.members) || Number(expected.members) < 1 ||
      !str(scope.collection) || !Number.isInteger(scope.grade) || !Number.isInteger(scope.lesson) ||
      scope.excludeNonMembers !== true) {
      throw new Error('Malformed atomic lesson release definition');
    }
    const members = release.members.map((memberValue, index) => {
      const member = rec(memberValue);
      const animationId = str(member.animationId), assetId = str(member.assetId);
      const releaseRole = str(member.releaseRole);
      const animation = animationById.get(animationId);
      if (!animationId || !assetId || member.ordinal !== index + 1 ||
        !['active-xml-referenced-page', 'course-shell'].includes(releaseRole) ||
        animation?.assetId !== assetId) {
        throw new Error(`${str(release.releaseId)}: malformed or stale release member ${index + 1}`);
      }
      return Object.freeze({
        animationId,
        assetId,
        releaseRole: releaseRole as LessonReleaseDefinition['members'][number]['releaseRole'],
      });
    });
    if (members.length !== expected.members ||
      new Set(members.map((member) => member.animationId)).size !== members.length ||
      new Set(members.map((member) => member.assetId)).size !== members.length) {
      throw new Error(`${str(release.releaseId)}: release membership is incomplete or duplicated`);
    }
    const activePages = release.members.filter((member) => rec(member).releaseRole === 'active-xml-referenced-page').length;
    const shells = release.members.filter((member) => rec(member).releaseRole === 'course-shell').length;
    if (activePages !== expected.activeXmlReferencedPages || shells !== expected.courseShells) {
      throw new Error(`${str(release.releaseId)}: release role counts differ from expectedCounts`);
    }
    const definition: LessonReleaseDefinition = Object.freeze({
      releaseId: str(release.releaseId),
      publicationMode: 'atomic',
      expectedMemberCount: Number(expected.members),
      scope: Object.freeze({
        collection: str(scope.collection),
        grade: Number(scope.grade),
        lesson: Number(scope.lesson),
        excludeNonMembers: true,
      }),
      members: Object.freeze(members),
    });
    const protectedReleaseId = protectedAtomicReleaseIdForScope(
      definition.scope.grade,
      definition.scope.lesson,
    );
    if (
      (protectedReleaseId !== undefined ||
        isProtectedAtomicReleaseId(definition.releaseId)) &&
      definition.releaseId !== protectedReleaseId
    ) {
      throw new Error(`${definition.releaseId}: invalid protected atomic lesson release definition`);
    }
    return definition;
  });
  if (new Set(definitions.map((release) => release.releaseId)).size !== definitions.length) throw new Error('Duplicate lesson releaseId');
  const allMembers = definitions.flatMap((release) => release.members.map((member) => member.animationId));
  if (new Set(allMembers).size !== allMembers.length) throw new Error('Animation belongs to multiple lesson releases');
  return definitions;
}

function normalizeReleaseLedgerEntries(value: unknown): LessonReleaseLedgerEntry[] {
  const document = rec(value);
  const markerBase = {...document};
  delete markerBase.generatedMarker;
  const expectedMarker = `sha256:${sha256(Buffer.from(`${JSON.stringify(markerBase, null, 2)}\n`))}`;
  if (document.schemaVersion !== 1 ||
    str(document.generatedMarker) !== expectedMarker ||
    !Array.isArray(document.releases)) {
    throw new Error('Malformed lesson release ledger');
  }
  const entries = document.releases.map((entry): LessonReleaseLedgerEntry => {
    const release = rec(entry), gate = rec(release.gate);
    if (!str(release.releaseId) || !str(release.publicationMode) ||
      !Number.isInteger(release.expectedMemberCount) || !Number.isInteger(release.strictCompleteCount) ||
      !Number.isInteger(release.missingCount) || !Number.isInteger(release.assetMismatchCount) ||
      typeof release.published !== 'boolean' || !str(release.status) ||
      !str(gate.kind) || !Number.isInteger(gate.requiredCount) ||
      !Number.isInteger(gate.admittedCount) || typeof gate.open !== 'boolean' ||
      !Array.isArray(release.members)) {
      throw new Error('Malformed lesson release-ledger entry');
    }
    const members = release.members.map((entryValue) => {
      const member = rec(entryValue);
      const ledgerAssetId = member.ledgerAssetId === null ? null : str(member.ledgerAssetId);
      if (!str(member.animationId) || !str(member.assetId) ||
        typeof member.strictComplete !== 'boolean' ||
        !['missing', 'asset-mismatch', 'strict-complete'].includes(str(member.status)) ||
        (member.ledgerAssetId !== null && !ledgerAssetId)) {
        throw new Error(`${str(release.releaseId)}: malformed release-ledger member`);
      }
      return Object.freeze({
        animationId: str(member.animationId),
        assetId: str(member.assetId),
        strictComplete: member.strictComplete,
        status: str(member.status),
        ledgerAssetId,
      });
    });
    const strictCompleteCount = members.filter((member) => member.status === 'strict-complete' && member.strictComplete).length;
    const missingCount = members.filter((member) => member.status === 'missing' && !member.strictComplete).length;
    const assetMismatchCount = members.filter((member) => member.status === 'asset-mismatch' && !member.strictComplete).length;
    if (members.length !== release.expectedMemberCount ||
      new Set(members.map((member) => member.animationId)).size !== members.length ||
      strictCompleteCount !== release.strictCompleteCount ||
      missingCount !== release.missingCount ||
      assetMismatchCount !== release.assetMismatchCount ||
      strictCompleteCount + missingCount + assetMismatchCount !== members.length ||
      gate.requiredCount !== release.expectedMemberCount ||
      gate.admittedCount !== release.strictCompleteCount ||
      gate.open !== release.published) {
      throw new Error(`${str(release.releaseId)}: release-ledger member counts are inconsistent`);
    }
    return {
      releaseId: str(release.releaseId),
      publicationMode: str(release.publicationMode),
      expectedMemberCount: Number(release.expectedMemberCount),
      strictCompleteCount: Number(release.strictCompleteCount),
      missingCount: Number(release.missingCount),
      assetMismatchCount: Number(release.assetMismatchCount),
      published: release.published,
      status: str(release.status),
      gate: Object.freeze({
        kind: str(gate.kind),
        requiredCount: Number(gate.requiredCount),
        admittedCount: Number(gate.admittedCount),
        open: gate.open,
      }),
      members: Object.freeze(members),
    };
  });
  if (new Set(entries.map((entry) => entry.releaseId)).size !== entries.length) throw new Error('Duplicate lesson release-ledger releaseId');
  return entries;
}

function matchesBinding(bindingValue: unknown, expected: {path: string; bytes: number; sha256: string; generatedMarker?: string}): boolean {
  const binding = rec(bindingValue);
  return binding.path === expected.path &&
    binding.bytes === expected.bytes &&
    binding.sha256 === expected.sha256 &&
    (expected.generatedMarker === undefined || binding.generatedMarker === expected.generatedMarker);
}

function readPublication(root: string, animations: readonly CatalogAnimation[], completionDocument: BoundJson, completionLedger: ReturnType<typeof readLedger>): PublicationCatalog {
  const diagnostics: string[] = [];
  let manifestDocument: BoundJson | null = null;
  let releaseLedgerDocument: BoundJson | null = null;
  let definitions: LessonReleaseDefinition[] = [];
  let ledgerEntries: LessonReleaseLedgerEntry[] = [];
  let bindingsCurrent = false;

  try {
    manifestDocument = readBoundJson(root, RELEASE_MANIFEST_PATH);
    definitions = normalizeReleaseDefinitions(manifestDocument.value, animations);
  } catch (error) {
    diagnostics.push(`lesson release manifest unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!definitions.some((definition) => definition.releaseId === G4_L3_ATOMIC_RELEASE_ID)) {
    definitions.push(G4_L3_PROTECTED_FALLBACK);
    diagnostics.push('G4 L3 protected release definition is missing; its whole lesson scope remains unpublished');
  }

  try {
    releaseLedgerDocument = readBoundJson(root, RELEASE_LEDGER_PATH);
    ledgerEntries = normalizeReleaseLedgerEntries(releaseLedgerDocument.value);
    const ledger = rec(releaseLedgerDocument.value), sources = rec(ledger.sources);
    bindingsCurrent = Boolean(manifestDocument &&
      matchesBinding(sources.lessonReleases, {
        path: RELEASE_MANIFEST_PATH,
        bytes: manifestDocument.bytes,
        sha256: manifestDocument.sha256,
      }) &&
      matchesBinding(sources.completionLedger, {
        path: COMPLETION_LEDGER_PATH,
        bytes: completionDocument.bytes,
        sha256: completionDocument.sha256,
        generatedMarker: completionLedger.generatedMarker,
      }));
    if (!bindingsCurrent) diagnostics.push('lesson release-ledger source bindings are stale or malformed');
  } catch (error) {
    diagnostics.push(`lesson release ledger unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }

  const artifactSha256 = Object.freeze({
    releaseManifest: manifestDocument?.sha256 ?? null,
    releaseLedger: releaseLedgerDocument?.sha256 ?? null,
    completionLedger: completionDocument.sha256,
  });
  const releases = deriveLessonReleaseStates({
    artifactSha256,
    bindingsCurrent,
    completions: completionLedger.entries,
    definitions,
    ledgerEntries,
    // Intentionally hard-closed. Do not replace this with parsed JSON or
    // self-asserted booleans. A future adapter must independently verify the
    // signed EvidenceReceiptV1, signer authority/revocation, chained
    // Controlled Preview/Staged/Owner promotion bundle, trusted build commit,
    // source manifest, renderer manifest, and all three hashes above.
    promotions: [],
  });
  return {
    definitions: Object.freeze(definitions),
    releases: Object.freeze(releases),
    diagnostics: Object.freeze(diagnostics),
    artifactSha256,
  };
}

type CatalogCacheStore = {value?: AnimationCatalog; inputIdentity?: string};
const catalogCacheGlobal = globalThis as typeof globalThis & {
  __helpMathCatalogCache?: CatalogCacheStore;
};
const catalogCache = catalogCacheGlobal.__helpMathCatalogCache ??= {};

export function getCatalog(): AnimationCatalog {
  const root = rootDirectory();
  const inputIdentity = catalogInputIdentity(root);
  if (catalogCache.value && catalogCache.inputIdentity === inputIdentity) return catalogCache.value;
  const raw = rec(JSON.parse(readFileSync(path.join(root, CATALOG_PATH), 'utf8')) as unknown);
  if (raw.schemaVersion !== 1 || !Array.isArray(raw.animations)) throw new Error('Malformed animation catalog');
  const normalized = raw.animations.map(normalizeAnimation), ids = new Set<string>();
  for (const animation of normalized) {if (ids.has(animation.animationId)) throw new Error(`Duplicate animationId: ${animation.animationId}`); ids.add(animation.animationId);}
  const completionDocument = readBoundJson(root, COMPLETION_LEDGER_PATH);
  const ledger = readLedger(completionDocument), missing = rec(JSON.parse(readFileSync(path.join(root, MISSING_REFERENCES_PATH), 'utf8')) as unknown);
  const missingReferences = [...(Array.isArray(missing.course) ? missing.course.map((entry, i) => normalizeMissingReference(entry, i, 'course')) : []), ...(Array.isArray(missing.keyterm) ? missing.keyterm.map((entry, i) => normalizeMissingReference(entry, i, 'keyterm')) : [])] as MissingReference[];
  const animations = applyCompletionLedger(normalized, ledger.entries, ledger.diagnostics);
  const result: AnimationCatalog = {
    schemaVersion: 1,
    animations,
    missingReferences,
    origin: 'generated',
    completionLedger: ledger,
    publication: readPublication(root, animations, completionDocument, ledger),
  };
  catalogCache.value = result;
  catalogCache.inputIdentity = inputIdentity;
  return result;
}
export const findAnimation = (id: string) => getCatalog().animations.find((animation) => animation.animationId === id);
export const completeAnimations = (catalog = getCatalog()) => catalog.animations.filter((animation) => animation.migration.status === 'complete');
export const isAnimationPublished = (catalog: AnimationCatalog, animation: CatalogAnimation | string) => {
  const target = typeof animation === 'string'
    ? catalog.animations.find((candidate) => candidate.animationId === animation)
    : animation;
  return target ? isTargetPublished(target, catalog.publication) : false;
};
export const publishedAnimations = (catalog = getCatalog()) => catalog.animations.filter((animation) => isAnimationPublished(catalog, animation));
export const isLessonReleasePublished = (catalog: AnimationCatalog, releaseId: string) => isReleasePublished(catalog.publication, releaseId);
export function catalogSummary(catalog = getCatalog()) {const statusCounts: Record<string, number> = {}; for (const item of catalog.animations) statusCounts[item.migration.status] = (statusCounts[item.migration.status] ?? 0) + 1; return {paths: catalog.animations.length, canonical: catalog.animations.filter((x) => x.isCanonical).length, aliases: catalog.animations.filter((x) => !x.isCanonical).length, complete: statusCounts.complete ?? 0, published: publishedAnimations(catalog).length, blocked: statusCounts.blocked ?? 0, missing: catalog.missingReferences.length, statusCounts};}
export function resolveCatalogSource(animation: CatalogAnimation) {const sourceRoot = path.resolve(rootDirectory(), 'source-assets/flash/HELP MATH_ORIGINAL FILES'), candidate = path.resolve(sourceRoot, animation.source.path); return candidate.startsWith(`${sourceRoot}${path.sep}`) && existsSync(candidate) && statSync(candidate).isFile() ? candidate : undefined;}
