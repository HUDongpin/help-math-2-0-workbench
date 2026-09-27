export const G4_L12_PRIVATE_KEYTERM_CANDIDATE_AUTHORITY = Object.freeze({
  status: 'same-host-default-dictionary-candidate',
  language: 'en',
  scope: 'private-g4-l12-audio-calibration-only',
  runtimeVariantVerified: false,
  lessonSpecificSubstitutionAuthorized: false,
  originalRuntimeAccepted: false,
  humanAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  publicationAuthorized: false,
  source: Object.freeze({
    path: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml',
    bytes: 378_783,
    sha256: 'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
  }),
  catalog: Object.freeze({
    path: 'apps/web/public/generated/g4-grade-wide-keyterms-en.json',
    bytes: 969_932,
    sha256: '1a27fb3eadb1c74a1bd705f2f44602d69728051e39477c2af0a3590848618688',
  }),
  sameLessonHost: Object.freeze({
    path: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L12/index_local.swf',
    bytes: 383_591,
    sha256: '9e8f10fcaae4bcea672b3c236610118881b82c0983fac6018557348568234631',
  }),
} as const);

export const G4_L12_PRIVATE_KEYTERM_CANDIDATES = Object.freeze([
  Object.freeze({
    id: 'en-0051-69b2da04ca2b',
    sourceKeyAttribute: 'Center',
    title: 'Center',
    definition: 'A point that is equal in distance from the vertices of a regular polygon.',
  }),
  Object.freeze({
    id: 'en-0230-eeccc98bafdb',
    sourceKeyAttribute: 'Figure',
    title: 'Figure',
    definition: 'A figure is a drawing or a diagram.',
  }),
  Object.freeze({
    id: 'en-0490-56db4bb302f7',
    sourceKeyAttribute: 'Point',
    title: 'Point',
    definition: 'A point is a geometric figure that has position, but no length, width, or height.',
  }),
  Object.freeze({
    id: 'en-0678-6bf8fc1561ca',
    sourceKeyAttribute: 'Symmetry',
    title: 'Symmetry',
    definition: 'A figure has symmetry, or is symmetrical, when it has an exact image on either side of a dividing line, plane, center or axis.',
  }),
] as const);

export type G4L12PrivateKeytermCandidate =
  (typeof G4_L12_PRIVATE_KEYTERM_CANDIDATES)[number];

export function findG4L12PrivateKeytermCandidate(
  entryId: string,
): G4L12PrivateKeytermCandidate | null {
  return G4_L12_PRIVATE_KEYTERM_CANDIDATES.find(({id}) => id === entryId) ?? null;
}
