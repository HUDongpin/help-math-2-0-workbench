import TEXT from './generated/geo001-l06-p002-text-ir-v1.json';
import type {GeoL06P002MainState} from './geo-l06-p002-display-state-v1';

type Key = 'Area' | 'Surface' | 'Two dimensional' | 'Figure';
type Term = 'radius' | 'diameter';
const definitions = new Map(TEXT.definitions.map(item => [item.characterId, item]));
const definition = definitions.get(209)?.runs.map(run => run.text).join('') ?? '';
const radiusDiameter = definitions.get(226)?.runs.map(run => run.text).join('') ?? '';
if (TEXT.animationId !== 'shared-geo001-l06-p002' ||
    TEXT.sourceSwfSha256 !== '3f340d0201e0f4eed1c8e73d364641d5de4b625e64c33680059842b523002c44' ||
    definition !== 'Area is the amount of surface in a two-dimensional figure.' ||
    radiusDiameter !== 'radius  diameter' ||
    definitions.get(227)?.runs.map(run => run.text).join('') !== ',') {
  throw Error('GEO_L06_P002_TEACHING_SOURCE_DRIFT');
}

const PARTS: readonly Readonly<{text: string; key: Key | null}>[] = Object.freeze([
  {text: 'Area', key: 'Area'},
  {text: ' is the amount of ', key: null},
  {text: 'surface', key: 'Surface'},
  {text: ' in a ', key: null},
  {text: 'two-dimensional', key: 'Two dimensional'},
  {text: ' ', key: null},
  {text: 'figure', key: 'Figure'},
  {text: '.', key: null},
] as const).map(part => Object.freeze(part));
if (PARTS.map(part => part.text).join('') !== definition) {
  throw Error('GEO_L06_P002_TEACHING_SEGMENT_DRIFT');
}
const HIGHLIGHT_IDS = new Map<number, Key>([
  [215, 'Area'], [219, 'Surface'], [221, 'Two dimensional'], [222, 'Figure'],
]);
const TERM_HIGHLIGHT_IDS = new Map<number, Term>([[228, 'radius'], [229, 'diameter']]);

export interface GeoL06P002TeachingState {
  readonly sourceContentLanguage: 'en';
  readonly requestedLanguage: 'en' | 'es';
  readonly spanishSourceFallback: boolean;
  readonly definitionVisible: boolean;
  readonly definitionOpacity: number;
  readonly definition: string;
  readonly parts: readonly Readonly<{text: string; key: Key | null; highlighted: boolean}>[];
  readonly highlightedKey: Key | null;
  readonly termsVisible: boolean;
  readonly termsOpacity: number;
  readonly terms: 'radius, diameter';
  readonly highlightedTerm: Term | null;
  readonly sourceTeachingTextIds: readonly number[];
}

/** Source teaching state, not a transcript or audio synchronization model. */
export function geoL06P002TeachingState(state: GeoL06P002MainState): GeoL06P002TeachingState {
  const active = new Set(state.sourceTextIds);
  const opacityFor = (characterId: number) => {
    const objects = state.objects.filter(object => object.characterId === characterId);
    if (objects.length > 1) throw Error('GEO_L06_P002_TEACHING_INSTANCE_DRIFT');
    const color = objects[0]?.colorTransform;
    if (!color) return 0;
    if (color.addAlpha !== undefined) throw Error('GEO_L06_P002_TEACHING_ALPHA_DRIFT');
    const alpha = color.factorAlpha === undefined ? 256 : Number(color.factorAlpha);
    if (!Number.isSafeInteger(alpha) || alpha < 0 || alpha > 256) {
      throw Error('GEO_L06_P002_TEACHING_ALPHA_DRIFT');
    }
    return alpha / 256;
  };
  const highlights = [...HIGHLIGHT_IDS].filter(([id]) => active.has(id));
  const termHighlights = [...TERM_HIGHLIGHT_IDS].filter(([id]) => active.has(id));
  const definitionOpacity = opacityFor(209);
  const termsOpacity = opacityFor(226);
  if (highlights.length > 1 || termHighlights.length > 1 ||
      (highlights.length > 0 && !active.has(209)) ||
      (termHighlights.length > 0 && !active.has(226)) ||
      (active.has(226) !== active.has(227)) ||
      termsOpacity !== opacityFor(227)) {
    throw Error('GEO_L06_P002_TEACHING_FRAME_DRIFT');
  }
  const highlightedKey = highlights[0]?.[1] ?? null;
  const sourceTeachingTextIds = Object.freeze([...active].filter(id => id >= 209).sort((a, b) => a - b));
  return Object.freeze({
    sourceContentLanguage: 'en', requestedLanguage: state.language,
    spanishSourceFallback: state.language === 'es',
    definitionVisible: definitionOpacity > 0, definitionOpacity, definition,
    parts: Object.freeze(PARTS.map(part => Object.freeze({...part,
      highlighted: part.key !== null && part.key === highlightedKey}))),
    highlightedKey,
    termsVisible: termsOpacity > 0, termsOpacity, terms: 'radius, diameter',
    highlightedTerm: termHighlights[0]?.[1] ?? null,
    sourceTeachingTextIds,
  });
}
