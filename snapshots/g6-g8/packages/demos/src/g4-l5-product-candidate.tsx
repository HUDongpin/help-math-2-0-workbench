'use client';

import {useEffect, useState, type CSSProperties} from 'react';

import type {
  AnimationModule,
  AnimationRendererProps,
  RuntimeContext,
} from './contract';
import type {G4L5ProductCandidateConfig} from './g4-l5-product-candidates.generated';
import type {
  LessonHostCapability,
  LessonHostCapabilityDescriptor,
} from './lesson-host-contract';

type CandidateState = Readonly<{
  frame: number;
  frameDomain: string;
  rootFrame: number;
  scenario: string;
  language: 'en' | 'es';
  seed: number;
  replay: number;
  traceId: string;
  requirementId: string;
  entryStateSha256: string;
  animationId: string;
  acceptance: 'engineering-only';
}>;

const buttonStyle: CSSProperties = {
  background: '#fff',
  border: '2px solid #17365d',
  borderRadius: 12,
  color: '#17365d',
  cursor: 'pointer',
  fontWeight: 800,
  minHeight: 48,
  padding: '10px 16px',
};

const selectedButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: '#17365d',
  color: '#fff',
};

function DotArray({columns, rows}: {columns: number; rows: number}) {
  return (
    <span
      aria-label={`${rows} rows and ${columns} columns`}
      style={{
        display: 'grid',
        gap: 9,
        gridTemplateColumns: `repeat(${columns}, 18px)`,
        justifyContent: 'center',
      }}
    >
      {Array.from({length: columns * rows}, (_, index) => (
        <span
          aria-hidden="true"
          key={index}
          style={{
            background: index % 2 ? '#ef6a5b' : '#1768d4',
            borderRadius: '50%',
            boxShadow: '0 2px 0 rgb(20 33 61 / 20%)',
            height: 18,
            width: 18,
          }}
        />
      ))}
    </span>
  );
}

function Lattice() {
  return (
    <div
      aria-label="Two by two lattice multiplication diagram"
      style={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: 'repeat(2, 82px)',
        justifyContent: 'center',
      }}
    >
      {['1 / 2', '0 / 8', '0 / 6', '0 / 4'].map((value) => (
        <span
          key={value}
          style={{
            alignItems: 'center',
            background:
              'linear-gradient(135deg, #fff 49%, #17365d 50%, #17365d 52%, #fff 53%)',
            border: '2px solid #17365d',
            display: 'flex',
            fontSize: 18,
            fontWeight: 900,
            height: 82,
            justifyContent: 'center',
          }}
        >
          {value}
        </span>
      ))}
    </div>
  );
}

function CandidateActivity({
  config,
  props,
}: {
  config: G4L5ProductCandidateConfig;
  props: AnimationRendererProps;
}) {
  const [choice, setChoice] = useState('');
  const [feedback, setFeedback] = useState('');
  const [level, setLevel] = useState('Level 1');
  const [latticeStep, setLatticeStep] = useState(0);
  const [score, setScore] = useState(0);
  useEffect(() => {
    setChoice('');
    setFeedback('');
    setLevel('Level 1');
    setLatticeStep(0);
    setScore(0);
  }, [config.animationId, props.replay]);

  const audio = config.audio;
  const audioId = audio
    ? `${config.animationId}:source-narration-undetermined`
    : null;
  const audioActive = Boolean(
    audioId && props.activeInteractiveAudioId === audioId,
  );
  const requestAudio = () => {
    if (!audioId || !props.onLessonHostRequest) return;
    props.onLessonHostRequest({
      type: audioActive ? 'stop-audio' : 'play-audio',
      cueId: audioId,
    });
  };
  const openGlossary = (entryId: string) => {
    props.onLessonHostRequest?.({type: 'open-glossary', entryId});
  };

  let activity;
  switch (config.interaction.kind) {
    case 'array-exploration':
      activity = (
        <>
          <DotArray columns={8} rows={6} />
          <p><strong>6 rows × 8 columns = 48 objects</strong></p>
          <button
            data-g4-l5-action="transpose-array"
            onClick={() => {
              setChoice((value) => value === 'transpose' ? '' : 'transpose');
              setFeedback('Turning the array keeps the product: 8 × 6 = 48.');
            }}
            style={choice === 'transpose' ? selectedButtonStyle : buttonStyle}
            type="button"
          >
            Turn the array
          </button>
        </>
      );
      break;
    case 'array-choice': {
      const interaction = config.interaction;
      const choices = [
        {id: '3x4', columns: 4, rows: 3},
        {id: '4x3', columns: 3, rows: 4},
        {id: '2x6', columns: 6, rows: 2},
      ];
      activity = (
        <>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center'}}>
            {choices.map((item) => (
              <button
                aria-label={`${item.rows} rows and ${item.columns} columns`}
                data-array-choice={item.id}
                key={item.id}
                onClick={() => {
                  setChoice(item.id);
                  setFeedback(
                    item.id === '4x3'
                      ? 'Correct — 4 rows and 3 columns.'
                      : interaction.wrongFeedback,
                  );
                }}
                style={choice === item.id ? selectedButtonStyle : buttonStyle}
                type="button"
              >
                <DotArray columns={item.columns} rows={item.rows} />
              </button>
            ))}
          </div>
          <div style={{display: 'flex', gap: 10, justifyContent: 'center'}}>
            <button data-glossary-entry="array" onClick={() => openGlossary('array')} style={buttonStyle} type="button">Array</button>
            <button data-glossary-entry="represent" onClick={() => openGlossary('represent')} style={buttonStyle} type="button">Represent</button>
          </div>
        </>
      );
      break;
    }
    case 'lattice-steps':
      activity = (
        <>
          <p style={{fontSize: 22, fontWeight: 900, margin: 0}}>24 × 12</p>
          <Lattice />
          <div style={{display: 'flex', gap: 10, justifyContent: 'center'}}>
            <button data-lattice-step="products" onClick={() => {
              setLatticeStep(1);
              setFeedback('Step 1: multiply in each box.');
            }} style={latticeStep === 1 ? selectedButtonStyle : buttonStyle} type="button">Multiply boxes</button>
            <button data-lattice-step="diagonals" onClick={() => {
              setLatticeStep(2);
              setFeedback('Step 2: add along the diagonals. Product: 288.');
            }} style={latticeStep === 2 ? selectedButtonStyle : buttonStyle} type="button">Add diagonals</button>
          </div>
        </>
      );
      break;
    case 'multiplication-choice':
      activity = (
        <>
          <DotArray columns={6} rows={7} />
          <p style={{fontSize: 21, fontWeight: 900}}>7 × 6 = ?</p>
          <div style={{display: 'flex', gap: 10, justifyContent: 'center'}}>
            {[36, 42, 48].map((answer) => (
              <button
                data-product-choice={answer}
                key={answer}
                onClick={() => {
                  setChoice(String(answer));
                  setFeedback(answer === 42 ? 'Correct — the product is 42.' : 'Count the rows and columns. Try again.');
                }}
                style={choice === String(answer) ? selectedButtonStyle : buttonStyle}
                type="button"
              >
                {answer}
              </button>
            ))}
          </div>
        </>
      );
      break;
    case 'multiplication-game':
      activity = (
        <>
          <div style={{display: 'flex', gap: 10, justifyContent: 'center'}}>
            {['Level 1', 'Level 2'].map((item) => (
              <button data-game-level={item} key={item} onClick={() => {
                setLevel(item);
                setFeedback(`${item} selected.`);
              }} style={level === item ? selectedButtonStyle : buttonStyle} type="button">{item}</button>
            ))}
          </div>
          <p style={{fontSize: 34, fontWeight: 900, margin: '12px 0'}}>
            {level === 'Level 1' ? '6 × 7' : '12 × 8'}
          </p>
          <div style={{display: 'flex', gap: 10, justifyContent: 'center'}}>
            {(level === 'Level 1' ? [36, 42, 49] : [84, 96, 108]).map((answer) => (
              <button data-game-answer={answer} key={answer} onClick={() => {
                const correct = answer === (level === 'Level 1' ? 42 : 96);
                setScore((value) => correct ? value + 1 : value);
                setFeedback(correct ? 'Correct!' : 'Try another product.');
              }} style={buttonStyle} type="button">{answer}</button>
            ))}
          </div>
          <p data-game-score={score}>Local score: {score}</p>
        </>
      );
      break;
    case 'fq-memory-only':
      activity = (
        <>
          <p style={{background: '#fff8d9', borderRadius: 10, padding: 10}}>
            Engineering interaction probe only; this question is not claimed as reconstructed source quiz content.
          </p>
          <p style={{fontSize: 34, fontWeight: 900, margin: '8px 0'}}>9 × 7 = ?</p>
          <div style={{display: 'flex', gap: 10, justifyContent: 'center'}}>
            {[56, 63, 72].map((answer) => (
              <button
                data-fq-answer={answer}
                key={answer}
                onClick={() => {
                  const correct = answer === 63;
                  setChoice(String(answer));
                  setFeedback(correct ? 'Correct.' : 'Try again.');
                  props.onLessonHostRequest?.({
                    type: 'record-fq-score',
                    questionId: 'g4-l5-fq-private-engineering-probe',
                    correct,
                    pointsAwarded: correct ? 1 : 0,
                    pointsPossible: 1,
                  });
                }}
                style={choice === String(answer) ? selectedButtonStyle : buttonStyle}
                type="button"
              >
                {answer}
              </button>
            ))}
          </div>
        </>
      );
      break;
  }

  return (
    <div
      data-acceptance-effect="none"
      data-animation-id={config.animationId}
      data-audio-language={audio ? 'undetermined' : 'unavailable'}
      data-compiler-runtime-bundled="false"
      data-current-js-maturity="private-current-js"
      data-frame-domain={props.frameDomain}
      data-g4-l5-product-candidate="true"
      data-interaction-kind={config.interaction.kind}
      data-replay={props.replay ?? 0}
      data-source-occurrence={config.sourceOccurrence}
      data-source-swf-sha256={config.source.swfSha256}
      style={{
        alignItems: 'center',
        background: 'linear-gradient(145deg, #eef8ff, #fffdf7 58%, #fff0ec)',
        border: '1px solid #bfd8ed',
        color: '#14213d',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
        gap: 14,
        height: '100%',
        justifyContent: 'center',
        minHeight: 0,
        overflow: 'auto',
        padding: 22,
        textAlign: 'center',
        width: '100%',
      }}
    >
      <p style={{color: '#0d4fa9', fontSize: 13, fontWeight: 900, letterSpacing: '.12em', margin: 0, textTransform: 'uppercase'}}>
        {config.sectionTitle[props.lang]} · source occurrence {config.sourceOccurrence}
      </p>
      <h2 style={{fontSize: 32, lineHeight: 1.05, margin: 0}}>{config.pageTitle[props.lang]}</h2>
      <p style={{margin: 0}}>{config.interaction.prompt}</p>
      {activity}
      {feedback ? <p aria-live="polite" data-candidate-feedback style={{fontWeight: 800, margin: 0}}>{feedback}</p> : null}
      {audio ? (
        <button
          aria-pressed={audioActive}
          data-audio-action={audioActive ? 'stop' : 'play'}
          data-audio-sha256={audio.sha256}
          disabled={!props.audioEnabled}
          onClick={requestAudio}
          style={audioActive ? selectedButtonStyle : buttonStyle}
          type="button"
        >
          {audioActive ? 'Stop source audio' : 'Play source audio'}
          {' '}<small>(language unverified)</small>
        </button>
      ) : (
        <p data-audio-unavailable="true" style={{color: '#5c6678', margin: 0}}>
          No exact page-local audio is registered for this candidate.
        </p>
      )}
    </div>
  );
}

function capabilitiesFor(
  config: G4L5ProductCandidateConfig,
): LessonHostCapabilityDescriptor {
  const capabilities: LessonHostCapability[] = [];
  if (config.audio) capabilities.push('audio' as const);
  if (config.interaction.kind === 'array-choice') {
    capabilities.push('glossary' as const);
  }
  if (config.interaction.kind === 'fq-memory-only') {
    capabilities.push('fq-scoring' as const);
  }
  return Object.freeze({
    capabilities: Object.freeze(capabilities),
    legacyOperations: 'blocked',
    auditStorage: 'memory-only',
    storesPersonalData: false,
  });
}

export function createG4L5ProductCandidateModule(
  config: G4L5ProductCandidateConfig,
): AnimationModule<CandidateState> {
  const Renderer = (props: AnimationRendererProps) => (
    <CandidateActivity config={config} props={props} />
  );
  const productDomain = config.source.productFrameDomain;
  const audioId = `${config.animationId}:source-narration-undetermined`;
  return Object.freeze({
    key: config.animationId,
    movie: Object.freeze({
      stage: Object.freeze(config.source.stage),
      fps: config.source.fps,
      frameCount: config.source.rootFrameCount,
      durationMs: (config.source.rootFrameCount * 1000) / config.source.fps,
    }),
    runtime: Object.freeze({
      stage: Object.freeze(config.source.stage),
      fps: config.source.fps,
      frameCount: config.source.rootFrameCount,
      durationMs: (config.source.rootFrameCount * 1000) / config.source.fps,
      frameDomains: Object.freeze([
        Object.freeze({
          id: 'root',
          frameCount: config.source.rootFrameCount,
          fps: config.source.fps,
        }),
        Object.freeze({
          id: productDomain.id,
          frameCount: productDomain.frameCount,
          fps: config.source.fps,
          rootFrame: 1,
        }),
      ]),
      defaultFrameDomain: productDomain.id,
    }),
    playbackMode: 'once',
    playbackEndFrame: productDomain.frameCount,
    reducedMotionFrame: 1,
    scenarios: Object.freeze([
      Object.freeze({
        id: 'product-candidate',
        label: 'Source-bound product candidate',
        description:
          'Independent Current-JS engineering candidate; no fidelity acceptance effect.',
      }),
    ]),
    defaultScenarioByFrameDomain: Object.freeze({
      root: 'product-candidate',
      [productDomain.id]: 'product-candidate',
    }),
    audioCues: Object.freeze([]),
    interactiveAudioAssets: config.audio
      ? Object.freeze([
          Object.freeze({
            id: audioId,
            language: 'shared' as const,
            spokenLanguage: 'undetermined' as const,
            source:
              `/flash-assets/courses/${config.animationId}/audio/source-narration-undetermined.mp3?sha256=${config.audio.sha256}`,
            sha256: config.audio.sha256,
          }),
        ])
      : undefined,
    lessonHost: capabilitiesFor(config),
    maturity: 'private-current-js',
    Renderer,
    getFrameState(frame: number, context: RuntimeContext): CandidateState {
      return Object.freeze({
        frame,
        frameDomain: context.frameDomain ?? productDomain.id,
        rootFrame: context.rootFrame ?? 1,
        scenario: context.scenario,
        language: context.lang,
        seed: context.seed,
        replay: context.replay ?? 0,
        traceId: context.traceId ?? 'runtime',
        requirementId: context.requirementId ?? 'runtime',
        entryStateSha256: context.entryStateSha256 ?? 'runtime',
        animationId: config.animationId,
        acceptance: 'engineering-only',
      });
    },
  });
}
