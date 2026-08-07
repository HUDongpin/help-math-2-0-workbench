import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const assetRoot = path.resolve(
  import.meta.dirname,
  '../public/flash-assets/courses',
);
const expectedChecksumSetSha256 =
  '2a7f200cbb69a7e1cff8075a61091f4cae953f8b50f2fa4b0557928b9d5e9f78';
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

test('private deployment assets are an exact runtime-only G4 L3 and G5 L4 closure', async () => {
  const files = (await walk(assetRoot)).sort();
  const relativeFiles = files.map((file) =>
    path.relative(assetRoot, file).split(path.sep).join('/')
  );
  assert.equal(files.length, 676);
  assert.equal(
    relativeFiles.filter((file) =>
      file.startsWith('course-g04-l03-')
      || file.startsWith('shell-course-g04-l03-index-local/')
    ).length,
    558,
  );
  assert.equal(
    relativeFiles.filter((file) =>
      file.startsWith('course-g05-l04-')
      || file.startsWith('shell-course-g05-l04-index-local/')
    ).length,
    118,
  );
  assert.equal(relativeFiles.filter((file) => file.endsWith('/canvas-renderer.js')).length, 93);
  assert.equal(relativeFiles.filter((file) => file.endsWith('.mp3')).length, 72);
  assert.equal(relativeFiles.some((file) => file.endsWith('manifest.json')), false);
  assert(relativeFiles.every((file) => allowedExtensions.has(path.extname(file))));

  const rows: string[] = [];
  for (const [index, file] of files.entries()) {
    const bytes = await readFile(file);
    rows.push(
      `${createHash('sha256').update(bytes).digest('hex')} ${bytes.length} ${relativeFiles[index]}`,
    );
    if (['.js', '.svg'].includes(path.extname(file))) {
      const text = bytes.toString('utf8');
      assert.doesNotMatch(
        text,
        /\/Users\/|\/Volumes\/|private-archive|source-assets|\.fla(?:["'\s]|$)|\.swf(?:["'\s]|$)|EXECUTIVE_PREVIEW_(?:ACCESS_KEY|SESSION_SECRET)\s*[=:]/u,
        relativeFiles[index],
      );
    }
  }
  assert.equal(
    createHash('sha256').update(rows.join('\n')).digest('hex'),
    expectedChecksumSetSha256,
  );
});
