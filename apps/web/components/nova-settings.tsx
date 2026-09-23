'use client';

import {useRouter} from 'next/navigation';
import {useState} from 'react';

import type {
  NovaClassSetting,
  NovaSchoolSetting,
} from '@/lib/nova-class-policy.server';

import styles from './nova-settings.module.css';

export function NovaSettings({
  classes: initialClasses,
  locale,
  schools: initialSchools,
}: {
  classes: NovaClassSetting[];
  locale: 'en' | 'es';
  schools: NovaSchoolSetting[];
}) {
  const router = useRouter();
  const spanish = locale === 'es';
  const [classes, setClasses] = useState(initialClasses);
  const [schools, setSchools] = useState(initialSchools);
  const [saving, setSaving] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  async function save(
    kind: 'schools' | 'classes',
    id: string,
    enabled: boolean,
    version: number,
  ) {
    setSaving(id);
    setNotice('');
    try {
      const response = await fetch(`/api/nova-policy/${kind}/${id}`, {
        method: 'PUT',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({enabled, version}),
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(String(response.status));
      const result = await response.json() as {version: number};
      if (kind === 'schools') {
        setSchools((items) => items.map((item) => item.id === id
          ? {...item, allowed: enabled, version: result.version} : item));
        setClasses((items) => items.map((item) => item.schoolId === id
          ? {...item, schoolAllowed: enabled, enabled: enabled && item.enabled}
          : item));
      } else {
        setClasses((items) => items.map((item) => item.id === id
          ? {...item, enabled, version: result.version} : item));
      }
      setNotice(spanish ? 'Se guardó el cambio.' : 'Change saved.');
      router.refresh();
    } catch {
      setNotice(spanish
        ? 'No se pudo guardar. Actualiza la página y vuelve a intentarlo.'
        : 'Could not save. Refresh the page and try again.');
    } finally {
      setSaving(null);
    }
  }

  return <main className={styles.page} id="main-content">
    <header>
      <p className={styles.eyebrow}>HELP Math</p>
      <h1>{spanish ? 'Controles de Nova Tutor' : 'Nova Tutor controls'}</h1>
      <p>{spanish
        ? 'La escuela permite o prohíbe la elección. Cada docente decide por su clase. Las clases nuevas comienzan con Nova desactivada.'
        : 'The school permits or blocks teacher choice. Each teacher decides for their class. New classes start with Nova off.'}</p>
    </header>
    <p aria-live="polite" role="status">{notice}</p>
    {schools.length > 0 ? <section aria-labelledby="school-policy-title">
      <h2 id="school-policy-title">{spanish ? 'Política escolar' : 'School policy'}</h2>
      {schools.map((school) => <article className={styles.card} key={school.id}>
        <div><h3>{school.name}</h3><p>{spanish
          ? 'Permitir que los docentes elijan si Nova está disponible en sus clases.'
          : 'Allow teachers to choose whether Nova is available in their classes.'}</p></div>
        <button
          aria-checked={school.allowed}
          aria-label={`${school.name}: ${spanish ? 'permitir elección docente' : 'allow teacher choice'}`}
          disabled={saving !== null}
          onClick={() => void save('schools', school.id, !school.allowed, school.version)}
          role="switch"
          type="button"
        >{school.allowed ? (spanish ? 'Permitido' : 'Allowed')
          : (spanish ? 'Bloqueado' : 'Blocked')}</button>
      </article>)}
    </section> : null}
    {classes.length > 0 ? <section aria-labelledby="class-policy-title">
      <h2 id="class-policy-title">{spanish ? 'Mis clases' : 'My classes'}</h2>
      {classes.map((classroom) => <article className={styles.card} key={classroom.id}>
        <div><h3>{classroom.name}</h3><p>{classroom.schoolName}</p>
          {!classroom.schoolAllowed ? <p className={styles.locked}>{spanish
            ? 'La escuela ha bloqueado Nova. No puedes activarla.'
            : 'The school has blocked Nova. You cannot turn it on.'}</p> : null}
          <a href={`/${locale}?classId=${encodeURIComponent(classroom.id)}`}>
            {spanish ? 'Abrir espacio de clase' : 'Open class workspace'}
          </a>
        </div>
        <button
          aria-checked={classroom.schoolAllowed && classroom.enabled}
          aria-label={`${classroom.name}: ${spanish ? 'Nova disponible' : 'Nova available'}`}
          disabled={saving !== null || !classroom.schoolAllowed}
          onClick={() => void save('classes', classroom.id, !classroom.enabled, classroom.version)}
          role="switch"
          type="button"
        >{classroom.schoolAllowed && classroom.enabled
          ? (spanish ? 'Activada' : 'On')
          : (spanish ? 'Desactivada' : 'Off')}</button>
      </article>)}
    </section> : null}
    {schools.length === 0 && classes.length === 0 ? <p>{spanish
      ? 'Tu cuenta no tiene permisos para cambiar Nova.'
      : 'Your account has no permission to change Nova.'}</p> : null}
  </main>;
}
