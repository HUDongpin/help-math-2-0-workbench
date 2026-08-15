/**
 * What the lesson player owes an AI tutor.
 *
 * This module is the integration contract only. It connects no service, sends
 * nothing anywhere, and fabricates no tutor replies. Its job is to make the
 * the two pieces of lesson context a tutor needs available in a typed,
 * testable form:
 *
 *   1. where the learner is        -> `tutorPageContext`
 *   2. what is on screen           -> `tutorStageFrameSnapshot`
 *
 * Nova never owns the lesson transport. Opening, using, or closing the tutor
 * leaves animation and narration under the learner's existing controls.
 *
 * No Flash fidelity, audio, human visual, original-runtime, Owner,
 * strict-completion, release, or publication acceptance is created or expanded
 * by anything in this file.
 */

import type {WholeLessonPlayerLocale} from './whole-lesson-player-descriptor';

export type TutorSectionCode = string;

/**
 * The context a tutor receives automatically. A learner should never have to
 * type where they are, and a school buyer should be able to read exactly what
 * leaves the page — which is why this is a closed, enumerable shape rather than
 * an open bag.
 */
export interface TutorPageContext {
  readonly releaseId: string;
  readonly grade: number;
  readonly lesson: number;
  readonly animationId: string;
  readonly sectionCode: TutorSectionCode;
  readonly sectionTitle: string;
  readonly globalPageOrdinal: number;
  readonly activePageCount: number;
  readonly pageTitle: string;
  /** Source English title, even when the learner is reading in Spanish. */
  readonly pageTitleEnglish: string;
  /** Exact source Spanish title, or null when the source has none. */
  readonly pageTitleSpanish: string | null;
  /** The locale the learner is reading in. */
  readonly locale: WholeLessonPlayerLocale;
  /**
   * True when the page title shown is English standing in for a missing
   * Spanish source string. A tutor must not present such a title as though the
   * catalogue supplied it in Spanish.
   */
  readonly pageTitleUsesEnglishFallback: boolean;
  /**
   * Assessment sections ask the Nova gateway to scaffold rather than answer.
   * Carrying the decision in the context keeps that instruction enforceable
   * at the request boundary instead of relying on UI wording alone.
   */
  readonly assessment: boolean;
}

export const NOVA_TUTOR_MODES = [
  'focus',
  'study',
  'classroom',
] as const;

export type NovaTutorMode = (typeof NOVA_TUTOR_MODES)[number];

/**
 * Owner-approved product names for the three lesson presentations. Chinese is
 * retained as naming metadata; the current learner surface renders English or
 * Spanish according to the route locale.
 */
export const NOVA_TUTOR_MODE_PRODUCT_LABELS = Object.freeze({
  focus: Object.freeze({
    en: 'Focus',
    es: 'Enfoque',
    zh: '专注学习',
    purposeEn: 'Focused learning',
    purposeEs: 'Aprendizaje enfocado',
  }),
  study: Object.freeze({
    en: 'Study',
    es: 'Estudio',
    zh: '辅助学习',
    purposeEn: 'Learning support',
    purposeEs: 'Apoyo de aprendizaje',
  }),
  classroom: Object.freeze({
    en: 'Classroom',
    es: 'Clase',
    zh: '课堂展示',
    purposeEn: 'Class display',
    purposeEs: 'Presentación de clase',
  }),
} satisfies Record<NovaTutorMode, Readonly<{
  en: string;
  es: string;
  zh: string;
  purposeEn: string;
  purposeEs: string;
}>>);

/**
 * Canonicalize every legacy lesson-presentation link to Focus while retaining
 * the descriptor's path, unrelated query values, and hash. The mode argument
 * remains solely for compatibility with older call sites.
 */
export function novaTutorModeHref(
  courseHref: string,
  _mode: NovaTutorMode,
): string {
  const hashIndex = courseHref.indexOf('#');
  const hash = hashIndex >= 0 ? courseHref.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? courseHref.slice(0, hashIndex) : courseHref;
  const queryIndex = withoutHash.indexOf('?');
  const pathname = queryIndex >= 0
    ? withoutHash.slice(0, queryIndex)
    : withoutHash;
  const search = queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : '';
  const params = new URLSearchParams(search);
  params.set('mode', 'focus');
  return `${pathname}?${params.toString()}${hash}`;
}

/**
 * Lessons now use one consistent Focus presentation. Legacy `mode` query
 * values remain accepted as inert compatibility input, but none of them may
 * activate a second learner view or imply a different Tutor configuration.
 */
export function resolveNovaTutorMode(
  _value: string | string[] | undefined,
): NovaTutorMode {
  return 'focus';
}

/** Sections where the tutor must scaffold rather than give the answer. */
export const TUTOR_ASSESSMENT_SECTIONS: readonly string[] =
  Object.freeze(['TI', 'TS', 'FQ']);

export function isTutorAssessmentSection(sectionCode: string) {
  return TUTOR_ASSESSMENT_SECTIONS.includes(sectionCode);
}

export function tutorPageContext(input: {
  releaseId: string;
  grade: number;
  lesson: number;
  animationId: string;
  sectionCode: string;
  sectionTitle: string;
  globalPageOrdinal: number;
  activePageCount: number;
  pageTitle: string;
  pageTitleEnglish: string;
  pageTitleSpanish: string | null;
  locale: WholeLessonPlayerLocale;
  pageTitleUsesEnglishFallback?: boolean;
}): TutorPageContext {
  if (!input.animationId) throw new Error('animationId is required');
  if (!Number.isInteger(input.globalPageOrdinal) || input.globalPageOrdinal < 1) {
    throw new Error('globalPageOrdinal must be a positive integer');
  }
  if (!Number.isInteger(input.activePageCount) || input.activePageCount < 1) {
    throw new Error('activePageCount must be a positive integer');
  }
  if (input.globalPageOrdinal > input.activePageCount) {
    throw new Error('globalPageOrdinal cannot exceed activePageCount');
  }
  return Object.freeze({
    releaseId: input.releaseId,
    grade: input.grade,
    lesson: input.lesson,
    animationId: input.animationId,
    sectionCode: input.sectionCode,
    sectionTitle: input.sectionTitle,
    globalPageOrdinal: input.globalPageOrdinal,
    activePageCount: input.activePageCount,
    pageTitle: input.pageTitle,
    pageTitleEnglish: input.pageTitleEnglish,
    pageTitleSpanish: input.pageTitleSpanish,
    locale: input.locale,
    pageTitleUsesEnglishFallback: input.pageTitleUsesEnglishFallback ?? false,
    assessment: isTutorAssessmentSection(input.sectionCode),
  });
}

/**
 * A short, human-readable statement of what the tutor can see, for the
 * "Nova can see" chip. Kept here so the wording cannot drift from the payload.
 */
export function tutorContextSummary(context: TutorPageContext) {
  const spanish = context.locale === 'es';
  const page = spanish
    ? `Página ${context.globalPageOrdinal} de ${context.activePageCount}`
    : `Page ${context.globalPageOrdinal} of ${context.activePageCount}`;
  return `${page} · ${context.sectionTitle} · ${context.pageTitle}`;
}

export interface TutorFrameSnapshot {
  readonly animationId: string;
  readonly dataUrl: string;
  readonly width: number;
  readonly height: number;
}

export interface TutorFrameCrop {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

function canvasRegionHasVisiblePixel(
  canvas: HTMLCanvasElement,
  region: TutorFrameCrop,
) {
  // Real browser canvases expose getContext. A few small unit-test doubles do
  // not; they exercise serialisation rather than paint readiness and therefore
  // keep the historical path below. In-browser capture fails closed when the
  // canvas exists but has not painted a single visible pixel yet.
  if (typeof canvas.getContext !== 'function') return true;
  const context = canvas.getContext('2d', {willReadFrequently: true});
  if (!context) return false;
  const pixels = context.getImageData(
    region.left,
    region.top,
    region.width,
    region.height,
  ).data;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] !== 0) return true;
  }
  return false;
}

function validFrameCrop(
  crop: TutorFrameCrop,
  width: number,
  height: number,
) {
  const values = [crop.left, crop.top, crop.width, crop.height];
  return !values.some((value) => !Number.isFinite(value)) &&
    crop.left >= 0 && crop.top >= 0 && crop.width > 0 && crop.height > 0 &&
    crop.left + crop.width <= width && crop.top + crop.height <= height;
}

/**
 * The current frame, for the "look at where you put Ricky" case.
 *
 * Returns null rather than throwing when a canvas is absent, transparent, or
 * tainted. `tutorStageFrameSnapshot` adds a best-effort inline-SVG fallback;
 * this lower-level helper remains useful for deterministic canvas capture.
 */
export function tutorFrameSnapshot(
  canvas: HTMLCanvasElement | null | undefined,
  animationId: string,
  crop?: TutorFrameCrop,
): TutorFrameSnapshot | null {
  if (!canvas || typeof canvas.toDataURL !== 'function') return null;
  if (!canvas.width || !canvas.height) return null;
  try {
    if (crop) {
      if (!validFrameCrop(crop, canvas.width, canvas.height)) return null;
      if (!canvasRegionHasVisiblePixel(canvas, crop)) return null;
      const output = canvas.ownerDocument?.createElement('canvas');
      const context = output?.getContext('2d');
      if (!output || !context) return null;
      output.width = crop.width;
      output.height = crop.height;
      context.drawImage(
        canvas,
        crop.left,
        crop.top,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height,
      );
      return Object.freeze({
        animationId,
        dataUrl: output.toDataURL('image/png'),
        width: output.width,
        height: output.height,
      });
    }
    if (!canvasRegionHasVisiblePixel(canvas, {
      left: 0,
      top: 0,
      width: canvas.width,
      height: canvas.height,
    })) return null;
    return Object.freeze({
      animationId,
      dataUrl: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
    });
  } catch {
    // A tainted canvas must not take the lesson down.
    return null;
  }
}

const SVG_STYLE_PROPERTIES = [
  'background',
  'background-color',
  'border',
  'box-sizing',
  'color',
  'display',
  'fill',
  'fill-opacity',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'letter-spacing',
  'line-height',
  'opacity',
  'stroke',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-opacity',
  'stroke-width',
  'text-align',
  'text-anchor',
  'text-decoration',
  'transform',
  'transform-origin',
  'visibility',
  'white-space',
] as const;

function svgIntrinsicSize(svg: SVGSVGElement) {
  const viewBox = svg.viewBox?.baseVal;
  if (viewBox?.width > 0 && viewBox.height > 0) {
    return {width: Math.round(viewBox.width), height: Math.round(viewBox.height)};
  }
  const width = Number.parseFloat(svg.getAttribute('width') ?? '');
  const height = Number.parseFloat(svg.getAttribute('height') ?? '');
  if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
    return {width: Math.round(width), height: Math.round(height)};
  }
  const bounds = svg.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) return null;
  return {width: Math.round(bounds.width), height: Math.round(bounds.height)};
}

function copySvgComputedStyles(source: SVGSVGElement, clone: SVGSVGElement) {
  const view = source.ownerDocument?.defaultView;
  if (!view) return;
  const sourceElements = [source, ...source.querySelectorAll('*')];
  const cloneElements = [clone, ...clone.querySelectorAll('*')];
  sourceElements.forEach((sourceElement, index) => {
    const cloneElement = cloneElements[index] as HTMLElement | SVGElement | undefined;
    if (!cloneElement || !('style' in cloneElement)) return;
    const computed = view.getComputedStyle(sourceElement);
    for (const property of SVG_STYLE_PROPERTIES) {
      const value = computed.getPropertyValue(property);
      if (value) cloneElement.style.setProperty(property, value);
    }
  });
}

function blobToDataUrl(blob: Blob, view: Window) {
  return new Promise<string | null>((resolve) => {
    void view;
    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = () => resolve(
      typeof reader.result === 'string' ? reader.result : null,
    );
    reader.readAsDataURL(blob);
  });
}

async function inlineSameOriginSvgImages(
  source: SVGSVGElement,
  clone: SVGSVGElement,
) {
  const view = source.ownerDocument?.defaultView;
  if (!view || typeof view.fetch !== 'function') return;
  const sources = [...source.querySelectorAll<SVGImageElement>('image')];
  const clones = [...clone.querySelectorAll<SVGImageElement>('image')];
  await Promise.all(sources.map(async (sourceImage, index) => {
    const cloneImage = clones[index];
    if (!cloneImage) return;
    const href = sourceImage.getAttribute('href') ??
      sourceImage.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
    if (!href || href.startsWith('data:') || href.startsWith('blob:')) return;
    try {
      const absolute = new URL(href, source.ownerDocument.baseURI);
      if (absolute.origin !== view.location.origin) return;
      const response = await view.fetch(absolute.href, {
        cache: 'force-cache',
        credentials: 'same-origin',
      });
      if (!response.ok) return;
      const dataUrl = await blobToDataUrl(await response.blob(), view);
      if (!dataUrl) return;
      cloneImage.setAttribute('href', dataUrl);
      cloneImage.setAttributeNS(
        'http://www.w3.org/1999/xlink',
        'xlink:href',
        dataUrl,
      );
    } catch {
      // The already-visible SVG can still rasterise without this asset. Keep
      // the fallback best-effort and let drawImage decide whether it is safe.
    }
  }));
}

/**
 * Rasterise one already-rendered inline SVG in the browser. No device camera,
 * photo picker, remote screenshot service, or audio data is involved. The
 * returned PNG is still local; `prepareNovaFrame` applies the final bounded
 * JPEG conversion only after the learner presses the attachment control.
 */
export async function tutorSvgFrameSnapshot(
  svg: SVGSVGElement | null | undefined,
  animationId: string,
  crop?: TutorFrameCrop,
): Promise<TutorFrameSnapshot | null> {
  if (!svg || typeof XMLSerializer === 'undefined') return null;
  const size = svgIntrinsicSize(svg);
  if (!size) return null;
  const effectiveCrop = crop && validFrameCrop(crop, size.width, size.height)
    ? crop
    : crop && crop.width === size.width && crop.height === size.height
      ? undefined
      : crop
        ? null
        : undefined;
  if (effectiveCrop === null) return null;

  const document = svg.ownerDocument;
  const view = document?.defaultView;
  if (!document || !view) return null;
  try {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    clone.setAttribute('width', String(size.width));
    clone.setAttribute('height', String(size.height));
    copySvgComputedStyles(svg, clone);
    await inlineSameOriginSvgImages(svg, clone);

    const serialized = new XMLSerializer().serializeToString(clone);
    // The ordinary production CSP permits data images but intentionally does
    // not permit blob images. Encoding this already-local SVG as a data URL
    // keeps capture compatible with that stricter policy.
    const imageUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
    const image = new view.Image();
    const loaded = await new Promise<boolean>((resolve) => {
      const timeout = view.setTimeout(() => resolve(false), 3_000);
      image.onload = () => {
        view.clearTimeout(timeout);
        resolve(true);
      };
      image.onerror = () => {
        view.clearTimeout(timeout);
        resolve(false);
      };
      image.src = imageUrl;
    });
    if (!loaded) return null;

    const region = effectiveCrop ?? {
      left: 0,
      top: 0,
      width: size.width,
      height: size.height,
    };
    const output = document.createElement('canvas');
    output.width = region.width;
    output.height = region.height;
    const context = output.getContext('2d');
    if (!context) return null;
    context.drawImage(
      image,
      region.left,
      region.top,
      region.width,
      region.height,
      0,
      0,
      region.width,
      region.height,
    );
    if (!canvasRegionHasVisiblePixel(output, {
      left: 0,
      top: 0,
      width: output.width,
      height: output.height,
    })) return null;
    return Object.freeze({
      animationId,
      dataUrl: output.toDataURL('image/png'),
      width: output.width,
      height: output.height,
    });
  } catch {
    // Unsupported foreignObject content, load errors, and tainted paints all
    // degrade to context-only Nova support rather than breaking the lesson.
    return null;
  }
}

/** Prefer the painted lesson canvas, then best-effort rasterise inline SVG. */
export async function tutorStageFrameSnapshot(
  stage: HTMLElement | null | undefined,
  animationId: string,
  crop?: TutorFrameCrop,
): Promise<TutorFrameSnapshot | null> {
  if (!stage) return null;
  const canvasSnapshot = tutorFrameSnapshot(
    stage.querySelector<HTMLCanvasElement>('canvas'),
    animationId,
    crop,
  );
  if (canvasSnapshot) return canvasSnapshot;
  return tutorSvgFrameSnapshot(
    stage.querySelector<SVGSVGElement>('svg'),
    animationId,
    crop,
  );
}

export type TutorAvailability = Readonly<{
  kind: 'same-origin-gateway';
  connectivity: 'not-yet-confirmed';
}>;

/**
 * The player ships a same-origin Nova gateway. Configuration intent is not
 * connectivity proof, so the initial state stays explicitly unconfirmed until
 * one successful gateway response identifies the exact model.
 */
export function resolveTutorAvailability(
  _env: Readonly<Record<string, string | undefined>> = process.env,
): TutorAvailability {
  void _env;
  return Object.freeze({
    kind: 'same-origin-gateway' as const,
    connectivity: 'not-yet-confirmed' as const,
  });
}
