import type {AudioTrack} from './contract';

const evidence = Object.freeze({
  'conversion-1-1': Object.freeze({
    en: Object.freeze({durationMs: 2893, sha256: 'ac64efe44e1960d1abde5fb9aeb0c2d38509ae5c2bafd86351b53d1a4177a66a'}),
    es: Object.freeze({durationMs: 4743, sha256: 'e1667a7b14a9ac38d885020a3f5fae0e947abbac74faf7231ceaff2198368d9c'}),
  }),
  'conversion-1-2': Object.freeze({
    en: Object.freeze({durationMs: 3623, sha256: '4f972d06f68779806b7938363acd476e26a70af0b1e4584efd9d3c5a1180891a'}),
    es: Object.freeze({durationMs: 5577, sha256: '23941719e38912fa61faf34cf0f4fc175d258009ddb581b079d586517f33931c'}),
  }),
  'conversion-1-3': Object.freeze({
    en: Object.freeze({durationMs: 2737, sha256: '8cb6c9995b7f27f805f4f581857ac80034502eead869f86c007f871d71618281'}),
    es: Object.freeze({durationMs: 3675, sha256: '8658e12deb64b1eb58f4503e48766432de336032f05e6d5ce5cb00f1d6f87887'}),
  }),
  'conversion-1-4': Object.freeze({
    en: Object.freeze({durationMs: 3206, sha256: '4cb95f75f46e9bb14acc59043d6ee5367d7ad2e460a78ba53371bca39456e009'}),
    es: Object.freeze({durationMs: 4092, sha256: '756ee31becb867396837a7c16a66d72a6e011da232e338e2362996767f309462'}),
  }),
});

export type FormulaAudioKey = keyof typeof evidence;

export function formulaAudioTracks(key: FormulaAudioKey): readonly AudioTrack[] {
  const current = evidence[key];
  return Object.freeze([
    Object.freeze({
      id: `${key}-en`,
      language: 'en' as const,
      label: 'English audio',
      source: `/flash-assets/audio/formulas/${key}/en.mp3`,
      durationMs: current.en.durationMs,
      sha256: current.en.sha256,
      activation: 'user' as const,
      visibleWhen: Object.freeze(['en', 'es'] as const),
    }),
    Object.freeze({
      id: `${key}-es`,
      language: 'es' as const,
      label: 'Audio en español',
      source: `/flash-assets/audio/formulas/${key}/es.mp3`,
      durationMs: current.es.durationMs,
      sha256: current.es.sha256,
      activation: 'user' as const,
      visibleWhen: Object.freeze(['es'] as const),
    }),
  ]);
}
