'use client';

import {useId, useRef, useState, type KeyboardEvent} from 'react';

import {G4_L3_PAGE_36_READABLE_VIEW_SPEC} from '@/lib/g4-l3-readable-view';

export function G4L3Page36ReadableView({
  locale,
}: {
  locale: 'en' | 'es';
}) {
  const spec = G4_L3_PAGE_36_READABLE_VIEW_SPEC;
  const [expanded, setExpanded] = useState<boolean>(spec.defaultExpanded);
  const contentId = `${useId()}-g4-l3-page-36-readable-content`;
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
          ? (spanish ? 'Solo diseño original' : 'Original Layout only')
          : (spanish ? 'Mostrar vista legible' : 'Show Readable View')}
      </button>
    </header>

    {spanish
      ? <p className="g4-l3-readable-view__language-boundary" lang="es">
          El contenido matemático original solo está disponible en inglés; se
          conserva en inglés y no se traduce.
        </p>
      : <p className="g4-l3-readable-view__language-boundary">
          The source mathematical content is available only in English.
        </p>}

    {expanded
      ? <div className="g4-l3-readable-view__content" id={contentId}>
          <p className="g4-l3-readable-view__evidence-boundary">
            {spanish
              ? 'Esta ayuda fija de legibilidad está vinculada al fotograma 789 de JavaScript actual en sprite-350. No representa el fotograma en vivo actual ni constituye evidencia de fidelidad con Flash.'
              : 'This fixed readability aid is bound to current-JavaScript frame 789 in sprite-350. It does not represent the current live frame and is not Flash-fidelity evidence.'}
          </p>
          <div className="g4-l3-readable-view__steps">
            {spec.crops.map((crop) =>
              <figure
                data-crop-height={crop.nativeRect.height}
                data-crop-padding={spec.nativePadding}
                data-crop-width={crop.nativeRect.width}
                data-crop-x={crop.nativeRect.x}
                data-crop-y={crop.nativeRect.y}
                data-desktop-scale={spec.desktopScale}
                data-readable-crop-sha256={crop.assetSha256}
                data-source-character-ids={crop.sourceCharacterIds.join(',')}
                key={crop.label}
              >
                <figcaption>{crop.label}</figcaption>
                {/* The bound PNG is a deterministic crop from the single
                    current-JS runtime at fixed source frame 789. The exact DOM
                    transcript below is the accessible text alternative. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  aria-hidden="true"
                  height={crop.paddedRect.height}
                  src={crop.asset}
                  style={{
                    width: crop.paddedRect.width * spec.desktopScale,
                  }}
                  width={crop.paddedRect.width}
                />
                <div
                  className="g4-l3-readable-view__transcript"
                  data-source-character-ids={
                    crop.sourceCharacterIds.join(',')
                  }
                  data-readable-transcript
                  lang="en"
                  data-transcript-sha256={crop.transcriptSha256}
                >
                  {crop.transcript.map((line) => <p key={line}>{line}</p>)}
                </div>
              </figure>
            )}
          </div>
        </div>
      : null}
  </section>;
}
