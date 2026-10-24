import type {WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const HFR_RENDERER_BINDING = 'generated-typescript-hfr-v1';

const PLACEMENT_ID = String.raw`shared-(?:nms002|geo001|alg001|dat001)-l\d{2}-p\d{3}`;

const HFR_RUNTIME_QUERY = Object.freeze({
  frameDomain: 'root',
  language: 'fixed-en' as const,
  scenario: 'hfr',
  seed: '0',
});

const STATIC_RUNTIME_QUERY = Object.freeze({
  frameDomain: 'root',
  language: 'fixed-en' as const,
  scenario: 'source-static-frame',
  seed: '0',
});

/** Pages whose modules reject the generic root query. The frozen snapshot
 * leaves them unavailable, so the course projection has to supply the domain. */
const NESTED_COURSE_QUERY = Object.freeze({
  'shared-alg001-l06-p001': Object.freeze({
    frameDomain: 'sprite-142',
    language: 'route-locale' as const,
    scenario: 'source-static-frame',
    seed: '0',
  }),
  'shared-alg001-l12-p013': Object.freeze({
    frameDomain: 'sprite-63',
    language: 'fixed-en' as const,
    scenario: 'source-static-frame',
    seed: '0',
  }),
  'shared-alg001-l12-p015': Object.freeze({
    frameDomain: 'sprite-76',
    language: 'fixed-en' as const,
    scenario: 'source-static-frame',
    seed: '0',
  }),
  'shared-nms002-l02-p002': Object.freeze({
    frameDomain: 'sprite-310',
    language: 'route-locale' as const,
    scenario: 'source-real-world',
    seed: '0',
  }),
  'shared-nms002-l02-p052': Object.freeze({
    frameDomain: 'sprite-350',
    language: 'route-locale' as const,
    scenario: 'intro',
    seed: '0',
  }),
  'shared-nms002-l01-p047': Object.freeze({
    frameDomain: 'sprite-1024',
    language: 'route-locale' as const,
    scenario: 'source-quiz',
    seed: '0',
  }),
  'shared-alg001-l06-p060': Object.freeze({
    frameDomain: 'sprite-973',
    language: 'fixed-en' as const,
    scenario: 'source-quiz',
    seed: '0',
  }),
  'shared-nms002-l02-p053': Object.freeze({
    frameDomain: 'sprite-187',
    language: 'fixed-en' as const,
    scenario: 'source-directions-v1',
    seed: '0',
  }),
  'shared-geo001-l06-p001': Object.freeze({
    frameDomain: 'sprite-142',
    language: 'route-locale' as const,
    scenario: 'source-introduction',
    seed: '0',
  }),
  'shared-geo001-l07-p001': Object.freeze({
    frameDomain: 'sprite-142',
    language: 'route-locale' as const,
    scenario: 'source-introduction',
    seed: '0',
  }),
  'shared-nms002-l09-p003': Object.freeze({
    frameDomain: 'sprite-246',
    language: 'fixed-en' as const,
    scenario: 'source-static-frame',
    seed: '0',
  }),
});

export interface CoursePlaybackProjection<T extends WholeLessonPlayerPage> {
  readonly pages: readonly T[];
  readonly unavailableAnimationIds: readonly string[];
  readonly hfrPageCount: number;
}

/** Loader entries are registered. Metadata records which of them are HFR. */
export function readLocalRegistryBindings(source: string): ReadonlyMap<string, string | null> {
  const registry = new Map<string, string | null>();
  for (const match of source.matchAll(new RegExp(`'(${PLACEMENT_ID})': \\(\\) => import\\(`, 'g'))) {
    const key = match[1];
    if (key && !registry.has(key)) registry.set(key, null);
  }
  for (const match of source.matchAll(new RegExp(
    `'(${PLACEMENT_ID})': Object\\.freeze\\(\\{[^}]*rendererBindingKind: '([^']+)'`,
    'g',
  ))) {
    const key = match[1];
    const kind = match[2];
    if (key && kind) registry.set(key, kind);
  }
  return registry;
}

export function projectRegisteredCoursePages<T extends WholeLessonPlayerPage>(
  pages: readonly T[],
  registry: ReadonlyMap<string, string | null>,
): CoursePlaybackProjection<T> {
  let hfrPageCount = 0;
  const projected = pages.map((page) => {
    if (!registry.has(page.animationId)) return page;
    if (registry.get(page.animationId) === HFR_RENDERER_BINDING) {
      hfrPageCount += 1;
      return Object.freeze({
        ...page,
        rendererAvailability: Object.freeze({
          kind: 'registered' as const,
          moduleKey: page.animationId,
          runtimeQuery: HFR_RUNTIME_QUERY,
        }),
      });
    }
    const nested = NESTED_COURSE_QUERY[page.animationId as keyof typeof NESTED_COURSE_QUERY];
    if (page.rendererAvailability.kind === 'registered') {
      const query = page.rendererAvailability.runtimeQuery;
      if (!nested || (query?.frameDomain === nested.frameDomain && query.scenario === nested.scenario && query.language === nested.language)) {
        return page;
      }
    }
    return Object.freeze({
      ...page,
      rendererAvailability: Object.freeze({
        kind: 'registered' as const,
        moduleKey: page.animationId,
        runtimeQuery: nested ?? STATIC_RUNTIME_QUERY,
      }),
    });
  });
  return Object.freeze({
    pages: Object.freeze(projected),
    unavailableAnimationIds: Object.freeze(projected
      .filter((page) => page.rendererAvailability.kind !== 'registered')
      .map((page) => page.animationId)),
    hfrPageCount,
  });
}
