import {createHash} from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {PNG} from 'pngjs';

export const CAPTURE_MANIFEST_SCHEMA_VERSION = 1;
export const CAPTURE_MANIFEST_ARTIFACT_TYPE =
  'canvas-backing-capture-manifest';
export const COMPARISON_REPORT_ARTIFACT_TYPE =
  'canvas-scale-comparison-report';
export const K1_PARITY_REPORT_ARTIFACT_TYPE =
  'canvas-k1-parity-report';
export const STATIC_NORMALIZED_RGB_RMSE_THRESHOLD = 0.05;
export const TRANSITION_NORMALIZED_RGB_RMSE_THRESHOLD = 0.08;
export const DOWNSAMPLE_ALGORITHM_ID =
  'rgba8-srgb-premultiplied-alpha-box-2x-v1';
export const NORMALIZED_RGB_RMSE_ALGORITHM_ID =
  'normalized-rgb-rmse-v1';

// Match the product capture contract. coverage-v2 requirement and trace IDs
// use colon-delimited source identities; these values are JSON/DOM metadata,
// never path segments (capture output directories are independently hashed).
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const AUTHORITY_EFFECTS = Object.freeze({
  originalRuntimeFidelityAcceptance: false,
  audioAcceptance: false,
  humanVisualAcceptance: false,
  ownerAcceptance: false,
  strictCompletion: false,
  releaseAuthorization: false,
  publicationAuthorization: false,
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function reportBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

export function makeHashBoundDocument(artifactType, payload) {
  const bound = {
    schemaVersion: CAPTURE_MANIFEST_SCHEMA_VERSION,
    artifactType,
    payload,
  };
  return {
    schemaVersion: bound.schemaVersion,
    artifactType: bound.artifactType,
    contentSha256: sha256(Buffer.from(canonicalJson(bound))),
    payload,
  };
}

export function verifyHashBoundDocument(document, expectedArtifactType) {
  assert(document && typeof document === 'object' && !Array.isArray(document),
    'Hash-bound document must be an object');
  const documentKeys = Object.keys(document).sort();
  assert(canonicalJson(documentKeys) === canonicalJson([
    'artifactType', 'contentSha256', 'payload', 'schemaVersion',
  ]), 'Hash-bound document has unexpected or missing top-level keys');
  assert(document.schemaVersion === CAPTURE_MANIFEST_SCHEMA_VERSION,
    `Unsupported schemaVersion: ${document.schemaVersion}`);
  assert(document.artifactType === expectedArtifactType,
    `Expected artifactType ${expectedArtifactType}; received ${document.artifactType}`);
  assert(SHA256_PATTERN.test(document.contentSha256 || ''),
    'contentSha256 must be a lowercase 64-character SHA-256');
  const expected = sha256(Buffer.from(canonicalJson({
    schemaVersion: document.schemaVersion,
    artifactType: document.artifactType,
    payload: document.payload,
  })));
  assert(document.contentSha256 === expected,
    `Hash-bound document contentSha256 mismatch: expected ${expected}, received ${document.contentSha256}`);
  return true;
}

function isInside(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

export function resolveInside(projectRoot, value, label) {
  assert(typeof value === 'string' && value.length > 0,
    `${label} must be a non-empty path`);
  const root = path.resolve(projectRoot);
  const resolved = path.resolve(root, value);
  assert(isInside(resolved, root), `${label} must stay inside projectRoot`);
  return resolved;
}

function portable(value) {
  return value.split(path.sep).join('/');
}

export function projectRelative(projectRoot, candidate) {
  const root = path.resolve(projectRoot);
  const resolved = resolveInside(root, candidate, 'path');
  return portable(path.relative(root, resolved));
}

function positiveInteger(value, label) {
  assert(Number.isSafeInteger(value) && value > 0,
    `${label} must be a positive safe integer`);
  return value;
}

function safeId(value, label) {
  assert(typeof value === 'string' && SAFE_ID_PATTERN.test(value),
    `${label} must be a stable capture identifier`);
  return value;
}

export function validateCaptureIdentity(identity) {
  assert(identity && typeof identity === 'object' && !Array.isArray(identity),
    'identity must be an object');
  const identityKeys = Object.keys(identity).sort();
  assert(canonicalJson(identityKeys) === canonicalJson([
    'animationId',
    'entryStateSha256',
    'frame',
    'frameDomainId',
    'language',
    'requirementId',
    'scenario',
    'seed',
    'traceId',
  ]), 'identity has unexpected or missing keys');
  safeId(identity.animationId, 'identity.animationId');
  safeId(identity.requirementId, 'identity.requirementId');
  safeId(identity.frameDomainId, 'identity.frameDomainId');
  safeId(identity.traceId, 'identity.traceId');
  assert(SHA256_PATTERN.test(identity.entryStateSha256 || ''),
    'identity.entryStateSha256 must be a lowercase 64-character SHA-256');
  positiveInteger(identity.frame, 'identity.frame');
  safeId(identity.scenario, 'identity.scenario');
  assert(identity.language === 'en' || identity.language === 'es',
    'identity.language must be en or es');
  safeId(identity.seed, 'identity.seed');
  return identity;
}

export function validateImage(image, label = 'image') {
  assert(image && typeof image === 'object', `${label} must be an object`);
  positiveInteger(image.width, `${label}.width`);
  positiveInteger(image.height, `${label}.height`);
  assert(Buffer.isBuffer(image.data) || image.data instanceof Uint8Array,
    `${label}.data must be RGBA bytes`);
  const expectedBytes = image.width * image.height * 4;
  assert(Number.isSafeInteger(expectedBytes), `${label} dimensions are too large`);
  assert(image.data.length === expectedBytes,
    `${label} RGBA byte length must be ${expectedBytes}; received ${image.data.length}`);
  return image;
}

export function decodePng(bytes, label = 'PNG') {
  assert(Buffer.isBuffer(bytes) || bytes instanceof Uint8Array,
    `${label} must be bytes`);
  const input = Buffer.from(bytes);
  assert(input.length >= PNG_SIGNATURE.length &&
    input.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE),
  `${label} is not a PNG`);
  let decoded;
  try {
    decoded = PNG.sync.read(input, {checkCRC: true});
  } catch (error) {
    throw new Error(`${label} could not be decoded: ${error.message}`);
  }
  return validateImage({
    width: decoded.width,
    height: decoded.height,
    data: Buffer.from(decoded.data),
  }, label);
}

export function encodePng(image) {
  validateImage(image);
  const png = new PNG({
    width: image.width,
    height: image.height,
    colorType: 6,
    inputColorType: 6,
    bitDepth: 8,
  });
  png.data = Buffer.from(image.data);
  return PNG.sync.write(png, {
    colorType: 6,
    inputColorType: 6,
    bitDepth: 8,
    deflateChunkSize: 32 * 1024,
    deflateLevel: 9,
    deflateStrategy: 3,
    inputHasAlpha: true,
  });
}

export function decodeRawRgba(bytes, width, height, label = 'raw RGBA') {
  positiveInteger(width, `${label}.width`);
  positiveInteger(height, `${label}.height`);
  return validateImage({width, height, data: Buffer.from(bytes)}, label);
}

// The input bytes are straight-alpha RGBA8 values in sRGB numeric space. Each
// output pixel is a 2x2 area/box average. RGB is premultiplied by alpha before
// averaging and unpremultiplied afterwards. There is deliberately no sRGB to
// linear-light conversion. All divisions use deterministic integer round-half-
// up; fully transparent output pixels have canonical RGB 0,0,0.
export function downsampleRgba2xBoxPremultipliedSrgb(image) {
  validateImage(image, '2x image');
  assert(image.width % 2 === 0 && image.height % 2 === 0,
    '2x image dimensions must both be even');
  const width = image.width / 2;
  const height = image.height / 2;
  const output = Buffer.alloc(width * height * 4);

  for (let outputY = 0; outputY < height; outputY += 1) {
    for (let outputX = 0; outputX < width; outputX += 1) {
      const sourceX = outputX * 2;
      const sourceY = outputY * 2;
      const sourceOffsets = [
        (sourceY * image.width + sourceX) * 4,
        (sourceY * image.width + sourceX + 1) * 4,
        ((sourceY + 1) * image.width + sourceX) * 4,
        ((sourceY + 1) * image.width + sourceX + 1) * 4,
      ];
      let alphaSum = 0;
      let redPremultipliedSum = 0;
      let greenPremultipliedSum = 0;
      let bluePremultipliedSum = 0;
      for (const offset of sourceOffsets) {
        const alpha = image.data[offset + 3];
        alphaSum += alpha;
        redPremultipliedSum += image.data[offset] * alpha;
        greenPremultipliedSum += image.data[offset + 1] * alpha;
        bluePremultipliedSum += image.data[offset + 2] * alpha;
      }
      const outputOffset = (outputY * width + outputX) * 4;
      if (alphaSum === 0) {
        output[outputOffset] = 0;
        output[outputOffset + 1] = 0;
        output[outputOffset + 2] = 0;
      } else {
        const halfAlphaSum = Math.floor(alphaSum / 2);
        output[outputOffset] = Math.floor(
          (redPremultipliedSum + halfAlphaSum) / alphaSum,
        );
        output[outputOffset + 1] = Math.floor(
          (greenPremultipliedSum + halfAlphaSum) / alphaSum,
        );
        output[outputOffset + 2] = Math.floor(
          (bluePremultipliedSum + halfAlphaSum) / alphaSum,
        );
      }
      output[outputOffset + 3] = Math.floor((alphaSum + 2) / 4);
    }
  }
  return {width, height, data: output};
}

export function normalizedRgbRmse(reference, implementation) {
  validateImage(reference, 'reference');
  validateImage(implementation, 'implementation');
  assert(reference.width === implementation.width &&
    reference.height === implementation.height,
  `Image dimensions differ: ${reference.width}x${reference.height} versus ${implementation.width}x${implementation.height}`);
  let squaredError = 0;
  for (let offset = 0; offset < reference.data.length; offset += 4) {
    for (let channel = 0; channel < 3; channel += 1) {
      const delta = reference.data[offset + channel] -
        implementation.data[offset + channel];
      squaredError += delta * delta;
    }
  }
  const channelCount = reference.width * reference.height * 3;
  return {
    squaredError,
    channelCount,
    normalizedRmse: Math.sqrt(squaredError / channelCount) / 255,
  };
}

export function classifyNormalizedRgbRmse(normalizedRmse, thresholdClass) {
  assert(Number.isFinite(normalizedRmse) && normalizedRmse >= 0 &&
    normalizedRmse <= 1,
  'normalizedRmse must be between 0 and 1');
  assert(thresholdClass === 'static' || thresholdClass === 'transition',
    'thresholdClass must be static or transition');
  const threshold = thresholdClass === 'static'
    ? STATIC_NORMALIZED_RGB_RMSE_THRESHOLD
    : TRANSITION_NORMALIZED_RGB_RMSE_THRESHOLD;
  return {
    thresholdClass,
    threshold,
    comparison: 'less-than-or-equal',
    status: normalizedRmse <= threshold ? 'pass' : 'fail',
  };
}

function capturePayload({
  projectRoot,
  inputPath,
  inputFormat,
  identity,
  stageWidth,
  stageHeight,
  scale,
  sourceBytes,
  rgbaBytes,
  pngBytes,
}) {
  return {
    evidenceClass: 'current-javascript-backing-image-fixture',
    identity,
    capture: {
      stage: {width: stageWidth, height: stageHeight},
      scale,
      backing: {
        width: stageWidth * scale,
        height: stageHeight * scale,
      },
      pixelFormat: 'rgba8-srgb-straight-alpha',
    },
    algorithms: {
      colorSpace: '8-bit-srgb-no-linearization',
      storedAlpha: 'straight-alpha',
      scaleComparisonAlpha: 'premultiplied-alpha',
      pngArtifact: inputFormat === 'png'
        ? 'source-png-bytes-preserved'
        : 'pngjs-sync-rgba8-fixed-options-v1',
    },
    sourceFixture: {
      path: projectRelative(projectRoot, inputPath),
      format: inputFormat,
      bytes: sourceBytes.length,
      sha256: sha256(sourceBytes),
    },
    artifacts: {
      rgba: {
        path: 'backing.rgba',
        bytes: rgbaBytes.length,
        sha256: sha256(rgbaBytes),
      },
      png: {
        path: 'backing.png',
        bytes: pngBytes.length,
        sha256: sha256(pngBytes),
      },
    },
    authorityEffects: {...AUTHORITY_EFFECTS},
  };
}

function validateCaptureParameters({
  projectRoot,
  inputPath,
  outputDirectory,
  inputFormat,
  identity,
  stageWidth,
  stageHeight,
  scale,
}) {
  const resolvedRoot = path.resolve(projectRoot);
  const resolvedInput = resolveInside(resolvedRoot, inputPath, 'inputPath');
  const resolvedOutput = resolveInside(
    resolvedRoot,
    outputDirectory,
    'outputDirectory',
  );
  assert(inputFormat === 'rgba' || inputFormat === 'png',
    'inputFormat must be rgba or png');
  validateCaptureIdentity(identity);
  positiveInteger(stageWidth, 'stageWidth');
  positiveInteger(stageHeight, 'stageHeight');
  assert(scale === 1 || scale === 2, 'scale must be 1 or 2');
  for (const filename of ['backing.rgba', 'backing.png', 'capture-manifest.json']) {
    assert(resolvedInput !== path.join(resolvedOutput, filename),
      `inputPath must not overwrite generated ${filename}`);
  }
  return {resolvedRoot, resolvedInput, resolvedOutput};
}

async function buildCaptureArtifacts(options) {
  const {
    resolvedRoot,
    resolvedInput,
    resolvedOutput,
  } = validateCaptureParameters(options);
  const sourceBytes = await readFile(resolvedInput);
  const expectedWidth = options.stageWidth * options.scale;
  const expectedHeight = options.stageHeight * options.scale;
  const image = options.inputFormat === 'png'
    ? decodePng(sourceBytes, 'input PNG')
    : decodeRawRgba(sourceBytes, expectedWidth, expectedHeight, 'input raw RGBA');
  assert(image.width === expectedWidth && image.height === expectedHeight,
    `Input dimensions must be ${expectedWidth}x${expectedHeight}; received ${image.width}x${image.height}`);
  const rgbaBytes = Buffer.from(image.data);
  // Preserve PNG input bytes exactly so the k=1 verifier can detect encoder-
  // level drift as well as decoded-pixel drift. Raw RGBA input has no PNG
  // representation, so only that lane receives the deterministic encoding.
  const pngBytes = options.inputFormat === 'png'
    ? Buffer.from(sourceBytes)
    : encodePng(image);
  const manifest = makeHashBoundDocument(
    CAPTURE_MANIFEST_ARTIFACT_TYPE,
    capturePayload({
      projectRoot: resolvedRoot,
      inputPath: resolvedInput,
      inputFormat: options.inputFormat,
      identity: options.identity,
      stageWidth: options.stageWidth,
      stageHeight: options.stageHeight,
      scale: options.scale,
      sourceBytes,
      rgbaBytes,
      pngBytes,
    }),
  );
  return {
    root: resolvedRoot,
    outputDirectory: resolvedOutput,
    rgbaBytes,
    pngBytes,
    manifest,
    manifestBytes: reportBytes(manifest),
  };
}

async function assertFileBytes(expected, destination, label) {
  let actual;
  try {
    actual = await readFile(destination);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`${label} is missing: ${destination}`);
    }
    throw error;
  }
  assert(actual.equals(expected),
    `${label} is stale or byte-mismatched: ${destination}`);
}

let atomicCounter = 0;

async function writeAtomicWithinWork(projectRoot, destination, bytes) {
  const temporaryParent = path.join(projectRoot, 'work', '.canvas-backing-tmp');
  await mkdir(temporaryParent, {recursive: true});
  const temporaryDirectory = await mkdtemp(
    path.join(temporaryParent, `write-${process.pid}-${atomicCounter += 1}-`),
  );
  const temporaryFile = path.join(temporaryDirectory, 'artifact');
  try {
    await writeFile(temporaryFile, bytes, {flag: 'wx'});
    await mkdir(path.dirname(destination), {recursive: true});
    await rename(temporaryFile, destination);
  } finally {
    await rm(temporaryDirectory, {recursive: true, force: true});
  }
}

export async function writeOrCheckBytes({
  projectRoot,
  destination,
  bytes,
  check = false,
  label = 'artifact',
}) {
  const resolvedDestination = resolveInside(projectRoot, destination, label);
  if (check) {
    await assertFileBytes(Buffer.from(bytes), resolvedDestination, label);
  } else {
    await writeAtomicWithinWork(
      path.resolve(projectRoot),
      resolvedDestination,
      Buffer.from(bytes),
    );
  }
  return resolvedDestination;
}

export async function writeOrCheckHashBoundReport({
  projectRoot,
  outputPath,
  document,
  check = false,
}) {
  return writeOrCheckBytes({
    projectRoot,
    destination: outputPath,
    bytes: reportBytes(document),
    check,
    label: 'hash-bound report',
  });
}

export async function captureBackingFixture(options) {
  const built = await buildCaptureArtifacts(options);
  const rgbaPath = path.join(built.outputDirectory, 'backing.rgba');
  const pngPath = path.join(built.outputDirectory, 'backing.png');
  const manifestPath = path.join(
    built.outputDirectory,
    'capture-manifest.json',
  );
  await writeOrCheckBytes({
    projectRoot: built.root,
    destination: rgbaPath,
    bytes: built.rgbaBytes,
    check: options.check,
    label: 'normalized RGBA artifact',
  });
  await writeOrCheckBytes({
    projectRoot: built.root,
    destination: pngPath,
    bytes: built.pngBytes,
    check: options.check,
    label: 'normalized PNG artifact',
  });
  await writeOrCheckBytes({
    projectRoot: built.root,
    destination: manifestPath,
    bytes: built.manifestBytes,
    check: options.check,
    label: 'capture manifest',
  });
  return {
    manifest: built.manifest,
    manifestPath,
    rgbaPath,
    pngPath,
    checked: Boolean(options.check),
  };
}

function exactObjectKeys(value, keys, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value),
    `${label} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  assert(canonicalJson(actual) === canonicalJson(expected),
    `${label} must have exactly these keys: ${expected.join(', ')}`);
}

function validateFileDescriptor(value, label) {
  exactObjectKeys(value, ['path', 'bytes', 'sha256'], label);
  assert(typeof value.path === 'string' && value.path.length > 0 &&
    !path.isAbsolute(value.path), `${label}.path must be relative`);
  positiveInteger(value.bytes, `${label}.bytes`);
  assert(SHA256_PATTERN.test(value.sha256 || ''),
    `${label}.sha256 must be a lowercase 64-character SHA-256`);
}

function validateCaptureManifestShape(document) {
  verifyHashBoundDocument(document, CAPTURE_MANIFEST_ARTIFACT_TYPE);
  const payload = document.payload;
  exactObjectKeys(payload, [
    'evidenceClass',
    'identity',
    'capture',
    'algorithms',
    'sourceFixture',
    'artifacts',
    'authorityEffects',
  ], 'capture payload');
  assert(payload.evidenceClass ===
    'current-javascript-backing-image-fixture',
  'capture payload evidenceClass is invalid');
  validateCaptureIdentity(payload.identity);
  exactObjectKeys(payload.capture, [
    'stage', 'scale', 'backing', 'pixelFormat',
  ], 'capture payload.capture');
  exactObjectKeys(payload.capture.stage, ['width', 'height'],
    'capture payload.capture.stage');
  exactObjectKeys(payload.capture.backing, ['width', 'height'],
    'capture payload.capture.backing');
  positiveInteger(payload.capture.stage.width, 'capture stage width');
  positiveInteger(payload.capture.stage.height, 'capture stage height');
  assert(payload.capture.scale === 1 || payload.capture.scale === 2,
    'capture scale must be 1 or 2');
  assert(payload.capture.backing.width ===
    payload.capture.stage.width * payload.capture.scale &&
    payload.capture.backing.height ===
    payload.capture.stage.height * payload.capture.scale,
  'capture backing dimensions must equal stage dimensions multiplied by scale');
  assert(payload.capture.pixelFormat === 'rgba8-srgb-straight-alpha',
    'capture pixelFormat is invalid');
  exactObjectKeys(payload.algorithms, [
    'colorSpace', 'storedAlpha', 'scaleComparisonAlpha', 'pngArtifact',
  ], 'capture payload.algorithms');
  assert(payload.algorithms.colorSpace === '8-bit-srgb-no-linearization' &&
    payload.algorithms.storedAlpha === 'straight-alpha' &&
    payload.algorithms.scaleComparisonAlpha === 'premultiplied-alpha',
  'capture algorithms contract is invalid');
  exactObjectKeys(payload.sourceFixture,
    ['path', 'format', 'bytes', 'sha256'], 'capture payload.sourceFixture');
  assert(payload.sourceFixture.format === 'rgba' ||
    payload.sourceFixture.format === 'png',
  'capture sourceFixture.format must be rgba or png');
  const expectedPngArtifact = payload.sourceFixture.format === 'png'
    ? 'source-png-bytes-preserved'
    : 'pngjs-sync-rgba8-fixed-options-v1';
  assert(payload.algorithms.pngArtifact === expectedPngArtifact,
    'capture algorithms.pngArtifact does not match source fixture format');
  assert(typeof payload.sourceFixture.path === 'string' &&
    payload.sourceFixture.path.length > 0 &&
    !path.isAbsolute(payload.sourceFixture.path),
  'capture sourceFixture.path must be relative');
  positiveInteger(payload.sourceFixture.bytes, 'sourceFixture.bytes');
  assert(SHA256_PATTERN.test(payload.sourceFixture.sha256 || ''),
    'sourceFixture.sha256 must be a lowercase 64-character SHA-256');
  exactObjectKeys(payload.artifacts, ['rgba', 'png'],
    'capture payload.artifacts');
  validateFileDescriptor(payload.artifacts.rgba,
    'capture payload.artifacts.rgba');
  validateFileDescriptor(payload.artifacts.png,
    'capture payload.artifacts.png');
  assert(payload.artifacts.rgba.path === 'backing.rgba' &&
    payload.artifacts.png.path === 'backing.png',
  'capture artifact paths must be backing.rgba and backing.png');
  exactObjectKeys(payload.authorityEffects, Object.keys(AUTHORITY_EFFECTS),
    'capture payload.authorityEffects');
  assert(canonicalJson(payload.authorityEffects) ===
    canonicalJson(AUTHORITY_EFFECTS),
  'capture authorityEffects must all remain false');
  return payload;
}

async function readBoundArtifact({
  descriptor,
  baseDirectory,
  projectRoot,
  label,
}) {
  const candidate = resolveInside(
    projectRoot,
    path.resolve(baseDirectory, descriptor.path),
    label,
  );
  assert(isInside(candidate, path.resolve(baseDirectory)),
    `${label} must stay inside its capture directory`);
  const bytes = await readFile(candidate);
  assert(bytes.length === descriptor.bytes,
    `${label} byte count mismatch: expected ${descriptor.bytes}, received ${bytes.length}`);
  const digest = sha256(bytes);
  assert(digest === descriptor.sha256,
    `${label} SHA-256 mismatch: expected ${descriptor.sha256}, received ${digest}`);
  return {path: candidate, bytes, sha256: digest};
}

export async function loadCaptureManifest({projectRoot, manifestPath}) {
  const root = path.resolve(projectRoot);
  const resolvedManifest = resolveInside(root, manifestPath, 'manifestPath');
  const manifestBytes = await readFile(resolvedManifest);
  let document;
  try {
    document = JSON.parse(manifestBytes);
  } catch (error) {
    throw new Error(`Capture manifest is not valid JSON: ${error.message}`);
  }
  const payload = validateCaptureManifestShape(document);
  const baseDirectory = path.dirname(resolvedManifest);
  const rgba = await readBoundArtifact({
    descriptor: payload.artifacts.rgba,
    baseDirectory,
    projectRoot: root,
    label: 'RGBA artifact',
  });
  const png = await readBoundArtifact({
    descriptor: payload.artifacts.png,
    baseDirectory,
    projectRoot: root,
    label: 'PNG artifact',
  });
  const sourcePath = resolveInside(
    root,
    payload.sourceFixture.path,
    'sourceFixture.path',
  );
  const sourceBytes = await readFile(sourcePath);
  assert(sourceBytes.length === payload.sourceFixture.bytes,
    'Source fixture byte count mismatch');
  assert(sha256(sourceBytes) === payload.sourceFixture.sha256,
    'Source fixture SHA-256 mismatch');
  const image = decodeRawRgba(
    rgba.bytes,
    payload.capture.backing.width,
    payload.capture.backing.height,
    'manifest RGBA artifact',
  );
  const pngImage = decodePng(png.bytes, 'manifest PNG artifact');
  assert(pngImage.width === image.width && pngImage.height === image.height,
    'Manifest PNG dimensions do not match RGBA dimensions');
  assert(Buffer.from(pngImage.data).equals(Buffer.from(image.data)),
    'Manifest PNG decoded pixels do not match RGBA bytes');
  return {
    path: resolvedManifest,
    bytes: manifestBytes,
    sha256: sha256(manifestBytes),
    document,
    payload,
    rgba,
    png,
    image,
    source: {path: sourcePath, bytes: sourceBytes},
  };
}

export function assertSameCaptureIdentity(left, right) {
  assert(canonicalJson(left) === canonicalJson(right),
    'Capture identities differ');
}

export function authorityEffects() {
  return {...AUTHORITY_EFFECTS};
}
