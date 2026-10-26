import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

import {
  closeP053Directions, enterP053SelectLevel, initialP053ControllerState,
  repeatP053Directions, rollOutP053Start, selectP053Level,
  skipP053Directions, startP053, type P053Level,
} from '../src/nms-l02-p053-controller-candidate';

const hostResolutionBytes = readFileSync(new URL(
  '../../../migrations/shared-nms002-l02-p053/audit/host-navigation-resolution-v1.json',
  import.meta.url,
));
const hostResolution = JSON.parse(hostResolutionBytes.toString()) as {
  p053Actions: {
    earlyStart: {sha256: string; requestedBasename: string};
    selectLevelStart: {sha256: string; requestedBasename: string};
  };
};

test('both Start sites retain the exact frozen source action identities', () => {
  assert.equal(createHash('sha256').update(hostResolutionBytes).digest('hex'),
    '4082197b15ee072fcbbbff594c5a92ceaf19c039964fa3d8cd58cb83a3536332');
  assert.deepEqual(hostResolution.p053Actions.earlyStart,
    {relativePath: 'DefineSprite_187/frame_1/PlaceObject2_136_24/CLIPACTIONRECORD on(release).as',
      sha256: 'd4de1288cfac868acd5a131b57047afecca7084a78792afca69d81f5378dccde',
      requestedBasename: 'L7GS03', matchesCurrentGsSection: false});
  assert.equal(hostResolution.p053Actions.selectLevelStart.requestedBasename, 'L2GS03');
  assert.equal(hostResolution.p053Actions.selectLevelStart.sha256,
    '73e3330ff7d670fc88f8e574c4aaa34b490d978e690ab2fe3e6aed7500ab2102');
});

test('fresh early Start without a level writes only its inline warning', () => {
  const initial = initialP053ControllerState();
  const result = startP053(initial);
  assert.equal(result.intent, null);
  assert.equal(result.state.inlineMessage, 'Please select the Level then Click Start');
  assert.equal(result.state.levelMessageVisible, false);
  assert.equal(result.state.directionsPopupVisible, false);
  assert.equal(result.state.startGameFlag, 'unobserved');
});

test('level selection is exclusive and early Start keeps L7GS03 unresolved', () => {
  let state = selectP053Level(initialP053ControllerState(), 1);
  state = selectP053Level(state, 2);
  assert.equal(state.selectedLevel, 2);
  const result = startP053(state);
  assert.equal(result.state.startGameFlag, true);
  assert.deepEqual(result.intent, {
    requestedBasename: 'L7GS03', framePlay: 1, selectedLevel: 2,
    startSite: 'early-frame-1', hostExecution: 'not-observed',
  });
  assert.equal('pageId' in result.intent!, false);
});

test('late source-label entry preserves selection and uses distinct warning/target', () => {
  let state = enterP053SelectLevel(initialP053ControllerState());
  const warning = startP053(state);
  assert.equal(warning.intent, null);
  assert.equal(warning.state.levelMessageVisible, true);
  assert.equal(warning.state.directionsPopupVisible, false);
  assert.equal(warning.state.inlineMessage, null);
  state = selectP053Level(warning.state, 1);
  assert.equal(state.levelMessageVisible, true,
    'level handler does not hide Mc_Msg');
  const result = startP053(state);
  assert.deepEqual(result.intent, {
    requestedBasename: 'L2GS03', framePlay: 1, tempSection: 6,
    selectedLevel: 1, startSite: 'select-level-frame-693',
    hostExecution: 'not-observed',
  });
  assert.equal(enterP053SelectLevel(selectP053Level(initialP053ControllerState(), 2))
    .selectedLevel, 2);
});

test('Repeat requests the two distinct source labels without inventing elapsed frames', () => {
  const early = initialP053ControllerState();
  assert.deepEqual(repeatP053Directions(early), {
    operation: 'gotoAndPlay', label: 'RepeatDirection',
    hostExecution: 'not-observed',
  });
  const late = enterP053SelectLevel(early);
  assert.deepEqual(repeatP053Directions(late), {
    operation: 'gotoAndStop', label: 'SelectLevel',
    hostExecution: 'not-observed',
  });
  assert.equal(late.startSite, 'select-level-frame-693');
});

test('Skip and Close restore controls but do not invent whole-popup hiding', () => {
  const late = enterP053SelectLevel(initialP053ControllerState());
  const warning = startP053(late).state;
  const selected = selectP053Level(warning, 2);
  const skipped = skipP053Directions(selected);
  assert.equal(skipped.levelMessageVisible, true);
  assert.equal(skipped.directionsPopupVisible, true);
  assert.equal(skipped.controlsEnabled, false);
  assert.equal(skipped.selectedLevel, 2);
  assert.throws(() => selectP053Level(skipped, 1), /controls disabled/u);
  assert.throws(() => startP053(skipped), /controls disabled/u);
  assert.throws(() => repeatP053Directions(skipped), /controls disabled/u);
  const closed = closeP053Directions(skipped);
  assert.equal(closed.directionsPopupVisible, 'unresolved-after-close');
  assert.equal(closed.controlsEnabled, true);
  assert.equal(closed.levelMessageVisible, true);
  assert.equal(closed.selectedLevel, 2);
  assert.throws(() => skipP053Directions(closed), /Skip unavailable/u);
  assert.equal(enterP053SelectLevel(closed).directionsPopupVisible, false,
    'source SelectLevel entry explicitly hides Mc_Popup');
  assert.equal(rollOutP053Start(closed).levelMessageVisible, false);
});

test('direction controls reject foreign phases and impossible popup combinations', () => {
  const early = initialP053ControllerState();
  assert.throws(() => skipP053Directions(early), /Skip unavailable/u);
  assert.throws(() => closeP053Directions(early), /not open/u);
  assert.throws(() => rollOutP053Start(early), /rollOut unavailable/u);
  assert.throws(() => startP053({...early,
    directionsPopupVisible: true}), /Invalid P053 source state/u);
  assert.throws(() => enterP053SelectLevel(skipP053Directions(
    enterP053SelectLevel(early))), /popup is open/u);
});

test('invalid level fails closed', () => {
  assert.throws(() => selectP053Level(initialP053ControllerState(), 3 as P053Level));
  assert.throws(() => startP053({...initialP053ControllerState(),
    startSite: 'foreign' as never}));
  assert.throws(() => startP053({...initialP053ControllerState(),
    selectedLevel: 3 as P053Level}));
});
