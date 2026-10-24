import './lesson-animation-title-v1.css';

export interface LessonAnimationTitleV1Props {
  readonly courseTitle:string;
  readonly activityTitle:string;
  readonly language:'en'|'es';
}

/** Native student title. Exact source identity belongs in the page's text
 * binding; the original outlined artwork remains separate source evidence. */
export function LessonAnimationTitleV1({courseTitle,activityTitle,language}:LessonAnimationTitleV1Props){
  return <h2 className="lesson-animation-title-v1" lang={language} data-lesson-animation-title="native-v1">
    <span data-lesson-text-block="course-title">{courseTitle}</span>{' '}
    <span data-lesson-text-block="activity-title">{activityTitle}</span>
  </h2>;
}
