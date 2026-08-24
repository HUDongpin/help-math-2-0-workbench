'use client';

import {
  Check,
  ChevronRight,
  CircleAlert,
  Inbox,
  KeyRound,
  MailPlus,
  Megaphone,
  School,
  ShieldCheck,
  UserRoundCheck,
  UserRoundX,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import {useRouter} from 'next/navigation';
import {useEffect, useLayoutEffect, useMemo, useState} from 'react';

import {Link} from '@/i18n/navigation';
import type {
  AdminFamilyAccessDemoDto,
  AdminFamilyInvitation,
  FamilyInvitationAcceptDemoDto,
  TeacherMessagesDemoDto,
  TeacherFamilyThread,
} from '@/lib/family/family-demo-data';

import styles from './family-companion-surfaces.module.css';

type TeacherThreadState = Record<string, {
  read: boolean;
  closed: boolean;
  replies: readonly string[];
}>;

function initialThreadState(data: TeacherMessagesDemoDto): TeacherThreadState {
  return Object.fromEntries(data.threads.map((thread) => [
    thread.id,
    {
      read: thread.unreadCount === 0,
      closed: thread.status === 'closed',
      replies: [],
    },
  ]));
}

function CompanionHeader({
  href,
  locale,
  tenantLabel,
  workspaceLabel,
}: {
  href: string;
  locale: 'en' | 'es';
  tenantLabel?: string;
  workspaceLabel: string;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span><Image alt="" aria-hidden="true" height={40} priority src="/brand/help-math-2-logo.png" width={40} /></span>
        <div><strong>HELP <b>Math</b></strong><small>{workspaceLabel}</small></div>
      </div>
      {tenantLabel ? <span className={styles.tenant}><School aria-hidden="true" />{tenantLabel}</span> : null}
      <div aria-label={locale === 'es' ? 'Idioma de la interfaz' : 'Interface language'} className={styles.language} role="group">
        <Link aria-current={locale === 'en' ? 'true' : undefined} href={href} locale="en">EN</Link>
        <Link aria-current={locale === 'es' ? 'true' : undefined} href={href} locale="es">ES</Link>
      </div>
    </header>
  );
}

function SyntheticBoundary({
  badge,
  body,
  synthetic = true,
  title,
}: {
  badge: string;
  body: string;
  synthetic?: boolean;
  title: string;
}) {
  return (
    <aside
      className={styles.syntheticBoundary}
      data-family-access-boundary
      data-family-demo-boundary={synthetic ? 'true' : undefined}
      role="note"
    >
      <ShieldCheck aria-hidden="true" />
      <div><span>{badge}</span><strong>{title}</strong><p>{body}</p></div>
    </aside>
  );
}

function PageHeading({intro, title}: {intro: string; title: string}) {
  return <header className={styles.pageHeading}><h1>{title}</h1><p>{intro}</p></header>;
}

function teacherThreadLabel(thread: TeacherFamilyThread): string {
  return `${thread.guardianLabel} · ${thread.childLabel}`;
}

export function TeacherFamilyMessagesDemo({
  data,
  onCloseThreadAction,
  onMarkThreadReadAction,
  onPublishAnnouncementAction,
  onSendMessageAction,
}: {
  data: TeacherMessagesDemoDto;
  onCloseThreadAction?: (
    threadId: string,
    clientMutationId: string,
  ) => Promise<{ok: boolean}>;
  onMarkThreadReadAction?: (
    threadId: string,
    clientMutationId: string,
  ) => Promise<{ok: boolean}>;
  onPublishAnnouncementAction?: (
    schoolId: string,
    title: string,
    body: string,
    clientMutationId: string,
  ) => Promise<{
    ok: boolean;
    data?: {announcementId: string; expiresAt: string; publishedAt: string};
  }>;
  onSendMessageAction?: (
    threadId: string,
    body: string,
    clientMutationId: string,
  ) => Promise<{ok: boolean}>;
}) {
  const [selectedThreadId, setSelectedThreadId] = useState(
    data.threads[0]?.id ?? '',
  );
  const [threadState, setThreadState] = useState<TeacherThreadState>(() => initialThreadState(data));
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [announcement, setAnnouncement] = useState('');
  const [announcementStatus, setAnnouncementStatus] = useState('');
  const [announcementSchoolId, setAnnouncementSchoolId] = useState(
    data.announcementSchools[0]?.id ?? '',
  );
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [announcementPending, setAnnouncementPending] = useState(false);
  const [pending, setPending] = useState(false);
  const selectedThread = data.threads.find((thread) => (
    thread.id === selectedThreadId
  )) ?? data.threads[0];
  const selectedState = selectedThread
    ? threadState[selectedThread.id]
    : undefined;

  const unreadTotal = useMemo(
    () => data.threads.filter((thread) => !threadState[thread.id]?.read).length,
    [data.threads, threadState],
  );

  const updateThread = (
    id: string,
    update: Partial<TeacherThreadState[string]>,
    message: string,
  ) => {
    setThreadState((current) => ({...current, [id]: {...current[id]!, ...update}}));
    setAnnouncement(message);
  };

  const publishAnnouncement = async () => {
    const title = announcementTitle.normalize('NFC').trim();
    const body = announcementBody.normalize('NFC').trim();
    if (
      !data.announcementPublishingAvailable
      || !announcementSchoolId
      || !title
      || !body
    ) return;
    setAnnouncementPending(true);
    setAnnouncementStatus('');
    try {
      if (!data.synthetic) {
        if (!onPublishAnnouncementAction) {
          setAnnouncementStatus(data.announcementUnavailable);
          return;
        }
        const result = await onPublishAnnouncementAction(
          announcementSchoolId,
          title,
          body,
          `teacher-announcement:${crypto.randomUUID()}`,
        );
        if (!result.ok || !result.data) {
          setAnnouncementStatus(data.actionFailed);
          return;
        }
      }
      setAnnouncementTitle('');
      setAnnouncementBody('');
      setAnnouncementStatus(data.announcementPublished);
    } finally {
      setAnnouncementPending(false);
    }
  };

  const addReply = async () => {
    if (!selectedThread || !selectedState) return;
    const body = (drafts[selectedThread.id] ?? '').normalize('NFC').trim().slice(0, 2_000);
    if (!body || selectedState.closed) return;
    setPending(true);
    try {
      if (!onSendMessageAction && !data.synthetic) {
        setAnnouncement(data.actionFailed);
        return;
      }
      if (onSendMessageAction) {
        const result = await onSendMessageAction(
          selectedThread.id,
          body,
          `teacher-message:${crypto.randomUUID()}`,
        );
        if (!result.ok) {
          setAnnouncement(data.actionFailed);
          return;
        }
      }
    } finally {
      setPending(false);
    }
    updateThread(
      selectedThread.id,
      {read: true, replies: [...selectedState.replies, body]},
      data.replyAnnouncement,
    );
    setDrafts((current) => ({...current, [selectedThread.id]: ''}));
  };

  const runThreadAction = async (
    action: ((threadId: string, clientMutationId: string) => Promise<{ok: boolean}>) | undefined,
    update: Partial<TeacherThreadState[string]>,
    successAnnouncement: string,
  ) => {
    if (!selectedThread) return;
    setPending(true);
    try {
      if (!action && !data.synthetic) {
        setAnnouncement(data.actionFailed);
        return;
      }
      if (action) {
        const result = await action(
          selectedThread.id,
          `teacher-thread:${crypto.randomUUID()}`,
        );
        if (!result.ok) {
          setAnnouncement(data.actionFailed);
          return;
        }
      }
      updateThread(selectedThread.id, update, successAnnouncement);
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className={styles.companion}
      data-family-companion="teacher-messages"
      data-family-data-mode={data.synthetic ? 'synthetic' : 'authorized'}
    >
      <CompanionHeader href="/teacher/messages" locale={data.locale} tenantLabel={data.tenant.displayName} workspaceLabel={data.workspaceLabel} />
      <main className={styles.main} id="main-content">
        <PageHeading intro={data.intro} title={data.title} />
        <Link className={styles.primaryLink} href="/teacher/family-access">
          {data.locale === 'es' ? 'Sugerir acceso familiar' : 'Suggest family access'}
          <ChevronRight aria-hidden="true" />
        </Link>
        <SyntheticBoundary badge={data.syntheticBadge} body={data.syntheticBody} synthetic={data.synthetic} title={data.syntheticTitle} />
        <p aria-atomic="true" aria-live="polite" className={styles.srOnly}>{announcement}</p>

        <section className={styles.announcementComposer}>
          <header>
            <Megaphone aria-hidden="true" />
            <div>
              <h2>{data.announcementComposeTitle}</h2>
              <p>{data.announcementComposeIntro}</p>
            </div>
          </header>
          <form onSubmit={(event) => {
            event.preventDefault();
            void publishAnnouncement();
          }}>
            <fieldset
              aria-label={data.announcementComposeTitle}
              disabled={announcementPending || !data.announcementPublishingAvailable}
            >
              <label>
                <span>{data.announcementSchoolLabel}</span>
                <select
                  onChange={(event) => setAnnouncementSchoolId(event.currentTarget.value)}
                  value={announcementSchoolId}
                >
                  {data.announcementSchools.map((school) => (
                    <option key={school.id} value={school.id}>{school.displayName}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>{data.announcementTitleLabel}</span>
                <input
                  maxLength={200}
                  onChange={(event) => setAnnouncementTitle(event.currentTarget.value)}
                  placeholder={data.announcementTitlePlaceholder}
                  value={announcementTitle}
                />
                <small>{announcementTitle.length.toLocaleString(data.locale)} / 200 {data.characterLabel}</small>
              </label>
              <label className={styles.announcementBodyField}>
                <span>{data.announcementBodyLabel}</span>
                <textarea
                  maxLength={2_000}
                  onChange={(event) => setAnnouncementBody(event.currentTarget.value)}
                  placeholder={data.announcementBodyPlaceholder}
                  rows={4}
                  value={announcementBody}
                />
                <small>{announcementBody.length.toLocaleString(data.locale)} / 2,000 {data.characterLabel}</small>
              </label>
              <button
                disabled={announcementPending || !announcementTitle.trim() || !announcementBody.trim()}
                type="submit"
              >
                <Megaphone aria-hidden="true" />{data.publishAnnouncement}
              </button>
            </fieldset>
          </form>
          <p className={styles.announcementPrivacyNote}><ShieldCheck aria-hidden="true" />{data.announcementPrivacyNote}</p>
          {!data.announcementPublishingAvailable
            ? <p className={styles.formStatus} role="status">{data.announcementUnavailable}</p>
            : announcementStatus
              ? <p aria-live="polite" className={styles.formStatus} role="status">{announcementStatus}</p>
              : null}
        </section>

        <div className={styles.inboxLayout}>
          <aside aria-label={data.threadListLabel} className={styles.threadList}>
            <header><Inbox aria-hidden="true" /><strong>{data.threadListLabel}</strong>{unreadTotal ? <b>{unreadTotal}</b> : null}</header>
            {data.threads.map((thread) => {
              const state = threadState[thread.id]!;
              return (
                <button
                  aria-current={thread.id === selectedThread?.id ? 'true' : undefined}
                  className={!state.read ? styles.unreadThread : undefined}
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  type="button"
                >
                  <span aria-hidden="true">{thread.childLabel.slice(0, 1)}</span>
                  <div>
                    <strong>{thread.guardianLabel}</strong>
                    <small>{thread.childLabel} · {thread.gradeLabel}</small>
                    <p>{thread.subject}</p>
                  </div>
                  <div className={styles.threadFlags}>
                    {!state.read ? <i>{data.unreadLabel}</i> : null}
                    {state.closed ? <i>{data.closedLabel}</i> : null}
                  </div>
                </button>
              );
            })}
            {!data.threads.length ? <p>{data.noSelectionLabel}</p> : null}
          </aside>

          <section
            aria-label={selectedThread
              ? teacherThreadLabel(selectedThread)
              : data.noSelectionLabel}
            className={styles.conversationPanel}
          >
            {selectedThread && selectedState ? <>
            <header className={styles.conversationHeader}>
              <div><span>{selectedThread.childLabel} · {selectedThread.gradeLabel}</span><h2>{selectedThread.subject}</h2><p>{selectedThread.guardianLabel}</p></div>
              <div>
                {!selectedState.read ? (
                  <button disabled={pending} onClick={() => void runThreadAction(onMarkThreadReadAction, {read: true}, data.readAnnouncement)} type="button"><Check aria-hidden="true" />{data.markRead}</button>
                ) : null}
                {!selectedState.closed ? (
                  <button disabled={pending} onClick={() => void runThreadAction(onCloseThreadAction, {closed: true}, data.closedAnnouncement)} type="button">
                    <Check aria-hidden="true" />{data.closeThread}
                  </button>
                ) : null}
              </div>
            </header>

            <div className={styles.messageStream}>
              {selectedThread.messages.map((message) => (
                <article className={message.mine ? styles.mine : styles.theirs} key={message.id}>
                  <span>{message.senderLabel} · {message.sentAtLabel}</span>
                  <p>{message.body}</p>
                </article>
              ))}
              {selectedState.replies.map((reply, index) => (
                <article className={styles.mine} key={`${selectedThread.id}:local-reply:${index}`}>
                  <span>{data.localReplyLabel}</span><p>{reply}</p>
                </article>
              ))}
            </div>

            {selectedState.closed ? (
              <div className={styles.closedState}>
                <ShieldCheck aria-hidden="true" />
                <div><strong>{data.closedReadOnly}</strong><p>{data.newThreadHint}</p></div>
              </div>
            ) : (
              <form className={styles.composer} onSubmit={(event) => {event.preventDefault(); void addReply();}}>
                <label htmlFor={`teacher-reply-${selectedThread.id}`}>{data.replyLabel}</label>
                <textarea
                  id={`teacher-reply-${selectedThread.id}`}
                  maxLength={2_000}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setDrafts((current) => ({...current, [selectedThread.id]: value}));
                  }}
                  placeholder={data.replyPlaceholder}
                  rows={4}
                  value={drafts[selectedThread.id] ?? ''}
                />
                <div><small>{(drafts[selectedThread.id] ?? '').length.toLocaleString(data.locale)} / 2,000 {data.characterLabel}</small><button disabled={pending || !(drafts[selectedThread.id] ?? '').trim()} type="submit">{data.addReply}</button></div>
              </form>
            )}
            </> : (
              <div className={styles.closedState}>
                <Inbox aria-hidden="true" />
                <div><strong>{data.noSelectionLabel}</strong></div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function validDemoEmail(value: string): boolean {
  return /^[^@\s]{1,64}@[^@\s]{1,180}\.invalid$/iu.test(value.trim());
}

function validAuthorizedSyntheticEmail(value: string): boolean {
  const normalized = value.normalize('NFC').trim().toLowerCase();
  const separator = normalized.lastIndexOf('@');
  if (
    normalized.length > 254
    || separator < 1
    || normalized.slice(separator + 1) !== 'helpmath.invalid'
  ) return false;
  const localPart = normalized.slice(0, separator);
  return localPart.length <= 64
    && /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/u
      .test(localPart);
}

function validAuthorizedProductionEmail(value: string): boolean {
  const normalized = value.normalize('NFC').trim().toLowerCase();
  const separator = normalized.lastIndexOf('@');
  if (normalized.length > 254 || separator < 1) return false;
  const localPart = normalized.slice(0, separator);
  const domain = normalized.slice(separator + 1);
  if (
    localPart.length > 64
    || !/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/u
      .test(localPart)
    || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/u.test(domain)
  ) return false;
  return !(
    domain === 'example.com'
    || domain === 'example.net'
    || domain === 'example.org'
    || domain.endsWith('.example')
    || domain.endsWith('.invalid')
    || domain.endsWith('.localhost')
    || domain.endsWith('.test')
  );
}

export function AdminFamilyAccessDemo({
  data,
  onCreateInvitationAction,
  onResendInvitationAction,
  onRevokeInvitationAction,
  onRevokeLinkAction,
}: {
  data: AdminFamilyAccessDemoDto;
  onCreateInvitationAction?: (
    childId: string,
    email: string,
    clientMutationId: string,
  ) => Promise<{
    ok: boolean;
    data?: {expiresAt: string; invitationId: string};
  }>;
  onResendInvitationAction?: (
    invitationId: string,
    clientMutationId: string,
  ) => Promise<{
    ok: boolean;
    data?: {expiresAt: string; invitationId: string};
  }>;
  onRevokeInvitationAction?: (
    invitationId: string,
    clientMutationId: string,
  ) => Promise<{ok: boolean}>;
  onRevokeLinkAction?: (
    guardianLinkId: string,
    clientMutationId: string,
  ) => Promise<{ok: boolean}>;
}) {
  const [invitations, setInvitations] = useState<AdminFamilyInvitation[]>(() => [...data.invitations]);
  const [childId, setChildId] = useState(data.children[0]!.id);
  const [email, setEmail] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [localInvitationIds, setLocalInvitationIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const emailIsValid = data.invitationCreationEnabled
    && (data.invitationRecipientPolicy === 'demo-invalid'
      ? validDemoEmail(email)
      : data.invitationRecipientPolicy === 'synthetic-invalid-only'
        ? validAuthorizedSyntheticEmail(email)
        : data.invitationRecipientPolicy === 'school-verified-production'
          ? validAuthorizedProductionEmail(email)
          : false);

  const createInvitation = async () => {
    setAttempted(true);
    if (!data.invitationCreationEnabled || !emailIsValid) return;
    const child = data.children.find((candidate) => candidate.id === childId) ?? data.children[0]!;
    const normalizedEmail = email.trim().toLowerCase();
    setPendingId('create');
    let invitationId = crypto.randomUUID();
    let expiresAt: string | null = null;
    try {
      if (onCreateInvitationAction) {
        const result = await onCreateInvitationAction(
          child.id,
          normalizedEmail,
          `admin-invitation:${crypto.randomUUID()}`,
        );
        if (!result.ok || !result.data) {
          setAnnouncement(data.actionFailed);
          return;
        }
        invitationId = result.data.invitationId;
        expiresAt = result.data.expiresAt;
      }
    } finally {
      setPendingId(null);
    }
    setInvitations((current) => [{
      id: invitationId,
      childId: child.id,
      childDisplayName: child.displayName,
      gradeLabel: child.gradeLabel,
      guardianLabel: normalizedEmail,
      destinationLabel: normalizedEmail,
      status: 'pending',
      statusLabel: data.pendingLabel,
      expiresLabel: expiresAt
        ? new Intl.DateTimeFormat(data.locale === 'es' ? 'es-US' : 'en-US', {
            dateStyle: 'medium',
            timeZone: 'UTC',
          }).format(new Date(expiresAt))
        : (data.locale === 'es' ? '6 sep de 2026' : 'Sep 6, 2026'),
    }, ...current]);
    if (!onCreateInvitationAction) {
      setLocalInvitationIds((current) => new Set(current).add(invitationId));
    }
    setEmail('');
    setAttempted(false);
    setAnnouncement(data.invitationCreated);
  };

  const resendInvitation = async (invitation: AdminFamilyInvitation) => {
    if (invitation.status !== 'pending') return;
    setPendingId(invitation.id);
    let expiresAt: string | null = null;
    try {
      if (!data.synthetic && !onResendInvitationAction) {
        setAnnouncement(data.actionFailed);
        return;
      }
      if (onResendInvitationAction) {
        const result = await onResendInvitationAction(
          invitation.id,
          `admin-invitation-resend:${crypto.randomUUID()}`,
        );
        if (!result.ok || !result.data) {
          setAnnouncement(data.actionFailed);
          return;
        }
        expiresAt = result.data.expiresAt;
      }
    } finally {
      setPendingId(null);
    }
    if (expiresAt) {
      const expiresLabel = new Intl.DateTimeFormat(
        data.locale === 'es' ? 'es-US' : 'en-US',
        {dateStyle: 'medium', timeZone: 'UTC'},
      ).format(new Date(expiresAt));
      setInvitations((current) => current.map((candidate) => (
        candidate.id === invitation.id ? {...candidate, expiresLabel} : candidate
      )));
    }
    setAnnouncement(data.resentAnnouncement);
  };

  const revokeAccess = async (invitation: AdminFamilyInvitation) => {
    if (invitation.status === 'revoked') return;
    const localSyntheticInvitation = data.synthetic
      && localInvitationIds.has(invitation.id);
    setPendingId(invitation.id);
    try {
      if (
        !data.synthetic
        && (
          (invitation.status === 'accepted' && !onRevokeLinkAction)
          || (invitation.status !== 'accepted' && !onRevokeInvitationAction)
        )
      ) {
        setAnnouncement(data.actionFailed);
        return;
      }
      const result = localSyntheticInvitation
        ? undefined
        : invitation.status === 'accepted' && invitation.guardianLinkId
          ? await onRevokeLinkAction?.(
              invitation.guardianLinkId,
              `admin-link-revoke:${crypto.randomUUID()}`,
            )
          : await onRevokeInvitationAction?.(
              invitation.id,
              `admin-invite-revoke:${crypto.randomUUID()}`,
            );
      if (result && !result.ok) {
        setAnnouncement(data.actionFailed);
        return;
      }
    } finally {
      setPendingId(null);
    }
    setInvitations((current) => current.map((candidate) => candidate.id === invitation.id
      ? {
          ...candidate,
          status: 'revoked',
          statusLabel: data.revokedLabel,
          expiresLabel: data.synthetic
            ? (data.locale === 'es'
              ? 'Revocada en el entorno sintético'
              : 'Revoked in the synthetic environment')
            : data.revokedLabel,
        }
      : candidate));
    if (localSyntheticInvitation) {
      setLocalInvitationIds((current) => {
        const next = new Set(current);
        next.delete(invitation.id);
        return next;
      });
    }
    setAnnouncement(data.revokedAnnouncement);
  };

  return (
    <div
      className={styles.companion}
      data-family-companion="admin-family-access"
      data-family-data-mode={data.synthetic ? 'synthetic' : 'authorized'}
    >
      <CompanionHeader href="/admin/family-access" locale={data.locale} tenantLabel={data.tenant.displayName} workspaceLabel={data.workspaceLabel} />
      <main className={styles.main} id="main-content">
        <PageHeading intro={data.intro} title={data.title} />
        <Link className={styles.primaryLink} href="/admin/family-operations">
          {data.locale === 'es' ? 'Abrir operaciones familiares' : 'Open family operations'}
          <ChevronRight aria-hidden="true" />
        </Link>
        <SyntheticBoundary badge={data.syntheticBadge} body={data.syntheticBody} synthetic={data.synthetic} title={data.syntheticTitle} />
        <p aria-atomic="true" aria-live="polite" className={styles.srOnly}>{announcement}</p>

        <div className={styles.adminGrid}>
          <section className={styles.adminCard}>
            <header><span><MailPlus aria-hidden="true" /></span><div><h2>{data.createTitle}</h2><p>{data.createIntro}</p></div></header>
            {data.invitationCreationEnabled ? <form onSubmit={(event) => {event.preventDefault(); void createInvitation();}}>
              <label htmlFor="admin-family-child">{data.childLabel}</label>
              <select id="admin-family-child" onChange={(event) => setChildId(event.currentTarget.value)} value={childId}>
                {data.children.map((child) => <option key={child.id} value={child.id}>{child.displayName} · {child.gradeLabel}</option>)}
              </select>
              <label htmlFor="admin-family-email">{data.adultEmailLabel}</label>
              <input
                aria-describedby="admin-family-email-hint admin-family-email-error"
                aria-invalid={attempted && !emailIsValid}
                autoComplete="off"
                id="admin-family-email"
                inputMode="email"
                onChange={(event) => setEmail(event.currentTarget.value)}
                placeholder={data.adultEmailPlaceholder}
                type="email"
                value={email}
              />
              <small id="admin-family-email-hint">{data.adultEmailHint}</small>
              <p className={styles.formError} id="admin-family-email-error">{attempted && !emailIsValid ? data.invalidEmailLabel : ''}</p>
              <button disabled={pendingId === 'create'} type="submit"><MailPlus aria-hidden="true" />{data.createInvitation}</button>
            </form> : <p className={styles.formError}>{data.invitationCreationUnavailable}</p>}
          </section>

          <section className={`${styles.adminCard} ${styles.accessCard}`}>
            <header><span><Users aria-hidden="true" /></span><div><h2>{data.accessListTitle}</h2><p>{data.accessListIntro}</p></div></header>
            <div className={styles.accessList}>
              {invitations.map((invitation) => (
                <article key={invitation.id}>
                  <span aria-hidden="true" className={styles.accessAvatar}>{invitation.childDisplayName.slice(0, 1)}</span>
                  <div className={styles.accessIdentity}>
                    <strong>{invitation.guardianLabel}</strong>
                    <small>{invitation.childDisplayName} · {invitation.gradeLabel}</small>
                    <p>{invitation.destinationLabel}</p>
                  </div>
                  <div className={styles.accessStatus}>
                    <span data-status={invitation.status}>{invitation.statusLabel}</span>
                    <small>{invitation.status === 'pending' ? `${data.expiresPrefix} ${invitation.expiresLabel}` : invitation.expiresLabel}</small>
                  </div>
                  {invitation.status !== 'revoked' ? (
                    <div className={styles.accessActions}>
                      {invitation.status === 'pending'
                        && (data.synthetic || onResendInvitationAction) ? (
                          <button disabled={pendingId === invitation.id} onClick={() => void resendInvitation(invitation)} type="button">
                            <MailPlus aria-hidden="true" />{data.resend}
                          </button>
                        ) : null}
                      <button disabled={pendingId === invitation.id} onClick={() => void revokeAccess(invitation)} type="button">
                        <UserRoundX aria-hidden="true" />{data.revoke}
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

const INVITATION_TOKEN_STORAGE_KEY = 'help_math:family-invitation-token:v1';

export function FamilyInvitationAcceptDemo({
  data,
  onAcceptAction,
  onDeclineAction,
  signedIn = false,
}: {
  data: FamilyInvitationAcceptDemoDto;
  onAcceptAction?: (
    token: string,
    clientMutationId: string,
  ) => Promise<{ok: boolean}>;
  onDeclineAction?: (
    token: string,
    clientMutationId: string,
  ) => Promise<{ok: boolean}>;
  signedIn?: boolean;
}) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [outcome, setOutcome] = useState<'ready' | 'accepted' | 'declined'>('ready');
  const [tokenReady, setTokenReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const signInReturnPath = data.locale === 'es'
    ? '/es/family/invitations/accept'
    : '/family/invitations/accept';
  const signInParameters = new URLSearchParams({
    redirect_url: signInReturnPath,
  });
  const signInHref = `/sign-in?${signInParameters.toString()}`;

  useEffect(() => {
    let available = false;
    try {
      const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const fragmentToken = fragment.get('token')?.trim();
      if (fragmentToken) window.sessionStorage.setItem(INVITATION_TOKEN_STORAGE_KEY, fragmentToken);
      available = Boolean(window.sessionStorage.getItem(INVITATION_TOKEN_STORAGE_KEY));
    } catch {
      available = false;
    } finally {
      window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${window.location.search}`,
      );
    }
    queueMicrotask(() => setTokenReady(available));
  }, []);

  useLayoutEffect(() => {
    if (outcome === 'ready') return;
    try {
      window.sessionStorage.removeItem(INVITATION_TOKEN_STORAGE_KEY);
    } catch {
      // There is no persistent fallback for an invitation secret.
    }
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.search}`,
    );
  }, [outcome]);

  const clearStoredToken = () => {
    try {
      window.sessionStorage.removeItem(INVITATION_TOKEN_STORAGE_KEY);
    } catch {
      // There is no persistent fallback for an invitation secret.
    }
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.search}`,
    );
    router.replace(
      `${window.location.pathname}${window.location.search}`,
      {scroll: false},
    );
    setTokenReady(false);
  };

  const acceptInvitation = async () => {
    setError('');
    setSubmitting(true);
    try {
      const token = window.sessionStorage.getItem(INVITATION_TOKEN_STORAGE_KEY);
      if (!token) {
        setTokenReady(false);
        return;
      }
      const result = onAcceptAction
        ? await onAcceptAction(
            token,
            `family-accept:${crypto.randomUUID()}`,
          )
        : {ok: true};
      if (!result.ok) {
        setError(data.acceptError);
        return;
      }
      clearStoredToken();
      setOutcome('accepted');
    } catch {
      setError(data.acceptError);
    } finally {
      setSubmitting(false);
    }
  };

  const declineInvitation = async () => {
    setError('');
    setSubmitting(true);
    try {
      const token = window.sessionStorage.getItem(INVITATION_TOKEN_STORAGE_KEY);
      if (!token) {
        setTokenReady(false);
        return;
      }
      const result = onDeclineAction
        ? await onDeclineAction(token, `family-decline:${crypto.randomUUID()}`)
        : {ok: true};
      if (!result.ok) {
        setError(data.acceptError);
        return;
      }
      clearStoredToken();
      setOutcome('declined');
    } catch {
      setError(data.acceptError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.companion} data-family-companion="invitation-accept">
      <CompanionHeader href="/family/invitations/accept" locale={data.locale} workspaceLabel={data.workspaceLabel} />
      <main className={`${styles.main} ${styles.acceptMain}`} id="main-content">
        <SyntheticBoundary badge={data.syntheticBadge} body={data.syntheticBody} synthetic={data.synthetic} title={data.workspaceLabel} />
        {!signedIn ? (
          <section className={styles.outcomeCard}>
            <KeyRound aria-hidden="true" />
            <h1>{data.signInTitle}</h1>
            <p>{data.signInBody}</p>
            <Link className={styles.primaryLink} href={signInHref}>{data.signInLabel}<ChevronRight aria-hidden="true" /></Link>
          </section>
        ) : outcome !== 'ready' ? (
          <section aria-live="polite" className={styles.outcomeCard}>
            {outcome === 'accepted' ? <UserRoundCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
            <h1>{outcome === 'accepted' ? data.acceptedTitle : data.declinedTitle}</h1>
            <p>{outcome === 'accepted' ? data.acceptedBody : data.declinedBody}</p>
          </section>
        ) : !tokenReady ? (
          <section aria-live="polite" className={styles.outcomeCard}>
            <CircleAlert aria-hidden="true" />
            <h1>{data.tokenMissingTitle}</h1>
            <p>{data.tokenMissingBody}</p>
          </section>
        ) : (
          <>
            <PageHeading intro={data.intro} title={data.title} />
            <section className={styles.invitationCard}>
              <div className={styles.invitationIdentity}>
                <span aria-hidden="true"><UserRoundCheck /></span>
                <div><small>{data.syntheticBadge}</small><h2>{data.readyTitle}</h2><p>{data.readyBody}</p></div>
              </div>
              <aside className={styles.safetyPanel}>
                <ShieldCheck aria-hidden="true" />
                <div><h3>{data.safetyTitle}</h3><ul>{data.safetyPoints.map((point) => <li key={point}>{point}</li>)}</ul></div>
              </aside>
              <label className={styles.confirmation}>
                <input checked={confirmed} onChange={(event) => setConfirmed(event.currentTarget.checked)} type="checkbox" />
                <span><Check aria-hidden="true" /></span>
                <strong>{data.confirmationLabel}</strong>
              </label>
              <div className={styles.invitationActions}>
                <button disabled={!confirmed || submitting} onClick={() => void acceptInvitation()} type="button"><KeyRound aria-hidden="true" />{submitting ? data.submittingLabel : data.acceptLabel}</button>
                <button disabled={submitting} onClick={() => void declineInvitation()} type="button"><UserRoundX aria-hidden="true" />{data.declineLabel}</button>
              </div>
              <p aria-live="polite" className={styles.acceptError}>{error}</p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
