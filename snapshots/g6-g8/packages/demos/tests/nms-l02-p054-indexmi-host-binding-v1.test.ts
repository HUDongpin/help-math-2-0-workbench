import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';

const audit = JSON.parse(readFileSync(new URL(
  '../../../migrations/shared-nms002-l02-p054/audit/indexmi-host-binding-v1.json',
  import.meta.url), 'utf8'));
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const bound = (path: string, expected: string) => {
  const bytes = readFileSync(path);
  assert.equal(sha(bytes), expected, path);
  return bytes;
};

test('P054 exact host, page, and active lesson XML are byte-bound without acceptance', () => {
  const binding = JSON.parse(bound(audit.hostBinding.path, audit.hostBinding.sha256).toString('utf8'));
  assert.equal(binding.logicalSourcePath, audit.hostBinding.logicalSourcePath);
  const hostBytes = bound(binding.source.path, audit.hostSource.sha256);
  assert.equal(hostBytes.length, audit.hostSource.bytes);
  bound(audit.pageSource.path, audit.pageSource.sha256);
  const lesson = bound(audit.lessonXml.path, audit.lessonXml.sha256).toString('utf8');
  assert.match(lesson, /<Page Title="Game 2"[^>]*>GS\/L2GS03\.swf<\/Page>/);
  assert.equal(audit.authority, 'source-static-host-binding-only');
  assert.equal(audit.disposition, 'exact-host-source-identified-runtime-path-unverified');
  for (const key of ['currentJsRegistered', 'originalRuntimeAccepted',
    'visualFidelityAccepted', 'audioAccepted', 'humanAccepted',
    'ownerAccepted', 'strictComplete', 'published']) assert.equal(audit[key], false, key);
});

test('exact indexMI places the named preloader and animation container on root frame 38', () => {
  const binding = JSON.parse(readFileSync(audit.hostBinding.path, 'utf8'));
  const xml = execFileSync('swfmill', ['-n', 'swf2xml', binding.source.path],
    {maxBuffer: 32 * 1024 * 1024});
  const xpath = 'concat(count(//PlaceObject2[@name="InternalPreloader"]),"|",'
    + 'string(//PlaceObject2[@name="InternalPreloader"]/@objectID),"|",'
    + 'string(//PlaceObject2[@name="InternalPreloader"]/@depth),"|",'
    + 'count(//PlaceObject2[@name="InternalPreloader"]/preceding-sibling::ShowFrame)+1,"|",'
    + 'string(//DefineSprite[@objectID="211"]/@frames),"|",'
    + 'count(//DefineSprite[@objectID="211"]//FrameLabel[@label="jump_check"]/'
    + 'preceding-sibling::ShowFrame)+1,"|",'
    + 'string(//PlaceObject2[@name="animation_mc"]/@objectID),"|",'
    + 'count(//PlaceObject2[@name="animation_mc"]/preceding-sibling::ShowFrame)+1)';
  const witness = execFileSync('xmllint', ['--nonet', '--xpath', xpath, '-'],
    {input: xml, maxBuffer: 1024 * 1024}).toString().trim();
  assert.equal(witness, '1|211|53|38|3|2|204|38');
  assert.deepEqual(audit.swfmillWitness.internalPreloader,
    {name: 'InternalPreloader', objectId: 211, depth: 53,
      frameCount: 3, jumpCheckLabelFrame: 2});
});

test('source scripts bind the loading handshake and conditional host observer', () => {
  const binding = JSON.parse(readFileSync(audit.hostBinding.path, 'utf8'));
  const extractionRoot = dirname(binding.sourceExtraction.path);
  const script = (key: string) => {
    const item = audit.hostScriptWitnesses[key];
    return bound(join(extractionRoot, item.relativeToExtraction), item.sha256).toString('utf8');
  };
  assert.match(script('nmsCourseGallery'), /case "HELP_COURSES\/NMS002\/NMS002\.jpg"/);
  assert.match(script('preloaderFrame2'), /_root\.animation_mc\.gotoAndPlay\("begin"\)/);
  const functions = script('hostFunctions');
  assert.match(functions, /_loc1_\.animation_mc\.loadMovie\(_loc2_\.playSwfFileName,1\)/);
  assert.match(functions, /function doCheckPrevAndNext\(\)/);
  assert.match(functions, /_global\.Play == true && _global\.CompClick == "" && _global\.quizSection == false/);
  assert.match(functions, /_root\.animation_mc\.animation\.stop\(\)/);
  assert.match(script('pageObserver'), /_root\.doCheckPrevAndNext\(\)/);
  const pageRoot1 = bound(join(audit.pageSource.scriptsRoot, 'frame_1/DoAction.as'),
    audit.pageSource.rootFrame1ActionSha256).toString('utf8');
  assert.match(pageRoot1, /_level0\.InternalPreloader\.gotoAndPlay\("jump_check"\)/);
  const pageRoot6 = bound(join(audit.pageSource.scriptsRoot, 'frame_6/DoAction.as'),
    audit.pageSource.rootFrame6ActionSha256).toString('utf8');
  assert.equal(pageRoot6.trim(), 'stop();');
});

test('page root 7-10 is a static hold, while sixth-match nextFrame is local to feedback', () => {
  const xml = execFileSync('swfmill', ['-n', 'swf2xml', audit.pageSource.path],
    {maxBuffer: 64 * 1024 * 1024});
  const xpath = 'concat(count(/swf/Header/tags/ShowFrame),"|",'
    + 'count(/swf/Header/tags/*[count(preceding-sibling::ShowFrame)=5 '
    + 'and self::PlaceObject2[@objectID="731"]]),"|",'
    + 'count(/swf/Header/tags/*[count(preceding-sibling::ShowFrame)>=6 '
    + 'and count(preceding-sibling::ShowFrame)<10 and self::ShowFrame]),"|",'
    + 'count(/swf/Header/tags/*[count(preceding-sibling::ShowFrame)>=6 '
    + 'and count(preceding-sibling::ShowFrame)<10 and not(self::ShowFrame)]))';
  const witness = execFileSync('xmllint', ['--nonet', '--xpath', xpath, '-'],
    {input: xml, maxBuffer: 1024 * 1024}).toString().trim();
  assert.equal(witness, '10|1|4|0');
  assert.deepEqual(audit.swfmillWitness.pageRootTail,
    {gameSpriteObjectId: 731, gameSpritePlacementFrame: 6,
      showFramesAfterPlacement: 4, nonShowFrameTagsAfterPlacement: 0});
  const feedback = bound(join(audit.pageSource.scriptsRoot,
    'DefineSprite_194/frame_27/DoAction.as'),
    audit.pageSource.feedbackSprite194Frame27ActionSha256).toString('utf8');
  assert.match(feedback, /_global\.quizSection = false;\s*nextFrame\(\);/);
});
