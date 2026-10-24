import type {AnonymousLearningActor} from './anonymous-learning-actor.server';
import {G4_L3_LESSON, findG4L3Page} from './g4-l3-lesson-navigation';
import type {HelpMathLearningEvent} from './learning-event-schema';

const XAPI_ROOT = 'https://www.helpmath.ai/xapi';
const LESSON_ACTIVITY_ID = `${XAPI_ROOT}/activities/${G4_L3_LESSON.releaseId}`;
const PROFILE_ACTIVITY_ID = `${XAPI_ROOT}/profiles/help-math-learning-events/v1`;
const EXTENSION_ROOT = `${XAPI_ROOT}/extensions`;

const VERBS = {
  'lesson.initialized': ['http://adlnet.gov/expapi/verbs/initialized', 'initialized'],
  'lesson.resumed': ['http://adlnet.gov/expapi/verbs/resumed', 'resumed'],
  'lesson.exited': ['http://adlnet.gov/expapi/verbs/terminated', 'terminated'],
  'lesson.completed': ['http://adlnet.gov/expapi/verbs/completed', 'completed'],
  'page.viewed': ['http://adlnet.gov/expapi/verbs/experienced', 'experienced'],
  'page.completed': ['http://adlnet.gov/expapi/verbs/progressed', 'progressed'],
  'support.used': ['http://adlnet.gov/expapi/verbs/interacted', 'interacted'],
  'practice.evaluated': ['http://adlnet.gov/expapi/verbs/answered', 'answered'],
} as const satisfies Record<HelpMathLearningEvent['type'], readonly [string, string]>;

export interface XapiStatement {
  readonly id: string;
  readonly actor: AnonymousLearningActor;
  readonly verb: {
    readonly id: string;
    readonly display: Readonly<Record<string, string>>;
  };
  readonly object: {
    readonly objectType: 'Activity';
    readonly id: string;
    readonly definition: {
      readonly type: string;
      readonly name: Readonly<Record<string, string>>;
      readonly description?: Readonly<Record<string, string>>;
    };
  };
  readonly result?: {
    readonly completion?: boolean;
    readonly success?: boolean;
    readonly extensions?: Readonly<Record<string, string | number | boolean>>;
  };
  readonly context: {
    readonly registration: string;
    readonly platform: 'HELP Math 2.0';
    readonly language: 'en-US' | 'es';
    readonly contextActivities: {
      readonly parent?: readonly XapiActivityReference[];
      readonly grouping: readonly XapiActivityReference[];
      readonly category: readonly XapiActivityReference[];
    };
    readonly extensions: Readonly<Record<string, string | number | boolean>>;
  };
  readonly timestamp: string;
}

interface XapiActivityReference {
  readonly objectType: 'Activity';
  readonly id: string;
  readonly definition?: {
    readonly type: string;
  };
}

function lessonActivity() {
  return {
    objectType: 'Activity' as const,
    id: LESSON_ACTIVITY_ID,
    definition: {
      type: 'http://adlnet.gov/expapi/activities/lesson',
      name: {'en-US': G4_L3_LESSON.titleEnglish},
      description: {'en-US': 'Grade 4, Lesson 3'},
    },
  };
}

function targetsPageActivity(event: HelpMathLearningEvent) {
  return event.type === 'page.viewed'
    || event.type === 'page.completed'
    || event.type === 'support.used'
    || event.type === 'practice.evaluated';
}

function eventActivity(event: HelpMathLearningEvent) {
  // Lesson lifecycle verbs must target the lesson Activity even when the
  // event carries the learner's last page as bounded context. Page/support/
  // practice verbs target the exact allowlisted page instead.
  if (!targetsPageActivity(event) || !event.page) return lessonActivity();
  const page = findG4L3Page(event.page.animationId);
  if (!page) throw new Error('Learning event page is not allowlisted.');

  const name: Record<string, string> = {'en-US': page.titleEnglish};
  if (page.titleSpanish !== null) name.es = page.titleSpanish;
  return {
    objectType: 'Activity' as const,
    id: `${LESSON_ACTIVITY_ID}/pages/${encodeURIComponent(page.animationId)}`,
    definition: {
      type: 'http://adlnet.gov/expapi/activities/lesson',
      name,
    },
  };
}

function statementResult(event: HelpMathLearningEvent): XapiStatement['result'] {
  const completion = event.type === 'lesson.completed' || event.type === 'page.completed'
    ? true
    : undefined;
  const success = event.evaluation?.outcome === 'correct'
    ? true
    : event.evaluation?.outcome === 'incorrect'
      ? false
      : undefined;
  const extensions: Record<string, string | number | boolean> = {};
  if (event.evaluation) {
    extensions[`${EXTENSION_ROOT}/evaluation-outcome`] = event.evaluation.outcome;
    extensions[`${EXTENSION_ROOT}/attempt`] = event.evaluation.attempt;
  }

  if (completion === undefined && success === undefined && Object.keys(extensions).length === 0) {
    return undefined;
  }
  return {
    ...(completion === undefined ? {} : {completion}),
    ...(success === undefined ? {} : {success}),
    ...(Object.keys(extensions).length === 0 ? {} : {extensions}),
  };
}

export function buildXapiStatement(
  event: HelpMathLearningEvent,
  actor: AnonymousLearningActor,
): XapiStatement {
  const page = event.page ? findG4L3Page(event.page.animationId) : undefined;
  if (event.page && !page) throw new Error('Learning event page is not allowlisted.');
  const [verbId, verbDisplay] = VERBS[event.type];
  const extensions: Record<string, string | number | boolean> = {
    [`${EXTENSION_ROOT}/schema-version`]: event.schemaVersion,
    [`${EXTENSION_ROOT}/event-type`]: event.type,
    [`${EXTENSION_ROOT}/sequence`]: event.sequence,
    [`${EXTENSION_ROOT}/presentation`]: event.presentation,
    [`${EXTENSION_ROOT}/mode`]: event.mode,
  };
  if (page) {
    extensions[`${EXTENSION_ROOT}/section-code`] = page.sectionCode;
    extensions[`${EXTENSION_ROOT}/page-ordinal`] = page.globalPageOrdinal;
  }
  if (event.progress) {
    extensions[`${EXTENSION_ROOT}/completed-pages`] = event.progress.completedPages;
    extensions[`${EXTENSION_ROOT}/progress-percent`] = event.progress.percent;
  }
  if (event.support) {
    extensions[`${EXTENSION_ROOT}/support-kind`] = event.support.kind;
    extensions[`${EXTENSION_ROOT}/support-action`] = event.support.action;
  }

  const contextActivities = {
    ...(page && targetsPageActivity(event) ? {
      parent: [{objectType: 'Activity' as const, id: LESSON_ACTIVITY_ID}],
    } : {}),
    grouping: [{objectType: 'Activity' as const, id: LESSON_ACTIVITY_ID}],
    category: [{
      objectType: 'Activity' as const,
      id: PROFILE_ACTIVITY_ID,
      definition: {type: 'http://adlnet.gov/expapi/activities/profile'},
    }],
  };

  const result = statementResult(event);
  return Object.freeze({
    id: event.eventId,
    actor,
    verb: Object.freeze({id: verbId, display: Object.freeze({'en-US': verbDisplay})}),
    object: Object.freeze(eventActivity(event)),
    ...(result ? {result: Object.freeze(result)} : {}),
    context: Object.freeze({
      registration: event.sessionId,
      platform: 'HELP Math 2.0' as const,
      language: event.locale === 'es' ? 'es' as const : 'en-US' as const,
      contextActivities: Object.freeze(contextActivities),
      extensions: Object.freeze(extensions),
    }),
    timestamp: new Date(event.occurredAt).toISOString(),
  });
}
