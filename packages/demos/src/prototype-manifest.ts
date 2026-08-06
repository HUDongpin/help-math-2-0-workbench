import type {MovieMetadata} from './contract';

export type PrototypeKey = 'conversion-1-2' | 'conversion-1-4';

export interface PrototypeManifestEntry {
  readonly key: PrototypeKey;
  readonly preferredAnimationId: string;
  readonly sourceBasenames: readonly string[];
  readonly movie: MovieMetadata;
  readonly title: Readonly<{en: string; es: string}>;
}

export const prototypeManifest: readonly PrototypeManifestEntry[] = Object.freeze([
  Object.freeze({
    key: 'conversion-1-2',
    preferredAnimationId: 'formula-elementary-conversion-01-02',
    sourceBasenames: Object.freeze(['conversion_1_2.swf', 'copy of conversion_1_2.swf']),
    movie: Object.freeze({
      stage: Object.freeze({width: 780, height: 379}),
      fps: 12,
      frameCount: 109,
      durationMs: 9083
    }),
    title: Object.freeze({
      en: '1 gallon = 128 fluid ounces',
      es: '1 galón = 128 onzas líquidas'
    })
  }),
  Object.freeze({
    key: 'conversion-1-4',
    preferredAnimationId: 'formula-elementary-conversion-01-04',
    sourceBasenames: Object.freeze(['conversion_1_4.swf', 'copy of conversion_1_4.swf']),
    movie: Object.freeze({
      stage: Object.freeze({width: 780, height: 379}),
      fps: 12,
      frameCount: 67,
      durationMs: 5583
    }),
    title: Object.freeze({
      en: '1 liter = 1000 milliliters',
      es: '1 litro = 1000 mililitros'
    })
  })
]);

function basename(value: string): string {
  return value.replaceAll('\\', '/').split('/').at(-1)?.toLowerCase() ?? '';
}

export function matchPrototype(input: {
  animationId?: string | null;
  sourcePath?: string | null;
}): PrototypeManifestEntry | undefined {
  const animationId = input.animationId?.toLowerCase();
  const sourceBasename = basename(input.sourcePath ?? '');

  return prototypeManifest.find(
    (entry) =>
      entry.preferredAnimationId === animationId ||
      entry.key === animationId ||
      entry.sourceBasenames.includes(sourceBasename)
  );
}
