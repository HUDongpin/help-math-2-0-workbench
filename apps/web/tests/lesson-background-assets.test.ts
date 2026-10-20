import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, mkdtemp, readdir, readFile, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR} from '../lib/g4-l3-whole-lesson-player-descriptor';
import {hashedLessonBackgroundPath} from '../lib/lesson-background-path.mjs';
import config from '../config/lesson-background-assets.v1.json';
import nextConfig from '../next.config';
import {emitHashedLessonBackgrounds} from '../scripts/emit-hashed-lesson-backgrounds.mjs';

const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>');
const digest = createHash('sha256').update(svg).digest('hex');
const assetPath = 'courses/example/host-composite-assets/back.svg';

async function fixture(bytes: Buffer) {
  const root = await mkdtemp(path.join(tmpdir(), 'lesson-bg-'));
  await mkdir(path.join(root, 'src', path.dirname(assetPath)), {recursive: true});
  await writeFile(path.join(root, 'src', assetPath), bytes);
  return {sourceRoot: path.join(root, 'src'), outputDirectory: path.join(root, 'out')};
}

test('the build step writes verified bytes to the content-hashed path', async () => {
  const dirs = await fixture(svg);
  const written = await emitHashedLessonBackgrounds({entries: [{assetPath, sha256: digest}], ...dirs});
  assert.deepEqual(written, [`back.${digest.slice(0, 16)}.svg`]);
  assert.deepEqual(await readFile(path.join(dirs.outputDirectory, written[0]!)), svg);
});

test('the build step fails when the bytes differ from the recovered SVG digest', async () => {
  const dirs = await fixture(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>'));
  await assert.rejects(
    emitHashedLessonBackgrounds({entries: [{assetPath, sha256: digest}], ...dirs}),
    /bytes differ from the recovered SVG/u,
  );
  assert.deepEqual(await readdir(dirs.outputDirectory).catch(() => []), []);
});

test('the build step fails when the source background is missing', async () => {
  const dirs = await fixture(svg);
  await assert.rejects(
    emitHashedLessonBackgrounds({entries: [{assetPath: 'courses/missing.svg', sha256: digest}], ...dirs}),
    /Lesson background missing/u,
  );
});

test('every descriptor background is listed for build-time verification', () => {
  const background = G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.visualSkin.backgroundCompanion;
  assert.ok(background);
  assert.ok(config.entries.some((entry) =>
    `/flash-assets/${entry.assetPath}` === background.asset && entry.sha256 === background.assetSha256));
  assert.match(
    hashedLessonBackgroundPath(config.entries[0]!.assetPath, config.entries[0]!.sha256),
    /^\/lesson-backgrounds\/lesson-shell-mc-back-text\.102f0ddeec5ede88\.svg$/u,
  );
});

test('only hashed lesson background paths get the immutable cache header, and it wins', async () => {
  const rules = await nextConfig.headers!();
  const immutable = rules.filter((rule) =>
    rule.headers.some((header) => header.value === 'public, max-age=31536000, immutable'));
  assert.deepEqual(immutable.map((rule) => rule.source), ['/lesson-backgrounds/:file*']);
  assert.equal(rules.at(-1)?.source, '/lesson-backgrounds/:file*');
  assert.ok(rules.some((rule) =>
    rule.source === '/flash-assets/courses/shell-course-g04-l03-index-local/host-composite-assets/:path*'
    && rule.headers.some((header) => header.value === 'private, no-store, max-age=0')),
  'the old path keeps its existing headers');
});
