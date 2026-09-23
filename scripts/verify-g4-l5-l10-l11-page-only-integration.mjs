#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = "packages/demos/private-current-js-registry.json";
const LESSONS = Object.freeze([
  Object.freeze({
    lesson: 5,
    count: 53,
    calibrationId: "g4-l5-page-only-current-js-53-v1",
    generatedPath: "apps/web/lib/g4-l5-page-only-current-js.generated.ts",
  }),
  Object.freeze({
    lesson: 10,
    count: 46,
    calibrationId: "g4-l10-page-only-current-js-46-v1",
    generatedPath: "apps/web/lib/g4-l10-page-only-current-js.generated.ts",
  }),
  Object.freeze({
    lesson: 11,
    count: 43,
    calibrationId: "g4-l11-page-only-current-js-43-v1",
    generatedPath: "apps/web/lib/g4-l11-page-only-current-js.generated.ts",
  }),
]);

function invariant(value, message) {
  if (!value) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function bytes(relativePath) {
  return readFile(path.join(ROOT, relativePath));
}

async function json(relativePath) {
  return JSON.parse((await bytes(relativePath)).toString("utf8"));
}

async function generatedData(relativePath) {
  const source = (await bytes(relativePath)).toString("utf8");
  const prefix = "Object.freeze(";
  const suffix = " as const);";
  const start = source.indexOf(prefix);
  const end = source.lastIndexOf(suffix);
  invariant(start >= 0 && end > start, `${relativePath}: generated data shape changed`);
  return JSON.parse(source.slice(start + prefix.length, end));
}

const [registry, animationCatalog, lessonCatalog] = await Promise.all([
  json(REGISTRY_PATH),
  json("catalog/animations.json"),
  json("catalog/lessons.json"),
]);
invariant(
  registry.schemaVersion === 2 &&
    registry.registryScope === "private-engineering" &&
    registry.calibrations?.length === 3,
  "unified private registry must contain exactly three calibrations",
);

const results = [];
const allKeys = [];
for (const expected of LESSONS) {
  const calibration = registry.calibrations.find(
    ({calibrationId}) => calibrationId === expected.calibrationId,
  );
  invariant(calibration, `${expected.calibrationId}: registry calibration absent`);
  const [freeze, freezeBytes, data] = await Promise.all([
    json(calibration.freezeManifest),
    bytes(calibration.freezeManifest),
    generatedData(expected.generatedPath),
  ]);
  const lesson = lessonCatalog.lessons?.find((candidate) =>
    candidate.grade === 4 && candidate.lesson === expected.lesson
  );
  invariant(
    lesson && lesson.pageReferenceCount === expected.count &&
      data.calibrationId === expected.calibrationId &&
      data.course?.grade === 4 && data.course?.lesson === expected.lesson &&
      data.course?.activePageCount === expected.count &&
      data.course?.courseShellCount === 0 &&
      data.course?.sourceXmlPath === lesson.path &&
      data.course?.sourceXmlSha256 === lesson.sha256 &&
      data.freeze?.path === calibration.freezeManifest &&
      data.freeze?.sha256 === sha256(freezeBytes) &&
      freeze.calibrationId === expected.calibrationId &&
      freeze.scope?.activePageCount === expected.count &&
      freeze.scope?.courseShellCount === 0 &&
      freeze.scope?.selectedPageCount === expected.count &&
      freeze.modernMyLesson?.exactSourceOrderMemberCount === expected.count &&
      freeze.modernMyLesson?.legacyCourseShellIncluded === false &&
      calibration.entries?.length === expected.count &&
      freeze.selectedPages?.length === expected.count &&
      data.pages?.length === expected.count,
    `G4 L${expected.lesson}: denominator, shell, freeze, or source identity drifted`,
  );

  const catalogOrder = animationCatalog.animations.flatMap((animation) =>
    (animation.references?.courseXml ?? [])
      .filter(({sourceXmlPath}) => sourceXmlPath === lesson.path)
      .map((reference) => ({
        occurrence: reference.occurrence,
        animationId: animation.animationId,
        assetId: animation.assetId,
        swfSha256: animation.source?.sha256,
      }))
  ).sort((left, right) => left.occurrence - right.occurrence);
  const keys = calibration.entries.map(({key}) => key);
  invariant(
    catalogOrder.length === expected.count &&
      new Set(keys).size === expected.count &&
      keys.every((key, index) =>
        key === catalogOrder[index]?.animationId &&
        key === freeze.selectedPages[index]?.animationId &&
        key === data.pages[index]?.animationId &&
        calibration.entries[index]?.module === `./modules/${key}` &&
        calibration.entries[index]?.maturity === "private-current-js" &&
        freeze.selectedPages[index]?.globalPageOrdinal === index + 1 &&
        data.pages[index]?.ordinal === index + 1 &&
        data.pages[index]?.sourceOccurrence === index + 1 &&
        data.pages[index]?.assetId === catalogOrder[index]?.assetId &&
        (data.pages[index]?.swfSha256 === undefined ||
          data.pages[index]?.swfSha256 === catalogOrder[index]?.swfSha256)
      ),
    `G4 L${expected.lesson}: exact source order or registry binding drifted`,
  );
  invariant(
    Object.values(freeze.acceptanceEffects ?? {}).every((value) => value === false) &&
      Object.values(data.acceptanceEffects ?? {}).every((value) => value === false),
    `G4 L${expected.lesson}: acceptance-neutral boundary widened`,
  );
  allKeys.push(...keys);
  results.push(Object.freeze({
    grade: 4,
    lesson: expected.lesson,
    registered: keys.length,
    activePages: expected.count,
    sourceOrder: "exact-course-xml-occurrence",
    courseShellCount: 0,
    firstAnimationId: keys[0],
    lastAnimationId: keys.at(-1),
    freezeSha256: data.freeze.sha256,
  }));
}

invariant(
  allKeys.length === 142 && new Set(allKeys).size === 142,
  "unified G4 L5/L10/L11 registry must contain 142 unique page animations",
);

process.stdout.write(`${JSON.stringify({
  status: "PASS",
  registered: 142,
  activePages: 142,
  sourceOrder: "exact-course-xml-occurrence",
  courseShellCount: 0,
  lessons: results,
}, null, 2)}\n`);
