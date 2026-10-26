import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const specifier = '@helpmath/demos/nms-l02-p064-local-candidate';
const source = path.join(root, 'packages/demos/src/nms-l02-p064-quiz-candidate.tsx');
const stub = path.join(root, 'apps/web/lib/g678-p064-candidate.production-stub.tsx');
const audioSpecifier = '@/lib/nms-l02-p064-question-audio-response';
const audioSource = path.join(root, 'apps/web/lib/nms-l02-p064-question-audio-response.ts');
const audioStub = path.join(root, 'apps/web/lib/nms-l02-p064-question-audio.production-stub.ts');

function resolveCandidate(mode, optIn) {
  const code = `import config from './apps/web/next.config.ts';
    const name = '${specifier}';
    const resolved = config.webpack({plugins: [], resolve: {}},
      {dev: process.env.NODE_ENV !== 'production', isServer: false,
        webpack: {NormalModuleReplacementPlugin: class {}}});
    console.log(JSON.stringify({webpack: resolved.resolve.alias[name],
      turbopack: config.turbopack.resolveAlias[name]}));`;
  const output = execFileSync(path.join(root, 'node_modules/.bin/tsx'), ['-e', code], {
    cwd: root, encoding: 'utf8', env: {...process.env, NODE_ENV: mode,
      VERCEL_ENV: '', HELP_MATH_G678_LOCAL_PREVIEW: optIn ? '1' : '0',
      HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1'},
  });
  return JSON.parse(output.trim());
}

function resolveBuildDir(extraEnv = {}) {
  const code = "import config from './apps/web/next.config.ts'; console.log(config.distDir);";
  return execFileSync(path.join(root, 'node_modules/.bin/tsx'), ['-e', code], {
    cwd: root, encoding: 'utf8', env: {...process.env, NODE_ENV: 'production',
      HELP_MATH_P064_PRODUCTION_SCAN: '1', HELP_MATH_LOCAL_REFERENCE_DIAGNOSTIC: '0',
      G4_L3_WHOLE_LESSON_PACKAGE: '0', G5_L4_WHOLE_LESSON_PACKAGE: '0',
      ...extraEnv},
  }).trim();
}

function resolveProductionReplacement() {
  const code = `import config from './apps/web/next.config.ts';
    const plugins = [];
    class Replacement {constructor(pattern, replacement) {
      plugins.push({specifier: pattern.test('${specifier}'),
        source: pattern.test('${source.replaceAll('\\', '\\\\')}'), replacement});
    }}
    config.webpack({plugins, resolve: {}},
      {dev: false, isServer: false, webpack: {NormalModuleReplacementPlugin: Replacement}});
    console.log(JSON.stringify(plugins));`;
  const output = execFileSync(path.join(root, 'node_modules/.bin/tsx'), ['-e', code], {
    cwd: root, encoding: 'utf8', env: {...process.env, NODE_ENV: 'production',
      VERCEL_ENV: undefined, HELP_MATH_G678_LOCAL_PREVIEW: '0'},
  });
  return JSON.parse(output.trim());
}

function resolveAudioBoundary(mode) {
  const code = `import config from './apps/web/next.config.ts';
    const plugins = [];
    class Replacement {constructor(pattern, replacement) {
      plugins.push({specifier: pattern.test('${audioSpecifier}'),
        source: pattern.test('${audioSource}'), replacement});
    }}
    const resolved = config.webpack({plugins, resolve: {}},
      {dev: process.env.NODE_ENV !== 'production', isServer: true,
        webpack: {NormalModuleReplacementPlugin: Replacement}});
    console.log(JSON.stringify({webpack: resolved.resolve.alias['${audioSpecifier}'] ?? null,
      turbopack: config.turbopack.resolveAlias['${audioSpecifier}'] ?? null, plugins}));`;
  const output = execFileSync(path.join(root, 'node_modules/.bin/tsx'), ['-e', code], {
    cwd: root, encoding: 'utf8', env: {...process.env, NODE_ENV: mode,
      VERCEL_ENV: undefined, HELP_MATH_G678_LOCAL_PREVIEW: '1'},
  });
  return JSON.parse(output.trim());
}

test('P064 uses source only in opted-in local development and an inert module in production', () => {
  assert.deepEqual(resolveCandidate('development', true), {webpack: source, turbopack: source});
  assert.deepEqual(resolveCandidate('development', false), {webpack: stub, turbopack: stub});
  assert.deepEqual(resolveCandidate('production', true), {webpack: stub, turbopack: stub});
  const page = readFileSync(path.join(root,
    'apps/web/app/[locale]/migration-status/g678-calibration/shared-nms002-l02-p064/page.tsx'), 'utf8');
  assert.ok(page.includes("import('@/lib/nms-l02-p064-product-host.production-stub')"));
  assert.ok(page.includes("import('@/components/g678-nms-l02-p064-candidate-lesson-v1.generated')"));
  assert.ok(page.includes("process.env.NODE_ENV==='production' ? Promise.resolve(null)"));
  assert.ok(page.includes("import('@/lib/nms-l02-p064-product-candidate.server')"));
  assert.ok(page.includes("process.env.NODE_ENV === 'production'"));
  const stubText = readFileSync(stub, 'utf8');
  assert.ok(stubText.includes('return null;'));
  assert.ok(!stubText.includes('nms-l02-p064-presentation-data'));
});

test('P064 production scan uses a separate local build directory only', () => {
  assert.equal(resolveBuildDir({VERCEL_ENV: undefined}), '.next-p064-production-scan');
  assert.equal(resolveBuildDir({VERCEL_ENV: 'production'}), '.next');
});

test('P064 production replacement intercepts the specifier and resolved source path', () => {
  assert.ok(resolveProductionReplacement().some(plugin => plugin.specifier
    && plugin.source && plugin.replacement === stub));
});

test('P064 source-audio reader is replaced by a denying stub in production', () => {
  const development = resolveAudioBoundary('development');
  assert.equal(development.webpack, null);
  assert.equal(development.turbopack, null);
  const production = resolveAudioBoundary('production');
  assert.equal(production.turbopack, audioStub);
  assert.ok(production.plugins.some(plugin => plugin.specifier
    && plugin.source && plugin.replacement === audioStub));
  const stubText = readFileSync(audioStub, 'utf8');
  assert.ok(stubText.includes('status: 404'));
  assert.ok(stubText.includes('p064QuestionAudioResponse'));
  assert.ok(stubText.includes('p064OptionAudioResponse'));
  const route = readFileSync(path.join(root,
    'apps/web/app/flash-assets/g678-local/shared-nms002-l02-p064/option-audio/[folder]/[question]/[option]/route.ts'), 'utf8');
  assert.ok(route.includes("process.env.NODE_ENV !== 'development'"));
  assert.ok(route.includes("import('@/lib/nms-l02-p064-question-audio-response')"));
});
