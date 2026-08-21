import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {G5_L4_AUDIO_ASSET_SHA256} from '../lib/g5-l4-audio-assets.generated';

const publicAssetRoot = path.resolve(
  import.meta.dirname,
  '../public/flash-assets/courses',
);
const serverAudioRoot = path.resolve(
  import.meta.dirname,
  '../server-assets/flash-assets/courses',
);
const expectedChecksumSetSha256 =
  '52dd1d51335523dc097b0c1a428e897960425ad184069fb023e98e0fcef7ae25';
const allowedExtensions = new Set(['.js', '.mp3', '.png', '.svg', '.ttf']);

async function walk(directory: string): Promise<string[]> {
  const result: string[] = [];
  const entries = await readdir(directory, {withFileTypes: true});
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    const metadata = await lstat(absolutePath);
    assert.equal(metadata.isSymbolicLink(), false, absolutePath);
    if (metadata.isDirectory()) result.push(...await walk(absolutePath));
    else {
      assert.equal(metadata.isFile(), true, absolutePath);
      result.push(absolutePath);
    }
  }
  return result;
}

test('deployment assets are an exact five-lesson Current-JS runtime closure', async () => {
  const [publicFiles, serverAudioFiles] = await Promise.all([
    walk(publicAssetRoot),
    walk(serverAudioRoot),
  ]);
  const entries = [
    ...publicFiles.map((file) => ({
      file,
      relative: path.relative(publicAssetRoot, file).split(path.sep).join('/'),
      root: 'public' as const,
    })),
    ...serverAudioFiles.map((file) => ({
      file,
      relative: path.relative(serverAudioRoot, file).split(path.sep).join('/'),
      root: 'server-audio' as const,
    })),
  ].sort((left, right) => left.relative.localeCompare(right.relative));
  const relativeFiles = entries.map(({relative}) => relative);
  assert.equal(publicFiles.length, 929);
  assert.equal(serverAudioFiles.length, 185);
  assert.equal(entries.length, 1114);
  assert.equal(
    relativeFiles.filter((file) =>
      file.startsWith('course-g04-l03-')
      || file.startsWith('shell-course-g04-l03-index-local/')
    ).length,
    559,
  );
  assert.equal(
    relativeFiles.filter((file) =>
      file.startsWith('course-g05-l04-')
      || file.startsWith('shell-course-g05-l04-index-local/')
    ).length,
    303,
  );
  assert.equal(
    relativeFiles.filter((file) => file.startsWith('course-g03-l02-')).length,
    132,
  );
  assert.equal(
    relativeFiles.filter((file) => file.startsWith('course-g05-l03-')).length,
    64,
  );
  assert.equal(
    relativeFiles.filter((file) => file.startsWith('course-g05-l05-')).length,
    56,
  );
  assert.equal(relativeFiles.filter((file) => file.endsWith('/canvas-renderer.js')).length, 283);
  assert.equal(
    relativeFiles.filter((file) =>
      file === 'course-g04-l03-gs-002/canvas-interaction-base-renderer.js'
    ).length,
    1,
  );
  assert.equal(relativeFiles.filter((file) => file.endsWith('.mp3')).length, 319);
  const g5L4AudioFiles = relativeFiles.filter((file) =>
    Object.hasOwn(G5_L4_AUDIO_ASSET_SHA256, file)
  );
  assert.equal(g5L4AudioFiles.length, 185);
  assert.deepEqual(
    g5L4AudioFiles,
    Object.keys(G5_L4_AUDIO_ASSET_SHA256).sort(),
  );
  assert.equal(
    publicFiles.some((file) =>
      Object.hasOwn(
        G5_L4_AUDIO_ASSET_SHA256,
        path.relative(publicAssetRoot, file).split(path.sep).join('/'),
      )
    ),
    false,
    'G5 L4 audio must not exist under Next public static handling',
  );
  assert.deepEqual(
    serverAudioFiles.map((file) =>
      path.relative(serverAudioRoot, file).split(path.sep).join('/')
    ).sort(),
    Object.keys(G5_L4_AUDIO_ASSET_SHA256).sort(),
  );
  assert.equal(relativeFiles.some((file) => file.endsWith('manifest.json')), false);
  assert(relativeFiles.every((file) => allowedExtensions.has(path.extname(file))));

  const rows: string[] = [];
  for (const {file, relative, root} of entries) {
    const bytes = await readFile(file);
    rows.push(
      `${createHash('sha256').update(bytes).digest('hex')} ${bytes.length} ${relative}`,
    );
    if (Object.hasOwn(G5_L4_AUDIO_ASSET_SHA256, relative)) {
      assert.equal(root, 'server-audio', relative);
      assert.equal(
        createHash('sha256').update(bytes).digest('hex'),
        G5_L4_AUDIO_ASSET_SHA256[relative],
        relative,
      );
    }
    if (['.js', '.svg'].includes(path.extname(file))) {
      const text = bytes.toString('utf8');
      assert.doesNotMatch(
        text,
        /\/Users\/|\/Volumes\/|private-archive|source-assets|\.fla(?:["'\s]|$)|\.swf(?:["'\s]|$)|EXECUTIVE_PREVIEW_(?:ACCESS_KEY|SESSION_SECRET)\s*[=:]/u,
        relative,
      );
    }
  }
  assert.equal(
    createHash('sha256').update(rows.join('\n')).digest('hex'),
    expectedChecksumSetSha256,
  );
});
