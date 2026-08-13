'use client';

import type {CSSProperties} from 'react';
import {useEffect, useMemo, useRef, useState} from 'react';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  GraduationCap,
  Languages,
  Minus,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Volume2,
} from 'lucide-react';

import type {
  DemoAgeModeContent,
  DemoAgeModeId,
  DemoLanguageModeId,
  DemoNovaPromptContent,
  DemosContent,
} from '@/content/types';

import {Callout, Container} from './ui';
import styles from './age-adaptive-demo.module.css';

const numberLineValues = [-20, -15, -10, -5, 0, 5, 10, 15, 20] as const;

function formatSignedNumber(value: number) {
  return value < 0 ? `−${Math.abs(value)}` : String(value);
}

function fillTemplate(template: string, value: number) {
  return template.replace('{value}', formatSignedNumber(value));
}

function formatProgress(template: string, current: number, total: number) {
  return template
    .replace('{current}', String(current))
    .replace('{total}', String(total));
}

function selectLocalizedText(
  value: {english: string; spanish: string},
  language: DemoLanguageModeId,
) {
  if (language === 'spanish') return [{text: value.spanish, lang: 'es' as const}];
  if (language === 'dual') return [
    {text: value.english, lang: 'en' as const},
    {text: value.spanish, lang: 'es' as const},
  ];
  return [{text: value.english, lang: 'en' as const}];
}

function primaryLocalizedText(
  value: {english: string; spanish: string},
  language: DemoLanguageModeId,
) {
  return language === 'spanish' ? value.spanish : value.english;
}

function LocalizedText({
  language,
  value,
}: {
  language: DemoLanguageModeId;
  value: {english: string; spanish: string};
}) {
  return selectLocalizedText(value, language).map((item, index) => (
    <span
      className={index > 0 ? styles.localizedSecondary : undefined}
      key={item.lang}
      lang={item.lang}
    >
      {item.text}
    </span>
  ));
}

function getTemperaturePhrases(
  content: DemosContent['experience'],
  temperature: number,
) {
  const templates = temperature < 0
    ? [content.phrases.negativeEnglish, content.phrases.negativeSpanish]
    : temperature > 0
      ? [content.phrases.positiveEnglish, content.phrases.positiveSpanish]
      : [content.phrases.zeroEnglish, content.phrases.zeroSpanish];

  return {
    english: fillTemplate(templates[0], temperature),
    spanish: fillTemplate(templates[1], temperature),
  };
}

function getNovaResponses(
  prompt: DemoNovaPromptContent | undefined,
  language: DemoLanguageModeId,
  mode: DemoAgeModeContent,
  temperature: number,
) {
  if (!prompt) return selectLocalizedText(mode.novaGreeting, language);

  const fillResponse = (template: string, responseLanguage: 'en' | 'es') => template
    .replaceAll('{value}', formatSignedNumber(temperature))
    .replaceAll('{steps}', String(Math.abs(temperature)))
    .replaceAll(
      '{unit}',
      responseLanguage === 'es'
        ? Math.abs(temperature) === 1 ? 'espacio' : 'espacios'
        : Math.abs(temperature) === 1 ? 'space' : 'spaces',
    )
    .replaceAll(
      '{direction}',
      responseLanguage === 'es'
        ? temperature < 0 ? 'a la izquierda' : temperature > 0 ? 'a la derecha' : 'en cero'
        : temperature < 0 ? 'left' : temperature > 0 ? 'right' : 'at zero',
    )
    .replaceAll(
      '{position}',
      responseLanguage === 'es'
        ? temperature < 0 ? 'a la izquierda de' : temperature > 0 ? 'a la derecha de' : 'en'
        : temperature < 0 ? 'left of' : temperature > 0 ? 'right of' : 'at',
    )
    .replaceAll(
      '{sign}',
      responseLanguage === 'es'
        ? temperature < 0 ? 'negativo' : temperature > 0 ? 'positivo' : 'cero'
        : temperature < 0 ? 'negative' : temperature > 0 ? 'positive' : 'zero',
    );

  if (prompt.id === 'number-line' && temperature === 0) {
    const zeroResponse = {
      english: 'You are already at zero. No move is needed.',
      spanish: 'Ya estás en cero. No necesitas moverte.',
    };
    return selectLocalizedText(zeroResponse, language);
  }

  if (prompt.id === 'spanish' || language === 'spanish') {
    return [{text: fillResponse(prompt.responseSpanish, 'es'), lang: 'es' as const}];
  }
  if (language === 'dual') {
    return [
      {text: fillResponse(prompt.responseEnglish, 'en'), lang: 'en' as const},
      {text: fillResponse(prompt.responseSpanish, 'es'), lang: 'es' as const},
    ];
  }
  return [{text: fillResponse(prompt.responseEnglish, 'en'), lang: 'en' as const}];
}

export function AgeAdaptiveDemo({content}: {content: DemosContent}) {
  const experience = content.experience;
  const [ageModeId, setAgeModeId] = useState<DemoAgeModeId>('elementary');
  const [language, setLanguage] = useState<DemoLanguageModeId>('dual');
  const [temperature, setTemperature] = useState(-8);
  const [activeStop, setActiveStop] = useState(3);
  const [showScaffold, setShowScaffold] = useState(true);
  const [showVisualModel, setShowVisualModel] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [selectedNovaPrompt, setSelectedNovaPrompt] = useState<DemoNovaPromptContent['id']>();
  const [speechState, setSpeechState] = useState<
    'idle' | 'speaking' | 'stopped' | 'unsupported'
  >('idle');
  const speechSequenceRef = useRef(0);
  const activeSpeechRef = useRef(false);

  const activeMode = experience.modes.find((mode) => mode.id === ageModeId)
    ?? experience.modes[0];
  const phrases = useMemo(
    () => getTemperaturePhrases(experience, temperature),
    [experience, temperature],
  );
  const prompt = experience.novaPrompts.find((item) => item.id === selectedNovaPrompt);
  const novaResponses = getNovaResponses(prompt, language, activeMode, temperature);
  const activeStopContent = experience.stops[activeStop];
  const activeStopLabel = ageModeId === 'elementary'
    ? activeStopContent.label
    : ageModeId === 'middle'
      ? activeStopContent.middleLabel
      : activeStopContent.highLabel;
  const progressLabel = {
    english: formatProgress(activeMode.progressLabel.english, activeStop + 1, experience.stops.length),
    spanish: formatProgress(activeMode.progressLabel.spanish, activeStop + 1, experience.stops.length),
  };
  const scaffoldDirection = temperature < 0
    ? experience.scaffoldDirections.negative
    : temperature > 0
      ? experience.scaffoldDirections.positive
      : experience.scaffoldDirections.zero;
  const position = ((temperature + 20) / 40) * 100;
  const temperatureStyle = {
    '--temperature-position': `${position}%`,
  } as CSSProperties;

  useEffect(() => () => {
    speechSequenceRef.current += 1;
    activeSpeechRef.current = false;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  function stopSpeech(announce = false) {
    speechSequenceRef.current += 1;
    const wasActive = activeSpeechRef.current;
    if (wasActive && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    activeSpeechRef.current = false;
    setSpeechState(wasActive && announce ? 'stopped' : 'idle');
  }

  function changeAgeMode(modeId: DemoAgeModeId) {
    stopSpeech(true);
    setAgeModeId(modeId);
    setSelectedNovaPrompt(undefined);
  }

  function changeLanguage(nextLanguage: DemoLanguageModeId) {
    if (nextLanguage !== language) stopSpeech(true);
    setLanguage(nextLanguage);
  }

  function changeTemperature(nextTemperature: number) {
    if (nextTemperature !== temperature) stopSpeech(true);
    setTemperature(nextTemperature);
  }

  function visiblePhrases() {
    return selectLocalizedText(phrases, language);
  }

  function toggleSpeech() {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setSpeechState('unsupported');
      return;
    }

    if (speechState === 'speaking') {
      stopSpeech(true);
      return;
    }

    window.speechSynthesis.cancel();
    const speechItems = visiblePhrases();
    const speechSequence = speechSequenceRef.current + 1;
    speechSequenceRef.current = speechSequence;
    activeSpeechRef.current = true;
    let remaining = speechItems.length;
    setSpeechState('speaking');

    speechItems.forEach((item) => {
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.lang = item.lang === 'es' ? 'es-US' : 'en-US';
      utterance.rate = 0.88;
      utterance.onend = () => {
        if (speechSequenceRef.current !== speechSequence) return;
        remaining -= 1;
        if (remaining === 0) {
          activeSpeechRef.current = false;
          setSpeechState('idle');
        }
      };
      utterance.onerror = () => {
        if (speechSequenceRef.current !== speechSequence) return;
        activeSpeechRef.current = false;
        setSpeechState('idle');
      };
      window.speechSynthesis.speak(utterance);
    });
  }

  const activeSupportLabels = [
    experience.languageOptions.find((option) => option.id === language)?.label,
    showScaffold ? experience.stepByStepLabel : undefined,
    showVisualModel ? experience.visualModelLabel : undefined,
    reducedMotion ? experience.reducedMotionLabel : undefined,
  ].filter(Boolean) as string[];

  return (
    <div className={styles.page} data-reduced-motion={reducedMotion ? 'true' : 'false'}>
      <section className={styles.hero}>
        <Container className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{content.hero.eyebrow}</p>
            <h1>{content.hero.title}</h1>
            <p className={styles.heroSummary}>{content.hero.summary}</p>
            <div className={styles.heroActions}>
              {content.hero.primaryAction ? (
                <a className={styles.primaryAction} href={content.hero.primaryAction.href}>
                  <Play aria-hidden="true" size={18} fill="currentColor" />
                  {content.hero.primaryAction.label}
                </a>
              ) : null}
              {content.hero.secondaryAction ? (
                <a className={styles.secondaryAction} href={content.hero.secondaryAction.href}>
                  {content.hero.secondaryAction.label}
                  <ChevronRight aria-hidden="true" size={18} />
                </a>
              ) : null}
            </div>
            <div className={styles.audienceBlock}>
              <p>{content.audienceLabel}</p>
              <ul>
                {content.audience.map((audience) => (
                  <li key={audience}>
                    <Check aria-hidden="true" size={16} strokeWidth={3} />
                    <span>{audience}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className={styles.ageNote}>
              <ShieldCheck aria-hidden="true" size={19} />
              <span>{content.ageIndependenceNote}</span>
            </p>
          </div>

          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.heroOrbit} />
            <div className={`${styles.heroModeCard} ${styles.heroModeElementary}`}>
              <span>👋</span>
              <div>
                <small>{experience.modes[0].grades}</small>
                <strong>{experience.modes[0].label}</strong>
              </div>
              <b>−8°</b>
            </div>
            <div className={`${styles.heroModeCard} ${styles.heroModeMiddle}`}>
              <BookOpen size={22} />
              <div>
                <small>{experience.modes[1].grades}</small>
                <strong>{experience.modes[1].label}</strong>
              </div>
              <b>−8°</b>
            </div>
            <div className={`${styles.heroModeCard} ${styles.heroModeHigh}`}>
              <GraduationCap size={22} />
              <div>
                <small>{experience.modes[2].grades}</small>
                <strong>{experience.modes[2].label}</strong>
              </div>
              <b>−8°</b>
            </div>
            <div className={styles.heroCenter}>
              <span>{experience.fixedLevelLabel}</span>
              <strong>{experience.fixedLevelValue}</strong>
              <small>{primaryLocalizedText(experience.lessonTitle, language)}</small>
            </div>
          </div>
        </Container>
      </section>

      <section className={styles.experienceSection} id="experience">
        <Container>
          <header className={styles.sectionHeading}>
            <p className={styles.eyebrow}>{experience.eyebrow}</p>
            <h2>{experience.title}</h2>
            <p>{experience.intro}</p>
          </header>

          <div className={styles.experienceControls}>
            <div className={styles.fixedLevelCard}>
              <span>{experience.fixedLevelLabel}</span>
              <strong>{experience.fixedLevelValue}</strong>
              <small>
                {primaryLocalizedText(experience.lessonKicker, language)} ·{' '}
                {primaryLocalizedText(experience.lessonTitle, language)}
              </small>
            </div>

            <fieldset className={styles.ageSelector}>
              <legend>{experience.ageSelectorLabel}</legend>
              <p>{experience.ageSelectorHint}</p>
              <div className={styles.ageSelectorGrid}>
                {experience.modes.map((mode) => (
                  <button
                    aria-pressed={mode.id === ageModeId}
                    className={mode.id === ageModeId ? styles.ageButtonActive : styles.ageButton}
                    key={mode.id}
                    onClick={() => changeAgeMode(mode.id)}
                    type="button"
                  >
                    <span>{mode.label}</span>
                    <small>{mode.grades}</small>
                    <b>{mode.badge}</b>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <section className={styles.supportPanel} aria-labelledby="support-panel-title">
            <div className={styles.supportIntro}>
              <Languages aria-hidden="true" size={25} />
              <div>
                <h3 id="support-panel-title">{experience.supportTitle}</h3>
                <p>{experience.supportSummary}</p>
              </div>
            </div>
            <div className={styles.supportControls}>
              <fieldset className={styles.segmentedControl}>
                <legend>{experience.languageLabel}</legend>
                <div>
                  {experience.languageOptions.map((option) => (
                    <button
                      aria-pressed={option.id === language}
                      className={option.id === language ? styles.supportButtonActive : styles.supportButton}
                      key={option.id}
                      onClick={() => changeLanguage(option.id)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className={styles.supportTools}>
                <legend>{experience.toolsLabel}</legend>
                <div>
                  <button
                    aria-pressed={speechState === 'speaking'}
                    className={speechState === 'speaking' ? styles.supportButtonActive : styles.supportButton}
                    onClick={toggleSpeech}
                    type="button"
                  >
                    {speechState === 'speaking' ? <Pause aria-hidden="true" size={18} /> : <Volume2 aria-hidden="true" size={18} />}
                    {speechState === 'speaking' ? experience.stopReadAloudLabel : experience.readAloudLabel}
                  </button>
                  <button
                    aria-pressed={showScaffold}
                    className={showScaffold ? styles.supportButtonActive : styles.supportButton}
                    onClick={() => setShowScaffold((value) => !value)}
                    type="button"
                  >
                    <BookOpen aria-hidden="true" size={18} />
                    {experience.stepByStepLabel}
                  </button>
                  <button
                    aria-pressed={showVisualModel}
                    className={showVisualModel ? styles.supportButtonActive : styles.supportButton}
                    onClick={() => setShowVisualModel((value) => !value)}
                    type="button"
                  >
                    <Eye aria-hidden="true" size={18} />
                    {experience.visualModelLabel}
                  </button>
                  <button
                    aria-pressed={reducedMotion}
                    className={reducedMotion ? styles.supportButtonActive : styles.supportButton}
                    onClick={() => setReducedMotion((value) => !value)}
                    type="button"
                  >
                    <Sparkles aria-hidden="true" size={18} />
                    {experience.reducedMotionLabel}
                  </button>
                </div>
              </fieldset>
            </div>
            <div className={styles.activeSupports}>
              <strong>{experience.activeSupportsLabel}</strong>
              <ul>
                {activeSupportLabels.length > 0 ? activeSupportLabels.map((label) => (
                  <li key={label}>{label}</li>
                )) : <li>{experience.noActiveSupportsLabel}</li>}
              </ul>
            </div>
            <p aria-live="polite" className={styles.speechStatus}>
              {speechState === 'unsupported'
                ? experience.speechUnavailable
                : speechState === 'speaking'
                  ? <LocalizedText language={language} value={experience.speechStatus} />
                  : speechState === 'stopped'
                    ? <LocalizedText language={language} value={experience.speechStoppedStatus} />
                  : ''}
            </p>
          </section>

          <div
            className={styles.workspace}
            data-age={ageModeId}
            data-reduced-motion={reducedMotion ? 'true' : 'false'}
          >
            <header className={styles.workspaceHeader}>
              <div>
                <span><LocalizedText language={language} value={activeMode.workspaceLabel} /></span>
                <h3><LocalizedText language={language} value={activeMode.headline} /></h3>
                <p><LocalizedText language={language} value={activeMode.summary} /></p>
              </div>
              <div className={styles.progressCard}>
                <span><LocalizedText language={language} value={progressLabel} /></span>
                <strong><LocalizedText language={language} value={activeMode.progressDetail} /></strong>
                <div aria-hidden="true" className={styles.progressTrack}>
                  <span style={{width: `${((activeStop + 1) / experience.stops.length) * 100}%`}} />
                </div>
              </div>
            </header>

            <nav
              aria-label={primaryLocalizedText(activeMode.navigatorLabel, language)}
              className={styles.lessonNav}
            >
              <p><LocalizedText language={language} value={activeMode.navigatorLabel} /></p>
              <ol>
                {experience.stops.map((stop, index) => {
                  const stopLabel = ageModeId === 'elementary'
                    ? stop.label
                    : ageModeId === 'middle'
                      ? stop.middleLabel
                      : stop.highLabel;
                  return (
                  <li key={stop.label.english}>
                    <button
                      aria-current={index === activeStop ? 'step' : undefined}
                      className={index === activeStop ? styles.lessonStopActive : styles.lessonStop}
                      onClick={() => setActiveStop(index)}
                      type="button"
                    >
                      <span aria-hidden="true">
                        {ageModeId === 'elementary' ? stop.emoji : String(index + 1).padStart(2, '0')}
                      </span>
                      <b><LocalizedText language={language} value={stopLabel} /></b>
                      {ageModeId === 'elementary' ? <small>{index + 1}</small> : null}
                    </button>
                  </li>
                  );
                })}
              </ol>
            </nav>

            <div className={styles.workspaceBody}>
              <section className={styles.lessonStage} aria-labelledby="lesson-stage-title">
                <header className={styles.lessonHeader}>
                  <div>
                    <p><LocalizedText language={language} value={experience.lessonKicker} /></p>
                    <h4 id="lesson-stage-title">
                      <LocalizedText language={language} value={activeStopContent.activityTitle} />
                    </h4>
                    <span><LocalizedText language={language} value={experience.lessonSubtitle} /></span>
                  </div>
                  <div className={styles.temperatureBadge}>
                    <span><LocalizedText language={language} value={experience.temperatureLabel} /></span>
                    <strong>{formatSignedNumber(temperature)}°</strong>
                  </div>
                </header>

                <p className={styles.lessonPrompt}>
                  <LocalizedText language={language} value={activeStopContent.activityPrompt} />
                </p>

                {showVisualModel ? (
                  <div className={styles.visualModel} style={temperatureStyle}>
                    <div className={styles.thermometerWrap}>
                      <span className={styles.srOnly}>
                        {primaryLocalizedText(experience.thermometerLabel, language)}:{' '}
                        {formatSignedNumber(temperature)}°
                      </span>
                      <div aria-hidden="true" className={styles.thermometer}>
                        <div className={styles.thermometerTicks}>
                          <span>20</span><span>10</span><span>0</span><span>−10</span><span>−20</span>
                        </div>
                        <div className={styles.thermometerTube}>
                          <span className={styles.thermometerFill} />
                        </div>
                        <div className={styles.thermometerBulb} />
                      </div>
                    </div>

                    <div className={styles.numberLineWrap}>
                      <span className={styles.srOnly}>
                        {primaryLocalizedText(experience.numberLineLabel, language)}.{' '}
                        {formatSignedNumber(temperature)}.
                      </span>
                      <div aria-hidden="true" className={styles.numberLine}>
                        <span className={styles.numberLineArrowLeft}>‹</span>
                        <span className={styles.numberLineRail} />
                        {numberLineValues.map((value) => (
                          <span
                            className={styles.numberLineTick}
                            data-minor={Math.abs(value) % 10 === 5 ? 'true' : 'false'}
                            key={value}
                            style={{left: `${((value + 20) / 40) * 100}%`}}
                          >
                            <i />
                            <b>{formatSignedNumber(value)}</b>
                          </span>
                        ))}
                        <span className={styles.numberLineMarker}>
                          <b>{formatSignedNumber(temperature)}</b>
                        </span>
                        <span className={styles.numberLineArrowRight}>›</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.visualHidden}>
                    <Eye aria-hidden="true" size={24} />
                    <p><LocalizedText language={language} value={experience.visualModelHidden} /></p>
                  </div>
                )}

                <div className={styles.temperatureControl}>
                  <button
                    aria-label={primaryLocalizedText(experience.decreaseLabel, language)}
                    disabled={temperature <= -20}
                    onClick={() => changeTemperature(Math.max(-20, temperature - 1))}
                    type="button"
                  >
                    <Minus aria-hidden="true" size={22} />
                  </button>
                  <label>
                    <span><LocalizedText language={language} value={experience.sliderLabel} /></span>
                    <input
                      aria-describedby="temperature-range-hint"
                      id="temperature-input"
                      max="20"
                      min="-20"
                      onChange={(event) => changeTemperature(Number(event.target.value))}
                      type="range"
                      value={temperature}
                    />
                  </label>
                  <button
                    aria-label={primaryLocalizedText(experience.increaseLabel, language)}
                    disabled={temperature >= 20}
                    onClick={() => changeTemperature(Math.min(20, temperature + 1))}
                    type="button"
                  >
                    <Plus aria-hidden="true" size={22} />
                  </button>
                </div>
                <p className={styles.rangeHint} id="temperature-range-hint">
                  <LocalizedText language={language} value={experience.rangeHint} />
                </p>

                <output aria-live="polite" className={styles.explanation} htmlFor="temperature-input">
                  {visiblePhrases().map((phrase) => (
                    <span key={phrase.lang} lang={phrase.lang}>{phrase.text}</span>
                  ))}
                </output>

                {showScaffold ? (
                  <aside className={styles.scaffold}>
                    <strong><LocalizedText language={language} value={experience.scaffoldTitle} /></strong>
                    <ol>
                      {[...experience.scaffoldSteps, scaffoldDirection].map((step) => (
                        <li key={step.english}>
                          <LocalizedText language={language} value={step} />
                        </li>
                      ))}
                    </ol>
                  </aside>
                ) : null}

                <footer className={styles.stageFooter}>
                  <button
                    disabled={activeStop === 0}
                    onClick={() => setActiveStop((value) => Math.max(0, value - 1))}
                    type="button"
                  >
                    <ChevronLeft aria-hidden="true" size={19} />
                    <LocalizedText language={language} value={experience.previousLabel} />
                  </button>
                  <span>
                    <LocalizedText language={language} value={experience.currentStopLabel} />:{' '}
                    <b><LocalizedText language={language} value={activeStopLabel} /></b>
                  </span>
                  <button
                    disabled={activeStop === experience.stops.length - 1}
                    onClick={() => setActiveStop((value) => Math.min(experience.stops.length - 1, value + 1))}
                    type="button"
                  >
                    <LocalizedText language={language} value={experience.nextLabel} />
                    <ChevronRight aria-hidden="true" size={19} />
                  </button>
                </footer>
              </section>

              <aside className={styles.novaPanel} aria-labelledby="nova-panel-title">
                <div className={styles.novaHeading}>
                  <div className={styles.novaMark} aria-hidden="true">
                    <Sparkles size={23} />
                  </div>
                  <div>
                    <p><LocalizedText language={language} value={experience.novaEyebrow} /></p>
                    <h4 id="nova-panel-title">
                      <LocalizedText language={language} value={experience.novaTitle} />
                    </h4>
                  </div>
                </div>
                <p className={styles.novaSummary}>
                  <LocalizedText language={language} value={experience.novaSummary} />
                </p>
                <div className={styles.novaMessage} aria-live="polite">
                  <span aria-hidden="true">N</span>
                  <p>
                    {novaResponses.map((response) => (
                      <span
                        className={response.lang === novaResponses[0]?.lang ? undefined : styles.localizedSecondary}
                        key={response.lang}
                        lang={response.lang}
                      >
                        {response.text}
                      </span>
                    ))}
                  </p>
                </div>
                <fieldset className={styles.novaPrompts}>
                  <legend><LocalizedText language={language} value={experience.novaPromptLabel} /></legend>
                  {experience.novaPrompts.map((novaPrompt) => (
                    <button
                      aria-pressed={novaPrompt.id === selectedNovaPrompt}
                      key={novaPrompt.id}
                      onClick={() => setSelectedNovaPrompt(novaPrompt.id)}
                      type="button"
                    >
                      <LocalizedText language={language} value={novaPrompt.label} />
                    </button>
                  ))}
                </fieldset>
                <p className={styles.privacyNote}>
                  <ShieldCheck aria-hidden="true" size={17} />
                  <span><LocalizedText language={language} value={experience.novaPrivacyNote} /></span>
                </p>
              </aside>
            </div>
          </div>
        </Container>
      </section>

      <section className={styles.principlesSection}>
        <Container>
          <header className={styles.sectionHeading}>
            <p className={styles.eyebrow}>{content.principles.eyebrow}</p>
            <h2>{content.principles.title}</h2>
            <p>{content.principles.intro}</p>
          </header>
          <div className={styles.principleGrid}>
            {content.principles.items.map((item, index) => (
              <article key={item.title}>
                <span aria-hidden="true">0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.evidenceSection} id={content.evidence.id}>
        <Container>
          <div className={styles.evidenceHeading}>
            <div>
              <p className={styles.eyebrow}>{content.evidence.eyebrow}</p>
              <h2>{content.evidence.title}</h2>
              <p>{content.evidence.intro}</p>
            </div>
            <span>{content.evidence.snapshotLabel}</span>
          </div>
          <dl className={styles.evidenceFacts}>
            {content.evidence.facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
          <div className={styles.evidenceColumns}>
            <section>
              <h3>{content.evidence.demonstratesTitle}</h3>
              <ul>
                {content.evidence.demonstrates.map((item) => (
                  <li key={item}><Check aria-hidden="true" size={18} /><span>{item}</span></li>
                ))}
              </ul>
            </section>
            <section>
              <h3>{content.evidence.remainsTitle}</h3>
              <ul>
                {content.evidence.remains.map((item) => (
                  <li key={item}><Minus aria-hidden="true" size={18} /><span>{item}</span></li>
                ))}
              </ul>
            </section>
          </div>
          <p className={styles.evidenceNote}>{content.evidence.note}</p>
        </Container>
      </section>

      <section className={styles.accessibilitySection}>
        <Container>
          <Callout {...content.accessibility} tone="paper" />
        </Container>
      </section>
    </div>
  );
}
