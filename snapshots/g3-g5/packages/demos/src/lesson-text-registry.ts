import type {LessonTextPresentationCapability} from './lesson-text-contract';

/** Maintained product adapters, separate from generated source renderers.
 * A candidate entry is not a technical check, human review or release record.
 */
const loaders: Readonly<Record<string, () => Promise<LessonTextPresentationCapability<unknown>>>> = {
  'course-g04-l09-fq-001': async () =>
    (await import('./modern-lessons/g4-l9-fq001')).G4_L9_FQ001_PRESENTATION,
  'course-g04-l09-fq-002': async () =>
    (await import('./modern-lessons/g4-l9-fq002')).G4_L9_FQ002_TEXT_PRESENTATION,
  'course-g04-l09-fq-003': async () =>
    (await import('./modern-lessons/g4-l9-fq003')).G4_L9_FQ003_TEXT_PRESENTATION,
  'course-g04-l09-ts-007': () => import('./modern-lessons/g4-l9-ts007').then(m => m.G4_L9_TS007_TEXT_PRESENTATION),
  'course-g04-l09-ts-008': () => import('./modern-lessons/g4-l9-ts008').then(m => m.G4_L9_TS008_TEXT_PRESENTATION),
  'course-g04-l09-ts-006': async () =>
    (await import('./modern-lessons/g4-l9-ts006')).G4_L9_TS006_TEXT_PRESENTATION,
  'course-g04-l09-ts-005': async () =>
    (await import('./modern-lessons/g4-l9-ts005')).G4_L9_TS005_TEXT_PRESENTATION,
  'course-g04-l09-ts-004': async () =>
    (await import('./modern-lessons/g4-l9-ts004')).G4_L9_TS004_TEXT_PRESENTATION,
  'course-g04-l09-ts-003': async () =>
    (await import('./modern-lessons/g4-l9-ts003')).G4_L9_TS003_TEXT_PRESENTATION,
  'course-g04-l09-ts-002': async () =>
    (await import('./modern-lessons/g4-l9-ts002')).G4_L9_TS002_TEXT_PRESENTATION,
  'course-g04-l09-in-002': async () =>
    (await import('./modern-lessons/g4-l9-in002')).G4_L9_IN002_TEXT_PRESENTATION,
  'course-g04-l09-in-003': async () =>
    (await import('./modern-lessons/g4-l9-in003')).G4_L9_IN003_TEXT_PRESENTATION,
  'course-g04-l09-in-004': async () =>
    (await import('./modern-lessons/g4-l9-in004')).G4_L9_IN004_TEXT_PRESENTATION,
  'course-g04-l09-in-005': async () =>
    (await import('./modern-lessons/g4-l9-in005')).G4_L9_IN005_TEXT_PRESENTATION,
  'course-g04-l09-in-006': async () =>
    (await import('./modern-lessons/g4-l9-in006')).G4_L9_IN006_TEXT_PRESENTATION,
  'course-g04-l09-in-007': async () =>
    (await import('./modern-lessons/g4-l9-in007')).G4_L9_IN007_TEXT_PRESENTATION,
  'course-g04-l09-in-009': async () =>
    (await import('./modern-lessons/g4-l9-in009')).G4_L9_IN009_TEXT_PRESENTATION,
  'course-g04-l09-in-010': async () =>
    (await import('./modern-lessons/g4-l9-in010')).G4_L9_IN010_TEXT_PRESENTATION,
  'course-g04-l09-in-011': async () =>
    (await import('./modern-lessons/g4-l9-in011')).G4_L9_IN011_TEXT_PRESENTATION,
  'course-g04-l09-in-008': async () =>
    (await import('./modern-lessons/g4-l9-in008')).G4_L9_IN008_TEXT_PRESENTATION,
  'course-g04-l09-in-013': async () =>
    (await import('./modern-lessons/g4-l9-in013')).G4_L9_IN013_TEXT_PRESENTATION,
  'course-g04-l09-ti-002': async () =>
    (await import('./modern-lessons/g4-l9-ti002')).G4_L9_TI002_TEXT_PRESENTATION,
  'course-g04-l09-ti-003': async () =>
    (await import('./modern-lessons/g4-l9-ti003')).G4_L9_TI003_TEXT_PRESENTATION,
  'course-g04-l09-ti-004': async () =>
    (await import('./modern-lessons/g4-l9-ti004')).G4_L9_TI004_TEXT_PRESENTATION,
  'course-g04-l09-ti-005': async () =>
    (await import('./modern-lessons/g4-l9-ti005')).G4_L9_TI005_TEXT_PRESENTATION,
  'course-g04-l09-ti-007': async () =>
    (await import('./modern-lessons/g4-l9-ti007')).G4_L9_TI007_TEXT_PRESENTATION,
  'course-g04-l09-in-012': async () =>
    (await import('./modern-lessons/g4-l9-in012')).G4_L9_IN012_TEXT_PRESENTATION,
  'course-g04-l09-vb-008': async () =>
    (await import('./modern-lessons/g4-l9-vb008')).G4_L9_VB008_TEXT_PRESENTATION,
  'course-g04-l09-vb-009': async () =>
    (await import('./modern-lessons/g4-l9-vb009')).G4_L9_VB009_TEXT_PRESENTATION,
  'course-g04-l09-vb-010': async () =>
    (await import('./modern-lessons/g4-l9-vb010')).G4_L9_VB010_TEXT_PRESENTATION,
  'course-g04-l09-vb-011': async () =>
    (await import('./modern-lessons/g4-l9-vb011')).G4_L9_VB011_TEXT_PRESENTATION,
  'course-g04-l09-vb-005': async () =>
    (await import('./modern-lessons/g4-l9-vb005')).G4_L9_VB005_TEXT_PRESENTATION,
  'course-g04-l09-vb-006': async () =>
    (await import('./modern-lessons/g4-l9-vb006')).G4_L9_VB006_TEXT_PRESENTATION,
  'course-g04-l09-vb-007': async () =>
    (await import('./modern-lessons/g4-l9-vb007')).G4_L9_VB007_TEXT_PRESENTATION,
  'course-g04-l09-vb-002': async () =>
    (await import('./modern-lessons/g4-l9-vb002')).G4_L9_VB002_TEXT_PRESENTATION,
  'course-g04-l09-vb-003': async () =>
    (await import('./modern-lessons/g4-l9-vb003')).G4_L9_VB003_TEXT_PRESENTATION,
  'course-g04-l09-vb-004': async () =>
    (await import('./modern-lessons/g4-l9-vb004')).G4_L9_VB004_TEXT_PRESENTATION,
  'course-g04-l09-ir-001': async () =>
    (await import('./modern-lessons/g4-l9-ir001')).G4_L9_IR001_PRESENTATION,
  'course-g04-l08-fq-002': async () =>
    (await import('./modern-lessons/g4-l8-fq002')).G4_L8_FQ002_TEXT_PRESENTATION,
  'course-g04-l08-fq-003': async () =>
    (await import('./modern-lessons/g4-l8-fq003')).G4_L8_FQ003_TEXT_PRESENTATION,
  'course-g04-l05-ts-007': async () =>
    (await import('./modern-lessons/g4-l5-ts007')).G4_L5_TS007_TEXT_PRESENTATION,
  'course-g04-l05-ts-008': async () =>
    (await import('./modern-lessons/g4-l5-ts008')).G4_L5_TS008_TEXT_PRESENTATION,
  'course-g04-l04-gs-002': async () =>
    (await import('./modern-lessons/g4-l4-gs002')).G4_L4_GS002_TEXT_PRESENTATION,
  'course-g04-l04-in-008': async () =>
    (await import('./modern-lessons/g4-l4-in008')).G4_L4_IN008_TEXT_PRESENTATION,
  'course-g04-l04-rw-002': async () =>
    (await import('./modern-lessons/g4-l4-rw002')).G4_L4_RW002_TEXT_PRESENTATION,
  'course-g04-l04-rw-004': async () =>
    (await import('./modern-lessons/g4-l4-rw004')).G4_L4_RW004_TEXT_PRESENTATION,
  'course-g04-l04-rw-003': async () =>
    (await import('./modern-lessons/g4-l4-rw003')).G4_L4_RW003_TEXT_PRESENTATION,
  'course-g04-l04-ti-002': async () =>
    (await import('./modern-lessons/g4-l4-ti002')).G4_L4_TI002_TEXT_PRESENTATION,
  'course-g04-l04-ts-007': async () =>
    (await import('./modern-lessons/g4-l4-ts007')).G4_L4_TS007_TEXT_PRESENTATION,
  'course-g04-l04-ts-008': async () =>
    (await import('./modern-lessons/g4-l4-ts008')).G4_L4_TS008_TEXT_PRESENTATION,
  'course-g04-l04-vb-005': async () =>
    (await import('./modern-lessons/g4-l4-vb005')).G4_L4_VB005_TEXT_PRESENTATION,
  'course-g04-l04-vb-008': async () =>
    (await import('./modern-lessons/g4-l4-vb008')).G4_L4_VB008_TEXT_PRESENTATION,
  'course-g04-l04-vb-010': async () =>
    (await import('./modern-lessons/g4-l4-vb010')).G4_L4_VB010_TEXT_PRESENTATION,
  'course-g04-l04-ir-001-4cfdc375': async () =>
    (await import('./modern-lessons/g4-l4-ir001')).G4_L4_IR001_PRESENTATION,
  'course-g04-l04-fq-002': async () =>
    (await import('./modern-lessons/g4-l4-fq002')).G4_L4_FQ002_TEXT_PRESENTATION,
  'course-g04-l04-fq-003': async () =>
    (await import('./modern-lessons/g4-l4-fq003')).G4_L4_FQ003_TEXT_PRESENTATION,
  'course-g04-l04-fq-001': async () =>
    (await import('./modern-lessons/g4-l4-fq001')).G4_L4_FQ001_PRESENTATION,
  'course-g04-l04-in-022': async () =>
    (await import('./modern-lessons/g4-l4-in022')).G4_L4_IN022_TEXT_PRESENTATION,
  'course-g04-l04-ti-006': async () =>
    (await import('./modern-lessons/g4-l4-ti006')).G4_L4_TI006_TEXT_PRESENTATION,
  'course-g04-l04-ti-004': async () =>
    (await import('./modern-lessons/g4-l4-ti004')).G4_L4_TI004_TEXT_PRESENTATION,
  'course-g04-l04-ti-005': async () =>
    (await import('./modern-lessons/g4-l4-ti005')).G4_L4_TI005_TEXT_PRESENTATION,
  'course-g04-l04-in-009': async () =>
    (await import('./modern-lessons/g4-l4-in009')).G4_L4_IN009_TEXT_PRESENTATION,
  'course-g04-l04-in-013': async () =>
    (await import('./modern-lessons/g4-l4-in013')).G4_L4_IN013_TEXT_PRESENTATION,
  'course-g04-l04-in-018': async () =>
    (await import('./modern-lessons/g4-l4-in018')).G4_L4_IN018_TEXT_PRESENTATION,
  'course-g04-l04-in-019': async () =>
    (await import('./modern-lessons/g4-l4-in019')).G4_L4_IN019_TEXT_PRESENTATION,
  'course-g04-l04-in-020': async () =>
    (await import('./modern-lessons/g4-l4-in020')).G4_L4_IN020_TEXT_PRESENTATION,
  'course-g04-l04-in-021': async () =>
    (await import('./modern-lessons/g4-l4-in021')).G4_L4_IN021_TEXT_PRESENTATION,
  'course-g04-l04-in-006': async () =>
    (await import('./modern-lessons/g4-l4-in006')).G4_L4_IN006_TEXT_PRESENTATION,
  'course-g04-l04-in-011': async () =>
    (await import('./modern-lessons/g4-l4-in011')).G4_L4_IN011_TEXT_PRESENTATION,
  'course-g04-l04-in-016': async () =>
    (await import('./modern-lessons/g4-l4-in016')).G4_L4_IN016_TEXT_PRESENTATION,
  'course-g04-l03-rw-002': async () =>
    (await import('./modern-lessons/g4-l3-rw002')).G4_L3_RW002_TEXT_PRESENTATION,
  'course-g04-l03-rw-003': async () =>
    (await import('./modern-lessons/g4-l3-rw003')).G4_L3_RW003_TEXT_PRESENTATION,
  'course-g04-l03-rw-004': async () =>
    (await import('./modern-lessons/g4-l3-rw004')).G4_L3_RW004_TEXT_PRESENTATION,
  'course-g04-l03-ir-001-341242cc': async () =>
    (await import('./modern-lessons/g4-l3-ir001')).G4_L3_IR001_TEXT_PRESENTATION,
  'course-g04-l03-ts-002':async()=> (await import('./modern-lessons/g4-l3-ts002-capability')).TS002_PRESENTATION,
  'course-g04-l03-ts-003':async()=> (await import('./modern-lessons/g4-l3-ts003-capability')).TS003_PRESENTATION,
  'course-g04-l03-ts-004':async()=> (await import('./modern-lessons/g4-l3-ts004-capability')).TS004_PRESENTATION,
  'course-g04-l03-ts-005':async()=> (await import('./modern-lessons/g4-l3-ts005-capability')).TS005_PRESENTATION,
  'course-g04-l03-ts-006':async()=> (await import('./modern-lessons/g4-l3-ts006-capability')).TS006_PRESENTATION,
  'course-g04-l03-ts-007':async()=> (await import('./modern-lessons/g4-l3-ts007-capability')).TS007_PRESENTATION,
  'course-g04-l03-gs-002':async()=> (await import('./modern-lessons/g4-l3-gs002-capability')).GS002_PRESENTATION,
  'course-g04-l03-ti-006':async()=> (await import('./modern-lessons/g4-l3-ti006-capability')).TI006_PRESENTATION,
  'course-g04-l03-ti-005':async()=> (await import('./modern-lessons/g4-l3-ti005-capability')).TI005_PRESENTATION,
  'course-g04-l03-ti-004':async()=> (await import('./modern-lessons/g4-l3-ti004-capability')).TI004_PRESENTATION,
  'course-g04-l03-ti-003': async () =>
    (await import('./modern-lessons/g4-l3-ti003-capability')).TI003_PRESENTATION,
  'course-g04-l03-ti-002': async () =>
    (await import('./modern-lessons/g4-l3-ti002-capability')).TI002_PRESENTATION,
  'course-g03-l01-vb-009': async () =>
    (await import('./modern-lessons/g3-l1-vb009')).G3_L1_VB009_TEXT_PRESENTATION,
  'course-g03-l01-vb-010': async () =>
    (await import('./modern-lessons/g3-l1-vb010-capability')).G3_L1_VB010_TEXT_PRESENTATION,
  'course-g03-l01-vb-015': async () =>
    (await import('./modern-lessons/g3-l1-vb015')).G3_L1_VB015_TEXT_PRESENTATION,
  'course-g03-l01-ti-006': async () =>
    (await import('./modern-lessons/g3-l1-ti006')).G3_L1_TI006_TEXT_PRESENTATION,
  'course-g04-l01-ti-005': async () =>
    (await import('./modern-lessons/g4-l1-ti005')).G4_L1_TI005_TEXT_PRESENTATION,
  'course-g04-l01-ti-006': async () =>
    (await import('./modern-lessons/g4-l1-ti006')).G4_L1_TI006_TEXT_PRESENTATION,
  'course-g03-l01-ts-008': async () =>
    (await import('./modern-lessons/g3-l1-ts008')).G3_L1_TS008_TEXT_PRESENTATION,
  'course-g03-l04-in-022': async () =>
    (await import('./modern-lessons/g3-l4-in022')).G3_L4_IN022_TEXT_PRESENTATION,
  'course-g03-l06-ti-005': async () =>
    (await import('./modern-lessons/g3-l6-ti005')).G3_L6_TI005_TEXT_PRESENTATION,
  'course-g03-l06-gs-002': async () =>
    (await import('./modern-lessons/lemonade-games')).G3_L6_GS002_TEXT_PRESENTATION,
  'course-g04-l01-gs-002': async () =>
    (await import('./modern-lessons/lemonade-games')).G4_L1_GS002_TEXT_PRESENTATION,
  'course-g03-l06-ts-008': async () =>
    (await import('./modern-lessons/g3-l6-ts008')).G3_L6_TS008_TEXT_PRESENTATION,
  'course-g03-l09-rw-003': async () =>
    (await import('./modern-lessons/g3-l9-rw003')).G3_L9_RW003_TEXT_PRESENTATION,
  'course-g03-l09-rw-004': async () =>
    (await import('./modern-lessons/g3-l9-rw004')).G3_L9_RW004_TEXT_PRESENTATION,
  'course-g03-l09-rw-005': async () =>
    (await import('./modern-lessons/g3-l9-rw005')).G3_L9_RW005_TEXT_PRESENTATION,
  'course-g03-l09-rw-007': async () =>
    (await import('./modern-lessons/g3-l9-rw007')).G3_L9_RW007_TEXT_PRESENTATION,
  'course-g03-l09-ts-008': async () =>
    (await import('./modern-lessons/g3-l9-ts008')).G3_L9_TS008_TEXT_PRESENTATION,
  'course-g04-l03-in-002': async () =>
    (await import('./modern-lessons/g4-l3-in002')).G4_L3_IN002_TEXT_PRESENTATION,
  'course-g04-l03-in-003': async () =>
    (await import('./modern-lessons/g4-l3-in003')).G4_L3_IN003_TEXT_PRESENTATION,
  'course-g04-l03-in-004': async () =>
    (await import('./modern-lessons/g4-l3-in004')).G4_L3_IN004_TEXT_PRESENTATION,
  'course-g04-l03-in-006': async () =>
    (await import('./modern-lessons/g4-l3-in006')).IN006_PRESENTATION,
  'course-g04-l03-in-007': async () =>
    (await import('./modern-lessons/g4-l3-in007')).IN007_PRESENTATION,
  'course-g04-l03-in-008': async () =>
    (await import('./modern-lessons/g4-l3-in008')).IN008_PRESENTATION,
  'course-g04-l03-in-009': async () =>
    (await import('./modern-lessons/g4-l3-in009')).IN009_PRESENTATION,
  'course-g04-l03-in-012': async () =>
    (await import('./modern-lessons/g4-l3-in012-capability')).IN012_PRESENTATION,
  'course-g04-l03-in-011': async () =>
    (await import('./modern-lessons/g4-l3-in011')).IN011_PRESENTATION,
  'course-g04-l03-in-010': async () =>
    (await import('./modern-lessons/g4-l3-in010')).IN010_PRESENTATION,
  'course-g04-l03-in-005': async () =>
    (await import('./modern-lessons/g4-l3-in005')).G4_L3_IN005_TEXT_PRESENTATION,
  'course-g04-l03-ts-008': async () =>
    (await import('./modern-lessons/g4-l3-ts008')).G4_L3_TS008_TEXT_PRESENTATION,
  'course-g04-l03-fq-001': async () =>
    (await import('./modern-lessons/g4-l3-fq001')).FQ001_PRESENTATION,
  'course-g04-l04-ti-003': async () =>
    (await import('./modern-lessons/g4-l4-ti003')).G4_L4_TI003_TEXT_PRESENTATION,
  'course-g04-l05-vb-002': async () =>
    (await import('./modern-lessons/g4-l5-vb002')).G4_L5_VB002_TEXT_PRESENTATION,
  'course-g04-l05-vb-003': async () =>
    (await import('./modern-lessons/g4-l5-vb003')).G4_L5_VB003_TEXT_PRESENTATION,
  'course-g04-l05-vb-004': async () =>
    (await import('./modern-lessons/g4-l5-vb004')).G4_L5_VB004_TEXT_PRESENTATION,
  'course-g04-l05-vb-005': async () =>
    (await import('./modern-lessons/g4-l5-vb005')).G4_L5_VB005_TEXT_PRESENTATION,
  'course-g04-l05-in-019': async () =>
    (await import('./modern-lessons/g4-l5-in019')).G4_L5_IN019_TEXT_PRESENTATION,
  'course-g04-l05-vb-008': async () =>
    (await import('./modern-lessons/g4-l5-vb008')).G4_L5_VB008_TEXT_PRESENTATION,
  'course-g04-l05-in-010': async () =>
    (await import('./modern-lessons/g4-l5-in010')).G4_L5_IN010_TEXT_PRESENTATION,
  'course-g04-l05-in-005': async () =>
    (await import('./modern-lessons/g4-l5-in005')).G4_L5_IN005_TEXT_PRESENTATION,
  'course-g04-l05-in-013': async () =>
    (await import('./modern-lessons/g4-l5-in013')).G4_L5_IN013_TEXT_PRESENTATION,
  'course-g04-l05-in-016': async () =>
    (await import('./modern-lessons/g4-l5-in016')).G4_L5_IN016_TEXT_PRESENTATION,
  'course-g04-l05-vb-011': async () =>
    (await import('./modern-lessons/g4-l5-vb011')).G4_L5_VB011_TEXT_PRESENTATION,
  'course-g04-l05-vb-013': async () =>
    (await import('./modern-lessons/g4-l5-vb013')).G4_L5_VB013_TEXT_PRESENTATION,
  'course-g04-l05-vb-012': async () =>
    (await import('./modern-lessons/g4-l5-vb012')).G4_L5_VB012_TEXT_PRESENTATION,
  'course-g04-l05-vb-015': async () =>
    (await import('./modern-lessons/g4-l5-vb015')).G4_L5_VB015_TEXT_PRESENTATION,
  'course-g04-l05-vb-014': async () =>
    (await import('./modern-lessons/g4-l5-vb014')).G4_L5_VB014_TEXT_PRESENTATION,
  'course-g04-l05-vb-007': async () =>
    (await import('./modern-lessons/g4-l5-vb007')).G4_L5_VB007_TEXT_PRESENTATION,
  'course-g04-l05-in-017': async () =>
    (await import('./modern-lessons/g4-l5-in017')).G4_L5_IN017_TEXT_PRESENTATION,
  'course-g04-l05-in-002': async () =>
    (await import('./modern-lessons/g4-l5-in002')).G4_L5_IN002_TEXT_PRESENTATION,
  'course-g04-l05-in-006': async () =>
    (await import('./modern-lessons/g4-l5-in006')).G4_L5_IN006_TEXT_PRESENTATION,
  'course-g04-l08-in-003': async () =>
    (await import('./modern-lessons/g4-l8-in003')).G4_L8_IN003_TEXT_PRESENTATION,
  'course-g04-l08-in-002': async () =>
    (await import('./modern-lessons/g4-l8-in002')).G4_L8_IN002_TEXT_PRESENTATION,
  'course-g04-l08-in-007': async () =>
    (await import('./modern-lessons/g4-l8-in007')).G4_L8_IN007_TEXT_PRESENTATION,
  'course-g04-l08-in-008': async () =>
    (await import('./modern-lessons/g4-l8-in008')).G4_L8_IN008_TEXT_PRESENTATION,
  'course-g04-l08-in-009': async () =>
    (await import('./modern-lessons/g4-l8-in009')).G4_L8_IN009_TEXT_PRESENTATION,
  'course-g04-l08-in-013': async () =>
    (await import('./modern-lessons/g4-l8-in013')).G4_L8_IN013_TEXT_PRESENTATION,
  'course-g04-l08-in-014': async () =>
    (await import('./modern-lessons/g4-l8-in014')).G4_L8_IN014_TEXT_PRESENTATION,
  'course-g04-l08-in-015': async () =>
    (await import('./modern-lessons/g4-l8-in015')).G4_L8_IN015_TEXT_PRESENTATION,
  'course-g04-l08-ti-002': async () =>
    (await import('./modern-lessons/g4-l8-ti002')).G4_L8_TI002_TEXT_PRESENTATION,
  'course-g04-l08-ti-003': async () =>
    (await import('./modern-lessons/g4-l8-ti003')).G4_L8_TI003_TEXT_PRESENTATION,
  'course-g04-l08-ti-004': async () =>
    (await import('./modern-lessons/g4-l8-ti004')).G4_L8_TI004_TEXT_PRESENTATION,
  'course-g04-l08-ti-005': async () =>
    (await import('./modern-lessons/g4-l8-ti005')).G4_L8_TI005_TEXT_PRESENTATION,
  'course-g04-l08-ti-006': async () =>
    (await import('./modern-lessons/g4-l8-ti006')).G4_L8_TI006_TEXT_PRESENTATION,
  'course-g04-l08-ti-007': async () =>
    (await import('./modern-lessons/g4-l8-ti007')).G4_L8_TI007_TEXT_PRESENTATION,
  'course-g04-l08-gs-002': async () =>
    (await import('./modern-lessons/g4-l8-gs002')).G4_L8_GS002_TEXT_PRESENTATION,
  'course-g04-l08-gs-003': async () =>
    (await import('./modern-lessons/g4-l8-gs003')).G4_L8_GS003_TEXT_PRESENTATION,
  'course-g04-l08-ts-002': async () =>
    (await import('./modern-lessons/g4-l8-ts002')).G4_L8_TS002_TEXT_PRESENTATION,
  'course-g04-l08-ts-006': async () =>
    (await import('./modern-lessons/g4-l8-ts006')).G4_L8_TS006_TEXT_PRESENTATION,
  'course-g04-l08-fq-001': async () =>
    (await import('./modern-lessons/g4-l8-fq001')).G4_L8_FQ001_PRESENTATION,
  'course-g04-l08-in-004': async () =>
    (await import('./modern-lessons/g4-l8-in004')).G4_L8_IN004_TEXT_PRESENTATION,
  'course-g04-l08-in-005': async () =>
    (await import('./modern-lessons/g4-l8-in005')).G4_L8_IN005_TEXT_PRESENTATION,
  'course-g04-l08-in-010': async () =>
    (await import('./modern-lessons/g4-l8-in010')).G4_L8_IN010_TEXT_PRESENTATION,
  'course-g04-l08-in-011': async () =>
    (await import('./modern-lessons/g4-l8-in011')).G4_L8_IN011_TEXT_PRESENTATION,
  'course-g04-l08-in-012': async () =>
    (await import('./modern-lessons/g4-l8-in012')).G4_L8_IN012_TEXT_PRESENTATION,
  'course-g04-l08-ts-003': async () =>
    (await import('./modern-lessons/g4-l8-ts003')).G4_L8_TS003_TEXT_PRESENTATION,
  'course-g04-l08-ts-004': async () =>
    (await import('./modern-lessons/g4-l8-ts004')).G4_L8_TS004_TEXT_PRESENTATION,
  'course-g04-l08-ts-005': async () =>
    (await import('./modern-lessons/g4-l8-ts005')).G4_L8_TS005_TEXT_PRESENTATION,
  'course-g04-l08-vb-002': async () =>
    (await import('./modern-lessons/g4-l8-vb002')).G4_L8_VB002_TEXT_PRESENTATION,
  'course-g04-l08-vb-008': async () =>
    (await import('./modern-lessons/g4-l8-vb008')).G4_L8_VB008_TEXT_PRESENTATION,
  'course-g04-l08-vb-010': async () =>
    (await import('./modern-lessons/g4-l8-vb010')).G4_L8_VB010_TEXT_PRESENTATION,
  'course-g04-l06-in-007': async () =>
    (await import('./modern-lessons/g4-l6-in007')).G4_L6_IN007_TEXT_PRESENTATION,
  'course-g04-l06-ts-002': async () =>
    (await import('./modern-lessons/g4-l6-ts002')).G4_L6_TS002_TEXT_PRESENTATION,
  'course-g04-l06-ts-003': async () =>
    (await import('./modern-lessons/g4-l6-ts003')).G4_L6_TS003_TEXT_PRESENTATION,
  'course-g04-l06-ts-004': async () =>
    (await import('./modern-lessons/g4-l6-ts004')).G4_L6_TS004_TEXT_PRESENTATION,
  'course-g04-l06-ts-005': async () =>
    (await import('./modern-lessons/g4-l6-ts005')).G4_L6_TS005_TEXT_PRESENTATION,
  'course-g04-l06-ts-006': async () =>
    (await import('./modern-lessons/g4-l6-ts006')).G4_L6_TS006_TEXT_PRESENTATION,
  'course-g04-l06-vb-002': async () =>
    (await import('./modern-lessons/g4-l6-vb002')).G4_L6_VB002_TEXT_PRESENTATION,
  'course-g04-l06-vb-003': async () =>
    (await import('./modern-lessons/g4-l6-vb003')).G4_L6_VB003_TEXT_PRESENTATION,
  'course-g04-l06-vb-004': async () =>
    (await import('./modern-lessons/g4-l6-vb004')).G4_L6_VB004_TEXT_PRESENTATION,
  'course-g04-l06-vb-007': async () =>
    (await import('./modern-lessons/g4-l6-vb007')).G4_L6_VB007_TEXT_PRESENTATION,
  'course-g04-l06-vb-010': async () =>
    (await import('./modern-lessons/g4-l6-vb010')).G4_L6_VB010_TEXT_PRESENTATION,
  'course-g04-l06-vb-012': async () =>
    (await import('./modern-lessons/g4-l6-vb012')).G4_L6_VB012_TEXT_PRESENTATION,
  'course-g04-l05-fq-001': async () =>
    (await import('./modern-lessons/g4-l5-fq001')).G4_L5_FQ001_TEXT_PRESENTATION,
  'course-g04-l05-rw-004': async () =>
    (await import('./modern-lessons/g4-l5-rw004')).G4_L5_RW004_TEXT_PRESENTATION,
  'course-g04-l05-in-007': async () =>
    (await import('./modern-lessons/g4-l5-in007')).G4_L5_IN007_TEXT_PRESENTATION,
  'course-g04-l05-in-008': async () =>
    (await import('./modern-lessons/g4-l5-in008')).G4_L5_IN008_TEXT_PRESENTATION,
  'course-g04-l05-in-011': async () =>
    (await import('./modern-lessons/g4-l5-in011')).G4_L5_IN011_TEXT_PRESENTATION,
  'course-g04-l05-in-014': async () =>
    (await import('./modern-lessons/g4-l5-in014')).G4_L5_IN014_TEXT_PRESENTATION,
  'course-g04-l05-ts-003': async () =>
    (await import('./modern-lessons/g4-l5-ts003')).G4_L5_TS003_TEXT_PRESENTATION,
  'course-g04-l05-ts-004': async () =>
    (await import('./modern-lessons/g4-l5-ts004')).G4_L5_TS004_TEXT_PRESENTATION,
  'course-g04-l05-ts-002': async () =>
    (await import('./modern-lessons/g4-l5-ts002')).G4_L5_TS002_TEXT_PRESENTATION,
  'course-g04-l05-ts-005': async () =>
    (await import('./modern-lessons/g4-l5-ts005')).G4_L5_TS005_TEXT_PRESENTATION,
  'course-g04-l05-ts-006': async () =>
    (await import('./modern-lessons/g4-l5-ts006')).G4_L5_TS006_TEXT_PRESENTATION,
  'course-g04-l05-vb-006': async () =>
    (await import('./modern-lessons/g4-l5-vb006')).G4_L5_VB006_TEXT_PRESENTATION,
  'course-g04-l05-vb-009': async () =>
    (await import('./modern-lessons/g4-l5-vb009')).G4_L5_VB009_TEXT_PRESENTATION,
  'course-g04-l05-ti-002': async () =>
    (await import('./modern-lessons/g4-l5-ti002')).G4_L5_TI002_TEXT_PRESENTATION,
  'course-g04-l05-in-015': async () =>
    (await import('./modern-lessons/g4-l5-in015')).G4_L5_IN015_TEXT_PRESENTATION,
  'course-g04-l05-in-018': async () =>
    (await import('./modern-lessons/g4-l5-in018')).G4_L5_IN018_TEXT_PRESENTATION,
  'course-g04-l05-in-012': async () =>
    (await import('./modern-lessons/g4-l5-in012')).G4_L5_IN012_TEXT_PRESENTATION,
  'course-g05-l01-ti-010': async () =>
    (await import('./modern-lessons/g5-l1-ti010')).G5_L1_TI010_TEXT_PRESENTATION,
  'course-g05-l02-ti-006': async () =>
    (await import('./modern-lessons/g5-l2-ti006')).G5_L2_TI006_TEXT_PRESENTATION,
  'course-g05-l02-ti-008': async () =>
    (await import('./modern-lessons/g5-l2-ti008')).G5_L2_TI008_TEXT_PRESENTATION,
  'course-g05-l02-ti-011': async () =>
    (await import('./modern-lessons/g5-l2-ti011')).G5_L2_TI011_TEXT_PRESENTATION,
  'course-g05-l03-vb-003': async () =>
    (await import('./modern-lessons/g5-l3-vb003')).G5_L3_VB003_TEXT_PRESENTATION,
  'course-g05-l04-fq-001': async () => {
    const page = await import('./modern-lessons/g5-l4-fq001');
    return {schemaVersion: 1, binding: page.binding, Renderer: page.ModernRenderer, getSnapshot: page.getSnapshot,
      reducedMotionFrameByDomain: page.reducedMotionFrameByDomain};
  },
  'course-g04-l03-vb-002': async () =>
    (await import('./modern-lessons/g4-l3-vb002')).G4_L3_VB002_TEXT_PRESENTATION,
  'course-g04-l03-vb-004': async () =>
    (await import('./modern-lessons/g4-l3-vb004')).G4_L3_VB004_TEXT_PRESENTATION,
  'course-g04-l03-vb-005': async () =>
    (await import('./modern-lessons/g4-l3-vb005')).G4_L3_VB005_TEXT_PRESENTATION,
  'course-g04-l03-vb-006': async () =>
    (await import('./modern-lessons/g4-l3-vb006')).G4_L3_VB006_TEXT_PRESENTATION,
  'course-g04-l03-vb-007': async () =>
    (await import('./modern-lessons/g4-l3-vb007')).G4_L3_VB007_TEXT_PRESENTATION,
  'course-g04-l03-vb-008': async () =>
    (await import('./modern-lessons/g4-l3-vb008')).G4_L3_VB008_TEXT_PRESENTATION,
  'course-g04-l03-vb-009': async () =>
    (await import('./modern-lessons/g4-l3-vb009')).G4_L3_VB009_TEXT_PRESENTATION,
  'course-g04-l03-vb-003': async () =>
    (await import('./modern-lessons/g4-l3-vb003')).G4_L3_VB003_TEXT_PRESENTATION,
  'course-g04-l04-ts-002': async () =>
    (await import('./modern-lessons/g4-l4-ts002')).G4_L4_TS002_TEXT_PRESENTATION,
  'course-g04-l04-ts-003': async () =>
    (await import('./modern-lessons/g4-l4-ts003')).G4_L4_TS003_TEXT_PRESENTATION,
  'course-g04-l04-ts-004': async () =>
    (await import('./modern-lessons/g4-l4-ts004')).G4_L4_TS004_TEXT_PRESENTATION,
  'course-g04-l04-ts-005': async () =>
    (await import('./modern-lessons/g4-l4-ts005')).G4_L4_TS005_TEXT_PRESENTATION,
  'course-g04-l04-ts-006': async () =>
    (await import('./modern-lessons/g4-l4-ts006')).G4_L4_TS006_TEXT_PRESENTATION,
  'course-g04-l04-vb-002': async () =>
    (await import('./modern-lessons/g4-l4-vb002')).G4_L4_VB002_TEXT_PRESENTATION,
  'course-g04-l04-vb-003': async () =>
    (await import('./modern-lessons/g4-l4-vb003')).G4_L4_VB003_TEXT_PRESENTATION,
  'course-g04-l04-vb-004': async () =>
    (await import('./modern-lessons/g4-l4-vb004')).G4_L4_VB004_TEXT_PRESENTATION,
  'course-g04-l04-vb-006': async () =>
    (await import('./modern-lessons/g4-l4-vb006')).G4_L4_VB006_TEXT_PRESENTATION,
  'course-g04-l04-vb-007': async () =>
    (await import('./modern-lessons/g4-l4-vb007')).G4_L4_VB007_TEXT_PRESENTATION,
  'course-g04-l04-vb-009': async () =>
    (await import('./modern-lessons/g4-l4-vb009')).G4_L4_VB009_TEXT_PRESENTATION,
  'course-g04-l04-vb-011': async () =>
    (await import('./modern-lessons/g4-l4-vb011')).G4_L4_VB011_TEXT_PRESENTATION,
  'course-g04-l04-vb-012': async () =>
    (await import('./modern-lessons/g4-l4-vb012')).G4_L4_VB012_TEXT_PRESENTATION,
  'course-g04-l04-vb-013': async () =>
    (await import('./modern-lessons/g4-l4-vb013')).G4_L4_VB013_TEXT_PRESENTATION,
  'course-g04-l04-vb-014': async () =>
    (await import('./modern-lessons/g4-l4-vb014')).G4_L4_VB014_TEXT_PRESENTATION,
  'course-g04-l04-in-002': async () =>
    (await import('./modern-lessons/g4-l4-in002')).G4_L4_IN002_TEXT_PRESENTATION,
  'course-g04-l04-in-003': async () =>
    (await import('./modern-lessons/g4-l4-in003')).G4_L4_IN003_TEXT_PRESENTATION,
  'course-g04-l04-in-004': async () =>
    (await import('./modern-lessons/g4-l4-in004')).G4_L4_IN004_TEXT_PRESENTATION,
  'course-g04-l04-in-007': async () =>
    (await import('./modern-lessons/g4-l4-in007')).G4_L4_IN007_TEXT_PRESENTATION,
  'course-g04-l04-in-012': async () =>
    (await import('./modern-lessons/g4-l4-in012')).G4_L4_IN012_TEXT_PRESENTATION,
  'course-g04-l04-in-017': async () =>
    (await import('./modern-lessons/g4-l4-in017')).G4_L4_IN017_TEXT_PRESENTATION,
  'course-g04-l04-in-005': async () =>
    (await import('./modern-lessons/g4-l4-in005')).G4_L4_IN005_TEXT_PRESENTATION,
  'course-g04-l04-in-010': async () =>
    (await import('./modern-lessons/g4-l4-in010')).G4_L4_IN010_TEXT_PRESENTATION,
  'course-g04-l04-in-014': async () =>
    (await import('./modern-lessons/g4-l4-in014')).G4_L4_IN014_TEXT_PRESENTATION,
  'course-g04-l04-in-015': async () =>
    (await import('./modern-lessons/g4-l4-in015')).G4_L4_IN015_TEXT_PRESENTATION,
};

export function hasLessonTextPresentation(animationId: string) {
  return Object.hasOwn(loaders, animationId);
}

export async function loadLessonTextPresentation(animationId: string) {
  const presentation = await loaders[animationId]?.();
  if (presentation && presentation.binding.animationId !== animationId) {
    throw new Error('Modern lesson text is bound to a different animation.');
  }
  return presentation;
}
