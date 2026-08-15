import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

import {LearningPlatformWorkspace} from '@/components/learning-platform-workspace';
import {isLocale} from '@/content';
import {readAuthSession} from '@/lib/clerk-auth-session.server';
import {isG4L3LearningEntryAvailable} from '@/lib/g4-l3-learning-entry.server';
import {isG5L4LearningEntryAvailable} from '@/lib/g5-l4-learning-entry.server';
import {createPageMetadata} from '@/lib/metadata';
import {
  isMigrationStatusAvailable,
  isMigrationStatusDesignerViewRequested,
} from '@/lib/migration-status-access';

type WorkspaceQuery = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function workspaceState(query: WorkspaceQuery, designerToolsVisible: boolean) {
  const role = first(query.role) === 'teacher'
    ? 'teacher' as const
    : 'student' as const;
  const requested = first(query.screen);
  const allowed = role === 'teacher'
    ? designerToolsVisible ? ['class', 'prep', 'notes'] as const : ['class', 'prep'] as const
    : designerToolsVisible ? ['today', 'practice', 'words', 'lessons', 'notes'] as const : ['today', 'practice', 'words', 'lessons'] as const;
  const screen = allowed.find((candidate) => candidate === requested)
    ?? (role === 'teacher' ? 'class' : 'today');
  return {role, screen};
}

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const g4L3Available = isG4L3LearningEntryAvailable();
  const g5L4Available = isG5L4LearningEntryAvailable();
  const lessonAvailable = g4L3Available || g5L4Available;
  const bothLessonsAvailable = g4L3Available && g5L4Available;
  let description = locale === 'es'
    ? 'Tu espacio bilingüe de HELP Math con práctica, vocabulario, apoyos de aprendizaje y límites de disponibilidad claros.'
    : 'Your bilingual HELP Math workspace with practice, vocabulary, learning supports, and clear availability boundaries.';
  if (bothLessonsAvailable) {
    description = locale === 'es'
      ? 'Tu plataforma bilingüe de aprendizaje: abre Grade 4 Lesson 3, Negative Numbers, o Grade 5 Lesson 4, Number Lines.'
      : 'Your bilingual learning platform: open Grade 4 Lesson 3, Negative Numbers, or Grade 5 Lesson 4, Number Lines.';
  } else if (lessonAvailable) {
    description = locale === 'es'
      ? 'Tu plataforma bilingüe de aprendizaje: abre una lección disponible con animaciones y apoyos para aprender.'
      : 'Your bilingual learning platform: open an available lesson with animation and learning supports.';
  }
  return createPageMetadata(locale, locale === 'es' ? {
    title: 'Aprende matemáticas con HELP Math',
    description,
  } : {
    title: 'Learn math with HELP Math',
    description,
  });
}

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<WorkspaceQuery>;
}) {
  const [{locale}, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const authSession = await readAuthSession();
  const migrationStatusAvailable = isMigrationStatusAvailable();
  const designerToolsVisible = migrationStatusAvailable
    && isMigrationStatusDesignerViewRequested(query.view);
  const state = workspaceState(query, designerToolsVisible);
  const g4L3Available = isG4L3LearningEntryAvailable();
  const g5L4Available = isG5L4LearningEntryAvailable();
  return <LearningPlatformWorkspace
    authStatus={authSession.status}
    designerToolsVisible={designerToolsVisible}
    g4L3Available={g4L3Available}
    g5L4Available={g5L4Available}
    initialRole={state.role}
    initialScreen={state.screen}
    key={`${locale}:${state.role}:${state.screen}:${designerToolsVisible ? 'designer' : 'learner'}`}
    locale={locale}
    migrationStatusAvailable={migrationStatusAvailable}
  />;
}
