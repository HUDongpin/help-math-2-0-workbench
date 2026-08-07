export const COURSE_ROOT_TRACE_SPEC_INDEX = "migrations/course-shell-pilot-trace-spec-index.json";
export const LEGACY_ROOT_TRACE_SPEC_INDEX = "migrations/legacy-pilot-trace-spec-index.json";
export const ROOT_CAPTURE_RASTERIZATION_RULE = "ceil-positive-native-stage-dimensions";

const ROOT_TRACE_SPEC_FAMILIES = Object.freeze({
  "course-pilot-original-runtime-trace-specification": Object.freeze({
    id: "course-shell",
    artifactType: "course-pilot-original-runtime-trace-specification",
    indexFile: COURSE_ROOT_TRACE_SPEC_INDEX,
    indexArtifactType: "course-shell-pilot-trace-spec-index",
    nativeStages: Object.freeze([
      {width: 800, height: 600},
      {width: 799.9, height: 599.75},
    ]),
  }),
  "legacy-pilot-original-runtime-trace-specification": Object.freeze({
    id: "legacy-formula-keyterm",
    artifactType: "legacy-pilot-original-runtime-trace-specification",
    indexFile: LEGACY_ROOT_TRACE_SPEC_INDEX,
    indexArtifactType: "legacy-pilot-trace-spec-index",
    nativeStages: Object.freeze([
      {width: 780, height: 379},
      {width: 225, height: 225},
    ]),
  }),
});

function sameStage(left, right) {
  return left?.width === right.width && left?.height === right.height;
}

export function rootTraceSpecFamily(spec, label = "root trace specification") {
  const family = ROOT_TRACE_SPEC_FAMILIES[spec?.artifactType];
  if (!family) throw new Error(`${label} artifact type is not an approved root-capture family`);
  if (
    family.id === "legacy-formula-keyterm" &&
    !String(spec?.animationId || "").match(/^(?:formula|keyterm)-elementary-/)
  ) {
    throw new Error(`${label} legacy family is restricted to indexed elementary formula/keyterm animations`);
  }
  return family;
}

export function assertRootTraceNativeStage(spec, family = rootTraceSpecFamily(spec), label = "root trace specification") {
  const stage = spec?.frameDomain?.nativeStage;
  if (
    !Number.isFinite(stage?.width) || stage.width <= 0 ||
    !Number.isFinite(stage?.height) || stage.height <= 0 ||
    spec?.frameDomain?.fps !== 12 ||
    !family.nativeStages.some((approved) => sameStage(stage, approved))
  ) {
    const expected = family.nativeStages.map(({width, height}) => `${width}x${height}`).join(" or ");
    throw new Error(`${label} must declare an approved ${family.id} native stage (${expected}) at 12 FPS`);
  }
  return {width: stage.width, height: stage.height, fps: 12};
}

export function rootTraceCaptureRaster(
  spec,
  family = rootTraceSpecFamily(spec),
  label = "root trace specification",
) {
  const stage = assertRootTraceNativeStage(spec, family, label);
  const width = Math.ceil(stage.width);
  const height = Math.ceil(stage.height);
  if (!Number.isSafeInteger(width) || width < 1 || !Number.isSafeInteger(height) || height < 1) {
    throw new Error(`${label} does not produce a safe positive integer capture raster`);
  }
  return {
    rule: ROOT_CAPTURE_RASTERIZATION_RULE,
    width,
    height,
  };
}

export function assertRootTraceSpecIndex(index, family, label = "root trace-spec index") {
  if (
    index?.schemaVersion !== 1 || index?.artifactType !== family.indexArtifactType ||
    !Array.isArray(index?.pilots)
  ) {
    throw new Error(`${label} is not the exact ${family.id} index schema`);
  }
  return index;
}

export function rootTraceFamilyForIndexFile(indexFile, label = "root trace-spec index") {
  const family = Object.values(ROOT_TRACE_SPEC_FAMILIES).find((candidate) => candidate.indexFile === indexFile);
  if (!family) throw new Error(`${label} path is not an approved root-capture index`);
  return family;
}
