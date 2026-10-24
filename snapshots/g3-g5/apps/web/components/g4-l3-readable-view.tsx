'use client';

import {useId, useRef, useState, type KeyboardEvent} from 'react';

import {
  G4_L3_PAGE_36_NUMBER_LINE_AMOUNTS,
  G4_L3_PAGE_36_READABLE_VIEW_SPEC,
  G4_L3_PAGE_36_SIGNED_AMOUNTS,
} from '@/lib/g4-l3-readable-view';

const NUMBER_LINE_TICKS = Object.freeze(
  Array.from({length: 21}, (_, index) => index - 10),
);

function formatTick(value: number) {
  if (value > 0) return `+${value}`;
  return `${value}`.replace('-', '−');
}

function numberLinePosition(value: number) {
  return `${((value + 10) / 20) * 100}%`;
}

export function G4L3Page36ReadableView({
  locale,
}: {
  locale: 'en' | 'es';
}) {
  const spec = G4_L3_PAGE_36_READABLE_VIEW_SPEC;
  const step3Crop = spec.crops[0]!;
  const step4Crop = spec.crops[1]!;
  const [expanded, setExpanded] = useState<boolean>(spec.defaultExpanded);
  const baseId = useId();
  const contentId = `${baseId}-g4-l3-page-36-readable-content`;
  const step3HeadingId = `${baseId}-step-3-heading`;
  const step4HeadingId = `${baseId}-step-4-heading`;
  const toggleRef = useRef<HTMLButtonElement>(null);
  const spanish = locale === 'es';

  const collapseAndRestoreFocus = () => {
    setExpanded(false);
    queueMicrotask(() => toggleRef.current?.focus());
  };

  const onPanelKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || !expanded) return;
    event.preventDefault();
    event.stopPropagation();
    collapseAndRestoreFocus();
  };

  return <section
    aria-label={spanish
      ? 'Vista legible de los pasos 3 y 4'
      : 'Readable View for Steps 3 and 4'}
    className="g4-l3-readable-view"
    data-animation-id={spec.animationId}
    data-current-js-renderer-sha256={
      spec.currentJavascriptRendererSha256
    }
    data-default-expanded={spec.defaultExpanded ? 'true' : 'false'}
    data-frame-domain={spec.frameDomain}
    data-modern-enhancement="source-bound-readable-view"
    data-original-layout-preserved={
      spec.originalLayoutPreserved ? 'true' : 'false'
    }
    data-source-animation-id={spec.animationId}
    data-source-frame={spec.sourceFrame}
    data-source-frame-sha256={spec.sourceFrameSha256}
    data-source-swf-sha256={spec.sourceSwfSha256}
    data-strict-acceptance-effect={spec.strictAcceptanceEffect}
    onKeyDown={onPanelKeyDown}
  >
    <header className="g4-l3-readable-view__header">
      <div>
        <span>{spanish
          ? 'Apoyo de lectura · Página 36'
          : 'Reading support · Page 36'}</span>
        <h2>{spanish
          ? 'Pasos 3 y 4 a un tamaño legible'
          : 'Steps 3 and 4 at readable size'}</h2>
      </div>
      <button
        aria-controls={contentId}
        aria-expanded={expanded}
        data-readable-view-toggle
        onClick={() => {
          if (expanded) {
            collapseAndRestoreFocus();
          } else {
            setExpanded(true);
          }
        }}
        ref={toggleRef}
        type="button"
      >
        {expanded
          ? (spanish ? 'Ocultar apoyo' : 'Hide reading support')
          : (spanish ? 'Mostrar apoyo' : 'Show reading support')}
      </button>
    </header>

    {spanish
      ? <p className="g4-l3-readable-view__language-boundary" lang="es">
          La lección fuente está en inglés. Este apoyo conserva el texto
          matemático original en inglés.
        </p>
      : null}

    {expanded
      ? <div className="g4-l3-readable-view__content" id={contentId}>
          <div className="g4-l3-readable-view__steps">
            <article
              aria-labelledby={step3HeadingId}
              className="g4-l3-readable-view__step"
              data-crop-height={step3Crop.nativeRect.height}
              data-crop-padding={spec.nativePadding}
              data-crop-width={step3Crop.nativeRect.width}
              data-crop-x={step3Crop.nativeRect.x}
              data-crop-y={step3Crop.nativeRect.y}
              data-readable-crop-sha256={step3Crop.assetSha256}
              data-source-character-ids={
                step3Crop.sourceCharacterIds.join(',')
              }
            >
              <header className="g4-l3-readable-view__step-heading">
                <span aria-hidden="true">3</span>
                <h3 id={step3HeadingId}>
                  {spanish ? 'Paso 3 · Recta numérica' : 'Step 3 · Number line'}
                </h3>
              </header>

              <div
                className="g4-l3-readable-view__source-copy"
                data-readable-transcript
                data-source-character-ids={
                  step3Crop.sourceCharacterIds.join(',')
                }
                data-transcript-sha256={step3Crop.transcriptSha256}
                lang="en"
              >
                <p className="g4-l3-readable-view__strategy">
                  {step3Crop.transcript[0]}
                </p>
                <p className="g4-l3-readable-view__instruction">
                  {step3Crop.transcript[1]}
                </p>

                <div className="g4-l3-readable-view__number-line-block">
                  <div
                    aria-hidden="true"
                    className="g4-l3-readable-view__number-line"
                  >
                    <div className="g4-l3-readable-view__number-line-axis" />
                    {NUMBER_LINE_TICKS.map((tick) => {
                      const major = tick % 5 === 0;
                      return <span
                        className={major
                          ? 'g4-l3-readable-view__tick g4-l3-readable-view__tick--major'
                          : 'g4-l3-readable-view__tick'}
                        data-edge={tick === -10
                          ? 'start'
                          : tick === 10
                            ? 'end'
                            : undefined}
                        key={tick}
                        style={{left: numberLinePosition(tick)}}
                      >
                        {major
                          ? <span>{formatTick(tick)}</span>
                          : null}
                      </span>;
                    })}
                    {G4_L3_PAGE_36_NUMBER_LINE_AMOUNTS.map((amount, index) =>
                      <span
                        className="g4-l3-readable-view__marker"
                        data-edge={amount.signedValue === -10
                          ? 'start'
                          : undefined}
                        data-level={index % 2 === 0 ? 'high' : 'low'}
                        key={amount.name}
                        style={{left: numberLinePosition(amount.signedValue)}}
                      >
                        <strong>{amount.name}</strong>
                        <span>{amount.signedLabel}</span>
                      </span>
                    )}
                  </div>

                  <ol
                    aria-label="Positions on the number line"
                    className="g4-l3-readable-view__position-list"
                  >
                    {G4_L3_PAGE_36_NUMBER_LINE_AMOUNTS.map((amount) =>
                      <li key={amount.name}>
                        <span>{amount.statement}</span>
                        <strong>{amount.signedLabel}</strong>
                      </li>
                    )}
                  </ol>
                </div>

                <div className="g4-l3-readable-view__result">
                  <p>{step3Crop.transcript[2]}</p>
                  <p>{step3Crop.transcript[3]}</p>
                </div>
              </div>
            </article>

            <article
              aria-labelledby={step4HeadingId}
              className="g4-l3-readable-view__step"
              data-crop-height={step4Crop.nativeRect.height}
              data-crop-padding={spec.nativePadding}
              data-crop-width={step4Crop.nativeRect.width}
              data-crop-x={step4Crop.nativeRect.x}
              data-crop-y={step4Crop.nativeRect.y}
              data-readable-crop-sha256={step4Crop.assetSha256}
              data-source-character-ids={
                step4Crop.sourceCharacterIds.join(',')
              }
            >
              <header className="g4-l3-readable-view__step-heading">
                <span aria-hidden="true">4</span>
                <h3 id={step4HeadingId}>
                  {spanish
                    ? 'Paso 4 · Razonamiento lógico'
                    : 'Step 4 · Logical reasoning'}
                </h3>
              </header>

              <div
                className="g4-l3-readable-view__source-copy"
                data-readable-transcript
                data-source-character-ids={
                  step4Crop.sourceCharacterIds.join(',')
                }
                data-transcript-sha256={step4Crop.transcriptSha256}
                lang="en"
              >
                <p className="g4-l3-readable-view__strategy">
                  {step4Crop.transcript[0]}
                </p>

                <div className="g4-l3-readable-view__concepts">
                  <p>
                    <strong aria-hidden="true">+</strong>
                    <span>{step4Crop.transcript[1]}</span>
                  </p>
                  <p>
                    <strong aria-hidden="true">−</strong>
                    <span>{step4Crop.transcript[2]}</span>
                  </p>
                </div>

                <ul
                  aria-label="Signed amounts"
                  className="g4-l3-readable-view__equations"
                >
                  {G4_L3_PAGE_36_SIGNED_AMOUNTS.map((amount) =>
                    <li key={amount.name}>
                      <span>{amount.statement}</span>
                      <span>=</span>
                      <strong>{amount.signedLabel}</strong>
                    </li>
                  )}
                </ul>

                <div className="g4-l3-readable-view__result">
                  <p>{step4Crop.transcript[7]}</p>
                  <p>{step4Crop.transcript[8]}</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      : null}
  </section>;
}
