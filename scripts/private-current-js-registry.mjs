function invariant(value, message) {
  if (!value) throw new Error(message);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function calibrationOrder(left, right) {
  const lessonIdentity = (value) => {
    const match = String(value?.calibrationId ?? "").match(
      /^g(\d+)-l(\d+)-/,
    );
    return match
      ? [Number(match[1]), Number(match[2])]
      : [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
  };
  const [leftGrade, leftLesson] = lessonIdentity(left);
  const [rightGrade, rightLesson] = lessonIdentity(right);
  return leftGrade - rightGrade || leftLesson - rightLesson ||
    String(left.calibrationId).localeCompare(String(right.calibrationId));
}

function calibrationsFrom(document) {
  invariant(
    document?.registryScope === "private-engineering",
    "private Current-JS registry scope changed",
  );
  if (document.schemaVersion === 1) {
    return [{
      calibrationId: document.calibrationId,
      freezeManifest: document.freezeManifest,
      entries: document.entries,
    }];
  }
  invariant(
    document.schemaVersion === 2 && Array.isArray(document.calibrations),
    "private Current-JS registry must use schemaVersion 1 or 2",
  );
  return document.calibrations;
}

function validateCalibration(calibration) {
  invariant(
    typeof calibration?.calibrationId === "string" &&
      calibration.calibrationId.length > 0 &&
      typeof calibration.freezeManifest === "string" &&
      calibration.freezeManifest.startsWith(
        "catalog/product-bridge-calibrations/",
      ) &&
      Array.isArray(calibration.entries) && calibration.entries.length > 0,
    "private Current-JS calibration is malformed",
  );
  const keys = calibration.entries.map((entry) => entry?.key);
  invariant(
    keys.every((key) => typeof key === "string" && key.length > 0) &&
      new Set(keys).size === keys.length,
    `${calibration.calibrationId}: private registry keys are invalid`,
  );
}

export function privateCurrentJsCalibrationMatches(document, expected) {
  validateCalibration(expected);
  const matches = calibrationsFrom(document).filter(
    ({calibrationId}) => calibrationId === expected.calibrationId,
  );
  return matches.length === 1 &&
    JSON.stringify(matches[0]) === JSON.stringify(expected);
}

export function upsertPrivateCurrentJsCalibration(document, calibration) {
  validateCalibration(calibration);
  const calibrations = calibrationsFrom(document)
    .filter(({calibrationId}) => calibrationId !== calibration.calibrationId)
    .map(clone);
  calibrations.push(clone(calibration));
  calibrations.sort(calibrationOrder);

  const calibrationIds = calibrations.map(({calibrationId}) => calibrationId);
  invariant(
    new Set(calibrationIds).size === calibrationIds.length,
    "duplicate private Current-JS calibrationId",
  );
  const entryKeys = calibrations.flatMap(({entries}) =>
    entries.map(({key}) => key)
  );
  invariant(
    new Set(entryKeys).size === entryKeys.length,
    "duplicate private Current-JS animation key across calibrations",
  );

  return {
    schemaVersion: 2,
    registryScope: "private-engineering",
    calibrations,
  };
}
