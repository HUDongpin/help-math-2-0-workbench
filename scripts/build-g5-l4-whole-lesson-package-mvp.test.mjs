import assert from 'node:assert/strict';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  DEFAULT_PORT,
  PACKAGE_BASENAME,
  PACKAGE_ID,
  RELEASE_ID,
  assertManifestBoundary,
  assertSafeArchiveEntries,
  isAllowedCourseAsset,
  parseArguments,
  scanPackagePrivacy,
  selectG5L4Ledger,
  selectG5L4Release,
  verifierSource,
} from './build-g5-l4-whole-lesson-package-mvp.mjs';

const sha = (character) => character.repeat(64);

function releaseFixture() {
  const members = Array.from({length: 55}, (_, index) => ({
    ordinal: index + 1,
    animationId: index === 54
      ? 'shell-course-g05-l04-index-local'
      : `course-g05-l04-page-${String(index + 1).padStart(3, '0')}`,
    assetId: `swf-${sha(index % 2 ? 'a' : 'b')}`,
    releaseRole: index === 54
      ? 'course-shell'
      : 'active-xml-referenced-page',
    source: {sha256: sha(index % 2 ? 'a' : 'b')},
  }));
  return {
    releases: [{
      releaseId: RELEASE_ID,
      publicationMode: 'atomic',
      grade: 5,
      lesson: 4,
      titleDisplay: 'Number Lines',
      expectedCounts: {
        activeXmlReferencedPages: 54,
        courseShells: 1,
        members: 55,
      },
      members,
    }],
  };
}

function ledgerFixture() {
  return {
    releases: [{
      releaseId: RELEASE_ID,
      expectedMemberCount: 55,
      strictCompleteCount: 0,
      missingCount: 55,
      published: false,
      status: 'unpublished',
      gate: {open: false},
      members: Array.from({length: 55}, () => ({
        strictComplete: false,
        status: 'missing',
      })),
    }],
  };
}

function manifestFixture() {
  return {
    schemaVersion: 1,
    packageId: PACKAGE_ID,
    packageType: 'machine-verified-private-controlled-preview',
    entry: {
      url: `http://127.0.0.1:${DEFAULT_PORT}/courses/5/4`,
      spanishUrl: `http://127.0.0.1:${DEFAULT_PORT}/es/courses/5/4`,
      network: 'loopback-only',
    },
    release: {
      releaseId: RELEASE_ID,
      expectedMembers: 55,
      activePages: 54,
      courseShells: 1,
      strictCompleteCount: 0,
      published: false,
    },
    members: Array.from({length: 55}, (_, index) => ({
      animationId: `member-${index + 1}`,
    })),
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
    assets: {memberCount: 55, extensions: {js: 54}},
    glossaries: [
      {language: 'en', entryCount: 761},
      {language: 'es', entryCount: 753},
    ],
  };
}

test('argument parsing is exact and mode-only', () => {
  assert.equal(parseArguments(['--build']), 'build');
  assert.equal(parseArguments(['--check']), 'check');
  assert.equal(parseArguments(['--smoke']), 'smoke');
  assert.throws(() => parseArguments([]), /exactly one mode/);
  assert.throws(
    () => parseArguments(['--build', '--smoke']),
    /exactly one mode/,
  );
  assert.throws(() => parseArguments(['--unknown']), /exactly one mode/);
});

test('release selector requires exact 54 pages plus one shell', () => {
  const release = selectG5L4Release(releaseFixture());
  assert.equal(release.members.length, 55);
  assert.equal(release.members.at(-1).animationId, 'shell-course-g05-l04-index-local');
  const drifted = releaseFixture();
  drifted.releases[0].expectedCounts.activeXmlReferencedPages = 53;
  assert.throws(() => selectG5L4Release(drifted), /exact G5 L4/);
});

test('ledger selector refuses any strict or publication promotion', () => {
  assert.equal(selectG5L4Ledger(ledgerFixture()).strictCompleteCount, 0);
  const promoted = ledgerFixture();
  promoted.releases[0].strictCompleteCount = 1;
  promoted.releases[0].missingCount = 54;
  promoted.releases[0].members[0] = {
    strictComplete: true,
    status: 'complete',
  };
  assert.throws(() => selectG5L4Ledger(promoted), /boundary has changed/);
  const published = ledgerFixture();
  published.releases[0].published = true;
  assert.throws(() => selectG5L4Ledger(published), /boundary has changed/);
});

test('course asset allowlist is limited to safe JS JSON and PNG paths', () => {
  assert.equal(isAllowedCourseAsset('canvas-renderer.js'), true);
  assert.equal(isAllowedCourseAsset('root-frames/frame-0049.png'), true);
  assert.equal(isAllowedCourseAsset('control-assets/manifest.json'), true);
  assert.equal(isAllowedCourseAsset('../source.swf'), false);
  assert.equal(isAllowedCourseAsset('audio/narration.mp3'), false);
  assert.equal(isAllowedCourseAsset('source.fla'), false);
});

test('manifest boundary keeps all strict authority false', () => {
  assert.equal(assertManifestBoundary(manifestFixture()), true);
  const promoted = manifestFixture();
  promoted.authority.ownerFidelityAccepted = true;
  assert.throws(() => assertManifestBoundary(promoted), /authority or G5 L4/);
  const wrongCount = manifestFixture();
  wrongCount.members.pop();
  assert.throws(() => assertManifestBoundary(wrongCount), /authority or G5 L4/);
});

test('embedded verifier is portable and enforces package privacy', () => {
  const source = verifierSource();
  assert.match(source, new RegExp(PACKAGE_ID));
  assert.match(source, /Private absolute local path/);
  assert.match(source, /strictCompleteCount !== 0/);
  assert.match(source, /published !== false/);
  assert.doesNotMatch(source, /\/Volumes\/WestWorld/);
  assert.doesNotMatch(source, /\/Users\/peter/);
});

test('archive entry contract rejects traversal and unrelated roots', () => {
  assert.equal(assertSafeArchiveEntries([
    `${PACKAGE_BASENAME}/`,
    `${PACKAGE_BASENAME}/verify.mjs`,
    `${PACKAGE_BASENAME}/runtime/apps/web/server.js`,
  ]), true);
  assert.throws(
    () => assertSafeArchiveEntries([`${PACKAGE_BASENAME}/../secret`]),
    /Unsafe package ZIP entry/,
  );
  assert.throws(
    () => assertSafeArchiveEntries(['other-package/file']),
    /Unsafe package ZIP entry/,
  );
});

test('privacy scan rejects source binaries, env files, and absolute paths', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'g5-l4-package-test-'));
  try {
    await writeFile(path.join(root, 'safe.json'), '{"ok":true}\n');
    assert.equal((await scanPackagePrivacy(root)).status, 'pass');
    await writeFile(path.join(root, 'source.swf'), 'legacy');
    await assert.rejects(() => scanPackagePrivacy(root), /Forbidden source/);
    await rm(path.join(root, 'source.swf'));
    await writeFile(path.join(root, '.env.local'), 'SECRET=no');
    await assert.rejects(() => scanPackagePrivacy(root), /environment file/);
    await rm(path.join(root, '.env.local'));
    await mkdir(path.join(root, 'runtime'), {recursive: true});
    await writeFile(
      path.join(root, 'runtime', 'leak.txt'),
      'path=/Volumes/example/private',
    );
    await assert.rejects(() => scanPackagePrivacy(root), /absolute local path/);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
