'use client';

import type {LucideIcon} from 'lucide-react';
import type {ReactNode} from 'react';
import {
  BellRing,
  BookOpenCheck,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  Home,
  Languages,
  Mail,
  Moon,
  Palette,
  Printer,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import {useRouter} from 'next/navigation';
import {useEffect, useMemo, useState} from 'react';

import {Link} from '@/i18n/navigation';
import type {
  FamilyPortalUiDto,
  FamilyPortalView,
  FamilySelectedChild,
  FamilySignalTone,
} from '@/lib/family/family-demo-data';
import {
  FAMILY_MESSAGE_TOPICS,
  type FamilyAssignmentStatus,
  type FamilyMessageTopic,
} from '@/lib/family/types';

import styles from './family-portal.module.css';

type Theme = 'light' | 'dark';
type AssignmentFilter = 'all' | 'due-soon' | 'completed';
type MessageFilter = 'all' | 'open' | 'closed';
type MessageState = Record<string, {read: boolean; closed: boolean; replies: readonly string[]}>;
type CreateFamilyThreadAction = (
  childId: string,
  enrollmentId: string,
  staffUserId: string,
  topic: FamilyMessageTopic,
  body: string,
  clientMutationId: string,
) => Promise<{ok: boolean; data?: {threadId: string}}>;

const THEME_STORAGE_KEY = 'helpmath:family-workspace-theme:v1';

const VIEW_ICONS: Readonly<Record<FamilyPortalView, LucideIcon>> = {
  overview: Home,
  progress: TrendingUp,
  assignments: ClipboardCheck,
  messages: Mail,
  settings: Settings,
};

const STAT_ICONS: Readonly<Record<FamilySignalTone, LucideIcon>> = {
  blue: Clock3,
  mint: BookOpenCheck,
  sun: ClipboardCheck,
  grape: Mail,
};

function familyHref(view: FamilyPortalView): string {
  const parameters = new URLSearchParams({view});
  return `/family?${parameters.toString()}`;
}

function initialMessageState(child: FamilySelectedChild): MessageState {
  return Object.fromEntries(
    child.messages.map((message) => [
      message.id,
      {read: message.initiallyRead, closed: message.initiallyClosed, replies: []},
    ]),
  );
}

function readThemePreference(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function storeThemePreference(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The theme still applies for this visit when storage is unavailable.
  }
}

function ProgressMeter({
  label,
  percent,
}: {
  label: string;
  percent: number;
}) {
  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={percent}
      className={styles.progressTrack}
      role="progressbar"
    >
      <span style={{width: `${percent}%`}} />
    </div>
  );
}

function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: FamilySignalTone | FamilyAssignmentStatus | 'neutral' | 'closed';
}) {
  const toneClass: Record<typeof tone, string> = {
    blue: styles.pillBlue,
    mint: styles.pillMint,
    sun: styles.pillSun,
    grape: styles.pillGrape,
    not_started: styles.pillBlue,
    in_progress: styles.pillSun,
    completed: styles.pillMint,
    overdue: styles.pillSun,
    neutral: styles.pillNeutral,
    closed: styles.pillNeutral,
  };
  return <span className={`${styles.pill} ${toneClass[tone]}`}>{children}</span>;
}

function ScreenHeader({
  data,
  view,
}: {
  data: FamilyPortalUiDto;
  view: FamilyPortalView;
}) {
  return (
    <header className={styles.screenHeader}>
      <p>{data.snapshotLabel}</p>
      <h1>{data.copy.screenTitles[view]}</h1>
      <span>{data.copy.screenIntros[view]}</span>
    </header>
  );
}

function DemoBoundary({data}: {data: FamilyPortalUiDto}) {
  return (
    <aside
      className={styles.demoBanner}
      data-family-access-boundary
      data-family-demo-boundary={data.synthetic ? 'true' : undefined}
      role="note"
    >
      <span aria-hidden="true" className={styles.demoIcon}><ShieldCheck /></span>
      <div>
        <strong><span>{data.copy.syntheticBadge}</span>{data.copy.syntheticTitle}</strong>
        <p>{data.copy.syntheticBody}</p>
      </div>
    </aside>
  );
}

function RecordNotice({data}: {data: FamilyPortalUiDto}) {
  return (
    <aside className={styles.recordNotice} role="note">
      <FileText aria-hidden="true" />
      <div>
        <strong>{data.copy.recordNoticeTitle}</strong>
        <p>{data.copy.recordNoticeBody}</p>
      </div>
    </aside>
  );
}

function OverviewScreen({
  data,
  messageState,
  onCreateThreadAction,
}: {
  data: FamilyPortalUiDto;
  messageState: MessageState;
  onCreateThreadAction?: CreateFamilyThreadAction;
}) {
  const {copy, selectedChild: child} = data;
  const [replyingAnnouncementId, setReplyingAnnouncementId] = useState<string | null>(null);
  const [replyContactKey, setReplyContactKey] = useState('');
  const [replyDraft, setReplyDraft] = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [replyPending, setReplyPending] = useState(false);
  const primaryCourse = child.courses[0];
  const latestMessage = child.messages[0];
  const latestState = latestMessage
    ? messageState[latestMessage.id] ?? {
        closed: latestMessage.initiallyClosed,
        read: latestMessage.initiallyRead,
        replies: [],
      }
    : undefined;
  const contacts = data.messageContacts.filter((contact) => (
    contact.childId === child.id
  ));

  const openPrivateReply = (announcementId: string) => {
    const contact = contacts[0];
    if (!contact) return;
    setReplyingAnnouncementId(announcementId);
    setReplyContactKey(`${contact.enrollmentId}:${contact.staffUserId}`);
    setReplyDraft('');
    setReplyStatus('');
  };

  const closePrivateReply = () => {
    setReplyingAnnouncementId(null);
    setReplyContactKey('');
    setReplyDraft('');
    setReplyStatus('');
  };

  const sendPrivateReply = async () => {
    const contact = contacts.find((candidate) => (
      `${candidate.enrollmentId}:${candidate.staffUserId}` === replyContactKey
    ));
    const body = replyDraft.normalize('NFC').trim();
    if (!contact || !body || !replyingAnnouncementId) return;
    setReplyPending(true);
    setReplyStatus('');
    try {
      if (!data.synthetic) {
        if (!onCreateThreadAction) {
          setReplyStatus(copy.overview.privateReplyUnavailable);
          return;
        }
        const result = await onCreateThreadAction(
          child.id,
          contact.enrollmentId,
          contact.staffUserId,
          'other',
          body,
          `announcement-private-reply:${crypto.randomUUID()}`,
        );
        if (!result.ok || !result.data?.threadId) {
          setReplyStatus(copy.messages.actionFailed);
          return;
        }
      }
      setReplyDraft('');
      setReplyStatus(copy.overview.privateReplySent);
    } finally {
      setReplyPending(false);
    }
  };

  return (
    <>
      <ScreenHeader data={data} view="overview" />
      <section className={styles.welcomeCard}>
        <span aria-hidden="true" className={styles.largeAvatar}>{child.initials}</span>
        <div>
          <span className={styles.eyebrow}>{child.gradeLabel} · {child.programLabel}</span>
          <h2>{child.greeting}</h2>
          <p>{child.overviewIntro}</p>
        </div>
      </section>

      <section aria-label={copy.overview.snapshotLabel} className={styles.statGrid}>
        {child.stats.map((stat) => {
          const Icon = STAT_ICONS[stat.tone] ?? Sparkles;
          return (
            <article className={`${styles.statCard} ${styles[`tone${stat.tone[0]!.toUpperCase()}${stat.tone.slice(1)}`]}`} key={stat.id}>
              <span aria-hidden="true" className={styles.statIcon}><Icon /></span>
              <div><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.detail}</small></div>
            </article>
          );
        })}
      </section>

      <div className={styles.overviewGrid}>
        {primaryCourse ? <section className={`${styles.panel} ${styles.coursePanel}`}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.eyebrow}>{copy.overview.activityTitle}</span>
              <h2>{primaryCourse.title}</h2>
            </div>
            <strong className={styles.percentValue}>{primaryCourse.completionPercent}%</strong>
          </div>
          <p className={styles.panelIntro}>{copy.overview.activityIntro}</p>
          <ProgressMeter label={`${primaryCourse.title}: ${primaryCourse.completionPercent}%`} percent={primaryCourse.completionPercent} />
          <div className={styles.courseMeta}>
            <span>{primaryCourse.unitLabel}</span>
            <span>{primaryCourse.completionLabel}</span>
          </div>
          <div className={styles.conversationPrompt}>
            <Sparkles aria-hidden="true" />
            <div><strong>{copy.overview.askTogetherLabel}</strong><p>{primaryCourse.nextConversationPrompt}</p></div>
          </div>
        </section> : (
          <section className={`${styles.panel} ${styles.coursePanel}`}>
            <div className={styles.emptyState}>
              <TrendingUp aria-hidden="true" />
              <h2>{copy.progress.coursesTitle}</h2>
              <p>{copy.progress.signalsIntro}</p>
            </div>
          </section>
        )}

        <section className={`${styles.panel} ${styles.signalPanel}`}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.eyebrow}>{copy.overview.learningSignalsTitle}</span>
              <h2>{copy.progress.signalsTitle}</h2>
            </div>
          </div>
          <p className={styles.panelIntro}>{copy.overview.learningSignalsIntro}</p>
          <div className={styles.compactSignalList}>
            {child.skills.slice(0, 3).map((skill) => (
              <div className={styles.compactSignal} key={skill.id}>
                <span aria-hidden="true" className={`${styles.signalDot} ${styles[`dot${skill.tone[0]!.toUpperCase()}${skill.tone.slice(1)}`]}`} />
                <div><strong>{skill.label}</strong><small>{skill.evidenceLabel}</small></div>
                <StatusPill tone={skill.tone}>{skill.levelLabel}</StatusPill>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.eyebrow}>{copy.overview.upcomingTitle}</span>
              <h2>{copy.screenTitles.assignments}</h2>
            </div>
          </div>
          <p className={styles.panelIntro}>{copy.overview.upcomingIntro}</p>
          <div className={styles.previewList}>
            {child.assignments.filter((assignment) => assignment.status !== 'completed').slice(0, 2).map((assignment) => (
              <article key={assignment.id}>
                <span className={styles.dateTile}>{assignment.dueLabel}</span>
                <div><strong>{assignment.title}</strong><small>{assignment.courseLabel}</small></div>
                <StatusPill tone={assignment.status}>{assignment.statusLabel}</StatusPill>
              </article>
            ))}
          </div>
        </section>

        {latestMessage ? (
          <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.eyebrow}>{copy.overview.latestMessageTitle}</span>
              <h2>{latestMessage.subject}</h2>
            </div>
            {latestState && !latestState.read ? <StatusPill tone="grape">{copy.messages.unreadLabel}</StatusPill> : null}
          </div>
          <p className={styles.messageSender}>{latestMessage.senderLabel} · {latestMessage.sentAtLabel}</p>
          <p className={styles.messageBody}>{latestMessage.body}</p>
          <Link className={styles.textLink} href={familyHref('messages')}>
            {copy.overview.viewMessages}<ChevronRight aria-hidden="true" />
          </Link>
          </section>
        ) : (
          <section className={styles.panel}>
            <div className={styles.emptyState}>
              <Mail aria-hidden="true" />
              <h2>{copy.messages.noMessagesTitle}</h2>
              <p>{copy.messages.noMessagesBody}</p>
            </div>
          </section>
        )}
        {child.announcements.length ? (
          <section className={`${styles.panel} ${styles.announcementPanel}`}>
            <div className={styles.panelHeading}>
              <div>
                <span className={styles.eyebrow}>{copy.overview.announcementsTitle}</span>
                <h2>{child.announcements[0]!.title}</h2>
              </div>
            </div>
            <p className={styles.panelIntro}>{copy.overview.announcementsIntro}</p>
            <ol className={styles.announcementList}>
              {child.announcements.map((item) => (
                <li key={item.id}>
                  <div><strong>{item.title}</strong><time>{item.publishedAtLabel}</time></div>
                  <p>{item.body}</p>
                  <small>{item.publisherLabel}</small>
                  {contacts.length ? <>
                    <button
                      aria-expanded={replyingAnnouncementId === item.id}
                      className={styles.announcementReplyButton}
                      disabled={!data.synthetic && !onCreateThreadAction}
                      onClick={() => (
                        replyingAnnouncementId === item.id
                          ? closePrivateReply()
                          : openPrivateReply(item.id)
                      )}
                      type="button"
                    >
                      <Mail aria-hidden="true" />{copy.overview.replyPrivately}
                    </button>
                    {replyingAnnouncementId === item.id ? (
                      <form className={styles.announcementReplyForm} onSubmit={(event) => {
                        event.preventDefault();
                        void sendPrivateReply();
                      }}>
                        <p>{copy.overview.replyPrivateIntro}</p>
                        <label>
                          <span>{copy.overview.replyContactLabel}</span>
                          <select
                            disabled={replyPending}
                            onChange={(event) => setReplyContactKey(event.currentTarget.value)}
                            value={replyContactKey}
                          >
                            {contacts.map((contact) => (
                              <option
                                key={`${contact.enrollmentId}:${contact.staffUserId}`}
                                value={`${contact.enrollmentId}:${contact.staffUserId}`}
                              >
                                {contact.staffDisplayName}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>{copy.overview.replyMessageLabel}</span>
                          <textarea
                            disabled={replyPending}
                            maxLength={2_000}
                            onChange={(event) => setReplyDraft(event.currentTarget.value)}
                            placeholder={copy.overview.replyMessagePlaceholder}
                            rows={4}
                            value={replyDraft}
                          />
                        </label>
                        <div>
                          <small>{replyDraft.length.toLocaleString(data.locale)} / 2,000 {copy.messages.characterLimitLabel}</small>
                          <button
                            className={styles.announcementReplyCancel}
                            disabled={replyPending}
                            onClick={closePrivateReply}
                            type="button"
                          >
                            {copy.overview.cancelPrivateReply}
                          </button>
                          <button disabled={replyPending || !replyDraft.trim()} type="submit">
                            {copy.overview.sendPrivateReply}
                          </button>
                        </div>
                        {replyStatus ? <p aria-live="polite" className={styles.announcementReplyStatus} role="status">{replyStatus}</p> : null}
                      </form>
                    ) : null}
                  </> : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </>
  );
}

function ProgressScreen({data}: {data: FamilyPortalUiDto}) {
  const {copy, selectedChild: child} = data;
  return (
    <>
      <ScreenHeader data={data} view="progress" />
      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeading}>
          <div><span className={styles.eyebrow}>{child.gradeLabel}</span><h2>{copy.progress.coursesTitle}</h2></div>
        </div>
        <div className={styles.courseList}>
          {child.courses.map((course) => (
            <article className={styles.courseRow} key={course.id}>
              <div className={styles.courseRowTop}>
                <div><h3>{course.title}</h3><p>{course.unitLabel}</p></div>
                <strong>{course.completionPercent}%</strong>
              </div>
              <ProgressMeter label={`${course.title}: ${course.completionPercent}%`} percent={course.completionPercent} />
              <div className={styles.courseMeta}>
                <span>{course.completionLabel}</span>
                <span>{course.lastActivityLabel}</span>
              </div>
              <div className={styles.inlinePrompt}>
                <strong>{copy.overview.askTogetherLabel}</strong><span>{course.nextConversationPrompt}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeading}>
          <div><span className={styles.eyebrow}>{copy.progress.evidenceLabel}</span><h2>{copy.progress.signalsTitle}</h2><p>{copy.progress.signalsIntro}</p></div>
        </div>
        <div className={styles.skillGrid}>
          {child.skills.map((skill) => (
            <article className={styles.skillCard} data-band={skill.band} key={skill.id}>
              <div className={styles.skillCardTop}>
                <span aria-hidden="true" className={`${styles.signalDot} ${styles[`dot${skill.tone[0]!.toUpperCase()}${skill.tone.slice(1)}`]}`} />
                <StatusPill tone={skill.tone}>{skill.levelLabel}</StatusPill>
              </div>
              <h3>{skill.label}</h3>
              <p>{skill.evidenceLabel}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.sectionBlock} ${styles.evidenceMetadata}`}>
        <div className={styles.evidenceMetaGrid}>
          <div><span>{copy.progress.computedAtLabel}</span><strong>{child.progressEvidence.computedAtLabel}</strong></div>
          <div><span>{copy.progress.projectionLabel}</span><strong>{child.progressEvidence.projectionVersion}</strong></div>
          <div><span>{copy.progress.releaseLabel}</span><strong>{child.progressEvidence.releaseVersion}</strong></div>
          <div data-stale={child.progressEvidence.stale}>
            <span>{copy.progress.statusLabel}</span><strong>{child.progressEvidence.statusLabel}</strong>
          </div>
        </div>
        <div className={styles.whyStatus}>
          <ShieldCheck aria-hidden="true" />
          <div><strong>{copy.progress.whyStatusTitle}</strong><p>{child.progressEvidence.whyStatusLabel}</p></div>
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeading}><div><h2>{copy.progress.recentTitle}</h2></div></div>
        <ol className={styles.timeline}>
          {child.recentActivity.map((activity) => (
            <li key={activity.id}>
              <span aria-hidden="true" />
              <div><time>{activity.dateLabel}</time><strong>{activity.title}</strong><p>{activity.detail}</p></div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

function AssignmentsScreen({data}: {data: FamilyPortalUiDto}) {
  const {copy, selectedChild: child} = data;
  const [filter, setFilter] = useState<AssignmentFilter>('all');
  const assignments = child.assignments.filter((assignment) => {
    if (filter === 'all') return true;
    if (filter === 'due-soon') return assignment.status !== 'completed';
    return assignment.status === 'completed';
  });

  const filters: readonly {id: AssignmentFilter; label: string}[] = [
    {id: 'all', label: copy.assignments.allFilter},
    {id: 'due-soon', label: copy.assignments.dueSoonFilter},
    {id: 'completed', label: copy.assignments.submittedFilter},
  ];

  return (
    <>
      <ScreenHeader data={data} view="assignments" />
      <div aria-label={copy.assignments.filterLabel} className={styles.segmentedControl} role="group">
        {filters.map((item) => (
          <button aria-pressed={filter === item.id} key={item.id} onClick={() => setFilter(item.id)} type="button">
            {item.label}
          </button>
        ))}
      </div>
      {assignments.length ? (
        <section aria-live="polite" className={styles.assignmentList}>
          {assignments.map((assignment) => (
            <article className={styles.assignmentCard} key={assignment.id}>
              <div className={styles.assignmentDate}>
                <CalendarMark />
                <span>{copy.assignments.dueLabel}</span>
                <strong>{assignment.dueLabel}</strong>
              </div>
              <div className={styles.assignmentDetails}>
                <div><StatusPill tone={assignment.status}>{assignment.statusLabel}</StatusPill><span>{assignment.courseLabel}</span></div>
                <h2>{assignment.title}</h2>
                <p><strong>{copy.assignments.familyNoteLabel}:</strong> {assignment.familyNote}</p>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div aria-live="polite" className={styles.emptyState}>
          <ClipboardCheck aria-hidden="true" />
          <h2>{copy.assignments.emptyTitle}</h2>
          <p>{copy.assignments.emptyBody}</p>
        </div>
      )}
    </>
  );
}

function CalendarMark() {
  return <span aria-hidden="true" className={styles.calendarMark}><span /><span /><strong>✓</strong></span>;
}

function MessagesScreen({
  data,
  messageState,
  onCreateThreadAction,
  onCloseThreadAction,
  onMarkThreadReadAction,
  onSendMessageAction,
  setMessageState,
}: {
  data: FamilyPortalUiDto;
  messageState: MessageState;
  onCreateThreadAction?: CreateFamilyThreadAction;
  onCloseThreadAction?: (
    threadId: string,
    clientMutationId: string,
  ) => Promise<{ok: boolean}>;
  onMarkThreadReadAction?: (
    threadId: string,
    clientMutationId: string,
  ) => Promise<{ok: boolean}>;
  onSendMessageAction?: (
    threadId: string,
    body: string,
    clientMutationId: string,
  ) => Promise<{ok: boolean}>;
  setMessageState: React.Dispatch<React.SetStateAction<MessageState>>;
}) {
  const router = useRouter();
  const {copy, selectedChild: child} = data;
  const [filter, setFilter] = useState<MessageFilter>('all');
  const [announcement, setAnnouncement] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [pendingThreadId, setPendingThreadId] = useState<string | null>(null);
  const [pendingNewThread, setPendingNewThread] = useState(false);
  const [newThreadContact, setNewThreadContact] = useState(() => {
    const contact = data.messageContacts[0];
    return contact ? `${contact.enrollmentId}:${contact.staffUserId}` : '';
  });
  const [newThreadTopic, setNewThreadTopic] = useState<FamilyMessageTopic>('assignment');
  const [newThreadBody, setNewThreadBody] = useState('');
  const stateFor = (message: FamilySelectedChild['messages'][number]) => (
    messageState[message.id] ?? {
      closed: message.initiallyClosed,
      read: message.initiallyRead,
      replies: [],
    }
  );
  const messages = child.messages.filter((message) => {
    const state = stateFor(message);
    if (filter === 'all') return true;
    return filter === 'closed' ? state.closed : !state.closed;
  });
  const filters: readonly {id: MessageFilter; label: string}[] = [
    {id: 'all', label: copy.messages.allFilter},
    {id: 'open', label: copy.messages.openFilter},
    {id: 'closed', label: copy.messages.closedFilter},
  ];

  const updateMessage = (id: string, update: Partial<MessageState[string]>, nextAnnouncement: string) => {
    const message = child.messages.find((item) => item.id === id);
    if (!message) return;
    setMessageState((current) => ({
      ...current,
      [id]: {...stateFor(message), ...update},
    }));
    setAnnouncement(nextAnnouncement);
  };

  const addReply = async (id: string) => {
    const body = (drafts[id] ?? '').normalize('NFC').trim().slice(0, 2_000);
    const message = child.messages.find((item) => item.id === id);
    if (!body || !message || stateFor(message).closed) return;
    setPendingThreadId(id);
    try {
      if (!onSendMessageAction && !data.synthetic) {
        setAnnouncement(copy.messages.actionFailed);
        return;
      }
      if (onSendMessageAction) {
        const result = await onSendMessageAction(
          id,
          body,
          `family-message:${crypto.randomUUID()}`,
        );
        if (!result.ok) {
          setAnnouncement(copy.messages.actionFailed);
          return;
        }
      }
    } finally {
      setPendingThreadId(null);
    }
    setMessageState((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? {
          closed: message.initiallyClosed,
          read: message.initiallyRead,
          replies: [],
        }),
        read: true,
        replies: [...(current[id]?.replies ?? []), body],
      },
    }));
    setDrafts((current) => ({...current, [id]: ''}));
    setAnnouncement(copy.messages.replyAnnouncement);
  };

  const createThread = async () => {
    const contact = data.messageContacts.find((candidate) => (
      `${candidate.enrollmentId}:${candidate.staffUserId}` === newThreadContact
    ));
    const body = newThreadBody.normalize('NFC').trim().slice(0, 2_000);
    if (!contact || !body || !onCreateThreadAction) return;
    setPendingNewThread(true);
    try {
      const result = await onCreateThreadAction(
        contact.childId,
        contact.enrollmentId,
        contact.staffUserId,
        newThreadTopic,
        body,
        `family-new-thread:${crypto.randomUUID()}`,
      );
      if (!result.ok || !result.data?.threadId) {
        setAnnouncement(copy.messages.actionFailed);
        return;
      }
      setNewThreadBody('');
      setAnnouncement(copy.messages.threadCreatedAnnouncement);
      router.refresh();
    } finally {
      setPendingNewThread(false);
    }
  };

  const runThreadAction = async (
    id: string,
    action: ((
      threadId: string,
      clientMutationId: string,
    ) => Promise<{ok: boolean}>) | undefined,
    update: Partial<MessageState[string]>,
    successAnnouncement: string,
  ) => {
    setPendingThreadId(id);
    try {
      if (!action && !data.synthetic) {
        setAnnouncement(copy.messages.actionFailed);
        return;
      }
      if (action) {
        const result = await action(
          id,
          `family-thread:${crypto.randomUUID()}`,
        );
        if (!result.ok) {
          setAnnouncement(copy.messages.actionFailed);
          return;
        }
      }
      updateMessage(id, update, successAnnouncement);
    } finally {
      setPendingThreadId(null);
    }
  };

  return (
    <>
      <ScreenHeader data={data} view="messages" />
      <aside className={styles.messageBoundary} role="note"><ShieldCheck aria-hidden="true" /><p>{copy.messages.demoNotice}</p></aside>
      {data.messageContacts.length && onCreateThreadAction ? (
        <form
          className={styles.newThreadCard}
          onSubmit={(event) => {
            event.preventDefault();
            void createThread();
          }}
        >
          <div className={styles.newThreadHeading}>
            <span aria-hidden="true" className={styles.senderAvatar}><Mail /></span>
            <div><h2>{copy.messages.newThreadTitle}</h2><p>{copy.messages.newThreadIntro}</p></div>
          </div>
          <div className={styles.newThreadFields}>
            <label>
              <span>{copy.messages.contactLabel}</span>
              <select
                onChange={(event) => setNewThreadContact(event.currentTarget.value)}
                required
                value={newThreadContact}
              >
                {data.messageContacts.map((contact) => (
                  <option
                    key={`${contact.enrollmentId}:${contact.staffUserId}`}
                    value={`${contact.enrollmentId}:${contact.staffUserId}`}
                  >
                    {contact.staffDisplayName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{copy.messages.topicLabel}</span>
              <select
                onChange={(event) => setNewThreadTopic(event.currentTarget.value as FamilyMessageTopic)}
                required
                value={newThreadTopic}
              >
                {FAMILY_MESSAGE_TOPICS.map((topic) => (
                  <option key={topic} value={topic}>{copy.messages.topicOptions[topic]}</option>
                ))}
              </select>
            </label>
          </div>
          <label htmlFor="family-new-thread-message">{copy.messages.newMessageLabel}</label>
          <textarea
            aria-describedby="family-new-thread-count"
            id="family-new-thread-message"
            maxLength={2_000}
            onChange={(event) => setNewThreadBody(event.currentTarget.value)}
            placeholder={copy.messages.newMessagePlaceholder}
            rows={4}
            value={newThreadBody}
          />
          <div>
            <small id="family-new-thread-count">
              {newThreadBody.length.toLocaleString(data.locale)} / 2,000 {copy.messages.characterLimitLabel}
            </small>
            <button disabled={pendingNewThread || !newThreadBody.trim()} type="submit">
              {copy.messages.startThread}
            </button>
          </div>
        </form>
      ) : !data.synthetic && !onSendMessageAction ? (
        <aside className={styles.closedThreadNotice} role="note">
          <ShieldCheck aria-hidden="true" />
          <div><strong>{copy.messages.messagingUnavailable}</strong></div>
        </aside>
      ) : null}
      <div aria-label={copy.messages.filterLabel} className={styles.segmentedControl} role="group">
        {filters.map((item) => (
          <button aria-pressed={filter === item.id} key={item.id} onClick={() => setFilter(item.id)} type="button">
            {item.label}
          </button>
        ))}
      </div>
      <p aria-atomic="true" aria-live="polite" className={styles.srOnly}>{announcement}</p>
      {messages.length ? (
        <section aria-live="polite" className={styles.messageList}>
          {messages.map((message) => {
            const state = stateFor(message);
            return (
              <article
                className={`${styles.messageCard} ${!state.read ? styles.messageUnread : ''}`}
                data-family-thread-id={message.id}
                key={message.id}
              >
                <div className={styles.messageMeta}>
                  <span aria-hidden="true" className={styles.senderAvatar}>{message.senderLabel.slice(0, 1)}</span>
                  <div><strong>{message.senderLabel}</strong><time>{message.sentAtLabel}</time></div>
                  <div className={styles.messageBadges}>
                    {!state.read ? <StatusPill tone="grape">{copy.messages.unreadLabel}</StatusPill> : <StatusPill tone="neutral">{copy.messages.readLabel}</StatusPill>}
                    {state.closed ? <StatusPill tone="closed">{copy.messages.closedLabel}</StatusPill> : null}
                  </div>
                </div>
                <div className={styles.messageContent}>
                  <h2>{message.subject}</h2>
                  <small className={styles.supportReference}>
                    {copy.messages.supportReferenceLabel}: <code>{message.id}</code>
                  </small>
                  <ol className={styles.threadHistory}>
                    {message.history.map((entry) => (
                      <li className={entry.mine ? styles.threadMessageMine : undefined} key={entry.id}>
                        <div>
                          <strong>{entry.senderLabel}</strong>
                          <time>{entry.sentAtLabel}</time>
                        </div>
                        {entry.redacted ? (
                          <small className={styles.redactedLabel}>
                            {copy.messages.redactedLabel}
                          </small>
                        ) : null}
                        <p>{entry.body}</p>
                      </li>
                    ))}
                  </ol>
                </div>
                {state.replies.length ? (
                  <div className={styles.localReplies}>
                    {state.replies.map((reply, index) => (
                      <article key={`${message.id}:reply:${index}`}>
                        <strong>{copy.messages.replyDemoLabel}</strong>
                        <p>{reply}</p>
                      </article>
                    ))}
                  </div>
                ) : null}
                {state.closed || (!data.synthetic && !onSendMessageAction) ? (
                  <aside className={styles.closedThreadNotice} role="note">
                    <ShieldCheck aria-hidden="true" />
                    <div>
                      <strong>{state.closed ? copy.messages.closedReadOnly : copy.messages.messagingUnavailable}</strong>
                      {state.closed ? <p>{copy.messages.newThreadHint}</p> : null}
                    </div>
                  </aside>
                ) : (
                  <form
                    className={styles.replyForm}
                    onSubmit={(event) => {
                      event.preventDefault();
                      void addReply(message.id);
                    }}
                  >
                    <label htmlFor={`family-reply-${message.id}`}>{copy.messages.replyLabel}</label>
                    <textarea
                      aria-describedby={`family-reply-count-${message.id}`}
                      id={`family-reply-${message.id}`}
                      maxLength={2_000}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setDrafts((current) => ({...current, [message.id]: value}));
                      }}
                      placeholder={copy.messages.replyPlaceholder}
                      rows={3}
                      value={drafts[message.id] ?? ''}
                    />
                    <div>
                      <small id={`family-reply-count-${message.id}`}>
                        {(drafts[message.id] ?? '').length.toLocaleString(data.locale)} / 2,000 {copy.messages.characterLimitLabel}
                      </small>
                      <button disabled={pendingThreadId === message.id || !(drafts[message.id] ?? '').trim()} type="submit">{copy.messages.sendReply}</button>
                    </div>
                  </form>
                )}
                <div className={styles.messageActions}>
                  {!state.read && (data.synthetic || onMarkThreadReadAction) ? (
                    <button disabled={pendingThreadId === message.id} onClick={() => void runThreadAction(message.id, onMarkThreadReadAction, {read: true}, copy.messages.readAnnouncement)} type="button">
                      <Check aria-hidden="true" />{copy.messages.markRead}
                    </button>
                  ) : null}
                  {!state.closed && (data.synthetic || onCloseThreadAction) ? (
                    <button disabled={pendingThreadId === message.id} onClick={() => void runThreadAction(message.id, onCloseThreadAction, {closed: true}, copy.messages.closedAnnouncement)} type="button">
                      <Check aria-hidden="true" />{copy.messages.closeThread}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <div className={styles.emptyState}>
          <Mail aria-hidden="true" />
          <h2>{copy.messages.noMessagesTitle}</h2>
          <p>{copy.messages.noMessagesBody}</p>
        </div>
      )}
    </>
  );
}

function PreferenceSwitch({
  checked,
  description,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  disabled?: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <div className={styles.preferenceRow}>
      <div><strong>{label}</strong><p>{description}</p></div>
      <button aria-checked={checked} aria-label={label} className={styles.switch} disabled={disabled} onClick={onChange} role="switch" type="button">
        <span />
      </button>
    </div>
  );
}

function SettingsScreen({
  changeTheme,
  data,
  onRelinquishAccessAction,
  onUpdatePreferencesAction,
  theme,
}: {
  changeTheme: (theme: Theme) => void;
  data: FamilyPortalUiDto;
  onRelinquishAccessAction?: (
    childId: string,
    clientMutationId: string,
  ) => Promise<{ok: boolean}>;
  onUpdatePreferencesAction?: (
    weeklyDigestEnabled: boolean,
    messageEmailEnabled: boolean,
    clientMutationId: string,
  ) => Promise<{ok: boolean}>;
  theme: Theme;
}) {
  const router = useRouter();
  const {copy} = data;
  const [weeklyDigest, setWeeklyDigest] = useState(
    data.notificationPreference.weeklyDigestEnabled,
  );
  const [messageEmail, setMessageEmail] = useState(
    data.notificationPreference.messageEmailEnabled,
  );
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const localeHref = familyHref('settings');
  const demoAction = () => setAnnouncement(copy.settings.demoActionAnnouncement);

  const relinquishAccess = async (childId: string) => {
    if (!onRelinquishAccessAction) {
      demoAction();
      return;
    }
    if (!window.confirm(copy.settings.relinquishConfirm)) return;
    setPendingAction(`relinquish:${childId}`);
    setAnnouncement('');
    try {
      const result = await onRelinquishAccessAction(
        childId,
        `family-relinquish:${crypto.randomUUID()}`,
      );
      if (!result.ok) {
        setAnnouncement(copy.settings.actionFailed);
        return;
      }
      setAnnouncement(copy.settings.relinquishedAnnouncement);
      router.refresh();
    } catch {
      setAnnouncement(copy.settings.actionFailed);
    } finally {
      setPendingAction(null);
    }
  };

  const updatePreferences = async (
    nextWeeklyDigest: boolean,
    nextMessageEmail: boolean,
  ) => {
    if (!onUpdatePreferencesAction) {
      if (data.synthetic) {
        setWeeklyDigest(nextWeeklyDigest);
        setMessageEmail(nextMessageEmail);
      } else {
        setAnnouncement(copy.settings.actionFailed);
      }
      return;
    }
    setPendingAction('preferences');
    setAnnouncement('');
    try {
      const result = await onUpdatePreferencesAction(
        nextWeeklyDigest,
        nextMessageEmail,
        `family-preferences:${crypto.randomUUID()}`,
      );
      if (!result.ok) {
        setAnnouncement(copy.settings.actionFailed);
        return;
      }
      setWeeklyDigest(nextWeeklyDigest);
      setMessageEmail(nextMessageEmail);
      setAnnouncement(copy.settings.demoActionAnnouncement);
    } catch {
      setAnnouncement(copy.settings.actionFailed);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <>
      <ScreenHeader data={data} view="settings" />
      <p aria-atomic="true" aria-live="polite" className={styles.srOnly}>{announcement}</p>
      <div className={styles.settingsGrid}>
        <section className={styles.settingsCard}>
          <span aria-hidden="true" className={styles.settingsIcon}><Users /></span>
          <div><h2>{copy.settings.accessTitle}</h2><p>{copy.settings.accessBody}</p></div>
          <div className={styles.familyMembers}>
            <strong>{copy.settings.childrenLabel}</strong>
            <ul>
              {data.children.map((item) => (
                <li key={item.id}>
                  <span aria-hidden="true">{item.initials}</span>
                  <div>
                    <strong>{item.displayName}</strong>
                    <small>{item.gradeLabel} · {copy.settings.schoolLabel}: {data.tenant.displayName}</small>
                    <i>{copy.settings.activeLabel}</i>
                  </div>
                  {onRelinquishAccessAction ? <button
                    aria-label={`${copy.settings.relinquishAccessLabel}: ${item.displayName}`}
                    disabled={pendingAction === `relinquish:${item.id}`}
                    onClick={() => void relinquishAccess(item.id)}
                    type="button"
                  >
                    {copy.settings.relinquishAccessLabel}
                  </button> : null}
                </li>
              ))}
            </ul>
            <p className={styles.relinquishNote}>{copy.settings.relinquishAccessBody}</p>
          </div>
        </section>

        <section className={styles.settingsCard}>
          <span aria-hidden="true" className={styles.settingsIcon}><Languages /></span>
          <div><h2>{copy.settings.languageTitle}</h2><p>{copy.settings.languageBody}</p></div>
          <div aria-label={copy.languageLabel} className={styles.largeChoice} role="group">
            <Link aria-current={data.locale === 'en' ? 'true' : undefined} href={localeHref} locale="en">{copy.englishLabel}</Link>
            <Link aria-current={data.locale === 'es' ? 'true' : undefined} href={localeHref} locale="es">{copy.spanishLabel}</Link>
          </div>
        </section>

        <section className={styles.settingsCard}>
          <span aria-hidden="true" className={styles.settingsIcon}><Palette /></span>
          <div><h2>{copy.settings.appearanceTitle}</h2><p>{copy.settings.appearanceBody}</p></div>
          <div aria-label={copy.settings.appearanceTitle} className={styles.largeChoice} role="group">
            <button aria-pressed={theme === 'light'} onClick={() => changeTheme('light')} type="button"><Sun aria-hidden="true" />{copy.settings.lightTheme}</button>
            <button aria-pressed={theme === 'dark'} onClick={() => changeTheme('dark')} type="button"><Moon aria-hidden="true" />{copy.settings.darkTheme}</button>
          </div>
        </section>

        <section className={`${styles.settingsCard} ${styles.preferenceCard}`}>
          <span aria-hidden="true" className={styles.settingsIcon}><BellRing /></span>
          <div><h2>{copy.settings.previewPreferencesTitle}</h2><p>{copy.settings.previewPreferencesBody}</p></div>
          <div className={styles.preferenceList}>
            <PreferenceSwitch checked={weeklyDigest} description={copy.settings.weeklyDigestBody} disabled={pendingAction === 'preferences' || (!data.synthetic && !onUpdatePreferencesAction)} label={copy.settings.weeklyDigestLabel} onChange={() => void updatePreferences(!weeklyDigest, messageEmail)} />
            <PreferenceSwitch checked={messageEmail} description={copy.settings.messageEmailBody} disabled={pendingAction === 'preferences' || (!data.synthetic && !onUpdatePreferencesAction)} label={copy.settings.messageEmailLabel} onChange={() => void updatePreferences(weeklyDigest, !messageEmail)} />
          </div>
          <small className={styles.browserOnly}><ShieldCheck aria-hidden="true" />{copy.settings.browserOnlyLabel}</small>
        </section>

        <section className={styles.settingsCard}>
          <span aria-hidden="true" className={styles.settingsIcon}><ShieldCheck /></span>
          <div><h2>{copy.settings.accountSecurityTitle}</h2><p>{copy.settings.accountSecurityBody}</p></div>
          <div className={styles.settingsActionList}>
            {data.synthetic ? <>
              <button onClick={demoAction} type="button">{copy.settings.accountActivityLabel}<ChevronRight aria-hidden="true" /></button>
              <button onClick={demoAction} type="button">{copy.settings.signOutOtherDevicesLabel}<ChevronRight aria-hidden="true" /></button>
            </> : <>
              <Link href="/family/requests#activity">{copy.settings.accountActivityLabel}<ChevronRight aria-hidden="true" /></Link>
              <Link href="/account">{copy.settings.signOutOtherDevicesLabel}<ChevronRight aria-hidden="true" /></Link>
            </>}
          </div>
        </section>

        <section className={`${styles.settingsCard} ${styles.workflowCard}`}>
          <span aria-hidden="true" className={styles.settingsIcon}><FileText /></span>
          <div><h2>{copy.settings.privacyWorkflowTitle}</h2><p>{copy.settings.privacyWorkflowBody}</p></div>
          <div className={styles.workflowActions}>
            {([
              ['access', copy.settings.accessRequestLabel],
              ['correction', copy.settings.correctionRequestLabel],
              ['deletion', copy.settings.deletionRequestLabel],
              ['relationship_dispute', copy.settings.relationshipDisputeLabel],
            ] as const).map(([kind, label]) => data.synthetic ? (
              <button key={kind} onClick={demoAction} type="button">{label}<ChevronRight aria-hidden="true" /></button>
            ) : (
              <Link href={`/family/requests?kind=${kind}`} key={kind}>{label}<ChevronRight aria-hidden="true" /></Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function PrintSummary({data}: {data: FamilyPortalUiDto}) {
  const {copy, selectedChild: child} = data;
  return (
    <article className={styles.printSummary} data-family-print-summary>
      <header>
        <span>{copy.print.syntheticLabel}</span>
        <h1>{copy.print.title}</h1>
        <p>{copy.print.studentLabel} <strong>{child.displayName}</strong> · {child.gradeLabel}</p>
        <small>{copy.print.generatedLabel}: {data.snapshotLabel}</small>
      </header>
      <section>
        <h2>{copy.print.progressTitle}</h2>
        {child.courses.map((course) => (
          <div className={styles.printRow} key={course.id}>
            <div><strong>{course.title}</strong><span>{course.unitLabel}</span></div>
            <b>{course.completionPercent}%</b>
          </div>
        ))}
      </section>
      <section>
        <h2>{copy.print.signalsTitle}</h2>
        {child.skills.map((skill) => (
          <div className={styles.printRow} key={skill.id}>
            <div><strong>{skill.label}</strong><span>{skill.evidenceLabel}</span></div>
            <b>{skill.levelLabel}</b>
          </div>
        ))}
      </section>
      <section>
        <h2>{copy.print.assignmentsTitle}</h2>
        {child.assignments.filter((assignment) => assignment.status !== 'completed').map((assignment) => (
          <div className={styles.printRow} key={assignment.id}>
            <div><strong>{assignment.title}</strong><span>{assignment.courseLabel}</span></div>
            <b>{assignment.dueLabel}</b>
          </div>
        ))}
      </section>
      <footer>{copy.print.footer}</footer>
    </article>
  );
}

export function FamilyPortal({
  accountControl,
  data,
  initialView,
  onCreateThreadAction,
  onCloseThreadAction,
  onMarkThreadReadAction,
  onRelinquishAccessAction,
  onSelectChildAction,
  onSelectTenantAction,
  onSendMessageAction,
  tenantOptions = [data.tenant],
  onUpdatePreferencesAction,
}: {
  accountControl?: ReactNode;
  data: FamilyPortalUiDto;
  initialView: FamilyPortalView;
  onCreateThreadAction?: CreateFamilyThreadAction;
  onCloseThreadAction?: (
    threadId: string,
    clientMutationId: string,
  ) => Promise<{ok: boolean}>;
  onMarkThreadReadAction?: (
    threadId: string,
    clientMutationId: string,
  ) => Promise<{ok: boolean}>;
  onRelinquishAccessAction?: (
    childId: string,
    clientMutationId: string,
  ) => Promise<{ok: boolean}>;
  onSelectChildAction?: (childId: string) => Promise<{ok: boolean} | void>;
  onSelectTenantAction?: (tenantId: string) => Promise<{ok: boolean} | void>;
  onSendMessageAction?: (
    threadId: string,
    body: string,
    clientMutationId: string,
  ) => Promise<{ok: boolean}>;
  onUpdatePreferencesAction?: (
    weeklyDigestEnabled: boolean,
    messageEmailEnabled: boolean,
    clientMutationId: string,
  ) => Promise<{ok: boolean}>;
  tenantOptions?: readonly Readonly<{displayName: string; id: string}>[];
}) {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>('light');
  const [isChildPending, setIsChildPending] = useState(false);
  const [isTenantPending, setIsTenantPending] = useState(false);
  const [messageState, setMessageState] = useState<MessageState>(() => initialMessageState(data.selectedChild));

  useEffect(() => {
    const preferred = readThemePreference()
      ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    queueMicrotask(() => setTheme(preferred));
  }, []);

  const unreadCount = useMemo(
    () => data.selectedChild.messages.filter((message) => !(
      messageState[message.id]?.read ?? message.initiallyRead
    )).length,
    [data.selectedChild.messages, messageState],
  );

  const changeTheme = (next: Theme) => {
    document.documentElement.dataset.familyTheme = next;
    setTheme(next);
    storeThemePreference(next);
  };

  const changeChild = async (childId: string) => {
    if (
      childId === data.selectedChild.id
      || !onSelectChildAction
      || isTenantPending
    ) return;
    setIsChildPending(true);
    try {
      const result = await onSelectChildAction(childId);
      if (result && !result.ok) return;
      router.refresh();
    } finally {
      setIsChildPending(false);
    }
  };

  const changeTenant = async (tenantId: string) => {
    if (tenantId === data.tenant.id || !onSelectTenantAction) return;
    setIsTenantPending(true);
    try {
      const result = await onSelectTenantAction(tenantId);
      if (result && !result.ok) return;
      router.refresh();
    } finally {
      setIsTenantPending(false);
    }
  };

  const child = data.selectedChild;
  const localeHref = familyHref(initialView);

  return (
    <div
      className={`${styles.portal} ${theme === 'dark' ? styles.themeDark : styles.themeLight}`}
      data-family-portal
      data-family-portal-demo={data.synthetic ? data.demoKind : undefined}
      data-family-portal-kind={data.demoKind}
      data-theme={theme}
    >
      <div className={styles.appShell}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <span className={styles.brandMark}><Image alt="" aria-hidden="true" height={42} priority src="/brand/help-math-2-logo.png" width={42} /></span>
            <span><strong>HELP <b>Math</b></strong><small>{data.copy.workspaceLabel}</small></span>
          </div>

          <div className={styles.tenantCard}>
            {tenantOptions.length <= 1 ? (
              <>
                <span className={styles.tenantLabel}>{data.copy.tenantLabel}</span>
                <strong>{data.tenant.displayName}</strong>
              </>
            ) : null}
            {tenantOptions.length > 1 ? (
              <>
                <label htmlFor="family-tenant-selector">{data.copy.tenantLabel}</label>
                <div className={styles.selectWrap}>
                  <select
                    disabled={isTenantPending}
                    id="family-tenant-selector"
                    onChange={(event) => void changeTenant(event.currentTarget.value)}
                    value={data.tenant.id}
                  >
                    {tenantOptions.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.displayName}
                      </option>
                    ))}
                  </select>
                  <ChevronRight aria-hidden="true" />
                </div>
              </>
            ) : null}
            <label htmlFor="family-child-selector">{data.copy.childSelectorLabel}</label>
            <div className={styles.selectWrap}>
              <select
                aria-describedby="family-child-hint"
                disabled={isChildPending || isTenantPending}
                id="family-child-selector"
                onChange={(event) => void changeChild(event.currentTarget.value)}
                value={child.id}
              >
                {data.children.map((option) => <option key={option.id} value={option.id}>{option.displayName} · {option.gradeLabel}</option>)}
              </select>
              <ChevronRight aria-hidden="true" />
            </div>
            <small id="family-child-hint">{
              isChildPending || isTenantPending
                ? data.copy.changeChildPending
                : data.copy.childSelectorHint
            }</small>
          </div>

          <nav aria-label={data.copy.navigationLabel} className={styles.navigation}>
            {data.navigation.map((item) => {
              const Icon = VIEW_ICONS[item.view];
              return (
                <Link
                  aria-current={initialView === item.view ? 'page' : undefined}
                  className={styles.navItem}
                  href={familyHref(item.view)}
                  key={item.view}
                >
                  <Icon aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.view === 'messages' && unreadCount ? <b aria-label={`${unreadCount} ${data.copy.messages.unreadLabel}`}>{unreadCount}</b> : null}
                </Link>
              );
            })}
          </nav>

          <div className={styles.sidebarFooter}>
            <span>{data.copy.languageLabel}</span>
            <div aria-label={data.copy.languageLabel} className={styles.languageSwitch} role="group">
              <Link aria-current={data.locale === 'en' ? 'true' : undefined} href={localeHref} locale="en">EN</Link>
              <Link aria-current={data.locale === 'es' ? 'true' : undefined} href={localeHref} locale="es">ES</Link>
            </div>
            <small><ShieldCheck aria-hidden="true" />{data.copy.syntheticBadge}</small>
          </div>
        </aside>

        <div className={styles.mainShell}>
          <header className={styles.topbar}>
            <div className={styles.topbarTitle}>
              <span>{data.copy.workspaceLabel}</span>
              <strong>{data.copy.screenTitles[initialView]}</strong>
            </div>
            <div className={styles.topbarChild}>
              <span aria-hidden="true">{child.initials}</span>
              <div><strong>{child.displayName}</strong><small>{child.gradeLabel}</small></div>
            </div>
            <div className={styles.accountControl}>
              {accountControl ?? <span role="status"><ShieldCheck aria-hidden="true" />{data.copy.demoAccountLabel}</span>}
            </div>
            <div className={styles.topbarActions}>
              <button aria-label={data.copy.printSummary} onClick={() => window.print()} type="button"><Printer aria-hidden="true" /><span>{data.copy.printSummary}</span></button>
              <button aria-label={theme === 'light' ? data.copy.switchToDark : data.copy.switchToLight} onClick={() => changeTheme(theme === 'light' ? 'dark' : 'light')} type="button">
                {theme === 'light' ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
              </button>
            </div>
          </header>

          <main className={styles.main} id="main-content" tabIndex={-1}>
            <DemoBoundary data={data} />
            <div className={styles.screenArea}>
              {initialView === 'overview' ? <OverviewScreen
                data={data}
                messageState={messageState}
                onCreateThreadAction={onCreateThreadAction}
              /> : null}
              {initialView === 'progress' ? <ProgressScreen data={data} /> : null}
              {initialView === 'assignments' ? <AssignmentsScreen data={data} /> : null}
              {initialView === 'messages' ? <MessagesScreen
                data={data}
                messageState={messageState}
                onCreateThreadAction={onCreateThreadAction}
                onCloseThreadAction={onCloseThreadAction}
                onMarkThreadReadAction={onMarkThreadReadAction}
                onSendMessageAction={onSendMessageAction}
                setMessageState={setMessageState}
              /> : null}
              {initialView === 'settings' ? <SettingsScreen
                changeTheme={changeTheme}
                data={data}
                onRelinquishAccessAction={onRelinquishAccessAction}
                onUpdatePreferencesAction={onUpdatePreferencesAction}
                theme={theme}
              /> : null}
            </div>
            <RecordNotice data={data} />
          </main>
        </div>
      </div>
      <PrintSummary data={data} />
    </div>
  );
}
