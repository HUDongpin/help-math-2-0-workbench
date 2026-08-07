import {
  G4_L3_CONTROLLED_CEO_PREVIEW_BOUNDARY,
  G4_L3_CONTROLLED_CEO_PREVIEW_COPY,
} from '@/lib/g4-l3-controlled-ceo-preview';

export function G4L3ControlledCeoPreviewBoundary({locale}: {locale: 'en' | 'es'}) {
  const spanish = locale === 'es';
  const boundary = G4_L3_CONTROLLED_CEO_PREVIEW_BOUNDARY;

  return <aside
    className="controlled-ceo-preview-boundary lesson-contract-boundary"
    data-controlled-ceo-preview={boundary.previewId}
    data-current-javascript-candidate="true"
    data-human-audio-visual-review={boundary.humanAudioVisualReview}
    data-original-runtime-full-frame-comparison={boundary.originalRuntimeFullFrameComparison}
    data-owner-acceptance={boundary.ownerAcceptance}
    data-public-release={String(boundary.publicRelease)}
    data-release-members={boundary.releaseMembers}
    data-strict-complete-members={boundary.strictCompleteMembers}
    data-strict-completion={String(boundary.strictCompletion)}
    role="note"
  >
    <span
      aria-hidden="true"
      className="controlled-ceo-preview-boundary__compact-summary"
    >{spanish
        ? 'Vista controlada · candidato current-JS · no estricta · no publicada'
        : 'Controlled preview · current-JS candidate · not strict · unpublished'}
    </span>
    <span className="controlled-ceo-preview-boundary__full-copy">
      <strong lang="en">{G4_L3_CONTROLLED_CEO_PREVIEW_COPY}</strong>
      {spanish
        ? <p lang="es">Vista controlada y local para el CEO. La comparación completa con el runtime original, la revisión humana de audio y elementos visuales, la aceptación del propietario, la finalización estricta y la publicación siguen pendientes.</p>
        : null}
    </span>
  </aside>;
}
