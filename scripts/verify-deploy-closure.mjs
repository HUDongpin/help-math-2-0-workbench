#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const REQUIRED_FAIL_CLOSED_RULES = Object.freeze([
  '.codex-validation-*',
  '**/.codex-validation-*',
  'pkcs11.txt',
  '**/pkcs11.txt',
  '.env',
  '.env.*',
  '**/.env',
  '**/.env.*',
  '**/.cache/',
  '/.launch-control-runtime/',
  '.gitleaks.toml',
  '.gitleaksignore',
  '**/.gitleaksignore',
  'packages/demos/hosted-tests.v1.json',
  'packages/demos/scripts/run-hosted-tests.mjs',
  'source-assets/',
  'private-archive/',
  'candidate-evidence/',
  'apps/web/candidate-assets/',
  'apps/web/public/generated/',
  '!catalog/public-launch-manifest.v1.json',
  '**/*.fla',
  '**/*.swf',
]);

const EXACT_REPORT_ALLOWLIST = new Set([
  'reports/g5-l4-source-scope-freeze.json',
  'reports/g3-l2-cross-grade-factory-audit.json',
  'reports/g5-l3-page-only-whole-lesson-source-scope.json',
]);
const ALLOWED_INDEX_MODES = new Set(['100644', '100755']);

function escapeRegex(character) {
  return /[\\^$.*+?()[\]{}|]/.test(character) ? `\\${character}` : character;
}

function globToRegexSource(glob) {
  let source = '';
  for (let index = 0; index < glob.length; index += 1) {
    const character = glob[index];
    if (character === '*') {
      if (glob[index + 1] === '*') {
        while (glob[index + 1] === '*') index += 1;
        if (glob[index + 1] === '/') {
          index += 1;
          source += '(?:.*/)?';
        } else {
          source += '.*';
        }
      } else {
        source += '[^/]*';
      }
    } else if (character === '?') {
      source += '[^/]';
    } else {
      source += escapeRegex(character);
    }
  }
  return source;
}

export function parseIgnoreRules(contents) {
  return contents
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const negated = line.startsWith('!');
      const rawPattern = negated ? line.slice(1) : line;
      const directoryOnly = rawPattern.endsWith('/');
      const anchored = rawPattern.startsWith('/');
      const pattern = rawPattern.replace(/^\//u, '').replace(/\/$/u, '');
      const hasSlash = pattern.includes('/');
      const body = globToRegexSource(pattern);
      const prefix = anchored || hasSlash ? '^' : '(?:^|.*/)';
      const suffix = directoryOnly ? '(?:/.*)?$' : '$';
      return {
        line,
        negated,
        regex: new RegExp(`${prefix}${body}${suffix}`, 'u'),
      };
    });
}

export function ignoredByRules(filePath, rules) {
  let ignored = false;
  const candidates = [filePath];
  let ancestor = filePath;
  while (ancestor.includes('/')) {
    ancestor = ancestor.slice(0, ancestor.lastIndexOf('/'));
    candidates.push(ancestor);
  }
  for (const rule of rules) {
    if (candidates.some((candidate) => rule.regex.test(candidate))) {
      ignored = !rule.negated;
    }
  }
  return ignored;
}

export function classifyForbiddenDeployPath(filePath) {
  const segments = filePath.split('/');
  const basename = segments.at(-1) ?? filePath;

  if (segments.some((segment) => segment.startsWith('.codex-validation-'))) {
    return 'linked-worktree-path';
  }
  if (basename.toLowerCase() === 'pkcs11.txt') return 'machine-security-config';
  if (segments.some((segment) => segment.startsWith('.catalog.'))) {
    return 'catalog-stage-root';
  }
  if (
    segments.some((segment) =>
      segment.startsWith('.HELP MATH_ORIGINAL FILES.'),
    )
  ) {
    return 'source-stage-root';
  }
  if (filePath === 'All API Keys.docx') return 'credential-document';
  if (/\.(?:fla|swf)$/iu.test(filePath)) return 'legacy-source-binary';
  if (/^\.env(?:\.|$)/u.test(filePath) && !filePath.endsWith('.env.example')) {
    return 'root-environment-file';
  }
  if (/\/(?:\.env)(?:\.|$)/u.test(filePath) && !filePath.endsWith('.env.example')) {
    return 'nested-environment-file';
  }

  const forbiddenPrefixes = [
    ['source-assets/', 'canonical-source'],
    ['private-archive/', 'private-archive'],
    ['candidate-evidence/', 'candidate-evidence'],
    ['apps/web/candidate-assets/', 'candidate-runtime'],
    ['artifacts/', 'review-evidence'],
    ['migrations/', 'migration-workspace'],
    ['documentation/', 'private-documentation'],
    ['work/', 'local-worktree-state'],
    ['output/', 'local-output'],
    ['outputs/', 'local-output'],
  ];
  for (const [prefix, reason] of forbiddenPrefixes) {
    if (filePath.startsWith(prefix)) return reason;
  }
  if (filePath.startsWith('reports/') && !EXACT_REPORT_ALLOWLIST.has(filePath)) {
    return 'non-runtime-report';
  }
  return null;
}

function nulSeparated(command, args) {
  const output = execFileSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
  return output.split('\0').filter(Boolean);
}

function sha256Lines(values) {
  return createHash('sha256').update(`${values.join('\n')}\n`).digest('hex');
}

export function verifyDeployClosure({
  trackedPaths,
  stagedEntries,
  ignoreContents,
}) {
  const rules = parseIgnoreRules(ignoreContents);
  const literalRules = new Set(rules.map((rule) => rule.line));
  const missingRequiredRules = REQUIRED_FAIL_CLOSED_RULES.filter(
    (rule) => !literalRules.has(rule),
  );

  const gitlinks = stagedEntries
    .filter((entry) => entry.mode === '160000')
    .map((entry) => entry.path)
    .sort();
  const unsafeIndexEntries = stagedEntries
    .filter((entry) => !ALLOWED_INDEX_MODES.has(entry.mode))
    .map((entry) => ({mode: entry.mode, path: entry.path}))
    .sort((left, right) => left.path.localeCompare(right.path));
  const entriesByPath = Map.groupBy(stagedEntries, (entry) => entry.path);
  const duplicateIndexEntries = [...entriesByPath]
    .filter(([, entries]) => entries.length !== 1)
    .map(([filePath]) => filePath)
    .sort();
  const missingIndexEntries = trackedPaths
    .filter((filePath) => !entriesByPath.has(filePath))
    .sort();
  const deployInputs = [];
  const deployInputIdentities = [];
  const forbiddenInputs = [];

  for (const filePath of [...trackedPaths].sort()) {
    if (ignoredByRules(filePath, rules)) continue;
    deployInputs.push(filePath);
    const entry = entriesByPath.get(filePath)?.[0];
    if (entry) {
      deployInputIdentities.push(`${entry.mode} ${entry.objectId}\t${filePath}`);
    }
    const reason = classifyForbiddenDeployPath(filePath);
    if (reason) forbiddenInputs.push({path: filePath, reason});
  }

  const status =
    missingRequiredRules.length === 0 &&
    gitlinks.length === 0 &&
    unsafeIndexEntries.length === 0 &&
    duplicateIndexEntries.length === 0 &&
    missingIndexEntries.length === 0 &&
    forbiddenInputs.length === 0
      ? 'PASS'
      : 'FAIL';

  return {
    schemaVersion: 1,
    evidenceScope:
      'git-index-preflight-only; a separate exact Vercel upload manifest is required before deployment',
    status,
    trackedPathCount: trackedPaths.length,
    deployInputCount: deployInputs.length,
    deployInputPathSetSha256: sha256Lines(deployInputs),
    deployInputIndexIdentitySetSha256: sha256Lines(deployInputIdentities),
    missingRequiredRules,
    gitlinks,
    unsafeIndexEntries,
    duplicateIndexEntries,
    missingIndexEntries,
    forbiddenInputs,
  };
}

function readRepositoryState() {
  const trackedPaths = nulSeparated('git', ['ls-files', '-z']);
  const stagedRecords = nulSeparated('git', ['ls-files', '--stage', '-z']);
  const stagedEntries = stagedRecords.map((record) => {
    const match = /^(\d{6}) ([0-9a-f]{40,64}) \d+\t(.+)$/u.exec(record);
    if (!match) throw new Error(`Cannot parse Git index record for ${record}`);
    return {mode: match[1], objectId: match[2], path: match[3]};
  });
  return {
    trackedPaths,
    stagedEntries,
    ignoreContents: readFileSync(path.join(projectRoot, '.vercelignore'), 'utf8'),
  };
}

function main() {
  const result = verifyDeployClosure(readRepositoryState());
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status !== 'PASS') process.exitCode = 1;
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) main();
