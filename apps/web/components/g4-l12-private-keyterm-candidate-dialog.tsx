'use client';

import {useCallback, useEffect, useId, useRef} from 'react';

import {
  G4_L12_PRIVATE_KEYTERM_CANDIDATE_AUTHORITY,
  type G4L12PrivateKeytermCandidate,
} from '@/lib/g4-l12-private-keyterm-candidate';

export function G4L12PrivateKeytermCandidateDialog({
  entry,
  onClose,
  returnFocusTo,
  uiLanguage,
}: {
  entry: G4L12PrivateKeytermCandidate | null;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
  uiLanguage?: 'en' | 'es';
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const spanish = uiLanguage === 'es';

  useEffect(() => {
    const element = dialog.current;
    if (!element || !entry || element.open) return;
    element.showModal();
    return () => {
      if (element.open) element.close();
    };
  }, [entry]);

  const close = useCallback(() => {
    if (dialog.current?.open) dialog.current.close();
    onClose();
    returnFocusTo?.focus({preventScroll: true});
  }, [onClose, returnFocusTo]);

  if (!entry) return null;
  return <dialog ref={dialog} aria-describedby={descriptionId}
    aria-labelledby={titleId}
    data-g4-l12-private-keyterm-candidate={entry.id}
    data-keyterm-authority={G4_L12_PRIVATE_KEYTERM_CANDIDATE_AUTHORITY.status}
    data-lesson-specific-substitution-authorized="false"
    data-original-runtime-accepted="false"
    data-publication-authorized="false"
    data-runtime-variant-verified="false"
    onCancel={(event) => {event.preventDefault(); close();}}
    style={{border: '1px solid #5f6f82', borderRadius: 16,
      boxShadow: '0 24px 80px rgb(15 23 42 / 35%)',
      maxWidth: 'min(36rem, calc(100vw - 32px))', padding: 24,
      width: 'calc(100% - 32px)'}}>
    <p style={{marginTop: 0}}>{spanish
      ? 'Candidato privado del diccionario predeterminado del mismo host'
      : 'Private same-host default-dictionary candidate'}</p>
    <h2 id={titleId} lang="en">{entry.title}</h2>
    <p id={descriptionId} lang="en">{entry.definition}</p>
    <p>{spanish
      ? 'La variante usada por el entorno original no está verificada. Cerrar no reanuda la fuente; usa Reproducir explícitamente.'
      : 'The original environment variant is unverified. Closing does not resume the source; use Play explicitly.'}</p>
    <button autoFocus type="button" onClick={close}
      style={{minHeight: 44, padding: '8px 16px'}}>
      {spanish ? 'Cerrar' : 'Close'}
    </button>
  </dialog>;
}
