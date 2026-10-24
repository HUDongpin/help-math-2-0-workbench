/** Source text carried by sprite 342. The IDs, frame spans, and literals are
 * checked against the pinned P043 native model by the source identity test. */
export const P043_QUESTION_MODEL_SHA256 =
  '158cc7f897d0d23fd55ca87536fba851080e0c26996d69a43eb9e910ce5dae9c' as const;

export const P043_QUESTION_TEXT = {
  instruction: {
    objectId: 152, firstFrame: 2, lastFrame: 241,
    text: 'Read the story and then answer the question.',
  },
  question: {
    objectId: 151, firstFrame: 2, lastFrame: 241,
    text: 'How much money can Peyton expect to earn on a day when she has 23 customers?',
  },
  stories: [
    {
      objectId: 153, firstFrame: 2, lastFrame: 147,
      text: 'Peyton runs a business. She can use the function                  M = $25.24C – $420 to estimate how much money (M) she will earn in a day based on the number of customers (C) who enter her store.',
    },
    {
      objectId: 337, firstFrame: 148, lastFrame: 160,
      text: 'Peyton runs a business. She can use the function                  M = $25.24 (23) – $420 to estimate how much money (M) she will earn in a day based on the number of customers (C) who enter her store.',
    },
    {
      objectId: 340, firstFrame: 161, lastFrame: 186,
      text: 'Peyton runs a business. She can use the function                  M = $580.52 – $420 to estimate how much money (M) she will earn in a day based on the number of customers (C) who enter her store.',
    },
    {
      objectId: 341, firstFrame: 187, lastFrame: 241,
      text: 'Peyton runs a business. She can use the function                  M = $160.52 to estimate how much money (M) she will earn in a day based on the number of customers (C) who enter her store.',
    },
  ],
} as const;

export function p043QuestionAtFrame(frame: number) {
  if (!Number.isInteger(frame)) return null;
  const story = P043_QUESTION_TEXT.stories.find(
    row => frame >= row.firstFrame && frame <= row.lastFrame,
  );
  if (!story) return null;
  return {
    instruction: P043_QUESTION_TEXT.instruction,
    story,
    question: P043_QUESTION_TEXT.question,
  };
}
