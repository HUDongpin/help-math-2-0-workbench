import type {
  FamilyAssignmentStatus,
  FamilyMessageTopic,
  FamilySkillBand,
  FamilyThreadStatus,
  InvitationStatus,
} from './types';

export const FAMILY_PORTAL_VIEWS = [
  'overview',
  'progress',
  'assignments',
  'messages',
  'settings',
] as const;

export type FamilyPortalView = (typeof FAMILY_PORTAL_VIEWS)[number];
export type FamilyPortalLocale = 'en' | 'es';
export type FamilySignalTone = 'blue' | 'mint' | 'sun' | 'grape';

type FamilyPortalNavItem = Readonly<{
  view: FamilyPortalView;
  label: string;
}>;

type FamilyChildOption = Readonly<{
  id: string;
  displayName: string;
  initials: string;
  gradeLabel: string;
  programLabel: string;
}>;

type FamilyStat = Readonly<{
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: FamilySignalTone;
}>;

type FamilyCourseProgress = Readonly<{
  id: string;
  title: string;
  unitLabel: string;
  completionPercent: number;
  completionLabel: string;
  lastActivityLabel: string;
  nextConversationPrompt: string;
}>;

type FamilySkillSignal = Readonly<{
  id: string;
  label: string;
  band: FamilySkillBand;
  levelLabel: string;
  evidenceLabel: string;
  tone: FamilySignalTone;
}>;

type FamilyProgressEvidence = Readonly<{
  computedAtLabel: string;
  projectionVersion: 'skill_projection_v1';
  releaseVersion: string;
  stale: boolean;
  statusLabel: string;
  whyStatusLabel: string;
}>;

type FamilyRecentActivity = Readonly<{
  id: string;
  dateLabel: string;
  title: string;
  detail: string;
}>;

type FamilyAssignment = Readonly<{
  id: string;
  title: string;
  courseLabel: string;
  dueLabel: string;
  status: FamilyAssignmentStatus;
  statusLabel: string;
  familyNote: string;
}>;

type FamilySchoolAnnouncement = Readonly<{
  body: string;
  id: string;
  publishedAtLabel: string;
  publisherLabel: string;
  title: string;
}>;

type FamilyThreadMessage = Readonly<{
  id: string;
  senderLabel: string;
  sentAtLabel: string;
  body: string;
  mine: boolean;
  redacted: boolean;
}>;

type FamilyMessage = Readonly<{
  id: string;
  senderLabel: string;
  sentAtLabel: string;
  subject: string;
  body: string;
  history: readonly FamilyThreadMessage[];
  initiallyRead: boolean;
  initiallyClosed: boolean;
}>;

function syntheticFamilyMessage(
  message: Omit<FamilyMessage, 'history'>,
): FamilyMessage {
  return {
    ...message,
    history: [{
      body: message.body,
      id: `${message.id}:initial`,
      mine: false,
      redacted: false,
      senderLabel: message.senderLabel,
      sentAtLabel: message.sentAtLabel,
    }],
  };
}

export type FamilyMessageContactOption = Readonly<{
  childId: string;
  enrollmentId: string;
  staffDisplayName: string;
  staffUserId: string;
}>;

export type FamilySelectedChild = FamilyChildOption & Readonly<{
  announcements: readonly FamilySchoolAnnouncement[];
  greeting: string;
  overviewIntro: string;
  stats: readonly FamilyStat[];
  courses: readonly FamilyCourseProgress[];
  skills: readonly FamilySkillSignal[];
  recentActivity: readonly FamilyRecentActivity[];
  assignments: readonly FamilyAssignment[];
  messages: readonly FamilyMessage[];
  progressEvidence: FamilyProgressEvidence;
}>;

type FamilyPortalCopy = Readonly<{
  productName: string;
  workspaceLabel: string;
  tenantLabel: string;
  navigationLabel: string;
  childSelectorLabel: string;
  childSelectorHint: string;
  changeChildPending: string;
  languageLabel: string;
  englishLabel: string;
  spanishLabel: string;
  switchToLight: string;
  switchToDark: string;
  printSummary: string;
  demoAccountLabel: string;
  syntheticBadge: string;
  syntheticTitle: string;
  syntheticBody: string;
  recordNoticeTitle: string;
  recordNoticeBody: string;
  screenTitles: Readonly<Record<FamilyPortalView, string>>;
  screenIntros: Readonly<Record<FamilyPortalView, string>>;
  overview: Readonly<{
    snapshotLabel: string;
    activityTitle: string;
    activityIntro: string;
    learningSignalsTitle: string;
    learningSignalsIntro: string;
    upcomingTitle: string;
    upcomingIntro: string;
    latestMessageTitle: string;
    viewMessages: string;
    askTogetherLabel: string;
    announcementsTitle: string;
    announcementsIntro: string;
    replyPrivately: string;
    replyPrivateIntro: string;
    replyContactLabel: string;
    replyMessageLabel: string;
    replyMessagePlaceholder: string;
    sendPrivateReply: string;
    cancelPrivateReply: string;
    privateReplySent: string;
    privateReplyUnavailable: string;
  }>;
  progress: Readonly<{
    coursesTitle: string;
    courseCompletionLabel: string;
    signalsTitle: string;
    signalsIntro: string;
    recentTitle: string;
    evidenceLabel: string;
    computedAtLabel: string;
    projectionLabel: string;
    releaseLabel: string;
    statusLabel: string;
    whyStatusTitle: string;
  }>;
  assignments: Readonly<{
    filterLabel: string;
    allFilter: string;
    dueSoonFilter: string;
    submittedFilter: string;
    emptyTitle: string;
    emptyBody: string;
    dueLabel: string;
    familyNoteLabel: string;
  }>;
  messages: Readonly<{
    demoNotice: string;
    filterLabel: string;
    allFilter: string;
    openFilter: string;
    closedFilter: string;
    unreadLabel: string;
    readLabel: string;
    closedLabel: string;
    redactedLabel: string;
    supportReferenceLabel: string;
    markRead: string;
    closeThread: string;
    closedReadOnly: string;
    newThreadHint: string;
    noMessagesTitle: string;
    noMessagesBody: string;
    replyLabel: string;
    replyPlaceholder: string;
    sendReply: string;
    replyDemoLabel: string;
    replyAnnouncement: string;
    actionFailed: string;
    characterLimitLabel: string;
    readAnnouncement: string;
    closedAnnouncement: string;
    newThreadTitle: string;
    newThreadIntro: string;
    contactLabel: string;
    topicLabel: string;
    topicOptions: Readonly<Record<FamilyMessageTopic, string>>;
    newMessageLabel: string;
    newMessagePlaceholder: string;
    startThread: string;
    threadCreatedAnnouncement: string;
    messagingUnavailable: string;
  }>;
  settings: Readonly<{
    accessTitle: string;
    accessBody: string;
    childrenLabel: string;
    schoolLabel: string;
    activeLabel: string;
    relinquishAccessLabel: string;
    relinquishAccessBody: string;
    relinquishConfirm: string;
    relinquishedAnnouncement: string;
    languageTitle: string;
    languageBody: string;
    appearanceTitle: string;
    appearanceBody: string;
    lightTheme: string;
    darkTheme: string;
    previewPreferencesTitle: string;
    previewPreferencesBody: string;
    weeklyDigestLabel: string;
    weeklyDigestBody: string;
    messageEmailLabel: string;
    messageEmailBody: string;
    accountSecurityTitle: string;
    accountSecurityBody: string;
    accountActivityLabel: string;
    signOutOtherDevicesLabel: string;
    privacyWorkflowTitle: string;
    privacyWorkflowBody: string;
    accessRequestLabel: string;
    correctionRequestLabel: string;
    deletionRequestLabel: string;
    relationshipDisputeLabel: string;
    demoActionAnnouncement: string;
    actionFailed: string;
    browserOnlyLabel: string;
  }>;
  print: Readonly<{
    title: string;
    syntheticLabel: string;
    studentLabel: string;
    generatedLabel: string;
    progressTitle: string;
    assignmentsTitle: string;
    signalsTitle: string;
    footer: string;
  }>;
}>;

export type FamilyPortalUiDto = Readonly<{
  schemaVersion: 1;
  locale: FamilyPortalLocale;
  demoKind: 'synthetic-family-portal' | 'authorized-family-portal';
  synthetic: boolean;
  snapshotLabel: string;
  tenant: Readonly<{id: string; displayName: string}>;
  children: readonly FamilyChildOption[];
  selectedChild: FamilySelectedChild;
  navigation: readonly FamilyPortalNavItem[];
  messageContacts: readonly FamilyMessageContactOption[];
  notificationPreference: Readonly<{
    messageEmailEnabled: boolean;
    weeklyDigestEnabled: boolean;
  }>;
  copy: FamilyPortalCopy;
}>;

export type TeacherFamilyMessage = Readonly<{
  id: string;
  senderLabel: string;
  sentAtLabel: string;
  body: string;
  mine: boolean;
}>;

export type TeacherFamilyThread = Readonly<{
  id: string;
  childId: string;
  guardianLabel: string;
  childLabel: string;
  gradeLabel: string;
  subject: string;
  unreadCount: number;
  status: FamilyThreadStatus;
  messages: readonly TeacherFamilyMessage[];
}>;

export type TeacherAnnouncementSchoolOption = Readonly<{
  displayName: string;
  id: string;
}>;

export type TeacherMessagesDemoDto = Readonly<{
  locale: FamilyPortalLocale;
  synthetic: boolean;
  tenant: Readonly<{id: string; displayName: string}>;
  title: string;
  intro: string;
  workspaceLabel: string;
  syntheticBadge: string;
  syntheticTitle: string;
  syntheticBody: string;
  threadListLabel: string;
  noSelectionLabel: string;
  unreadLabel: string;
  readLabel: string;
  closedLabel: string;
  markRead: string;
  closeThread: string;
  closedReadOnly: string;
  newThreadHint: string;
  replyLabel: string;
  replyPlaceholder: string;
  addReply: string;
  localReplyLabel: string;
  replyAnnouncement: string;
  actionFailed: string;
  readAnnouncement: string;
  closedAnnouncement: string;
  characterLabel: string;
  announcementSchools: readonly TeacherAnnouncementSchoolOption[];
  announcementPublishingAvailable: boolean;
  announcementComposeTitle: string;
  announcementComposeIntro: string;
  announcementSchoolLabel: string;
  announcementTitleLabel: string;
  announcementTitlePlaceholder: string;
  announcementBodyLabel: string;
  announcementBodyPlaceholder: string;
  publishAnnouncement: string;
  announcementPublished: string;
  announcementUnavailable: string;
  announcementPrivacyNote: string;
  threads: readonly TeacherFamilyThread[];
}>;

export type AdminFamilyInvitation = Readonly<{
  id: string;
  guardianLinkId?: string;
  childId: string;
  childDisplayName: string;
  gradeLabel: string;
  guardianLabel: string;
  destinationLabel: string;
  status: Extract<InvitationStatus, 'pending' | 'accepted' | 'revoked'>;
  statusLabel: string;
  expiresLabel: string;
}>;

export type AdminFamilyAccessDemoDto = Readonly<{
  locale: FamilyPortalLocale;
  synthetic: boolean;
  tenant: Readonly<{id: string; displayName: string}>;
  title: string;
  intro: string;
  workspaceLabel: string;
  syntheticBadge: string;
  syntheticTitle: string;
  syntheticBody: string;
  createTitle: string;
  createIntro: string;
  childLabel: string;
  adultEmailLabel: string;
  adultEmailPlaceholder: string;
  adultEmailHint: string;
  invalidEmailLabel: string;
  invitationCreationEnabled: boolean;
  invitationRecipientPolicy:
    | 'demo-invalid'
    | 'disabled'
    | 'school-verified-production'
    | 'synthetic-invalid-only';
  invitationCreationUnavailable: string;
  createInvitation: string;
  invitationCreated: string;
  actionFailed: string;
  accessListTitle: string;
  accessListIntro: string;
  pendingLabel: string;
  acceptedLabel: string;
  revokedLabel: string;
  expiresPrefix: string;
  resend: string;
  resentAnnouncement: string;
  revoke: string;
  revokedAnnouncement: string;
  children: readonly FamilyChildOption[];
  invitations: readonly AdminFamilyInvitation[];
}>;

export type FamilyInvitationAcceptDemoDto = Readonly<{
  locale: FamilyPortalLocale;
  synthetic: boolean;
  workspaceLabel: string;
  syntheticBadge: string;
  syntheticBody: string;
  title: string;
  intro: string;
  signInTitle: string;
  signInBody: string;
  signInLabel: string;
  tokenMissingTitle: string;
  tokenMissingBody: string;
  readyTitle: string;
  readyBody: string;
  safetyTitle: string;
  safetyPoints: readonly string[];
  confirmationLabel: string;
  acceptLabel: string;
  declineLabel: string;
  submittingLabel: string;
  acceptError: string;
  acceptedTitle: string;
  acceptedBody: string;
  declinedTitle: string;
  declinedBody: string;
}>;

export function isFamilyPortalView(value: string | null | undefined): value is FamilyPortalView {
  return FAMILY_PORTAL_VIEWS.some((candidate) => candidate === value);
}

type ChildSeed = Readonly<{
  sequence: 1 | 2 | 3;
  id: string;
  displayName: string;
  initials: string;
  grade: 3 | 4 | 5;
  lesson: number;
  currentPage: number;
  totalPages: number;
  completionPercent: number;
  languagePercent: number;
  weeklyMinutes: number;
  sessions: number;
  dueSoon: number;
  unread: number;
}>;

function demoUuid(value: number): string {
  return `10000000-0000-4000-8000-${String(value).padStart(12, '0')}`;
}

const CHILD_SEEDS: readonly ChildSeed[] = [
  {
    sequence: 1,
    id: demoUuid(101),
    displayName: 'Maya R.',
    initials: 'MR',
    grade: 4,
    lesson: 3,
    currentPage: 21,
    totalPages: 39,
    completionPercent: 54,
    languagePercent: 72,
    weeklyMinutes: 46,
    sessions: 4,
    dueSoon: 2,
    unread: 2,
  },
  {
    sequence: 2,
    id: demoUuid(102),
    displayName: 'Diego R.',
    initials: 'DR',
    grade: 5,
    lesson: 4,
    currentPage: 38,
    totalPages: 54,
    completionPercent: 70,
    languagePercent: 64,
    weeklyMinutes: 52,
    sessions: 5,
    dueSoon: 1,
    unread: 1,
  },
  {
    sequence: 3,
    id: demoUuid(103),
    displayName: 'Luna R.',
    initials: 'LR',
    grade: 3,
    lesson: 2,
    currentPage: 12,
    totalPages: 32,
    completionPercent: 38,
    languagePercent: 58,
    weeklyMinutes: 31,
    sessions: 3,
    dueSoon: 2,
    unread: 1,
  },
] as const;

const EN_COPY = {
  productName: 'HELP Math 2.0',
  workspaceLabel: 'Family workspace',
  tenantLabel: 'Current school',
  navigationLabel: 'Family workspace navigation',
  childSelectorLabel: 'Viewing learning for',
  childSelectorHint: 'Switch between children connected to this family demo.',
  changeChildPending: 'Updating the family view…',
  languageLabel: 'Portal language',
  englishLabel: 'English',
  spanishLabel: 'Español',
  switchToLight: 'Switch to light theme',
  switchToDark: 'Switch to dark theme',
  printSummary: 'Print summary',
  demoAccountLabel: 'Synthetic demo account · real sign-out is not connected',
  syntheticBadge: 'Synthetic demo',
  syntheticTitle: 'A safe preview with fictional information',
  syntheticBody:
    'Every child, activity, assignment, and message on this page is synthetic. Nothing here comes from a real student record or sends a real notification.',
  recordNoticeTitle: 'Learning signals, not official grades',
  recordNoticeBody:
    'This preview summarizes practice activity and emerging skill evidence. It is not a report card, transcript, placement decision, diagnosis, or official school record.',
  screenTitles: {
    overview: 'Family overview',
    progress: 'Learning progress',
    assignments: 'Assignments',
    messages: 'Messages',
    settings: 'Family settings',
  },
  screenIntros: {
    overview: 'A calm, at-a-glance view of recent learning and ways to support the next step.',
    progress: 'See participation and skill evidence over time without turning practice into a grade.',
    assignments: 'Keep track of synthetic due dates, submitted work, and family-friendly reminders.',
    messages: 'Review plain-text demo notes and test a reply inside the isolated synthetic environment. No real notifications are connected.',
    settings: 'Preview family access, language, appearance, and synthetic notification preferences.',
  },
  overview: {
    snapshotLabel: 'This week’s learning snapshot',
    activityTitle: 'Learning path activity',
    activityIntro: 'Completion shows visited learning pages, not a test score.',
    learningSignalsTitle: 'Learning signals',
    learningSignalsIntro: 'Plain-language evidence from recent synthetic practice.',
    upcomingTitle: 'Coming up',
    upcomingIntro: 'A short list of demo assignments that may need family attention.',
    latestMessageTitle: 'Latest family note',
    viewMessages: 'View all messages',
    askTogetherLabel: 'Try asking together',
    announcementsTitle: 'School announcements',
    announcementsIntro: 'Updates shared with families at this school. Replies always start a private conversation.',
    replyPrivately: 'Reply privately',
    replyPrivateIntro: 'Your reply starts a new private conversation with the selected current teacher. It never replies to a group or reveals a recipient list.',
    replyContactLabel: 'Current teacher or authorized staff member',
    replyMessageLabel: 'Plain-text private reply',
    replyMessagePlaceholder: 'Write a private reply…',
    sendPrivateReply: 'Add local private reply',
    cancelPrivateReply: 'Cancel private reply',
    privateReplySent: 'Private reply preview completed locally. Nothing was saved or sent.',
    privateReplyUnavailable: 'Private replies are unavailable. No message was saved.',
  },
  progress: {
    coursesTitle: 'Course activity',
    courseCompletionLabel: 'learning path complete',
    signalsTitle: 'Skill evidence',
    signalsIntro:
      'Starting, Growing, Strong, and Not enough evidence are discrete descriptions of the evidence available in this demo. They are not grades, probabilities, or diagnostic labels.',
    recentTitle: 'Recent learning activity',
    evidenceLabel: 'Evidence',
    computedAtLabel: 'Computed',
    projectionLabel: 'Projection',
    releaseLabel: 'Learning release',
    statusLabel: 'Data status',
    whyStatusTitle: 'Why this status',
  },
  assignments: {
    filterLabel: 'Filter assignments',
    allFilter: 'All',
    dueSoonFilter: 'Due soon',
    submittedFilter: 'Submitted',
    emptyTitle: 'No demo assignments in this view',
    emptyBody: 'Choose another filter to see the remaining synthetic assignments.',
    dueLabel: 'Due',
    familyNoteLabel: 'Family note',
  },
  messages: {
    demoNotice:
      'These are synthetic notes for interaction testing. Plain-text replies are processed only by isolated synthetic test state and do not contact a teacher, upload files, or deliver notifications.',
    filterLabel: 'Filter messages',
    allFilter: 'All',
    openFilter: 'Open',
    closedFilter: 'Closed',
    unreadLabel: 'Unread',
    readLabel: 'Read',
    closedLabel: 'Closed',
    redactedLabel: 'Message removed by an authorized administrator',
    supportReferenceLabel: 'Support reference',
    markRead: 'Mark as read',
    closeThread: 'Close conversation',
    closedReadOnly: 'This conversation is permanently read-only.',
    newThreadHint: 'To continue later, start a new conversation after server messaging is enabled.',
    noMessagesTitle: 'No demo messages in this view',
    noMessagesBody: 'Choose another filter to see the remaining synthetic notes.',
    replyLabel: 'Synthetic plain-text reply',
    replyPlaceholder: 'Write a demo reply…',
    sendReply: 'Add demo reply',
    replyDemoLabel: 'You · Synthetic test reply',
    replyAnnouncement: 'Synthetic reply accepted in the isolated test environment. Nothing was sent.',
    actionFailed: 'That synthetic action could not be completed. No data was changed.',
    characterLimitLabel: 'characters',
    readAnnouncement: 'Demo message marked as read.',
    closedAnnouncement: 'Demo conversation closed.',
    newThreadTitle: 'Start a private conversation',
    newThreadIntro: 'Choose a current teacher and a topic. Only the selected teacher can see this family thread.',
    contactLabel: 'Teacher or authorized staff member',
    topicLabel: 'Topic',
    topicOptions: {
      assignment: 'Assignment',
      progress: 'Learning progress',
      access: 'Family access',
      technical: 'Technical help',
      other: 'Other',
    },
    newMessageLabel: 'Message',
    newMessagePlaceholder: 'Write a plain-text message…',
    startThread: 'Start conversation',
    threadCreatedAnnouncement: 'Private conversation created.',
    messagingUnavailable: 'Messaging is temporarily unavailable. Existing conversations remain read-only.',
  },
  settings: {
    accessTitle: 'Family access preview',
    accessBody:
      'This tenant contains three fictional children. A production portal must verify every adult-to-child relationship on the server before returning any student data.',
    childrenLabel: 'Active child-school links',
    schoolLabel: 'School',
    activeLabel: 'Active',
    relinquishAccessLabel: 'Relinquish access',
    relinquishAccessBody: 'Starts a controlled relationship-removal workflow; it never edits a student record directly.',
    relinquishConfirm: 'Relinquish access to this fictional child? This synthetic relationship cannot be restored from the Family workspace.',
    relinquishedAnnouncement: 'Synthetic family access was relinquished.',
    languageTitle: 'Portal language',
    languageBody: 'Change the adult-facing workspace language. This does not change a child’s lesson language.',
    appearanceTitle: 'Appearance',
    appearanceBody: 'Choose a comfortable display theme for this browser.',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    previewPreferencesTitle: 'Preview preferences',
    previewPreferencesBody:
      'These controls exercise isolated synthetic test state only and do not create notifications.',
    weeklyDigestLabel: 'Weekly learning digest',
    weeklyDigestBody: 'Preview a weekly summary preference.',
    messageEmailLabel: 'New message email',
    messageEmailBody: 'Preview an email preference for a new family message.',
    accountSecurityTitle: 'Account activity and security',
    accountSecurityBody: 'Review sign-in activity or end sessions on other devices through a controlled account workflow.',
    accountActivityLabel: 'View account activity',
    signOutOtherDevicesLabel: 'Sign out other devices',
    privacyWorkflowTitle: 'Family data requests',
    privacyWorkflowBody: 'Start a reviewed request. These actions never change a student record directly.',
    accessRequestLabel: 'Request access copy',
    correctionRequestLabel: 'Request a correction',
    deletionRequestLabel: 'Request deletion review',
    relationshipDisputeLabel: 'Dispute a relationship',
    demoActionAnnouncement: 'Synthetic demo only. No request was submitted and no record changed.',
    actionFailed: 'That synthetic action could not be completed. No data was changed.',
    browserOnlyLabel: 'Synthetic test state only · no real notification delivery',
  },
  print: {
    title: 'HELP Math family summary',
    syntheticLabel: 'SYNTHETIC DEMO — NO REAL STUDENT DATA',
    studentLabel: 'Learning summary for',
    generatedLabel: 'Snapshot',
    progressTitle: 'Learning path activity',
    assignmentsTitle: 'Upcoming assignments',
    signalsTitle: 'Skill evidence',
    footer:
      'This printout is a synthetic product preview. It is not an official grade, report card, transcript, placement decision, or student record.',
  },
} satisfies FamilyPortalCopy;

const ES_COPY = {
  productName: 'HELP Math 2.0',
  workspaceLabel: 'Espacio para familias',
  tenantLabel: 'Escuela actual',
  navigationLabel: 'Navegación del espacio para familias',
  childSelectorLabel: 'Viendo el aprendizaje de',
  childSelectorHint: 'Cambia entre los estudiantes conectados a esta demostración familiar.',
  changeChildPending: 'Actualizando la vista familiar…',
  languageLabel: 'Idioma del portal',
  englishLabel: 'English',
  spanishLabel: 'Español',
  switchToLight: 'Cambiar al tema claro',
  switchToDark: 'Cambiar al tema oscuro',
  printSummary: 'Imprimir resumen',
  demoAccountLabel: 'Cuenta sintética de muestra · la salida real no está conectada',
  syntheticBadge: 'Demostración sintética',
  syntheticTitle: 'Una vista segura con información ficticia',
  syntheticBody:
    'Cada estudiante, actividad, tarea y mensaje de esta página es sintético. Nada proviene de un expediente real ni envía una notificación real.',
  recordNoticeTitle: 'Señales de aprendizaje, no calificaciones oficiales',
  recordNoticeBody:
    'Esta vista resume la actividad de práctica y la evidencia emergente de habilidades. No es una boleta, expediente, decisión de ubicación, diagnóstico ni registro escolar oficial.',
  screenTitles: {
    overview: 'Resumen familiar',
    progress: 'Progreso de aprendizaje',
    assignments: 'Tareas',
    messages: 'Mensajes',
    settings: 'Configuración familiar',
  },
  screenIntros: {
    overview: 'Una vista tranquila y rápida del aprendizaje reciente y de cómo apoyar el siguiente paso.',
    progress: 'Observa la participación y la evidencia de habilidades sin convertir la práctica en una calificación.',
    assignments: 'Sigue fechas, trabajos entregados y recordatorios familiares completamente sintéticos.',
    messages: 'Revisa notas en texto simple y prueba una respuesta dentro del entorno sintético aislado. No hay notificaciones reales.',
    settings: 'Explora el acceso familiar, el idioma, la apariencia y preferencias de notificación sintéticas.',
  },
  overview: {
    snapshotLabel: 'Resumen de aprendizaje de esta semana',
    activityTitle: 'Actividad en la ruta de aprendizaje',
    activityIntro: 'El avance muestra páginas visitadas, no una puntuación de examen.',
    learningSignalsTitle: 'Señales de aprendizaje',
    learningSignalsIntro: 'Evidencia en lenguaje claro de la práctica sintética reciente.',
    upcomingTitle: 'Próximamente',
    upcomingIntro: 'Una lista breve de tareas de demostración que pueden necesitar atención familiar.',
    latestMessageTitle: 'Nota familiar más reciente',
    viewMessages: 'Ver todos los mensajes',
    askTogetherLabel: 'Pregunta para conversar',
    announcementsTitle: 'Anuncios de la escuela',
    announcementsIntro: 'Novedades compartidas con las familias de esta escuela. Las respuestas siempre inician una conversación privada.',
    replyPrivately: 'Responder en privado',
    replyPrivateIntro: 'Tu respuesta inicia una conversación privada nueva con el docente actual seleccionado. Nunca responde a un grupo ni revela una lista de destinatarios.',
    replyContactLabel: 'Docente actual o personal autorizado',
    replyMessageLabel: 'Respuesta privada en texto simple',
    replyMessagePlaceholder: 'Escribe una respuesta privada…',
    sendPrivateReply: 'Agregar respuesta privada local',
    cancelPrivateReply: 'Cancelar respuesta privada',
    privateReplySent: 'Vista previa de respuesta privada completada localmente. No se guardó ni envió nada.',
    privateReplyUnavailable: 'Las respuestas privadas no están disponibles. No se guardó ningún mensaje.',
  },
  progress: {
    coursesTitle: 'Actividad del curso',
    courseCompletionLabel: 'de la ruta completada',
    signalsTitle: 'Evidencia de habilidades',
    signalsIntro:
      'Inicial, En desarrollo, Sólida y Aún no hay suficiente evidencia son descripciones discretas. No son calificaciones, probabilidades ni etiquetas diagnósticas.',
    recentTitle: 'Actividad de aprendizaje reciente',
    evidenceLabel: 'Evidencia',
    computedAtLabel: 'Calculado',
    projectionLabel: 'Proyección',
    releaseLabel: 'Versión de aprendizaje',
    statusLabel: 'Estado de datos',
    whyStatusTitle: 'Por qué aparece este estado',
  },
  assignments: {
    filterLabel: 'Filtrar tareas',
    allFilter: 'Todas',
    dueSoonFilter: 'Próximas',
    submittedFilter: 'Entregadas',
    emptyTitle: 'No hay tareas de demostración en esta vista',
    emptyBody: 'Elige otro filtro para ver las demás tareas sintéticas.',
    dueLabel: 'Fecha',
    familyNoteLabel: 'Nota para la familia',
  },
  messages: {
    demoNotice:
      'Estas son notas sintéticas para probar la interacción. Las respuestas de texto se procesan solo en un estado de prueba sintético y aislado; no contactan a un docente, suben archivos ni envían notificaciones.',
    filterLabel: 'Filtrar mensajes',
    allFilter: 'Todos',
    openFilter: 'Abiertos',
    closedFilter: 'Cerrados',
    unreadLabel: 'No leído',
    readLabel: 'Leído',
    closedLabel: 'Cerrado',
    redactedLabel: 'Mensaje retirado por un administrador autorizado',
    supportReferenceLabel: 'Referencia de soporte',
    markRead: 'Marcar como leído',
    closeThread: 'Cerrar conversación',
    closedReadOnly: 'Esta conversación es permanentemente de solo lectura.',
    newThreadHint: 'Para continuar después, crea una conversación nueva cuando la mensajería del servidor esté habilitada.',
    noMessagesTitle: 'No hay mensajes de demostración en esta vista',
    noMessagesBody: 'Elige otro filtro para ver las demás notas sintéticas.',
    replyLabel: 'Respuesta sintética en texto simple',
    replyPlaceholder: 'Escribe una respuesta de demostración…',
    sendReply: 'Agregar respuesta de muestra',
    replyDemoLabel: 'Tú · Respuesta sintética de prueba',
    replyAnnouncement: 'Respuesta aceptada en el entorno de prueba sintético y aislado. No se envió nada.',
    actionFailed: 'No se pudo completar esa acción sintética. No se cambió ningún dato.',
    characterLimitLabel: 'caracteres',
    readAnnouncement: 'Mensaje de demostración marcado como leído.',
    closedAnnouncement: 'Conversación de demostración cerrada.',
    newThreadTitle: 'Iniciar una conversación privada',
    newThreadIntro: 'Elige un docente actual y un tema. Solo el docente seleccionado puede ver esta conversación familiar.',
    contactLabel: 'Docente o integrante autorizado del personal',
    topicLabel: 'Tema',
    topicOptions: {
      assignment: 'Tarea',
      progress: 'Progreso de aprendizaje',
      access: 'Acceso familiar',
      technical: 'Ayuda técnica',
      other: 'Otro',
    },
    newMessageLabel: 'Mensaje',
    newMessagePlaceholder: 'Escribe un mensaje de texto simple…',
    startThread: 'Iniciar conversación',
    threadCreatedAnnouncement: 'Conversación privada creada.',
    messagingUnavailable: 'La mensajería no está disponible temporalmente. Las conversaciones existentes son de solo lectura.',
  },
  settings: {
    accessTitle: 'Vista previa del acceso familiar',
    accessBody:
      'Este grupo contiene tres estudiantes ficticios. En producción, el servidor debe verificar cada relación entre adulto y estudiante antes de devolver datos estudiantiles.',
    childrenLabel: 'Relaciones activas entre estudiante y escuela',
    schoolLabel: 'Escuela',
    activeLabel: 'Activa',
    relinquishAccessLabel: 'Renunciar al acceso',
    relinquishAccessBody: 'Inicia un flujo controlado para retirar la relación; nunca modifica directamente el expediente estudiantil.',
    relinquishConfirm: '¿Renunciar al acceso a este estudiante ficticio? Esta relación sintética no se puede restaurar desde el espacio familiar.',
    relinquishedAnnouncement: 'Se renunció al acceso familiar sintético.',
    languageTitle: 'Idioma del portal',
    languageBody: 'Cambia el idioma del espacio para adultos. Esto no cambia el idioma de la lección del estudiante.',
    appearanceTitle: 'Apariencia',
    appearanceBody: 'Elige un tema cómodo para este navegador.',
    lightTheme: 'Claro',
    darkTheme: 'Oscuro',
    previewPreferencesTitle: 'Preferencias de muestra',
    previewPreferencesBody:
      'Estos controles ejercitan únicamente un estado de prueba sintético y aislado; no crean notificaciones.',
    weeklyDigestLabel: 'Resumen semanal de aprendizaje',
    weeklyDigestBody: 'Prueba una preferencia para recibir un resumen semanal.',
    messageEmailLabel: 'Correo por mensaje nuevo',
    messageEmailBody: 'Prueba una preferencia de correo para un nuevo mensaje familiar.',
    accountSecurityTitle: 'Actividad y seguridad de la cuenta',
    accountSecurityBody: 'Revisa la actividad de inicio de sesión o termina sesiones en otros dispositivos mediante un flujo controlado.',
    accountActivityLabel: 'Ver actividad de la cuenta',
    signOutOtherDevicesLabel: 'Cerrar sesión en otros dispositivos',
    privacyWorkflowTitle: 'Solicitudes de datos familiares',
    privacyWorkflowBody: 'Inicia una solicitud revisada. Estas acciones nunca cambian directamente un expediente estudiantil.',
    accessRequestLabel: 'Solicitar copia de acceso',
    correctionRequestLabel: 'Solicitar una corrección',
    deletionRequestLabel: 'Solicitar revisión de eliminación',
    relationshipDisputeLabel: 'Disputar una relación',
    demoActionAnnouncement: 'Solo demostración sintética. No se envió ninguna solicitud ni cambió ningún registro.',
    actionFailed: 'No se pudo completar esa acción sintética. No se cambió ningún dato.',
    browserOnlyLabel: 'Solo estado sintético de prueba · sin envío de notificaciones reales',
  },
  print: {
    title: 'Resumen familiar de HELP Math',
    syntheticLabel: 'DEMOSTRACIÓN SINTÉTICA — SIN DATOS REALES',
    studentLabel: 'Resumen de aprendizaje de',
    generatedLabel: 'Instantánea',
    progressTitle: 'Actividad en la ruta de aprendizaje',
    assignmentsTitle: 'Próximas tareas',
    signalsTitle: 'Evidencia de habilidades',
    footer:
      'Esta impresión es una vista sintética del producto. No es una calificación oficial, boleta, expediente, decisión de ubicación ni registro estudiantil.',
  },
} satisfies FamilyPortalCopy;

function makeChild(locale: FamilyPortalLocale, seed: ChildSeed): FamilySelectedChild {
  const spanish = locale === 'es';
  const idBase = seed.sequence * 1_000;
  const dueDates = spanish
    ? ['27 ago', '30 ago', '21 ago']
    : ['Aug 27', 'Aug 30', 'Aug 21'];
  const statusLabels = spanish
    ? ['Próxima', 'Programada', 'Entregada']
    : ['Due soon', 'Upcoming', 'Submitted'];

  return {
    id: seed.id,
    announcements: [{
      body: spanish
        ? 'La próxima noche de matemáticas para familias usará actividades sintéticas y no requiere materiales en casa.'
        : 'The upcoming family math night uses synthetic activities and requires no materials from home.',
      id: demoUuid(idBase + 601),
      publishedAtLabel: spanish ? '20 ago, 4:00 p. m.' : 'Aug 20, 4:00 PM',
      publisherLabel: spanish ? 'Escuela de demostración' : 'Demo school',
      title: spanish ? 'Noche de matemáticas para familias' : 'Family math night',
    }],
    displayName: seed.displayName,
    initials: seed.initials,
    gradeLabel: spanish ? `Grado ${seed.grade}` : `Grade ${seed.grade}`,
    programLabel: spanish ? 'Programa bilingüe de matemáticas' : 'Bilingual math program',
    greeting: spanish
      ? `Hola, familia de ${seed.displayName}`
      : `Hello, ${seed.displayName}’s family`,
    overviewIntro: spanish
      ? `${seed.displayName} participó en ${seed.sessions} sesiones sintéticas esta semana. Aquí hay algunas señales para conversar y celebrar.`
      : `${seed.displayName} joined ${seed.sessions} synthetic learning sessions this week. Here are a few signals to discuss and celebrate.`,
    stats: [
      {
        id: demoUuid(idBase + 1),
        label: spanish ? 'Tiempo esta semana' : 'Time this week',
        value: `${seed.weeklyMinutes} min`,
        detail: spanish ? `${seed.sessions} sesiones de demostración` : `${seed.sessions} demo sessions`,
        tone: 'blue',
      },
      {
        id: demoUuid(idBase + 2),
        label: spanish ? 'Ruta actual' : 'Current path',
        value: `${seed.completionPercent}%`,
        detail: spanish
          ? `Página ${seed.currentPage} de ${seed.totalPages} visitada`
          : `Page ${seed.currentPage} of ${seed.totalPages} visited`,
        tone: 'mint',
      },
      {
        id: demoUuid(idBase + 3),
        label: spanish ? 'Tareas próximas' : 'Due soon',
        value: String(seed.dueSoon),
        detail: spanish ? 'Fechas sintéticas' : 'Synthetic due dates',
        tone: 'sun',
      },
      {
        id: demoUuid(idBase + 4),
        label: spanish ? 'Notas nuevas' : 'New notes',
        value: String(seed.unread),
        detail: spanish ? 'Mensajes de demostración' : 'Demo messages',
        tone: 'grape',
      },
    ],
    courses: [
      {
        id: demoUuid(idBase + 101),
        title: spanish ? `Matemáticas de ${seed.grade}.º grado` : `Grade ${seed.grade} Mathematics`,
        unitLabel: spanish ? `Lección ${seed.lesson} · Números y razonamiento` : `Lesson ${seed.lesson} · Numbers and reasoning`,
        completionPercent: seed.completionPercent,
        completionLabel: spanish
          ? `${seed.currentPage} de ${seed.totalPages} páginas visitadas`
          : `${seed.currentPage} of ${seed.totalPages} pages visited`,
        lastActivityLabel: spanish ? 'Actividad sintética de hoy' : 'Synthetic activity today',
        nextConversationPrompt: spanish
          ? '¿Qué estrategia te ayudó a comparar las cantidades?'
          : 'What strategy helped you compare the quantities?',
      },
      {
        id: demoUuid(idBase + 102),
        title: spanish ? 'Taller de lenguaje matemático' : 'Math Language Studio',
        unitLabel: spanish ? 'Palabras, representaciones y explicaciones' : 'Words, representations, and explanations',
        completionPercent: seed.languagePercent,
        completionLabel: spanish
          ? `${seed.languagePercent}% de actividades de lenguaje visitadas`
          : `${seed.languagePercent}% of language activities visited`,
        lastActivityLabel: spanish ? 'Actividad sintética de ayer' : 'Synthetic activity yesterday',
        nextConversationPrompt: spanish
          ? '¿Puedes explicar la palabra matemática con un ejemplo?'
          : 'Can you explain the math word with an example?',
      },
    ],
    skills: [
      {
        id: demoUuid(idBase + 201),
        label: spanish ? 'Conectar representaciones' : 'Connect representations',
        band: 'strong',
        levelLabel: spanish ? 'Sólida' : 'Strong',
        evidenceLabel: spanish ? 'Usó una recta numérica y un modelo visual.' : 'Used a number line and a visual model.',
        tone: 'mint',
      },
      {
        id: demoUuid(idBase + 202),
        label: spanish ? 'Explicar con lenguaje matemático' : 'Explain with math language',
        band: 'growing',
        levelLabel: spanish ? 'En desarrollo' : 'Growing',
        evidenceLabel: spanish ? 'Probó dos palabras objetivo en una explicación.' : 'Tried two target words in an explanation.',
        tone: 'blue',
      },
      {
        id: demoUuid(idBase + 203),
        label: spanish ? 'Comprobar el trabajo de forma independiente' : 'Check work independently',
        band: 'starting',
        levelLabel: spanish ? 'Inicial' : 'Starting',
        evidenceLabel: spanish ? 'La evidencia sintética todavía es limitada.' : 'Synthetic evidence is still limited.',
        tone: 'sun',
      },
      {
        id: demoUuid(idBase + 204),
        label: spanish ? 'Justificar una generalización' : 'Justify a generalization',
        band: 'insufficient_evidence',
        levelLabel: spanish ? 'Aún no hay suficiente evidencia' : 'Not enough evidence',
        evidenceLabel: spanish
          ? 'Todavía no hay suficientes observaciones sintéticas para mostrar un estado.'
          : 'There are not yet enough synthetic observations to show a status.',
        tone: 'grape',
      },
    ],
    recentActivity: [
      {
        id: demoUuid(idBase + 301),
        dateLabel: spanish ? 'Hoy' : 'Today',
        title: spanish ? 'Comparó cantidades con un modelo visual' : 'Compared quantities with a visual model',
        detail: spanish ? 'Actividad sintética · 14 minutos' : 'Synthetic activity · 14 minutes',
      },
      {
        id: demoUuid(idBase + 302),
        dateLabel: spanish ? 'Ayer' : 'Yesterday',
        title: spanish ? 'Repasó vocabulario de la lección' : 'Reviewed lesson vocabulary',
        detail: spanish ? 'Actividad sintética · 9 minutos' : 'Synthetic activity · 9 minutes',
      },
      {
        id: demoUuid(idBase + 303),
        dateLabel: spanish ? 'Esta semana' : 'This week',
        title: spanish ? 'Explicó una estrategia paso a paso' : 'Explained a strategy step by step',
        detail: spanish ? 'Actividad sintética · 11 minutos' : 'Synthetic activity · 11 minutes',
      },
    ],
    assignments: [
      {
        id: demoUuid(idBase + 401),
        title: spanish ? 'Compara dos modelos visuales' : 'Compare two visual models',
        courseLabel: spanish ? `Matemáticas de ${seed.grade}.º grado` : `Grade ${seed.grade} Mathematics`,
        dueLabel: dueDates[0]!,
        status: 'in_progress',
        statusLabel: statusLabels[0]!,
        familyNote: spanish
          ? 'Pídele que explique qué parte de cada modelo comparó primero.'
          : 'Ask which part of each model they compared first.',
      },
      {
        id: demoUuid(idBase + 402),
        title: spanish ? 'Palabras matemáticas en contexto' : 'Math words in context',
        courseLabel: spanish ? 'Taller de lenguaje matemático' : 'Math Language Studio',
        dueLabel: dueDates[1]!,
        status: 'not_started',
        statusLabel: statusLabels[1]!,
        familyNote: spanish
          ? 'Elige una palabra objetivo y creen juntos un ejemplo cotidiano.'
          : 'Choose one target word and make an everyday example together.',
      },
      {
        id: demoUuid(idBase + 403),
        title: spanish ? 'Nota sobre mi estrategia' : 'My strategy note',
        courseLabel: spanish ? `Matemáticas de ${seed.grade}.º grado` : `Grade ${seed.grade} Mathematics`,
        dueLabel: dueDates[2]!,
        status: 'completed',
        statusLabel: statusLabels[2]!,
        familyNote: spanish
          ? 'Esta entrega es sintética y no incluye una calificación.'
          : 'This submission is synthetic and does not include a grade.',
      },
    ],
    messages: [
      syntheticFamilyMessage({
        id: demoUuid(idBase + 501),
        senderLabel: spanish ? 'Sra. Chen · Docente de demostración' : 'Ms. Chen · Demo teacher',
        sentAtLabel: spanish ? 'Hoy, 9:15 a. m.' : 'Today, 9:15 AM',
        subject: spanish ? 'Una estrategia para celebrar' : 'A strategy to celebrate',
        body: spanish
          ? `${seed.displayName} usó hoy un modelo visual y luego explicó por qué funcionaba. Pueden celebrar la explicación, no solo la respuesta.`
          : `${seed.displayName} used a visual model today and then explained why it worked. You can celebrate the explanation, not only the answer.`,
        initiallyRead: false,
        initiallyClosed: false,
      }),
      syntheticFamilyMessage({
        id: demoUuid(idBase + 502),
        senderLabel: spanish ? 'Equipo de aprendizaje · Demostración' : 'Learning team · Demo',
        sentAtLabel: spanish ? 'Ayer, 3:40 p. m.' : 'Yesterday, 3:40 PM',
        subject: spanish ? 'Pregunta para conversar esta semana' : 'Conversation prompt for this week',
        body: spanish
          ? 'Pregunten: “¿Dónde ves matemáticas en casa?” Una explicación con palabras, dibujos o gestos es una buena forma de participar.'
          : 'Ask: “Where do you notice math at home?” An explanation with words, drawings, or gestures is a valuable way to participate.',
        initiallyRead: seed.unread < 2,
        initiallyClosed: false,
      }),
      syntheticFamilyMessage({
        id: demoUuid(idBase + 503),
        senderLabel: spanish ? 'Ayuda familiar · Demostración' : 'Family support · Demo',
        sentAtLabel: spanish ? '18 ago, 10:05 a. m.' : 'Aug 18, 10:05 AM',
        subject: spanish ? 'Cómo leer las señales de progreso' : 'How to read progress signals',
        body: spanish
          ? 'Las etiquetas Inicial, En desarrollo, Sólida y Aún no hay suficiente evidencia describen práctica en esta vista. No son calificaciones oficiales ni decisiones de ubicación.'
          : 'Starting, Growing, Strong, and Not enough evidence describe practice in this view. They are not official grades or placement decisions.',
        initiallyRead: true,
        initiallyClosed: true,
      }),
    ],
    progressEvidence: {
      computedAtLabel: spanish ? '23 ago de 2026, 10:30 a. m.' : 'Aug 23, 2026, 10:30 AM',
      projectionVersion: 'skill_projection_v1',
      releaseVersion: `g${seed.grade}-l${seed.lesson}-synthetic-r1`,
      stale: seed.sequence === 3,
      statusLabel: seed.sequence === 3
        ? (spanish ? 'Puede tener retraso' : 'May be delayed')
        : (spanish ? 'Actual para esta instantánea' : 'Current for this snapshot'),
      whyStatusLabel: seed.sequence === 3
        ? (spanish
            ? 'La última actividad sintética disponible está fuera de la ventana reciente; no se infiere actividad faltante.'
            : 'The latest available synthetic activity is outside the recent window; missing activity is not inferred.')
        : (spanish
            ? 'La proyección se calculó con eventos sintéticos disponibles para esta versión de aprendizaje.'
            : 'The projection was computed from synthetic events available for this learning release.'),
    },
  };
}

export function getFamilyDemoData(
  locale: FamilyPortalLocale,
  requestedChildId?: string | null,
  allowedChildIds?: readonly string[],
): FamilyPortalUiDto {
  const allowed = allowedChildIds ? new Set(allowedChildIds) : null;
  const children = CHILD_SEEDS
    .filter((seed) => !allowed || allowed.has(seed.id))
    .map((seed) => makeChild(locale, seed));
  if (!children.length) throw new Error('No authorized synthetic family child is available.');
  const selectedChild = children.find((child) => child.id === requestedChildId) ?? children[0]!;
  const copy = locale === 'es' ? ES_COPY : EN_COPY;

  return {
    schemaVersion: 1,
    locale,
    demoKind: 'synthetic-family-portal',
    synthetic: true,
    snapshotLabel: locale === 'es'
      ? 'Instantánea sintética · 23 de agosto de 2026'
      : 'Synthetic snapshot · August 23, 2026',
    tenant: {
      id: demoUuid(1),
      displayName: locale === 'es' ? 'Escuela Horizonte · Demostración' : 'Horizon School · Demo',
    },
    children: children.map(({id, displayName, initials, gradeLabel, programLabel}) => ({
      id,
      displayName,
      initials,
      gradeLabel,
      programLabel,
    })),
    selectedChild,
    navigation: [
      {view: 'overview', label: copy.screenTitles.overview},
      {view: 'progress', label: copy.screenTitles.progress},
      {view: 'assignments', label: copy.screenTitles.assignments},
      {view: 'messages', label: copy.screenTitles.messages},
      {view: 'settings', label: copy.screenTitles.settings},
    ],
    messageContacts: [{
      childId: selectedChild.id,
      enrollmentId: demoUuid(7_000 + children.indexOf(selectedChild)),
      staffDisplayName: locale === 'es'
        ? 'Sra. Chen · Docente de demostración'
        : 'Ms. Chen · Demo teacher',
      staffUserId: '10000000-0000-4000-8000-000000000012',
    }],
    notificationPreference: {
      messageEmailEnabled: false,
      weeklyDigestEnabled: false,
    },
    copy,
  };
}

export function getTeacherMessagesDemoData(
  locale: FamilyPortalLocale,
): TeacherMessagesDemoDto {
  const spanish = locale === 'es';
  const tenant = {
    id: demoUuid(1),
    displayName: spanish ? 'Escuela Horizonte · Demostración' : 'Horizon School · Demo',
  };

  return {
    locale,
    synthetic: true,
    tenant,
    title: spanish ? 'Mensajes para familias' : 'Family messages',
    intro: spanish
      ? 'Una bandeja docente mínima para leer, responder y cerrar conversaciones familiares sintéticas.'
      : 'A minimal teacher inbox for reading, replying to, and closing synthetic family conversations.',
    workspaceLabel: spanish ? 'Espacio docente' : 'Teacher workspace',
    syntheticBadge: spanish ? 'Demostración sintética' : 'Synthetic demo',
    syntheticTitle: spanish ? 'Mensajería sintética aislada sin destinatarios reales' : 'Isolated synthetic messaging with no real recipients',
    syntheticBody: spanish
      ? 'Las personas, estudiantes y mensajes son ficticios. Las acciones usan únicamente un estado de prueba sintético y aislado; no generan correo, notificaciones ni registros escolares reales.'
      : 'People, students, and messages are fictional. Actions use isolated synthetic test state only and create no real email, notification, or school record.',
    threadListLabel: spanish ? 'Conversaciones familiares sintéticas' : 'Synthetic family conversations',
    noSelectionLabel: spanish ? 'Selecciona una conversación' : 'Choose a conversation',
    unreadLabel: spanish ? 'No leído' : 'Unread',
    readLabel: spanish ? 'Leído' : 'Read',
    closedLabel: spanish ? 'Cerrado' : 'Closed',
    markRead: spanish ? 'Marcar como leído' : 'Mark as read',
    closeThread: spanish ? 'Cerrar conversación' : 'Close conversation',
    closedReadOnly: spanish
      ? 'Esta conversación está cerrada permanentemente y es de solo lectura.'
      : 'This conversation is permanently closed and read-only.',
    newThreadHint: spanish
      ? 'Para continuar, crea una conversación nueva cuando la mensajería del servidor esté habilitada.'
      : 'To continue, create a new conversation after server messaging is enabled.',
    replyLabel: spanish ? 'Respuesta docente en texto simple' : 'Plain-text teacher reply',
    replyPlaceholder: spanish ? 'Escribe una respuesta de demostración…' : 'Write a demo reply…',
    addReply: spanish ? 'Agregar respuesta de muestra' : 'Add demo reply',
    localReplyLabel: spanish ? 'Tú · Respuesta docente sintética' : 'You · Synthetic teacher reply',
    replyAnnouncement: spanish
      ? 'Respuesta aceptada en el entorno sintético aislado. No se envió nada.'
      : 'Reply accepted in the isolated synthetic environment. Nothing was sent.',
    actionFailed: spanish
      ? 'No se pudo completar esa acción sintética. No se cambió ningún dato.'
      : 'That synthetic action could not be completed. No data was changed.',
    readAnnouncement: spanish ? 'Conversación marcada como leída.' : 'Conversation marked as read.',
    closedAnnouncement: spanish ? 'Conversación sintética cerrada.' : 'Synthetic conversation closed.',
    characterLabel: spanish ? 'caracteres' : 'characters',
    announcementSchools: [{
      displayName: spanish ? 'Escuela Horizonte · Demostración' : 'Horizon School · Demo',
      id: demoUuid(6_200),
    }],
    announcementPublishingAvailable: true,
    announcementComposeTitle: spanish ? 'Publicar un anuncio escolar' : 'Publish a school announcement',
    announcementComposeIntro: spanish
      ? 'Comparte una actualización breve en texto simple con las familias autorizadas de una escuela actual.'
      : 'Share a short plain-text update with authorized families at one current school.',
    announcementSchoolLabel: spanish ? 'Escuela' : 'School',
    announcementTitleLabel: spanish ? 'Título del anuncio' : 'Announcement title',
    announcementTitlePlaceholder: spanish ? 'Título breve' : 'Short title',
    announcementBodyLabel: spanish ? 'Mensaje en texto simple' : 'Plain-text message',
    announcementBodyPlaceholder: spanish ? 'Escribe la actualización escolar…' : 'Write the school update…',
    publishAnnouncement: spanish ? 'Agregar anuncio sintético' : 'Add synthetic announcement',
    announcementPublished: spanish
      ? 'Vista previa del anuncio completada localmente. No se guardó ni envió nada.'
      : 'Announcement preview completed locally. Nothing was saved or sent.',
    announcementUnavailable: spanish
      ? 'La publicación de anuncios no está disponible. No se guardará ningún dato.'
      : 'Announcement publishing is unavailable. No data will be saved.',
    announcementPrivacyNote: spanish
      ? 'Nunca se muestra la lista de destinatarios. Las respuestas familiares crean conversaciones privadas separadas.'
      : 'Recipient lists are never shown. Family replies create separate private conversations.',
    threads: [
      {
        id: demoUuid(6_001),
        childId: demoUuid(101),
        guardianLabel: spanish ? 'A. Rivera · Familiar de muestra' : 'A. Rivera · Demo guardian',
        childLabel: 'Maya R.',
        gradeLabel: spanish ? 'Grado 4' : 'Grade 4',
        subject: spanish ? 'Estrategia de comparación' : 'Comparison strategy',
        unreadCount: 1,
        status: 'open',
        messages: [
          {
            id: demoUuid(6_101),
            senderLabel: spanish ? 'A. Rivera · Familiar de muestra' : 'A. Rivera · Demo guardian',
            sentAtLabel: spanish ? 'Hoy, 8:42 a. m.' : 'Today, 8:42 AM',
            body: spanish
              ? 'Maya explicó su modelo en casa. ¿Hay otra pregunta que podamos hacerle esta semana?'
              : 'Maya explained her model at home. Is there another question we can ask this week?',
            mine: false,
          },
          {
            id: demoUuid(6_102),
            senderLabel: spanish ? 'Tú · Docente de muestra' : 'You · Demo teacher',
            sentAtLabel: spanish ? 'Ayer, 2:10 p. m.' : 'Yesterday, 2:10 PM',
            body: spanish
              ? 'Prueben preguntarle qué parte del modelo decidió comparar primero y por qué.'
              : 'Try asking which part of the model she chose to compare first and why.',
            mine: true,
          },
        ],
      },
      {
        id: demoUuid(6_002),
        childId: demoUuid(102),
        guardianLabel: spanish ? 'R. Rivera · Familiar de muestra' : 'R. Rivera · Demo guardian',
        childLabel: 'Diego R.',
        gradeLabel: spanish ? 'Grado 5' : 'Grade 5',
        subject: spanish ? 'Palabras matemáticas de esta semana' : 'Math words for this week',
        unreadCount: 0,
        status: 'open',
        messages: [
          {
            id: demoUuid(6_201),
            senderLabel: spanish ? 'R. Rivera · Familiar de muestra' : 'R. Rivera · Demo guardian',
            sentAtLabel: spanish ? 'Ayer, 5:30 p. m.' : 'Yesterday, 5:30 PM',
            body: spanish
              ? '¿Podemos practicar las palabras objetivo en español y en inglés?'
              : 'Can we practice the target words in both Spanish and English?',
            mine: false,
          },
        ],
      },
      {
        id: demoUuid(6_003),
        childId: demoUuid(103),
        guardianLabel: spanish ? 'S. Rivera · Familiar de muestra' : 'S. Rivera · Demo guardian',
        childLabel: 'Luna R.',
        gradeLabel: spanish ? 'Grado 3' : 'Grade 3',
        subject: spanish ? 'Resumen semanal' : 'Weekly summary',
        unreadCount: 0,
        status: 'closed',
        messages: [
          {
            id: demoUuid(6_301),
            senderLabel: spanish ? 'Tú · Docente de muestra' : 'You · Demo teacher',
            sentAtLabel: spanish ? '18 ago, 11:05 a. m.' : 'Aug 18, 11:05 AM',
            body: spanish
              ? 'Luna participó en tres actividades sintéticas y probó una nueva representación.'
              : 'Luna joined three synthetic activities and tried a new representation.',
            mine: true,
          },
        ],
      },
    ],
  };
}

export function getAdminFamilyAccessDemoData(
  locale: FamilyPortalLocale,
): AdminFamilyAccessDemoDto {
  const spanish = locale === 'es';
  const portal = getFamilyDemoData(locale);
  const pending = spanish ? 'Pendiente' : 'Pending';
  const accepted = spanish ? 'Aceptada' : 'Accepted';
  const revoked = spanish ? 'Revocada' : 'Revoked';

  return {
    locale,
    synthetic: true,
    tenant: {
      id: demoUuid(1),
      displayName: spanish ? 'Escuela Horizonte · Demostración' : 'Horizon School · Demo',
    },
    title: spanish ? 'Acceso familiar' : 'Family access',
    intro: spanish
      ? 'Invita a una persona adulta verificada y administra relaciones familiares sintéticas.'
      : 'Invite a verified adult and manage synthetic family relationships.',
    workspaceLabel: spanish ? 'Administración escolar' : 'School administration',
    syntheticBadge: spanish ? 'Demostración sintética' : 'Synthetic demo',
    syntheticTitle: spanish ? 'Ninguna invitación sale del entorno sintético aislado' : 'No invitation leaves the isolated synthetic environment',
    syntheticBody: spanish
      ? 'Usa únicamente direcciones ficticias que terminen en .invalid. Crear o revocar una invitación solo cambia el estado sintético aislado y nunca envía correo.'
      : 'Use fictional addresses ending in .invalid only. Creating or revoking an invitation changes isolated synthetic state and never sends email.',
    createTitle: spanish ? 'Crear invitación de muestra' : 'Create demo invitation',
    createIntro: spanish
      ? 'Selecciona un estudiante ficticio y una dirección reservada para pruebas.'
      : 'Choose a fictional learner and a testing-only address.',
    childLabel: spanish ? 'Estudiante' : 'Learner',
    adultEmailLabel: spanish ? 'Correo ficticio de la persona adulta' : 'Fictional adult email',
    adultEmailPlaceholder: 'adult@example.invalid',
    adultEmailHint: spanish
      ? 'Las direcciones reales se rechazan en esta demostración.'
      : 'Real addresses are rejected in this demo.',
    invalidEmailLabel: spanish
      ? 'Usa una dirección ficticia que termine en .invalid.'
      : 'Use a fictional address ending in .invalid.',
    invitationCreationEnabled: true,
    invitationRecipientPolicy: 'demo-invalid',
    invitationCreationUnavailable: spanish
      ? 'La emisión de invitaciones no está disponible en este perfil.'
      : 'Invitation issuance is unavailable in this profile.',
    createInvitation: spanish ? 'Crear invitación sintética' : 'Create synthetic invitation',
    invitationCreated: spanish
      ? 'Invitación creada en el entorno sintético aislado. No se envió correo.'
      : 'Invitation created in the isolated synthetic environment. No email was sent.',
    actionFailed: spanish
      ? 'No se pudo completar esa acción sintética. No se cambió ningún dato.'
      : 'That synthetic action could not be completed. No data was changed.',
    accessListTitle: spanish ? 'Invitaciones y acceso' : 'Invitations and access',
    accessListIntro: spanish
      ? 'Los identificadores son UUID opacos y las identidades visibles son ficticias.'
      : 'Resource identifiers are opaque UUIDs and every visible identity is fictional.',
    pendingLabel: pending,
    acceptedLabel: accepted,
    revokedLabel: revoked,
    expiresPrefix: spanish ? 'Vence' : 'Expires',
    resend: spanish ? 'Reenviar invitación' : 'Resend invitation',
    resentAnnouncement: spanish
      ? 'Invitación sintética renovada. No se envió correo.'
      : 'Synthetic invitation renewed. No email was sent.',
    revoke: spanish ? 'Revocar acceso' : 'Revoke access',
    revokedAnnouncement: spanish
      ? 'Acceso revocado en el entorno sintético aislado.'
      : 'Access revoked in the isolated synthetic environment.',
    children: portal.children,
    invitations: [
      {
        id: demoUuid(7_001),
        guardianLinkId: demoUuid(20),
        childId: demoUuid(101),
        childDisplayName: 'Maya R.',
        gradeLabel: spanish ? 'Grado 4' : 'Grade 4',
        guardianLabel: spanish ? 'A. Rivera · Familiar de muestra' : 'A. Rivera · Demo guardian',
        destinationLabel: 'guardian.one@example.invalid',
        status: 'accepted',
        statusLabel: accepted,
        expiresLabel: spanish ? 'Aceptada el 20 ago' : 'Accepted Aug 20',
      },
      {
        id: demoUuid(7_002),
        childId: demoUuid(102),
        childDisplayName: 'Diego R.',
        gradeLabel: spanish ? 'Grado 5' : 'Grade 5',
        guardianLabel: spanish ? 'R. Rivera · Familiar de muestra' : 'R. Rivera · Demo guardian',
        destinationLabel: 'guardian.two@example.invalid',
        status: 'pending',
        statusLabel: pending,
        expiresLabel: spanish ? '30 ago de 2026' : 'Aug 30, 2026',
      },
      {
        id: demoUuid(7_003),
        childId: demoUuid(103),
        childDisplayName: 'Luna R.',
        gradeLabel: spanish ? 'Grado 3' : 'Grade 3',
        guardianLabel: spanish ? 'S. Rivera · Familiar de muestra' : 'S. Rivera · Demo guardian',
        destinationLabel: 'guardian.three@example.invalid',
        status: 'revoked',
        statusLabel: revoked,
        expiresLabel: spanish ? 'Revocada el 19 ago' : 'Revoked Aug 19',
      },
    ],
  };
}

export function getFamilyInvitationAcceptDemoData(
  locale: FamilyPortalLocale,
): FamilyInvitationAcceptDemoDto {
  const spanish = locale === 'es';
  return {
    locale,
    synthetic: true,
    workspaceLabel: spanish ? 'Invitación familiar' : 'Family invitation',
    syntheticBadge: spanish ? 'Demostración sintética' : 'Synthetic demo',
    syntheticBody: spanish
      ? 'El token nunca se muestra ni se envía en la URL al servidor. Esta vista sintética no crea una cuenta ni una relación real.'
      : 'The token is never displayed or sent to the server in the URL. This synthetic view creates no real account or relationship.',
    title: spanish ? 'Acepta una invitación familiar con seguridad' : 'Accept a family invitation safely',
    intro: spanish
      ? 'La identidad y la relación se verifican en el servidor antes de revelar cualquier detalle de escuela o estudiante.'
      : 'Identity and relationship are verified on the server before any school or learner detail is revealed.',
    signInTitle: spanish ? 'Inicia sesión para revisar la invitación' : 'Sign in to review the invitation',
    signInBody: spanish
      ? 'Usa la misma dirección adulta verificada que recibió la invitación. Todavía no se muestran detalles de estudiante o escuela.'
      : 'Use the same verified adult address that received the invitation. No learner or school details are shown yet.',
    signInLabel: spanish ? 'Ir al inicio de sesión' : 'Go to sign in',
    tokenMissingTitle: spanish ? 'Abre el enlace original de la invitación' : 'Open the original invitation link',
    tokenMissingBody: spanish
      ? 'No hay un token de invitación guardado en esta pestaña. Solicita un enlace nuevo si el anterior venció o fue revocado.'
      : 'No invitation token is stored in this tab. Request a new link if the previous one expired or was revoked.',
    readyTitle: spanish ? 'Invitación lista para verificación' : 'Invitation ready for verification',
    readyBody: spanish
      ? 'Los detalles permanecerán ocultos hasta que el servidor verifique el token, la sesión y el correo adulto.'
      : 'Details remain hidden until the server verifies the token, session, and adult email.',
    safetyTitle: spanish ? 'Antes de continuar' : 'Before continuing',
    safetyPoints: spanish
      ? [
          'Debes iniciar sesión con la misma dirección adulta verificada.',
          'El servidor debe verificar la relación antes de mostrar cualquier dato estudiantil.',
          'La escuela o la persona adulta puede revocar el acceso posteriormente.',
        ]
      : [
          'You must sign in with the same verified adult address.',
          'The server must verify the relationship before returning any student data.',
          'The school or adult can revoke access later.',
        ],
    confirmationLabel: spanish
      ? 'Reconozco esta relación y confirmo que estoy autorizado para apoyar a este estudiante.'
      : 'I recognize this relationship and confirm that I am authorized to support this learner.',
    acceptLabel: spanish ? 'Aceptar invitación sintética' : 'Accept synthetic invitation',
    declineLabel: spanish ? 'Rechazar demostración' : 'Decline demo',
    submittingLabel: spanish ? 'Verificando de forma segura…' : 'Verifying securely…',
    acceptError: spanish
      ? 'La invitación no pudo verificarse. No se reveló ningún dato.'
      : 'The invitation could not be verified. No data was revealed.',
    acceptedTitle: spanish ? 'Invitación sintética aceptada' : 'Synthetic invitation accepted',
    acceptedBody: spanish
      ? 'La demostración terminó localmente. No se creó una relación familiar ni se mostró ningún dato real.'
      : 'The demo finished locally. No family relationship was created and no real data was shown.',
    declinedTitle: spanish ? 'Invitación sintética rechazada' : 'Synthetic invitation declined',
    declinedBody: spanish
      ? 'No se realizó ningún cambio. En producción, esta decisión debe invalidar la invitación de forma segura.'
      : 'Nothing changed. In production, this choice must safely invalidate the invitation.',
  };
}
