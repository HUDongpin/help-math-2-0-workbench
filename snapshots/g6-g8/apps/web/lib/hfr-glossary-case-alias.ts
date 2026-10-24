import type {PageOnlyLessonGlossaryEntry} from './whole-lesson-player-descriptor';

type GlossaryKey = Pick<PageOnlyLessonGlossaryEntry, 'id' | 'sourceKeyAttribute'>;
type SourceRequest = Readonly<{dictionaryEntryId: string; sourceKeyAttribute?: string}>;

const foldKey = (value: unknown): string | null => typeof value === 'string' && value.length > 0 ? value.toLowerCase() : null;

/** A prior lesson entry and an HFR page entry for the same dictionary id may
 * differ only in the letter case of the source KeyAttribute: L11 P030 keeps
 * "rational numbers", the HFR pages bind "Rational Numbers" and their buttons
 * request "Rational numbers". Every source request for that id must fold to the
 * same key. The caller still requires labels, definitions and source assets to
 * be identical, so the existing bilingual entry is preserved unchanged. */
export function hfrGlossaryCaseAlias(existing: GlossaryKey, entry: GlossaryKey, requests: readonly SourceRequest[]): boolean {
  const key = foldKey(entry.sourceKeyAttribute), forId = requests.filter(term => term.dictionaryEntryId === entry.id);
  return existing.id === entry.id && key !== null && foldKey(existing.sourceKeyAttribute) === key &&
    forId.length > 0 && forId.every(term => foldKey(term.sourceKeyAttribute) === key);
}
