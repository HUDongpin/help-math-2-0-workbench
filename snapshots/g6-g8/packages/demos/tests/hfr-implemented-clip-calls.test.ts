import assert from 'node:assert/strict';
import test from 'node:test';
import {ASFunction} from '../src/hfr/avm';
import {Runtime} from '../src/hfr/display';
import type {PageData} from '../src/hfr/types';

function page(): PageData {
  return {
    schema: 'hfr-page/1',
    compiler: 'implemented-call-fixture',
    placement: {animationId: 'shared-dat001-l02-p008', module: 'DAT001', course: 'fixture', lesson: 2, lessonTitle: 'fixture', sectionCode: 'IN', ordinal: 8},
    source: {path: 'fixture.swf', sha256: 'a'.repeat(64), bytes: 0, swfVersion: 6},
    stage: {width: 800, height: 600, fps: 12, background: [255, 255, 255]},
    module: 'fixture.js',
    dictionary: {},
    root: {frameCount: 1, labels: {}, frames: [[]]},
    exports: {},
    streams: [],
    stats: {scripts: 0, codeBodies: 0, fallbackBodies: 0, characters: 0, mediaFiles: 0},
  };
}

test('absent receivers of implemented clip methods are not recorded as missing', () => {
  const rt = new Runtime(page());
  assert.equal(rt.callMethod(undefined, 'gotoAndStop', [1], null), undefined);
  assert.equal(rt.callMethod(null, 'removeMovieClip', [], null), undefined);
  assert.equal(rt.callMethod(undefined, 'notARealMethod', [], null), undefined);
  assert.equal(rt.missing.content.get('gotoAndStop'), undefined);
  assert.equal(rt.missing.content.get('removeMovieClip'), undefined);
  assert.equal(rt.missing.content.get('notARealMethod'), 1);
});

test('enableButton is a shell function on the loaded page and the course shell', () => {
  const rt = new Runtime(page());
  const calls: string[] = [];
  rt.hostCb = (call) => {calls.push(call.kind);};
  rt.loadPage();
  assert.ok(rt.page_.get('enableButton') instanceof ASFunction);
  assert.ok(rt.shell.get('enableButton') instanceof ASFunction);
  rt.callMethod(rt.page_, 'enableButton', [], null);
  rt.callMethod(rt.shell, 'enableButton', [], null);
  assert.equal(rt.missing.content.get('enableButton'), undefined);
  assert.deepEqual(calls, ['shell.enableButton', 'shell.enableButton']);
});
