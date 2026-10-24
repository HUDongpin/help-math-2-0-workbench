import {P047_GLOSSARY as source} from './generated/nms-l02-p047-glossary-v1';
/** Explicit teaching correction: the recovered Whole entry describes a count of
 * parts. This page instead teaches fractions as parts of a complete unit.
 * Original bytes/definitions remain unchanged in generated source evidence.
 */
export const P047_GLOSSARY=source.map(entry=>entry.id==='whole'?{
 ...entry,definitions:{en:'A complete unit or group before it is divided into parts.',es:'Una unidad o un grupo completo antes de dividirlo en partes.'},teachingCorrection:'whole-unit-not-denominator-count',
}:{...entry,teachingCorrection:null});
