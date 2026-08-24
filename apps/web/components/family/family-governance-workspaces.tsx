'use client';

import {ArrowLeft, FileCheck2, KeyRound, School, ShieldCheck} from 'lucide-react';
import {useRouter} from 'next/navigation';
import type {ReactNode} from 'react';
import {useMemo, useState} from 'react';

import {Link} from '@/i18n/navigation';
import type {
  AdminFamilyOperationsWorkspace,
  FamilyActionResult,
  FamilyGovernanceMutationReceipt,
  FamilyGovernanceWorkspace,
  FamilyRightsRequestKind,
  FamilySuggestionMutationReceipt,
  FamilySupportCase,
  FamilySupportDecisionReceipt,
  TeacherInvitationSuggestionWorkspace,
} from '@/lib/family/types';

import styles from './family-governance-workspaces.module.css';

type Locale = 'en' | 'es';
type BasicResult = Promise<FamilyActionResult>;

const rightsLabels: Record<Locale, Record<FamilyRightsRequestKind, string>> = {
  en: {access: 'Access copy', correction: 'Correction review', deletion: 'Deletion review', relationship_dispute: 'Relationship dispute'},
  es: {access: 'Copia de acceso', correction: 'Revisión de corrección', deletion: 'Revisión de eliminación', relationship_dispute: 'Disputa de relación'},
};

function formatDate(locale: Locale, value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-US' : 'en-US', {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(value));
}

function WorkspaceFrame({
  backHref, children, intro, locale, tenant, title,
}: {
  backHref: string;
  children: ReactNode;
  intro: string;
  locale: Locale;
  tenant: string;
  title: string;
}) {
  return <div className={styles.page}><main className={styles.shell} id="main-content">
    <div className={styles.topbar}>
      <Link className={styles.back} href={backHref}><ArrowLeft aria-hidden="true" />{locale === 'es' ? 'Volver' : 'Back'}</Link>
      <span className={styles.tenant}><School aria-hidden="true" />{tenant}</span>
    </div>
    <header className={styles.heading}>
      <p>HELP Math · {locale === 'es' ? 'Flujo protegido' : 'Protected workflow'}</p>
      <h1>{title}</h1><p>{intro}</p>
    </header>
    <aside className={styles.notice} role="note"><ShieldCheck aria-hidden="true" /><div>
      <strong>{locale === 'es' ? 'Revisión humana y escolar' : 'School-controlled human review'}</strong>
      <p>{locale === 'es'
        ? 'Enviar una solicitud no cambia un expediente, una relación familiar ni un mensaje. Cada decisión requiere autorización del servidor y queda auditada.'
        : 'Submitting a request does not change a student record, family relationship, or message. Every decision is server-authorized and audited.'}</p>
    </div></aside>
    {children}
  </main></div>;
}

export function FamilyRequestsWorkspace({
  linkedChildren,
  initialKind = 'access',
  locale,
  onCreateAction,
  workspace,
}: {
  linkedChildren: readonly {displayName: string; id: string}[];
  initialKind?: FamilyRightsRequestKind;
  locale: Locale;
  onCreateAction: (
    childId: string, kind: FamilyRightsRequestKind, details: string,
    clientMutationId: string,
  ) => Promise<FamilyActionResult<FamilyGovernanceMutationReceipt>>;
  workspace: FamilyGovernanceWorkspace;
}) {
  const router = useRouter();
  const [childId, setChildId] = useState(linkedChildren[0]?.id ?? '');
  const [kind, setKind] = useState<FamilyRightsRequestKind>(initialKind);
  const [details, setDetails] = useState('');
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState('');
  const copy = locale === 'es' ? {
    title: 'Solicitudes y actividad familiar', intro: 'Envía una solicitud controlada a la escuela y revisa su estado junto con la actividad reciente de tu cuenta.',
    form: 'Nueva solicitud', formIntro: 'Elige al estudiante y el tipo de revisión. Incluye solo la información necesaria.', child: 'Estudiante', kind: 'Tipo de solicitud', details: 'Detalles opcionales', hint: 'Máximo 1.000 caracteres. No incluyas contraseñas, diagnósticos ni expedientes completos.', submit: 'Enviar para revisión', sent: 'Solicitud enviada para revisión escolar.', failed: 'No se pudo enviar la solicitud. No se modificó ningún registro.', history: 'Historial de solicitudes', noHistory: 'Todavía no hay solicitudes.', activity: 'Actividad reciente de la cuenta', noActivity: 'Todavía no hay actividad disponible.',
  } : {
    title: 'Family requests and activity', intro: 'Submit a controlled request to the school and review its status alongside recent account activity.',
    form: 'New request', formIntro: 'Choose the child and review type. Include only the information needed.', child: 'Child', kind: 'Request type', details: 'Optional details', hint: 'Maximum 1,000 characters. Do not include passwords, diagnoses, or complete education records.', submit: 'Send for review', sent: 'Request sent for school review.', failed: 'The request could not be submitted. No record was changed.', history: 'Request history', noHistory: 'No requests yet.', activity: 'Recent account activity', noActivity: 'No account activity is available yet.',
  };
  const submit = async () => {
    if (!childId) return;
    setPending(true); setStatus('');
    try {
      const result = await onCreateAction(childId, kind, details, `family-rights:${crypto.randomUUID()}`);
      if (!result.ok) { setStatus(copy.failed); return; }
      setDetails(''); setStatus(copy.sent); router.refresh();
    } catch { setStatus(copy.failed); } finally { setPending(false); }
  };
  const activityLabel = (entity: string, action: string) => {
    const labels: Record<string, string> = locale === 'es' ? {
      family_rights_request: 'Solicitud de datos familiares', family_messages: 'Mensaje familiar', family_threads: 'Conversación familiar', family_notification_preferences: 'Preferencias de notificación', guardian_links: 'Relación familiar', guardian_invitations: 'Invitación familiar',
    } : {
      family_rights_request: 'Family data request', family_messages: 'Family message', family_threads: 'Family conversation', family_notification_preferences: 'Notification preferences', guardian_links: 'Family relationship', guardian_invitations: 'Family invitation',
    };
    return `${labels[entity] ?? entity} · ${action}`;
  };
  return <WorkspaceFrame backHref="/family?view=settings" intro={copy.intro} locale={locale} tenant={workspace.tenant.displayName} title={copy.title}>
    <div className={styles.grid}>
      <section className={styles.card}><header><h2>{copy.form}</h2><p>{copy.formIntro}</p></header>
        <form className={styles.form} onSubmit={(event) => {event.preventDefault(); void submit();}}>
          <label htmlFor="family-rights-child">{copy.child}</label>
          <select id="family-rights-child" onChange={(event) => setChildId(event.currentTarget.value)} required value={childId}>{linkedChildren.map((child) => <option key={child.id} value={child.id}>{child.displayName}</option>)}</select>
          <label htmlFor="family-rights-kind">{copy.kind}</label>
          <select id="family-rights-kind" onChange={(event) => setKind(event.currentTarget.value as FamilyRightsRequestKind)} value={kind}>{Object.entries(rightsLabels[locale]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <label htmlFor="family-rights-details">{copy.details}</label>
          <textarea aria-describedby="family-rights-hint" id="family-rights-details" maxLength={1000} onChange={(event) => setDetails(event.currentTarget.value)} value={details} />
          <small className={styles.hint} id="family-rights-hint">{copy.hint} · {details.length}/1,000</small>
          <button className={styles.button} disabled={pending || !childId} type="submit"><FileCheck2 aria-hidden="true" />{copy.submit}</button>
          <p aria-live="polite" className={`${styles.status} ${status === copy.failed ? styles.error : ''}`}>{status}</p>
        </form>
      </section>
      <div className={styles.stack}>
        <section className={styles.card}><header><h2>{copy.history}</h2></header>
          {workspace.rightsRequests.length ? <ul className={styles.list}>{workspace.rightsRequests.map((request) => <li className={styles.item} key={request.id}>
            <div className={styles.itemHead}><strong>{rightsLabels[locale][request.kind]} · {request.childDisplayName}</strong><span className={styles.pill} data-status={request.status}>{request.status}</span></div>
            {request.details ? <p>{request.details}</p> : null}<div className={styles.meta}><span>{formatDate(locale, request.submittedAt)}</span>{request.decidedAt ? <span>{formatDate(locale, request.decidedAt)}</span> : null}</div>
          </li>)}</ul> : <p className={styles.empty}>{copy.noHistory}</p>}
        </section>
        <section className={styles.card} id="activity"><header><h2>{copy.activity}</h2></header>
          {workspace.accountActivity.length ? <ol className={styles.activity}>{workspace.accountActivity.map((entry) => <li key={entry.id}><strong>{activityLabel(entry.entityType, entry.action)}</strong><small>{formatDate(locale, entry.occurredAt)}</small></li>)}</ol> : <p className={styles.empty}>{copy.noActivity}</p>}
        </section>
      </div>
    </div>
  </WorkspaceFrame>;
}

export function TeacherInvitationSuggestionWorkspaceView({
  locale, onCreateAction, workspace,
}: {
  locale: Locale;
  onCreateAction: (childId: string, note: string, clientMutationId: string) => Promise<FamilyActionResult<FamilySuggestionMutationReceipt>>;
  workspace: TeacherInvitationSuggestionWorkspace;
}) {
  const router = useRouter();
  const [childId, setChildId] = useState(workspace.eligibleChildren[0]?.id ?? '');
  const [note, setNote] = useState(''); const [pending, setPending] = useState(false); const [status, setStatus] = useState('');
  const spanish = locale === 'es';
  const submit = async () => { if (!childId) return; setPending(true); setStatus(''); try { const result = await onCreateAction(childId, note, `teacher-invite-suggestion:${crypto.randomUUID()}`); if (!result.ok) { setStatus(spanish ? 'No se pudo enviar la sugerencia.' : 'The suggestion could not be submitted.'); return; } setNote(''); setStatus(spanish ? 'Sugerencia enviada al administrador escolar.' : 'Suggestion sent to the school administrator.'); router.refresh(); } finally { setPending(false); } };
  return <WorkspaceFrame backHref="/teacher/messages" intro={spanish ? 'Sugiere que un administrador escolar verifique e invite a una familia. No ingreses un correo y no otorgas acceso directamente.' : 'Suggest that a school administrator verify and invite a family. You do not enter an email or grant access directly.'} locale={locale} tenant={workspace.tenant.displayName} title={spanish ? 'Sugerir acceso familiar' : 'Suggest family access'}>
    <div className={styles.grid}><section className={styles.card}><header><h2>{spanish ? 'Nueva sugerencia' : 'New suggestion'}</h2><p>{spanish ? 'Solo estudiantes de tus clases actuales.' : 'Only students in your current classes.'}</p></header><form className={styles.form} onSubmit={(event) => {event.preventDefault(); void submit();}}>
      <label htmlFor="teacher-suggestion-child">{spanish ? 'Estudiante' : 'Child'}</label><select id="teacher-suggestion-child" onChange={(event) => setChildId(event.currentTarget.value)} required value={childId}>{workspace.eligibleChildren.map((child) => <option key={child.id} value={child.id}>{child.displayName} · {child.gradeLabel} · {child.schoolName}</option>)}</select>
      <label htmlFor="teacher-suggestion-note">{spanish ? 'Nota opcional' : 'Optional note'}</label><textarea id="teacher-suggestion-note" maxLength={500} onChange={(event) => setNote(event.currentTarget.value)} value={note} /><small className={styles.hint}>{note.length}/500</small>
      <button className={styles.button} disabled={pending || !childId} type="submit">{spanish ? 'Enviar sugerencia' : 'Send suggestion'}</button><p aria-live="polite" className={styles.status}>{status}</p>
    </form></section><section className={styles.card}><header><h2>{spanish ? 'Mis sugerencias' : 'My suggestions'}</h2></header>{workspace.suggestions.length ? <ul className={styles.list}>{workspace.suggestions.map((item) => <li className={styles.item} key={item.id}><div className={styles.itemHead}><strong>{item.childDisplayName}</strong><span className={styles.pill} data-status={item.status}>{item.status}</span></div>{item.note ? <p>{item.note}</p> : null}<div className={styles.meta}>{formatDate(locale, item.submittedAt)}</div></li>)}</ul> : <p className={styles.empty}>{spanish ? 'Todavía no hay sugerencias.' : 'No suggestions yet.'}</p>}</section></div>
  </WorkspaceFrame>;
}

export function AdminFamilyOperationsWorkspaceView({
  canDecideSupport, locale, onCreateSupportAction, onDecideSupportAction,
  onReviewRightsAction, onReviewSuggestionAction, workspace,
}: {
  canDecideSupport: boolean;
  locale: Locale;
  onCreateSupportAction: (threadId: string, reason: string, clientMutationId: string) => Promise<FamilyActionResult<FamilyGovernanceMutationReceipt>>;
  onDecideSupportAction: (requestId: string, approved: boolean, decisionNote: string, clientMutationId: string) => Promise<FamilyActionResult<FamilySupportDecisionReceipt>>;
  onReviewRightsAction: (requestId: string, status: 'completed' | 'declined', clientMutationId: string) => BasicResult;
  onReviewSuggestionAction: (suggestionId: string, status: 'reviewed' | 'dismissed', clientMutationId: string) => BasicResult;
  workspace: AdminFamilyOperationsWorkspace;
}) {
  const router = useRouter(); const spanish = locale === 'es';
  const [threadId, setThreadId] = useState(''); const [reason, setReason] = useState(''); const [status, setStatus] = useState(''); const [pending, setPending] = useState<string | null>(null);
  const run = async (key: string, action: () => Promise<{ok: boolean}>) => { setPending(key); setStatus(''); try { const result = await action(); setStatus(result.ok ? (spanish ? 'La operación se guardó y auditó.' : 'The operation was saved and audited.') : (spanish ? 'No se pudo completar la operación.' : 'The operation could not be completed.')); if (result.ok) router.refresh(); } finally { setPending(null); } };
  const submitSupport = async () => { if (!threadId || !reason.trim()) return; await run('support-create', () => onCreateSupportAction(threadId, reason, `admin-support:${crypto.randomUUID()}`)); setReason(''); setThreadId(''); };
  return <WorkspaceFrame backHref="/admin/family-access" intro={spanish ? 'Revisa solicitudes sin editar directamente expedientes. El acceso a mensajes requiere una solicitud por hilo, la aprobación de otra persona y vence en 15 minutos.' : 'Review requests without directly editing records. Message access requires an exact-thread request, approval by another person, and expires after 15 minutes.'} locale={locale} tenant={workspace.tenant.displayName} title={spanish ? 'Operaciones familiares controladas' : 'Controlled family operations'}>
    <p aria-live="polite" className={styles.status}>{status}</p>
    <div className={styles.stack}>
      <section className={styles.card}><header><h2>{spanish ? 'Solicitudes familiares' : 'Family rights requests'}</h2></header>{workspace.rightsRequests.length ? <ul className={styles.list}>{workspace.rightsRequests.map((item) => <li className={styles.item} key={item.id}><div className={styles.itemHead}><strong>{item.guardianLabel} · {item.childDisplayName}</strong><span className={styles.pill} data-status={item.status}>{item.status}</span></div><p>{rightsLabels[locale][item.kind]}{item.details ? ` — ${item.details}` : ''}</p>{item.status === 'pending' ? <div className={styles.actions}><button className={styles.button} disabled={pending === item.id} onClick={() => void run(item.id, () => onReviewRightsAction(item.id, 'completed', `admin-rights:${crypto.randomUUID()}`))} type="button">{spanish ? 'Completar' : 'Complete'}</button><button className={styles.danger} disabled={pending === item.id} onClick={() => void run(item.id, () => onReviewRightsAction(item.id, 'declined', `admin-rights:${crypto.randomUUID()}`))} type="button">{spanish ? 'Rechazar' : 'Decline'}</button></div> : null}</li>)}</ul> : <p className={styles.empty}>{spanish ? 'No hay solicitudes.' : 'No requests.'}</p>}</section>
      <section className={styles.card}><header><h2>{spanish ? 'Sugerencias de docentes' : 'Teacher invitation suggestions'}</h2><p>{spanish ? 'Revisar una sugerencia no crea una invitación.' : 'Reviewing a suggestion does not create an invitation.'}</p></header>{workspace.invitationSuggestions.length ? <ul className={styles.list}>{workspace.invitationSuggestions.map((item) => <li className={styles.item} key={item.id}><div className={styles.itemHead}><strong>{item.teacherLabel} · {item.childDisplayName}</strong><span className={styles.pill} data-status={item.status}>{item.status}</span></div>{item.note ? <p>{item.note}</p> : null}{item.status === 'pending' ? <div className={styles.actions}><button className={styles.button} onClick={() => void run(item.id, () => onReviewSuggestionAction(item.id, 'reviewed', `admin-suggestion:${crypto.randomUUID()}`))} type="button">{spanish ? 'Marcar revisada' : 'Mark reviewed'}</button><button className={styles.danger} onClick={() => void run(item.id, () => onReviewSuggestionAction(item.id, 'dismissed', `admin-suggestion:${crypto.randomUUID()}`))} type="button">{spanish ? 'Descartar' : 'Dismiss'}</button></div> : null}</li>)}</ul> : <p className={styles.empty}>{spanish ? 'No hay sugerencias.' : 'No suggestions.'}</p>}</section>
      <div className={styles.grid}><section className={styles.card}><header><h2>{spanish ? 'Solicitar acceso de soporte' : 'Request support access'}</h2><p>{spanish ? 'Ingresa el identificador opaco de un hilo comunicado por el participante y un motivo.' : 'Enter an opaque thread ID supplied by a participant and a reason.'}</p></header><form className={styles.form} onSubmit={(event) => {event.preventDefault(); void submitSupport();}}><label htmlFor="support-thread-id">{spanish ? 'ID del hilo' : 'Thread ID'}</label><input id="support-thread-id" onChange={(event) => setThreadId(event.currentTarget.value)} required value={threadId} /><label htmlFor="support-reason">{spanish ? 'Motivo' : 'Reason'}</label><textarea id="support-reason" maxLength={500} onChange={(event) => setReason(event.currentTarget.value)} required value={reason} /><button className={styles.button} disabled={pending === 'support-create'} type="submit"><KeyRound aria-hidden="true" />{spanish ? 'Solicitar revisión' : 'Request review'}</button></form></section>
      <section className={styles.card}><header><h2>{spanish ? 'Casos de soporte' : 'Support cases'}</h2></header>{workspace.supportRequests.length ? <ul className={styles.list}>{workspace.supportRequests.map((item) => <li className={styles.item} key={item.id}><div className={styles.itemHead}><strong>{item.requestorLabel}</strong><span className={styles.pill} data-status={item.status}>{item.status}</span></div><p>{item.reason}</p><div className={styles.meta}><span>{item.threadId}</span><span>{formatDate(locale, item.requestedAt)}</span>{item.accessExpiresAt ? <span>{formatDate(locale, item.accessExpiresAt)}</span> : null}</div><div className={styles.actions}>{canDecideSupport && item.status === 'pending' ? <><button className={styles.button} onClick={() => void run(item.id, () => onDecideSupportAction(item.id, true, '', `admin-support-decision:${crypto.randomUUID()}`))} type="button">{spanish ? 'Aprobar 15 min' : 'Approve 15 min'}</button><button className={styles.danger} onClick={() => void run(item.id, () => onDecideSupportAction(item.id, false, '', `admin-support-decision:${crypto.randomUUID()}`))} type="button">{spanish ? 'Denegar' : 'Deny'}</button></> : null}{item.canAccess ? <Link className={styles.secondary} href={`/admin/family-operations?support=${encodeURIComponent(item.id)}`}>{spanish ? 'Abrir caso exacto' : 'Open exact case'}</Link> : null}</div></li>)}</ul> : <p className={styles.empty}>{spanish ? 'No hay casos.' : 'No support cases.'}</p>}</section></div>
    </div>
  </WorkspaceFrame>;
}

export function FamilySupportCaseView({
  caseData, locale, onRedactAction,
}: {
  caseData: FamilySupportCase;
  locale: Locale;
  onRedactAction: (messageId: string, reason: string, clientMutationId: string) => BasicResult;
}) {
  const router = useRouter(); const spanish = locale === 'es'; const [reason, setReason] = useState(''); const [selected, setSelected] = useState(''); const [status, setStatus] = useState('');
  const expires = useMemo(() => formatDate(locale, caseData.request.accessExpiresAt), [caseData.request.accessExpiresAt, locale]);
  const redact = async () => { if (!selected || !reason.trim()) return; const result = await onRedactAction(selected, reason, `admin-redact:${crypto.randomUUID()}`); setStatus(result.ok ? (spanish ? 'El mensaje fue reemplazado por una marca auditada.' : 'The message was replaced with an audited tombstone.') : (spanish ? 'No se pudo redactar el mensaje.' : 'The message could not be redacted.')); if (result.ok) { setSelected(''); setReason(''); router.refresh(); } };
  return <WorkspaceFrame backHref="/admin/family-operations" intro={spanish ? 'Este acceso muestra un solo hilo y vence automáticamente. Los mensajes no se pueden editar ni eliminar.' : 'This access exposes one thread and expires automatically. Messages cannot be edited or deleted.'} locale={locale} tenant={caseData.tenantDisplayName} title={spanish ? 'Caso de soporte con tiempo limitado' : 'Time-limited support case'}>
    <div className={styles.caseGrid}><aside className={`${styles.card} ${styles.caseMeta}`}><h2>{spanish ? 'Autorización' : 'Authorization'}</h2><p>{caseData.request.reason}</p><strong>{spanish ? 'Vence' : 'Expires'}: {expires}</strong><span>{caseData.thread.guardianLabel} · {caseData.thread.staffLabel}</span><span>{caseData.thread.topic} · {caseData.thread.status}</span></aside><section className={styles.card}><header><h2>{spanish ? 'Hilo exacto' : 'Exact thread'}</h2><p>{spanish ? 'Selecciona un mensaje solo cuando exista una razón documentada.' : 'Select a message only when a documented reason exists.'}</p></header><div className={styles.messages}>{caseData.thread.messages.map((message) => <article className={`${styles.message} ${message.redacted ? styles.redacted : ''}`} key={message.id}><strong>{message.senderLabel}</strong><p>{message.body}</p><small>{formatDate(locale, message.sentAt)}</small>{!message.redacted ? <button className={styles.danger} onClick={() => setSelected(message.id)} type="button">{spanish ? 'Seleccionar para redacción' : 'Select for redaction'}</button> : null}</article>)}</div>{selected ? <form className={styles.form} onSubmit={(event) => {event.preventDefault(); void redact();}}><label htmlFor="redaction-reason">{spanish ? 'Razón obligatoria' : 'Required reason'}</label><textarea id="redaction-reason" maxLength={500} onChange={(event) => setReason(event.currentTarget.value)} required value={reason} /><button className={styles.danger} type="submit">{spanish ? 'Aplicar marca de redacción' : 'Apply redaction tombstone'}</button></form> : null}<p aria-live="polite" className={styles.status}>{status}</p></section></div>
  </WorkspaceFrame>;
}
