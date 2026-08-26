#!/usr/bin/env node

import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  buildLedger,
  stableJson,
  validateLedgerContract,
} from "./build-page-only-migration-control-ledger.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const RELEASE_ID = "HELP_MATH_2_PUBLIC_LAUNCH_V1";
export const MANIFEST_SCHEMA_VERSION = 1;
export const GENERATOR_VERSION = "1.2.0";
export const DEFAULT_MANIFEST_PATH = path.join(
  projectRoot,
  "catalog",
  "public-launch-manifest.v1.json",
);
export const PAGE_ONLY_LEDGER_PATH =
  "catalog/page-only-migration-control-ledger.json";
export const PAGE_ONLY_GENERATOR_PATH =
  "scripts/build-page-only-migration-control-ledger.mjs";
export const EXTERNAL_INPUT_STATUS_PATH =
  "catalog/launch-control/external-input-status.v1.json";
export const DEPLOY_ASSET_MANIFEST_PATH =
  "catalog/deploy-asset-manifest.v1.json";

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const SHA256_MARKER_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const ZERO_MARKER = `sha256:${"0".repeat(64)}`;
const EXPECTED_GRADE_OCCURRENCES = Object.freeze({"3": 546, "4": 645, "5": 560});
const PUBLIC_FEATURE_KEYS = Object.freeze([
  "auth",
  "contactForm",
  "family",
  "lrs",
  "novaTutor",
  "teacher",
]);
const PUBLICATION_RECEIPT_KEYS = Object.freeze([
  "audioAcceptanceReceiptSha256",
  "humanVisualAcceptanceReceiptSha256",
  "originalRuntimeReceiptSha256",
  "ownerPreviewDecisionSha256",
  "ownerReleaseDecisionSha256",
  "previewProductQaReceiptSha256",
  "productionTrustReceiptSha256",
  "productionVerificationReceiptSha256",
  "runtimeAssetClosureSha256",
  "strictCompletionReceiptSha256",
  "technicalComparisonReceiptSha256",
]);
const RELEASE_ONLY_RECEIPT_KEYS = Object.freeze([
  "audioAcceptanceReceiptSha256",
  "humanVisualAcceptanceReceiptSha256",
  "originalRuntimeReceiptSha256",
  "ownerReleaseDecisionSha256",
  "productionTrustReceiptSha256",
  "productionVerificationReceiptSha256",
  "strictCompletionReceiptSha256",
  "technicalComparisonReceiptSha256",
]);
const PUBLIC_ROUTES = Object.freeze([
  Object.freeze({
    routeId: "home",
    kind: "localized-page",
    paths: Object.freeze({en: "/", es: "/es"}),
  }),
  Object.freeze({
    routeId: "all-lessons",
    kind: "localized-page",
    paths: Object.freeze({en: "/lessons", es: "/es/lessons"}),
  }),
  Object.freeze({
    routeId: "privacy",
    kind: "localized-page",
    paths: Object.freeze({en: "/privacy", es: "/es/privacy"}),
  }),
  Object.freeze({
    routeId: "terms",
    kind: "localized-page",
    paths: Object.freeze({en: "/terms", es: "/es/terms"}),
  }),
  Object.freeze({
    routeId: "support",
    kind: "localized-page",
    paths: Object.freeze({en: "/support", es: "/es/support"}),
  }),
  Object.freeze({
    routeId: "accessibility",
    kind: "localized-page",
    paths: Object.freeze({en: "/accessibility", es: "/es/accessibility"}),
  }),
  Object.freeze({
    routeId: "robots",
    kind: "machine-route",
    paths: Object.freeze({en: "/robots.txt", es: null}),
  }),
  Object.freeze({
    routeId: "sitemap",
    kind: "machine-route",
    paths: Object.freeze({en: "/sitemap.xml", es: null}),
  }),
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function compareText(left, right) {
  return Buffer.from(left).compare(Buffer.from(right));
}

function exactKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value),
    `${label} must be an object`);
  const actual = Object.keys(value).sort(compareText);
  const wanted = [...expected].sort(compareText);
  invariant(JSON.stringify(actual) === JSON.stringify(wanted),
    `${label} fields must be exactly: ${wanted.join(", ")}`);
}

function isSha256(value) {
  return typeof value === "string" && SHA256_PATTERN.test(value);
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

function projectRelative(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

function lessonKey(grade, lesson) {
  return `g${String(grade).padStart(2, "0")}-l${String(lesson).padStart(2, "0")}`;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function uniqueNonNull(values, label) {
  const unique = [...new Set(values.filter((value) => value !== null))];
  invariant(unique.length <= 1, `${label} must have at most one non-null value`);
  return unique[0] ?? null;
}

function initialPublication() {
  return {
    tier: "unavailable",
    routeAuthorized: false,
    indexable: false,
    runtimeAssetClosureSha256: null,
    previewProductQaReceiptSha256: null,
    ownerPreviewDecisionSha256: null,
    originalRuntimeReceiptSha256: null,
    technicalComparisonReceiptSha256: null,
    audioAcceptanceReceiptSha256: null,
    humanVisualAcceptanceReceiptSha256: null,
    ownerReleaseDecisionSha256: null,
    strictCompletionReceiptSha256: null,
    productionTrustReceiptSha256: null,
    productionVerificationReceiptSha256: null,
  };
}

export function publicRouteTierAuthorizesDeployment(tier, target) {
  invariant(["unavailable", "preview", "released"].includes(tier),
    `unknown public route authorization tier ${String(tier)}`);
  invariant(["preview", "production"].includes(target),
    `unknown public route deployment target ${String(target)}`);
  return tier === "preview" || tier === "released";
}

function buildLessonRecord(lesson, rows, catalogOrdinal) {
  invariant(rows.length === lesson.occurrences,
    `${lessonKey(lesson.grade, lesson.lesson)} row count drifted`);
  const firstRow = rows[0];
  invariant(firstRow, `${lessonKey(lesson.grade, lesson.lesson)} has no rows`);
  const sourceXmlPath = uniqueNonNull(rows.map((row) => row.sourceXml.path),
    `${lessonKey(lesson.grade, lesson.lesson)} source XML path`);
  const sourceXmlSha256 = uniqueNonNull(rows.map((row) => row.sourceXml.sha256),
    `${lessonKey(lesson.grade, lesson.lesson)} source XML SHA-256`);
  invariant(sourceXmlPath === lesson.sourceXmlPath,
    `${lessonKey(lesson.grade, lesson.lesson)} source XML path disagrees with Lesson summary`);
  invariant(isSha256(sourceXmlSha256),
    `${lessonKey(lesson.grade, lesson.lesson)} source XML SHA-256 is invalid`);

  const descriptorId = uniqueNonNull(rows.map((row) =>
    row.registeredCurrentJs.evidence.descriptorId),
  `${lessonKey(lesson.grade, lesson.lesson)} descriptor ID`);
  const releaseId = uniqueNonNull(rows.map((row) =>
    row.registeredCurrentJs.evidence.releaseId),
  `${lessonKey(lesson.grade, lesson.lesson)} release ID`);
  const complete = lesson.registeredCurrentJs === lesson.occurrences
    && lesson.myLessons === lesson.occurrences;
  if (complete) {
    invariant(typeof descriptorId === "string" && descriptorId.length > 0,
      `${lessonKey(lesson.grade, lesson.lesson)} complete Current-JS lacks descriptor ID`);
    invariant(typeof releaseId === "string" && releaseId.length > 0,
      `${lessonKey(lesson.grade, lesson.lesson)} complete Current-JS lacks release ID`);
  }

  const engineeringProjection = rows.map((row) => ({
    placementId: row.placementId,
    sourceOccurrence: row.sourceOccurrence,
    catalogAnimationId: row.catalogAnimationId,
    swfSha256: row.swfSha256,
    uniqueRendererId: row.uniqueRendererId,
    registeredCurrentJs: row.registeredCurrentJs,
    myLessons: row.myLessons,
  }));

  return {
    lessonKey: lessonKey(lesson.grade, lesson.lesson),
    catalogOrdinal,
    grade: lesson.grade,
    lesson: lesson.lesson,
    title: {
      en: lesson.title,
      es: null,
      esUsesEnglishFallback: true,
    },
    pageOccurrenceCount: lesson.occurrences,
    sourceXml: {
      path: sourceXmlPath,
      sha256: sourceXmlSha256,
    },
    currentJs: {
      registeredOccurrenceCount: lesson.registeredCurrentJs,
      registeredUniqueRendererCount: lesson.registeredUniqueRenderers,
      myLessonIntegratedOccurrenceCount: lesson.myLessons,
      complete,
      descriptorId,
      releaseId,
      engineeringBindingSha256: sha256Text(stableJson(engineeringProjection)),
    },
    routes: {
      en: `/courses/${lesson.grade}/${lesson.lesson}`,
      es: `/es/courses/${lesson.grade}/${lesson.lesson}`,
    },
    publication: initialPublication(),
  };
}

export function derivePublicLaunchSmokeRoutes(
  publicRoutes,
  lessons,
  target,
  launchReadiness = "NO_GO",
) {
  invariant(["preview", "production"].includes(target),
    `unknown smoke deployment target ${String(target)}`);
  invariant(["GO", "NO_GO"].includes(launchReadiness),
    `unknown launch readiness ${String(launchReadiness)}`);
  if (target === "production" && launchReadiness !== "GO") return [];
  const result = [];
  for (const route of publicRoutes) {
    if (!publicRouteTierAuthorizesDeployment(
      route.authorizationTier,
      target,
    )) continue;
    result.push({
      smokeId: `${route.routeId}-en`,
      path: route.paths.en,
      locale: route.kind === "localized-page" ? "en" : null,
      kind: route.routeId === "robots"
        ? "robots"
        : route.routeId === "sitemap"
          ? "sitemap"
          : "public-page",
      expectedStatus: 200,
    });
    if (route.paths.es !== null) {
      result.push({
        smokeId: `${route.routeId}-es`,
        path: route.paths.es,
        locale: "es",
        kind: "public-page",
        expectedStatus: 200,
      });
    }
  }
  for (const lesson of lessons) {
    if (!lesson.publication.routeAuthorized
      || !publicRouteTierAuthorizesDeployment(
        lesson.publication.tier,
        target,
      )) continue;
    result.push({
      smokeId: `${lesson.lessonKey}-en`,
      path: lesson.routes.en,
      locale: "en",
      kind: "lesson",
      expectedStatus: 200,
    });
    result.push({
      smokeId: `${lesson.lessonKey}-es`,
      path: lesson.routes.es,
      locale: "es",
      kind: "lesson",
      expectedStatus: 200,
    });
  }
  return result;
}

export function derivePublicLaunchSummary({lessons, publicFeatures, legalAndSupport, assetClosure,
  publicRoutes}) {
  const publicationCounts = {unavailable: 0, preview: 0, released: 0};
  for (const lesson of lessons) publicationCounts[lesson.publication.tier] += 1;
  const publiclyRoutableLessons = lessons.filter((lesson) =>
    lesson.publication.routeAuthorized).length;
  const strictCompleteLessons = lessons.filter((lesson) =>
    isSha256(lesson.publication.strictCompletionReceiptSha256)).length;
  const minimumPreviewLessonsSatisfied =
    publicationCounts.preview + publicationCounts.released >= 2;
  const publicFeaturesFailClosed = Object.values(publicFeatures).every(
    (value) => value === false,
  );
  const externalInputsComplete =
    legalAndSupport.operatingLegalEntityReceived === true
    && legalAndSupport.jurisdictionReceived === true
    && legalAndSupport.staffedAdultSupportEmailReceived === true
    && legalAndSupport.staffedAdultSupportEmailTwoWayVerified === true;
  const legalPagesFinal = legalAndSupport.privacy.state === "approved"
    && legalAndSupport.terms.state === "approved"
    && legalAndSupport.support.state === "approved"
    && legalAndSupport.accessibility.state === "approved";
  const requiredRoutesAuthorized = publicRoutes.every((route) =>
    publicRouteTierAuthorizesDeployment(route.authorizationTier, "production"));
  const assetClosureCurrent = assetClosure.deployAssetManifestCurrent === true
    && isSha256(assetClosure.deployAssetManifestSha256);
  const blockers = [];
  if (!minimumPreviewLessonsSatisfied) blockers.push("minimum-preview-lessons-not-satisfied");
  if (!legalAndSupport.operatingLegalEntityReceived) {
    blockers.push("operating-legal-entity-not-received");
  }
  if (!legalAndSupport.jurisdictionReceived) {
    blockers.push("jurisdiction-not-received");
  }
  if (!legalAndSupport.staffedAdultSupportEmailReceived) {
    blockers.push("staffed-adult-support-email-not-received");
  }
  if (!legalAndSupport.staffedAdultSupportEmailTwoWayVerified) {
    blockers.push("staffed-adult-support-email-not-two-way-verified");
  }
  if (legalAndSupport.privacy.state !== "approved") blockers.push("privacy-review-not-approved");
  if (legalAndSupport.terms.state !== "approved") blockers.push("terms-review-not-approved");
  if (legalAndSupport.support.state !== "approved") blockers.push("support-runtime-binding-not-approved");
  if (legalAndSupport.accessibility.state !== "approved") blockers.push("accessibility-review-not-approved");
  if (!assetClosureCurrent) blockers.push("deploy-asset-manifest-not-current");
  for (const route of publicRoutes) {
    if (!publicRouteTierAuthorizesDeployment(
      route.authorizationTier,
      "production",
    )) blockers.push(`${route.routeId}-production-route-not-authorized`);
  }
  if (!publicFeaturesFailClosed) blockers.push("public-features-not-fail-closed");
  const launchReadiness = blockers.length === 0
    && externalInputsComplete
    && legalPagesFinal
    && requiredRoutesAuthorized
      ? "GO"
      : "NO_GO";

  return {
    lessonCount: lessons.length,
    pageOccurrenceDenominator: lessons.reduce(
      (sum, lesson) => sum + lesson.pageOccurrenceCount,
      0,
    ),
    registeredCurrentJsOccurrences: lessons.reduce(
      (sum, lesson) => sum + lesson.currentJs.registeredOccurrenceCount,
      0,
    ),
    registeredCurrentJsUniqueRenderers: lessons.reduce(
      (sum, lesson) => sum + lesson.currentJs.registeredUniqueRendererCount,
      0,
    ),
    currentJsCompleteLessons: lessons.filter((lesson) => lesson.currentJs.complete).length,
    publicationCounts,
    publiclyRoutableLessons,
    strictCompleteLessons,
    minimumPreviewLessonsSatisfied,
    publicFeaturesFailClosed,
    externalInputsComplete,
    legalPagesFinal,
    assetClosureCurrent,
    launchReadiness,
    blockers,
  };
}

function validateReviewState(review, label) {
  exactKeys(review, ["state", "approvalReceiptSha256", "contentSha256"], label);
  invariant(["missing", "draft", "approved"].includes(review.state),
    `${label}.state is invalid`);
  if (review.state === "approved") {
    invariant(isSha256(review.approvalReceiptSha256)
      && isSha256(review.contentSha256),
    `${label} approved state requires receipt and content SHA-256`);
  } else {
    invariant(review.approvalReceiptSha256 === null,
      `${label} unapproved state cannot carry approval receipt`);
    invariant(review.state === "draft"
      ? review.contentSha256 === null || isSha256(review.contentSha256)
      : review.contentSha256 === null,
    `${label} content SHA-256 is invalid for ${review.state}`);
  }
}

function validateSupportState(support) {
  exactKeys(support, [
    "state",
    "mailboxVerificationReceiptSha256",
    "runtimeValueBindingSha256",
    "approvalReceiptSha256",
  ], "legalAndSupport.support");
  invariant([
    "private-input-received",
    "runtime-binding-pending",
    "approved",
  ].includes(support.state), "legalAndSupport.support.state is invalid");
  invariant(isSha256(support.mailboxVerificationReceiptSha256),
    "support mailbox verification receipt is invalid");
  if (support.state === "approved") {
    invariant(isSha256(support.runtimeValueBindingSha256)
      && isSha256(support.approvalReceiptSha256),
    "approved support requires runtime binding and approval receipts");
  } else {
    invariant(support.runtimeValueBindingSha256 === null
      && support.approvalReceiptSha256 === null,
    "unapproved support cannot carry runtime or approval bindings");
  }
}

function validatePublication(publication, currentJs, label) {
  exactKeys(publication, [
    "tier",
    "routeAuthorized",
    "indexable",
    ...PUBLICATION_RECEIPT_KEYS,
  ], label);
  invariant(["unavailable", "preview", "released"].includes(publication.tier),
    `${label}.tier is invalid`);
  invariant(typeof publication.routeAuthorized === "boolean"
    && typeof publication.indexable === "boolean",
  `${label} route/index flags must be booleans`);
  for (const key of PUBLICATION_RECEIPT_KEYS) {
    invariant(publication[key] === null || isSha256(publication[key]),
      `${label}.${key} must be null or a SHA-256`);
  }
  if (publication.tier === "unavailable") {
    invariant(publication.routeAuthorized === false
      && publication.indexable === false,
    `${label} unavailable Lesson cannot be routed or indexed`);
    invariant(PUBLICATION_RECEIPT_KEYS.every((key) => publication[key] === null),
      `${label} unavailable Lesson cannot carry publication receipts`);
    return;
  }
  invariant(currentJs.complete === true
    && currentJs.registeredOccurrenceCount === currentJs.pageOccurrenceCount
    && currentJs.myLessonIntegratedOccurrenceCount === currentJs.pageOccurrenceCount
    && typeof currentJs.descriptorId === "string"
    && currentJs.descriptorId.length > 0
    && typeof currentJs.releaseId === "string"
    && currentJs.releaseId.length > 0,
  `${label} Preview/Released requires complete Current-JS and My Lesson binding`);
  invariant(publication.routeAuthorized === true && publication.indexable === true,
    `${label} Preview/Released must be routed and indexed`);
  invariant(isSha256(publication.runtimeAssetClosureSha256)
    && isSha256(publication.previewProductQaReceiptSha256)
    && isSha256(publication.ownerPreviewDecisionSha256),
  `${label} Preview/Released lacks asset, product QA, or Owner Preview receipt`);
  if (publication.tier === "preview") {
    return;
  }
  invariant(RELEASE_ONLY_RECEIPT_KEYS.every((key) => isSha256(publication[key])),
    `${label} Released requires every strict release receipt`);
}

function validateLesson(lesson, index) {
  const label = `lessons[${index}]`;
  exactKeys(lesson, [
    "lessonKey",
    "catalogOrdinal",
    "grade",
    "lesson",
    "title",
    "pageOccurrenceCount",
    "sourceXml",
    "currentJs",
    "routes",
    "publication",
  ], label);
  invariant(lesson.lessonKey === lessonKey(lesson.grade, lesson.lesson),
    `${label}.lessonKey drifted`);
  invariant(lesson.catalogOrdinal === index + 1,
    `${label}.catalogOrdinal drifted`);
  invariant([3, 4, 5].includes(lesson.grade)
    && Number.isInteger(lesson.lesson) && lesson.lesson > 0,
  `${label} grade/Lesson identity is invalid`);
  invariant(Number.isInteger(lesson.pageOccurrenceCount)
    && lesson.pageOccurrenceCount > 0,
  `${label}.pageOccurrenceCount is invalid`);
  exactKeys(lesson.title, ["en", "es", "esUsesEnglishFallback"], `${label}.title`);
  invariant(typeof lesson.title.en === "string" && lesson.title.en.length > 0,
    `${label}.title.en is invalid`);
  invariant(lesson.title.es === null && lesson.title.esUsesEnglishFallback === true,
    `${label} must retain honest English fallback until Spanish title review`);
  exactKeys(lesson.sourceXml, ["path", "sha256"], `${label}.sourceXml`);
  invariant(typeof lesson.sourceXml.path === "string"
    && lesson.sourceXml.path.length > 0
    && isSha256(lesson.sourceXml.sha256),
  `${label}.sourceXml is invalid`);
  exactKeys(lesson.currentJs, [
    "registeredOccurrenceCount",
    "registeredUniqueRendererCount",
    "myLessonIntegratedOccurrenceCount",
    "complete",
    "descriptorId",
    "releaseId",
    "engineeringBindingSha256",
  ], `${label}.currentJs`);
  for (const key of [
    "registeredOccurrenceCount",
    "registeredUniqueRendererCount",
    "myLessonIntegratedOccurrenceCount",
  ]) {
    invariant(Number.isInteger(lesson.currentJs[key])
      && lesson.currentJs[key] >= 0
      && lesson.currentJs[key] <= lesson.pageOccurrenceCount,
    `${label}.currentJs.${key} is invalid`);
  }
  invariant(typeof lesson.currentJs.complete === "boolean"
    && isSha256(lesson.currentJs.engineeringBindingSha256),
  `${label}.currentJs completion/binding is invalid`);
  invariant(lesson.currentJs.complete === (
    lesson.currentJs.registeredOccurrenceCount === lesson.pageOccurrenceCount
      && lesson.currentJs.myLessonIntegratedOccurrenceCount ===
        lesson.pageOccurrenceCount
  ), `${label}.currentJs.complete drifted`);
  invariant(lesson.currentJs.descriptorId === null
    || typeof lesson.currentJs.descriptorId === "string",
  `${label}.currentJs.descriptorId is invalid`);
  invariant(lesson.currentJs.releaseId === null
    || typeof lesson.currentJs.releaseId === "string",
  `${label}.currentJs.releaseId is invalid`);
  exactKeys(lesson.routes, ["en", "es"], `${label}.routes`);
  invariant(lesson.routes.en === `/courses/${lesson.grade}/${lesson.lesson}`
    && lesson.routes.es === `/es/courses/${lesson.grade}/${lesson.lesson}`,
  `${label}.routes drifted`);
  validatePublication(lesson.publication, {
    ...lesson.currentJs,
    pageOccurrenceCount: lesson.pageOccurrenceCount,
  }, `${label}.publication`);
}

export function publicLaunchMarkerProjection(manifest) {
  return {...cloneJson(manifest), generatedMarker: ZERO_MARKER};
}

export function computePublicLaunchGeneratedMarker(manifest) {
  return `sha256:${sha256Text(stableJson(publicLaunchMarkerProjection(manifest)))}`;
}

export function validatePublicLaunchManifestContract(manifest, {
  validateGeneratedMarker = true,
} = {}) {
  exactKeys(manifest, [
    "schemaVersion",
    "manifestKind",
    "releaseId",
    "generator",
    "generatedMarker",
    "sourceBindings",
    "launchContract",
    "publicFeatures",
    "legalAndSupport",
    "assetClosure",
    "publicRoutes",
    "smokeRoutes",
    "summary",
    "lessons",
  ], "manifest");
  invariant(manifest.schemaVersion === MANIFEST_SCHEMA_VERSION,
    "manifest schemaVersion drifted");
  invariant(manifest.manifestKind === "help-math-public-launch-manifest",
    "manifestKind drifted");
  invariant(manifest.releaseId === RELEASE_ID, "releaseId drifted");
  exactKeys(manifest.generator,
    ["path", "version", "sha256", "determinism"], "generator");
  invariant(manifest.generator.path === "scripts/build-public-launch-manifest.mjs"
    && manifest.generator.version === GENERATOR_VERSION
    && isSha256(manifest.generator.sha256)
    && manifest.generator.determinism ===
      "no-clock-no-current-head-source-ordered-publication-tier-v3",
  "generator binding is invalid");
  invariant(SHA256_MARKER_PATTERN.test(manifest.generatedMarker),
    "generatedMarker shape is invalid");
  if (validateGeneratedMarker) {
    invariant(manifest.generatedMarker ===
      computePublicLaunchGeneratedMarker(manifest),
    "generatedMarker is stale");
  }

  exactKeys(manifest.sourceBindings, [
    "pageOnlyControlLedger",
    "externalInputStatus",
    "deployAssetManifest",
  ], "sourceBindings");
  exactKeys(manifest.sourceBindings.pageOnlyControlLedger, [
    "path", "sha256", "generatorPath", "generatorSha256",
  ], "sourceBindings.pageOnlyControlLedger");
  invariant(manifest.sourceBindings.pageOnlyControlLedger.path ===
    PAGE_ONLY_LEDGER_PATH
    && isSha256(manifest.sourceBindings.pageOnlyControlLedger.sha256)
    && manifest.sourceBindings.pageOnlyControlLedger.generatorPath ===
      PAGE_ONLY_GENERATOR_PATH
    && isSha256(manifest.sourceBindings.pageOnlyControlLedger.generatorSha256),
  "page-only source binding is invalid");
  exactKeys(manifest.sourceBindings.externalInputStatus,
    ["path", "sha256", "privateReceiptSha256"],
    "sourceBindings.externalInputStatus");
  invariant(manifest.sourceBindings.externalInputStatus.path ===
    EXTERNAL_INPUT_STATUS_PATH
    && isSha256(manifest.sourceBindings.externalInputStatus.sha256)
    && isSha256(manifest.sourceBindings.externalInputStatus.privateReceiptSha256),
  "external-input source binding is invalid");
  exactKeys(manifest.sourceBindings.deployAssetManifest,
    ["path", "sha256", "current"],
    "sourceBindings.deployAssetManifest");
  invariant(manifest.sourceBindings.deployAssetManifest.path ===
    DEPLOY_ASSET_MANIFEST_PATH
    && (manifest.sourceBindings.deployAssetManifest.sha256 === null
      || isSha256(manifest.sourceBindings.deployAssetManifest.sha256))
    && typeof manifest.sourceBindings.deployAssetManifest.current === "boolean",
  "deploy-asset source binding is invalid");

  exactKeys(manifest.launchContract, [
    "audience",
    "locales",
    "identityMode",
    "progressStorage",
    "progressClearAndResetRequired",
    "lessonCount",
    "pageOccurrenceDenominator",
    "courseShellCount",
    "modernMyLessonHostRetained",
    "minimumPreviewLessonsForLearningMvp",
  ], "launchContract");
  invariant(manifest.launchContract.audience ===
    "us-k12-families-educators-and-anonymous-learners-under-adult-supervision"
    && JSON.stringify(manifest.launchContract.locales) === JSON.stringify(["en", "es"])
    && manifest.launchContract.identityMode === "anonymous-only"
    && manifest.launchContract.progressStorage === "browser-local-only"
    && manifest.launchContract.progressClearAndResetRequired === true
    && manifest.launchContract.lessonCount === 29
    && manifest.launchContract.pageOccurrenceDenominator === 1_751
    && manifest.launchContract.courseShellCount === 0
    && manifest.launchContract.modernMyLessonHostRetained === true
    && manifest.launchContract.minimumPreviewLessonsForLearningMvp === 2,
  "launch contract drifted");

  exactKeys(manifest.publicFeatures, PUBLIC_FEATURE_KEYS, "publicFeatures");
  for (const key of PUBLIC_FEATURE_KEYS) {
    invariant(manifest.publicFeatures[key] === false,
      `publicFeatures.${key} must be the boolean false`);
  }

  exactKeys(manifest.legalAndSupport, [
    "operatingLegalEntityReceived",
    "jurisdictionReceived",
    "staffedAdultSupportEmailReceived",
    "staffedAdultSupportEmailTwoWayVerified",
    "privateInputReceiptSha256",
    "privacy",
    "terms",
    "support",
    "accessibility",
  ], "legalAndSupport");
  for (const key of [
    "operatingLegalEntityReceived",
    "jurisdictionReceived",
    "staffedAdultSupportEmailReceived",
    "staffedAdultSupportEmailTwoWayVerified",
  ]) invariant(typeof manifest.legalAndSupport[key] === "boolean",
    `legalAndSupport.${key} must be boolean`);
  invariant(isSha256(manifest.legalAndSupport.privateInputReceiptSha256),
    "private input receipt SHA-256 is invalid");
  validateReviewState(manifest.legalAndSupport.privacy, "legalAndSupport.privacy");
  validateReviewState(manifest.legalAndSupport.terms, "legalAndSupport.terms");
  validateReviewState(manifest.legalAndSupport.accessibility,
    "legalAndSupport.accessibility");
  validateSupportState(manifest.legalAndSupport.support);

  exactKeys(manifest.assetClosure, [
    "allowManifestAuthorizedRuntimeAssetsOnly",
    "originalFlaPublic",
    "originalSwfPublic",
    "rufflePublic",
    "privateEvidencePublic",
    "deployAssetManifestCurrent",
    "deployAssetManifestSha256",
  ], "assetClosure");
  invariant(manifest.assetClosure.allowManifestAuthorizedRuntimeAssetsOnly === true
    && manifest.assetClosure.originalFlaPublic === false
    && manifest.assetClosure.originalSwfPublic === false
    && manifest.assetClosure.rufflePublic === false
    && manifest.assetClosure.privateEvidencePublic === false,
  "asset exposure boundary drifted");
  invariant(manifest.assetClosure.deployAssetManifestCurrent ===
    manifest.sourceBindings.deployAssetManifest.current
    && manifest.assetClosure.deployAssetManifestSha256 ===
      manifest.sourceBindings.deployAssetManifest.sha256,
  "deploy-asset binding disagrees with asset closure");

  invariant(Array.isArray(manifest.publicRoutes)
    && manifest.publicRoutes.length === PUBLIC_ROUTES.length,
  "publicRoutes must contain the exact launch surface set");
  const routePaths = [];
  manifest.publicRoutes.forEach((route, index) => {
    const expected = PUBLIC_ROUTES[index];
    exactKeys(route, [
      "routeId",
      "kind",
      "paths",
      "authorizationTier",
      "productionIndexable",
      "requiredForLaunch",
    ], `publicRoutes[${index}]`);
    exactKeys(route.paths, ["en", "es"], `publicRoutes[${index}].paths`);
    invariant(route.routeId === expected.routeId
      && route.kind === expected.kind
      && route.paths.en === expected.paths.en
      && route.paths.es === expected.paths.es
      && ["unavailable", "preview", "released"].includes(
        route.authorizationTier,
      )
      && typeof route.productionIndexable === "boolean"
      && route.requiredForLaunch === true,
    `publicRoutes[${index}] drifted`);
    invariant(route.authorizationTier !== "unavailable"
      || route.productionIndexable === false,
    `publicRoutes[${index}] unavailable route cannot be production-indexable`);
    invariant(route.kind === "localized-page"
      || route.productionIndexable === false,
    `publicRoutes[${index}] machine route cannot be production-indexable`);
    routePaths.push(route.paths.en);
    if (route.paths.es !== null) routePaths.push(route.paths.es);
  });
  invariant(new Set(routePaths).size === routePaths.length,
    "public route paths must be unique");

  invariant(Array.isArray(manifest.lessons) && manifest.lessons.length === 29,
    "manifest must contain 29 Lessons");
  manifest.lessons.forEach(validateLesson);
  invariant(new Set(manifest.lessons.map((lesson) => lesson.lessonKey)).size === 29,
    "Lesson keys must be unique");
  const lessonRoutes = manifest.lessons.flatMap((lesson) =>
    [lesson.routes.en, lesson.routes.es]);
  invariant(new Set(lessonRoutes).size === lessonRoutes.length,
    "Lesson routes must be unique");

  const smokeLaunchReadiness = derivePublicLaunchSummary(manifest)
    .launchReadiness;
  exactKeys(manifest.smokeRoutes, ["preview", "production"], "smokeRoutes");
  for (const target of ["preview", "production"]) {
    invariant(Array.isArray(manifest.smokeRoutes[target]),
      `smokeRoutes.${target} must be an array`);
    const expectedSmokeRoutes = derivePublicLaunchSmokeRoutes(
      manifest.publicRoutes,
      manifest.lessons,
      target,
      smokeLaunchReadiness,
    );
    invariant(JSON.stringify(manifest.smokeRoutes[target]) ===
      JSON.stringify(expectedSmokeRoutes),
    `smokeRoutes.${target} must be mechanically derived from target-authorized surfaces`);
  }

  exactKeys(manifest.summary, [
    "lessonCount",
    "pageOccurrenceDenominator",
    "registeredCurrentJsOccurrences",
    "registeredCurrentJsUniqueRenderers",
    "currentJsCompleteLessons",
    "publicationCounts",
    "publiclyRoutableLessons",
    "strictCompleteLessons",
    "minimumPreviewLessonsSatisfied",
    "publicFeaturesFailClosed",
    "externalInputsComplete",
    "legalPagesFinal",
    "assetClosureCurrent",
    "launchReadiness",
    "blockers",
  ], "summary");
  exactKeys(manifest.summary.publicationCounts,
    ["unavailable", "preview", "released"], "summary.publicationCounts");
  const expectedSummary = derivePublicLaunchSummary(manifest);
  invariant(JSON.stringify(manifest.summary) === JSON.stringify(expectedSummary),
    "summary must be mechanically derived from the manifest");
  invariant(manifest.summary.lessonCount === 29
    && manifest.summary.pageOccurrenceDenominator === 1_751,
  "public denominator drifted");
  invariant(manifest.lessons.filter(({grade}) => grade === 3)
    .reduce((sum, lesson) => sum + lesson.pageOccurrenceCount, 0) ===
      EXPECTED_GRADE_OCCURRENCES["3"]
    && manifest.lessons.filter(({grade}) => grade === 4)
      .reduce((sum, lesson) => sum + lesson.pageOccurrenceCount, 0) ===
        EXPECTED_GRADE_OCCURRENCES["4"]
    && manifest.lessons.filter(({grade}) => grade === 5)
      .reduce((sum, lesson) => sum + lesson.pageOccurrenceCount, 0) ===
        EXPECTED_GRADE_OCCURRENCES["5"],
  "grade occurrence denominators drifted");
  invariant(manifest.summary.registeredCurrentJsOccurrences === 426
    && manifest.summary.registeredCurrentJsUniqueRenderers === 425
    && manifest.summary.currentJsCompleteLessons === 8,
  "Current-JS engineering baseline drifted");
  invariant(manifest.summary.launchReadiness === "NO_GO",
    "v1 generator has no authority to produce launch GO");
  return true;
}

async function readOptionalDeployBinding(deployManifestPath) {
  try {
    const bytes = await readFile(deployManifestPath);
    return {
      path: DEPLOY_ASSET_MANIFEST_PATH,
      sha256: sha256Text(bytes),
      // Presence is not currentness. A reviewed C0 deploy-manifest successor
      // must replace this fail-closed value with a verified contract.
      current: false,
    };
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    return {path: DEPLOY_ASSET_MANIFEST_PATH, sha256: null, current: false};
  }
}

export async function buildPublicLaunchManifest({
  manifestPath = DEFAULT_MANIFEST_PATH,
  pageOnlyLedgerPath = path.join(projectRoot, PAGE_ONLY_LEDGER_PATH),
  externalInputStatusPath = path.join(projectRoot, EXTERNAL_INPUT_STATUS_PATH),
  deployAssetManifestPath = path.join(projectRoot, DEPLOY_ASSET_MANIFEST_PATH),
} = {}) {
  void manifestPath;
  const recomputedLedger = await buildLedger();
  validateLedgerContract(recomputedLedger);
  const checkedInLedgerBytes = await readFile(pageOnlyLedgerPath, "utf8");
  invariant(checkedInLedgerBytes === stableJson(recomputedLedger),
    `${projectRelative(pageOnlyLedgerPath)} is stale; public launch manifest generation is blocked`);
  const externalInputStatusBytes = await readFile(externalInputStatusPath, "utf8");
  const externalInputStatus = JSON.parse(externalInputStatusBytes);
  invariant(externalInputStatus.releaseId === RELEASE_ID,
    "external input status releaseId drifted");
  const legalEntity = externalInputStatus.inputs?.operatingLegalEntity;
  const jurisdiction = externalInputStatus.inputs?.jurisdictionStateAndCountry;
  const supportEmail = externalInputStatus.inputs?.staffedAdultSupportEmail;
  const privateReceiptHashes = [
    legalEntity?.privateReceiptSha256,
    jurisdiction?.privateReceiptSha256,
    supportEmail?.privateReceiptSha256,
  ];
  invariant(privateReceiptHashes.every(isSha256)
    && new Set(privateReceiptHashes).size === 1,
  "external inputs must share one valid private receipt binding");

  const rowsByLesson = new Map();
  for (const row of recomputedLedger.rows) {
    const key = lessonKey(row.grade, row.lesson);
    const rows = rowsByLesson.get(key) ?? [];
    rows.push(row);
    rowsByLesson.set(key, rows);
  }
  const lessons = recomputedLedger.lessons.map((lesson, index) =>
    buildLessonRecord(lesson, rowsByLesson.get(
      lessonKey(lesson.grade, lesson.lesson),
    ) ?? [], index + 1));
  const deployAssetManifest = await readOptionalDeployBinding(
    deployAssetManifestPath,
  );
  const publicRoutes = PUBLIC_ROUTES.map((route) => ({
    ...route,
    paths: {...route.paths},
    // C1 core introduces authority; no route becomes launch-authorized until
    // its real consumer and review gates are integrated on an exact successor.
    authorizationTier: "unavailable",
    productionIndexable: false,
    requiredForLaunch: true,
  }));
  const publicFeatures = {
    novaTutor: false,
    lrs: false,
    auth: false,
    teacher: false,
    family: false,
    contactForm: false,
  };
  const legalAndSupport = {
    operatingLegalEntityReceived: legalEntity.received === true,
    jurisdictionReceived: jurisdiction.received === true,
    staffedAdultSupportEmailReceived: supportEmail.received === true,
    staffedAdultSupportEmailTwoWayVerified:
      supportEmail.twoWayVerificationComplete === true,
    privateInputReceiptSha256: privateReceiptHashes[0],
    privacy: {
      state: "draft",
      approvalReceiptSha256: null,
      contentSha256: null,
    },
    terms: {
      state: "draft",
      approvalReceiptSha256: null,
      contentSha256: null,
    },
    support: {
      state: supportEmail.received === true
        ? "runtime-binding-pending"
        : "private-input-received",
      mailboxVerificationReceiptSha256: supportEmail.privateReceiptSha256,
      runtimeValueBindingSha256: null,
      approvalReceiptSha256: null,
    },
    accessibility: {
      state: "missing",
      approvalReceiptSha256: null,
      contentSha256: null,
    },
  };
  const assetClosure = {
    allowManifestAuthorizedRuntimeAssetsOnly: true,
    originalFlaPublic: false,
    originalSwfPublic: false,
    rufflePublic: false,
    privateEvidencePublic: false,
    deployAssetManifestCurrent: deployAssetManifest.current,
    deployAssetManifestSha256: deployAssetManifest.sha256,
  };
  const manifest = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    manifestKind: "help-math-public-launch-manifest",
    releaseId: RELEASE_ID,
    generator: {
      path: "scripts/build-public-launch-manifest.mjs",
      version: GENERATOR_VERSION,
      sha256: await sha256File(scriptPath),
      determinism: "no-clock-no-current-head-source-ordered-publication-tier-v3",
    },
    generatedMarker: ZERO_MARKER,
    sourceBindings: {
      pageOnlyControlLedger: {
        path: PAGE_ONLY_LEDGER_PATH,
        sha256: sha256Text(checkedInLedgerBytes),
        generatorPath: PAGE_ONLY_GENERATOR_PATH,
        generatorSha256: await sha256File(path.join(projectRoot,
          PAGE_ONLY_GENERATOR_PATH)),
      },
      externalInputStatus: {
        path: EXTERNAL_INPUT_STATUS_PATH,
        sha256: sha256Text(externalInputStatusBytes),
        privateReceiptSha256: privateReceiptHashes[0],
      },
      deployAssetManifest,
    },
    launchContract: {
      audience:
        "us-k12-families-educators-and-anonymous-learners-under-adult-supervision",
      locales: ["en", "es"],
      identityMode: "anonymous-only",
      progressStorage: "browser-local-only",
      progressClearAndResetRequired: true,
      lessonCount: 29,
      pageOccurrenceDenominator: 1_751,
      courseShellCount: 0,
      modernMyLessonHostRetained: true,
      minimumPreviewLessonsForLearningMvp: 2,
    },
    publicFeatures,
    legalAndSupport,
    assetClosure,
    publicRoutes,
    smokeRoutes: {preview: [], production: []},
    summary: null,
    lessons,
  };
  manifest.summary = derivePublicLaunchSummary(manifest);
  manifest.smokeRoutes = {
    preview: derivePublicLaunchSmokeRoutes(
      publicRoutes,
      lessons,
      "preview",
      manifest.summary.launchReadiness,
    ),
    production: derivePublicLaunchSmokeRoutes(
      publicRoutes,
      lessons,
      "production",
      manifest.summary.launchReadiness,
    ),
  };
  manifest.generatedMarker = computePublicLaunchGeneratedMarker(manifest);
  validatePublicLaunchManifestContract(manifest);
  return manifest;
}

export async function buildPublicLaunchArtifact(options = {}) {
  const manifest = await buildPublicLaunchManifest(options);
  return {manifest, text: stableJson(manifest)};
}

export async function checkPublicLaunchArtifact({
  manifestPath = DEFAULT_MANIFEST_PATH,
  ...options
} = {}) {
  const artifact = await buildPublicLaunchArtifact({manifestPath, ...options});
  let currentText = null;
  try {
    currentText = await readFile(manifestPath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return {
    ok: currentText === artifact.text,
    current: currentText !== null && currentText === artifact.text,
    artifact,
  };
}

export async function writePublicLaunchArtifact({
  manifestPath = DEFAULT_MANIFEST_PATH,
  ...options
} = {}) {
  const artifact = await buildPublicLaunchArtifact({manifestPath, ...options});
  const temporaryPath = `${manifestPath}.tmp-${process.pid}`;
  await rm(temporaryPath, {force: true});
  try {
    await writeFile(temporaryPath, artifact.text, {flag: "wx", mode: 0o644});
    await rename(temporaryPath, manifestPath);
  } finally {
    await rm(temporaryPath, {force: true});
  }
  return artifact;
}

export function parseArguments(argv) {
  const options = {check: false, json: false, help: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else if (argument === "--json") options.json = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

function usage() {
  return `Usage:
  npm run build:public-launch -- [--json]
  npm run verify:public-launch -- [--json]

Default mode atomically writes the deterministic 29-Lesson public launch
manifest. --check is byte-for-byte read-only. A PASS validates honest NO_GO
state; it never grants launch authorization.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (options.check) {
    const result = await checkPublicLaunchArtifact();
    const status = {
      status: result.ok ? "PASS" : "FAIL",
      manifestCurrent: result.current,
      launchReadiness: result.artifact.manifest.summary.launchReadiness,
      lessonCount: result.artifact.manifest.summary.lessonCount,
      pageOccurrenceDenominator:
        result.artifact.manifest.summary.pageOccurrenceDenominator,
      previewLessons:
        result.artifact.manifest.summary.publicationCounts.preview,
      releasedLessons:
        result.artifact.manifest.summary.publicationCounts.released,
    };
    process.stdout.write(options.json
      ? `${JSON.stringify(status, null, 2)}\n`
      : `${status.status}: public launch manifest ${result.ok ? "is current" : "is missing or stale"}; launch readiness remains ${status.launchReadiness}\n`);
    if (!result.ok) process.exitCode = 1;
    return;
  }
  const artifact = await writePublicLaunchArtifact();
  const status = {
    status: "PASS",
    manifestPath: projectRelative(DEFAULT_MANIFEST_PATH),
    launchReadiness: artifact.manifest.summary.launchReadiness,
    lessonCount: artifact.manifest.summary.lessonCount,
    pageOccurrenceDenominator:
      artifact.manifest.summary.pageOccurrenceDenominator,
  };
  process.stdout.write(options.json
    ? `${JSON.stringify(status, null, 2)}\n`
    : `PASS: generated ${status.lessonCount}-Lesson/${status.pageOccurrenceDenominator}-occurrence public launch manifest; launch readiness remains ${status.launchReadiness}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  await main();
}
