#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {spawn, spawnSync} from 'node:child_process';
import {
  chmod,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import {createServer as createNetServer} from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const WORKSPACE_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const WEB_ROOT = path.join(WORKSPACE_ROOT, 'apps/web');
const DIST_DIR_NAME = '.next-g5-l4-package';
const PACKAGE_DIST_ROOT = path.join(WEB_ROOT, DIST_DIR_NAME);
const OUTPUTS_ROOT = path.join(WORKSPACE_ROOT, 'outputs');

export const PACKAGE_ID = 'g5-l4-whole-lesson-package-mvp-v6';
export const PACKAGE_BASENAME =
  'g5-l4-whole-lesson-package-mvp-v6-darwin-arm64';
export const RELEASE_ID = 'lesson-g05-l04-number-lines';
export const DEFAULT_PORT = 3232;
export const PACKAGE_ROOT = path.join(OUTPUTS_ROOT, PACKAGE_BASENAME);
export const ARCHIVE_PATH = `${PACKAGE_ROOT}.zip`;
export const ARCHIVE_SHA_PATH = `${ARCHIVE_PATH}.sha256`;
export const SMOKE_REPORT_PATH = path.join(
  WORKSPACE_ROOT,
  'reports/g5-l4-whole-lesson-package-mvp-v6-smoke.json',
);
export const SMOKE_SCREENSHOT_ROOT = path.join(
  WORKSPACE_ROOT,
  'output/playwright/g5-l4-whole-lesson-package-mvp-v6',
);

const COURSE_ASSET_EXTENSIONS = new Set(['.js', '.json', '.png']);
const CATALOG_FILES = Object.freeze([
  'catalog/animations.json',
  'catalog/missing-references.json',
  'catalog/completion-ledger.json',
  'catalog/lesson-releases.json',
  'catalog/lesson-release-ledger.json',
]);
const GLOSSARY_FILES = Object.freeze([
  Object.freeze({
    language: 'en',
    path: 'apps/web/public/generated/g5-l4-elementary-keyterms-reference-en.json',
    entries: 761,
  }),
  Object.freeze({
    language: 'es',
    path: 'apps/web/public/generated/g5-l4-elementary-keyterms-reference-es.json',
    entries: 753,
  }),
]);
const SOURCE_INPUTS = Object.freeze([
  'apps/web/app',
  'apps/web/components',
  'apps/web/i18n',
  'apps/web/lib',
  'apps/web/next.config.ts',
  'apps/web/package.json',
  'apps/web/tsconfig.json',
  'packages/demos/src',
  'packages/demos/package.json',
  'packages/demos/prototype-registry.json',
  'packages/demos/tsconfig.json',
  'reports/g5-l4-source-scope-freeze.json',
  'scripts/build-g5-l4-whole-lesson-package-mvp.mjs',
  'package.json',
  'package-lock.json',
  ...CATALOG_FILES,
  ...GLOSSARY_FILES.map((entry) => entry.path),
]);
const FORBIDDEN_PACKAGE_PARTS = Object.freeze([
  'source-assets',
  'private-archive',
  'Extracted_NewHelpProgram_20210203',
  'Historical Office Documents of HELP MATH Program',
]);
const FORBIDDEN_PACKAGE_EXTENSIONS =
  /\.(?:bak|bcp|env|fla|jsonl|sql|swf)$/i;
const ABSOLUTE_LOCAL_PATH_MARKERS = Object.freeze(['/Users/', '/Volumes/']);
const SHA256 = /^[a-f0-9]{64}$/;

const stableJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (bytes) =>
  createHash('sha256').update(bytes).digest('hex');
const sha256File = async (file) => sha256(await readFile(file));

export function parseArguments(argv) {
  const modes = argv.filter((argument) =>
    ['--build', '--check', '--smoke'].includes(argument)
  );
  if (modes.length !== 1 || argv.length !== 1) {
    throw new Error('Use exactly one mode: --build, --check, or --smoke.');
  }
  return modes[0].slice(2);
}

export function selectG5L4Release(document) {
  const release = document?.releases?.find(
    (candidate) => candidate?.releaseId === RELEASE_ID,
  );
  if (
    !release
    || release.publicationMode !== 'atomic'
    || release.grade !== 5
    || release.lesson !== 4
    || release.titleDisplay !== 'Number Lines'
    || release.expectedCounts?.activeXmlReferencedPages !== 54
    || release.expectedCounts?.courseShells !== 1
    || release.expectedCounts?.members !== 55
    || !Array.isArray(release.members)
    || release.members.length !== 55
  ) {
    throw new Error('The exact G5 L4 54-page plus shell release is unavailable.');
  }
  const ids = release.members.map((member) => member?.animationId);
  if (
    release.members.some((member, index) =>
      member?.ordinal !== index + 1
      || typeof member.animationId !== 'string'
      || typeof member.assetId !== 'string'
      || !SHA256.test(member?.source?.sha256 ?? '')
    )
    || new Set(ids).size !== 55
    || ids.filter((id) => id === 'shell-course-g05-l04-index-local').length !== 1
    || release.members.filter(
      (member) => member.releaseRole === 'active-xml-referenced-page',
    ).length !== 54
    || release.members.filter(
      (member) => member.releaseRole === 'course-shell',
    ).length !== 1
  ) {
    throw new Error('The G5 L4 release member set is malformed.');
  }
  return release;
}

export function selectG5L4Ledger(document) {
  const release = document?.releases?.find(
    (candidate) => candidate?.releaseId === RELEASE_ID,
  );
  if (
    !release
    || release.expectedMemberCount !== 55
    || release.strictCompleteCount !== 0
    || release.missingCount !== 55
    || release.published !== false
    || release.status !== 'unpublished'
    || release.gate?.open !== false
    || !Array.isArray(release.members)
    || release.members.length !== 55
    || release.members.some((member) =>
      member.strictComplete !== false || member.status !== 'missing'
    )
  ) {
    throw new Error('The current G5 L4 strict-release boundary has changed.');
  }
  return release;
}

export function isAllowedCourseAsset(relativePath) {
  const normalized = relativePath.split(path.sep).join('/');
  return normalized.length > 0
    && !normalized.startsWith('/')
    && !normalized.startsWith('../')
    && !normalized.includes('/../')
    && COURSE_ASSET_EXTENSIONS.has(
      path.extname(normalized).toLowerCase(),
    );
}

async function walkFiles(root) {
  const result = [];
  async function visit(directory) {
    const entries = await readdir(directory, {withFileTypes: true});
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (entry.name === '.DS_Store') continue;
      const absolutePath = path.join(directory, entry.name);
      const metadata = await lstat(absolutePath);
      if (metadata.isSymbolicLink()) {
        throw new Error(`Symbolic links are not allowed: ${absolutePath}`);
      }
      if (metadata.isDirectory()) {
        await visit(absolutePath);
      } else if (metadata.isFile()) {
        result.push({
          absolutePath,
          metadata,
          relativePath: path.relative(root, absolutePath)
            .split(path.sep).join('/'),
        });
      }
    }
  }
  await visit(root);
  return result;
}

async function addSnapshotPath(rows, relativePath) {
  const absolutePath = path.join(WORKSPACE_ROOT, relativePath);
  const metadata = await lstat(absolutePath);
  if (metadata.isSymbolicLink()) {
    throw new Error(`Source snapshot refuses symbolic link: ${relativePath}`);
  }
  if (metadata.isDirectory()) {
    for (const file of await walkFiles(absolutePath)) {
      rows.push({
        path: `${relativePath}/${file.relativePath}`,
        bytes: file.metadata.size,
        sha256: await sha256File(file.absolutePath),
      });
    }
    return;
  }
  rows.push({
    path: relativePath,
    bytes: metadata.size,
    sha256: await sha256File(absolutePath),
  });
}

export async function buildCurrentPackageInputSnapshot(release) {
  const rows = [];
  for (const relativePath of SOURCE_INPUTS) {
    await addSnapshotPath(rows, relativePath);
  }
  for (const member of release.members) {
    const relativeRoot =
      `public/flash-assets/courses/${member.animationId}`;
    const absoluteRoot = path.join(WORKSPACE_ROOT, relativeRoot);
    for (const file of await walkFiles(absoluteRoot)) {
      if (!isAllowedCourseAsset(file.relativePath)) continue;
      rows.push({
        path: `${relativeRoot}/${file.relativePath}`,
        bytes: file.metadata.size,
        sha256: await sha256File(file.absolutePath),
      });
    }
  }
  const unique = new Map(rows.map((row) => [row.path, row]));
  const sorted = [...unique.values()].sort((left, right) =>
    left.path.localeCompare(right.path)
  );
  const index = sorted.map((row) =>
    `${row.sha256} ${row.bytes} ${row.path}`
  ).join('\n');
  return {
    fileCount: sorted.length,
    totalBytes: sorted.reduce((sum, row) => sum + row.bytes, 0),
    sha256: sha256(Buffer.from(index)),
  };
}

async function copyCatalog(runtimeRoot) {
  const bindings = [];
  for (const relativePath of CATALOG_FILES) {
    const source = path.join(WORKSPACE_ROOT, relativePath);
    const destination = path.join(runtimeRoot, relativePath);
    await mkdir(path.dirname(destination), {recursive: true});
    await cp(source, destination, {preserveTimestamps: false});
    bindings.push({
      path: relativePath,
      bytes: (await stat(source)).size,
      sha256: await sha256File(source),
    });
  }
  return bindings;
}

async function copyGlossaries(serverDirectory) {
  const bindings = [];
  for (const descriptor of GLOSSARY_FILES) {
    const source = path.join(WORKSPACE_ROOT, descriptor.path);
    const document = JSON.parse(await readFile(source, 'utf8'));
    const actualEntries = document?.counts?.clientTermCount
      ?? document?.terms?.length;
    if (actualEntries !== descriptor.entries) {
      throw new Error(
        `G5 L4 ${descriptor.language} glossary entry count drifted.`,
      );
    }
    const destinationRelative =
      `public/generated/${path.basename(descriptor.path)}`;
    const destination = path.join(serverDirectory, destinationRelative);
    await mkdir(path.dirname(destination), {recursive: true});
    await cp(source, destination, {preserveTimestamps: false});
    bindings.push({
      language: descriptor.language,
      packagePath: `runtime/${path.relative(
        path.join(serverDirectory, '../..'),
        destination,
      ).split(path.sep).join('/')}`,
      requestPath: `/generated/${path.basename(descriptor.path)}`,
      entryCount: descriptor.entries,
      bytes: (await stat(source)).size,
      sha256: await sha256File(source),
    });
  }
  return bindings;
}

async function copyAllowedCourseAssets(release, runtimeRoot) {
  const destinationRoot = path.join(runtimeRoot, 'public/flash-assets/courses');
  const extensions = {js: 0, json: 0, png: 0};
  const members = [];
  const sanitizedLocalPathManifests = [];
  await mkdir(destinationRoot, {recursive: true});
  for (const member of release.members) {
    const sourceRoot = path.join(
      WORKSPACE_ROOT,
      'public/flash-assets/courses',
      member.animationId,
    );
    const destinationMemberRoot = path.join(
      destinationRoot,
      member.animationId,
    );
    const copied = [];
    for (const file of await walkFiles(sourceRoot)) {
      if (!isAllowedCourseAsset(file.relativePath)) continue;
      const destination = path.join(destinationMemberRoot, file.relativePath);
      await mkdir(path.dirname(destination), {recursive: true});
      await cp(file.absolutePath, destination, {
        dereference: true,
        preserveTimestamps: false,
      });
      if (path.extname(file.relativePath).toLowerCase() === '.json') {
        const original = await readFile(destination, 'utf8');
        let replacementCount = 0;
        const sanitizeValue = (value) => {
          if (Array.isArray(value)) return value.map(sanitizeValue);
          if (value && typeof value === 'object') {
            return Object.fromEntries(Object.entries(value).map(
              ([key, child]) => [key, sanitizeValue(child)],
            ));
          }
          if (typeof value !== 'string') return value;
          if (value.startsWith(WORKSPACE_ROOT)) {
            replacementCount += 1;
            return value.replace(WORKSPACE_ROOT, '<workspace-root>');
          }
          if (
            value.startsWith('/Users/')
            || value.startsWith('/Volumes/')
            || value.startsWith('/opt/')
          ) {
            replacementCount += 1;
            return `<local-tool-path>/${path.basename(value)}`;
          }
          return value;
        };
        const sanitizedDocument = sanitizeValue(JSON.parse(original));
        if (replacementCount > 0) {
          const sanitized = stableJson(sanitizedDocument);
          if (
            ABSOLUTE_LOCAL_PATH_MARKERS.some((marker) =>
              sanitized.includes(marker)
            )
          ) {
            throw new Error(
              `Unrecognized absolute path remains in ${member.animationId}/${file.relativePath}.`,
            );
          }
          await writeFile(destination, sanitized, 'utf8');
          sanitizedLocalPathManifests.push({
            animationId: member.animationId,
            path: file.relativePath,
            replacementCount,
          });
        }
      }
      copied.push(file.relativePath);
      const extension = path.extname(file.relativePath).slice(1).toLowerCase();
      extensions[extension] += 1;
    }
    if (member.releaseRole === 'active-xml-referenced-page') {
      if (
        !copied.includes('canvas-renderer.js')
        || !copied.includes('manifest.json')
      ) {
        throw new Error(
          `G5 L4 page asset bundle incomplete: ${member.animationId}`,
        );
      }
    } else if (
      !copied.includes('root-frames/frame-0049.png')
      || !copied.includes('root-frames/frame-0050.png')
      || !copied.includes('control-assets/manifest.json')
    ) {
      throw new Error('G5 L4 shell visual asset bundle is incomplete.');
    }
    members.push({
      animationId: member.animationId,
      fileCount: copied.length,
    });
  }
  if (extensions.js !== 54 || extensions.json < 55 || extensions.png < 1) {
    throw new Error(
      `G5 L4 package asset shape drifted: ${JSON.stringify(extensions)}`,
    );
  }
  return {
    fileCount: Object.values(extensions).reduce((sum, value) => sum + value, 0),
    extensions,
    memberCount: members.length,
    members,
    sanitizedLocalPathManifests,
  };
}

async function findServerEntry(runtimeRoot) {
  const candidates = (await walkFiles(runtimeRoot))
    .filter((file) =>
      file.relativePath === 'server.js'
      || file.relativePath.endsWith('/server.js')
    )
    .map((file) => file.relativePath);
  if (candidates.includes('apps/web/server.js')) return 'apps/web/server.js';
  if (candidates.length === 1) return candidates[0];
  throw new Error(
    `Expected one standalone server entry; found ${candidates.join(', ') || 'none'}.`,
  );
}

export async function sanitizeNextStandaloneLocalPaths(
  runtimeRoot,
  serverEntry,
) {
  const serverPath = path.join(runtimeRoot, serverEntry);
  const serverDirectory = path.dirname(serverPath);
  const requiredRelative = `${DIST_DIR_NAME}/required-server-files.json`;
  const requiredPath = path.join(serverDirectory, requiredRelative);
  const originalServerSource = await readFile(serverPath, 'utf8');
  const configPrefix = 'const nextConfig = ';
  const configStart = originalServerSource.indexOf(configPrefix);
  const configEnd = originalServerSource.indexOf('\n', configStart);
  if (
    configStart === -1
    || configEnd === -1
    || originalServerSource.indexOf(
      configPrefix,
      configStart + configPrefix.length,
    ) !== -1
  ) {
    throw new Error('Next standalone server config shape has changed.');
  }
  const config = JSON.parse(originalServerSource.slice(
    configStart + configPrefix.length,
    configEnd,
  ));
  const serverReplacementCount =
    JSON.stringify(config).split(WORKSPACE_ROOT).length - 1;
  if (
    serverReplacementCount !== 2
    || config.outputFileTracingRoot !== WORKSPACE_ROOT
    || config.turbopack?.root !== WORKSPACE_ROOT
  ) {
    throw new Error('Next standalone generated paths changed unexpectedly.');
  }
  config.outputFileTracingRoot = '../..';
  config.turbopack.root = '../..';
  const sanitizedServerSource = [
    originalServerSource.slice(0, configStart),
    configPrefix,
    JSON.stringify(config),
    originalServerSource.slice(configEnd),
  ].join('');

  const requiredSource = await readFile(requiredPath, 'utf8');
  const requiredReplacementCount =
    requiredSource.split(WORKSPACE_ROOT).length - 1;
  const required = JSON.parse(requiredSource);
  if (
    requiredReplacementCount !== 3
    || required.config?.outputFileTracingRoot !== WORKSPACE_ROOT
    || required.config?.turbopack?.root !== WORKSPACE_ROOT
    || required.appDir !== WEB_ROOT
  ) {
    throw new Error('Next required-server-files path shape changed unexpectedly.');
  }
  required.config.outputFileTracingRoot = '../..';
  required.config.turbopack.root = '../..';
  required.appDir = '.';
  await writeFile(serverPath, sanitizedServerSource, 'utf8');
  await writeFile(requiredPath, stableJson(required), 'utf8');

  const removedOptionalImageOptimizationDependencies = [];
  for (const relativePath of ['node_modules/@img', 'node_modules/sharp']) {
    const absolutePath = path.join(runtimeRoot, relativePath);
    try {
      await lstat(absolutePath);
      await rm(absolutePath, {recursive: true, force: true});
      removedOptionalImageOptimizationDependencies.push(relativePath);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }

  const sanitizedVendorCommentFiles = [];
  const vendorRelative = 'node_modules/next/dist/server/patch-error-inspect.js';
  const vendorPath = path.join(runtimeRoot, vendorRelative);
  try {
    const source = await readFile(vendorPath, 'utf8');
    const example = '/Users/foo/APP/';
    if (source.includes('/Users/')) {
      if (source.split(example).length - 1 !== 1) {
        throw new Error('Next vendor local-path example changed unexpectedly.');
      }
      await writeFile(
        vendorPath,
        source.replace(example, '/example-user/APP/'),
        'utf8',
      );
      sanitizedVendorCommentFiles.push(vendorRelative);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  return {
    status: 'sanitized-next-generated-local-paths',
    files: [serverEntry, `${path.dirname(serverEntry)}/${requiredRelative}`]
      .map((value) => value.replace(/^\.\//, '')),
    serverReplacementCount,
    requiredReplacementCount,
    removedOptionalImageOptimizationDependencies,
    sanitizedVendorCommentFiles,
  };
}

async function payloadInventory(packageRoot, excluded = new Set()) {
  const rows = [];
  for (const file of await walkFiles(packageRoot)) {
    if (excluded.has(file.relativePath)) continue;
    rows.push({
      path: file.relativePath,
      bytes: file.metadata.size,
      mode: file.metadata.mode & 0o777,
      sha256: await sha256File(file.absolutePath),
    });
  }
  rows.sort((left, right) => left.path.localeCompare(right.path));
  return rows;
}

async function writeChecksums(packageRoot) {
  const rows = await payloadInventory(
    packageRoot,
    new Set(['CHECKSUMS.sha256']),
  );
  const text = `${rows.map((row) =>
    `${row.sha256}  ${row.path}`
  ).join('\n')}\n`;
  await writeFile(path.join(packageRoot, 'CHECKSUMS.sha256'), text, {
    encoding: 'utf8',
    mode: 0o444,
  });
  return {rows, sha256: sha256(Buffer.from(text))};
}

export async function scanPackagePrivacy(packageRoot) {
  const files = await walkFiles(packageRoot);
  let bytesScanned = 0;
  for (const file of files) {
    if (
      FORBIDDEN_PACKAGE_PARTS.some((part) =>
        file.relativePath.split('/').includes(part)
      )
    ) {
      throw new Error(`Forbidden package path: ${file.relativePath}`);
    }
    if (
      FORBIDDEN_PACKAGE_EXTENSIONS.test(file.relativePath)
      || file.relativePath.split('/').some(
        (part) => part === '.env' || part.startsWith('.env.'),
      )
    ) {
      throw new Error(
        `Forbidden source, database, or environment file: ${file.relativePath}`,
      );
    }
    const bytes = await readFile(file.absolutePath);
    bytesScanned += bytes.length;
    for (const marker of ABSOLUTE_LOCAL_PATH_MARKERS) {
      if (bytes.includes(Buffer.from(marker))) {
        throw new Error(
          `Private absolute local path in package file: ${file.relativePath}`,
        );
      }
    }
  }
  return {
    status: 'pass',
    filesScanned: files.length,
    bytesScanned,
    forbiddenPathFindings: 0,
    forbiddenExtensionFindings: 0,
    absoluteLocalPathFindings: 0,
  };
}

export function assertManifestBoundary(manifest) {
  if (
    manifest?.schemaVersion !== 1
    || manifest.packageId !== PACKAGE_ID
    || manifest.packageType !== 'machine-verified-private-controlled-preview'
    || manifest.entry?.url !== `http://127.0.0.1:${DEFAULT_PORT}/courses/5/4`
    || manifest.entry?.spanishUrl
      !== `http://127.0.0.1:${DEFAULT_PORT}/es/courses/5/4`
    || manifest.entry?.network !== 'loopback-only'
    || manifest.release?.releaseId !== RELEASE_ID
    || manifest.release?.expectedMembers !== 55
    || manifest.release?.activePages !== 54
    || manifest.release?.courseShells !== 1
    || manifest.release?.strictCompleteCount !== 0
    || manifest.release?.published !== false
    || !Array.isArray(manifest.members)
    || manifest.members.length !== 55
    || new Set(manifest.members.map((member) => member.animationId)).size !== 55
    || Object.values(manifest.authority ?? {}).some((value) => value !== false)
    || manifest.assets?.memberCount !== 55
    || manifest.assets?.extensions?.js !== 54
    || manifest.glossaries?.length !== 2
    || manifest.glossaries?.find((item) => item.language === 'en')?.entryCount
      !== 761
    || manifest.glossaries?.find((item) => item.language === 'es')?.entryCount
      !== 753
  ) {
    throw new Error('Package manifest authority or G5 L4 lesson shape is invalid.');
  }
  return true;
}

function readmeText() {
  return `# G5 L4 Number Lines — Whole-Lesson CEO Preview MVP v2

**Private controlled preview — current JavaScript candidate.**

This Apple-silicon Mac package contains the 54-page Grade 5 Lesson 4 lesson
player plus its JavaScript shell. It also contains the content-manager-authorized
combined Elementary Key Terms reference data (761 English-index entries and 753
Spanish-index entries).

## Start

Requirements: Apple-silicon Mac and Node.js 22–26.

\`\`\`bash
node verify.mjs
node start.mjs
\`\`\`

The launcher verifies every package file, binds only to
\`127.0.0.1:${DEFAULT_PORT}\`, and opens:

\`\`\`text
http://127.0.0.1:${DEFAULT_PORT}/courses/5/4
\`\`\`

Spanish route:

\`\`\`text
http://127.0.0.1:${DEFAULT_PORT}/es/courses/5/4
\`\`\`

Use \`node start.mjs --port 3233\` if port ${DEFAULT_PORT} is busy. Press
Control-C to stop the server. No npm install is needed. The package is not a
\`file://\` site; its included loopback Node server is required.

## Evidence boundary

- 54 current-JavaScript page candidates and one JavaScript shell are bundled.
- The combined Elementary glossary is an authorized product reference; it does
  not recover or substitute the missing lesson-declared L4KTE01.xml and
  L4KTS01.xml files and does not prove the original runtime byte variant.
- Original-runtime evidence, full-frame comparison, audio acceptance,
  independent human review, Owner fidelity acceptance, strict completion, and
  public release all remain false.
- The release ledger remains strict 0/55 and unpublished.

This package is for private local CEO preview only. Do not deploy it to a public
host, Vercel, or any external service.
`;
}

export function verifierSource() {
  return `#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {lstat, readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const forbiddenExtensions = ${FORBIDDEN_PACKAGE_EXTENSIONS};
const forbiddenParts = ${JSON.stringify(FORBIDDEN_PACKAGE_PARTS)};

async function files() {
  const result = [];
  async function visit(directory) {
    const entries = await readdir(directory, {withFileTypes: true});
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (entry.name === '.DS_Store') throw new Error('Unexpected .DS_Store');
      const absolute = path.join(directory, entry.name);
      const metadata = await lstat(absolute);
      if (metadata.isSymbolicLink()) throw new Error('Symbolic link refused: ' + absolute);
      if (metadata.isDirectory()) await visit(absolute);
      else if (metadata.isFile()) result.push({
        absolute,
        relative: path.relative(root, absolute).split(path.sep).join('/'),
      });
    }
  }
  await visit(root);
  return result;
}

export async function verifyPackage() {
  const manifest = JSON.parse(await readFile(path.join(root, 'package-manifest.json'), 'utf8'));
  if (
    manifest.schemaVersion !== 1
    || manifest.packageId !== ${JSON.stringify(PACKAGE_ID)}
    || manifest.packageType !== 'machine-verified-private-controlled-preview'
    || manifest.entry?.url !== ${JSON.stringify(`http://127.0.0.1:${DEFAULT_PORT}/courses/5/4`)}
    || manifest.entry?.spanishUrl !== ${JSON.stringify(`http://127.0.0.1:${DEFAULT_PORT}/es/courses/5/4`)}
    || manifest.entry?.network !== 'loopback-only'
    || manifest.release?.releaseId !== ${JSON.stringify(RELEASE_ID)}
    || manifest.release?.expectedMembers !== 55
    || manifest.release?.activePages !== 54
    || manifest.release?.courseShells !== 1
    || manifest.release?.strictCompleteCount !== 0
    || manifest.release?.published !== false
    || !Array.isArray(manifest.members)
    || manifest.members.length !== 55
    || new Set(manifest.members.map((member) => member.animationId)).size !== 55
    || Object.values(manifest.authority ?? {}).some((value) => value !== false)
    || manifest.assets?.memberCount !== 55
    || manifest.assets?.extensions?.js !== 54
    || manifest.glossaries?.find((item) => item.language === 'en')?.entryCount !== 761
    || manifest.glossaries?.find((item) => item.language === 'es')?.entryCount !== 753
  ) throw new Error('Package manifest authority or G5 L4 lesson shape is invalid.');

  const checksumText = await readFile(path.join(root, 'CHECKSUMS.sha256'), 'utf8');
  const expected = new Map(checksumText.trim().split('\\n').filter(Boolean).map((line) => {
    const match = /^([a-f0-9]{64})  ([^\\0]+)$/.exec(line);
    if (!match || match[2].startsWith('/') || match[2].split('/').some((part) => part === '.' || part === '..')) {
      throw new Error('Malformed checksum row.');
    }
    return [match[2], match[1]];
  }));
  const actual = (await files()).filter((file) => file.relative !== 'CHECKSUMS.sha256');
  if (expected.size !== actual.length) throw new Error('Package file count differs from checksums.');
  let bytesScanned = 0;
  for (const file of actual) {
    const bytes = await readFile(file.absolute);
    bytesScanned += bytes.length;
    if (!expected.has(file.relative)) throw new Error('Unexpected file: ' + file.relative);
    if (hash(bytes) !== expected.get(file.relative)) throw new Error('Checksum mismatch: ' + file.relative);
    if (forbiddenExtensions.test(file.relative) || file.relative.split('/').some((part) => part === '.env' || part.startsWith('.env.'))) {
      throw new Error('Forbidden source, database, or environment file: ' + file.relative);
    }
    if (forbiddenParts.some((part) => file.relative.split('/').includes(part))) {
      throw new Error('Forbidden package path: ' + file.relative);
    }
    for (const marker of ['/' + 'Users' + '/', '/' + 'Volumes' + '/']) {
      if (bytes.includes(Buffer.from(marker))) throw new Error('Private absolute local path in package file: ' + file.relative);
    }
  }
  const result = {
    status: 'verified',
    packageId: manifest.packageId,
    files: actual.length,
    members: manifest.members.length,
    currentJavascriptPages: 54,
    glossaries: Object.fromEntries(manifest.glossaries.map((item) => [item.language, item.entryCount])),
    entry: manifest.entry.url,
    strictComplete: manifest.release.strictCompleteCount,
    published: manifest.release.published,
    privacyScan: {
      status: 'pass',
      filesScanned: actual.length,
      bytesScanned,
      forbiddenPathFindings: 0,
      forbiddenExtensionFindings: 0,
      absoluteLocalPathFindings: 0,
    },
  };
  console.log(JSON.stringify(result, null, 2));
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await verifyPackage();
}
`;
}

function launcherSource(serverEntry) {
  return `#!/usr/bin/env node
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyPackage} from './verify.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const portIndex = process.argv.indexOf('--port');
const portText = portIndex === -1 ? '${DEFAULT_PORT}' : process.argv[portIndex + 1];
if (!/^[1-9]\\d{0,4}$/.test(portText ?? '') || Number(portText) > 65535) {
  throw new Error('Use --port with a number from 1 to 65535.');
}
await verifyPackage();
const port = Number(portText);
const url = 'http://127.0.0.1:' + port + '/courses/5/4';
const runtimeRoot = path.join(root, 'runtime');
const environment = {
  ...process.env,
  NODE_ENV: 'production',
  G5_L4_CEO_PREVIEW_ENABLED: '1',
  G5_L4_WHOLE_LESSON_PACKAGE: '1',
  NEXT_TELEMETRY_DISABLED: '1',
  HOSTNAME: '127.0.0.1',
  PORT: String(port),
};
delete environment.VERCEL_ENV;
const server = spawn(process.execPath, [${JSON.stringify(serverEntry)}], {
  cwd: runtimeRoot,
  env: environment,
  stdio: 'inherit',
});
const stop = () => server.kill('SIGTERM');
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
let ready = false;
for (let attempt = 0; attempt < 100; attempt += 1) {
  if (server.exitCode !== null) throw new Error('Lesson server exited before becoming ready.');
  try {
    const response = await fetch(url, {redirect: 'manual'});
    if (response.status === 200) {
      ready = true;
      break;
    }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 250));
}
if (!ready) {
  stop();
  throw new Error('Lesson server did not become ready.');
}
console.log('\\nG5 L4 Number Lines private CEO preview is ready:');
console.log(url);
if (process.platform === 'darwin') {
  const opener = spawn('/usr/bin/open', [url], {detached: true, stdio: 'ignore'});
  opener.unref();
}
await new Promise((resolve, reject) => {
  server.once('exit', (code, signal) => {
    if (signal === 'SIGTERM' || code === 0) resolve();
    else reject(new Error('Lesson server exited with code ' + code));
  });
  server.once('error', reject);
});
`;
}

function gitHead() {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: WORKSPACE_ROOT,
    encoding: 'utf8',
  });
  return result.status === 0 && /^[a-f0-9]{40}$/.test(result.stdout.trim())
    ? result.stdout.trim()
    : null;
}

async function atomicInstall(stagedPackageRoot) {
  const backup = path.join(
    OUTPUTS_ROOT,
    `.${PACKAGE_BASENAME}.backup-${process.pid}`,
  );
  let priorMoved = false;
  try {
    try {
      await lstat(PACKAGE_ROOT);
      await rename(PACKAGE_ROOT, backup);
      priorMoved = true;
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    await rename(stagedPackageRoot, PACKAGE_ROOT);
    if (priorMoved) await rm(backup, {recursive: true, force: true});
  } catch (error) {
    try {
      await rm(PACKAGE_ROOT, {recursive: true, force: true});
      if (priorMoved) await rename(backup, PACKAGE_ROOT);
    } catch {}
    throw error;
  }
}

async function runVerifierAt(packageRoot) {
  const result = spawnSync(process.execPath, ['verify.mjs'], {
    cwd: packageRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(
      `Packaged verifier failed:\n${result.stdout}\n${result.stderr}`,
    );
  }
  return JSON.parse(result.stdout);
}

async function archivePackage() {
  await rm(ARCHIVE_PATH, {force: true});
  await rm(ARCHIVE_SHA_PATH, {force: true});
  const result = spawnSync(
    '/usr/bin/zip',
    ['-q', '-X', '-r', ARCHIVE_PATH, PACKAGE_BASENAME],
    {cwd: OUTPUTS_ROOT, encoding: 'utf8'},
  );
  if (result.status !== 0) {
    throw new Error(`zip failed: ${result.stderr || result.stdout}`);
  }
  const archiveHash = await sha256File(ARCHIVE_PATH);
  await writeFile(
    ARCHIVE_SHA_PATH,
    `${archiveHash}  ${path.basename(ARCHIVE_PATH)}\n`,
    {encoding: 'utf8', mode: 0o444},
  );
  return {
    path: path.relative(WORKSPACE_ROOT, ARCHIVE_PATH),
    bytes: (await stat(ARCHIVE_PATH)).size,
    sha256: archiveHash,
  };
}

async function buildPackage() {
  if (process.platform !== 'darwin' || process.arch !== 'arm64') {
    throw new Error(`${PACKAGE_ID} is bound to darwin/arm64.`);
  }
  const releaseDocument = JSON.parse(await readFile(
    path.join(WORKSPACE_ROOT, 'catalog/lesson-releases.json'),
    'utf8',
  ));
  const ledgerDocument = JSON.parse(await readFile(
    path.join(WORKSPACE_ROOT, 'catalog/lesson-release-ledger.json'),
    'utf8',
  ));
  const release = selectG5L4Release(releaseDocument);
  const ledger = selectG5L4Ledger(ledgerDocument);
  const beforeSnapshot = await buildCurrentPackageInputSnapshot(release);
  const environment = {
    ...process.env,
    NODE_ENV: 'production',
    G5_L4_CEO_PREVIEW_ENABLED: '1',
    G5_L4_WHOLE_LESSON_PACKAGE: '1',
    NEXT_TELEMETRY_DISABLED: '1',
  };
  delete environment.VERCEL_ENV;
  const build = spawnSync(
    'npm',
    ['run', 'build', '--workspace', '@helpmath/web'],
    {cwd: WORKSPACE_ROOT, env: environment, stdio: 'inherit'},
  );
  if (build.status !== 0) throw new Error('Production package build failed.');
  const afterSnapshot = await buildCurrentPackageInputSnapshot(release);
  if (stableJson(beforeSnapshot) !== stableJson(afterSnapshot)) {
    throw new Error('Package inputs drifted during the production build.');
  }

  const standaloneRoot = path.join(PACKAGE_DIST_ROOT, 'standalone');
  const buildId = (await readFile(
    path.join(PACKAGE_DIST_ROOT, 'BUILD_ID'),
    'utf8',
  )).trim();
  if (!/^[A-Za-z0-9_-]+$/.test(buildId)) {
    throw new Error('Malformed package BUILD_ID.');
  }
  const stageRoot = await mkdtemp(
    path.join(OUTPUTS_ROOT, '.g5-l4-whole-lesson-package-stage-'),
  );
  const stagedPackageRoot = path.join(stageRoot, PACKAGE_BASENAME);
  const runtimeRoot = path.join(stagedPackageRoot, 'runtime');
  try {
    await mkdir(stagedPackageRoot, {recursive: true});
    await cp(standaloneRoot, runtimeRoot, {
      recursive: true,
      dereference: true,
      preserveTimestamps: false,
    });
    for (const forbiddenDirectory of [
      'artifacts',
      'migrations',
      'private-archive',
      'source-assets',
    ]) {
      await rm(path.join(runtimeRoot, forbiddenDirectory), {
        recursive: true,
        force: true,
      });
    }
    const serverEntry = await findServerEntry(runtimeRoot);
    const portability = await sanitizeNextStandaloneLocalPaths(
      runtimeRoot,
      serverEntry,
    );
    const serverDirectory = path.dirname(path.join(runtimeRoot, serverEntry));
    await cp(
      path.join(PACKAGE_DIST_ROOT, 'static'),
      path.join(serverDirectory, DIST_DIR_NAME, 'static'),
      {recursive: true, dereference: true, preserveTimestamps: false},
    );
    const catalog = await copyCatalog(runtimeRoot);
    const assets = await copyAllowedCourseAssets(release, runtimeRoot);
    const glossaries = await copyGlossaries(serverDirectory);

    await writeFile(
      path.join(stagedPackageRoot, 'README.md'),
      readmeText(),
      {encoding: 'utf8', mode: 0o444},
    );
    await writeFile(
      path.join(stagedPackageRoot, 'verify.mjs'),
      verifierSource(),
      {encoding: 'utf8', mode: 0o555},
    );
    await writeFile(
      path.join(stagedPackageRoot, 'start.mjs'),
      launcherSource(serverEntry),
      {encoding: 'utf8', mode: 0o555},
    );
    await chmod(path.join(stagedPackageRoot, 'verify.mjs'), 0o555);
    await chmod(path.join(stagedPackageRoot, 'start.mjs'), 0o555);
    await scanPackagePrivacy(stagedPackageRoot);

    const payload = await payloadInventory(stagedPackageRoot);
    const payloadIndex = payload.map((row) =>
      `${row.sha256} ${row.bytes} ${row.mode.toString(8)} ${row.path}`
    ).join('\n');
    const manifest = {
      schemaVersion: 1,
      packageId: PACKAGE_ID,
      packageType: 'machine-verified-private-controlled-preview',
      productLayer: 'whole-lesson-current-javascript-mvp',
      title: 'G5 L4 Number Lines — Whole-Lesson CEO Preview MVP v2',
      target: {
        platform: process.platform,
        architecture: process.arch,
        nodeMajor: Number(process.versions.node.split('.')[0]),
      },
      entry: {
        command: 'node start.mjs',
        serverEntry: `runtime/${serverEntry}`,
        url: `http://127.0.0.1:${DEFAULT_PORT}/courses/5/4`,
        spanishUrl: `http://127.0.0.1:${DEFAULT_PORT}/es/courses/5/4`,
        network: 'loopback-only',
        externalDeploymentAuthorized: false,
      },
      build: {
        buildId,
        distDir: `apps/web/${DIST_DIR_NAME}`,
        inputSnapshotBefore: beforeSnapshot,
        inputSnapshotAfter: afterSnapshot,
        gitHead: gitHead(),
        dirtyWorktree: true,
        nextStandalonePortability: portability,
      },
      release: {
        releaseId: RELEASE_ID,
        expectedMembers: 55,
        activePages: 54,
        courseShells: 1,
        strictCompleteCount: ledger.strictCompleteCount,
        missingCount: ledger.missingCount,
        published: ledger.published,
      },
      authority: {
        authoritativeOriginalRuntime: false,
        originalRuntimeFullFrameAccepted: false,
        audioAccepted: false,
        humanVisualAccepted: false,
        humanAudioAccepted: false,
        ownerFidelityAccepted: false,
        strictComplete: false,
        publicRelease: false,
        published: false,
      },
      members: release.members.map((member) => ({
        ordinal: member.ordinal,
        animationId: member.animationId,
        assetId: member.assetId,
        releaseRole: member.releaseRole,
        sourceSha256: member.source.sha256,
      })),
      assets: {
        ...assets,
        allowlistedExtensions: [...COURSE_ASSET_EXTENSIONS].sort(),
        audioFileCount: 0,
        audioAcceptance: false,
      },
      glossaries,
      catalog,
      payload: {
        fileCount: payload.length,
        totalBytes: payload.reduce((sum, row) => sum + row.bytes, 0),
        indexSha256: sha256(Buffer.from(payloadIndex)),
      },
      exclusions: [
        'FLA and SWF source binaries',
        'HELP Math 1.0 SQL archive',
        'historical office archive',
        'private archive and credentials',
        'environment files',
        'absolute local filesystem paths',
        'external deployment authorization',
      ],
      knownPendingGates: [
        'missing lesson-declared L4KTE01.xml and L4KTS01.xml',
        'authoritative original-runtime full-frame evidence',
        'full-frame RMSE comparison and review',
        'audio cue mapping and named-human listening acceptance',
        'independent human visual review',
        'Owner fidelity acceptance',
        'strict completion',
        'atomic public release',
      ],
    };
    assertManifestBoundary(manifest);
    await writeFile(
      path.join(stagedPackageRoot, 'package-manifest.json'),
      stableJson(manifest),
      {encoding: 'utf8', mode: 0o444},
    );
    await writeChecksums(stagedPackageRoot);
    await scanPackagePrivacy(stagedPackageRoot);
    await atomicInstall(stagedPackageRoot);
  } finally {
    await rm(stageRoot, {recursive: true, force: true});
  }
  const verifier = await runVerifierAt(PACKAGE_ROOT);
  const archive = await archivePackage();
  console.log(stableJson({
    status: 'built',
    package: path.relative(WORKSPACE_ROOT, PACKAGE_ROOT),
    verifier,
    archive,
  }));
}

export function assertSafeArchiveEntries(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('The package ZIP has no entries.');
  }
  for (const entry of entries) {
    const normalized = entry.replace(/\/$/, '');
    if (
      entry.includes('\\')
      || normalized.startsWith('/')
      || normalized.split('/').some((part) => part === '.' || part === '..')
      || (
        normalized !== PACKAGE_BASENAME
        && !normalized.startsWith(`${PACKAGE_BASENAME}/`)
      )
    ) {
      throw new Error(`Unsafe package ZIP entry: ${entry}`);
    }
  }
  return true;
}

async function readOuterArchiveBinding() {
  const row = (await readFile(ARCHIVE_SHA_PATH, 'utf8')).trim();
  const match = /^([a-f0-9]{64})  ([^/]+)$/.exec(row);
  if (!match || match[2] !== path.basename(ARCHIVE_PATH)) {
    throw new Error('Malformed outer archive checksum.');
  }
  const actual = await sha256File(ARCHIVE_PATH);
  if (actual !== match[1]) throw new Error('Outer archive checksum mismatch.');
  return {
    path: path.relative(WORKSPACE_ROOT, ARCHIVE_PATH),
    bytes: (await stat(ARCHIVE_PATH)).size,
    sha256: actual,
  };
}

async function checkPackage() {
  const verifier = await runVerifierAt(PACKAGE_ROOT);
  const manifest = JSON.parse(await readFile(
    path.join(PACKAGE_ROOT, 'package-manifest.json'),
    'utf8',
  ));
  assertManifestBoundary(manifest);
  const release = selectG5L4Release(JSON.parse(await readFile(
    path.join(WORKSPACE_ROOT, 'catalog/lesson-releases.json'),
    'utf8',
  )));
  const currentSnapshot = await buildCurrentPackageInputSnapshot(release);
  if (
    stableJson(manifest.build?.inputSnapshotBefore)
      !== stableJson(manifest.build?.inputSnapshotAfter)
    || stableJson(currentSnapshot)
      !== stableJson(manifest.build?.inputSnapshotAfter)
  ) {
    throw new Error('The package input snapshot does not match current sources.');
  }
  const archive = await readOuterArchiveBinding();
  console.log(stableJson({
    status: 'checked',
    package: path.relative(WORKSPACE_ROOT, PACKAGE_ROOT),
    verifier,
    archive,
  }));
}

export async function findAvailableLoopbackPort() {
  const server = createNetServer();
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen({host: '127.0.0.1', port: 0, exclusive: true}, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Unable to allocate a loopback smoke port.'));
        return;
      }
      server.close((error) => {
        if (error) reject(error);
        else resolve(address.port);
      });
    });
  });
}

function childOwnsLoopbackListener(child, port) {
  if (!child?.pid || child.exitCode !== null) return false;
  const result = spawnSync('/usr/sbin/lsof', [
    '-nP',
    '-a',
    '-p',
    String(child.pid),
    `-iTCP:${port}`,
    '-sTCP:LISTEN',
    '-FpnT',
  ], {encoding: 'utf8'});
  const lines = result.stdout.split('\n');
  return result.status === 0
    && lines.includes(`p${child.pid}`)
    && lines.includes(`n127.0.0.1:${port}`)
    && lines.includes('TST=LISTEN');
}

async function waitForUrl(url, child) {
  const port = Number(new URL(url).port);
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error('Packaged server exited before smoke testing.');
    }
    if (childOwnsLoopbackListener(child, port)) {
      try {
        const response = await fetch(url);
        if (response.status === 200 && childOwnsLoopbackListener(child, port)) {
          return true;
        }
      } catch {}
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function stopChild(child) {
  if (!child || child.exitCode !== null) return;
  child.kill('SIGTERM');
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 3000);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function screenshotBinding(absolutePath) {
  const bytes = await readFile(absolutePath);
  return {
    path: path.relative(WORKSPACE_ROOT, absolutePath).split(path.sep).join('/'),
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

async function smokePackage() {
  const archive = await readOuterArchiveBinding();
  const entriesResult = spawnSync(
    '/usr/bin/unzip',
    ['-Z1', ARCHIVE_PATH],
    {encoding: 'utf8'},
  );
  if (entriesResult.status !== 0) {
    throw new Error(`Unable to inspect package ZIP: ${entriesResult.stderr}`);
  }
  const entries = entriesResult.stdout.trim().split('\n').filter(Boolean);
  assertSafeArchiveEntries(entries);
  const extractionRoot = await mkdtemp(
    path.join(os.tmpdir(), 'g5-l4-whole-lesson-package-smoke-'),
  );
  let server = null;
  const report = {
    schemaVersion: 1,
    reportType: 'g5-l4-whole-lesson-package-mvp-v6-smoke',
    packageId: PACKAGE_ID,
    archive,
    freshArchiveExtraction: true,
    archiveEntryCount: entries.length,
    pagesExpectedPerLocale: 54,
    englishPagesReady: 0,
    spanishPagesReady: 0,
    fqFlows: [],
    glossaryCounts: {},
    screenshots: [],
    consoleErrors: [],
    pageErrors: [],
    badHttpResponses: [],
    failedRequests: [],
    externalRequests: [],
    failures: [],
    authority: {
      authoritativeOriginalRuntime: false,
      originalRuntimeFullFrameAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      humanAudioAccepted: false,
      ownerFidelityAccepted: false,
      strictComplete: false,
      publicRelease: false,
      published: false,
    },
  };
  try {
    const extraction = spawnSync(
      '/usr/bin/unzip',
      ['-q', ARCHIVE_PATH, '-d', extractionRoot],
      {encoding: 'utf8'},
    );
    if (extraction.status !== 0) {
      throw new Error(`Fresh package extraction failed: ${extraction.stderr}`);
    }
    const packageRoot = path.join(extractionRoot, PACKAGE_BASENAME);
    report.packageVerifier = await runVerifierAt(packageRoot);
    report.privacyScan = await scanPackagePrivacy(packageRoot);
    const manifest = JSON.parse(await readFile(
      path.join(packageRoot, 'package-manifest.json'),
      'utf8',
    ));
    assertManifestBoundary(manifest);
    report.packageManifestSha256 = await sha256File(
      path.join(packageRoot, 'package-manifest.json'),
    );
    report.release = manifest.release;

    const port = await findAvailableLoopbackPort();
    const baseUrl = `http://127.0.0.1:${port}`;
    report.baseUrl = baseUrl;
    report.serverIdentity = {
      loopbackPort: port,
      bindAddress: '127.0.0.1',
      serverEntry: manifest.entry.serverEntry,
      listenerOwnedBySpawnedChild: false,
    };
    const serverEntry = manifest.entry.serverEntry.replace(/^runtime\//, '');
    const runtimeRoot = path.join(packageRoot, 'runtime');
    const environment = {
      ...process.env,
      NODE_ENV: 'production',
      G5_L4_CEO_PREVIEW_ENABLED: '1',
      G5_L4_WHOLE_LESSON_PACKAGE: '1',
      NEXT_TELEMETRY_DISABLED: '1',
      HOSTNAME: '127.0.0.1',
      PORT: String(port),
    };
    delete environment.VERCEL_ENV;
    server = spawn(process.execPath, [serverEntry], {
      cwd: runtimeRoot,
      env: environment,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const serverLog = [];
    server.stdout.on('data', (chunk) => serverLog.push(chunk.toString()));
    server.stderr.on('data', (chunk) => serverLog.push(chunk.toString()));
    await waitForUrl(`${baseUrl}/courses/5/4`, server);
    report.serverIdentity.listenerOwnedBySpawnedChild =
      childOwnsLoopbackListener(server, port);

    const {chromium} = await import('playwright');
    const browser = await chromium.launch({headless: true});
    try {
      const context = await browser.newContext({
        viewport: {width: 1440, height: 1000},
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      page.on('console', (message) => {
        if (message.type() === 'error') report.consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => report.pageErrors.push(error.message));
      page.on('response', (response) => {
        if (response.status() >= 400) {
          report.badHttpResponses.push({
            status: response.status(),
            url: response.url(),
          });
        }
      });
      page.on('request', (request) => {
        const url = new URL(request.url());
        if (url.origin !== baseUrl && !url.protocol.startsWith('data')) {
          report.externalRequests.push(request.url());
        }
      });
      page.on('requestfailed', (request) => {
        const failure = request.failure()?.errorText ?? '';
        const requestUrl = new URL(request.url());
        if (failure === 'net::ERR_ABORTED' && requestUrl.searchParams.has('_rsc')) {
          return;
        }
        report.failedRequests.push({url: request.url(), failure});
      });

      const inspectLocale = async ({locale, pathPrefix, pickerLabel}) => {
        const response = await page.goto(
          `${baseUrl}${pathPrefix}/courses/5/4`,
          {waitUntil: 'networkidle'},
        );
        if (
          response?.status() !== 200
          || response.headers()['x-helpmath-controlled-preview']
            !== 'g5-l4-ceo-preview'
        ) {
          report.failures.push(`${locale} controlled-preview response mismatch`);
        }
        const player = page.locator(
          '[data-lesson-player="descriptor-driven-whole-lesson-audit"]',
        );
        await player.waitFor({state: 'visible', timeout: 20_000});
        const picker = page.locator(`select[aria-label="${pickerLabel}"]`);
        const options = await picker.locator('option').evaluateAll((elements) =>
          elements.map((element) => element.value)
        );
        if (options.length !== 54 || new Set(options).size !== 54) {
          report.failures.push(`${locale} page picker is not exact 54-member page order`);
        }
        let ready = 0;
        for (const animationId of options) {
          await picker.selectOption(animationId);
          await page.locator(
            `[data-lesson-player="descriptor-driven-whole-lesson-audit"][data-current-animation-id="${animationId}"]`,
          ).waitFor({timeout: 20_000});
          await page.locator(
            `canvas[data-animation-id="${animationId}"][data-render-state="ready"]`,
          ).waitFor({state: 'visible', timeout: 20_000});
          ready += 1;
        }
        return {options, ready};
      };

      const english = await inspectLocale({
        locale: 'en',
        pathPrefix: '',
        pickerLabel: 'Go to a lesson page',
      });
      report.englishPagesReady = english.ready;
      const englishPicker = page.locator(
        'select[aria-label="Go to a lesson page"]',
      );
      for (const animationId of [
        'course-g05-l04-fq-002',
        'course-g05-l04-fq-003',
      ]) {
        await englishPicker.selectOption(animationId);
        const controls = page.locator(
          '[data-current-javascript-question-controls="true"]',
        );
        await controls.waitFor({state: 'visible', timeout: 20_000});
        const firstLegend = await controls.locator('legend').textContent();
        await controls.locator('input[type="radio"]').first().check();
        await controls.locator('button[type="submit"]').click();
        await page.locator(
          '[data-current-javascript-question-controls="true"] legend',
        ).filter({hasText: 'Question 2 of'}).waitFor({timeout: 20_000});
        const secondLegend = await controls.locator('legend').textContent();
        await controls.getByRole('button', {name: 'Replay quiz'}).click();
        await page.locator(
          '[data-current-javascript-question-controls="true"] legend',
        ).filter({hasText: 'Question 1 of'}).waitFor({timeout: 20_000});
        report.fqFlows.push({
          animationId,
          firstLegend,
          secondLegend,
          answerSelectionAndSubmit: true,
          replayResetToQuestionOne: true,
        });
      }

      await page.locator(
        'button[data-responsive-focus-key="key-terms"]:visible',
      ).first().click();
      const keyTerms = page.locator('.lesson-shell2__key-terms-browser');
      await keyTerms.waitFor({state: 'visible', timeout: 20_000});
      await keyTerms.locator('.lesson-shell2__key-terms-count')
        .filter({hasText: '761 of 761'}).waitFor({timeout: 20_000});
      report.glossaryCounts.englishIndex = 761;
      await keyTerms.getByRole('button', {name: 'Índice español'}).click();
      await keyTerms.locator('.lesson-shell2__key-terms-count')
        .filter({hasText: '753 of 753'}).waitFor({timeout: 20_000});
      report.glossaryCounts.spanishIndex = 753;
      await mkdir(SMOKE_SCREENSHOT_ROOT, {recursive: true});
      const englishScreenshot = path.join(
        SMOKE_SCREENSHOT_ROOT,
        'fresh-unzip-en-fq003-key-terms.png',
      );
      await page.screenshot({path: englishScreenshot, fullPage: true});
      report.screenshots.push(await screenshotBinding(englishScreenshot));

      const spanish = await inspectLocale({
        locale: 'es',
        pathPrefix: '/es',
        pickerLabel: 'Ir a una página de la lección',
      });
      report.spanishPagesReady = spanish.ready;
      await page.setViewportSize({width: 390, height: 844});
      const documentWidth = await page.evaluate(() => Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
      ));
      report.spanishMobile = {
        viewportWidth: 390,
        documentWidth,
        horizontalOverflow: documentWidth > 390,
      };
      const spanishScreenshot = path.join(
        SMOKE_SCREENSHOT_ROOT,
        'fresh-unzip-es-mobile-fq003.png',
      );
      await page.screenshot({path: spanishScreenshot, fullPage: true});
      report.screenshots.push(await screenshotBinding(spanishScreenshot));
      await context.close();
    } finally {
      await browser.close();
    }
    report.serverLogTail = serverLog.join('').slice(-4000);
  } catch (error) {
    report.failures.push(error instanceof Error ? error.message : String(error));
  } finally {
    await stopChild(server);
    await rm(extractionRoot, {recursive: true, force: true});
  }

  if (
    report.englishPagesReady !== 54
    || report.spanishPagesReady !== 54
    || report.fqFlows.length !== 2
    || report.fqFlows.some((flow) =>
      flow.answerSelectionAndSubmit !== true
      || flow.replayResetToQuestionOne !== true
    )
    || report.glossaryCounts.englishIndex !== 761
    || report.glossaryCounts.spanishIndex !== 753
    || report.serverIdentity?.listenerOwnedBySpawnedChild !== true
    || report.spanishMobile?.horizontalOverflow !== false
    || report.privacyScan?.status !== 'pass'
    || report.release?.strictCompleteCount !== 0
    || report.release?.published !== false
    || report.consoleErrors.length
    || report.pageErrors.length
    || report.badHttpResponses.length
    || report.failedRequests.length
    || report.externalRequests.length
    || report.failures.length
  ) {
    report.status = 'fail';
  } else {
    report.status = 'pass-current-javascript-private-preview';
  }
  await mkdir(path.dirname(SMOKE_REPORT_PATH), {recursive: true});
  await writeFile(SMOKE_REPORT_PATH, stableJson(report), 'utf8');
  if (report.status === 'fail') {
    throw new Error(
      `Package smoke failed. See ${path.relative(WORKSPACE_ROOT, SMOKE_REPORT_PATH)}.`,
    );
  }
  console.log(stableJson({
    status: report.status,
    report: path.relative(WORKSPACE_ROOT, SMOKE_REPORT_PATH),
    englishPagesReady: report.englishPagesReady,
    spanishPagesReady: report.spanishPagesReady,
    fqFlows: report.fqFlows.length,
    glossaryCounts: report.glossaryCounts,
  }));
}

async function main() {
  const mode = parseArguments(process.argv.slice(2));
  if (mode === 'build') await buildPackage();
  else if (mode === 'check') await checkPackage();
  else await smokePackage();
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  await main();
}
