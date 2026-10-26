import assert from 'node:assert/strict';
import {chmod, mkdir, mkdtemp, readFile, realpath, rm, writeFile} from
  'node:fs/promises';
import test from 'node:test';
import {tmpdir} from 'node:os';
import path from 'node:path';

import {
  auditG678AlgL11ResidualRouting,
  deriveFinalAssessmentAudioHostCalls,
} from
  './audit-g678-alg-l11-residual-routing.mjs';

const SOURCE_ROOT =
  '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ARTIFACT = new URL(
  '../catalog/g678-alg-l11-residual-routing-audit-v1.json', import.meta.url);

test('ALG001 L11 residual audit checks exact source-bound artifact', async () => {
  process.env.HELP_MATH_G678_SOURCE_ROOT = SOURCE_ROOT;
  const result = await auditG678AlgL11ResidualRouting({check: true});
  assert.equal(result.auditedResidualPlacementCount, 35);
  assert.equal(result.familyCount, 10);
  assert.equal(result.registrationCandidatePlacementCount, 0);
  assert.equal(result.productCalibrationPassed, false);
  assert.ok(Object.values(result.acceptanceEffects).every((value) =>
    value === false));
});

test('ALG001 L11 routing partitions 35 pages once and leaves every gate closed', async () => {
  const artifact = JSON.parse(await readFile(ARTIFACT, 'utf8'));
  assert.equal(artifact.lessonActivePageCount, 44);
  assert.equal(artifact.predecessorRegisteredPageCount, 9);
  assert.equal(artifact.auditedResidualPlacementCount, 35);
  assert.equal(new Set(artifact.residualPlacementIds).size, 35);
  assert.deepEqual(artifact.members.map((member) => member.animationId),
    artifact.residualPlacementIds);
  assert.equal(Object.values(artifact.familyCounts).reduce((sum, count) =>
    sum + count, 0), 35);
  assert.equal(artifact.swfmillCleanMemberCount, 25);
  assert.equal(artifact.swfmillWarningMemberCount, 10);
  assert.equal(artifact.pageAudioPhysicalIdentityVerifiedCount, 32);
  assert.equal(artifact.groupedFinalAssessmentAudio
    .physicalReadOnlyIdentityVerifiedCount, 120);
  for (const member of artifact.members) {
    assert.equal(member.registrationCandidate, false);
    assert.equal(member.productCalibrationPassed, false);
    assert.equal(member.wholeLessonEngineeringPreviewReady, false);
    assert.equal(member.routing.reuseAuthorized, false);
    assert.equal(member.routing.familyCalibrationPassed, false);
    assert.ok(member.routing.p1Blockers.length >= 4);
    assert.ok(Object.values(member.acceptanceEffects).every((value) =>
      value === false));
  }
  assert.equal(artifact.registrationCandidatePlacementCount, 0);
  assert.equal(artifact.currentJavaScriptRegisteredPlacementCount, 0);
  assert.equal(artifact.productCalibrationPassed, false);
  assert.equal(artifact.wholeLessonEngineeringPreviewReady, false);
  assert.equal(artifact.scaleOutAuthorized, false);
  assert.ok(Object.values(artifact.acceptanceEffects).every((value) =>
    value === false));
  assert.equal(artifact.inputs.sourceLessonXml.externalAbsolutePath,
    `${SOURCE_ROOT}/G6-G8-shared/ALG001/L11/index.xml`);
  assert.equal(artifact.inputs.sourceLessonXml.sha256,
    '329feea5eafa57e0824cbbf03f956c9df2df83c85be81a384f70f34908ab3896');
  assert.equal(artifact.inputs.sourceLessonXml
    .physicalReadOnlyOrdinarySingleLinkVerified, true);
  assert.deepEqual(artifact.groupedFinalAssessmentAudio.hostCallsObserved,
    ['doPlayFQAnswerAudio', 'doPlayFQQuestionAudio']);
  assert.equal(artifact.groupedFinalAssessmentAudio.hostCallsEvidence
    .animationId, 'shared-alg001-l11-p044');
});

test('external Lesson XML corruption fails before residual source use', async () => {
  const temporaryRoot = await realpath(await mkdtemp(path.join(tmpdir(),
    'g678-alg-l11-corrupt-xml-')));
  const sharedRoot = path.join(temporaryRoot, 'G6-G8-shared');
  const lessonRoot = path.join(sharedRoot, 'ALG001', 'L11');
  const xmlPath = path.join(lessonRoot, 'index.xml');
  await mkdir(lessonRoot, {recursive: true});
  await writeFile(xmlPath, Buffer.from('<Lesson corrupted="true"/>\n'),
    {flag: 'wx', mode: 0o444});
  await chmod(xmlPath, 0o444);
  await chmod(sharedRoot, 0o555);
  await chmod(temporaryRoot, 0o555);
  const previous = process.env.HELP_MATH_G678_SOURCE_ROOT;
  process.env.HELP_MATH_G678_SOURCE_ROOT = temporaryRoot;
  try {
    await assert.rejects(
      auditG678AlgL11ResidualRouting({check: true}),
      /external source Lesson XML physical identity drifted/u,
    );
  } finally {
    if (previous === undefined) {
      delete process.env.HELP_MATH_G678_SOURCE_ROOT;
    } else process.env.HELP_MATH_G678_SOURCE_ROOT = previous;
    await chmod(sharedRoot, 0o755);
    await chmod(temporaryRoot, 0o755);
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});

test('grouped FQ audio host calls are exact extracted-source values', () => {
  assert.deepEqual([...deriveFinalAssessmentAudioHostCalls([
    'doGetRandomQuiz', 'doPlayFQAnswerAudio',
    'doPlayFQQuestionAudio', 'setBookMark',
  ])], ['doPlayFQAnswerAudio', 'doPlayFQQuestionAudio']);
  assert.throws(() => deriveFinalAssessmentAudioHostCalls([
    'doPlayFQQuestionAudio',
  ]), /audio host-call contract drifted/u);
  assert.throws(() => deriveFinalAssessmentAudioHostCalls([
    'doPlayFQAnswerAudio', 'doPlayFQQuestionAudio',
    'doPlayFQUnexpectedAudio',
  ]), /audio host-call contract drifted/u);
});
