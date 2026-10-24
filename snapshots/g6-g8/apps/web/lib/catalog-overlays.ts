export type MigrationStatus = 'discovered' | 'preserved' | 'audited' | 'baseline-ready' | 'specified' | 'implementing' | 'validating' | 'complete' | 'blocked' | 'missing-source';
export type ClassificationEvidence = {source: string; path?: string; field?: string; value?: string};
export type CompletionEntry = {animationId: string; assetId: string; workspace: string; manifestSha256: string; route: string; registryModule: string};
export type CompletionDiagnostic = {animationId: string; workspace?: string; status: MigrationStatus; manifestSha256?: string; errorCount?: number; errors?: string[]};
type Target = {animationId: string; assetId: string; migration: {status: MigrationStatus; [key: string]: unknown}};

const text = (value: unknown) => typeof value === 'string' && value.trim() ? value : undefined;

export function strictCompletionSummaryMatchesEntries(summary: unknown, entries: readonly unknown[]): boolean {
  const value = summary && typeof summary === 'object' && !Array.isArray(summary)
    ? summary as Record<string, unknown>
    : {};
  return Number.isSafeInteger(value.strictComplete) && value.strictComplete === entries.length;
}

export function normalizeClassificationEvidence(value: unknown): ClassificationEvidence[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): ClassificationEvidence[] => {
    if (typeof entry === 'string' && entry.trim()) return [{source: 'catalog', value: entry}];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const item = entry as Record<string, unknown>;
    return [{source: text(item.source) ?? 'catalog', ...(text(item.path) ? {path: text(item.path)} : {}), ...(text(item.field) ? {field: text(item.field)} : {}), ...(text(item.value) ? {value: text(item.value)} : {})}];
  });
}

export function normalizeXmlReferences(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const item = entry as Record<string, unknown>;
    const sourceXmlPath = text(item.sourceXmlPath), expectedPath = text(item.expectedPath), filename = text(item.filename), syntax = text(item.syntax);
    const occurrence = typeof item.occurrence === 'number' ? item.occurrence : undefined;
    if (!sourceXmlPath && !expectedPath && !filename) return [];
    return [{sourceXmlPath: sourceXmlPath ?? '', ...(expectedPath ? {expectedPath} : {}), ...(filename ? {filename} : {}), ...(syntax ? {syntax} : {}), ...(occurrence !== undefined ? {occurrence} : {})}];
  });
}

export function applyCompletionLedger<T extends Target>(animations: readonly T[], entries: readonly CompletionEntry[], diagnostics: readonly CompletionDiagnostic[]): T[] {
  const complete = new Map(entries.map((entry) => [entry.animationId, entry]));
  const progress = new Map(diagnostics.map((entry) => [entry.animationId, entry]));
  return animations.map((animation) => {
    const entry = complete.get(animation.animationId);
    if (entry?.assetId === animation.assetId) return {...animation, migration: {...animation.migration, status: 'complete', completion: entry}};
    const diagnostic = progress.get(animation.animationId);
    const status: MigrationStatus = diagnostic?.status === 'complete' ? 'validating' : diagnostic?.status ?? 'discovered';
    return {...animation, migration: {...animation.migration, status, ...(diagnostic ? {workspace: diagnostic.workspace, strictDiagnostic: diagnostic} : {})}};
  });
}

export function normalizeMissingReference(entry: unknown, index: number, collection: 'course' | 'keyterm') {
  const item = entry && typeof entry === 'object' && !Array.isArray(entry) ? entry as Record<string, unknown> : {};
  const occurrences = Array.isArray(item.occurrences) ? item.occurrences : [];
  const first = occurrences[0] && typeof occurrences[0] === 'object' ? occurrences[0] as Record<string, unknown> : {};
  const point = first.knowledgePoint && typeof first.knowledgePoint === 'object' ? first.knowledgePoint as Record<string, unknown> : {};
  const page = first.page && typeof first.page === 'object' ? first.page as Record<string, unknown> : {};
  return {id: `${collection}-missing-${index + 1}`, path: text(item.expectedPath) ?? text(item.filename) ?? 'Unknown source', collection, grade: collection === 'keyterm' ? 'elementary' as const : typeof first.grade === 'number' ? first.grade : null, lesson: typeof first.lesson === 'number' ? first.lesson : null, titleEnglish: text(first.titleEnglish) ?? text(point.titleEnglish) ?? text(page.titleRaw) ?? 'Missing source', titleSpanish: text(first.titleSpanish) ?? text(point.titleSpanish), occurrenceCount: occurrences.length};
}
