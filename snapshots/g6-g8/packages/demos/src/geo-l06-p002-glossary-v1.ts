import GLOSSARY from './generated/geo001-l06-p002-glossary-v1.json';
import type {GeoL06P002MainState} from './geo-l06-p002-display-state-v1';

type Locale = 'en' | 'es';
type Entry = Readonly<{
  id: string;
  sourceKeyAttribute: string;
  labels: Readonly<Record<Locale, string>>;
  definitions: Readonly<Record<Locale, string>>;
}>;
type Control = Readonly<{
  sourceCharacterId: number;
  sourceFrame: number;
  sourceKeyAttribute: string;
  entryId: string;
}>;
const DATA = GLOSSARY as unknown as Readonly<{
  animationId: string;
  sourceSwfSha256: string;
  controls: readonly Control[];
  entries: readonly Entry[];
  originalHostLookupVerified: boolean;
  companionMediaVerified: boolean;
  sourceConflicts: readonly Readonly<{key: string}>[];
}>;
const ENTRY_BY_ID = new Map(DATA.entries.map(entry => [entry.id, entry]));

export interface GeoL06P002SourceGlossaryTerm {
  readonly id: string;
  readonly sourceCharacterId: number;
  readonly sourceKeyAttribute: string;
  readonly label: string;
  readonly definition: string;
  readonly sourceDefinitionConflict: boolean;
}

export const GEO_L06_P002_GLOSSARY_STATUS = Object.freeze({
  originalHostLookupVerified: DATA.originalHostLookupVerified,
  companionMediaVerified: DATA.companionMediaVerified,
  hostInteractionAccepted: false,
  surfaceEnglishSourceConflict: DATA.sourceConflicts.some(conflict => conflict.key === 'Surface'),
} as const);

/** Source key/definition projection only. It does not open a modal, pause
 * playback, resolve companion media, or prove legacy host lookup behavior. */
export function geoL06P002VisibleGlossaryTerms(
  state: GeoL06P002MainState,
): readonly GeoL06P002SourceGlossaryTerm[] {
  if (state.animationId !== DATA.animationId ||
      DATA.sourceSwfSha256 !== '3f340d0201e0f4eed1c8e73d364641d5de4b625e64c33680059842b523002c44') {
    throw Error('GEO_L06_P002_GLOSSARY_SOURCE_DRIFT');
  }
  const visible = new Set(state.sourceGlossaryButtonIds);
  return Object.freeze(DATA.controls.filter(control => visible.has(control.sourceCharacterId) &&
    state.frame >= control.sourceFrame).map(control => {
    const entry = ENTRY_BY_ID.get(control.entryId);
    if (!entry || entry.sourceKeyAttribute !== control.sourceKeyAttribute) {
      throw Error('GEO_L06_P002_GLOSSARY_ENTRY_DRIFT');
    }
    return Object.freeze({
      id: entry.id,
      sourceCharacterId: control.sourceCharacterId,
      sourceKeyAttribute: control.sourceKeyAttribute,
      label: entry.labels[state.language],
      definition: entry.definitions[state.language],
      sourceDefinitionConflict: control.sourceKeyAttribute === 'Surface' &&
        GEO_L06_P002_GLOSSARY_STATUS.surfaceEnglishSourceConflict,
    });
  }));
}
