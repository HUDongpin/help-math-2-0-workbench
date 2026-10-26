import React, {useCallback, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AnimationRuntime} from '../apps/web/components/animation-runtime';
import {createMemoryOnlyLessonHost, type LessonHostRequest} from
  '../packages/demos/src/runtime';
import {G678_ALG_L11_INTERACTIVE10_TRANCHE_C_PAGES} from
  '../packages/demos/src/g678-alg-l11-interactive10-tranche-c-core';
import {createAlgL11AChoiceInstructionalModule} from
  '../packages/demos/src/g678-alg-l11-a-choice-instructional-visuals';
import v008 from '../work/g678-shared-page-factory/g678-alg-l11-tranche-a-vector-bundles-v6/shared-alg001-l11-p008.json';
import v011 from '../work/g678-shared-page-factory/g678-alg-l11-tranche-a-vector-bundles-v6/shared-alg001-l11-p011.json';
import v014 from '../work/g678-shared-page-factory/g678-alg-l11-tranche-a-vector-bundles-v6/shared-alg001-l11-p014.json';
import v019 from '../work/g678-shared-page-factory/g678-alg-l11-tranche-a-vector-bundles-v6/shared-alg001-l11-p019.json';
import v020 from '../work/g678-shared-page-factory/g678-alg-l11-tranche-a-vector-bundles-v6/shared-alg001-l11-p020.json';
import v021 from '../work/g678-shared-page-factory/g678-alg-l11-tranche-a-vector-bundles-v6/shared-alg001-l11-p021.json';
import v025 from '../work/g678-shared-page-factory/g678-alg-l11-tranche-a-vector-bundles-v6/shared-alg001-l11-p025.json';

const vectors = [v008, v011, v014, v019, v020, v021, v025];
const testModules = Object.fromEntries(vectors.map((bundle) => {
  const config = G678_ALG_L11_INTERACTIVE10_TRANCHE_C_PAGES.find((item) =>
    item.animationId === bundle.animationId);
  if (!config || config.sourceContract.kind !== 'choice-feedback-practice') {
    throw new Error('A7 harness source selection drifted');
  }
  return [bundle.animationId, createAlgL11AChoiceInstructionalModule(config, bundle)];
}));
Object.assign(window, {__A7_TEST_MODULES: testModules, __A7_AUDIT: []});
const testWindow = window as typeof window & {
  __A7_CASE: {animationId: string};
  __A7_AUDIT: unknown[];
};

function Harness() {
  const {animationId} = testWindow.__A7_CASE;
  if (!testModules[animationId]) throw new Error('Unknown A7 harness selection');
  const host = useMemo(() => createMemoryOnlyLessonHost({
    releaseId: 'a7-successor-mounted-runtime-test-only',
    releaseMemberIds: Object.keys(testModules), currentAnimationId: animationId,
    enabledCapabilities: ['practice-feedback'], initialLanguage: 'en',
    mode: 'audit', releasePublished: false,
  }), [animationId]);
  const blockRecords = useRef(false);
  const [paused, setPaused] = useState(false);
  const [faultEnabled, setFaultEnabled] = useState(false);
  const [revision, setRevision] = useState(0);
  const [completions, setCompletions] = useState(0);
  const handleRequest = useCallback((request: LessonHostRequest) => {
    // Deliberate test fault: the real host rejects an invalid branch count.
    // Reset requests still pass unchanged through the real host dispatcher.
    const forwarded = blockRecords.current && request.type === 'record-practice-feedback'
      ? {...request, branchCount: 0} : request;
    const decision = host.dispatch(forwarded);
    testWindow.__A7_AUDIT.push({request, forwarded, status: decision.status,
      blocker: decision.status === 'blocked' ? decision.reason : null,
      hostFeedback: host.snapshot().practiceFeedback});
    setRevision((value) => value + 1);
    return decision;
  }, [host]);
  return <main data-test-loader="unregistered-a7-instructional-successor"
    data-product-calibration-passed="false" data-host-revision={revision}
    data-host-feedback-active={String(host.snapshot().practiceFeedback !== null)}
    data-test-completion-count={completions}>
    <header style={{padding: 12, background: '#f2f5fa'}}>
      <p>Mounted runtime component test — no product registration or calibration.</p>
      <button onClick={() => setPaused((value) => !value)} aria-pressed={paused}>Pause test runtime</button>
      <button onClick={() => { blockRecords.current = !blockRecords.current;
        setFaultEnabled(blockRecords.current); }} aria-pressed={faultEnabled}>Reject answer record in real host</button>
      <button onClick={() => handleRequest({type: 'reset-practice-feedback', interactionId: animationId})}>Send allowed host reset</button>
    </header>
    <div style={{width: 800, margin: '0 auto'}}>
      <AnimationRuntime animationId={animationId} moduleKey={animationId}
        query={{lang: 'en', seed: '0'}} audioEnabled={false}
        presentation="legacy-shell" paused={paused}
        onLessonHostRequest={handleRequest}
        onPlaybackComplete={() => setCompletions((value) => value + 1)}
        labels={{replay: 'Replay', reduced: 'Reduced motion active',
          prototype: 'Test candidate', loading: 'Loading test module',
          unavailable: 'Test module unavailable'}}/>
    </div>
  </main>;
}

createRoot(document.getElementById('root')!).render(<Harness/>);
