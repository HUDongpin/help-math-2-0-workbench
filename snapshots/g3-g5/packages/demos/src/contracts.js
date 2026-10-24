export const DEMO_VALIDATION_STATUSES = Object.freeze([
  "draft",
  "conditional",
  "approved",
]);

const DEMO_ID_PATTERN = /^Conversion_\d+_\d+$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const OWN = Object.prototype.hasOwnProperty;

export class DemoManifestValidationError extends TypeError {
  constructor(issues) {
    super(`Invalid HELP Math demo manifest:\n- ${issues.join("\n- ")}`);
    this.name = "DemoManifestValidationError";
    this.issues = Object.freeze([...issues]);
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function validateLocalizedText(value, path, issues) {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object with non-empty en and es strings`);
    return;
  }

  for (const locale of ["en", "es"]) {
    if (typeof value[locale] !== "string" || value[locale].trim() === "") {
      issues.push(`${path}.${locale} must be a non-empty string`);
    }
  }
}

function validateStage(value, issues) {
  if (!isRecord(value)) {
    issues.push("stage must be an object with positive integer width and height");
    return;
  }

  for (const dimension of ["width", "height"]) {
    if (!isPositiveInteger(value[dimension])) {
      issues.push(`stage.${dimension} must be a positive integer`);
    }
  }
}

function collectManifestIssues(value) {
  const issues = [];

  if (!isRecord(value)) {
    return ["manifest must be an object"];
  }

  if (typeof value.id !== "string" || !DEMO_ID_PATTERN.test(value.id)) {
    issues.push("id must match Conversion_<group>_<item>");
  }

  validateLocalizedText(value.title, "title", issues);
  validateLocalizedText(value.summary, "summary", issues);
  validateStage(value.stage, issues);

  if (typeof value.fps !== "number" || !Number.isFinite(value.fps) || value.fps <= 0) {
    issues.push("fps must be a positive finite number");
  }
  if (!isPositiveInteger(value.frameCount)) {
    issues.push("frameCount must be a positive integer");
  }
  if (!isPositiveInteger(value.durationMs)) {
    issues.push("durationMs must be a positive integer");
  }

  if (!Array.isArray(value.sourceHashes) || value.sourceHashes.length === 0) {
    issues.push("sourceHashes must contain at least one SHA-256 hash");
  } else {
    const seenHashes = new Set();
    value.sourceHashes.forEach((hash, index) => {
      if (typeof hash !== "string" || !SHA256_PATTERN.test(hash)) {
        issues.push(`sourceHashes[${index}] must be a lowercase SHA-256 hex digest`);
      } else if (seenHashes.has(hash)) {
        issues.push(`sourceHashes[${index}] duplicates an earlier hash`);
      }
      seenHashes.add(hash);
    });
  }

  if (!DEMO_VALIDATION_STATUSES.includes(value.validationStatus)) {
    issues.push(
      `validationStatus must be one of ${DEMO_VALIDATION_STATUSES.join(", ")}`,
    );
  }

  if (
    typeof value.fps === "number" &&
    Number.isFinite(value.fps) &&
    value.fps > 0 &&
    isPositiveInteger(value.frameCount) &&
    isPositiveInteger(value.durationMs)
  ) {
    const expectedDurationMs = Math.round((value.frameCount / value.fps) * 1000);
    if (Math.abs(value.durationMs - expectedDurationMs) > 1) {
      issues.push(
        `durationMs must agree with frameCount / fps (expected about ${expectedDurationMs})`,
      );
    }
  }

  return issues;
}

function freezeManifest(value) {
  return Object.freeze({
    id: value.id,
    title: Object.freeze({ en: value.title.en, es: value.title.es }),
    summary: Object.freeze({ en: value.summary.en, es: value.summary.es }),
    stage: Object.freeze({
      width: value.stage.width,
      height: value.stage.height,
    }),
    fps: value.fps,
    frameCount: value.frameCount,
    durationMs: value.durationMs,
    sourceHashes: Object.freeze([...value.sourceHashes]),
    validationStatus: value.validationStatus,
  });
}

export function validateDemoManifest(value) {
  const issues = collectManifestIssues(value);
  return Object.freeze({
    success: issues.length === 0,
    issues: Object.freeze(issues),
  });
}

export function parseDemoManifest(value) {
  const result = validateDemoManifest(value);
  if (!result.success) {
    throw new DemoManifestValidationError(result.issues);
  }
  return freezeManifest(value);
}

export function isDemoManifest(value) {
  return validateDemoManifest(value).success;
}

export function isProductionReadyManifest(value) {
  return isDemoManifest(value) && value.validationStatus === "approved";
}

export function assertProductionReadyManifest(value) {
  const manifest = parseDemoManifest(value);
  if (manifest.validationStatus !== "approved") {
    throw new DemoManifestValidationError([
      `${manifest.id} is ${manifest.validationStatus}; production requires approved`,
    ]);
  }
  return manifest;
}

export function hasManifestField(value, field) {
  return isRecord(value) && OWN.call(value, field);
}
