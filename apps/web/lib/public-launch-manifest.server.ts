import {createHash} from 'node:crypto';

import manifestDocument from '../../../catalog/public-launch-manifest.v1.json' with {type: 'json'};

export type PublicLessonTier = 'unavailable' | 'preview' | 'released';
export type PublicFeature =
  | 'auth'
  | 'contactForm'
  | 'family'
  | 'lrs'
  | 'novaTutor'
  | 'teacher';

export interface PublicLaunchSmokeRoute {
  readonly smokeId: string;
  readonly path: string;
  readonly locale: 'en' | 'es' | null;
  readonly kind: 'public-page' | 'lesson' | 'robots' | 'sitemap';
  readonly expectedStatus: 200;
}

interface PublicLaunchLesson {
  readonly lessonKey: string;
  readonly catalogOrdinal: number;
  readonly grade: 3 | 4 | 5;
  readonly lesson: number;
  readonly title: Readonly<{
    en: string;
    es: string | null;
    esUsesEnglishFallback: boolean;
  }>;
  readonly pageOccurrenceCount: number;
  readonly sourceXml: Readonly<{path: string; sha256: string}>;
  readonly currentJs: Readonly<{
    registeredOccurrenceCount: number;
    registeredUniqueRendererCount: number;
    myLessonIntegratedOccurrenceCount: number;
    complete: boolean;
    descriptorId: string | null;
    releaseId: string | null;
    engineeringBindingSha256: string;
  }>;
  readonly routes: Readonly<{en: string; es: string}>;
  readonly publication: Readonly<{
    tier: PublicLessonTier;
    routeAuthorized: boolean;
    indexable: boolean;
    runtimeAssetClosureSha256: string | null;
    previewProductQaReceiptSha256: string | null;
    ownerPreviewDecisionSha256: string | null;
    originalRuntimeReceiptSha256: string | null;
    technicalComparisonReceiptSha256: string | null;
    audioAcceptanceReceiptSha256: string | null;
    humanVisualAcceptanceReceiptSha256: string | null;
    ownerReleaseDecisionSha256: string | null;
    strictCompletionReceiptSha256: string | null;
    productionTrustReceiptSha256: string | null;
    productionVerificationReceiptSha256: string | null;
  }>;
}

export interface PublicLessonCatalogRow {
  readonly lessonKey: string;
  readonly catalogOrdinal: number;
  readonly grade: 3 | 4 | 5;
  readonly lesson: number;
  readonly title: Readonly<{
    en: string;
    es: string | null;
    esUsesEnglishFallback: boolean;
  }>;
  readonly pageOccurrenceCount: number;
  readonly routes: Readonly<{en: string; es: string}>;
  readonly publication: Readonly<{
    tier: PublicLessonTier;
    routeAuthorized: boolean;
    indexable: boolean;
  }>;
}

export interface PublicLaunchSummary {
  readonly lessonCount: number;
  readonly pageOccurrenceDenominator: number;
  readonly registeredCurrentJsOccurrences: number;
  readonly registeredCurrentJsUniqueRenderers: number;
  readonly currentJsCompleteLessons: number;
  readonly publicationCounts: Readonly<{
    unavailable: number;
    preview: number;
    released: number;
  }>;
  readonly publiclyRoutableLessons: number;
  readonly strictCompleteLessons: number;
  readonly minimumPreviewLessonsSatisfied: boolean;
  readonly publicFeaturesFailClosed: boolean;
  readonly externalInputsComplete: boolean;
  readonly legalPagesFinal: boolean;
  readonly assetClosureCurrent: boolean;
  readonly launchReadiness: 'NO_GO' | 'GO';
  readonly blockers: readonly string[];
}

interface PublicLaunchManifestV1 {
  readonly schemaVersion: 1;
  readonly manifestKind: 'help-math-public-launch-manifest';
  readonly releaseId: 'HELP_MATH_2_PUBLIC_LAUNCH_V1';
  readonly generatedMarker: string;
  readonly publicFeatures: Readonly<Record<PublicFeature, false>>;
  readonly lessons: readonly PublicLaunchLesson[];
  readonly smokeRoutes: readonly PublicLaunchSmokeRoute[];
  readonly summary: Readonly<PublicLaunchSummary>;
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const SHA256_MARKER_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const ZERO_MARKER = `sha256:${'0'.repeat(64)}`;
const PUBLIC_FEATURES = Object.freeze([
  'auth',
  'contactForm',
  'family',
  'lrs',
  'novaTutor',
  'teacher',
] as const);
const RELEASE_RECEIPTS = Object.freeze([
  'originalRuntimeReceiptSha256',
  'technicalComparisonReceiptSha256',
  'audioAcceptanceReceiptSha256',
  'humanVisualAcceptanceReceiptSha256',
  'ownerReleaseDecisionSha256',
  'strictCompletionReceiptSha256',
  'productionTrustReceiptSha256',
  'productionVerificationReceiptSha256',
] as const);
const PUBLICATION_RECEIPTS = Object.freeze([
  'runtimeAssetClosureSha256',
  'previewProductQaReceiptSha256',
  'ownerPreviewDecisionSha256',
  ...RELEASE_RECEIPTS,
] as const);
const MANIFEST_KEYS = Object.freeze([
  'schemaVersion',
  'manifestKind',
  'releaseId',
  'generator',
  'generatedMarker',
  'sourceBindings',
  'launchContract',
  'publicFeatures',
  'legalAndSupport',
  'assetClosure',
  'publicRoutes',
  'smokeRoutes',
  'summary',
  'lessons',
] as const);
const LESSON_KEYS = Object.freeze([
  'lessonKey',
  'catalogOrdinal',
  'grade',
  'lesson',
  'title',
  'pageOccurrenceCount',
  'sourceXml',
  'currentJs',
  'routes',
  'publication',
] as const);
const PUBLIC_ROUTES = Object.freeze([
  Object.freeze({
    routeId: 'home',
    kind: 'localized-page',
    paths: Object.freeze({en: '/', es: '/es'}),
  }),
  Object.freeze({
    routeId: 'all-lessons',
    kind: 'localized-page',
    paths: Object.freeze({en: '/lessons', es: '/es/lessons'}),
  }),
  Object.freeze({
    routeId: 'privacy',
    kind: 'localized-page',
    paths: Object.freeze({en: '/privacy', es: '/es/privacy'}),
  }),
  Object.freeze({
    routeId: 'terms',
    kind: 'localized-page',
    paths: Object.freeze({en: '/terms', es: '/es/terms'}),
  }),
  Object.freeze({
    routeId: 'support',
    kind: 'localized-page',
    paths: Object.freeze({en: '/support', es: '/es/support'}),
  }),
  Object.freeze({
    routeId: 'accessibility',
    kind: 'localized-page',
    paths: Object.freeze({en: '/accessibility', es: '/es/accessibility'}),
  }),
  Object.freeze({
    routeId: 'robots',
    kind: 'machine-route',
    paths: Object.freeze({en: '/robots.txt', es: null}),
  }),
  Object.freeze({
    routeId: 'sitemap',
    kind: 'machine-route',
    paths: Object.freeze({en: '/sitemap.xml', es: null}),
  }),
] as const);

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid public launch manifest: ${message}`);
}

function exactKeys(value: object, expected: readonly string[], label: string) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  invariant(JSON.stringify(actual) === JSON.stringify(wanted),
    `${label} fields drifted`);
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && SHA256_PATTERN.test(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function compareText(left: string, right: string) {
  return Buffer.from(left).compare(Buffer.from(right));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isObject(value)) {
    return Object.fromEntries(Object.keys(value).sort(compareText).map((key) => [
      key,
      canonicalize(value[key]),
    ]));
  }
  return value;
}

function stableJson(value: unknown) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

function computeRuntimeGeneratedMarker(value: Record<string, unknown>) {
  const projection = structuredClone(value);
  projection.generatedMarker = ZERO_MARKER;
  return `sha256:${createHash('sha256').update(stableJson(projection)).digest('hex')}`;
}

function validateReviewState(value: unknown, label: string) {
  invariant(isObject(value), `${label} must be an object`);
  exactKeys(value, ['state', 'approvalReceiptSha256', 'contentSha256'], label);
  invariant(['missing', 'draft', 'approved'].includes(value.state as string),
    `${label}.state is invalid`);
  if (value.state === 'approved') {
    invariant(isSha256(value.approvalReceiptSha256)
      && isSha256(value.contentSha256),
    `${label} approved state requires receipt and content SHA-256`);
  } else {
    invariant(value.approvalReceiptSha256 === null,
      `${label} unapproved state cannot carry approval receipt`);
    invariant(value.state === 'draft'
      ? value.contentSha256 === null || isSha256(value.contentSha256)
      : value.contentSha256 === null,
    `${label} content SHA-256 is invalid for ${String(value.state)}`);
  }
}

function validateSupportState(value: unknown) {
  invariant(isObject(value), 'legalAndSupport.support must be an object');
  exactKeys(value, [
    'state',
    'mailboxVerificationReceiptSha256',
    'runtimeValueBindingSha256',
    'approvalReceiptSha256',
  ], 'legalAndSupport.support');
  invariant([
    'private-input-received',
    'runtime-binding-pending',
    'approved',
  ].includes(value.state as string), 'legalAndSupport.support.state is invalid');
  invariant(isSha256(value.mailboxVerificationReceiptSha256),
    'support mailbox verification receipt is invalid');
  if (value.state === 'approved') {
    invariant(isSha256(value.runtimeValueBindingSha256)
      && isSha256(value.approvalReceiptSha256),
    'approved support requires runtime binding and approval receipts');
  } else {
    invariant(value.runtimeValueBindingSha256 === null
      && value.approvalReceiptSha256 === null,
    'unapproved support cannot carry runtime or approval bindings');
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function assertExactStringSet(
  actual: ReadonlySet<string>,
  expected: readonly string[],
  label: string,
) {
  invariant(actual.size === expected.length
    && expected.every((value) => actual.has(value)),
  `${label} drifted`);
}

function deriveRuntimeSmokeRoutes(
  publicRoutes: readonly Record<string, unknown>[],
  lessons: readonly Record<string, unknown>[],
): readonly Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  for (const route of publicRoutes) {
    if (route.authorized !== true || !isObject(route.paths)) continue;
    const routeId = route.routeId as string;
    const kind = route.kind as string;
    result.push({
      smokeId: `${routeId}-en`,
      path: route.paths.en,
      locale: kind === 'localized-page' ? 'en' : null,
      kind: routeId === 'robots'
        ? 'robots'
        : routeId === 'sitemap'
          ? 'sitemap'
          : 'public-page',
      expectedStatus: 200,
    });
    if (route.paths.es !== null) {
      result.push({
        smokeId: `${routeId}-es`,
        path: route.paths.es,
        locale: 'es',
        kind: 'public-page',
        expectedStatus: 200,
      });
    }
  }
  for (const lesson of lessons) {
    if (!isObject(lesson.publication)
      || !isObject(lesson.routes)
      || lesson.publication.routeAuthorized !== true
      || lesson.publication.tier === 'unavailable') continue;
    for (const locale of ['en', 'es'] as const) {
      result.push({
        smokeId: `${lesson.lessonKey}-${locale}`,
        path: lesson.routes[locale],
        locale,
        kind: 'lesson',
        expectedStatus: 200,
      });
    }
  }
  return result;
}

function validateRuntimeManifest(value: unknown): PublicLaunchManifestV1 {
  invariant(isObject(value), 'root must be an object');
  exactKeys(value, MANIFEST_KEYS, 'manifest');
  invariant(value.schemaVersion === 1, 'schemaVersion drifted');
  invariant(value.manifestKind === 'help-math-public-launch-manifest',
    'manifestKind drifted');
  invariant(value.releaseId === 'HELP_MATH_2_PUBLIC_LAUNCH_V1',
    'releaseId drifted');
  invariant(typeof value.generatedMarker === 'string'
    && SHA256_MARKER_PATTERN.test(value.generatedMarker),
  'generatedMarker is invalid');
  invariant(value.generatedMarker === computeRuntimeGeneratedMarker(value),
    'generatedMarker is stale');
  invariant(isObject(value.generator), 'generator must be an object');
  exactKeys(value.generator,
    ['path', 'version', 'sha256', 'determinism'], 'generator');
  invariant(value.generator.path === 'scripts/build-public-launch-manifest.mjs'
    && value.generator.version === '1.0.0'
    && isSha256(value.generator.sha256)
    && value.generator.determinism ===
      'no-clock-no-current-head-source-ordered-v1',
  'generator binding is invalid');
  invariant(isObject(value.sourceBindings), 'sourceBindings must be an object');
  exactKeys(value.sourceBindings, [
    'pageOnlyControlLedger',
    'externalInputStatus',
    'deployAssetManifest',
  ], 'sourceBindings');
  const pageOnlyBinding = value.sourceBindings.pageOnlyControlLedger;
  const externalInputBinding = value.sourceBindings.externalInputStatus;
  const deployBinding = value.sourceBindings.deployAssetManifest;
  invariant(isObject(pageOnlyBinding), 'page-only binding must be an object');
  exactKeys(pageOnlyBinding,
    ['path', 'sha256', 'generatorPath', 'generatorSha256'],
    'sourceBindings.pageOnlyControlLedger');
  invariant(pageOnlyBinding.path ===
    'catalog/page-only-migration-control-ledger.json'
    && pageOnlyBinding.generatorPath ===
      'scripts/build-page-only-migration-control-ledger.mjs'
    && isSha256(pageOnlyBinding.sha256)
    && isSha256(pageOnlyBinding.generatorSha256),
  'page-only binding is invalid');
  invariant(isObject(externalInputBinding),
    'external-input binding must be an object');
  exactKeys(externalInputBinding,
    ['path', 'sha256', 'privateReceiptSha256'],
    'sourceBindings.externalInputStatus');
  invariant(externalInputBinding.path ===
    'catalog/launch-control/external-input-status.v1.json'
    && isSha256(externalInputBinding.sha256)
    && isSha256(externalInputBinding.privateReceiptSha256),
  'external-input binding is invalid');
  invariant(isObject(deployBinding), 'deploy binding must be an object');
  exactKeys(deployBinding, ['path', 'sha256', 'current'],
    'sourceBindings.deployAssetManifest');
  invariant(deployBinding.path === 'catalog/deploy-asset-manifest.v1.json'
    && (deployBinding.sha256 === null || isSha256(deployBinding.sha256))
    && typeof deployBinding.current === 'boolean',
  'deploy binding is invalid');
  invariant(isObject(value.launchContract), 'launchContract must be an object');
  exactKeys(value.launchContract, [
    'audience',
    'locales',
    'identityMode',
    'progressStorage',
    'progressClearAndResetRequired',
    'lessonCount',
    'pageOccurrenceDenominator',
    'courseShellCount',
    'modernMyLessonHostRetained',
    'minimumPreviewLessonsForLearningMvp',
  ], 'launchContract');
  invariant(value.launchContract.audience ===
    'us-k12-families-educators-and-anonymous-learners-under-adult-supervision'
    && JSON.stringify(value.launchContract.locales) ===
      JSON.stringify(['en', 'es'])
    && value.launchContract.identityMode === 'anonymous-only'
    && value.launchContract.progressStorage === 'browser-local-only'
    && value.launchContract.progressClearAndResetRequired === true
    && value.launchContract.lessonCount === 29
    && value.launchContract.pageOccurrenceDenominator === 1_751
    && value.launchContract.courseShellCount === 0
    && value.launchContract.modernMyLessonHostRetained === true
    && value.launchContract.minimumPreviewLessonsForLearningMvp === 2,
  'launch contract drifted');
  invariant(isObject(value.publicFeatures), 'publicFeatures must be an object');
  exactKeys(value.publicFeatures, PUBLIC_FEATURES, 'publicFeatures');
  for (const feature of PUBLIC_FEATURES) {
    invariant(value.publicFeatures[feature] === false,
      `${feature} must remain boolean false`);
  }
  invariant(isObject(value.legalAndSupport),
    'legalAndSupport must be an object');
  exactKeys(value.legalAndSupport, [
    'operatingLegalEntityReceived',
    'jurisdictionReceived',
    'staffedAdultSupportEmailReceived',
    'staffedAdultSupportEmailTwoWayVerified',
    'privateInputReceiptSha256',
    'privacy',
    'terms',
    'support',
    'accessibility',
  ], 'legalAndSupport');
  for (const field of [
    'operatingLegalEntityReceived',
    'jurisdictionReceived',
    'staffedAdultSupportEmailReceived',
    'staffedAdultSupportEmailTwoWayVerified',
  ]) {
    invariant(typeof value.legalAndSupport[field] === 'boolean',
      `legalAndSupport.${field} must be boolean`);
  }
  invariant(isSha256(value.legalAndSupport.privateInputReceiptSha256),
    'private input receipt is invalid');
  validateReviewState(value.legalAndSupport.privacy,
    'legalAndSupport.privacy');
  validateReviewState(value.legalAndSupport.terms,
    'legalAndSupport.terms');
  validateReviewState(value.legalAndSupport.accessibility,
    'legalAndSupport.accessibility');
  validateSupportState(value.legalAndSupport.support);
  invariant(isObject(value.assetClosure), 'assetClosure must be an object');
  exactKeys(value.assetClosure, [
    'allowManifestAuthorizedRuntimeAssetsOnly',
    'originalFlaPublic',
    'originalSwfPublic',
    'rufflePublic',
    'privateEvidencePublic',
    'deployAssetManifestCurrent',
    'deployAssetManifestSha256',
  ], 'assetClosure');
  invariant(value.assetClosure.allowManifestAuthorizedRuntimeAssetsOnly === true
    && value.assetClosure.originalFlaPublic === false
    && value.assetClosure.originalSwfPublic === false
    && value.assetClosure.rufflePublic === false
    && value.assetClosure.privateEvidencePublic === false
    && value.assetClosure.deployAssetManifestCurrent === deployBinding.current
    && value.assetClosure.deployAssetManifestSha256 === deployBinding.sha256,
  'asset closure drifted');
  invariant(Array.isArray(value.publicRoutes) && value.publicRoutes.length === 8,
    'publicRoutes must contain eight required surfaces');
  const publicRouteIds = new Set<string>();
  const publicRoutePaths = new Set<string>();
  for (const [index, rawRoute] of value.publicRoutes.entries()) {
    const expected = PUBLIC_ROUTES[index];
    invariant(isObject(rawRoute), `publicRoutes[${index}] must be an object`);
    exactKeys(rawRoute, [
      'routeId', 'kind', 'paths', 'authorized', 'indexable', 'requiredForLaunch',
    ], `publicRoutes[${index}]`);
    invariant(rawRoute.routeId === expected.routeId
      && rawRoute.kind === expected.kind
      && isObject(rawRoute.paths)
      && rawRoute.paths.en === expected.paths.en
      && rawRoute.paths.es === expected.paths.es
      && typeof rawRoute.authorized === 'boolean'
      && typeof rawRoute.indexable === 'boolean'
      && rawRoute.requiredForLaunch === true,
    `publicRoutes[${index}] is invalid`);
    const routeId = rawRoute.routeId as string;
    invariant(!publicRouteIds.has(routeId),
      `duplicate public route ${rawRoute.routeId}`);
    publicRouteIds.add(routeId);
    for (const routePath of [rawRoute.paths.en, rawRoute.paths.es]) {
      if (routePath === null) continue;
      invariant(!publicRoutePaths.has(routePath as string),
        `duplicate public route path ${routePath}`);
      publicRoutePaths.add(routePath as string);
    }
    invariant(rawRoute.authorized === true || rawRoute.indexable === false,
      `publicRoutes[${index}] unauthorized route cannot be indexable`);
  }
  assertExactStringSet(publicRouteIds, [
    'home', 'all-lessons', 'privacy', 'terms', 'support', 'accessibility',
    'robots', 'sitemap',
  ], 'public route IDs');
  invariant(Array.isArray(value.lessons) && value.lessons.length === 29,
    'catalog must contain 29 Lessons');
  const lessonKeys = new Set<string>();
  const routePaths = new Set<string>();
  let occurrences = 0;
  let registered = 0;
  let uniqueRenderers = 0;
  let completeLessons = 0;
  let routableLessons = 0;
  let strictCompleteLessons = 0;
  const gradeOccurrences: Record<'3' | '4' | '5', number> = {
    '3': 0,
    '4': 0,
    '5': 0,
  };
  const tierCounts = {unavailable: 0, preview: 0, released: 0};
  for (const [index, rawLesson] of value.lessons.entries()) {
    invariant(isObject(rawLesson), `lessons[${index}] must be an object`);
    exactKeys(rawLesson, LESSON_KEYS, `lessons[${index}]`);
    const grade = rawLesson.grade;
    const lessonNumber = rawLesson.lesson;
    invariant([3, 4, 5].includes(grade as number)
      && Number.isInteger(lessonNumber) && Number(lessonNumber) > 0,
    `lessons[${index}] identity is invalid`);
    const expectedKey = `g${String(grade).padStart(2, '0')}-l${String(lessonNumber).padStart(2, '0')}`;
    invariant(rawLesson.lessonKey === expectedKey,
      `lessons[${index}] key drifted`);
    invariant(rawLesson.catalogOrdinal === index + 1,
      `lessons[${index}] order drifted`);
    invariant(!lessonKeys.has(expectedKey), `duplicate Lesson ${expectedKey}`);
    lessonKeys.add(expectedKey);
    invariant(Number.isInteger(rawLesson.pageOccurrenceCount)
      && Number(rawLesson.pageOccurrenceCount) > 0,
    `${expectedKey} occurrence count is invalid`);
    occurrences += Number(rawLesson.pageOccurrenceCount);
    gradeOccurrences[String(grade) as '3' | '4' | '5'] +=
      Number(rawLesson.pageOccurrenceCount);
    invariant(isObject(rawLesson.title)
      && typeof rawLesson.title.en === 'string'
      && rawLesson.title.en.length > 0
      && rawLesson.title.es === null
      && rawLesson.title.esUsesEnglishFallback === true,
    `${expectedKey} title fallback is invalid`);
    exactKeys(rawLesson.title, ['en', 'es', 'esUsesEnglishFallback'],
      `${expectedKey}.title`);
    invariant(isObject(rawLesson.sourceXml)
      && typeof rawLesson.sourceXml.path === 'string'
      && isSha256(rawLesson.sourceXml.sha256),
    `${expectedKey} source XML binding is invalid`);
    exactKeys(rawLesson.sourceXml, ['path', 'sha256'],
      `${expectedKey}.sourceXml`);
    invariant(isObject(rawLesson.currentJs),
      `${expectedKey} Current-JS record is invalid`);
    const currentJs = rawLesson.currentJs;
    exactKeys(currentJs, [
      'registeredOccurrenceCount',
      'registeredUniqueRendererCount',
      'myLessonIntegratedOccurrenceCount',
      'complete',
      'descriptorId',
      'releaseId',
      'engineeringBindingSha256',
    ], `${expectedKey}.currentJs`);
    for (const count of [
      currentJs.registeredOccurrenceCount,
      currentJs.registeredUniqueRendererCount,
      currentJs.myLessonIntegratedOccurrenceCount,
    ]) invariant(Number.isInteger(count) && Number(count) >= 0
      && Number(count) <= Number(rawLesson.pageOccurrenceCount),
      `${expectedKey} Current-JS count is invalid`);
    registered += Number(currentJs.registeredOccurrenceCount);
    uniqueRenderers += Number(currentJs.registeredUniqueRendererCount);
    const complete = currentJs.registeredOccurrenceCount ===
      rawLesson.pageOccurrenceCount
      && currentJs.myLessonIntegratedOccurrenceCount ===
        rawLesson.pageOccurrenceCount;
    invariant(currentJs.complete === complete,
      `${expectedKey} Current-JS completion drifted`);
    if (complete) completeLessons += 1;
    invariant(isSha256(currentJs.engineeringBindingSha256),
      `${expectedKey} engineering binding is invalid`);
    invariant((currentJs.descriptorId === null
      || (typeof currentJs.descriptorId === 'string'
        && currentJs.descriptorId.length > 0))
      && (currentJs.releaseId === null
        || (typeof currentJs.releaseId === 'string'
          && currentJs.releaseId.length > 0))
      && (currentJs.descriptorId === null) === (currentJs.releaseId === null)
      && (!complete || currentJs.descriptorId !== null),
    `${expectedKey} descriptor/release binding is invalid`);
    invariant(isObject(rawLesson.routes)
      && rawLesson.routes.en === `/courses/${grade}/${lessonNumber}`
      && rawLesson.routes.es === `/es/courses/${grade}/${lessonNumber}`,
    `${expectedKey} routes drifted`);
    exactKeys(rawLesson.routes, ['en', 'es'], `${expectedKey}.routes`);
    invariant(!routePaths.has(rawLesson.routes.en as string)
      && !routePaths.has(rawLesson.routes.es as string),
    `${expectedKey} routes are duplicated`);
    routePaths.add(rawLesson.routes.en as string);
    routePaths.add(rawLesson.routes.es as string);
    invariant(isObject(rawLesson.publication),
      `${expectedKey} publication is invalid`);
    const publication = rawLesson.publication;
    exactKeys(publication, [
      'tier',
      'routeAuthorized',
      'indexable',
      ...PUBLICATION_RECEIPTS,
    ], `${expectedKey}.publication`);
    for (const receipt of PUBLICATION_RECEIPTS) {
      invariant(publication[receipt] === null
        || isSha256(publication[receipt]),
      `${expectedKey} ${receipt} is invalid`);
    }
    invariant(['unavailable', 'preview', 'released'].includes(
      publication.tier as string), `${expectedKey} tier is invalid`);
    const tier = publication.tier as PublicLessonTier;
    tierCounts[tier] += 1;
    if (publication.routeAuthorized === true) routableLessons += 1;
    if (isSha256(publication.strictCompletionReceiptSha256)) {
      strictCompleteLessons += 1;
    }
    if (tier === 'unavailable') {
      invariant(publication.routeAuthorized === false
        && publication.indexable === false,
      `${expectedKey} unavailable route must fail closed`);
      invariant(PUBLICATION_RECEIPTS.every((receipt) =>
        publication[receipt] === null),
      `${expectedKey} unavailable Lesson cannot carry receipts`);
    } else {
      invariant(complete
        && typeof currentJs.descriptorId === 'string'
        && typeof currentJs.releaseId === 'string'
        && publication.routeAuthorized === true
        && publication.indexable === true
        && isSha256(publication.runtimeAssetClosureSha256)
        && isSha256(publication.previewProductQaReceiptSha256)
        && isSha256(publication.ownerPreviewDecisionSha256),
      `${expectedKey} Preview/Released evidence is incomplete`);
      if (tier === 'released') {
        for (const receipt of RELEASE_RECEIPTS) {
          invariant(isSha256(publication[receipt]),
            `${expectedKey} Released lacks ${receipt}`);
        }
      }
    }
  }
  invariant(occurrences === 1_751, 'page occurrence denominator drifted');
  invariant(gradeOccurrences['3'] === 546
    && gradeOccurrences['4'] === 645
    && gradeOccurrences['5'] === 560,
  'grade occurrence denominators drifted');
  invariant(registered === 426 && uniqueRenderers === 425
    && completeLessons === 8,
  'Current-JS engineering baseline drifted');
  invariant(isObject(value.summary), 'summary must be an object');
  exactKeys(value.summary, [
    'lessonCount',
    'pageOccurrenceDenominator',
    'registeredCurrentJsOccurrences',
    'registeredCurrentJsUniqueRenderers',
    'currentJsCompleteLessons',
    'publicationCounts',
    'publiclyRoutableLessons',
    'strictCompleteLessons',
    'minimumPreviewLessonsSatisfied',
    'publicFeaturesFailClosed',
    'externalInputsComplete',
    'legalPagesFinal',
    'assetClosureCurrent',
    'launchReadiness',
    'blockers',
  ], 'summary');
  const externalInputsComplete =
    value.legalAndSupport.operatingLegalEntityReceived === true
    && value.legalAndSupport.jurisdictionReceived === true
    && value.legalAndSupport.staffedAdultSupportEmailReceived === true
    && value.legalAndSupport.staffedAdultSupportEmailTwoWayVerified === true;
  const minimumPreviewLessonsSatisfied =
    tierCounts.preview + tierCounts.released >= 2;
  const publicFeatures = value.publicFeatures as Record<string, unknown>;
  const publicFeaturesFailClosed = PUBLIC_FEATURES.every((feature) =>
    publicFeatures[feature] === false);
  const privacy = value.legalAndSupport.privacy as Record<string, unknown>;
  const terms = value.legalAndSupport.terms as Record<string, unknown>;
  const support = value.legalAndSupport.support as Record<string, unknown>;
  const accessibility = value.legalAndSupport.accessibility as Record<string, unknown>;
  const legalPagesFinal = privacy.state === 'approved'
    && terms.state === 'approved'
    && support.state === 'approved'
    && accessibility.state === 'approved';
  const assetClosureCurrent =
    value.assetClosure.deployAssetManifestCurrent === true
    && isSha256(value.assetClosure.deployAssetManifestSha256);
  const blockers: string[] = [];
  if (!minimumPreviewLessonsSatisfied) {
    blockers.push('minimum-preview-lessons-not-satisfied');
  }
  if (!value.legalAndSupport.operatingLegalEntityReceived) {
    blockers.push('operating-legal-entity-not-received');
  }
  if (!value.legalAndSupport.jurisdictionReceived) {
    blockers.push('jurisdiction-not-received');
  }
  if (!value.legalAndSupport.staffedAdultSupportEmailReceived) {
    blockers.push('staffed-adult-support-email-not-received');
  }
  if (!value.legalAndSupport.staffedAdultSupportEmailTwoWayVerified) {
    blockers.push('staffed-adult-support-email-not-two-way-verified');
  }
  if (privacy.state !== 'approved') blockers.push('privacy-review-not-approved');
  if (terms.state !== 'approved') blockers.push('terms-review-not-approved');
  if (support.state !== 'approved') {
    blockers.push('support-runtime-binding-not-approved');
  }
  if (accessibility.state !== 'approved') {
    blockers.push('accessibility-review-not-approved');
  }
  if (!assetClosureCurrent) blockers.push('deploy-asset-manifest-not-current');
  for (const route of value.publicRoutes) {
    if ((route as Record<string, unknown>).authorized !== true) {
      blockers.push(`${String((route as Record<string, unknown>).routeId)}-route-not-authorized`);
    }
  }
  if (!publicFeaturesFailClosed) blockers.push('public-features-not-fail-closed');
  const expectedSummary = {
    lessonCount: 29,
    pageOccurrenceDenominator: 1_751,
    registeredCurrentJsOccurrences: registered,
    registeredCurrentJsUniqueRenderers: uniqueRenderers,
    currentJsCompleteLessons: completeLessons,
    publicationCounts: tierCounts,
    publiclyRoutableLessons: routableLessons,
    strictCompleteLessons,
    minimumPreviewLessonsSatisfied,
    publicFeaturesFailClosed,
    externalInputsComplete,
    legalPagesFinal,
    assetClosureCurrent,
    launchReadiness: blockers.length === 0
      && externalInputsComplete
      && legalPagesFinal
      && value.publicRoutes.every((route) =>
        (route as Record<string, unknown>).authorized === true)
        ? 'GO'
        : 'NO_GO',
    blockers,
  };
  invariant(stableJson(value.summary) === stableJson(expectedSummary),
    'summary must be mechanically derived from manifest state');
  invariant(Array.isArray(value.smokeRoutes), 'smokeRoutes must be an array');
  const expectedSmokeRoutes = deriveRuntimeSmokeRoutes(
    value.publicRoutes,
    value.lessons,
  );
  invariant(JSON.stringify(value.smokeRoutes) ===
    JSON.stringify(expectedSmokeRoutes),
  'smokeRoutes are not mechanically derived');
  for (const [index, smoke] of value.smokeRoutes.entries()) {
    invariant(isObject(smoke)
      && typeof smoke.smokeId === 'string'
      && typeof smoke.path === 'string'
      && smoke.expectedStatus === 200,
    `smokeRoutes[${index}] is invalid`);
  }
  return deepFreeze(value) as unknown as PublicLaunchManifestV1;
}

const manifest = validateRuntimeManifest(manifestDocument);
const publicCatalog = deepFreeze(manifest.lessons.map((lesson) => ({
  lessonKey: lesson.lessonKey,
  catalogOrdinal: lesson.catalogOrdinal,
  grade: lesson.grade,
  lesson: lesson.lesson,
  title: {
    en: lesson.title.en,
    es: lesson.title.es,
    esUsesEnglishFallback: lesson.title.esUsesEnglishFallback,
  },
  pageOccurrenceCount: lesson.pageOccurrenceCount,
  routes: {
    en: lesson.routes.en,
    es: lesson.routes.es,
  },
  publication: {
    tier: lesson.publication.tier,
    routeAuthorized: lesson.publication.routeAuthorized,
    indexable: lesson.publication.indexable,
  },
} satisfies PublicLessonCatalogRow)));

// The full manifest deliberately has no exported value accessor: source paths,
// engineering hashes, and evidence receipts remain inside this server module.
export function publicLaunchSummary(): Readonly<PublicLaunchSummary> {
  return manifest.summary;
}

export function publicLessonCatalog(): readonly PublicLessonCatalogRow[] {
  return publicCatalog;
}

export function publicLessonFor(
  grade: number,
  lesson: number,
): PublicLessonCatalogRow | null {
  return publicCatalog.find((candidate) =>
    candidate.grade === grade && candidate.lesson === lesson
  ) ?? null;
}

export function publicLearningLessons(): readonly PublicLessonCatalogRow[] {
  return Object.freeze(publicCatalog.filter((lesson) =>
    lesson.publication.tier !== 'unavailable'
      && lesson.publication.routeAuthorized
  ));
}

export function isPublicLessonRouteAuthorized(
  grade: number,
  lesson: number,
): boolean {
  const candidate = publicLessonFor(grade, lesson);
  return candidate?.publication.routeAuthorized === true
    && candidate.publication.tier !== 'unavailable';
}

export function publicSmokeRoutes(): readonly PublicLaunchSmokeRoute[] {
  return manifest.smokeRoutes;
}

export function publicFeatureEnabled(feature: PublicFeature): boolean {
  return manifest.publicFeatures[feature];
}
