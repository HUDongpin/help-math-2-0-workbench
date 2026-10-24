import {L10_LESSON_CANVAS_RESOURCES} from './lib/alg-l10-lesson-canvas-request-v1';
import {L8_CURRENT_RESOURCE_PINS} from './lib/alg-l08-current-local-request-v1';
import {L8_LESSON_CANVAS_RESOURCES} from './lib/alg-l08-lesson-canvas-request-v1';
import {L7_CURRENT_RESOURCE_PINS} from './lib/alg-l07-current-local-request-v1';
import {P001_RESOURCE_PINS} from './lib/alg-l07-p001-local-request-v1';
import {P060_RESOURCE_PINS} from './lib/alg-l06-p060-local-request-v1';
import {P058_RESOURCE_PINS} from './lib/alg-l06-p058-local-request-v1';
import {P057_RESOURCE_PINS} from './lib/alg-l06-p057-local-request-v1';
import {P056_RESOURCE_PINS} from './lib/alg-l06-p056-local-request-v1';
import {P033_RESOURCE_PINS} from './lib/alg-l06-p033-local-request-v1';
import {P050_RESOURCE_PINS} from './lib/alg-l06-p050-local-request-v1';
import {P049_RESOURCE_PINS} from './lib/alg-l06-p049-local-request-v1';
import {P048_RESOURCE_PINS} from './lib/alg-l06-p048-local-request-v1';
import {P047_RESOURCE_PINS} from './lib/alg-l06-p047-local-request-v1';
import {P046_RESOURCE_PINS} from './lib/alg-l06-p046-local-request-v1';
import {P045_RESOURCE_PINS} from './lib/alg-l06-p045-local-request-v1';
import {P044_RESOURCE_PINS} from './lib/alg-l06-p044-local-request-v1';
import {P043_RESOURCE_PINS} from './lib/alg-l06-p043-local-request-v1';
import {P042_RESOURCE_PINS} from './lib/alg-l06-p042-local-request-v1';
import {P041_RESOURCE_PINS} from './lib/alg-l06-p041-local-request-v1';
import {P038_RESOURCE_PINS} from './lib/alg-l06-p038-local-request-v1';
import {P035_RESOURCE_PINS} from './lib/alg-l06-p035-local-request-v1';
import {P034_RESOURCE_PINS} from './lib/alg-l06-p034-local-request-v1';
import {P032_RESOURCE_PINS} from './lib/alg-l06-p032-local-request-v1';
import {P028_RESOURCE_PINS} from './lib/alg-l06-p028-local-request-v1';
import {P027_RESOURCE_PINS} from './lib/alg-l06-p027-local-request-v1';
import {P026_RESOURCE_PINS} from './lib/alg-l06-p026-local-request-v1';
import {P025_RESOURCE_PINS} from './lib/alg-l06-p025-local-request-v1';
import {P024_RESOURCE_PINS} from './lib/alg-l06-p024-local-request-v1';
import {P023_RESOURCE_PINS} from './lib/alg-l06-p023-local-request-v1';
import {P022_RESOURCE_PINS} from './lib/alg-l06-p022-local-request-v1';
import {P021_RESOURCE_PINS} from './lib/alg-l06-p021-local-request-v1';
import {P020_RESOURCE_PINS} from './lib/alg-l06-p020-local-request-v1';
import {P019_RESOURCE_PINS} from './lib/alg-l06-p019-local-request-v1';
import {P018_RESOURCE_PINS} from './lib/alg-l06-p018-local-request-v1';
import {P017_RESOURCE_PINS} from './lib/alg-l06-p017-local-request-v1';
import {P016_RESOURCE_PINS} from './lib/alg-l06-p016-local-request-v1';
import {P015_RESOURCE_PINS} from './lib/alg-l06-p015-local-request-v1';
import {P014_RESOURCE_PINS} from './lib/alg-l06-p014-local-request-v1';
import {P013_RESOURCE_PINS} from './lib/alg-l06-p013-local-request-v1';
import {P010_LESSON_CANVAS_RESOURCES} from './lib/alg-l06-p010-lesson-canvas-request-v1';
import type {NextConfig} from 'next';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

import {isClerkLocalAuthConfigurationReady} from './lib/clerk-local-auth-config';
import {assertG678CompiledLocalQaConfiguration, isG678CompiledLocalQaEnabled, isG678LocalPreviewEnabled} from './lib/g678-preview-policy';
import {
  CLERK_SYNTHETIC_DIST_DIR,
  CLERK_SYNTHETIC_DIST_DIR_AUTHORIZATION,
} from './lib/clerk-synthetic-execution';

const webDirectory = path.dirname(fileURLToPath(import.meta.url));
const g678LocalOnlyRegistrySpecifier =
  '@helpmath/demos/local-only-animation-registry';
const g678LocalOnlyRegistryMetadataSpecifier =
  '@helpmath/demos/local-only-animation-registry-metadata';
const g678LocalOnlyRegistryProductionStub = path.join(
  webDirectory,
  'lib/g678-local-only-registry.production-stub.ts',
);
const p064LocalCandidateSpecifier = '@helpmath/demos/nms-l02-p064-local-candidate';
const p064LocalCandidateProductionStub = path.join(
  webDirectory,
  'lib/g678-p064-candidate.production-stub.tsx',
);
const p064LocalCandidateSource = path.resolve(
  webDirectory,
  '../../packages/demos/src/nms-l02-p064-quiz-candidate.tsx',
);
const algP001LocalCandidateSpecifier = '@helpmath/demos/alg-l06-p001-local-candidate';
const algP001LocalCandidateProductionStub = path.join(
  webDirectory,
  'lib/g678-alg-l06-p001.production-stub.tsx',
);
const algP001LocalCandidateSource = path.resolve(
  webDirectory,
  '../../packages/demos/src/alg-l06-p001-title-view.tsx',
);
const p054LocalCandidateSpecifier = '@helpmath/demos/nms-l02-p054-local-candidate';
const p054LocalCandidateProductionStub = path.join(
  webDirectory,
  'lib/g678-p054-candidate.production-stub.tsx',
);
const p054LocalCandidateSource = path.resolve(
  webDirectory,
  '../../packages/demos/src/nms-l02-p054-board-candidate.tsx',
);
const geoP002LocalCandidateSpecifier = '@helpmath/demos/geo-l06-p002-local-candidate';
const geoP002LocalCandidateProductionStub = path.join(
  webDirectory,
  'lib/g678-geo-p002-candidate.production-stub.tsx',
);
const geoP002LocalCandidateSource = path.resolve(
  webDirectory,
  '../../packages/demos/src/geo-l06-p002-local-candidate.tsx',
);
const datP002LocalCandidateSpecifier = '@helpmath/demos/dat-l02-p002-local-candidate';
const datP002LocalCandidateProductionStub = path.join(
  webDirectory,
  'lib/g678-dat-p002-candidate.production-stub.tsx',
);
const datP002LocalCandidateSource = path.resolve(
  webDirectory,
  '../../packages/demos/src/dat-l02-p002-candidate-renderer-v1.tsx',
);
const geoP002HostRuntimeSpecifier = '@/components/g678-geo-l06-p002-runtime';
const geoP002HostRuntimeProductionStub = path.join(
  webDirectory,
  'lib/g678-geo-p002-host-runtime.production-stub.tsx',
);
const geoP002HostRuntimeSource = path.join(
  webDirectory,
  'components/g678-geo-l06-p002-runtime.tsx',
);
const algP003HostRuntimeSpecifier = '@/components/g678-alg-l06-p003-host-runtime';
const algL12P005HostSpecifier = '@/components/g678-alg-l12-p005-host-lesson';
const algL12P005HostSource = path.join(webDirectory, 'components/g678-alg-l12-p005-host-lesson.tsx');
const algL12P005HostProductionStub = path.join(webDirectory, 'lib/g678-alg-l12-p005-host.production-stub.tsx');
const algL12P006HostSpecifier = '@/components/g678-alg-l12-p006-host-lesson';
const algL12P006HostSource = path.join(webDirectory, 'components/g678-alg-l12-p006-host-lesson.tsx');
const algL12P006HostProductionStub = path.join(webDirectory, 'lib/g678-alg-l12-p006-host.production-stub.tsx');
const algL12P009HostSpecifier = '@/components/g678-alg-l12-p009-host-lesson';
const algL12P009HostSource = path.join(webDirectory, 'components/g678-alg-l12-p009-host-lesson.tsx');
const algL12P009HostProductionStub = path.join(webDirectory, 'lib/g678-alg-l12-p009-host.production-stub.tsx');
const algP003HostRuntimeProductionStub = path.join(
  webDirectory, 'lib/g678-alg-l06-p003-host-runtime.production-stub.tsx',
);
const algP003HostRuntimeSource = path.join(
  webDirectory, 'components/g678-alg-l06-p003-host-runtime.tsx',
);
const p064QuestionAudioSpecifier = '@/lib/nms-l02-p064-question-audio-response';
const p064QuestionAudioProductionStub = path.join(
  webDirectory,
  'lib/nms-l02-p064-question-audio.production-stub.ts',
);
const p010LessonCanvasProductionStub = path.join(webDirectory, 'lib/alg-l06-p010-lesson-canvas-request-production-v1.ts');
const p023RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p023-local-request.production-stub.ts');
const p035RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p035-local-request.production-stub.ts');
const p041RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p041-local-request.production-stub.ts');
const l10P004HostSpecifier='@/components/g678-alg-l10-p004-host-lesson-v1';
const l10P004HostSource=path.join(webDirectory,'components/g678-alg-l10-p004-host-lesson-v1.tsx');
const l10P004HostProductionStub=path.join(webDirectory,'lib/alg-l10-p004-host.production-stub.tsx');
const l8CurrentHostSpecifier='@/components/g678-alg-l08-current-host-lesson-v1';
const l8CurrentHostSource=path.join(webDirectory,'components/g678-alg-l08-current-host-lesson-v1.tsx');
const l8CurrentHostProductionStub=path.join(webDirectory,'lib/alg-l08-current-host.production-stub.tsx');
const l8P001HostSpecifier='@/components/g678-alg-l08-p001-host-lesson-v1';
const l8P001HostSource=path.join(webDirectory,'components/g678-alg-l08-p001-host-lesson-v1.tsx');
const l8P001HostProductionStub=path.join(webDirectory,'lib/alg-l08-p001-host.production-stub.tsx');
const l7CurrentHostSpecifier='@/components/g678-alg-l07-current-host-lesson-v1';
const l7CurrentHostSource=path.join(webDirectory,'components/g678-alg-l07-current-host-lesson-v1.tsx');
const l7CurrentHostProductionStub=path.join(webDirectory,'lib/alg-l07-current-host.production-stub.tsx');
const localPageProductionReplacements=[
 ["alg-l10-lesson-canvas-request-v1","alg-l10-lesson-canvas-request.production-stub.ts"],
 ["alg-l10-lesson-canvas-resources-v1.server","alg-l10-lesson-canvas-resources.production-stub.ts"],
 ["alg-l10-p004-local-request-v1","alg-l10-p004-local-request.production-stub.ts"],
 ["alg-l10-p004-resources-v1.server","alg-l10-p004-resources.production-stub.ts"],
 ["alg-l10-p004-resource-pins-v1","alg-l10-p004-resource-pins.production-stub.ts"],
 ['alg-l08-current-local-request-v1','alg-l08-current-local-request.production-stub.ts'],
 ['alg-l08-current-resources-v1.server','alg-l08-current-resources.production-stub.ts'],
 ['alg-l08-p005-local-request-v1','alg-l08-p005-local-request.production-stub.ts'],
 ['alg-l08-p006-local-request-v1','alg-l08-p006-local-request.production-stub.ts'],
 ['alg-l08-p007-local-request-v1','alg-l08-p007-local-request.production-stub.ts'],
 ['alg-l08-p009-local-request-v1','alg-l08-p009-local-request.production-stub.ts'],
 ['alg-l08-p010-local-request-v1','alg-l08-p010-local-request.production-stub.ts'],
 ['alg-l08-p011-local-request-v1','alg-l08-p011-local-request.production-stub.ts'],
 ['alg-l08-p012-local-request-v1','alg-l08-p012-local-request.production-stub.ts'],
 ['alg-l08-p013-local-request-v1','alg-l08-p013-local-request.production-stub.ts'],
 ['alg-l08-p014-local-request-v1','alg-l08-p014-local-request.production-stub.ts'],
 ['alg-l08-p015-local-request-v1','alg-l08-p015-local-request.production-stub.ts'],
 ['alg-l08-p016-local-request-v1','alg-l08-p016-local-request.production-stub.ts'],
 ['alg-l08-p018-local-request-v1','alg-l08-p018-local-request.production-stub.ts'],
 ['alg-l08-p019-local-request-v1','alg-l08-p019-local-request.production-stub.ts'],
 ['alg-l08-p020-local-request-v1','alg-l08-p020-local-request.production-stub.ts'],
 ['alg-l08-p021-local-request-v1','alg-l08-p021-local-request.production-stub.ts'],
 ['alg-l08-p022-local-request-v1','alg-l08-p022-local-request.production-stub.ts'],
 ['alg-l08-p023-local-request-v1','alg-l08-p023-local-request.production-stub.ts'],
 ['alg-l08-p024-local-request-v1','alg-l08-p024-local-request.production-stub.ts'],
 ['alg-l08-p026-local-request-v1','alg-l08-p026-local-request.production-stub.ts'],
 ['alg-l08-p027-local-request-v1','alg-l08-p027-local-request.production-stub.ts'],
 ['alg-l08-p028-local-request-v1','alg-l08-p028-local-request.production-stub.ts'],
 ['alg-l08-p029-local-request-v1','alg-l08-p029-local-request.production-stub.ts'],
 ['alg-l08-p030-local-request-v1','alg-l08-p030-local-request.production-stub.ts'],
 ['alg-l08-p031-local-request-v1','alg-l08-p031-local-request.production-stub.ts'],
 ['alg-l08-p032-local-request-v1','alg-l08-p032-local-request.production-stub.ts'],
 ['alg-l08-p033-local-request-v1','alg-l08-p033-local-request.production-stub.ts'],
 ['alg-l08-p034-local-request-v1','alg-l08-p034-local-request.production-stub.ts'],
 ['alg-l08-p035-local-request-v1','alg-l08-p035-local-request.production-stub.ts'],
 ['alg-l08-p036-local-request-v1','alg-l08-p036-local-request.production-stub.ts'],
 ['alg-l08-p037-local-request-v1','alg-l08-p037-local-request.production-stub.ts'],
 ['alg-l08-p038-local-request-v1','alg-l08-p038-local-request.production-stub.ts'],
 ['alg-l08-p040-local-request-v1','alg-l08-p040-local-request.production-stub.ts'],
 ['alg-l08-p050-local-request-v1','alg-l08-p050-local-request.production-stub.ts'],
 ['alg-l08-p039-local-request-v1','alg-l08-p039-local-request.production-stub.ts'],
 ['alg-l08-p046-local-request-v1','alg-l08-p046-local-request.production-stub.ts'],
 ['alg-l08-p047-local-request-v1','alg-l08-p047-local-request.production-stub.ts'],
 ['alg-l08-p048-local-request-v1','alg-l08-p048-local-request.production-stub.ts'],
 ['alg-l08-lesson-canvas-request-v1','alg-l08-lesson-canvas-request.production-stub.ts'],
 ['alg-l08-lesson-canvas-resources-v1.server','alg-l08-lesson-canvas-resources.production-stub.ts'],
 ['alg-l08-p001-local-request-v1','alg-l08-p001-local-request.production-stub.ts'],
 ['alg-l08-p001-resources-v1.server','alg-l08-p001-resources.production-stub.ts'],
 ['alg-l07-current-local-request-v1','alg-l07-current-local-request.production-stub.ts'],
 ['alg-l07-current-resources-v1.server','alg-l07-current-resources.production-stub.ts'],
 ['alg-l07-p002-local-request-v1','alg-l07-p002-local-request.production-stub.ts'],
 ['alg-l07-p002-resources-v1.server','alg-l07-p002-resources.production-stub.ts'],
 ['alg-l07-p003-local-request-v1','alg-l07-p003-local-request.production-stub.ts'],
 ['alg-l07-p003-resources-v1.server','alg-l07-p003-resources.production-stub.ts'],
 ['alg-l07-p006-local-request-v1','alg-l07-p006-local-request.production-stub.ts'],
 ['alg-l07-p006-resources-v1.server','alg-l07-p006-resources.production-stub.ts'],
 ['alg-l07-p007-local-request-v1','alg-l07-p007-local-request.production-stub.ts'],
 ['alg-l07-p007-resources-v1.server','alg-l07-p007-resources.production-stub.ts'],
 ['alg-l07-p009-local-request-v1','alg-l07-p009-local-request.production-stub.ts'],
 ['alg-l07-p009-resources-v1.server','alg-l07-p009-resources.production-stub.ts'],
 ['alg-l07-p010-local-request-v1','alg-l07-p010-local-request.production-stub.ts'],
 ['alg-l07-p010-resources-v1.server','alg-l07-p010-resources.production-stub.ts'],
 ['alg-l07-p011-local-request-v1','alg-l07-p011-local-request.production-stub.ts'],
 ['alg-l07-p011-resources-v1.server','alg-l07-p011-resources.production-stub.ts'],
 ['alg-l07-p012-local-request-v1','alg-l07-p012-local-request.production-stub.ts'],
 ['alg-l07-p012-resources-v1.server','alg-l07-p012-resources.production-stub.ts'],
 ['alg-l07-p013-local-request-v1','alg-l07-p013-local-request.production-stub.ts'],
 ['alg-l07-p013-resources-v1.server','alg-l07-p013-resources.production-stub.ts'],
 ['alg-l07-p014-local-request-v1','alg-l07-p014-local-request.production-stub.ts'],
 ['alg-l07-p014-resources-v1.server','alg-l07-p014-resources.production-stub.ts'],
 ['alg-l07-p015-local-request-v1','alg-l07-p015-local-request.production-stub.ts'],
 ['alg-l07-p015-resources-v1.server','alg-l07-p015-resources.production-stub.ts'],
 ['alg-l07-p016-local-request-v1','alg-l07-p016-local-request.production-stub.ts'],
 ['alg-l07-p016-resources-v1.server','alg-l07-p016-resources.production-stub.ts'],
 ['alg-l07-p017-local-request-v1','alg-l07-p017-local-request.production-stub.ts'],
 ['alg-l07-p017-resources-v1.server','alg-l07-p017-resources.production-stub.ts'],
 ['alg-l07-p018-local-request-v1','alg-l07-p018-local-request.production-stub.ts'],
 ['alg-l07-p018-resources-v1.server','alg-l07-p018-resources.production-stub.ts'],
 ['alg-l07-p019-local-request-v1','alg-l07-p019-local-request.production-stub.ts'],
 ['alg-l07-p019-resources-v1.server','alg-l07-p019-resources.production-stub.ts'],
 ['alg-l07-p020-local-request-v1','alg-l07-p020-local-request.production-stub.ts'],
 ['alg-l07-p020-resources-v1.server','alg-l07-p020-resources.production-stub.ts'],
 ['alg-l07-p021-local-request-v1','alg-l07-p021-local-request.production-stub.ts'],
 ['alg-l07-p021-resources-v1.server','alg-l07-p021-resources.production-stub.ts'],
 ['alg-l07-p022-local-request-v1','alg-l07-p022-local-request.production-stub.ts'],
 ['alg-l07-p022-resources-v1.server','alg-l07-p022-resources.production-stub.ts'],
 ['alg-l07-p023-local-request-v1','alg-l07-p023-local-request.production-stub.ts'],
 ['alg-l07-p023-resources-v1.server','alg-l07-p023-resources.production-stub.ts'],
 ['alg-l07-p025-local-request-v1','alg-l07-p025-local-request.production-stub.ts'],
 ['alg-l07-p025-resources-v1.server','alg-l07-p025-resources.production-stub.ts'],
 ['alg-l07-p026-local-request-v1','alg-l07-p026-local-request.production-stub.ts'],
 ['alg-l07-p026-resources-v1.server','alg-l07-p026-resources.production-stub.ts'],
 ['alg-l07-p027-local-request-v1','alg-l07-p027-local-request.production-stub.ts'],
 ['alg-l07-p027-resources-v1.server','alg-l07-p027-resources.production-stub.ts'],
 ['alg-l07-p030-local-request-v1','alg-l07-p030-local-request.production-stub.ts'],
 ['alg-l07-p030-resources-v1.server','alg-l07-p030-resources.production-stub.ts'],
 ['alg-l07-p031-local-request-v1','alg-l07-p031-local-request.production-stub.ts'],
 ['alg-l07-p031-resources-v1.server','alg-l07-p031-resources.production-stub.ts'],
 ['alg-l07-p032-local-request-v1','alg-l07-p032-local-request.production-stub.ts'],
 ['alg-l07-p032-resources-v1.server','alg-l07-p032-resources.production-stub.ts'],
 ['alg-l07-p033-local-request-v1','alg-l07-p033-local-request.production-stub.ts'],
 ['alg-l07-p033-resources-v1.server','alg-l07-p033-resources.production-stub.ts'],
 ['alg-l07-p034-local-request-v1','alg-l07-p034-local-request.production-stub.ts'],
 ['alg-l07-p034-resources-v1.server','alg-l07-p034-resources.production-stub.ts'],
 ['alg-l07-p036-local-request-v1','alg-l07-p036-local-request.production-stub.ts'],
 ['alg-l07-p036-resources-v1.server','alg-l07-p036-resources.production-stub.ts'],
 ['alg-l07-p037-local-request-v1','alg-l07-p037-local-request.production-stub.ts'],
 ['alg-l07-p037-resources-v1.server','alg-l07-p037-resources.production-stub.ts'],
 ['alg-l07-p038-local-request-v1','alg-l07-p038-local-request.production-stub.ts'],
 ['alg-l07-p038-resources-v1.server','alg-l07-p038-resources.production-stub.ts'],
 ['alg-l07-p039-local-request-v1','alg-l07-p039-local-request.production-stub.ts'],
 ['alg-l07-p039-resources-v1.server','alg-l07-p039-resources.production-stub.ts'],
 ['alg-l07-p040-local-request-v1','alg-l07-p040-local-request.production-stub.ts'],
 ['alg-l07-p040-resources-v1.server','alg-l07-p040-resources.production-stub.ts'],
 ['alg-l07-p041-local-request-v1','alg-l07-p041-local-request.production-stub.ts'],
 ['alg-l07-p041-resources-v1.server','alg-l07-p041-resources.production-stub.ts'],
 ['alg-l07-p043-local-request-v1','alg-l07-p043-local-request.production-stub.ts'],
 ['alg-l07-p043-resources-v1.server','alg-l07-p043-resources.production-stub.ts'],
 ['alg-l07-p050-local-request-v1','alg-l07-p050-local-request.production-stub.ts'],
 ['alg-l07-p050-resources-v1.server','alg-l07-p050-resources.production-stub.ts'],
 ['alg-l07-p058-local-request-v1','alg-l07-p058-local-request.production-stub.ts'],
 ['alg-l07-p058-resources-v1.server','alg-l07-p058-resources.production-stub.ts'],
 ['alg-l07-p060-local-request-v1','alg-l07-p060-local-request.production-stub.ts'],
 ['alg-l07-p060-resources-v1.server','alg-l07-p060-resources.production-stub.ts'],
 ['alg-l07-p062-local-request-v1','alg-l07-p062-local-request.production-stub.ts'],
 ['alg-l07-p062-resources-v1.server','alg-l07-p062-resources.production-stub.ts'],
 ['alg-l07-p059-local-request-v1','alg-l07-p059-local-request.production-stub.ts'],
 ['alg-l07-p059-resources-v1.server','alg-l07-p059-resources.production-stub.ts'],
 ['alg-l07-p052-local-request-v1','alg-l07-p052-local-request.production-stub.ts'],
 ['alg-l07-p052-resources-v1.server','alg-l07-p052-resources.production-stub.ts'],
 ['alg-l07-p051-local-request-v1','alg-l07-p051-local-request.production-stub.ts'],
 ['alg-l07-p051-resources-v1.server','alg-l07-p051-resources.production-stub.ts'],
 ['alg-l07-p049-local-request-v1','alg-l07-p049-local-request.production-stub.ts'],
 ['alg-l07-p049-resources-v1.server','alg-l07-p049-resources.production-stub.ts'],
 ['alg-l07-p048-local-request-v1','alg-l07-p048-local-request.production-stub.ts'],
 ['alg-l07-p048-resources-v1.server','alg-l07-p048-resources.production-stub.ts'],
 ['alg-l07-p046-local-request-v1','alg-l07-p046-local-request.production-stub.ts'],
 ['alg-l07-p046-resources-v1.server','alg-l07-p046-resources.production-stub.ts'],
 ['alg-l07-p047-local-request-v1','alg-l07-p047-local-request.production-stub.ts'],
 ['alg-l07-p047-resources-v1.server','alg-l07-p047-resources.production-stub.ts'],
 ['alg-l07-p045-local-request-v1','alg-l07-p045-local-request.production-stub.ts'],
 ['alg-l07-p045-resources-v1.server','alg-l07-p045-resources.production-stub.ts'],
 ['alg-l07-p044-local-request-v1','alg-l07-p044-local-request.production-stub.ts'],
 ['alg-l07-p044-resources-v1.server','alg-l07-p044-resources.production-stub.ts'],
 ['alg-l07-p042-local-request-v1','alg-l07-p042-local-request.production-stub.ts'],
 ['alg-l07-p042-resources-v1.server','alg-l07-p042-resources.production-stub.ts'],
] as const;
const p001RequestProductionStub = path.join(webDirectory, 'lib/alg-l07-p001-local-request.production-stub.ts');
const p001ResourcesProductionStub = path.join(webDirectory, 'lib/alg-l07-p001-resources.production-stub.ts');
const p060RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p060-local-request.production-stub.ts');
const p058RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p058-local-request.production-stub.ts');
const p057RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p057-local-request.production-stub.ts');
const p056RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p056-local-request.production-stub.ts');
const p033RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p033-local-request.production-stub.ts');
const p050RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p050-local-request.production-stub.ts');
const p049RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p049-local-request.production-stub.ts');
const p048RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p048-local-request.production-stub.ts');
const p047RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p047-local-request.production-stub.ts');
const p046RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p046-local-request.production-stub.ts');
const p001HostSpecifier = '@/components/g678-alg-l07-p001-host-lesson-v1';
const p060HostSpecifier = '@/components/g678-alg-l06-p060-host-lesson-v1';
const p058HostSpecifier = '@/components/g678-alg-l06-p058-host-lesson-v1';
const p057HostSpecifier = '@/components/g678-alg-l06-p057-host-lesson-v1';
const p056HostSpecifier = '@/components/g678-alg-l06-p056-host-lesson-v1';
const p033HostSpecifier = '@/components/g678-alg-l06-p033-host-lesson-v1';
const p050HostSpecifier = '@/components/g678-alg-l06-p050-host-lesson-v1';
const p049HostSpecifier = '@/components/g678-alg-l06-p049-host-lesson-v1';
const p048HostSpecifier = '@/components/g678-alg-l06-p048-host-lesson-v1';
const p047HostSpecifier = '@/components/g678-alg-l06-p047-host-lesson-v1';
const p046HostSpecifier = '@/components/g678-alg-l06-p046-host-lesson-v1';
const p001HostSource = path.join(webDirectory, 'components/g678-alg-l07-p001-host-lesson-v1.tsx');
const p060HostSource = path.join(webDirectory, 'components/g678-alg-l06-p060-host-lesson-v1.tsx');
const p058HostSource = path.join(webDirectory, 'components/g678-alg-l06-p058-host-lesson-v1.tsx');
const p057HostSource = path.join(webDirectory, 'components/g678-alg-l06-p057-host-lesson-v1.tsx');
const p056HostSource = path.join(webDirectory, 'components/g678-alg-l06-p056-host-lesson-v1.tsx');
const p033HostSource = path.join(webDirectory, 'components/g678-alg-l06-p033-host-lesson-v1.tsx');
const p050HostSource = path.join(webDirectory, 'components/g678-alg-l06-p050-host-lesson-v1.tsx');
const p049HostSource = path.join(webDirectory, 'components/g678-alg-l06-p049-host-lesson-v1.tsx');
const p048HostSource = path.join(webDirectory, 'components/g678-alg-l06-p048-host-lesson-v1.tsx');
const p047HostSource = path.join(webDirectory, 'components/g678-alg-l06-p047-host-lesson-v1.tsx');
const p046HostSource = path.join(webDirectory, 'components/g678-alg-l06-p046-host-lesson-v1.tsx');
const p001HostProductionStub = path.join(webDirectory, 'lib/alg-l07-p001-host.production-stub.tsx');
const p060HostProductionStub = path.join(webDirectory, 'lib/alg-l06-p060-host.production-stub.tsx');
const p058HostProductionStub = path.join(webDirectory, 'lib/alg-l06-p058-host.production-stub.tsx');
const p057HostProductionStub = path.join(webDirectory, 'lib/alg-l06-p057-host.production-stub.tsx');
const p056HostProductionStub = path.join(webDirectory, 'lib/alg-l06-p056-host.production-stub.tsx');
const p033HostProductionStub = path.join(webDirectory, 'lib/alg-l06-p033-host.production-stub.tsx');
const p050HostProductionStub = path.join(webDirectory, 'lib/alg-l06-p050-host.production-stub.tsx');
const p049HostProductionStub = path.join(webDirectory, 'lib/alg-l06-p049-host.production-stub.tsx');
const p048HostProductionStub = path.join(webDirectory, 'lib/alg-l06-p048-host.production-stub.tsx');
const p047HostProductionStub = path.join(webDirectory, 'lib/alg-l06-p047-host.production-stub.tsx');
const p046HostProductionStub = path.join(webDirectory, 'lib/alg-l06-p046-host.production-stub.tsx');
const p045RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p045-local-request.production-stub.ts');
const p045HostSpecifier = '@/components/g678-alg-l06-p045-host-lesson-v1';
const p045HostSource = path.join(webDirectory, 'components/g678-alg-l06-p045-host-lesson-v1.tsx');
const p045HostProductionStub = path.join(webDirectory, 'lib/alg-l06-p045-host.production-stub.tsx');
const p044RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p044-local-request.production-stub.ts');
const p044HostSpecifier = '@/components/g678-alg-l06-p044-host-lesson-v1';
const p044HostSource = path.join(webDirectory, 'components/g678-alg-l06-p044-host-lesson-v1.tsx');
const p044HostProductionStub = path.join(webDirectory, 'lib/alg-l06-p044-host.production-stub.tsx');
const p043RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p043-local-request.production-stub.ts');
const p043HostSpecifier = '@/components/g678-alg-l06-p043-host-lesson-v1';
const p043HostSource = path.join(webDirectory, 'components/g678-alg-l06-p043-host-lesson-v1.tsx');
const p043HostProductionStub = path.join(webDirectory, 'lib/alg-l06-p043-host.production-stub.tsx');
const p042RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p042-local-request.production-stub.ts');
const p042HostSpecifier = '@/components/g678-alg-l06-p042-host-lesson-v1';
const p042HostSource = path.join(webDirectory, 'components/g678-alg-l06-p042-host-lesson-v1.tsx');
const p042HostProductionStub = path.join(webDirectory, 'lib/alg-l06-p042-host.production-stub.tsx');
const p041HostSpecifier = '@/components/g678-alg-l06-p041-host-lesson-v1';
const p041HostSource = path.join(webDirectory, 'components/g678-alg-l06-p041-host-lesson-v1.tsx');
const p041HostProductionStub = path.join(webDirectory, 'lib/alg-l06-p041-host.production-stub.tsx');
const p038RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p038-local-request.production-stub.ts');
const p034RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p034-local-request.production-stub.ts');
const p032RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p032-local-request.production-stub.ts');
const p028RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p028-local-request.production-stub.ts');
const p027RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p027-local-request.production-stub.ts');
const p026RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p026-local-request.production-stub.ts');
const p025RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p025-local-request.production-stub.ts');
const p024RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p024-local-request.production-stub.ts');
const p022RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p022-local-request.production-stub.ts');
const p021RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p021-local-request.production-stub.ts');
const p020RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p020-local-request.production-stub.ts');
const p019RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p019-local-request.production-stub.ts');
const p018RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p018-local-request.production-stub.ts');
const p017RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p017-local-request.production-stub.ts');
const p016RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p016-local-request.production-stub.ts');
const p015RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p015-local-request.production-stub.ts');
const p014RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p014-local-request.production-stub.ts');
const p013RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p013-local-request.production-stub.ts');
const p010RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p010-local-request.production-stub.ts');
const p010PredecessorProductionStub = path.join(webDirectory, 'lib/alg-l06-p010-predecessor-request.production-stub.ts');
const p008RequestProductionStub = path.join(webDirectory, 'lib/alg-l06-p008-local-request.production-stub.ts');
const g678LocalPreviewDemosSourceRoot =
  process.env.HELP_MATH_G678_DEMOS_SOURCE_ROOT
    ? path.resolve(process.env.HELP_MATH_G678_DEMOS_SOURCE_ROOT)
    : null;
const g4L3WholeLessonPackageBuild =
  process.env.G4_L3_WHOLE_LESSON_PACKAGE === '1';
const g4L3WholeLessonPackageV31Build =
  g4L3WholeLessonPackageBuild
  && process.env.G4_L3_WHOLE_LESSON_PACKAGE_V3_1 === '1';
const g4L3WholeLessonPackageV32Build =
  g4L3WholeLessonPackageBuild
  && process.env.G4_L3_WHOLE_LESSON_PACKAGE_V3_2 === '1';
const g4L3WholeLessonPackageV33Build =
  g4L3WholeLessonPackageBuild
  && process.env.G4_L3_WHOLE_LESSON_PACKAGE_V3_3 === '1';
const g5L4WholeLessonPackageBuild =
  process.env.G5_L4_WHOLE_LESSON_PACKAGE === '1';
const localReferenceDiagnosticBuild =
  process.env.HELP_MATH_LOCAL_REFERENCE_DIAGNOSTIC === '1'
  && process.env.NODE_ENV === 'production'
  && process.env.VERCEL_ENV === undefined;
const p064ProductionScanBuild =
  process.env.HELP_MATH_P064_PRODUCTION_SCAN === '1'
  && process.env.NODE_ENV === 'production'
  && process.env.VERCEL_ENV === undefined;
const geoP002ProductionScanBuild =
  process.env.HELP_MATH_GEO_P002_PRODUCTION_SCAN === '1'
  && process.env.NODE_ENV === 'production'
  && process.env.VERCEL_ENV === undefined;
const geoP002HostProductionScanBuild =
  process.env.HELP_MATH_GEO_P002_HOST_PRODUCTION_SCAN === '1'
  && process.env.NODE_ENV === 'production'
  && process.env.VERCEL_ENV === undefined;
const clerkSyntheticBuild =
  process.env.HELP_MATH_CLERK_SYNTHETIC_BUILD
    === CLERK_SYNTHETIC_DIST_DIR_AUTHORIZATION
  && process.env.NODE_ENV === 'development'
  && process.env.VERCEL_ENV === undefined;
const currentJsCandidateQaBuild =
  process.env.HELP_MATH_CURRENT_JS_CANDIDATE_QA
    === 'current-js-candidate-profile-v1'
  && process.env.CURRENT_JS_CANDIDATE_PROFILE_ENABLED === 'true'
  && process.env.NODE_ENV === 'development'
  && process.env.VERCEL_ENV === undefined;
const l10P004LocalQaBuild=process.env.HELP_MATH_ALG_L10_P004_LOCAL_QA==='1'
  && process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV
  && isG678LocalPreviewEnabled();
const l7CurrentLocalQaBuild=process.env.HELP_MATH_ALG_L07_CURRENT_LOCAL_QA==='1'&&process.env.NODE_ENV==='development'&&process.env.VERCEL_ENV===undefined;
const l7CurrentProductionScanBuild=process.env.HELP_MATH_ALG_L07_CURRENT_PRODUCTION_SCAN==='1'&&process.env.NODE_ENV==='production'&&process.env.VERCEL_ENV===undefined;
const algP001LocalQaBuild =
  process.env.HELP_MATH_ALG_P001_LOCAL_QA === '1'
  && process.env.NODE_ENV === 'development'
  && process.env.VERCEL_ENV === undefined;
const algP001ProductionScanBuild =
  process.env.HELP_MATH_ALG_P001_PRODUCTION_SCAN === '1'
  && process.env.NODE_ENV === 'production'
  && process.env.VERCEL_ENV === undefined;
const algP003ProductionScanBuild =
  process.env.HELP_MATH_ALG_P003_PRODUCTION_SCAN === '1'
  && process.env.NODE_ENV === 'production'
  && process.env.VERCEL_ENV === undefined;
const novaFullStackFakeTransportRequested = [
  process.env.NOVA_TEST_FAKE_TRANSPORT_AUTHORIZATION,
  process.env.NOVA_TEST_FAKE_TRANSPORT_MODE,
  process.env.NOVA_TEST_FAKE_TRANSPORT_ORIGIN,
  process.env.NOVA_TEST_FAKE_TRANSPORT_RECEIPT_PATH,
].some((value) => value !== undefined);
const localClerkAuthBuild = isClerkLocalAuthConfigurationReady(process.env);
const localClerkScriptSources = localClerkAuthBuild
  ? ' https://*.clerk.accounts.dev https://*.clerk.com https://*.protect.clerk.com'
  : '';
const localClerkConnectSources = localClerkAuthBuild
  ? ' https://api.clerk.com https://*.clerk.accounts.dev https://*.clerk.com https://*.protect.clerk.com https://img.clerk.com'
  : '';
const localClerkImageSources = localClerkAuthBuild
  ? ' https://img.clerk.com'
  : '';
const localClerkFrameSources = localClerkAuthBuild
  ? ' https://*.protect.clerk.com'
  : '';
if (g4L3WholeLessonPackageBuild && g5L4WholeLessonPackageBuild) {
  throw new Error(
    'G4 L3 and G5 L4 standalone package builds are mutually exclusive.',
  );
}
if (
  process.env.NODE_ENV === 'production' &&
  novaFullStackFakeTransportRequested
) {
  throw new Error(
    'Nova full-stack fake transport is forbidden in production builds.',
  );
}
if (
  process.env.G4_L3_WHOLE_LESSON_PACKAGE_V3_1 === '1'
  && !g4L3WholeLessonPackageBuild
) {
  throw new Error(
    'G4 L3 v3.1 package mode requires G4_L3_WHOLE_LESSON_PACKAGE=1.',
  );
}
if (
  process.env.G4_L3_WHOLE_LESSON_PACKAGE_V3_2 === '1'
  && !g4L3WholeLessonPackageBuild
) {
  throw new Error(
    'G4 L3 v3.2 package mode requires G4_L3_WHOLE_LESSON_PACKAGE=1.',
  );
}
if (
  process.env.G4_L3_WHOLE_LESSON_PACKAGE_V3_3 === '1'
  && !g4L3WholeLessonPackageBuild
) {
  throw new Error(
    'G4 L3 v3.3 package mode requires G4_L3_WHOLE_LESSON_PACKAGE=1.',
  );
}
if (
  [
    g4L3WholeLessonPackageV31Build,
    g4L3WholeLessonPackageV32Build,
    g4L3WholeLessonPackageV33Build,
  ].filter(Boolean).length > 1
) {
  throw new Error(
    'G4 L3 v3.1, v3.2, and v3.3 package modes are mutually exclusive.',
  );
}
const wholeLessonPackageBuild =
  g4L3WholeLessonPackageBuild || g5L4WholeLessonPackageBuild;
if (p064ProductionScanBuild && (localReferenceDiagnosticBuild || wholeLessonPackageBuild)) {
  throw new Error('The P064 production scan requires an isolated build profile.');
}
if (localReferenceDiagnosticBuild && wholeLessonPackageBuild) {
  throw new Error(
    'The local reference diagnostic build and whole-lesson package builds are mutually exclusive.',
  );
}
if (
  clerkSyntheticBuild
  && (localReferenceDiagnosticBuild || wholeLessonPackageBuild)
) {
  throw new Error(
    'The Clerk synthetic dev build is mutually exclusive with diagnostic and package builds.',
  );
}
const wholeLessonPackageDistDir = g5L4WholeLessonPackageBuild
  ? '.next-g5-l4-package'
  : g4L3WholeLessonPackageV33Build
    ? '.next-g4-l3-package-v3-3'
    : g4L3WholeLessonPackageV32Build
      ? '.next-g4-l3-package-v3-2'
      : g4L3WholeLessonPackageV31Build
        ? '.next-g4-l3-package-v3-1'
        : '.next-g4-l3-package';

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      `connect-src 'self' https://challenges.cloudflare.com${localClerkConnectSources}${process.env.NODE_ENV === 'development' && isG678LocalPreviewEnabled() ? ' http://127.0.0.1:39261' : ''}`,
      "font-src 'self' data:",
      "form-action 'self'",
      "frame-ancestors 'none'",
      `frame-src 'self' https://challenges.cloudflare.com${localClerkFrameSources}`,
      `img-src 'self' data: blob:${localClerkImageSources}`,
      "object-src 'none'",
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval' 'wasm-unsafe-eval'"} https://challenges.cloudflare.com${localClerkScriptSources}`,
      "style-src 'self' 'unsafe-inline'",
      "worker-src 'self' blob:"
    ].join('; ')
  },
  {key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups'},
  // Nova voice input uses the browser's speech-recognition control. HELP Math
  // never receives the audio stream; only the learner-approved transcript is
  // posted to the same-origin Nova route. Device camera access stays blocked.
  {key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()'},
  {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
  {key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload'},
  {key: 'X-Content-Type-Options', value: 'nosniff'},
  {key: 'X-Frame-Options', value: 'DENY'}
];

// Only the opted-in local P053/P054 candidates play hash-checked Blob audio.
// Production and every other page retain the ordinary media fallback policy.
const p054LocalMediaHeaders = securityHeaders.map(header => header.key === 'Content-Security-Policy'
  ? {...header, value: `${header.value}; media-src 'self' blob:`}
  : header);

const embeddedCourseAdapterHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "connect-src 'none'",
      "font-src 'none'",
      "form-action 'none'",
      "frame-ancestors 'self'",
      "img-src 'self' data:",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'"
    ].join('; ')
  },
  {key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups'},
  {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()'},
  {key: 'Referrer-Policy', value: 'no-referrer'},
  {key: 'X-Content-Type-Options', value: 'nosniff'},
  {key: 'X-Frame-Options', value: 'SAMEORIGIN'}
];

const legacyRedirects: NonNullable<NextConfig['redirects']> = async () => [
  {source: '/Home.htm', destination: '/', permanent: true},
  {source: '/About.htm', destination: '/about', permanent: true},
  {source: '/AcademicLanguage.htm', destination: '/approach', permanent: true},
  {source: '/SIOP.htm', destination: '/approach', permanent: true},
  {source: '/Content.htm', destination: '/curriculum', permanent: true},
  {source: '/Standards.htm', destination: '/curriculum', permanent: true},
  {source: '/Evidence.htm', destination: '/research', permanent: true},
  {source: '/Awards.htm', destination: '/research', permanent: true},
  {source: '/Resources.htm', destination: '/resources', permanent: true},
  {source: '/Sales.htm', destination: '/contact', permanent: true},
  {source: '/Trial.htm', destination: '/contact', permanent: true},
  {source: '/Purchasing.htm', destination: '/contact', permanent: true},
  {source: '/Login.htm', destination: '/login', permanent: true},
  {source: '/TechSpecs.htm', destination: '/support', permanent: true}
];

const hfrLocalQaBuild = process.env.HELP_MATH_HFR_LOCAL_QA === '1'
  && process.env.NODE_ENV === 'development' && isG678LocalPreviewEnabled();

assertG678CompiledLocalQaConfiguration();
const g678CompiledLocalQaBuild = isG678CompiledLocalQaEnabled();
if (g678CompiledLocalQaBuild && (wholeLessonPackageBuild || localReferenceDiagnosticBuild ||
    p064ProductionScanBuild || geoP002ProductionScanBuild || geoP002HostProductionScanBuild ||
    l7CurrentProductionScanBuild || algP001ProductionScanBuild || algP003ProductionScanBuild)) {
  throw new Error('G678_COMPILED_QA_REQUIRES_ITS_OWN_BUILD_PROFILE');
}

const nextConfig: NextConfig = {
  // Always define this non-secret compile-time constant. Default/cloud builds
  // keep the private dynamic-import graph removable by the production compiler.
  env: {HELP_MATH_G678_COMPILED_LOCAL_QA: g678CompiledLocalQaBuild ? '1' : '0'},
  ...(g678CompiledLocalQaBuild ? {experimental: {
    cpus: 1,
    webpackMemoryOptimizations: true,
    webpackBuildWorker: true,
    parallelServerCompiles: false,
    parallelServerBuildTraces: false,
    preloadEntriesOnStart: false,
  }} : {}),
  // Keep the learner-facing local preview free of the development badge so
  // screenshot and projector review reflect the actual course surface.
  devIndicators: false,
  distDir: g678CompiledLocalQaBuild ? '.next-g678-compiled-local-qa' : hfrLocalQaBuild ? '.next-g678-hfr-local-qa-20261011-v1' : l10P004LocalQaBuild ? '.next-alg-l10-p004-local-qa-20261008-v1' : clerkSyntheticBuild
    ? CLERK_SYNTHETIC_DIST_DIR
    : l7CurrentLocalQaBuild ? '.next-alg-l07-current-local-qa-20261003-v1'
    : l7CurrentProductionScanBuild ? '.next-alg-l07-current-production-scan-20261003-v1'
    : algP001LocalQaBuild
      ? '.next-alg-p001-local-qa'
    : algP001ProductionScanBuild
      ? '.next-alg-p001-production-scan'
    : algP003ProductionScanBuild
      ? '.next-alg-p003-production-scan-20260925'
    : currentJsCandidateQaBuild
      ? '.next-current-js-candidate-qa'
    : geoP002HostProductionScanBuild
      ? '.next-geo-p002-host-production-scan-20260925'
    : geoP002ProductionScanBuild
      ? '.next-geo-p002-production-scan-20260925'
    : p064ProductionScanBuild
      ? '.next-p064-production-scan'
    : localReferenceDiagnosticBuild
      ? '.next-local-reference-diagnostic'
      : wholeLessonPackageBuild
        ? wholeLessonPackageDistDir
        : '.next',
  output: wholeLessonPackageBuild
    ? 'standalone'
    : undefined,
  outputFileTracingRoot: path.resolve(webDirectory, '../..'),
  outputFileTracingIncludes: {
    '/*': [
      '../../catalog/animations.json',
      '../../catalog/missing-references.json',
      '../../catalog/completion-ledger.json',
      '../../catalog/lesson-releases.json',
      '../../catalog/lesson-release-ledger.json',
      '../../catalog/lessons.json',
      '../../reports/g5-l4-source-scope-freeze.json',
      '../../apps/web/server-assets/flash-assets/courses/**/*.mp3',
    ],
  },
  outputFileTracingExcludes: {
    '*': [
      // The diagnostic page is always 404 in production; do not package its
      // unregistered private renderer or source-glyph exports with the server.
      '../../packages/demos/src/alg-l06-p001-title-view.tsx',
      '../../migrations/shared-alg001-l06-p001/assets/title-svg/*.svg',
      '../../migrations/shared-alg001-l06-p001/assets/source-stream-142.mp3',
      // Production aliases remove these local-only G678 modules from bundles.
      // Keep their exact raw-source closure out of server file tracing as well.
      "../../packages/demos/src/alg-l07-function-question-presentation-v1.tsx",
      "../../packages/demos/src/alg-l07-function-question-session-v1.test.ts",
      "../../packages/demos/src/alg-l07-function-question-session-v1.ts",
      "../../packages/demos/src/alg-l07-game-audio-source-v1.ts",
      "../../packages/demos/src/alg-l07-game-math-v1.tsx",
      "../../packages/demos/src/alg-l07-p003-source-v1.ts",
      "../../packages/demos/src/alg-l07-p006-source-v1.ts",
      "../../packages/demos/src/alg-l07-p007-source-v1.ts",
      "../../packages/demos/src/alg-l07-p009-source-v1.ts",
      "../../packages/demos/src/alg-l07-p010-source-v1.ts",
      "../../packages/demos/src/alg-l07-p011-source-v1.ts",
      "../../packages/demos/src/alg-l07-p012-source-v1.ts",
      "../../packages/demos/src/alg-l07-p013-source-v1.ts",
      "../../packages/demos/src/alg-l07-p014-source-v1.ts",
      "../../packages/demos/src/alg-l07-p015-source-v1.ts",
      "../../packages/demos/src/alg-l07-p016-source-v1.ts",
      "../../packages/demos/src/alg-l07-p017-source-v1.ts",
      "../../packages/demos/src/alg-l07-p018-source-v1.ts",
      "../../packages/demos/src/alg-l07-p019-source-v1.ts",
      "../../packages/demos/src/alg-l07-p020-source-v1.ts",
      "../../packages/demos/src/alg-l07-p021-source-v1.ts",
      "../../packages/demos/src/alg-l07-p022-source-v1.ts",
      "../../packages/demos/src/alg-l07-p023-source-v1.ts",
      "../../packages/demos/src/alg-l07-p025-source-v1.ts",
      "../../packages/demos/src/alg-l07-p026-source-v1.ts",
      "../../packages/demos/src/alg-l07-p027-source-v1.ts",
      "../../packages/demos/src/alg-l07-p030-source-v1.ts",
      "../../packages/demos/src/alg-l07-p031-source-v1.ts",
      "../../packages/demos/src/alg-l07-p032-source-v1.ts",
      "../../packages/demos/src/alg-l07-p033-source-v1.ts",
      "../../packages/demos/src/alg-l07-p034-source-v1.ts",
      "../../packages/demos/src/alg-l07-p036-source-v1.ts",
      "../../packages/demos/src/alg-l07-p037-source-v1.ts",
      "../../packages/demos/src/alg-l07-p038-source-v1.ts",
      "../../packages/demos/src/alg-l07-p039-source-v1.ts",
      "../../packages/demos/src/alg-l07-p040-source-v1.ts",
      "../../packages/demos/src/alg-l07-p041-source-v1.ts",
      "../../packages/demos/src/alg-l07-p042-source-v1.ts",
      "../../packages/demos/src/alg-l07-p043-source-v1.ts",
      "../../packages/demos/src/alg-l07-p044-source-v1.ts",
      "../../packages/demos/src/alg-l07-p045-source-v1.ts",
      "../../packages/demos/src/alg-l07-p046-source-v1.ts",
      "../../packages/demos/src/alg-l07-p047-source-v1.ts",
      "../../packages/demos/src/alg-l07-p048-source-v1.ts",
      "../../packages/demos/src/alg-l07-p049-source-v1.ts",
      "../../packages/demos/src/alg-l07-p050-source-v1.ts",
      "../../packages/demos/src/alg-l07-p058-session-v1.test.ts",
      "../../packages/demos/src/alg-l07-p058-session-v1.ts",
      "../../packages/demos/src/alg-l07-p058-source-v1.ts",
      "../../packages/demos/src/alg-l07-p058-state-v1.test.ts",
      "../../packages/demos/src/alg-l07-p058-state-v1.ts",
      "../../packages/demos/src/alg-l07-p059-source-v1.ts",
      "../../packages/demos/src/alg-l07-p060-source-v1.ts",
      "../../packages/demos/src/alg-l07-p062-session-v1.test.ts",
      "../../packages/demos/src/alg-l07-p062-session-v1.ts",
      "../../packages/demos/src/alg-l08-p009-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p010-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p011-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p012-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p013-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p014-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p015-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p016-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p018-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p019-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p020-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p021-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p022-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p023-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p024-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p026-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p029-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p030-player-v1.tsx",
      "../../packages/demos/src/alg-l10-p004-playback-v1.ts",
      "../../packages/demos/src/alg-l10-p004-playback-v2.ts",
      "../../packages/demos/src/alg-l10-p004-player-v1.css",
      "../../packages/demos/src/alg-l10-p004-player-v1.css.d.ts",
      "../../packages/demos/src/alg-l10-p004-player-v2.tsx",
      "../../packages/demos/src/alg-l10-p004-presentation-v1.tsx",
      "../../packages/demos/src/alg-l10-p004-session-v2.ts",
      "../../packages/demos/src/alg-l10-p004-source-model-v1.ts",
      "../../packages/demos/src/alg-l10-p004-state-v1.ts",
      "../../packages/demos/src/alg-l10-p004-v1.css",
      "../../packages/demos/src/alg-l10-p004-v1.css.d.ts",
      "../../packages/demos/src/generated/alg-l07-p001-source-v1.ts",
      "../../packages/demos/src/generated/alg-l07-p002-source-v1.ts",
      "../../packages/demos/src/generated/alg-l10-p004-source-v1.ts",
      "../../packages/demos/src/modules/shared-alg001-l10-p004.tsx",
      "../../packages/demos/src/source-looping-quiz-player-v1.css",
      "../../packages/demos/src/source-looping-quiz-player-v1.css.d.ts",
      "../../packages/demos/src/source-looping-quiz-player-v1.tsx",
      "../../packages/demos/src/source-looping-quiz-player-v2.tsx",
      "../../packages/demos/src/source-stream-runs-clock-v2.ts",
      "../../packages/demos/src/timelines/shared-alg001-l10-p004.ts",
      "components/g678-alg-l10-p004-host-lesson-v1.tsx",
      "../../packages/demos/src/alg-l08-p038-audio-source-v1.ts",
      "../../packages/demos/src/alg-l08-p038-behavior-source-v1.ts",
      "../../packages/demos/src/alg-l08-p038-frame-v1.ts",
      "../../packages/demos/src/alg-l08-p038-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p038-presentation-source-v1.ts",
      "../../packages/demos/src/alg-l08-p038-presentation-v1.tsx",
      "../../packages/demos/src/alg-l08-p038-session-v1.ts",
      "../../packages/demos/src/alg-l08-p038-state-v1.ts",
      "../../packages/demos/src/alg-l08-p038-v1.css",
      "../../packages/demos/src/alg-l08-p039-controls-v1.tsx",
      "../../packages/demos/src/alg-l08-p039-frame-v1.ts",
      "../../packages/demos/src/alg-l08-p039-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p039-presentation-v1.tsx",
      "../../packages/demos/src/alg-l08-p039-session-v1.ts",
      "../../packages/demos/src/alg-l08-p039-source-v1.ts",
      "../../packages/demos/src/alg-l08-p039-state-v1.ts",
      "../../packages/demos/src/alg-l08-p039-v1.css",
      "../../packages/demos/src/alg-l08-p039-vector-v1.ts",
      "../../packages/demos/src/alg-l08-p046-frame-v2.ts",
      "../../packages/demos/src/alg-l08-p046-player-v2.tsx",
      "../../packages/demos/src/alg-l08-p046-presentation-v2.tsx",
      "../../packages/demos/src/alg-l08-p046-session-v2.ts",
      "../../packages/demos/src/alg-l08-p046-source-v2.ts",
      "../../packages/demos/src/alg-l08-p046-state-v2.ts",
      "../../packages/demos/src/alg-l08-p046-v2.css",
      "../../packages/demos/src/alg-l08-p047-frame-v1.ts",
      "../../packages/demos/src/alg-l08-p047-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p047-presentation-v1.tsx",
      "../../packages/demos/src/alg-l08-p047-session-v1.ts",
      "../../packages/demos/src/alg-l08-p047-source-v1.ts",
      "../../packages/demos/src/alg-l08-p047-state-v1.ts",
      "../../packages/demos/src/alg-l08-p047-v1.css",
      "../../packages/demos/src/alg-l08-p048-frame-v1.ts",
      "../../packages/demos/src/alg-l08-p048-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p048-presentation-v1.tsx",
      "../../packages/demos/src/alg-l08-p048-session-v1.ts",
      "../../packages/demos/src/alg-l08-p048-source-v1.ts",
      "../../packages/demos/src/alg-l08-p048-state-v1.ts",
      "../../packages/demos/src/alg-l08-p048-v1.css",
      "../../packages/demos/src/modules/shared-alg001-l08-p038.tsx",
      "../../packages/demos/src/modules/shared-alg001-l08-p039.tsx",
      "../../packages/demos/src/modules/shared-alg001-l08-p046.tsx",
      "../../packages/demos/src/modules/shared-alg001-l08-p047.tsx",
      "../../packages/demos/src/modules/shared-alg001-l08-p048.tsx",
      "../../packages/demos/src/timelines/shared-alg001-l08-p038.ts",
      "../../packages/demos/src/timelines/shared-alg001-l08-p039.ts",
      "../../packages/demos/src/timelines/shared-alg001-l08-p046.ts",
      "../../packages/demos/src/timelines/shared-alg001-l08-p047.ts",
      "../../packages/demos/src/timelines/shared-alg001-l08-p048.ts",
      "../../packages/demos/src/alg-l08-p040-css.d.ts",
      "../../packages/demos/src/alg-l08-p040-frame-v1.tsx",
      "../../packages/demos/src/alg-l08-p040-game-config-v1.ts",
      "../../packages/demos/src/alg-l08-p040-game-state-v2.ts",
      "../../packages/demos/src/alg-l08-p040-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p040-presentation-v1.tsx",
      "../../packages/demos/src/alg-l08-p040-session-v1.ts",
      "../../packages/demos/src/alg-l08-p040-source-v1.ts",
      "../../packages/demos/src/alg-l08-p040-state-v1.ts",
      "../../packages/demos/src/alg-l08-p040-v1.css",
      "../../packages/demos/src/alg-l08-p050-frame-v1.ts",
      "../../packages/demos/src/alg-l08-p050-option-readings-v1.ts",
      "../../packages/demos/src/alg-l08-p050-player-v1.tsx",
      "../../packages/demos/src/alg-l08-p050-presentation-v1.tsx",
      "../../packages/demos/src/alg-l08-p050-quiz-state-v1.ts",
      "../../packages/demos/src/alg-l08-p050-renderer-v1.tsx",
      "../../packages/demos/src/alg-l08-p050-session-v1.ts",
      "../../packages/demos/src/alg-l08-p050-source-v1.ts",
      "../../packages/demos/src/alg-l08-p050-v1.css",
      "../../packages/demos/src/alg-l08-p050-v1.css.d.ts",
      "../../packages/demos/src/modules/shared-alg001-l08-p040.tsx",
      "../../packages/demos/src/modules/shared-alg001-l08-p050.tsx",
      "../../packages/demos/src/timelines/shared-alg001-l08-p040.ts",
      "../../packages/demos/src/timelines/shared-alg001-l08-p050.ts",
      ...(wholeLessonPackageBuild ? [
        '../../artifacts/**/*',
        '../../migrations/**/*',
        '../../private-archive/**/*',
        '../../source-assets/**/*',
      ] : []),
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@helpmath/demos'],
  turbopack: {
    resolveAlias: {
      ...(process.env.NODE_ENV === 'production' ? {
        ...Object.fromEntries(localPageProductionReplacements.flatMap(([name,stub])=>[[`@/lib/${name}`,path.join(webDirectory,'lib',stub)],[path.join(webDirectory,'lib',`${name}.ts`),path.join(webDirectory,'lib',stub)]])),
        ...(!g678CompiledLocalQaBuild ? {
          [g678LocalOnlyRegistrySpecifier]: g678LocalOnlyRegistryProductionStub,
          [g678LocalOnlyRegistryMetadataSpecifier]: g678LocalOnlyRegistryProductionStub,
        } : {}),
      } : {}),
      [p064LocalCandidateSpecifier]: isG678LocalPreviewEnabled()
        ? p064LocalCandidateSource : p064LocalCandidateProductionStub,
      [algP001LocalCandidateSpecifier]: isG678LocalPreviewEnabled()
        ? algP001LocalCandidateSource : algP001LocalCandidateProductionStub,
      [p054LocalCandidateSpecifier]: isG678LocalPreviewEnabled()
        ? p054LocalCandidateSource : p054LocalCandidateProductionStub,
      [geoP002LocalCandidateSpecifier]: isG678LocalPreviewEnabled()
        ? geoP002LocalCandidateSource : geoP002LocalCandidateProductionStub,
      [datP002LocalCandidateSpecifier]: isG678LocalPreviewEnabled()
        ? datP002LocalCandidateSource : datP002LocalCandidateProductionStub,
      [geoP002HostRuntimeSpecifier]: isG678LocalPreviewEnabled()
        ? geoP002HostRuntimeSource : geoP002HostRuntimeProductionStub,
      [l10P004HostSpecifier]: isG678LocalPreviewEnabled()?l10P004HostSource:l10P004HostProductionStub,
      [l8CurrentHostSpecifier]: isG678LocalPreviewEnabled()?l8CurrentHostSource:l8CurrentHostProductionStub,
      [l8P001HostSpecifier]: isG678LocalPreviewEnabled()?l8P001HostSource:l8P001HostProductionStub,
      [l7CurrentHostSpecifier]: isG678LocalPreviewEnabled()?l7CurrentHostSource:l7CurrentHostProductionStub,
      [p001HostSpecifier]: isG678LocalPreviewEnabled()
        ? p001HostSource : p001HostProductionStub,
      [p060HostSpecifier]: isG678LocalPreviewEnabled()
        ? p060HostSource : p060HostProductionStub,
      [p058HostSpecifier]: isG678LocalPreviewEnabled()
        ? p058HostSource : p058HostProductionStub,
      [p057HostSpecifier]: isG678LocalPreviewEnabled()
        ? p057HostSource : p057HostProductionStub,
      [p056HostSpecifier]: isG678LocalPreviewEnabled()
        ? p056HostSource : p056HostProductionStub,
      [p033HostSpecifier]: isG678LocalPreviewEnabled()
        ? p033HostSource : p033HostProductionStub,
      [p050HostSpecifier]: isG678LocalPreviewEnabled()
        ? p050HostSource : p050HostProductionStub,
      [p049HostSpecifier]: isG678LocalPreviewEnabled()
        ? p049HostSource : p049HostProductionStub,
      [p048HostSpecifier]: isG678LocalPreviewEnabled()
        ? p048HostSource : p048HostProductionStub,
      [p047HostSpecifier]: isG678LocalPreviewEnabled()
        ? p047HostSource : p047HostProductionStub,
      [p046HostSpecifier]: isG678LocalPreviewEnabled()
        ? p046HostSource : p046HostProductionStub,
      [p045HostSpecifier]: isG678LocalPreviewEnabled()
        ? p045HostSource : p045HostProductionStub,
      [p044HostSpecifier]: isG678LocalPreviewEnabled()
        ? p044HostSource : p044HostProductionStub,
      [p043HostSpecifier]: isG678LocalPreviewEnabled()
        ? p043HostSource : p043HostProductionStub,
      [p042HostSpecifier]: isG678LocalPreviewEnabled()
        ? p042HostSource : p042HostProductionStub,
      [p041HostSpecifier]: isG678LocalPreviewEnabled()
        ? p041HostSource : p041HostProductionStub,
      [algP003HostRuntimeSpecifier]: isG678LocalPreviewEnabled()
        ? algP003HostRuntimeSource : algP003HostRuntimeProductionStub,
      [algL12P005HostSpecifier]: isG678LocalPreviewEnabled()
        ? algL12P005HostSource : algL12P005HostProductionStub,
      [algL12P006HostSpecifier]: isG678LocalPreviewEnabled()
        ? algL12P006HostSource : algL12P006HostProductionStub,
      [algL12P009HostSpecifier]: isG678LocalPreviewEnabled()
        ? algL12P009HostSource : algL12P009HostProductionStub,
      ...(process.env.NODE_ENV === 'production' ? {
        ...Object.fromEntries(localPageProductionReplacements.flatMap(([name,stub])=>[[`@/lib/${name}`,path.join(webDirectory,'lib',stub)],[path.join(webDirectory,'lib',`${name}.ts`),path.join(webDirectory,'lib',stub)]])),
        [p064QuestionAudioSpecifier]: p064QuestionAudioProductionStub,
        '@/lib/alg-l06-p010-lesson-canvas-request-v1': p010LessonCanvasProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p010-lesson-canvas-request-v1.ts')]: p010LessonCanvasProductionStub,
        '@/lib/alg-l07-p001-local-request-v1': p001RequestProductionStub,
        '@/lib/alg-l07-p001-resources-v1.server': p001ResourcesProductionStub,
        '@/lib/alg-l06-p060-local-request-v1': p060RequestProductionStub,
        '@/lib/alg-l06-p058-local-request-v1': p058RequestProductionStub,
        '@/lib/alg-l06-p057-local-request-v1': p057RequestProductionStub,
        '@/lib/alg-l06-p056-local-request-v1': p056RequestProductionStub,
        '@/lib/alg-l06-p033-local-request-v1': p033RequestProductionStub,
        '@/lib/alg-l06-p050-local-request-v1': p050RequestProductionStub,
        '@/lib/alg-l06-p049-local-request-v1': p049RequestProductionStub,
        '@/lib/alg-l06-p048-local-request-v1': p048RequestProductionStub,
        '@/lib/alg-l06-p047-local-request-v1': p047RequestProductionStub,
        '@/lib/alg-l06-p046-local-request-v1': p046RequestProductionStub,
        '@/lib/alg-l06-p045-local-request-v1': p045RequestProductionStub,
        '@/lib/alg-l06-p044-local-request-v1': p044RequestProductionStub,
        '@/lib/alg-l06-p043-local-request-v1': p043RequestProductionStub,
        '@/lib/alg-l06-p042-local-request-v1': p042RequestProductionStub,
        '@/lib/alg-l06-p041-local-request-v1': p041RequestProductionStub,
        '@/lib/alg-l06-p038-local-request-v1': p038RequestProductionStub,
        '@/lib/alg-l06-p035-local-request-v1': p035RequestProductionStub,
        '@/lib/alg-l06-p034-local-request-v1': p034RequestProductionStub,
        '@/lib/alg-l06-p032-local-request-v1': p032RequestProductionStub,
        '@/lib/alg-l06-p028-local-request-v1': p028RequestProductionStub,
        '@/lib/alg-l06-p027-local-request-v1': p027RequestProductionStub,
        '@/lib/alg-l06-p026-local-request-v1': p026RequestProductionStub,
        '@/lib/alg-l06-p025-local-request-v1': p025RequestProductionStub,
        '@/lib/alg-l06-p024-local-request-v1': p024RequestProductionStub,
        '@/lib/alg-l06-p023-local-request-v1': p023RequestProductionStub,
        '@/lib/alg-l06-p022-local-request-v1': p022RequestProductionStub,
        '@/lib/alg-l06-p021-local-request-v1': p021RequestProductionStub,
        '@/lib/alg-l06-p020-local-request-v1': p020RequestProductionStub,
        '@/lib/alg-l06-p019-local-request-v1': p019RequestProductionStub,
        '@/lib/alg-l06-p018-local-request-v1': p018RequestProductionStub,
        '@/lib/alg-l06-p017-local-request-v1': p017RequestProductionStub,
        '@/lib/alg-l06-p016-local-request-v1': p016RequestProductionStub,
        '@/lib/alg-l06-p015-local-request-v1': p015RequestProductionStub,
        '@/lib/alg-l06-p014-local-request-v1': p014RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l07-p001-local-request-v1.ts')]: p001RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l07-p001-resources-v1.server.ts')]: p001ResourcesProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p060-local-request-v1.ts')]: p060RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p058-local-request-v1.ts')]: p058RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p057-local-request-v1.ts')]: p057RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p056-local-request-v1.ts')]: p056RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p033-local-request-v1.ts')]: p033RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p050-local-request-v1.ts')]: p050RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p049-local-request-v1.ts')]: p049RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p048-local-request-v1.ts')]: p048RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p047-local-request-v1.ts')]: p047RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p046-local-request-v1.ts')]: p046RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p045-local-request-v1.ts')]: p045RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p044-local-request-v1.ts')]: p044RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p043-local-request-v1.ts')]: p043RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p042-local-request-v1.ts')]: p042RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p041-local-request-v1.ts')]: p041RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p038-local-request-v1.ts')]: p038RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p035-local-request-v1.ts')]: p035RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p034-local-request-v1.ts')]: p034RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p032-local-request-v1.ts')]: p032RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p028-local-request-v1.ts')]: p028RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p027-local-request-v1.ts')]: p027RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p026-local-request-v1.ts')]: p026RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p025-local-request-v1.ts')]: p025RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p024-local-request-v1.ts')]: p024RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p023-local-request-v1.ts')]: p023RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p022-local-request-v1.ts')]: p022RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p021-local-request-v1.ts')]: p021RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p020-local-request-v1.ts')]: p020RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p019-local-request-v1.ts')]: p019RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p018-local-request-v1.ts')]: p018RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p017-local-request-v1.ts')]: p017RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p016-local-request-v1.ts')]: p016RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p015-local-request-v1.ts')]: p015RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p014-local-request-v1.ts')]: p014RequestProductionStub,
        '@/lib/alg-l06-p013-local-request-v1': p013RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p013-local-request-v1.ts')]: p013RequestProductionStub,
        '@/lib/alg-l06-p010-local-request-v1': p010RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p010-local-request-v1.ts')]: p010RequestProductionStub,
        '@/lib/alg-l06-p010-predecessor-request-v1': p010PredecessorProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p010-predecessor-request-v1.ts')]: p010PredecessorProductionStub,
        '@/lib/alg-l06-p008-local-request-v1': p008RequestProductionStub,
        [path.join(webDirectory, 'lib/alg-l06-p008-local-request-v1.ts')]: p008RequestProductionStub,
      } : {}),
    },
  },
  webpack(config, {dev, webpack, isServer}) {
    if (g678CompiledLocalQaBuild) {
      // No development lazy-compilation backend, extra cache, or expanded header limit.
      config.cache = false;
    }
    // HFR QA keeps executable eval content and mappings, without duplicating sources.
    if (dev && isG678LocalPreviewEnabled() && process.env.HELP_MATH_HFR_LOCAL_QA === '1') {
      const NextEvalSourceMapDevToolPlugin = createRequire(import.meta.url)(
        'next/dist/build/webpack/plugins/eval-source-map-dev-tool-plugin',
      ).default;
      const evalSourceMapPlugins = (config.plugins ?? []).filter(
        (plugin: unknown) => plugin instanceof NextEvalSourceMapDevToolPlugin,
      );
      if (evalSourceMapPlugins.length !== 1) {
        throw new Error('HFR_QA_EXPECTED_ONE_NEXT_EVAL_SOURCE_MAP_PLUGIN');
      }
      Object.assign(evalSourceMapPlugins[0]!.options, {noSources: true});
    }
    // The loopback migration host compiles large source-bound lesson graphs.
    // Avoid an additional Webpack memory cache alongside Next's dev cache.
    // Keep the existing heap limit and memory-restart protection unchanged.
    // Production and other build profiles retain Next's cache policy.
    if (dev && isG678LocalPreviewEnabled()) {
      config.cache = false;
    }
    // Next16's installed browser baseline supports async functions, while its
    // webpack runtime target remains web/es6. Declare that one capability for
    // the opted-in loopback client only; do not alter server/Edge/production.
    if (dev && isServer === false && isG678LocalPreviewEnabled()) {
      config.output ??= {};
      config.output.environment = {
        ...(config.output.environment ?? {}),
        asyncFunction: true,
      };
      // This client compiler is marked as a Node target, so Webpack would
      // load the Node lazy-compilation client in the browser and the page
      // module never resolves. Keep the browser EventSource client.
      config.externalsPresets = {...(config.externalsPresets ?? {}), node: false};
      // The review route names every page module. Compiling that whole graph
      // on the first request exhausts memory and the OS kills the dev server.
      // Defer only those page modules. The lesson client entry stays eager so
      // it remains in the React Client Manifest.
      config.experiments ??= {};
      const previousLazyCompilation = config.experiments.lazyCompilation;
      config.experiments.lazyCompilation = {
        ...(typeof previousLazyCompilation === 'object' && previousLazyCompilation
          ? previousLazyCompilation
          : {}),
        backend: {
          listen: {host: '127.0.0.1', port: 39261},
          // One lesson joins its loaded module identifiers in the EventSource
          // request path. Keep this bound only on the opted-in loopback backend.
          server: {maxHeaderSize: 256 * 1024},
        },
        entries: false,
        imports: true,
        test(module: {nameForCondition?: () => string | null | undefined}) {
          const name = module.nameForCondition?.() ?? '';
          return name.includes(`${path.sep}packages${path.sep}demos${path.sep}src${path.sep}modules${path.sep}`)
            || name.includes(`${path.sep}packages${path.sep}demos${path.sep}src${path.sep}hfr-pages${path.sep}`)
            // The maintained ALG adapter table uses dynamic imports as well.
            // Keep the course entry eager; compile only the selected adapter.
            || (name.includes(`${path.sep}apps${path.sep}web${path.sep}components${path.sep}`)
              && /^g678-alg-l06-p\d{3}-(?:continuous-)?runtime-v\d+\.tsx$/.test(path.basename(name)));
        },
      };
    }
    if (dev && g678LocalPreviewDemosSourceRoot) {
      config.resolve ??= {};
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        [g678LocalOnlyRegistrySpecifier]: path.join(
          g678LocalPreviewDemosSourceRoot,
          'local-only-animation-registry.ts',
        ),
        [g678LocalOnlyRegistryMetadataSpecifier]: path.join(
          g678LocalPreviewDemosSourceRoot,
          'local-only-animation-registry-metadata.ts',
        ),
      };
    }
    if (!dev) {
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(/(?:@\/components\/g678-alg-l10-p004-host-lesson-v1|apps[\\/]web[\\/]components[\\/]g678-alg-l10-p004-host-lesson-v1\.tsx)$/u,l10P004HostProductionStub));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(/(?:@\/components\/g678-alg-l08-current-host-lesson-v1|apps[\\/]web[\\/]components[\\/]g678-alg-l08-current-host-lesson-v1\.tsx)$/u,l8CurrentHostProductionStub));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(/(?:@\/components\/g678-alg-l08-p001-host-lesson-v1|apps[\\/]web[\\/]components[\\/]g678-alg-l08-p001-host-lesson-v1\.tsx)$/u,l8P001HostProductionStub));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(/(?:@\/components\/g678-alg-l07-current-host-lesson-v1|apps[\\/]web[\\/]components[\\/]g678-alg-l07-current-host-lesson-v1\.tsx)$/u,l7CurrentHostProductionStub));
      for(const [name,stub] of localPageProductionReplacements)config.plugins.push(new webpack.NormalModuleReplacementPlugin(new RegExp(`(?:^|[\\\\/])${name.replaceAll('.','\\.')}(?:\\.ts)?$`,'u'),path.join(webDirectory,'lib',stub)));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l07-p001-host-lesson-v1|apps[\\/]web[\\/]components[\\/]g678-alg-l07-p001-host-lesson-v1\.tsx)$/u,
        p001HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l06-p060-host-lesson-v1|apps[\\/]web[\\/]components[\\/]g678-alg-l06-p060-host-lesson-v1\.tsx)$/u,
        p060HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l06-p058-host-lesson-v1|apps[\\/]web[\\/]components[\\/]g678-alg-l06-p058-host-lesson-v1\.tsx)$/u,
        p058HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l06-p057-host-lesson-v1|apps[\\/]web[\\/]components[\\/]g678-alg-l06-p057-host-lesson-v1\.tsx)$/u,
        p057HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l06-p056-host-lesson-v1|apps[\\/]web[\\/]components[\\/]g678-alg-l06-p056-host-lesson-v1\.tsx)$/u,
        p056HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l06-p033-host-lesson-v1|apps[\\/]web[\\/]components[\\/]g678-alg-l06-p033-host-lesson-v1\.tsx)$/u,
        p033HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l06-p050-host-lesson-v1|apps[\\/]web[\\/]components[\\/]g678-alg-l06-p050-host-lesson-v1\.tsx)$/u,
        p050HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l06-p049-host-lesson-v1|apps[\\/]web[\\/]components[\\/]g678-alg-l06-p049-host-lesson-v1\.tsx)$/u,
        p049HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l06-p048-host-lesson-v1|apps[\\/]web[\\/]components[\\/]g678-alg-l06-p048-host-lesson-v1\.tsx)$/u,
        p048HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l06-p047-host-lesson-v1|apps[\\/]web[\\/]components[\\/]g678-alg-l06-p047-host-lesson-v1\.tsx)$/u,
        p047HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l06-p046-host-lesson-v1|apps[\\/]web[\\/]components[\\/]g678-alg-l06-p046-host-lesson-v1\.tsx)$/u,
        p046HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l07-p001-local-request-v1(?:\.ts)?$/u,
        p001RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l07-p001-resources-v1\.server(?:\.ts)?$/u,
        p001ResourcesProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p060-local-request-v1(?:\.ts)?$/u,
        p060RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p058-local-request-v1(?:\.ts)?$/u,
        p058RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p057-local-request-v1(?:\.ts)?$/u,
        p057RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p056-local-request-v1(?:\.ts)?$/u,
        p056RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p033-local-request-v1(?:\.ts)?$/u,
        p033RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p050-local-request-v1(?:\.ts)?$/u,
        p050RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p049-local-request-v1(?:\.ts)?$/u,
        p049RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p048-local-request-v1(?:\.ts)?$/u,
        p048RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p047-local-request-v1(?:\.ts)?$/u,
        p047RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p046-local-request-v1(?:\.ts)?$/u,
        p046RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l06-p045-host-lesson-v1|apps[\\/]web[\\/]components[\\/]g678-alg-l06-p045-host-lesson-v1\.tsx)$/u,
        p045HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p045-local-request-v1(?:\.ts)?$/u,
        p045RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l06-p044-host-lesson-v1|apps[\\/]web[\\/]components[\\/]g678-alg-l06-p044-host-lesson-v1\.tsx)$/u,
        p044HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p044-local-request-v1(?:\.ts)?$/u,
        p044RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l06-p043-host-lesson-v1|apps[\\/]web[\\/]components[\\/]g678-alg-l06-p043-host-lesson-v1\.tsx)$/u,
        p043HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p043-local-request-v1(?:\.ts)?$/u,
        p043RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l06-p042-host-lesson-v1|apps[\\/]web[\\/]components[\\/]g678-alg-l06-p042-host-lesson-v1\.tsx)$/u,
        p042HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p042-local-request-v1(?:\.ts)?$/u,
        p042RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l06-p041-host-lesson-v1|apps[\\/]web[\\/]components[\\/]g678-alg-l06-p041-host-lesson-v1\.tsx)$/u,
        p041HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p041-local-request-v1(?:\.ts)?$/u,
        p041RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p038-local-request-v1(?:\.ts)?$/u,
        p038RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p035-local-request-v1(?:\.ts)?$/u,
        p035RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p034-local-request-v1(?:\.ts)?$/u,
        p034RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p032-local-request-v1(?:\.ts)?$/u,
        p032RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p028-local-request-v1(?:\.ts)?$/u,
        p028RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p027-local-request-v1(?:\.ts)?$/u,
        p027RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p026-local-request-v1(?:\.ts)?$/u,
        p026RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p025-local-request-v1(?:\.ts)?$/u,
        p025RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p024-local-request-v1(?:\.ts)?$/u,
        p024RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p023-local-request-v1(?:\.ts)?$/u,
        p023RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p022-local-request-v1(?:\.ts)?$/u,
        p022RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p021-local-request-v1(?:\.ts)?$/u,
        p021RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p020-local-request-v1(?:\.ts)?$/u,
        p020RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p019-local-request-v1(?:\.ts)?$/u,
        p019RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p018-local-request-v1(?:\.ts)?$/u,
        p018RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p017-local-request-v1(?:\.ts)?$/u,
        p017RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p016-local-request-v1(?:\.ts)?$/u,
        p016RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p015-local-request-v1(?:\.ts)?$/u,
        p015RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p014-local-request-v1(?:\.ts)?$/u,
        p014RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p013-local-request-v1(?:\.ts)?$/u,
        p013RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p010-lesson-canvas-request-v1(?:\.ts)?$/u,
        p010LessonCanvasProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p010-local-request-v1(?:\.ts)?$/u,
        p010RequestProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p010-predecessor-request-v1(?:\.ts)?$/u,
        p010PredecessorProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:^|[\\/])alg-l06-p008-local-request-v1(?:\.ts)?$/u,
        p008RequestProductionStub,
      ));
      config.resolve ??= {};
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        ...(!g678CompiledLocalQaBuild ? {
          [g678LocalOnlyRegistrySpecifier]: g678LocalOnlyRegistryProductionStub,
          [g678LocalOnlyRegistryMetadataSpecifier]: g678LocalOnlyRegistryProductionStub,
        } : {}),
      };
      if (!g678CompiledLocalQaBuild) config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@helpmath\/demos\/local-only-animation-registry(?:-metadata)?|packages[\\/]demos[\\/]src[\\/]local-only-animation-registry(?:-metadata)?\.ts)$/u,
        g678LocalOnlyRegistryProductionStub,
      ));
    }
    config.resolve ??= {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      [p064LocalCandidateSpecifier]: dev && isG678LocalPreviewEnabled()
        ? p064LocalCandidateSource : p064LocalCandidateProductionStub,
      [algP001LocalCandidateSpecifier]: dev && isG678LocalPreviewEnabled()
        ? algP001LocalCandidateSource : algP001LocalCandidateProductionStub,
      [p054LocalCandidateSpecifier]: dev && isG678LocalPreviewEnabled()
        ? p054LocalCandidateSource : p054LocalCandidateProductionStub,
      [geoP002LocalCandidateSpecifier]: dev && isG678LocalPreviewEnabled()
        ? geoP002LocalCandidateSource : geoP002LocalCandidateProductionStub,
      [datP002LocalCandidateSpecifier]: dev && isG678LocalPreviewEnabled()
        ? datP002LocalCandidateSource : datP002LocalCandidateProductionStub,
      [geoP002HostRuntimeSpecifier]: dev && isG678LocalPreviewEnabled()
        ? geoP002HostRuntimeSource : geoP002HostRuntimeProductionStub,
      [algP003HostRuntimeSpecifier]: dev && isG678LocalPreviewEnabled()
        ? algP003HostRuntimeSource : algP003HostRuntimeProductionStub,
      [algL12P005HostSpecifier]: dev && isG678LocalPreviewEnabled()
        ? algL12P005HostSource : algL12P005HostProductionStub,
      [algL12P006HostSpecifier]: dev && isG678LocalPreviewEnabled()
        ? algL12P006HostSource : algL12P006HostProductionStub,
      [l10P004HostSpecifier]: dev && isG678LocalPreviewEnabled()
        ? l10P004HostSource : l10P004HostProductionStub,
      [algL12P009HostSpecifier]: dev && isG678LocalPreviewEnabled()
        ? algL12P009HostSource : algL12P009HostProductionStub,
    };
    if (!dev) {
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l12-p009-host-lesson|apps[\\/]web[\\/]components[\\/]g678-alg-l12-p009-host-lesson\.tsx)$/u,
        algL12P009HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l12-p006-host-lesson|apps[\\/]web[\\/]components[\\/]g678-alg-l12-p006-host-lesson\.tsx)$/u,
        algL12P006HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l12-p005-host-lesson|apps[\\/]web[\\/]components[\\/]g678-alg-l12-p005-host-lesson\.tsx)$/u,
        algL12P005HostProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@helpmath\/demos\/nms-l02-p064-local-candidate|packages[\\/]demos[\\/]src[\\/]nms-l02-p064-quiz-candidate\.tsx)$/u,
        p064LocalCandidateProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@helpmath\/demos\/alg-l06-p001-local-candidate|packages[\\/]demos[\\/]src[\\/]alg-l06-p001-title-view\.tsx)$/u,
        algP001LocalCandidateProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@helpmath\/demos\/nms-l02-p054-local-candidate|packages[\\/]demos[\\/]src[\\/]nms-l02-p054-board-candidate\.tsx)$/u,
        p054LocalCandidateProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@helpmath\/demos\/geo-l06-p002-local-candidate|packages[\\/]demos[\\/]src[\\/]geo-l06-p002-local-candidate\.tsx)$/u,
        geoP002LocalCandidateProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@helpmath\/demos\/dat-l02-p002-local-candidate|packages[\\/]demos[\\/]src[\\/]dat-l02-p002-candidate-renderer-v1\.tsx)$/u,
        datP002LocalCandidateProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-geo-l06-p002-runtime|apps[\\/]web[\\/]components[\\/]g678-geo-l06-p002-runtime\.tsx)$/u,
        geoP002HostRuntimeProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/components\/g678-alg-l06-p003-host-runtime|apps[\\/]web[\\/]components[\\/]g678-alg-l06-p003-host-runtime\.tsx)$/u,
        algP003HostRuntimeProductionStub,
      ));
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(
        /(?:@\/lib\/nms-l02-p064-question-audio-response|apps[\\/]web[\\/]lib[\\/]nms-l02-p064-question-audio-response\.ts)$/u,
        p064QuestionAudioProductionStub,
      ));
    }
    return config;
  },
  async rewrites() {
    const l10P004Has=[{type:'header' as const,key:'referer',value:'http://127[.]0[.]0[.]1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l10-p004/(?:candidate-v1|registered-v1)(?:[?]mode=focus)?'}];
    // P053's modern lesson embeds the sealed P054 game. Keep its client URLs
    // intact while routing only the exact local P053 document to new guards.
    const has = [{type: 'header' as const, key: 'referer',
      value: 'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-nms002-l02-p053'}];
    const p004Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p004/(?:candidate-v1|continuous-v1)'}];
    const p008Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p008/(?:candidate-v1|continuous-v1)'}];
    const p010Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p010/(?:candidate-v1|continuous-v1)(?:\\?mode=focus)?'}];
    const p041Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p041/candidate-v1(?:\\?mode=focus)?'}];
    const p042Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p042/candidate-v1(?:\\?mode=focus)?'}];
    const p043Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p043/candidate-v1(?:\\?mode=focus)?'}];
    const p001Has = [{type:'header' as const,key:'referer',
      value:'http://127[.]0[.]0[.]1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l07-p001/candidate-v1(?:[?]mode=focus)?'}];
    const p001RegisteredHas = [{type:'header' as const,key:'referer',
      value:'http://127[.]0[.]0[.]1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l07-p001/registered-v1(?:[?]mode=focus)?'}];
    const p060Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p060/candidate-v1(?:\\?mode=focus)?'}];
    const p058Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p058/candidate-v1(?:\\?mode=focus)?'}];
    const p057Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p057/candidate-v1(?:\\?mode=focus)?'}];
    const p056Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p056/candidate-v1(?:\\?mode=focus)?'}];
    const p033Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p033/candidate-v1(?:\\?mode=focus)?'}];
    const p050Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p050/candidate-v1(?:\\?mode=focus)?'}];
    const p049Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p049/candidate-v1(?:\\?mode=focus)?'}];
    const p048Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p048/candidate-v1(?:\\?mode=focus)?'}];
    const p047Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p047/candidate-v1(?:\\?mode=focus)?'}];
    const p046Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p046/candidate-v1(?:\\?mode=focus)?'}];
    const p045Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p045/candidate-v1(?:\\?mode=focus)?'}];
    const p060RegisteredHas = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p060/registered-v1(?:\\?mode=focus)?'}];
    const p058RegisteredHas = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p058/registered-v1(?:\\?mode=focus)?'}];
    const p057RegisteredHas = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p057/registered-v1(?:\\?mode=focus)?'}];
    const p056RegisteredHas = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p056/registered-v1(?:\\?mode=focus)?'}];
    const p033RegisteredHas = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p033/registered-v1(?:\\?mode=focus)?'}];
    const p050RegisteredHas = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p050/registered-v1(?:\\?mode=focus)?'}];
    const p049RegisteredHas = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p049/registered-v1(?:\\?mode=focus)?'}];
    const p048RegisteredHas = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p048/registered-v1(?:\\?mode=focus)?'}];
    const p047RegisteredHas = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p047/registered-v1(?:\\?mode=focus)?'}];
    const p046RegisteredHas = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p046/registered-v1(?:\\?mode=focus)?'}];
    const p045RegisteredHas = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p045/registered-v1(?:\\?mode=focus)?'}];
    const p044Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p044/candidate-v1(?:\\?mode=focus)?'}];
    const p044RegisteredHas = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p044/registered-v1(?:\\?mode=focus)?'}];
    const p038Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p038/candidate-v1(?:\\?mode=focus)?'}];
    const p035Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p035/(?:candidate-v1|continuous-v1)(?:\\?mode=focus)?'}];
    const p034Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p034/(?:candidate-v1|continuous-v1)(?:\\?mode=focus)?'}];
    const p032Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p032/(?:candidate-v1|continuous-v1)(?:\\?mode=focus)?'}];
    const p028Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p028/(?:candidate-v1|continuous-v1)(?:\\?mode=focus)?'}];
    const p027Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p027/(?:candidate-v1|continuous-v1)(?:\\?mode=focus)?'}];
    const p026Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p026/(?:candidate-v1|continuous-v1)(?:\\?mode=focus)?'}];
    const p025Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p025/(?:candidate-v1|continuous-v1)(?:\\?mode=focus)?'}];
    const p024Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p024/(?:candidate-v1|continuous-v1)(?:\\?mode=focus)?'}];
    const p023Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p023/(?:candidate-v1|continuous-v1)(?:\\?mode=focus)?'}];
    const p022Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p022/(?:candidate-v1|continuous-v1)(?:\\?mode=focus)?'}];
    const p021Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p021/(?:candidate-v1|continuous-v1)(?:\\?mode=focus)?'}];
    const p020Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p020/(?:candidate-v1|continuous-v1)(?:\\?mode=focus)?'}];
    const p019Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p019/(?:candidate-v1|continuous-v1)(?:\\?mode=focus)?'}];
    const p018Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p018/(?:candidate-v1|continuous-v1)(?:\\?mode=focus)?'}];
    const p017Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p017/(?:candidate-v1|continuous-v1)(?:\\?mode=focus)?'}];
    const p016Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p016/(?:candidate-v1|continuous-v1)(?:\\?mode=focus)?'}];
    const p015Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p015/(?:candidate-v1|continuous-v1)(?:\\?mode=focus)?'}];
    const p014Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p014/(?:candidate-v1|continuous-v1)(?:\\?mode=focus)?'}];
    const p013Has = [{type:'header' as const,key:'referer',
      value:'http://127\\.0\\.0\\.1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l06-p013/(?:candidate-v1|continuous-v1)(?:\\?mode=focus)?'}];
    const l7CurrentHas=(mode:'candidate'|'registered')=>[{type:'header' as const,key:'referer',value:`http://127[.]0[.]0[.]1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l07-p0(?:0[123679]|1[0123456789]|2[0123567]|3[012346789]|4[0123456789]|5[01289]|6[02])/${mode}-v1(?:[?]mode=focus)?`}];
    const l8CurrentHas=(mode:'candidate'|'registered')=>[{type:'header' as const,key:'referer',value:`http://127[.]0[.]0[.]1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l08-p0(?:0[15679]|1[012345689]|2[012346789]|3[0123456789]|4[0678]|50)/${mode}-v1(?:[?]mode=focus)?`}];
    const l8Has=[{type:'header' as const,key:'referer',value:'http://127[.]0[.]0[.]1:3331/(?:en|es)/migration-status/g678-calibration/shared-alg001-l08-p001/(?:candidate-v1|registered-v1)(?:[?]mode=focus)?'}];
    return {beforeFiles: isG678LocalPreviewEnabled() ? [
      ...Object.values(L10_LESSON_CANVAS_RESOURCES).map(pin=>({source:pin.originalPath,has:l10P004Has,destination:pin.bridgePath})),
      ...(['candidate','registered'] as const).flatMap(mode=>Object.entries(L8_CURRENT_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,has:l8CurrentHas(mode),destination:`/flash-assets/g678-local/alg-l08-current-${mode}/${token}`}))),
      ...Object.values(L8_LESSON_CANVAS_RESOURCES).map(pin=>({source:pin.originalPath,has:l8Has,destination:pin.bridgePath})),
      ...(['candidate','registered'] as const).flatMap(mode=>Object.entries(L7_CURRENT_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,has:l7CurrentHas(mode),destination:`/flash-assets/g678-local/alg-l07-current-${mode}/${token}`}))),
      ...Object.entries(P001_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p001RegisteredHas,destination:`/flash-assets/g678-local/shared-alg001-l07-p001-registered/${token}`})),
      ...Object.entries(P060_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p060RegisteredHas,destination:`/flash-assets/g678-local/shared-alg001-l06-p060-registered/${token}`})),
      ...Object.entries(P058_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p058RegisteredHas,destination:`/flash-assets/g678-local/shared-alg001-l06-p058-registered/${token}`})),
      ...Object.entries(P057_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p057RegisteredHas,destination:`/flash-assets/g678-local/shared-alg001-l06-p057-registered/${token}`})),
      ...Object.entries(P056_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p056RegisteredHas,destination:`/flash-assets/g678-local/shared-alg001-l06-p056-registered/${token}`})),
      ...Object.entries(P033_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p033RegisteredHas,destination:`/flash-assets/g678-local/shared-alg001-l06-p033-registered/${token}`})),
      ...Object.entries(P050_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p050RegisteredHas,destination:`/flash-assets/g678-local/shared-alg001-l06-p050-registered/${token}`})),
      ...Object.entries(P049_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p049RegisteredHas,destination:`/flash-assets/g678-local/shared-alg001-l06-p049-registered/${token}`})),
      ...Object.entries(P048_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p048RegisteredHas,destination:`/flash-assets/g678-local/shared-alg001-l06-p048-registered/${token}`})),
      ...Object.entries(P047_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p047RegisteredHas,destination:`/flash-assets/g678-local/shared-alg001-l06-p047-registered/${token}`})),
      ...Object.entries(P046_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p046RegisteredHas,destination:`/flash-assets/g678-local/shared-alg001-l06-p046-registered/${token}`})),
      ...Object.entries(P045_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p045RegisteredHas,destination:`/flash-assets/g678-local/shared-alg001-l06-p045-registered/${token}`})),
      ...Object.entries(P044_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p044RegisteredHas,destination:`/flash-assets/g678-local/shared-alg001-l06-p044-registered/${token}`})),
      ...Object.entries(P001_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p001Has,destination:`/flash-assets/g678-local/shared-alg001-l07-p001-candidate/${token}`})),
      ...Object.entries(P060_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p060Has,destination:`/flash-assets/g678-local/shared-alg001-l06-p060-candidate/${token}`})),
      ...Object.entries(P058_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p058Has,destination:`/flash-assets/g678-local/shared-alg001-l06-p058-candidate/${token}`})),
      ...Object.entries(P057_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p057Has,destination:`/flash-assets/g678-local/shared-alg001-l06-p057-candidate/${token}`})),
      ...Object.entries(P056_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p056Has,destination:`/flash-assets/g678-local/shared-alg001-l06-p056-candidate/${token}`})),
      ...Object.entries(P033_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p033Has,destination:`/flash-assets/g678-local/shared-alg001-l06-p033-candidate/${token}`})),
      ...Object.entries(P050_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p050Has,destination:`/flash-assets/g678-local/shared-alg001-l06-p050-candidate/${token}`})),
      ...Object.entries(P049_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p049Has,destination:`/flash-assets/g678-local/shared-alg001-l06-p049-candidate/${token}`})),
      ...Object.entries(P048_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p048Has,destination:`/flash-assets/g678-local/shared-alg001-l06-p048-candidate/${token}`})),
      ...Object.entries(P047_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p047Has,destination:`/flash-assets/g678-local/shared-alg001-l06-p047-candidate/${token}`})),
      ...Object.entries(P046_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p046Has,destination:`/flash-assets/g678-local/shared-alg001-l06-p046-candidate/${token}`})),
      ...Object.entries(P045_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p045Has,destination:`/flash-assets/g678-local/shared-alg001-l06-p045-candidate/${token}`})),
      ...Object.entries(P044_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p044Has,destination:`/flash-assets/g678-local/shared-alg001-l06-p044-candidate/${token}`})),
      ...Object.entries(P043_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p043Has,destination:`/flash-assets/g678-local/shared-alg001-l06-p043-candidate/${token}`})),
      {source:'/:locale(en|es)/migration-status/g678-calibration/shared-alg001-l06-p042/candidate-v1',
        destination:'/:locale/migration-status/g678-calibration/shared-alg001-l06-p042/continuous-v1'},
      ...Object.entries(P042_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p042Has,destination:`/flash-assets/g678-local/shared-alg001-l06-p042-formal/${token}`})),
      {source:'/:locale(en|es)/migration-status/g678-calibration/shared-alg001-l06-p041/candidate-v1',
        destination:'/:locale/migration-status/g678-calibration/shared-alg001-l06-p041/continuous-v1'},
      ...Object.entries(P041_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p041Has,destination:`/flash-assets/g678-local/shared-alg001-l06-p041-formal/${token}`})),
      {source:'/:locale(en|es)/migration-status/g678-calibration/shared-alg001-l06-p038/candidate-v1',
        destination:'/:locale/migration-status/g678-calibration/shared-alg001-l06-p038/continuous-v1'},
      ...Object.entries(P038_RESOURCE_PINS).map(([token,pin])=>({source:pin.originalPath,
        has:p038Has,destination:`/flash-assets/g678-local/shared-alg001-l06-p038-formal/${token}`})),
      ...Object.values(P035_RESOURCE_PINS).filter(pin=>pin.originalPath!==pin.bridgePath).map(pin=>({source:pin.originalPath,has:p035Has,destination:pin.bridgePath})),
      ...Object.values(P034_RESOURCE_PINS).filter(pin=>pin.originalPath!==pin.bridgePath).map(pin=>({source:pin.originalPath,has:p034Has,destination:pin.bridgePath})),
      ...Object.values(P032_RESOURCE_PINS).filter(pin=>pin.originalPath!==pin.bridgePath).map(pin=>({source:pin.originalPath,has:p032Has,destination:pin.bridgePath})),
      ...Object.values(P028_RESOURCE_PINS).filter(pin=>pin.originalPath!==pin.bridgePath).map(pin=>({source:pin.originalPath,has:p028Has,destination:pin.bridgePath})),
      ...Object.values(P027_RESOURCE_PINS).filter(pin=>pin.originalPath!==pin.bridgePath).map(pin=>({source:pin.originalPath,has:p027Has,destination:pin.bridgePath})),
      ...Object.values(P026_RESOURCE_PINS).filter(pin=>pin.originalPath!==pin.bridgePath).map(pin=>({source:pin.originalPath,has:p026Has,destination:pin.bridgePath})),
      ...Object.values(P025_RESOURCE_PINS).filter(pin=>pin.originalPath!==pin.bridgePath).map(pin=>({source:pin.originalPath,has:p025Has,destination:pin.bridgePath})),
      ...Object.values(P024_RESOURCE_PINS).filter(pin=>pin.originalPath!==pin.bridgePath).map(pin=>({source:pin.originalPath,has:p024Has,destination:pin.bridgePath})),
      ...Object.values(P023_RESOURCE_PINS).filter(pin=>pin.originalPath!==pin.bridgePath).map(pin=>({source:pin.originalPath,has:p023Has,destination:pin.bridgePath})),
      ...Object.values(P022_RESOURCE_PINS).filter(pin=>pin.originalPath!==pin.bridgePath).map(pin=>({source:pin.originalPath,has:p022Has,destination:pin.bridgePath})),
      ...Object.values(P021_RESOURCE_PINS).filter(pin=>pin.originalPath!==pin.bridgePath).map(pin=>({source:pin.originalPath,has:p021Has,destination:pin.bridgePath})),
      ...Object.values(P020_RESOURCE_PINS).filter(pin=>pin.originalPath!==pin.bridgePath).map(pin=>({source:pin.originalPath,has:p020Has,destination:pin.bridgePath})),
      ...Object.values(P019_RESOURCE_PINS).filter(pin=>pin.originalPath!==pin.bridgePath).map(pin=>({source:pin.originalPath,has:p019Has,destination:pin.bridgePath})),
      ...Object.values(P018_RESOURCE_PINS).filter(pin=>pin.originalPath!==pin.bridgePath).map(pin=>({source:pin.originalPath,has:p018Has,destination:pin.bridgePath})),
      ...Object.values(P017_RESOURCE_PINS).filter(pin=>pin.originalPath!==pin.bridgePath).map(pin=>({source:pin.originalPath,has:p017Has,destination:pin.bridgePath})),
      ...Object.values(P016_RESOURCE_PINS).filter(pin=>pin.originalPath!==pin.bridgePath).map(pin=>({source:pin.originalPath,has:p016Has,destination:pin.bridgePath})),
      ...Object.values(P015_RESOURCE_PINS).filter(pin=>pin.originalPath!==pin.bridgePath).map(pin=>({source:pin.originalPath,has:p015Has,destination:pin.bridgePath})),
      ...Object.values(P014_RESOURCE_PINS).filter(pin=>pin.originalPath!==pin.bridgePath).map(pin=>({source:pin.originalPath,has:p014Has,destination:pin.bridgePath})),
      ...Object.values(P013_RESOURCE_PINS).filter(pin=>pin.originalPath!==pin.bridgePath).map(pin=>({source:pin.originalPath,has:p013Has,destination:pin.bridgePath})),
      ...Object.values(P010_LESSON_CANVAS_RESOURCES).map(pin=>({source:pin.originalPath,has:p010Has,destination:pin.bridgePath})),
      {source:'/flash-assets/g678-local/shared-alg001-l06-p008/canvas-v1',has:p010Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p010/predecessor/p008/canvas'},
      {source:'/flash-assets/g678-local/shared-alg001-l06-p008/continuous-source-v1',has:p010Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p010/predecessor/p008/main'},
      {source:'/flash-assets/g678-local/shared-alg001-l06-p008/optional-spanish-audio-v1',has:p010Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p010/predecessor/p008/spanish'},
      {source:'/flash-assets/g678-local/shared-alg001-l06-p004/canvas-v1',has:p010Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p010/predecessor/p004/canvas'},
      {source:'/flash-assets/g678-local/shared-alg001-l06-p004/continuous-source-v1',has:p010Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p010/predecessor/p004/main'},
      {source:'/flash-assets/g678-local/shared-alg001-l06-p004/optional-spanish-audio-v1',has:p010Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p010/predecessor/p004/spanish'},
      {source:'/flash-assets/g678-local/shared-alg001-l06-p003/canvas-renderer.js',has:p010Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p010/predecessor/p003/canvas'},
      {source:'/flash-assets/g678-local/shared-alg001-l06-p003/continuous-source-v2',has:p010Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p010/predecessor/p003/main'},
      {source:'/flash-assets/g678-local/shared-alg001-l06-p003/optional-spanish-audio-v1',has:p010Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p010/predecessor/p003/spanish'},
      {source:'/flash-assets/g678-local/shared-alg001-l06-p004/canvas-v1',has:p008Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p008/predecessor/p004/canvas'},
      {source:'/flash-assets/g678-local/shared-alg001-l06-p004/continuous-source-v1',has:p008Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p008/predecessor/p004/main'},
      {source:'/flash-assets/g678-local/shared-alg001-l06-p004/optional-spanish-audio-v1',has:p008Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p008/predecessor/p004/spanish'},
      {source:'/flash-assets/g678-local/shared-alg001-l06-p003/canvas-renderer.js',has:p008Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p008/predecessor/p003/canvas'},
      {source:'/flash-assets/g678-local/shared-alg001-l06-p003/continuous-source-v2',has:p008Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p008/predecessor/p003/main'},
      {source:'/flash-assets/g678-local/shared-alg001-l06-p003/optional-spanish-audio-v1',has:p008Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p008/predecessor/p003/spanish'},
      {source:'/flash-assets/g678-local/shared-alg001-l06-p003/canvas-renderer.js',has:p004Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p004/predecessor/canvas'},
      {source:'/flash-assets/g678-local/shared-alg001-l06-p003/continuous-source-v2',has:p004Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p004/predecessor/main'},
      {source:'/flash-assets/g678-local/shared-alg001-l06-p003/optional-spanish-audio-v1',has:p004Has,
        destination:'/flash-assets/g678-local/shared-alg001-l06-p004/predecessor/spanish'},
      {source: '/flash-assets/g678-local/shared-nms002-l02-p054/reveal/:level/:order', has,
        destination: '/flash-assets/g678-local/shared-nms002-l02-p053/game/reveal/:level/:order'},
      {source: '/flash-assets/g678-local/shared-nms002-l02-p054/feedback-audio/:kind', has,
        destination: '/flash-assets/g678-local/shared-nms002-l02-p053/game/feedback-audio/:kind'},
    ] : [], afterFiles: [], fallback: []};
  },
  async headers() {
    return [
      ...(process.env.NODE_ENV === 'production' ? [38, 39, 46, 47, 48].map(ordinal => ({
        source: `/migrations/shared-alg001-l08-p${String(ordinal).padStart(3, '0')}/:path*`,
        headers: [
          {key: 'Cache-Control', value: 'private, no-store, max-age=0'},
          {key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, noimageindex'},
        ],
      })) : []),
      {
        source: '/((?!flash-assets/courses/).*)',
        headers: securityHeaders
      },
      ...(isG678LocalPreviewEnabled() ? ['/en', '/es'].map(locale => ({
        source: `${locale}/migration-status/g678-calibration/shared-nms002-l02-p054`,
        headers: p054LocalMediaHeaders,
      })) : []),
      ...(isG678LocalPreviewEnabled() ? ['/en', '/es'].map(locale => ({
        source: `${locale}/migration-status/g678-calibration/shared-nms002-l02-p053`,
        headers: p054LocalMediaHeaders,
      })) : []),
      {
        source: '/flash-assets/courses/:path*',
        headers: embeddedCourseAdapterHeaders
      },
      {
        source:
          '/flash-assets/courses/shell-course-g04-l03-index-local/host-composite-assets/:path*',
        headers: [
          {key: 'Cache-Control', value: 'private, no-store, max-age=0'},
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, noimageindex',
          },
        ],
      }
    ];
  },
  redirects: legacyRedirects
};

export default nextConfig;
