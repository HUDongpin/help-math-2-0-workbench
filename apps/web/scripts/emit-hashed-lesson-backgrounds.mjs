#!/usr/bin/env node
// Build step: copy each source-bound lesson background to its content-hashed
// path, failing the build if the materialized bytes differ from the recovered
// SVG digest. This replaces the in-browser SHA-256 check from PR #29.
import {createHash} from 'node:crypto';
import {mkdir, readdir, readFile, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {hashedLessonBackgroundPath} from '../lib/lesson-background-path.mjs';

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function emitHashedLessonBackgrounds({
  entries,
  sourceRoot = path.join(WEB_ROOT, 'public/flash-assets'),
  outputDirectory = path.join(WEB_ROOT, 'public/lesson-backgrounds'),
}) {
  const written = [];
  for (const {assetPath, sha256} of entries) {
    const bytes = await readFile(path.join(sourceRoot, assetPath)).catch((error) => {
      throw new Error(`Lesson background missing: ${assetPath} (${error.code ?? error.message})`);
    });
    const actual = createHash('sha256').update(bytes).digest('hex');
    if (actual !== sha256) {
      throw new Error(`Lesson background bytes differ from the recovered SVG: ${assetPath} expected ${sha256}, got ${actual}`);
    }
    const fileName = path.basename(hashedLessonBackgroundPath(assetPath, sha256));
    await mkdir(outputDirectory, {recursive: true});
    await writeFile(path.join(outputDirectory, fileName), bytes);
    written.push(fileName);
  }
  for (const file of await readdir(outputDirectory).catch(() => [])) {
    if (!written.includes(file)) await rm(path.join(outputDirectory, file));
  }
  return written;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const config = JSON.parse(await readFile(path.join(WEB_ROOT, 'config/lesson-background-assets.v1.json'), 'utf8'));
  if (config.schemaVersion !== 1 || !Array.isArray(config.entries)) throw new Error('lesson-background-assets.v1.json is invalid');
  try {
    const written = await emitHashedLessonBackgrounds({entries: config.entries});
    process.stdout.write(`${JSON.stringify({lessonBackgrounds: written})}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}
