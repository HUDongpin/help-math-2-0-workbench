/** Teaching copy follows source text roles; interaction instructions are native accessibility additions. */
export const P050_TEXT = {
 en: {
  title: 'Fractions, Decimals, and Percent Concepts: Try It!', question: 'Question 8',
  instruction: 'Drag and drop each decimal to its correct position on the number line.',
  keyboard: 'You can also select a decimal, then select its position. Press Escape to cancel your selection.',
  helpInstruction: 'If you get stuck or want more help, select Need More Help.',
  help: 'Need More Help', close: 'Close', correct: 'Correct!', wrong: 'Try Again!',
  explanation: 'The number line is divided into 10 equal parts between each whole number. You can place decimals on a number line just like you placed fractions on a number line.',
  example: 'To locate 0.5, count 5 parts from zero. Each part is one tenth.',
  select: 'Select decimal', selected: 'Selected decimal', position: 'Position', solved: 'Placed',
  complete: 'All five decimals are placed.',
 },
 es: {
  title: 'Conceptos de fracciones, decimales y porcentajes: ¡Inténtalo!', question: 'Pregunta 8',
  instruction: 'Arrastra y suelta cada decimal en su posición correcta en la recta numérica.',
  keyboard: 'También puedes seleccionar un decimal y después su posición. Pulsa Escape para cancelar la selección.',
  helpInstruction: 'Si necesitas más ayuda, selecciona Necesito más ayuda.',
  help: 'Necesito más ayuda', close: 'Cerrar', correct: '¡Correcto!', wrong: '¡Inténtalo de nuevo!',
  explanation: 'La recta numérica está dividida en 10 partes iguales entre cada par de números enteros consecutivos. Puedes ubicar decimales en una recta numérica igual que las fracciones.',
  example: 'Para ubicar 0.5, cuenta 5 partes desde cero. Cada parte es una décima.',
  select: 'Seleccionar decimal', selected: 'Decimal seleccionado', position: 'Posición', solved: 'Ubicado',
  complete: 'Los cinco decimales están ubicados.',
 },
} as const;
export type P050Language = keyof typeof P050_TEXT;
