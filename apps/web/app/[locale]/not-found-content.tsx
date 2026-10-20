'use client';

import {Container} from '@/components/ui';
import {Link, useLocale} from '@/i18n/navigation';
import {NOT_FOUND_COPY} from '@/lib/not-found-copy';

export function NotFoundContent() {
  const text = NOT_FOUND_COPY[useLocale()];
  return (
    <main className="page-hero page-hero--yellow" id="main-content">
      <Container>
        <div className="page-hero__copy">
          <p className="eyebrow">404</p>
          <h1>{text.title}</h1>
          <p>{text.body}</p>
          <div className="page-hero__actions">
            <Link className="action action--primary" href="/">{text.home}</Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
