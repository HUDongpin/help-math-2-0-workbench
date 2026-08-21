import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

import {LearningPlatformWorkspace} from '@/components/learning-platform-workspace';
import {isLocale} from '@/content';
import {readAuthSession} from '@/lib/clerk-auth-session.server';
import {availableLearningLessons} from '@/lib/learning-lesson-availability.server';
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
  const availableLessons = availableLearningLessons();
  let description = locale === 'es'
    ? 'Tu espacio bilingüe de HELP Math con práctica, vocabulario, apoyos de aprendizaje y límites de disponibilidad claros.'
    : 'Your bilingual HELP Math workspace with practice, vocabulary, learning supports, and clear availability boundaries.';
  if (availableLessons.length > 1) {
    description = locale === 'es'
      ? `Tu plataforma bilingüe de aprendizaje: abre ${availableLessons.length} lecciones modernas con animaciones y apoyos para aprender.`
      : `Your bilingual learning platform: open ${availableLessons.length} modern lessons with animation and learning supports.`;
  } else if (availableLessons.length === 1) {
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
  const availableLessons = availableLearningLessons();
  return <LearningPlatformWorkspace
    activeLesson={availableLessons.find((lesson) =>
      lesson.grade === 4 && lesson.lesson === 3
    ) ?? availableLessons[0] ?? null}
    authStatus={authSession.status}
    availableLessons={availableLessons}
    designerToolsVisible={designerToolsVisible}
    initialRole={state.role}
    initialScreen={state.screen}
    key={`${locale}:${state.role}:${state.screen}:${designerToolsVisible ? 'designer' : 'learner'}`}
    locale={locale}
    migrationStatusAvailable={migrationStatusAvailable}
  />;
}
