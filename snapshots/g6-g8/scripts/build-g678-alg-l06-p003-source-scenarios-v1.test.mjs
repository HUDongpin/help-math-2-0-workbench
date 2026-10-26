import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync, rmSync, symlinkSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildP003SourceScenarios} from './build-g678-alg-l06-p003-source-scenarios-v1.mjs';

const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;

test('P003 source-only map covers three domains, full main sequence and both separated embedded runs',
  {skip: !sourceRoot}, () => {
    const report = JSON.parse(buildP003SourceScenarios(sourceRoot));
    assert.deepEqual(report.frameDomains.map(item => [item.id, item.frameCount]),
      [['root', 10], ['sprite-154', 719], ['sprite-158', 1]]);
    const main = report.scenarios[1];
    assert.equal(main.sourcePlacementChangeFrames.length, 259);
    assert.deepEqual(main.windows.map(item => [item.firstFrame, item.lastFrame, item.embeddedAudio]), [
      [1, 40, 'none'], [41, 501, 'run-01'], [502, 519, 'none'],
      [520, 530, 'none'], [531, 543, 'none'], [544, 719, 'run-02'],
    ]);
    assert.deepEqual(main.equation, {text: 'M = $0.50 ∙ C', characterId: 125, placementFrame: 531});
    assert.equal(report.authority.originalRuntimeTraceEstablished, false);
    assert.equal(report.authority.currentJsAdmissionEffect, 'none');
    assert.equal(report.status, 'source-structural-only-not-canonical-scenario-inventory');
  });

test('P003 source scenario generator rejects a compatibility symlink root', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'g678-p003-scenario-root-'));
  try {
    const alias = path.join(directory, 'alias');
    symlinkSync(directory, alias);
    assert.throws(() => buildP003SourceScenarios(alias), /exact source root/);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});
