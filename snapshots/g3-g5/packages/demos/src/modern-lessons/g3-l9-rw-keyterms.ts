import type {LessonTextKeyTermsCapability} from '../lesson-text-contract';

/** Exact title matches in the currently hash-verified canonical ELKTEG4.xml
 * source index. Offsets refer to each page's 12 exported source buttons. */
export const G3_L9_RW_KEYTERM_TARGETS = Object.freeze({
  'polygons-heading': {sourceKey: 'Polygon', entryId: 'en-0491-f3cf35dfc299', offset: 0, prefix: '2 ', label: 'polygons'},
  trapezoid: {sourceKey: 'Trapezoid', entryId: 'en-0712-82a59c27324a', offset: 1, prefix: 'a ', label: 'trapezoid'},
  'solids-heading': {sourceKey: 'Solid figure', entryId: 'en-0639-8b336ef1bbfb', offset: 2, prefix: '2 ', label: 'solid figures'},
  cylinder: {sourceKey: 'Cylinder', entryId: 'en-0130-9365e305e6ea', offset: 3, prefix: 'a ', label: 'cylinder'},
  'rectangular-prism': {sourceKey: 'Rectangular prism', entryId: 'en-0557-388504133688', offset: 4, prefix: 'a ', label: 'rectangular prism'},
  rhombus: {sourceKey: 'Rhombus', entryId: 'en-0579-62ca60c451dc', offset: 5, prefix: 'a ', label: 'rhombus'},
  'rotational-symmetry': {sourceKey: 'Rotational symmetry', entryId: 'en-0589-5d92e7d39a52', offset: 6, prefix: '', label: 'rotational symmetry'},
  'intersecting-lines': {sourceKey: 'Intersecting lines', entryId: 'en-0316-f30e23b8713e', offset: 7, prefix: '', label: 'intersecting lines'},
  'lines-heading': {sourceKey: 'Line', entryId: 'en-0348-26540cbc2a59', offset: 8, prefix: '2 examples with ', label: 'lines'},
  'parallel-lines': {sourceKey: 'Parallel lines', entryId: 'en-0454-15ecd79d27f5', offset: 9, prefix: '', label: 'parallel lines'},
  'line-symmetry': {sourceKey: 'Line symmetry', entryId: 'en-0355-1f71adf34ba3', offset: 10, prefix: '', label: 'line symmetry'},
  'symmetry-heading': {sourceKey: 'Symmetry', entryId: 'en-0678-6bf8fc1561ca', offset: 11, prefix: '2 examples of ', label: 'symmetry'},
});

export const G3_L9_RW_KEY_TERMS = Object.freeze({indexLanguage: 'en', sourceAssetId: 'ELKTEG4.xml',
  sourceSha256: 'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
  entryIds: Object.freeze(Object.values(G3_L9_RW_KEYTERM_TARGETS).map(target => target.entryId)),
} satisfies LessonTextKeyTermsCapability);

export function g3L9RwSourceButtonId(pageId: string, offset: number) {
  const start = pageId === 'g3-l9-rw003' ? 29 : pageId === 'g3-l9-rw004' ? 37 : pageId === 'g3-l9-rw005' ? 35 : null;
  if (start === null || !Number.isInteger(offset) || offset < 0 || offset > 11) throw Error('Unknown RW source glossary button');
  return start + offset;
}
