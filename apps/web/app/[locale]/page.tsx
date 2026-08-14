import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

import {LearningPlatformHome} from '@/components/learning-platform-home';
import {isLocale} from '@/content';
import {createPageMetadata} from '@/lib/metadata';

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  return createPageMetadata(locale, locale === 'es' ? {
    title: 'Aprende matemáticas con HELP Math',
    description: 'Tu plataforma bilingüe de aprendizaje: empieza Grade 4 Lesson 3, Negative Numbers, con animaciones, apoyos y Nova Tutor.',
  } : {
    title: 'Learn math with HELP Math',
    description: 'Your bilingual learning platform: start Grade 4 Lesson 3, Negative Numbers, with animation, learning supports, and Nova Tutor.',
  });
}

export default async function Home({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  return (
    <main id="main-content">
      <LearningPlatformHome locale={locale} />
    </main>
  );
}
