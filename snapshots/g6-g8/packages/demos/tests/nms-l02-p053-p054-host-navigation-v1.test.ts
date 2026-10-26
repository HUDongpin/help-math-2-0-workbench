import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';

const audit = JSON.parse(readFileSync(new URL(
  '../../../migrations/shared-nms002-l02-p053/audit/host-navigation-resolution-v1.json',
  import.meta.url), 'utf8'));
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const bound = (path: string, expected: string) => {
  const bytes = readFileSync(path);
  assert.equal(sha(bytes), expected, path);
  return bytes;
};

test('host and lesson entry are exact-source-bound, not a runtime capture', () => {
  const binding = JSON.parse(bound(audit.hostBinding.path,
    audit.hostBinding.sha256).toString('utf8'));
  assert.equal(binding.logicalSourcePath, 'NewHelpProgram/HELP_COURSES/indexMI.swf');
  bound(binding.source.path, binding.source.sha256);
  const root = dirname(binding.sourceExtraction.path);
  const initial = audit.hostScripts.initialXmlLoad;
  const script = bound(join(root, initial.relativeToExtraction),
    initial.sha256).toString('utf8');
  assert.match(script, /_global\.ServerRoot = _root\.ServerRoot;/);
  assert.match(script, /F_X\.load\(_root\.XML_URL\);/);

  bound(audit.lessonXml.path, audit.lessonXml.sha256);
  for (const source of audit.verifiedSources) bound(source.path, source.sha256);
  assert.equal(audit.authority, 'source-static-navigation-resolution-only');
  assert.equal(audit.dependencyClosureComplete, false);
  assert.equal(audit.unresolvedRuntimeInputs.length, 5);
  for (const gate of ['originalRuntimeAccepted', 'currentJsRegistered',
    'strictComplete', 'published']) assert.equal(audit[gate], false, gate);
});

test('current L2 GS section resolves late Start but not the early L7 basename', () => {
  const xpath = 'concat(normalize-space(string(/Lesson/PageRoot)),"|",'
    + 'count(/Lesson/Section[@SName="GS"]/Page),"|",'
    + 'normalize-space(string(/Lesson/Section[@SName="GS"]/Page[1])),"|",'
    + 'normalize-space(string(/Lesson/Section[@SName="GS"]/Page[2])),"|",'
    + 'normalize-space(string(/Lesson/Section[@SName="TS"]/Page[1])))';
  const result = execFileSync('xmllint', ['--nonet', '--xpath', xpath,
    audit.lessonXml.path]).toString().trim();
  assert.equal(result, [audit.lessonXml.pageRoot, '2',
    ...audit.lessonXml.gsPagesInOrder,
    audit.lessonXml.nextSectionFirstPage].join('|'));
  assert.equal(audit.lessonXml.candidateXmlUrlLogicalPath,
    `${audit.lessonXml.pageRoot}/index.xml`);

  const basenames = audit.lessonXml.gsPagesInOrder.map((path: string) =>
    path.split('/').at(-1)?.replace(/\.swf$/, ''));
  for (const key of ['earlyStart', 'selectLevelStart']) {
    const action = audit.p053Actions[key];
    const script = bound(join(audit.p053Actions.scriptsRoot,
      action.relativePath), action.sha256).toString('utf8');
    assert.ok(script.includes(`doNeedMoreHelp("${action.requestedBasename}"`));
    assert.equal(basenames.includes(action.requestedBasename),
      action.matchesCurrentGsSection);
  }
  assert.equal(basenames.includes('L7GS03'), false);
  assert.equal(audit.verifiedSources.find((row: {role: string}) =>
    row.role === 'same-basename-outside-current-lesson').sha256,
  'ae16db51336cfc39f0e345c4de5e2bd6d1659fed205ad54e7783e25e1ba551c7');
});

test('host lookup retains current path on a miss and loads the matched path', () => {
  const binding = JSON.parse(readFileSync(audit.hostBinding.path, 'utf8'));
  const root = dirname(binding.sourceExtraction.path);
  const navigation = audit.hostScripts.navigationFunctions;
  const script = bound(join(root, navigation.relativeToExtraction),
    navigation.sha256).toString('utf8');
  const lookup = script.split('function doNeedMoreHelp(')[1]
    ?.split('function doCheckPrevAndNext(')[0];
  assert.ok(lookup, 'host lookup function exists');
  assert.match(lookup, /arrayTotalSectionDetails\[_loc1_\.sectionNumber\]/);
  assert.match(lookup, /if\(mcName == _loc2_\)[\s\S]*?_loc1_\.playSwfFileName = _loc1_\.MainFilePath \+ tempArrGetSwf\[i\]/);
  assert.equal((lookup.match(/playSwfFileName =/g) || []).length, 1);
  assert.equal((lookup.match(/tempSection/g) || []).length, 1);
  assert.equal((lookup.match(/framePlay/g) || []).length, 1);
  assert.match(lookup, /_root\.doCreateSlide\(\);\s*_root\.loadSWFMovie\(\);/);
  const createSlide = script.split('function doCreateSlide()')[1]
    ?.split('function doPlayPreviousMovie()')[0];
  assert.ok(createSlide);
  assert.doesNotMatch(createSlide, /playSwfFileName/);
  assert.match(script, /_loc1_\.animation_mc\.loadMovie\(_loc2_\.playSwfFileName,1\)/);
});
