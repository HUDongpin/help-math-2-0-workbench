import React, {useCallback, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AnimationRuntime} from '../apps/web/components/animation-runtime';
import {createMemoryOnlyLessonHost, type LessonHostRequest} from '../packages/demos/src/runtime';
import {transitionDescriptorGlossaryPause, type DescriptorGlossaryPauseSession} from '../apps/web/lib/descriptor-driven-glossary-pause';
import {createAlgL11ASpecialInstructionalVisualCandidate, type AlgL11ASpecialVisualConfig} from '../packages/demos/src/g678-alg-l11-a-special-instructional-visuals';
import type {AlgL11ASourceVectorBundle} from '../packages/demos/src/g678-alg-l11-tranche-a-source-vector-stage';

const testWindow = window as typeof window & {
  __SPECIAL_CASE: {config: AlgL11ASpecialVisualConfig; bundle: AlgL11ASourceVectorBundle};
  __SPECIAL_MODULES: Record<string, unknown>; __SPECIAL_AUDIT: unknown[];
};
const {config, bundle} = testWindow.__SPECIAL_CASE;
const candidate = createAlgL11ASpecialInstructionalVisualCandidate(config, bundle);
testWindow.__SPECIAL_MODULES = {[config.animationId]: candidate.module};
testWindow.__SPECIAL_AUDIT = [];

function Harness() {
  const host = useMemo(() => createMemoryOnlyLessonHost({releaseId: 'special3-mounted-test-only',
    releaseMemberIds: [config.animationId], currentAnimationId: config.animationId,
    enabledCapabilities: ['practice-feedback', 'glossary', 'language'], initialLanguage: 'en',
    mode: 'audit', releasePublished: false}), []);
  const [paused, setPaused] = useState(false), [revision, setRevision] = useState(0);
  const [completions, setCompletions] = useState(0), [fault, setFault] = useState(false);
  const [replay, setReplay] = useState(0);
  const blocked = useRef(false);
  const pauseSession = useRef<DescriptorGlossaryPauseSession<null> | null>(null);
  const request = useCallback((intent: LessonHostRequest) => {
    if (intent.type === 'open-glossary' && !config.glossaryEntries.some(e => e.id === intent.entryId)) {
      throw Error('Source glossary definition missing');
    }
    const forwarded = blocked.current && intent.type === 'record-practice-feedback'
      ? {...intent, branchCount: 0} : intent;
    const decision = host.dispatch(forwarded);
    if (decision.status === 'allowed' && (intent.type === 'open-glossary' || intent.type === 'close-glossary')) {
      const next = transitionDescriptorGlossaryPause({allowed: true, pageSessionId: config.animationId,
        paused, requestType: intent.type, seekRequest: null, session: pauseSession.current});
      pauseSession.current = next.session; setPaused(next.paused);
    }
    testWindow.__SPECIAL_AUDIT.push({request: intent, forwarded, status: decision.status,
      reason: decision.status === 'blocked' ? decision.reason : null, host: host.snapshot()});
    setRevision(r => r + 1); return decision;
  }, [host, paused]);
  const state = host.snapshot(), term = config.glossaryEntries.find(e => e.id === state.glossaryEntryId);
  return <main data-test-loader="unregistered-special3-source-successor" data-revision={revision}
    data-host-feedback-active={String(state.practiceFeedback !== null)}
    data-completions={completions} data-host-glossary-entry={state.glossaryEntryId ?? ''}>
    <header style={{padding: 12, background: '#f2f5fa'}}>
      <p>Mounted source successor test — no product registration or acceptance.</p>
      <button onClick={() => setPaused(p => !p)}>Pause test runtime</button>
      <button disabled={paused} onClick={() => setReplay(n => n + 1)}>Replay</button>
      <button aria-pressed={fault} onClick={() => {blocked.current = !blocked.current; setFault(blocked.current);}}>Reject answer record</button>
      <button onClick={() => request({type: 'set-language', language: state.language === 'en' ? 'es' : 'en'})}>Toggle glossary language</button>
    </header>
    <div style={{width: 800, margin: '0 auto'}}>
      <AnimationRuntime key={replay} animationId={config.animationId} moduleKey={config.animationId}
        query={{lang: 'en', seed: '0'}} audioEnabled={false} presentation="legacy-shell"
        paused={paused} uiLanguage={state.language} onLessonHostRequest={request}
        onPlaybackComplete={() => setCompletions(n => n + 1)}
        labels={{replay: 'Replay', reduced: 'Reduced motion active', prototype: 'Test candidate',
          loading: 'Loading test module', unavailable: 'Test module unavailable'}}/>
    </div>
    {term ? <div role="dialog" aria-modal="true" aria-label="Source bilingual glossary"
      style={{position: 'fixed', inset: '20% 10%', background: 'white', border: '3px solid #235b8a', padding: 24, zIndex: 20}}>
      <h2>{term.labels[state.language]}</h2><p data-glossary-definition>{term.definitions[state.language]}</p>
      <button onClick={() => request({type: 'close-glossary'})}>Close glossary</button>
    </div> : null}
  </main>;
}
createRoot(document.getElementById('root')!).render(<Harness/>);
