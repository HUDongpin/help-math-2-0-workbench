/** P053 AVM1 Start/level actions only; no host navigation or product renderer. */
export type P053Level = 1 | 2;
export type P053StartSite = 'early-frame-1' | 'select-level-frame-693';
export type P053PopupVisibility = boolean | 'unresolved-after-close';

export type P053ControllerState = Readonly<{
  startSite: P053StartSite;
  selectedLevel: P053Level | null;
  startGameFlag: true | 'unobserved';
  inlineMessage: string | null;
  levelMessageVisible: boolean;
  directionsPopupVisible: P053PopupVisibility;
  controlsEnabled: boolean;
}>;

export type P053RepeatIntent = Readonly<{
  operation: 'gotoAndPlay' | 'gotoAndStop';
  label: 'RepeatDirection' | 'SelectLevel';
  hostExecution: 'not-observed';
}>;

export type P053StartIntent = Readonly<{
  requestedBasename: 'L7GS03' | 'L2GS03';
  framePlay: 1;
  tempSection?: 6;
  selectedLevel: P053Level;
  startSite: P053StartSite;
  hostExecution: 'not-observed';
}>;

function assertP053State(state: P053ControllerState): void {
  if ((state.startSite !== 'early-frame-1' &&
       state.startSite !== 'select-level-frame-693') ||
      (state.selectedLevel !== null && state.selectedLevel !== 1 &&
       state.selectedLevel !== 2) ||
      typeof state.levelMessageVisible !== 'boolean' ||
      (typeof state.directionsPopupVisible !== 'boolean' &&
       state.directionsPopupVisible !== 'unresolved-after-close') ||
      typeof state.controlsEnabled !== 'boolean' ||
      (state.directionsPopupVisible === true && state.controlsEnabled) ||
      (state.directionsPopupVisible === 'unresolved-after-close' &&
       !state.controlsEnabled)) {
    throw new Error('Invalid P053 source state');
  }
}

export function initialP053ControllerState(): P053ControllerState {
  return {
    startSite: 'early-frame-1', selectedLevel: null,
    startGameFlag: 'unobserved', inlineMessage: null,
    levelMessageVisible: false, directionsPopupVisible: false,
    controlsEnabled: true,
  };
}

/** Explicit source-label entry; this function does not advance the playhead. */
export function enterP053SelectLevel(state: P053ControllerState): P053ControllerState {
  assertP053State(state);
  if (state.directionsPopupVisible === true) {
    throw new Error('P053 SelectLevel unavailable while directions popup is open');
  }
  return {...state, startSite: 'select-level-frame-693',
    directionsPopupVisible: false};
}

export function selectP053Level(
  state: P053ControllerState, level: P053Level,
): P053ControllerState {
  assertP053State(state);
  if (level !== 1 && level !== 2) throw new Error('Invalid P053 source level');
  if (!state.controlsEnabled) throw new Error('P053 controls disabled by directions popup');
  // Each AVM1 level handler sets one global flag and clears the other. It
  // does not clear an earlier inline message or the popup.
  return {...state, selectedLevel: level};
}

/** Source repeat actions request labels; they do not establish playback timing. */
export function repeatP053Directions(state: P053ControllerState): P053RepeatIntent {
  assertP053State(state);
  if (!state.controlsEnabled) throw new Error('P053 controls disabled by directions popup');
  return state.startSite === 'early-frame-1'
    ? {operation: 'gotoAndPlay', label: 'RepeatDirection',
        hostExecution: 'not-observed'}
    : {operation: 'gotoAndStop', label: 'SelectLevel',
        hostExecution: 'not-observed'};
}

/** Frame-693 Skip disables four controls and shows Mc_Popup, not Mc_Msg. */
export function skipP053Directions(state: P053ControllerState): P053ControllerState {
  assertP053State(state);
  if (state.startSite !== 'select-level-frame-693' || !state.controlsEnabled ||
      state.directionsPopupVisible !== false) {
    throw new Error('P053 Skip unavailable outside SelectLevel');
  }
  return {...state, controlsEnabled: false, directionsPopupVisible: true};
}

/** CloseBtn re-enables controls, then hides `this`; the receiver needs runtime proof. */
export function closeP053Directions(state: P053ControllerState): P053ControllerState {
  assertP053State(state);
  if (!state.directionsPopupVisible || state.controlsEnabled) {
    throw new Error('P053 directions popup is not open');
  }
  return {...state, controlsEnabled: true,
    directionsPopupVisible: 'unresolved-after-close'};
}

/** The late Start button's rollOut hides only Mc_Msg. */
export function rollOutP053Start(state: P053ControllerState): P053ControllerState {
  assertP053State(state);
  if (state.startSite !== 'select-level-frame-693') {
    throw new Error('P053 late Start rollOut unavailable');
  }
  return {...state, levelMessageVisible: false};
}

export function startP053(
  state: P053ControllerState,
): Readonly<{state: P053ControllerState; intent: P053StartIntent | null}> {
  assertP053State(state);
  if (!state.controlsEnabled) throw new Error('P053 controls disabled by directions popup');
  if (state.selectedLevel === null) {
    return {
      state: state.startSite === 'early-frame-1'
        ? {...state, inlineMessage: 'Please select the Level then Click Start'}
        : {...state, levelMessageVisible: true},
      intent: null,
    };
  }
  const intent: P053StartIntent = state.startSite === 'early-frame-1'
    ? {requestedBasename: 'L7GS03', framePlay: 1,
        selectedLevel: state.selectedLevel, startSite: state.startSite,
        hostExecution: 'not-observed'}
    : {requestedBasename: 'L2GS03', framePlay: 1, tempSection: 6,
        selectedLevel: state.selectedLevel, startSite: state.startSite,
        hostExecution: 'not-observed'};
  return {state: {...state, startGameFlag: true}, intent};
}
