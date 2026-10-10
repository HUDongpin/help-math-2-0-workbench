// HFR runtime · lesson-session globals. The 1.0 course shell stayed loaded for
// a whole lesson, so `_global` values set on one page were still there on the
// next. This keeps that behaviour in memory only: one lesson at a time, never
// stored, never sent, and gone when the learner reloads or opens another lesson.
import type { SessionGlobals } from "./player";

let current: { lessonKey: string; globals: SessionGlobals } | null = null;

export function readLessonGlobals(lessonKey: string): SessionGlobals | undefined {
  return current?.lessonKey === lessonKey ? current.globals : undefined;
}

export function writeLessonGlobals(lessonKey: string, globals: SessionGlobals): void {
  current = { lessonKey, globals };
}

export function clearLessonGlobals(): void {
  current = null;
}
