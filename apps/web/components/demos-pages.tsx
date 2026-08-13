import {ArrowLeft, CheckCircle2, ShieldCheck} from 'lucide-react';

import type {DemoDetailContent, DemoId, DemosContent, Locale} from '@/content/types';
import {Link} from '@/i18n/navigation';

import {AgeAdaptiveDemo} from './age-adaptive-demo';
import {DemoPlayer} from './demo-player';
import {Callout, Container, Eyebrow, Section, SectionHeading} from './ui';

export function DemosPage({content}: {content: DemosContent}) {
  return <AgeAdaptiveDemo content={content} />;
}

export function DemoDetailPage({
  content,
  id,
  locale,
  requestedFrame
}: {
  content: DemoDetailContent;
  id: DemoId;
  locale: Locale;
  requestedFrame?: number;
}) {
  return (
    <>
      <header className="demo-detail-header">
        <Container>
          <Link className="back-link" href={content.backAction.href}>
            <ArrowLeft aria-hidden="true" size={18} />
            {content.backAction.label}
          </Link>
          <div className="demo-detail-header__grid">
            <div>
              <Eyebrow>{content.eyebrow}</Eyebrow>
              <h1>{content.title}</h1>
              <p>{content.summary}</p>
            </div>
            <aside>
              <strong>{content.statusLabel}</strong>
              <p>{content.statusDetail}</p>
            </aside>
          </div>
        </Container>
      </header>

      <Section className="demo-stage-section">
        <Container>
          <div className="demo-stage-shell">
            <div className="demo-stage-shell__bar">
              <span>{content.playerLabel}</span>
              <span>{id.replace('conversion-', 'Conversion ')}</span>
            </div>
            <DemoPlayer
              content={content}
              demoId={id}
              locale={locale}
              requestedFrame={requestedFrame}
            />
          </div>
          <p className="demo-reduced-note">{content.reducedMotionNote}</p>
        </Container>
      </Section>

      <Section>
        <Container className="demo-info-grid">
          <section>
            <SectionHeading title={content.instructionsTitle} />
            <ol className="demo-instructions">
              {content.instructions.map((instruction, index) => (
                <li key={instruction}>
                  <span>{index + 1}</span>
                  {instruction}
                </li>
              ))}
            </ol>
          </section>
          <section className="demo-accessibility">
            <ShieldCheck aria-hidden="true" size={34} />
            <h2>{content.accessibilityTitle}</h2>
            <ul>
              {content.accessibilityNotes.map((note) => (
                <li key={note}>
                  <CheckCircle2 aria-hidden="true" size={18} />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </section>
        </Container>
      </Section>

      <Section className="section--compact surface-yellow">
        <Container>
          <Callout
            action={content.supportAction}
            body={content.disclaimer}
            title={content.disclaimerTitle}
            tone="paper"
          />
        </Container>
      </Section>
    </>
  );
}
