import 'server-only';
import {existsSync, readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import {applyCompletionLedger, normalizeClassificationEvidence, normalizeMissingReference, normalizeXmlReferences, type CompletionDiagnostic, type CompletionEntry, type MigrationStatus} from './catalog-overlays';

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
export interface AnimationCatalog {schemaVersion: 1; animations: CatalogAnimation[]; missingReferences: MissingReference[]; origin: 'generated' | 'fallback'; completionLedger: {entries: CompletionEntry[]; diagnostics: CompletionDiagnostic[]}}

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

function readLedger(root: string) {
  const value = rec(JSON.parse(readFileSync(path.join(root, 'catalog/completion-ledger.json'), 'utf8')) as unknown);
  if (value.schemaVersion !== 1 || !Array.isArray(value.entries) || !Array.isArray(value.diagnostics)) throw new Error('Malformed completion ledger');
  const entries = value.entries.flatMap((entry): CompletionEntry[] => {const v = rec(entry); return str(v.animationId) && str(v.assetId) ? [{animationId: str(v.animationId), assetId: str(v.assetId), workspace: str(v.workspace), manifestSha256: str(v.manifestSha256), route: str(v.route), registryModule: str(v.registryModule)}] : [];});
  const statuses = new Set<MigrationStatus>(['discovered', 'preserved', 'audited', 'baseline-ready', 'specified', 'implementing', 'validating', 'complete', 'blocked', 'missing-source']);
  const diagnostics = value.diagnostics.flatMap((entry): CompletionDiagnostic[] => {const v = rec(entry), status = str(v.status) as MigrationStatus; return str(v.animationId) && statuses.has(status) ? [{animationId: str(v.animationId), status, workspace: str(v.workspace) || undefined, manifestSha256: str(v.manifestSha256) || undefined, errorCount: num(v.errorCount), errors: Array.isArray(v.errors) ? v.errors.filter((x): x is string => typeof x === 'string') : undefined}] : [];});
  return {entries, diagnostics};
}

let cache: AnimationCatalog | undefined;
export function getCatalog(): AnimationCatalog {
  if (process.env.NODE_ENV === 'production' && cache) return cache;
  const root = rootDirectory();
  const raw = rec(JSON.parse(readFileSync(path.join(root, 'catalog/animations.json'), 'utf8')) as unknown);
  if (raw.schemaVersion !== 1 || !Array.isArray(raw.animations)) throw new Error('Malformed animation catalog');
  const normalized = raw.animations.map(normalizeAnimation), ids = new Set<string>();
  for (const animation of normalized) {if (ids.has(animation.animationId)) throw new Error(`Duplicate animationId: ${animation.animationId}`); ids.add(animation.animationId);}
  const ledger = readLedger(root), missing = rec(JSON.parse(readFileSync(path.join(root, 'catalog/missing-references.json'), 'utf8')) as unknown);
  const missingReferences = [...(Array.isArray(missing.course) ? missing.course.map((entry, i) => normalizeMissingReference(entry, i, 'course')) : []), ...(Array.isArray(missing.keyterm) ? missing.keyterm.map((entry, i) => normalizeMissingReference(entry, i, 'keyterm')) : [])] as MissingReference[];
  const result: AnimationCatalog = {schemaVersion: 1, animations: applyCompletionLedger(normalized, ledger.entries, ledger.diagnostics), missingReferences, origin: 'generated', completionLedger: ledger};
  if (process.env.NODE_ENV === 'production') cache = result;
  return result;
}
export const findAnimation = (id: string) => getCatalog().animations.find((animation) => animation.animationId === id);
export const completeAnimations = () => getCatalog().animations.filter((animation) => animation.migration.status === 'complete');
export function catalogSummary(catalog = getCatalog()) {const statusCounts: Record<string, number> = {}; for (const item of catalog.animations) statusCounts[item.migration.status] = (statusCounts[item.migration.status] ?? 0) + 1; return {paths: catalog.animations.length, canonical: catalog.animations.filter((x) => x.isCanonical).length, aliases: catalog.animations.filter((x) => !x.isCanonical).length, complete: statusCounts.complete ?? 0, blocked: statusCounts.blocked ?? 0, missing: catalog.missingReferences.length, statusCounts};}
export function resolveCatalogSource(animation: CatalogAnimation) {const sourceRoot = path.resolve(rootDirectory(), 'source-assets/flash/HELP MATH_ORIGINAL FILES'), candidate = path.resolve(sourceRoot, animation.source.path); return candidate.startsWith(`${sourceRoot}${path.sep}`) && existsSync(candidate) && statSync(candidate).isFile() ? candidate : undefined;}
