#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = resolve(dirname(SCRIPT_PATH), '..');
const FORBIDDEN_PREFIXES = [
  '.git',
  'candidate-evidence',
  'migrations',
  'private-archive',
  'source-assets',
];

function parseArguments(argv) {
  const values = new Map();
  const flags = new Set();

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith('--')) {
      throw new Error(`Unexpected positional argument: ${argument}`);
    }
    if (argument === '--write') {
      flags.add(argument);
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${argument}`);
    }
    values.set(argument, value);
    index += 1;
  }

  const required = [
    '--deployment',
    '--team',
    '--base-ref',
    '--expected-source-files',
    '--receipt',
  ];
  for (const key of required) {
    if (!values.has(key)) {
      throw new Error(`Missing required argument ${key}`);
    }
  }

  const expectedSourceFiles = Number(values.get('--expected-source-files'));
  if (!Number.isSafeInteger(expectedSourceFiles) || expectedSourceFiles <= 0) {
    throw new Error('--expected-source-files must be a positive integer');
  }

  return {
    deploymentId: values.get('--deployment'),
    teamId: values.get('--team'),
    baseRef: values.get('--base-ref'),
    expectedSourceFiles,
    receiptPath: values.get('--receipt'),
    write: flags.has('--write'),
  };
}

function run(command, arguments_, options = {}) {
  return execFileSync(command, arguments_, {
    cwd: REPOSITORY_ROOT,
    encoding: options.encoding ?? 'utf8',
    maxBuffer: options.maxBuffer ?? 128 * 1024 * 1024,
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
  });
}

function sha1(bytes) {
  return createHash('sha1').update(bytes).digest('hex');
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function fetchVercelJson(endpoint) {
  const output = run('npx', [
    '--yes',
    'vercel@latest',
    'api',
    endpoint,
    '--raw',
  ], {
    maxBuffer: 768 * 1024 * 1024,
  });
  return JSON.parse(output);
}

function collectSourceManifest(tree) {
  const entries = [];

  function visit(node, parents) {
    const pathParts = [...parents, node.name];
    if (node.type === 'file') {
      if (pathParts[0] === 'src') {
        entries.push({
          path: pathParts.slice(1).join('/'),
          sourcePath: pathParts.join('/'),
          uid: node.uid,
          mode: node.mode,
        });
      }
      return;
    }
    for (const child of node.children ?? []) {
      visit(child, pathParts);
    }
  }

  for (const node of tree) {
    visit(node, []);
  }

  return entries.sort((left, right) => left.path.localeCompare(right.path));
}

function validateTargetPath(repositoryPath) {
  if (
    repositoryPath.length === 0
    || repositoryPath.startsWith('/')
    || repositoryPath.split('/').includes('..')
  ) {
    throw new Error(`Unsafe deployment path: ${repositoryPath}`);
  }

  for (const prefix of FORBIDDEN_PREFIXES) {
    if (repositoryPath === prefix || repositoryPath.startsWith(`${prefix}/`)) {
      throw new Error(`Deployment source unexpectedly targets protected path: ${repositoryPath}`);
    }
  }

  const absolutePath = resolve(REPOSITORY_ROOT, repositoryPath);
  const relativePath = relative(REPOSITORY_ROOT, absolutePath);
  if (
    relativePath.length === 0
    || relativePath === '..'
    || relativePath.startsWith(`..${sep}`)
  ) {
    throw new Error(`Deployment path escapes repository root: ${repositoryPath}`);
  }
  return absolutePath;
}

function readCurrentEntry(entry) {
  const absolutePath = validateTargetPath(entry.path);
  if (!existsSync(absolutePath)) {
    return {
      absolutePath,
      exists: false,
      bytes: null,
      sha1: null,
      sha256: null,
      mode: null,
    };
  }
  const bytes = readFileSync(absolutePath);
  return {
    absolutePath,
    exists: true,
    bytes,
    sha1: sha1(bytes),
    sha256: sha256(bytes),
    mode: statSync(absolutePath).mode,
  };
}

function writeAtomically(targetPath, bytes, mode) {
  mkdirSync(dirname(targetPath), { recursive: true });
  const temporaryPath = `${targetPath}.deployment-source-${process.pid}.tmp`;
  try {
    writeFileSync(temporaryPath, bytes, { flag: 'wx', mode: mode & 0o777 });
    chmodSync(temporaryPath, mode & 0o777);
    renameSync(temporaryPath, targetPath);
  } finally {
    rmSync(temporaryPath, { force: true });
  }
}

function manifestChecksum(entries) {
  const canonical = entries
    .map((entry) => `${entry.path}\t${entry.uid}\t${entry.mode}`)
    .join('\n');
  return sha256(Buffer.from(`${canonical}\n`, 'utf8'));
}

function assertGitBaseline(baseRef) {
  const head = run('git', ['rev-parse', 'HEAD']).trim();
  const expected = run('git', ['rev-parse', `${baseRef}^{commit}`]).trim();
  if (head !== expected) {
    throw new Error(`HEAD ${head} does not match required base ref ${expected}`);
  }
  run('git', ['diff', '--quiet']);
  run('git', ['diff', '--cached', '--quiet']);
  return head;
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const baseCommit = assertGitBaseline(options.baseRef);
  const treeEndpoint = `/v6/deployments/${options.deploymentId}/files?teamId=${options.teamId}`;
  const sourceManifest = collectSourceManifest(fetchVercelJson(treeEndpoint));

  if (sourceManifest.length !== options.expectedSourceFiles) {
    throw new Error(
      `Expected ${options.expectedSourceFiles} source files, found ${sourceManifest.length}`,
    );
  }

  const changed = [];
  for (const [index, entry] of sourceManifest.entries()) {
    const before = readCurrentEntry(entry);
    if (before.sha1 === entry.uid) {
      continue;
    }

    const encodedPath = encodeURIComponent(entry.sourcePath);
    const fileEndpoint = `/v8/deployments/${options.deploymentId}/files/${entry.uid}`
      + `?path=${encodedPath}&teamId=${options.teamId}`;
    const response = fetchVercelJson(fileEndpoint);
    const deployedBytes = Buffer.from(response.data, 'base64');
    const deployedSha1 = sha1(deployedBytes);
    if (deployedSha1 !== entry.uid) {
      throw new Error(
        `Vercel content hash mismatch for ${entry.path}: expected ${entry.uid}, got ${deployedSha1}`,
      );
    }

    const disposition = before.exists ? 'replace' : 'create';
    changed.push({
      path: entry.path,
      disposition,
      mode: entry.mode,
      beforeBytes: before.bytes?.length ?? null,
      beforeSha1: before.sha1,
      beforeSha256: before.sha256,
      deployedBytes: deployedBytes.length,
      deployedSha1,
      deployedSha256: sha256(deployedBytes),
    });

    if (options.write) {
      writeAtomically(before.absolutePath, deployedBytes, entry.mode);
    }

    process.stderr.write(
      `[${index + 1}/${sourceManifest.length}] ${disposition} ${entry.path}\n`,
    );
  }

  if (options.write) {
    for (const entry of sourceManifest) {
      const current = readCurrentEntry(entry);
      if (current.sha1 !== entry.uid) {
        throw new Error(`Post-write verification failed for ${entry.path}`);
      }
    }
  }

  const receipt = {
    schemaVersion: 1,
    artifactType: 'vercel-deployment-source-reconstruction-receipt',
    generatedAt: new Date().toISOString(),
    status: options.write ? 'reconstructed-and-verified' : 'dry-run',
    deploymentId: options.deploymentId,
    teamId: options.teamId,
    baseCommit,
    sourceFileCount: sourceManifest.length,
    sourceManifestChecksumSha256: manifestChecksum(sourceManifest),
    sourceManifestIdentity: 'path-tab-vercel-file-sha1-tab-mode-newline',
    changedFileCount: changed.length,
    changed,
    protectedPrefixes: FORBIDDEN_PREFIXES,
    sourceTreeAuthority: 'Vercel deployment files API v6/v8',
    acceptanceBoundary: [
      'This receipt reconstructs exact uploaded source bytes for the named deployment.',
      'It does not establish Flash fidelity, audio, human, Owner, strict-completion, or release acceptance.',
    ],
  };

  const receiptAbsolutePath = validateTargetPath(options.receiptPath);
  if (options.write) {
    writeAtomically(
      receiptAbsolutePath,
      Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, 'utf8'),
      0o100644,
    );
  }
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
}

main();
