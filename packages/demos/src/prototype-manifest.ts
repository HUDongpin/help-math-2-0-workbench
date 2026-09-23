import type {
  AnimationRuntimeMetadata,
  FrameDomainMetadata,
  MovieMetadata
} from './contract';
import {
  COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA,
  COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS
} from './timelines/generated/shell-course-g04-l03-additional-domain-assets';

export type PrototypeKey =
  | 'conversion-1-1'
  | 'conversion-1-2'
  | 'conversion-1-3'
  | 'conversion-1-4'
  | 'keyterm-elementary-acute-angle'
  | 'keyterm-elementary-computeghgh'
  | 'shell-course-g04-l01-index-local'
  | 'shell-course-g04-l03-index-local'
  | 'course-g03-l01-ts-008'
  | 'course-g03-l01-vb-004'
  | 'course-g03-l06-fq-002-review'
  | 'course-g03-l06-ti-001'
  | 'course-g03-l08-re-001'
  | 'course-g04-l01-ir-001'
  | 'course-g04-l03-ts-002'
  | 'course-g04-l03-ts-003'
  | 'course-g04-l03-ts-004'
  | 'course-g04-l03-ts-005'
  | 'course-g04-l03-ts-006'
  | 'course-g04-l03-ts-007'
  | 'course-g04-l03-ts-008'
  | 'course-g04-l03-vb-002'
  | 'course-g04-l03-vb-003'
  | 'course-g04-l03-vb-004'
  | 'course-g04-l03-vb-005'
  | 'course-g04-l03-vb-006'
  | 'course-g04-l03-vb-007'
  | 'course-g04-l03-vb-008'
  | 'course-g04-l03-vb-009'
  | 'course-g04-l03-rw-002'
  | 'course-g04-l03-rw-003'
  | 'course-g04-l03-rw-004'
  | 'course-g04-l03-in-002'
  | 'course-g04-l03-in-003'
  | 'course-g04-l03-in-004'
  | 'course-g04-l03-in-005'
  | 'course-g04-l03-in-006'
  | 'course-g04-l03-in-007'
  | 'course-g04-l03-in-008'
  | 'course-g04-l03-in-009'
  | 'course-g04-l03-in-010'
  | 'course-g04-l03-in-011'
  | 'course-g04-l03-in-012'
  | 'course-g04-l03-ir-001-341242cc'
  | 'course-g04-l03-gs-002'
  | 'course-g04-l03-ti-002'
  | 'course-g04-l03-ti-003'
  | 'course-g04-l03-ti-004'
  | 'course-g04-l03-ti-005'
  | 'course-g04-l03-ti-006'
  | 'course-g04-l03-fq-001'
  | 'course-g04-l03-fq-002'
  | 'course-g04-l03-fq-003'
  | 'course-g04-l09-gs-002'
  | 'course-g05-l04-ir-001-a662633d'
  | 'course-g05-l04-rw-003'
  | 'course-g05-l04-rw-004'
  | 'course-g05-l04-in-002'
  | 'course-g05-l04-in-007'
  | 'course-g05-l04-ts-002'
  | 'course-g05-l04-ts-003'
  | 'course-g05-l04-ts-004'
  | 'course-g05-l04-ts-005'
  | 'course-g05-l04-ts-006'
  | 'course-g05-l04-vb-002'
  | 'course-g05-l04-vb-005'
  | 'course-g05-l04-vb-006'
  | 'course-g05-l04-vb-008'
  | 'course-g05-l04-vb-009'
  | 'course-g05-l04-in-009'
  | 'course-g05-l04-in-012'
  | 'course-g05-l04-in-015'
  | 'course-g05-l04-in-020'
  | 'course-g05-l04-rw-002'
  | 'course-g05-l04-in-004'
  | 'course-g05-l04-in-018'
  | 'course-g05-l04-in-017'
  | 'course-g05-l04-in-016'
  | 'course-g05-l04-in-014'
  | 'course-g05-l04-in-013'
  | 'course-g05-l04-in-010'
  | 'course-g05-l04-in-005'
  | 'course-g05-l04-in-003'
  | 'course-g05-l04-vb-007'
  | 'course-g05-l04-vb-010'
  | 'course-g05-l04-vb-011'
  | 'course-g05-l04-ts-008'
  | 'course-g05-l04-ts-007'
  | 'course-g05-l04-vb-003'
  | 'course-g05-l04-vb-004'
  | 'course-g05-l04-in-006'
  | 'course-g05-l04-in-008'
  | 'course-g05-l04-in-011'
  | 'course-g05-l04-in-019'
  | 'course-g05-l04-in-021'
  | 'course-g05-l04-in-022'
  | 'course-g05-l04-ti-002'
  | 'course-g05-l04-ti-003'
  | 'course-g05-l04-ti-004'
  | 'course-g05-l04-ti-005'
  | 'course-g05-l04-ti-006'
  | 'course-g05-l04-ti-007'
  | 'course-g05-l04-ti-008'
  | 'course-g05-l04-ti-009'
  | 'course-g05-l04-gs-002'
  | 'course-g05-l04-fq-001'
  | 'course-g05-l04-fq-002'
  | 'course-g05-l04-fq-003'
  | 'course-g05-l13-rw-002';

export interface PrototypeManifestEntry {
  readonly key: PrototypeKey;
  readonly preferredAnimationId: string;
  readonly sourceBasenames: readonly string[];
  /** Root SWF metadata plus the renderer-addressable timeline domains. */
  readonly runtime: AnimationRuntimeMetadata;
  /** Legacy/default renderer timeline metadata retained for module compatibility. */
  readonly movie: MovieMetadata;
  readonly title: Readonly<{en: string; es: string}>;
}

function runtimeMetadata(
  width: number,
  height: number,
  fps: number,
  rootFrameCount: number,
  frameDomains?: readonly FrameDomainMetadata[],
  defaultFrameDomain?: string
): AnimationRuntimeMetadata {
  return Object.freeze({
    stage: Object.freeze({width, height}),
    fps,
    frameCount: rootFrameCount,
    durationMs: (rootFrameCount * 1000) / fps,
    ...(frameDomains?.length
      ? {frameDomains: Object.freeze(frameDomains)}
      : {}),
    ...(defaultFrameDomain ? {defaultFrameDomain} : {})
  });
}

function nestedDomain(
  id: string,
  frameCount: number,
  rootFrame: number
): FrameDomainMetadata {
  return Object.freeze({id, frameCount, rootFrame});
}

export const prototypeManifest: readonly PrototypeManifestEntry[] =
  Object.freeze([
    Object.freeze({
      key: 'conversion-1-1',
      preferredAnimationId: 'formula-elementary-conversion-01-01',
      sourceBasenames: Object.freeze([
        'conversion_1_1.swf',
        'copy of conversion_1_1.swf'
      ]),
      runtime: runtimeMetadata(780, 379, 12, 94),
      movie: Object.freeze({
        stage: Object.freeze({width: 780, height: 379}),
        fps: 12,
        frameCount: 94,
        durationMs: 7833
      }),
      title: Object.freeze({
        en: '1 cup = 8 fluid ounces',
        es: '1 taza = 8 onzas líquidas'
      })
    }),
    Object.freeze({
      key: 'conversion-1-2',
      preferredAnimationId: 'formula-elementary-conversion-01-02',
      sourceBasenames: Object.freeze([
        'conversion_1_2.swf',
        'copy of conversion_1_2.swf'
      ]),
      runtime: runtimeMetadata(780, 379, 12, 109),
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
      key: 'conversion-1-3',
      preferredAnimationId: 'formula-elementary-conversion-01-03',
      sourceBasenames: Object.freeze([
        'conversion_1_3.swf',
        'copy of conversion_1_3.swf'
      ]),
      runtime: runtimeMetadata(780, 379, 12, 170),
      movie: Object.freeze({
        stage: Object.freeze({width: 780, height: 379}),
        fps: 12,
        frameCount: 170,
        durationMs: 14167
      }),
      title: Object.freeze({
        en: '1 gallon = 4 quarts',
        es: '1 galón = 4 cuartos'
      })
    }),
    Object.freeze({
      key: 'conversion-1-4',
      preferredAnimationId: 'formula-elementary-conversion-01-04',
      sourceBasenames: Object.freeze([
        'conversion_1_4.swf',
        'copy of conversion_1_4.swf'
      ]),
      runtime: runtimeMetadata(780, 379, 12, 67),
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
    }),
    Object.freeze({
      key: 'keyterm-elementary-acute-angle',
      preferredAnimationId: 'keyterm-elementary-acute-angle',
      sourceBasenames: Object.freeze(['acute_angle.swf']),
      runtime: runtimeMetadata(225, 225, 12, 60),
      movie: Object.freeze({
        stage: Object.freeze({width: 225, height: 225}),
        fps: 12,
        frameCount: 60,
        durationMs: 5000
      }),
      title: Object.freeze({
        en: 'Acute Angle',
        es: 'Ángulo agudo'
      })
    }),
    Object.freeze({
      key: 'keyterm-elementary-computeghgh',
      preferredAnimationId: 'keyterm-elementary-computeghgh',
      sourceBasenames: Object.freeze(['computeghgh.swf']),
      runtime: runtimeMetadata(225, 225, 12, 35),
      movie: Object.freeze({
        stage: Object.freeze({width: 225, height: 225}),
        fps: 12,
        frameCount: 35,
        durationMs: (35 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Common Sense / Computar',
        es: 'Common Sense / Computar'
      })
    }),
    Object.freeze({
      key: 'shell-course-g04-l01-index-local',
      preferredAnimationId: 'shell-course-g04-l01-index-local',
      // index_local.swf is shared by many lessons, so basename matching would be unsafe.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(800, 600, 12, 50),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 50,
        durationMs: (50 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Place Value',
        es: 'Valor posicional'
      })
    }),
    Object.freeze({
      key: 'shell-course-g04-l03-index-local',
      preferredAnimationId: 'shell-course-g04-l03-index-local',
      // index_local.swf is shared by many lessons, so placement ID is the only safe lookup key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        50,
        [
          nestedDomain('sprite-1011', 48, 50),
          nestedDomain('sprite-132', 100, 1),
          nestedDomain('sprite-302', 149, 49),
          nestedDomain('sprite-327', 132, 49),
          nestedDomain('sprite-528', 871, 49),
          ...COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS.map((id) => {
            const domain = COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA[id];
            return nestedDomain(id, domain.frameCount, domain.rootFrame);
          }),
          // Keep these source-bound one-frame declarations literal so an update to
          // this Shell entry does not alter the shared projection for other pilots.
          nestedDomain('sprite-87', 1, 50),
          nestedDomain('sprite-88', 1, 50),
          nestedDomain('sprite-169', 1, 1),
          nestedDomain('sprite-179', 1, 49),
          nestedDomain('sprite-185', 1, 49),
          nestedDomain('sprite-253', 1, 49),
          nestedDomain('sprite-257', 1, 49),
          nestedDomain('sprite-261', 1, 49),
          nestedDomain('sprite-341', 1, 49),
          nestedDomain('sprite-343', 1, 49),
          nestedDomain('sprite-687', 1, 50),
          nestedDomain('sprite-693', 1, 50),
          nestedDomain('sprite-702', 1, 50),
          nestedDomain('sprite-774', 1, 50)
        ],
        'root'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 50,
        durationMs: (50 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Negative Numbers',
        es: 'Negative Numbers · título español no disponible en la fuente'
      })
    }),
    Object.freeze({
      key: 'course-g03-l01-ts-008',
      preferredAnimationId: 'course-g03-l01-ts-008',
      // L1TS08.swf is reused across grades, so placement ID is the only safe lookup key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-348', 747, 6)],
        'sprite-348'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 747,
        durationMs: (747 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Place Value: Practice Test Question 2',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g03-l01-vb-004',
      preferredAnimationId: 'course-g03-l01-vb-004',
      // L1VB04.swf is not globally unique, so placement ID is the only safe lookup key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-231', 222, 6)],
        'sprite-231'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 222,
        durationMs: (222 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Place-value chart, place-value models',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g03-l06-fq-002-review',
      preferredAnimationId: 'course-g03-l06-fq-002-review',
      // L6FQ02.swf has multiple active/review placements, so the stable placement ID is required.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-1168', 82, 6)],
        'sprite-1168'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 82,
        durationMs: (82 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Decimals & Money: Final Quiz Review',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g03-l06-ti-001',
      preferredAnimationId: 'course-g03-l06-ti-001',
      // L6TI01.swf is not globally unique, so placement ID is the only safe lookup key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-21', 142, 6)],
        'sprite-21'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 142,
        durationMs: (142 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Decimals & Money: Try It!',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g03-l08-re-001',
      preferredAnimationId: 'course-g03-l08-re-001',
      // L8RE01.swf also exists in another grade, so placement ID is the only safe lookup key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        55,
        [nestedDomain('sprite-621', 27, 51)],
        'root'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 55,
        durationMs: (55 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Quiz Review Details for the Student',
        es: 'Estado de repaso no disponible sin datos fuente'
      })
    }),
    Object.freeze({
      key: 'course-g04-l01-ir-001',
      preferredAnimationId: 'course-g04-l01-ir-001',
      // L1RW01.swf exists in multiple grade/section placements; only the stable placement ID is safe.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-58', 142, 6)],
        'sprite-58'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 142,
        durationMs: (142 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Place Value: Your World',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-ts-002',
      preferredAnimationId: 'course-g04-l03-ts-002',
      // L3TS02 is placement-scoped; basename matching is intentionally disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-27', 355, 6), nestedDomain('sprite-3', 1, 6)],
        'sprite-27'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 355,
        durationMs: (355 * 1000) / 12
      }),
      title: Object.freeze({
        en: '4 - Step Plan',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-ts-003',
      preferredAnimationId: 'course-g04-l03-ts-003',
      // L3TS03 is placement-scoped; basename matching is intentionally disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-25', 241, 6), nestedDomain('sprite-3', 1, 6)],
        'sprite-25'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 241,
        durationMs: (241 * 1000) / 12
      }),
      title: Object.freeze({
        en: '4 - Step Plan',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-ts-004',
      preferredAnimationId: 'course-g04-l03-ts-004',
      // L3TS04 is placement-scoped; basename matching is intentionally disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-70', 336, 6), nestedDomain('sprite-3', 1, 6)],
        'sprite-70'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 336,
        durationMs: (336 * 1000) / 12
      }),
      title: Object.freeze({
        en: '4 - Step Plan',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-ts-005',
      preferredAnimationId: 'course-g04-l03-ts-005',
      // L3TS05 is placement-scoped; basename matching is intentionally disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-40', 275, 6), nestedDomain('sprite-3', 1, 6)],
        'sprite-40'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 275,
        durationMs: (275 * 1000) / 12
      }),
      title: Object.freeze({
        en: '4 - Step Plan',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-ts-006',
      preferredAnimationId: 'course-g04-l03-ts-006',
      // L3TS06 is placement-scoped; basename matching is intentionally disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-23', 128, 6), nestedDomain('sprite-3', 1, 6)],
        'sprite-23'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 128,
        durationMs: (128 * 1000) / 12
      }),
      title: Object.freeze({
        en: '4 Step Plan',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-vb-002',
      preferredAnimationId: 'course-g04-l03-vb-002',
      // L3VB02 is placement-scoped; basename matching is intentionally disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-52', 193, 6), nestedDomain('sprite-5', 1, 6)],
        'sprite-52'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 193,
        durationMs: (193 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Number Line',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-vb-003',
      preferredAnimationId: 'course-g04-l03-vb-003',
      // L3VB03 is placement-scoped; basename matching is intentionally disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-106', 160, 6), nestedDomain('sprite-28', 1, 6)],
        'sprite-106'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 160,
        durationMs: (160 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Number Line Practice',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-vb-004',
      preferredAnimationId: 'course-g04-l03-vb-004',
      // L3VB04 exists in multiple grades, so placement ID is the only safe lookup key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-53', 245, 6), nestedDomain('sprite-5', 1, 6)],
        'sprite-53'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 245,
        durationMs: (245 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Positive Numbers',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-vb-005',
      preferredAnimationId: 'course-g04-l03-vb-005',
      // L3VB05 is placement-scoped; basename matching is intentionally disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-53', 180, 6), nestedDomain('sprite-5', 1, 6)],
        'sprite-53'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 180,
        durationMs: (180 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Negative Numbers',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-vb-006',
      preferredAnimationId: 'course-g04-l03-vb-006',
      // L3VB06 is placement-scoped; basename matching is intentionally disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-44', 163, 6), nestedDomain('sprite-5', 1, 6)],
        'sprite-44'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 163,
        durationMs: (163 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Zero',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-vb-007',
      preferredAnimationId: 'course-g04-l03-vb-007',
      // L3VB07 is placement-scoped; basename matching is intentionally disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [
          nestedDomain('sprite-271', 69, 6),
          nestedDomain('sprite-5', 1, 6),
          nestedDomain('sprite-42', 1, 6),
          nestedDomain('sprite-45', 28, 6),
          nestedDomain('sprite-63', 27, 6),
          nestedDomain('sprite-68', 1, 6),
          nestedDomain('sprite-77', 31, 6),
          nestedDomain('sprite-105', 28, 6),
          nestedDomain('sprite-114', 22, 6),
          nestedDomain('sprite-136', 26, 6),
          nestedDomain('sprite-142', 22, 6),
          nestedDomain('sprite-166', 19, 6),
          nestedDomain('sprite-176', 27, 6),
          nestedDomain('sprite-202', 31, 6),
          nestedDomain('sprite-234', 25, 6),
          nestedDomain('sprite-267', 27, 6)
        ],
        'sprite-271'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 69,
        durationMs: (69 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Positive Numbers Practice',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-vb-008',
      preferredAnimationId: 'course-g04-l03-vb-008',
      // L3VB08 is placement-scoped; basename matching is intentionally disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [
          nestedDomain('sprite-195', 62, 6),
          nestedDomain('sprite-5', 1, 6),
          nestedDomain('sprite-54', 1, 6),
          nestedDomain('sprite-63', 28, 6),
          nestedDomain('sprite-74', 28, 6),
          nestedDomain('sprite-86', 29, 6),
          nestedDomain('sprite-98', 31, 6),
          nestedDomain('sprite-110', 27, 6),
          nestedDomain('sprite-138', 28, 6),
          nestedDomain('sprite-163', 27, 6),
          nestedDomain('sprite-169', 1, 6),
          nestedDomain('sprite-176', 1, 6),
          nestedDomain('sprite-179', 28, 6),
          nestedDomain('sprite-191', 25, 6)
        ],
        'sprite-195'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 62,
        durationMs: (62 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Negative Numbers Practice',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-vb-009',
      preferredAnimationId: 'course-g04-l03-vb-009',
      // L3VB09 is placement-scoped; basename matching is intentionally disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-24', 175, 6), nestedDomain('sprite-5', 1, 6)],
        'sprite-24'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 175,
        durationMs: (175 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Pattern',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-rw-002',
      preferredAnimationId: 'course-g04-l03-rw-002',
      // L3RW02 exists in multiple grades, so placement ID is the only safe lookup key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-421', 1289, 6), nestedDomain('sprite-425', 1, 6)],
        'sprite-421'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 1289,
        durationMs: (1289 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Page 1',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-rw-003',
      preferredAnimationId: 'course-g04-l03-rw-003',
      // L3RW03 exists in multiple grades, so placement ID is the only safe lookup key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-49', 278, 6), nestedDomain('sprite-53', 1, 6)],
        'sprite-49'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 278,
        durationMs: (278 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Page 2',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-rw-004',
      preferredAnimationId: 'course-g04-l03-rw-004',
      // L3RW04 is placement-scoped; basename matching is intentionally disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-121', 442, 6), nestedDomain('sprite-125', 1, 6)],
        'sprite-121'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 442,
        durationMs: (442 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Page 3',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-in-002',
      preferredAnimationId: 'course-g04-l03-in-002',
      // L3IN02 exists in multiple grades, so placement ID is the only safe lookup key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-88', 492, 6), nestedDomain('sprite-5', 1, 6)],
        'sprite-88'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 492,
        durationMs: (492 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Numbers on the Number Line',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-in-003',
      preferredAnimationId: 'course-g04-l03-in-003',
      // L3IN03 is placement-scoped; basename matching is intentionally disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-84', 472, 6)],
        'sprite-84'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 472,
        durationMs: (472 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Numbers on the Number Line',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-in-004',
      preferredAnimationId: 'course-g04-l03-in-004',
      // L3IN04 exists in multiple grades, so placement ID is the only safe lookup key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [
          nestedDomain('sprite-160', 169, 6),
          nestedDomain('sprite-5', 1, 6),
          nestedDomain('sprite-53', 55, 6),
          nestedDomain('sprite-55', 20, 6),
          nestedDomain('sprite-61', 1, 6),
          nestedDomain('sprite-69', 1, 6),
          nestedDomain('sprite-72', 28, 6),
          nestedDomain('sprite-84', 25, 6),
          nestedDomain('sprite-98', 32, 6),
          nestedDomain('sprite-119', 33, 6),
          nestedDomain('sprite-131', 28, 6),
          nestedDomain('sprite-133', 1, 6),
          nestedDomain('sprite-135', 1, 6),
          nestedDomain('sprite-136', 1, 6),
          nestedDomain('sprite-137', 1, 6),
          nestedDomain('sprite-138', 1, 6),
          nestedDomain('sprite-139', 1, 6),
          nestedDomain('sprite-140', 1, 6),
          nestedDomain('sprite-141', 1, 6),
          nestedDomain('sprite-142', 1, 6),
          nestedDomain('sprite-143', 1, 6),
          nestedDomain('sprite-155', 15, 6),
          nestedDomain('sprite-159', 25, 6)
        ],
        'sprite-160'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 169,
        durationMs: (169 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Numbers on the Number Line',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-in-005',
      preferredAnimationId: 'course-g04-l03-in-005',
      // L3IN05 exists in multiple grades, so placement ID is the only safe lookup key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [
          nestedDomain('sprite-80', 186, 6),
          nestedDomain('sprite-5', 1, 6),
          nestedDomain('sprite-47', 20, 6),
          nestedDomain('sprite-49', 1, 6),
          nestedDomain('sprite-50', 1, 6),
          nestedDomain('sprite-51', 1, 6),
          nestedDomain('sprite-52', 1, 6),
          nestedDomain('sprite-53', 1, 6),
          nestedDomain('sprite-54', 1, 6),
          nestedDomain('sprite-55', 1, 6),
          nestedDomain('sprite-57', 1, 6),
          nestedDomain('sprite-58', 1, 6),
          nestedDomain('sprite-59', 1, 6),
          nestedDomain('sprite-60', 1, 6),
          nestedDomain('sprite-61', 1, 6),
          nestedDomain('sprite-62', 1, 6),
          nestedDomain('sprite-63', 1, 6),
          nestedDomain('sprite-67', 25, 6),
          nestedDomain('sprite-79', 15, 6)
        ],
        'sprite-80'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 186,
        durationMs: (186 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Numbers on the Number Line',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-in-006',
      preferredAnimationId: 'course-g04-l03-in-006',
      // L3IN06 exists in multiple grades, so placement ID is the only safe lookup key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [
          nestedDomain('sprite-151', 1057, 6),
          nestedDomain('sprite-11', 1, 6),
          nestedDomain('sprite-15', 1, 6),
          nestedDomain('sprite-122', 3, 6),
          nestedDomain('sprite-125', 3, 6),
          nestedDomain('sprite-130', 4, 6),
          nestedDomain('sprite-133', 3, 6),
          nestedDomain('sprite-135', 1, 6),
          nestedDomain('sprite-137', 1, 6),
          nestedDomain('sprite-142', 2, 6),
          nestedDomain('sprite-144', 55, 6),
          nestedDomain('sprite-146', 20, 6),
          nestedDomain('sprite-150', 25, 6)
        ],
        'sprite-151'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 1057,
        durationMs: (1057 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Numbers on the Number Line',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-in-007',
      preferredAnimationId: 'course-g04-l03-in-007',
      // L3IN07 exists in multiple grades, so placement ID is the only safe lookup key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-98', 555, 6), nestedDomain('sprite-5', 1, 6)],
        'sprite-98'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 555,
        durationMs: (555 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Patterns',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-in-008',
      preferredAnimationId: 'course-g04-l03-in-008',
      // L3IN08 exists in multiple grades, so placement ID is the only safe lookup key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [
          nestedDomain('sprite-57', 217, 6),
          nestedDomain('sprite-5', 1, 6),
          nestedDomain('sprite-52', 1, 6),
          nestedDomain('sprite-54', 55, 6),
          nestedDomain('sprite-56', 20, 6)
        ],
        'sprite-57'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 217,
        durationMs: (217 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Patterns',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-in-009',
      preferredAnimationId: 'course-g04-l03-in-009',
      sourceBasenames: Object.freeze(['l3in09.swf']),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-200', 637, 6)],
        'sprite-200'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 637,
        durationMs: (637 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Situations with Negative Numbers: Temperature',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-in-010',
      preferredAnimationId: 'course-g04-l03-in-010',
      // L3IN10 exists in multiple grades, so placement ID is the only safe lookup key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [
          nestedDomain('sprite-90', 264, 6),
          nestedDomain('sprite-5', 1, 6),
          nestedDomain('sprite-47', 1, 6),
          nestedDomain('sprite-52', 25, 6),
          nestedDomain('sprite-55', 1, 6),
          nestedDomain('sprite-58', 1, 6),
          nestedDomain('sprite-61', 1, 6),
          nestedDomain('sprite-63', 1, 6),
          nestedDomain('sprite-66', 1, 6),
          nestedDomain('sprite-69', 1, 6),
          nestedDomain('sprite-70', 1, 6),
          nestedDomain('sprite-71', 1, 6),
          nestedDomain('sprite-72', 1, 6),
          nestedDomain('sprite-73', 1, 6),
          nestedDomain('sprite-74', 1, 6),
          nestedDomain('sprite-75', 1, 6),
          nestedDomain('sprite-87', 15, 6),
          nestedDomain('sprite-89', 20, 6)
        ],
        'sprite-90'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 264,
        durationMs: (264 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Situations with Negative Numbers: Temperature',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-in-011',
      preferredAnimationId: 'course-g04-l03-in-011',
      // L3IN11 exists in multiple grades, so placement ID is the only safe lookup key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-51', 441, 6)],
        'sprite-51'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 441,
        durationMs: (441 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Situations with Negative Numbers: Owing',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-in-012',
      preferredAnimationId: 'course-g04-l03-in-012',
      // L3IN12 exists in multiple grades, so placement ID is the only safe lookup key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [
          nestedDomain('sprite-228', 215, 6),
          nestedDomain('sprite-5', 1, 6),
          nestedDomain('sprite-37', 20, 6),
          nestedDomain('sprite-46', 22, 6),
          nestedDomain('sprite-68', 26, 6),
          nestedDomain('sprite-74', 22, 6),
          nestedDomain('sprite-98', 19, 6),
          nestedDomain('sprite-108', 27, 6),
          nestedDomain('sprite-134', 31, 6),
          nestedDomain('sprite-166', 25, 6),
          nestedDomain('sprite-199', 27, 6),
          nestedDomain('sprite-201', 1, 6),
          nestedDomain('sprite-202', 1, 6),
          nestedDomain('sprite-203', 1, 6),
          nestedDomain('sprite-204', 1, 6),
          nestedDomain('sprite-205', 1, 6),
          nestedDomain('sprite-207', 1, 6),
          nestedDomain('sprite-208', 1, 6),
          nestedDomain('sprite-209', 1, 6),
          nestedDomain('sprite-210', 1, 6),
          nestedDomain('sprite-211', 1, 6),
          nestedDomain('sprite-223', 15, 6),
          nestedDomain('sprite-227', 25, 6)
        ],
        'sprite-228'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 215,
        durationMs: (215 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Situations with Negative Numbers: Owing',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-ti-002',
      preferredAnimationId: 'course-g04-l03-ti-002',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [
          [272, 254],
          [55, 1],
          [128, 1],
          [129, 1],
          [130, 1],
          [131, 1],
          [132, 1],
          [133, 1],
          [134, 1],
          [135, 1],
          [136, 1],
          [137, 1],
          [138, 1],
          [139, 1],
          [140, 1],
          [141, 1],
          [159, 2],
          [169, 2],
          [174, 10],
          [175, 2],
          [178, 2],
          [182, 2],
          [186, 25],
          [188, 1],
          [194, 1],
          [202, 1],
          [205, 28],
          [217, 25],
          [231, 32],
          [252, 33],
          [263, 28],
          [267, 15],
          [269, 55],
          [271, 20]
        ].map(([id, frameCount]) =>
          nestedDomain(`sprite-${id}`, frameCount, 6)
        ),
        'sprite-272'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 254,
        durationMs: (254 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Question 1',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-ti-003',
      preferredAnimationId: 'course-g04-l03-ti-003',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [
          [126, 140],
          [13, 1],
          [55, 1],
          [56, 1],
          [58, 1],
          [59, 1],
          [60, 1],
          [61, 1],
          [62, 1],
          [63, 1],
          [64, 1],
          [65, 1],
          [66, 1],
          [67, 1],
          [78, 15],
          [82, 25],
          [84, 55],
          [86, 35],
          [88, 20],
          [125, 1]
        ].map(([id, frameCount]) =>
          nestedDomain(`sprite-${id}`, frameCount, 6)
        ),
        'sprite-126'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 140,
        durationMs: (140 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Question 2',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-ti-004',
      preferredAnimationId: 'course-g04-l03-ti-004',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [
          [274, 125],
          [158, 1],
          [197, 1],
          [198, 1],
          [199, 1],
          [200, 1],
          [201, 1],
          [202, 1],
          [203, 1],
          [204, 1],
          [205, 1],
          [206, 1],
          [207, 1],
          [208, 1],
          [209, 1],
          [210, 1],
          [212, 7],
          [223, 15],
          [225, 55],
          [229, 25],
          [231, 35],
          [233, 20],
          [236, 25],
          [271, 1],
          [273, 1]
        ].map(([id, frameCount]) =>
          nestedDomain(`sprite-${id}`, frameCount, 6)
        ),
        'sprite-274'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 125,
        durationMs: (125 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Question 3',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-ti-005',
      preferredAnimationId: 'course-g04-l03-ti-005',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [
          [208, 210],
          [157, 1],
          [171, 1],
          [179, 5],
          [203, 1],
          [205, 55],
          [207, 20]
        ].map(([id, frameCount]) =>
          nestedDomain(`sprite-${id}`, frameCount, 6)
        ),
        'sprite-208'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 210,
        durationMs: (210 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Question 4',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-ti-006',
      preferredAnimationId: 'course-g04-l03-ti-006',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [
          [269, 167],
          [158, 1],
          [201, 1],
          [202, 1],
          [203, 1],
          [204, 1],
          [205, 1],
          [207, 1],
          [208, 1],
          [209, 1],
          [210, 1],
          [211, 1],
          [222, 15],
          [224, 55],
          [228, 25],
          [230, 35],
          [263, 1],
          [265, 20],
          [268, 25]
        ].map(([id, frameCount]) =>
          nestedDomain(`sprite-${id}`, frameCount, 6)
        ),
        'sprite-269'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 167,
        durationMs: (167 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Question 5',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-ir-001-341242cc',
      preferredAnimationId: 'course-g04-l03-ir-001-341242cc',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [
          nestedDomain('sprite-27', 136, 6),
          nestedDomain('sprite-9', 135, 6),
          nestedDomain('sprite-10', 135, 6)
        ],
        'sprite-27'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 136,
        durationMs: (136 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Introduction',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-gs-002',
      preferredAnimationId: 'course-g04-l03-gs-002',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [
          [321, 428],
          [28, 1],
          [48, 1],
          [69, 35],
          [78, 3],
          [90, 7],
          [92, 1],
          [147, 12],
          [149, 10],
          [158, 15],
          [164, 1],
          [206, 2],
          [207, 1],
          [306, 6],
          [318, 16],
          [319, 186]
        ].map(([id, frameCount]) =>
          nestedDomain(`sprite-${id}`, frameCount, 6)
        ),
        'sprite-321'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 428,
        durationMs: (428 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Game 1',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-ts-007',
      preferredAnimationId: 'course-g04-l03-ts-007',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [
          [441, 696],
          [47, 1],
          [49, 1],
          [90, 70],
          [114, 97],
          [127, 20],
          [183, 83],
          [193, 28],
          [211, 27],
          [216, 1],
          [225, 31],
          [253, 28],
          [262, 22],
          [284, 26],
          [290, 22],
          [314, 19],
          [324, 27],
          [350, 31],
          [382, 25],
          [415, 27],
          [439, 70],
          [445, 1]
        ].map(([id, frameCount]) =>
          nestedDomain(`sprite-${id}`, frameCount, 6)
        ),
        'sprite-441'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 696,
        durationMs: (696 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Question 1',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-ts-008',
      preferredAnimationId: 'course-g04-l03-ts-008',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [
          [350, 789],
          [48, 1],
          [50, 1],
          [91, 70],
          [142, 21],
          [153, 20],
          [169, 1],
          [197, 28],
          [208, 28],
          [220, 29],
          [232, 31],
          [260, 28],
          [284, 27],
          [290, 1],
          [297, 1],
          [300, 28],
          [312, 25],
          [324, 28],
          [348, 70],
          [354, 1]
        ].map(([id, frameCount]) =>
          nestedDomain(`sprite-${id}`, frameCount, 6)
        ),
        'sprite-350'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 789,
        durationMs: (789 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Question 2',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-fq-002',
      preferredAnimationId: 'course-g04-l03-fq-002',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [
          nestedDomain('sprite-899', 68, 6),
          nestedDomain('sprite-16', 2, 6),
          nestedDomain('sprite-64', 2, 6),
          nestedDomain('sprite-65', 8, 6)
        ],
        'sprite-899'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 68,
        durationMs: (68 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Final Quiz Page 1',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-fq-003',
      preferredAnimationId: 'course-g04-l03-fq-003',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [
          nestedDomain('sprite-899', 68, 6),
          nestedDomain('sprite-16', 2, 6),
          nestedDomain('sprite-64', 2, 6),
          nestedDomain('sprite-65', 8, 6)
        ],
        'sprite-899'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 68,
        durationMs: (68 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Final Quiz Page 2',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l03-fq-001',
      preferredAnimationId: 'course-g04-l03-fq-001',
      // L3FQ01 is placement-scoped; basename matching is intentionally disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-41', 52, 6), nestedDomain('sprite-22', 1, 6)],
        'sprite-41'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 52,
        durationMs: (52 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Final Quiz Introduction',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g04-l09-gs-002',
      preferredAnimationId: 'course-g04-l09-gs-002',
      // L9GS02.swf is placement-scoped; basename matching is intentionally disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-787', 653, 6)],
        'sprite-787'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 653,
        durationMs: (653 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Equations: Play It, Game 1',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-ir-001-a662633d',
      preferredAnimationId: 'course-g05-l04-ir-001-a662633d',
      // L4RW01.swf has a duplicate RW placement; basename matching is disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [
          nestedDomain('sprite-53', 136, 6),
          nestedDomain('sprite-30', 135, 6),
          nestedDomain('sprite-31', 135, 6)
        ],
        'sprite-53'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 136,
        durationMs: (136 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Number Lines — Introduction',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-rw-003',
      preferredAnimationId: 'course-g05-l04-rw-003',
      // L4RW03.swf is placement-scoped; basename matching is intentionally disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-535', 1141, 6)],
        'sprite-535'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 1141,
        durationMs: (1141 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Page 2',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-rw-004',
      preferredAnimationId: 'course-g05-l04-rw-004',
      // L4RW04.swf is placement-scoped; basename matching is intentionally disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-227', 506, 6)],
        'sprite-227'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 506,
        durationMs: (506 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Page 3',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-002',
      preferredAnimationId: 'course-g05-l04-in-002',
      // L4IN02.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-52', 765, 6)],
        'sprite-52'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 765,
        durationMs: (765 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Introduction to Number Lines',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-007',
      preferredAnimationId: 'course-g05-l04-in-007',
      // L4IN07.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-76', 654, 6)],
        'sprite-76'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 654,
        durationMs: (654 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Represent Fractions and Mixed Numbers on a Number Line',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-ts-002',
      preferredAnimationId: 'course-g05-l04-ts-002',
      // L4TS02.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-28', 324, 6)],
        'sprite-28'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 324,
        durationMs: (324 * 1000) / 12
      }),
      title: Object.freeze({
        en: '4 - Step Plan, Page 2',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-ts-005',
      preferredAnimationId: 'course-g05-l04-ts-005',
      // L4TS05.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-30', 234, 6)],
        'sprite-30'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 234,
        durationMs: (234 * 1000) / 12
      }),
      title: Object.freeze({
        en: '4 - Step Plan, Page 5',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-ts-003',
      preferredAnimationId: 'course-g05-l04-ts-003',
      // L4TS03.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-25', 227, 6)],
        'sprite-25'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 227,
        durationMs: (227 * 1000) / 12
      }),
      title: Object.freeze({
        en: '4 Step Plan, Page 3',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-ts-004',
      preferredAnimationId: 'course-g05-l04-ts-004',
      // L4TS04.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-36', 290, 6)],
        'sprite-36'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 290,
        durationMs: (290 * 1000) / 12
      }),
      title: Object.freeze({
        en: '4 Step Plan, Page 4',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-ts-006',
      preferredAnimationId: 'course-g05-l04-ts-006',
      // L4TS06.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-12', 245, 6)],
        'sprite-12'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 245,
        durationMs: (245 * 1000) / 12
      }),
      title: Object.freeze({
        en: '4 - Step Plan, Page 6',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-vb-002',
      preferredAnimationId: 'course-g05-l04-vb-002',
      // L4VB02.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-49', 186, 6)],
        'sprite-49'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 186,
        durationMs: (186 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Numbers on a Number Line',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-vb-005',
      preferredAnimationId: 'course-g05-l04-vb-005',
      // L4VB05.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-46', 264, 6)],
        'sprite-46'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 264,
        durationMs: (264 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Zero',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-vb-006',
      preferredAnimationId: 'course-g05-l04-vb-006',
      // L4VB06.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-42', 166, 6)],
        'sprite-42'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 166,
        durationMs: (166 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Opposites',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-009',
      preferredAnimationId: 'course-g05-l04-in-009',
      // L4IN09.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-29', 504, 6)],
        'sprite-29'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 504,
        durationMs: (504 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Represent Fractions and Mixed Numbers on Number Lines',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-vb-008',
      preferredAnimationId: 'course-g05-l04-vb-008',
      // L4VB08.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-50', 197, 6)],
        'sprite-50'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 197,
        durationMs: (197 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Positive Integers',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-vb-009',
      preferredAnimationId: 'course-g05-l04-vb-009',
      // L4VB09.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-51', 189, 6)],
        'sprite-51'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 189,
        durationMs: (189 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Negative Integers',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-012',
      preferredAnimationId: 'course-g05-l04-in-012',
      // L4IN12.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-48', 298, 6)],
        'sprite-48'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 298,
        durationMs: (298 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Represent Positive and Negative Integers on a Number Line',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-015',
      preferredAnimationId: 'course-g05-l04-in-015',
      // L4IN15.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-101', 601, 6)],
        'sprite-101'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 601,
        durationMs: (601 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Numbers on the Number Line',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-020',
      preferredAnimationId: 'course-g05-l04-in-020',
      // L4IN20.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-37', 282, 6)],
        'sprite-37'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 282,
        durationMs: (282 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Situations with Negative Integers',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-rw-002',
      preferredAnimationId: 'course-g05-l04-rw-002',
      // L4RW02.swf is placement-scoped; basename matching is intentionally disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-341', 419, 6)],
        'sprite-341'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 419,
        durationMs: (419 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Page 1',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-004',
      preferredAnimationId: 'course-g05-l04-in-004',
      // L4IN04.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-436', 320, 6)],
        'sprite-436'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 320,
        durationMs: (320 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Represent Decimals on a Number Line',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-018',
      preferredAnimationId: 'course-g05-l04-in-018',
      // L4IN18.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-220', 275, 6)],
        'sprite-220'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 275,
        durationMs: (275 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Placing Numbers on a Number Line Practice',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-017',
      preferredAnimationId: 'course-g05-l04-in-017',
      // L4IN17.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-494', 541, 6)],
        'sprite-494'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 541,
        durationMs: (541 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Placing Numbers on a Number Line Practice',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-016',
      preferredAnimationId: 'course-g05-l04-in-016',
      // L4IN16.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-264', 299, 6)],
        'sprite-264'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 299,
        durationMs: (299 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Represent Positive and Negative Integers on a Number Line Practice',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-014',
      preferredAnimationId: 'course-g05-l04-in-014',
      // L4IN14.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-170', 197, 6)],
        'sprite-170'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 197,
        durationMs: (197 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Represent Positive and Negative Integers on a Number Line',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-013',
      preferredAnimationId: 'course-g05-l04-in-013',
      // L4IN13.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-170', 178, 6)],
        'sprite-170'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 178,
        durationMs: (178 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Represent Positive and Negative Integers on a Number Line',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-010',
      preferredAnimationId: 'course-g05-l04-in-010',
      // L4IN10.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-58', 180, 6)],
        'sprite-58'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 180,
        durationMs: (180 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Represent Fractions and Mixed Numbers on Number Lines',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-005',
      preferredAnimationId: 'course-g05-l04-in-005',
      // L4IN05.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-222', 226, 6)],
        'sprite-222'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 226,
        durationMs: (226 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Represent Decimals on a Number Line',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-003',
      preferredAnimationId: 'course-g05-l04-in-003',
      // L4IN03.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-217', 182, 6)],
        'sprite-217'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 182,
        durationMs: (182 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Introduction to Number Lines',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-vb-007',
      preferredAnimationId: 'course-g05-l04-vb-007',
      // L4VB07.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-230', 136, 6)],
        'sprite-230'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 136,
        durationMs: (136 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Opposites',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-vb-010',
      preferredAnimationId: 'course-g05-l04-vb-010',
      // L4VB10.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-228', 88, 6)],
        'sprite-228'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 88,
        durationMs: (88 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Integers Practice',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-vb-011',
      preferredAnimationId: 'course-g05-l04-vb-011',
      // L4VB11.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-225', 81, 6)],
        'sprite-225'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 81,
        durationMs: (81 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Integers Practice',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-ts-008',
      preferredAnimationId: 'course-g05-l04-ts-008',
      // L4TS08.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-435', 695, 6)],
        'sprite-435'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 695,
        durationMs: (695 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Question 2',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-ts-007',
      preferredAnimationId: 'course-g05-l04-ts-007',
      // L4TS07.swf exists in multiple grades; placement ID is the only safe key.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-462', 684, 6)],
        'sprite-462'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 684,
        durationMs: (684 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Question 1',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-vb-003',
      preferredAnimationId: 'course-g05-l04-vb-003',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-95', 175, 6)],
        'sprite-95'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 175,
        durationMs: (175 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Number Line Practice',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-vb-004',
      preferredAnimationId: 'course-g05-l04-vb-004',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-71', 257, 6)],
        'sprite-71'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 257,
        durationMs: (257 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Integers',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-006',
      preferredAnimationId: 'course-g05-l04-in-006',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-103', 464, 6)],
        'sprite-103'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 464,
        durationMs: (464 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Represent Decimals on a Number Line',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-008',
      preferredAnimationId: 'course-g05-l04-in-008',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-123', 195, 6)],
        'sprite-123'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 195,
        durationMs: (195 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Represent Fractions and Mixed Numbers on a Number Line',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-011',
      preferredAnimationId: 'course-g05-l04-in-011',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-231', 428, 6)],
        'sprite-231'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 428,
        durationMs: (428 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Represent Fractions and Mixed Numbers on a Number Line',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-019',
      preferredAnimationId: 'course-g05-l04-in-019',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-265', 274, 6)],
        'sprite-265'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 274,
        durationMs: (274 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Placing Numbers on a Number Line Practice',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-021',
      preferredAnimationId: 'course-g05-l04-in-021',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-97', 288, 6)],
        'sprite-97'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 288,
        durationMs: (288 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Situations with Negative Integers',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-in-022',
      preferredAnimationId: 'course-g05-l04-in-022',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-355', 475, 6)],
        'sprite-355'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 475,
        durationMs: (475 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Placing Numbers on a Number Line Practice',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-ti-002',
      preferredAnimationId: 'course-g05-l04-ti-002',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-413', 275, 6)],
        'sprite-413'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 275,
        durationMs: (275 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Try It — Question 1',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-ti-003',
      preferredAnimationId: 'course-g05-l04-ti-003',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-270', 164, 6)],
        'sprite-270'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 164,
        durationMs: (164 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Try It — Question 2',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-ti-004',
      preferredAnimationId: 'course-g05-l04-ti-004',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-299', 472, 6)],
        'sprite-299'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 472,
        durationMs: (472 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Try It — Question 3',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-ti-005',
      preferredAnimationId: 'course-g05-l04-ti-005',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-272', 363, 6)],
        'sprite-272'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 363,
        durationMs: (363 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Try It — Question 4',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-ti-006',
      preferredAnimationId: 'course-g05-l04-ti-006',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-191', 237, 6)],
        'sprite-191'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 237,
        durationMs: (237 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Try It — Question 5',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-ti-007',
      preferredAnimationId: 'course-g05-l04-ti-007',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-177', 167, 6)],
        'sprite-177'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 167,
        durationMs: (167 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Try It — Question 6',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-ti-008',
      preferredAnimationId: 'course-g05-l04-ti-008',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-160', 146, 6)],
        'sprite-160'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 146,
        durationMs: (146 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Try It — Question 7',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-ti-009',
      preferredAnimationId: 'course-g05-l04-ti-009',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-171', 114, 6)],
        'sprite-171'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 114,
        durationMs: (114 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Try It — Question 8',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-gs-002',
      preferredAnimationId: 'course-g05-l04-gs-002',
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-436', 460, 6)],
        'sprite-436'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 460,
        durationMs: (460 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Play It — Game 1',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-fq-001',
      preferredAnimationId: 'course-g05-l04-fq-001',
      // L4FQ01.swf is placement-scoped; basename matching is intentionally disabled.
      // Sprite-100 is a fixed composite layer, not a standalone runtime domain.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-145', 52, 6)],
        'sprite-145'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 52,
        durationMs: (52 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Number Lines — Final Quiz introduction',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-fq-002',
      preferredAnimationId: 'course-g05-l04-fq-002',
      // The derived domain exposes only Q1..Q18 as a non-behavioral atlas.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-694-question-atlas', 18, 6)],
        'sprite-694-question-atlas'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 18,
        durationMs: (18 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Number Lines — Final Quiz, Page 1 question atlas',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l04-fq-003',
      preferredAnimationId: 'course-g05-l04-fq-003',
      // The derived domain exposes only Q1..Q18 as a non-behavioral atlas.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-694-question-atlas', 18, 6)],
        'sprite-694-question-atlas'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 18,
        durationMs: (18 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Number Lines — Final Quiz, Page 2 question atlas',
        es: 'Versión en español pendiente de validación'
      })
    }),
    Object.freeze({
      key: 'course-g05-l13-rw-002',
      preferredAnimationId: 'course-g05-l13-rw-002',
      // L13RW02.swf is placement-scoped; basename matching is intentionally disabled.
      sourceBasenames: Object.freeze([]),
      runtime: runtimeMetadata(
        800,
        600,
        12,
        10,
        [nestedDomain('sprite-334', 1873, 6)],
        'sprite-334'
      ),
      movie: Object.freeze({
        stage: Object.freeze({width: 800, height: 600}),
        fps: 12,
        frameCount: 1873,
        durationMs: (1873 * 1000) / 12
      }),
      title: Object.freeze({
        en: 'Geometry: Your World, Page 1',
        es: 'Versión en español pendiente de validación'
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
