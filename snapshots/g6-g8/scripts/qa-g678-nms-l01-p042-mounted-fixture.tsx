import React, {useCallback, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AnimationRuntime} from '../apps/web/components/animation-runtime';
import {createMemoryOnlyLessonHost, type LessonHostRequest} from '../packages/demos/src/runtime';
import {G678_NMS_L01_P042_CANDIDATE_MODULE} from '../packages/demos/src/g678-nms-l01-p042-candidate';

const ID = 'shared-nms002-l01-p042';
Object.assign(window, {__P042_MOUNTED_MODULES: {[ID]: G678_NMS_L01_P042_CANDIDATE_MODULE}});
function Instance({name}: {name: 'primary' | 'reference'}) {
  const [paused, setPaused] = useState(true), [completions, setCompletions] = useState(0), [requests, setRequests] = useState(0);
  const host = useMemo(() => createMemoryOnlyLessonHost({releaseId: 'p042-unregistered-mounted-fixture',
    releaseMemberIds: [ID], currentAnimationId: ID, enabledCapabilities: [], mode: 'audit', releasePublished: false}), []);
  const request = useCallback((message: LessonHostRequest) => {setRequests(value => value + 1); return host.dispatch(message);}, [host]);
  return <section data-mounted-instance={name} data-completions={completions} data-host-request-count={requests}>
    <h2>{name === 'primary' ? 'Primary candidate runtime' : 'Second independent mount — paused reference'}</h2>
    {name === 'primary' ? <button data-test-pause="true" aria-pressed={paused} onClick={() => setPaused(value => !value)}>Pause mounted runtime</button> : null}
    <AnimationRuntime animationId={ID} moduleKey={ID} query={{lang: 'en', seed: '0'}} presentation="workbench"
      paused={paused} audioEnabled={false} onLessonHostRequest={request} onPlaybackComplete={() => setCompletions(value => value + 1)}
      labels={{replay: 'Replay runtime', reduced: 'Reduced motion: source terminal visual', prototype: 'UNREGISTERED TEST CANDIDATE', loading: 'Loading local candidate', unavailable: 'Candidate unavailable'}}/>
  </section>;
}
function Fixture() {
  return <main data-test-loader="nms-l01-p042-unregistered-mounted-only" data-not-registered="true" data-not-my-lesson="true">
    <h1>Isolated p042 mounted-runtime fixture</h1>
    <p>This is not registered Current-JS, not MyLesson, and not product or human acceptance. Original source audio is not integrated.</p>
    <Instance name="primary"/><Instance name="reference"/>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
