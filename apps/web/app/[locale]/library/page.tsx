import type {Metadata} from 'next';

import {Container} from '@/components/ui';
import {Link} from '@/i18n/navigation';
import {completeAnimations} from '@/lib/catalog';

export const metadata: Metadata = {title: 'Animation library'};
export const dynamic = 'force-dynamic';
type Query = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? '' : value ?? '';

export default async function LibraryPage({params, searchParams}: {params: Promise<{locale: 'en' | 'es'}>; searchParams: Promise<Query>}) {
  const [{locale}, query] = await Promise.all([params, searchParams]);
  const spanish = locale === 'es';
  const grade = first(query.grade); const domain = first(query.domain); const collection = first(query.collection); const lang = first(query.lang) || locale;
  const all = completeAnimations();
  const domains = [...new Set(all.map((item) => item.classification.domain))].sort();
  const visible = all.filter((item) => (!grade || String(item.classification.grade ?? '') === grade) && (!domain || item.classification.domain === domain) && (!collection || item.classification.collection === collection));
  return <main id="main-content">
    <header className="archive-page-header"><Container><p className="eyebrow">{spanish ? 'Archivo validado' : 'Validated archive'}</p><h1>{spanish ? 'Biblioteca de animaciones' : 'Animation library'}</h1><p>{spanish ? 'Solo aparecen migraciones que figuran en el registro de finalización estricta.' : 'Only migrations present in the strict completion ledger appear here.'}</p></Container></header>
    <section className="catalog-section"><Container>
      <form className="filter-panel" method="get">
        <label><span>{spanish ? 'Grado' : 'Grade'}</span><select defaultValue={grade} name="grade"><option value="">{spanish ? 'Todos' : 'All'}</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="elementary">elementary</option></select></label>
        <label><span>{spanish ? 'Área' : 'Domain'}</span><select defaultValue={domain} name="domain"><option value="">{spanish ? 'Todas' : 'All'}</option>{domains.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>{spanish ? 'Tipo' : 'Type'}</span><select defaultValue={collection} name="collection"><option value="">{spanish ? 'Todos' : 'All'}</option><option value="course">course</option><option value="keyterm">keyterm</option><option value="formula">formula</option></select></label>
        <label><span>{spanish ? 'Idioma' : 'Language'}</span><select defaultValue={lang} name="lang"><option value="en">English</option><option value="es">Español</option></select></label>
        <button type="submit">{spanish ? 'Filtrar' : 'Filter'}</button>
      </form>
      <p className="catalog-count"><strong>{visible.length}</strong> {spanish ? 'migraciones completas' : 'strict-complete migrations'}</p>
      {visible.length ? <div className="animation-grid">{visible.map((animation) => <article className="animation-card" key={animation.animationId}><span>{animation.classification.collection}</span><h2><Link href={`/animations/${animation.animationId}?lang=${lang}`}>{animation.classification.titleDisplay}</Link></h2><p>{animation.classification.domain}</p><small>{animation.classification.grade ?? '—'} · L{animation.classification.lesson ?? '—'} · {animation.classification.section?.code ?? '—'}</small></article>)}</div> : <div className="archive-empty"><h2>{spanish ? 'Todavía no hay migraciones estrictamente aprobadas.' : 'No migrations have passed strict acceptance yet.'}</h2><p>{spanish ? 'Los prototipos no se publican aquí.' : 'Legacy prototypes are not published in this directory.'}</p></div>}
    </Container></section>
  </main>;
}
