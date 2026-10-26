import React, {useCallback, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AnimationRuntime} from '../apps/web/components/animation-runtime';
import {createMemoryOnlyLessonHost, type LessonHostRequest} from '../packages/demos/src/runtime';
import {G678_NMS_L01_P042_READABLE_COMPANION_CANDIDATE_MODULE as MODULE} from '../packages/demos/src/g678-nms-l01-p042-readable-companion-candidate';
const ID = 'shared-nms002-l01-p042', SUFFIX = 'nms-l01-p042-readable-companion';
Object.assign(window, {__P042_READABLE_MODULES: {[ID]: MODULE}});
function Mount({name}: {name: 'primary' | 'reference'}) {
  const [paused, setPaused] = useState(true), [epoch, setEpoch] = useState(0), [mode, setMode] = useState('valid');
  const [provided, setProvided] = useState(true), [column, setColumn] = useState(true), [inert, setInert] = useState(false);
  const [completions, setCompletions] = useState(0), [requests, setRequests] = useState(0);
  const targetId = `${name}-${SUFFIX}`;
  const host = useMemo(() => createMemoryOnlyLessonHost({releaseId: 'p042-readable-isolated-only', releaseMemberIds: [ID],
    currentAnimationId: ID, enabledCapabilities: [], mode: 'audit', releasePublished: false}), [epoch]);
  const request = useCallback((message: LessonHostRequest) => {setRequests(value => value + 1); return host.dispatch(message);}, [host]);
  const target = mode === 'missing' ? null : mode === 'button'
    ? <button id={targetId} data-page-interaction-companion-host="true">Deliberately invalid target element</button>
    : <div id={mode === 'wrong-id' ? `${targetId}-wrong` : targetId} data-page-interaction-companion-host={mode === 'unmarked' ? undefined : 'true'}/>;
  return <article data-readable-mount={name} data-completions={completions} data-host-requests={requests} data-fixture-epoch={epoch}>
    <h2>{name} isolated runtime</h2>
    {name === 'primary' ? <div data-fixture-controls="true">
      <button data-fixture-pause="true" aria-pressed={paused} onClick={() => setPaused(value => !value)}>Pause fixture runtime</button>
      <label>Target mode <select data-fixture-target-mode="true" value={mode} onChange={event => setMode(event.target.value)}>
        {['valid', 'unmarked', 'button', 'duplicate', 'outside', 'missing', 'wrong-id'].map(value => <option key={value}>{value}</option>)}
      </select></label>
      <button data-fixture-id="true" aria-pressed={provided} onClick={() => setProvided(value => !value)}>Toggle supplied target ID</button>
      <button data-fixture-column="true" aria-pressed={column} onClick={() => setColumn(value => !value)}>Toggle owning learning column</button>
      <button data-fixture-modal="true" aria-pressed={inert} onClick={() => setInert(value => !value)}>Toggle modal containment</button>
      <button data-fixture-remount="true" onClick={() => {setCompletions(0); setEpoch(value => value + 1);}}>Remount primary runtime</button>
    </div> : null}
    <div className={column ? 'lesson-shell2__learning-column' : undefined} data-fixture-column-element="true" inert={inert || undefined} aria-hidden={inert || undefined}>
      <AnimationRuntime key={epoch} animationId={ID} moduleKey={ID} query={{lang: 'en', seed: '0'}} presentation="workbench"
        paused={paused} audioEnabled={false} pageInteractionCompanionTargetId={provided ? targetId : undefined}
        onLessonHostRequest={request} onPlaybackComplete={() => setCompletions(value => value + 1)}
        labels={{replay: 'Replay runtime', reduced: 'Reduced motion: terminal source frame', prototype: 'UNREGISTERED READABLE CANDIDATE', loading: 'Loading local candidate', unavailable: 'Candidate unavailable'}}/>
      {mode !== 'outside' ? target : null}
      {mode === 'duplicate' ? <div id={targetId} data-page-interaction-companion-host="true"/> : null}
    </div>
    {mode === 'outside' ? target : null}
  </article>;
}
createRoot(document.getElementById('root')!).render(<main data-test-loader="p042-readable-unregistered-only" data-not-my-lesson="true" data-not-registered="true">
  <h1>Isolated p042 readable-companion fixture</h1><p>Not registered Current-JS or MyLesson. No source audio or acceptance.</p>
  <Mount name="primary"/><Mount name="reference"/>
</main>);
