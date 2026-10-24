import {hfrDocumentRequest, hfrAssetRequest} from './lib/hfr-local-access';
import {P040_ROUTE as L8_P040_ROUTE,p040ProxyDocumentRequest as l8P040ProxyDocumentRequest} from './lib/alg-l08-p040-preview-policy-v1';
import {P050_ROUTE as L8_P050_ROUTE,p050ProxyDocumentRequest as l8P050ProxyDocumentRequest} from './lib/alg-l08-p050-preview-policy-v1';
import {L10_LESSON_CANVAS_RESOURCES,l10LessonCanvasResourceForRequest} from './lib/alg-l10-lesson-canvas-request-v1';
import {P004_ROUTE as L10_P004_ROUTE,P004_ASSET_ROOT as L10_P004_ASSET_ROOT,P004_LOCAL_ORIGIN as L10_P004_ORIGIN,p004ProxyDocumentRequest as l10P004ProxyDocumentRequest} from './lib/alg-l10-p004-preview-policy-v1';
import {p004ResourceForRequest as l10P004ResourceForRequest} from './lib/alg-l10-p004-local-request-v1';
import {P038_ROUTE as L8_P038_ROUTE,p038ProxyDocumentRequest as l8P038ProxyDocumentRequest} from './lib/alg-l08-p038-preview-policy-v1';
import {P039_ROUTE as L8_P039_ROUTE,p039ProxyDocumentRequest as l8P039ProxyDocumentRequest} from './lib/alg-l08-p039-preview-policy-v1';
import {P046_ROUTE as L8_P046_ROUTE,p046ProxyDocumentRequest as l8P046ProxyDocumentRequest} from './lib/alg-l08-p046-preview-policy-v1';
import {P047_ROUTE as L8_P047_ROUTE,p047ProxyDocumentRequest as l8P047ProxyDocumentRequest} from './lib/alg-l08-p047-preview-policy-v1';
import {P048_ROUTE as L8_P048_ROUTE,p048ProxyDocumentRequest as l8P048ProxyDocumentRequest} from './lib/alg-l08-p048-preview-policy-v1';
import {P037_ROUTE as L8_P037_ROUTE,p037ProxyDocumentRequest as l8P037ProxyDocumentRequest} from './lib/alg-l08-p037-preview-policy-v1';
import {P036_ROUTE as L8_P036_ROUTE,p036ProxyDocumentRequest as l8P036ProxyDocumentRequest} from './lib/alg-l08-p036-preview-policy-v1';
import {P035_ROUTE as L8_P035_ROUTE,p035ProxyDocumentRequest as l8P035ProxyDocumentRequest} from './lib/alg-l08-p035-preview-policy-v1';
import {P034_ROUTE as L8_P034_ROUTE,p034ProxyDocumentRequest as l8P034ProxyDocumentRequest} from './lib/alg-l08-p034-preview-policy-v1';
import {P033_ROUTE as L8_P033_ROUTE,p033ProxyDocumentRequest as l8P033ProxyDocumentRequest} from './lib/alg-l08-p033-preview-policy-v1';
import {P032_ROUTE as L8_P032_ROUTE,p032ProxyDocumentRequest as l8P032ProxyDocumentRequest} from './lib/alg-l08-p032-preview-policy-v1';
import {P031_ROUTE as L8_P031_ROUTE,p031ProxyDocumentRequest as l8P031ProxyDocumentRequest} from './lib/alg-l08-p031-preview-policy-v1';
import {P030_ROUTE as L8_P030_ROUTE,p030ProxyDocumentRequest as l8P030ProxyDocumentRequest} from './lib/alg-l08-p030-preview-policy-v1';
import {P029_ROUTE as L8_P029_ROUTE,p029ProxyDocumentRequest as l8P029ProxyDocumentRequest} from './lib/alg-l08-p029-preview-policy-v1';
import {P028_ROUTE as L8_P028_ROUTE,p028ProxyDocumentRequest as l8P028ProxyDocumentRequest} from './lib/alg-l08-p028-preview-policy-v1';
import {P027_ROUTE as L8_P027_ROUTE,p027ProxyDocumentRequest as l8P027ProxyDocumentRequest} from './lib/alg-l08-p027-preview-policy-v1';
import {P026_ROUTE as L8_P026_ROUTE,p026ProxyDocumentRequest as l8P026ProxyDocumentRequest} from './lib/alg-l08-p026-preview-policy-v1';
import {P024_ROUTE as L8_P024_ROUTE,p024ProxyDocumentRequest as l8P024ProxyDocumentRequest} from './lib/alg-l08-p024-preview-policy-v1';
import {P023_ROUTE as L8_P023_ROUTE,p023ProxyDocumentRequest as l8P023ProxyDocumentRequest} from './lib/alg-l08-p023-preview-policy-v1';
import {P022_ROUTE as L8_P022_ROUTE,p022ProxyDocumentRequest as l8P022ProxyDocumentRequest} from './lib/alg-l08-p022-preview-policy-v1';
import {P021_ROUTE as L8_P021_ROUTE,p021ProxyDocumentRequest as l8P021ProxyDocumentRequest} from './lib/alg-l08-p021-preview-policy-v1';
import {P020_ROUTE as L8_P020_ROUTE,p020ProxyDocumentRequest as l8P020ProxyDocumentRequest} from './lib/alg-l08-p020-preview-policy-v1';
import {P019_ROUTE as L8_P019_ROUTE,p019ProxyDocumentRequest as l8P019ProxyDocumentRequest} from './lib/alg-l08-p019-preview-policy-v1';
import {P018_ROUTE as L8_P018_ROUTE,p018ProxyDocumentRequest as l8P018ProxyDocumentRequest} from './lib/alg-l08-p018-preview-policy-v1';
import {P016_ROUTE as L8_P016_ROUTE,p016ProxyDocumentRequest as l8P016ProxyDocumentRequest} from './lib/alg-l08-p016-preview-policy-v1';
import {P015_ROUTE as L8_P015_ROUTE,p015ProxyDocumentRequest as l8P015ProxyDocumentRequest} from './lib/alg-l08-p015-preview-policy-v1';
import {P014_ROUTE as L8_P014_ROUTE,p014ProxyDocumentRequest as l8P014ProxyDocumentRequest} from './lib/alg-l08-p014-preview-policy-v1';
import {P013_ROUTE as L8_P013_ROUTE,p013ProxyDocumentRequest as l8P013ProxyDocumentRequest} from './lib/alg-l08-p013-preview-policy-v1';
import {P012_ROUTE as L8_P012_ROUTE,p012ProxyDocumentRequest as l8P012ProxyDocumentRequest} from './lib/alg-l08-p012-preview-policy-v1';
import {P011_ROUTE as L8_P011_ROUTE,p011ProxyDocumentRequest as l8P011ProxyDocumentRequest} from './lib/alg-l08-p011-preview-policy-v1';
import {P010_ROUTE as L8_P010_ROUTE,p010ProxyDocumentRequest as l8P010ProxyDocumentRequest} from './lib/alg-l08-p010-preview-policy-v1';
import {P009_ROUTE as L8_P009_ROUTE,p009ProxyDocumentRequest as l8P009ProxyDocumentRequest} from './lib/alg-l08-p009-preview-policy-v1';
import {P007_ROUTE as L8_P007_ROUTE,p007ProxyDocumentRequest as l8P007ProxyDocumentRequest} from './lib/alg-l08-p007-preview-policy-v1';
import {P006_ROUTE as L8_P006_ROUTE,p006ProxyDocumentRequest as l8P006ProxyDocumentRequest} from './lib/alg-l08-p006-preview-policy-v1';
import {P005_ROUTE as L8_P005_ROUTE,p005ProxyDocumentRequest as l8P005ProxyDocumentRequest} from './lib/alg-l08-p005-preview-policy-v1';
import {l8CurrentResourceForRequest} from './lib/alg-l08-current-local-request-v1';
import {l8LessonCanvasResourceForRequest} from './lib/alg-l08-lesson-canvas-request-v1';
import {P001_ROUTE as L8_P001_ROUTE,p001ProxyDocumentRequest as l8P001ProxyDocumentRequest} from './lib/alg-l08-p001-preview-policy-v1';
import {p001ResourceForRequest as l8P001ResourceForRequest} from './lib/alg-l08-p001-local-request-v1';
import {P062_ROUTE,p062ProxyDocumentRequest as l7P062ProxyDocumentRequest} from './lib/alg-l07-p062-preview-policy-v1';
import {P060_ROUTE,p060ProxyDocumentRequest as l7P060ProxyDocumentRequest} from './lib/alg-l07-p060-preview-policy-v1';
import {P059_ROUTE,p059ProxyDocumentRequest as l7P059ProxyDocumentRequest} from './lib/alg-l07-p059-preview-policy-v1';
import {P058_ROUTE,p058ProxyDocumentRequest as l7P058ProxyDocumentRequest} from './lib/alg-l07-p058-preview-policy-v1';
import {P052_ROUTE,p052ProxyDocumentRequest as l7P052ProxyDocumentRequest} from './lib/alg-l07-p052-preview-policy-v1';
import {P051_ROUTE,p051ProxyDocumentRequest as l7P051ProxyDocumentRequest} from './lib/alg-l07-p051-preview-policy-v1';
import {P050_ROUTE,p050ProxyDocumentRequest as l7P050ProxyDocumentRequest} from './lib/alg-l07-p050-preview-policy-v1';
import {P049_ROUTE,p049ProxyDocumentRequest as l7P049ProxyDocumentRequest} from './lib/alg-l07-p049-preview-policy-v1';
import {P048_ROUTE,p048ProxyDocumentRequest as l7P048ProxyDocumentRequest} from './lib/alg-l07-p048-preview-policy-v1';
import {P046_ROUTE,p046ProxyDocumentRequest as l7P046ProxyDocumentRequest} from './lib/alg-l07-p046-preview-policy-v1';
import {P047_ROUTE,p047ProxyDocumentRequest as l7P047ProxyDocumentRequest} from './lib/alg-l07-p047-preview-policy-v1';
import {P045_ROUTE,p045ProxyDocumentRequest as l7P045ProxyDocumentRequest} from './lib/alg-l07-p045-preview-policy-v1';
import {P044_ROUTE,p044ProxyDocumentRequest as l7P044ProxyDocumentRequest} from './lib/alg-l07-p044-preview-policy-v1';
import {P043_ROUTE,p043ProxyDocumentRequest as l7P043ProxyDocumentRequest} from './lib/alg-l07-p043-preview-policy-v1';
import {P042_ROUTE,p042ProxyDocumentRequest as l7P042ProxyDocumentRequest} from './lib/alg-l07-p042-preview-policy-v1';
import {P041_ROUTE,p041ProxyDocumentRequest as l7P041ProxyDocumentRequest} from './lib/alg-l07-p041-preview-policy-v1';
import {P040_ROUTE,p040ProxyDocumentRequest as l7P040ProxyDocumentRequest} from './lib/alg-l07-p040-preview-policy-v1';
import {P039_ROUTE,p039ProxyDocumentRequest as l7P039ProxyDocumentRequest} from './lib/alg-l07-p039-preview-policy-v1';
import {P038_ROUTE,p038ProxyDocumentRequest as l7P038ProxyDocumentRequest} from './lib/alg-l07-p038-preview-policy-v1';
import {P037_ROUTE,p037ProxyDocumentRequest as l7P037ProxyDocumentRequest} from './lib/alg-l07-p037-preview-policy-v1';
import {P036_ROUTE,p036ProxyDocumentRequest as l7P036ProxyDocumentRequest} from './lib/alg-l07-p036-preview-policy-v1';
import {P034_ROUTE,p034ProxyDocumentRequest as l7P034ProxyDocumentRequest} from './lib/alg-l07-p034-preview-policy-v1';
import {P033_ROUTE,p033ProxyDocumentRequest as l7P033ProxyDocumentRequest} from './lib/alg-l07-p033-preview-policy-v1';
import {P032_ROUTE,p032ProxyDocumentRequest as l7P032ProxyDocumentRequest} from './lib/alg-l07-p032-preview-policy-v1';
import {P031_ROUTE,p031ProxyDocumentRequest as l7P031ProxyDocumentRequest} from './lib/alg-l07-p031-preview-policy-v1';
import {P030_ROUTE,p030ProxyDocumentRequest as l7P030ProxyDocumentRequest} from './lib/alg-l07-p030-preview-policy-v1';
import {P027_ROUTE,p027ProxyDocumentRequest as l7P027ProxyDocumentRequest} from './lib/alg-l07-p027-preview-policy-v1';
import {P026_ROUTE,p026ProxyDocumentRequest as l7P026ProxyDocumentRequest} from './lib/alg-l07-p026-preview-policy-v1';
import {P025_ROUTE,p025ProxyDocumentRequest as l7P025ProxyDocumentRequest} from './lib/alg-l07-p025-preview-policy-v1';
import {P023_ROUTE,p023ProxyDocumentRequest as l7P023ProxyDocumentRequest} from './lib/alg-l07-p023-preview-policy-v1';
import {P022_ROUTE,p022ProxyDocumentRequest as l7P022ProxyDocumentRequest} from './lib/alg-l07-p022-preview-policy-v1';
import {P021_ROUTE,p021ProxyDocumentRequest as l7P021ProxyDocumentRequest} from './lib/alg-l07-p021-preview-policy-v1';
import {P020_ROUTE,p020ProxyDocumentRequest} from './lib/alg-l07-p020-preview-policy-v1';
import {P019_ROUTE,p019ProxyDocumentRequest} from './lib/alg-l07-p019-preview-policy-v1';
import {P018_ROUTE,p018ProxyDocumentRequest} from './lib/alg-l07-p018-preview-policy-v1';
import {P017_ROUTE,p017ProxyDocumentRequest} from './lib/alg-l07-p017-preview-policy-v1';
import {P016_ROUTE,p016ProxyDocumentRequest} from './lib/alg-l07-p016-preview-policy-v1';
import {P015_ROUTE,p015ProxyDocumentRequest} from './lib/alg-l07-p015-preview-policy-v1';
import {P014_ROUTE,p014ProxyDocumentRequest} from './lib/alg-l07-p014-preview-policy-v1';
import {P013_ROUTE,p013ProxyDocumentRequest} from './lib/alg-l07-p013-preview-policy-v1';
import {P012_ROUTE,p012ProxyDocumentRequest} from './lib/alg-l07-p012-preview-policy-v1';
import {P011_ROUTE,p011ProxyDocumentRequest} from './lib/alg-l07-p011-preview-policy-v1';
import {P010_ROUTE,p010ProxyDocumentRequest} from './lib/alg-l07-p010-preview-policy-v1';
import {P009_ROUTE,p009ProxyDocumentRequest} from './lib/alg-l07-p009-preview-policy-v1';
import {P007_ROUTE,p007ProxyDocumentRequest} from './lib/alg-l07-p007-preview-policy-v1';
import {P006_ROUTE,p006ProxyDocumentRequest} from './lib/alg-l07-p006-preview-policy-v1';
import {P002_ROUTE,p002ProxyDocumentRequest} from './lib/alg-l07-p002-preview-policy-v1';
import {P003_ROUTE,p003ProxyDocumentRequest} from './lib/alg-l07-p003-preview-policy-v1';
import {l7CurrentResourceForRequest} from './lib/alg-l07-current-local-request-v1';
import {P001_ROUTE,p001ProxyDocumentRequest} from './lib/alg-l07-p001-preview-policy-v1';
import {p001ResourceForRequest} from './lib/alg-l07-p001-local-request-v1';
import {P060_REGISTERED_PATH,p060RegisteredProxyDocumentRequest,p060RegisteredResourceForRequest} from './lib/alg-l06-p060-registered-access-v1';
import {P058_REGISTERED_PATH,p058RegisteredProxyDocumentRequest,p058RegisteredResourceForRequest} from './lib/alg-l06-p058-registered-access-v1';
import {P057_REGISTERED_PATH,p057RegisteredProxyDocumentRequest,p057RegisteredResourceForRequest} from './lib/alg-l06-p057-registered-access-v1';
import {P056_REGISTERED_PATH,p056RegisteredProxyDocumentRequest,p056RegisteredResourceForRequest} from './lib/alg-l06-p056-registered-access-v1';
import {P033_REGISTERED_PATH,p033RegisteredProxyDocumentRequest,p033RegisteredResourceForRequest} from './lib/alg-l06-p033-registered-access-v1';
import {P050_REGISTERED_PATH,p050RegisteredProxyDocumentRequest,p050RegisteredResourceForRequest} from './lib/alg-l06-p050-registered-access-v1';
import {P049_REGISTERED_PATH,p049RegisteredProxyDocumentRequest,p049RegisteredResourceForRequest} from './lib/alg-l06-p049-registered-access-v1';
import {P048_REGISTERED_PATH,p048RegisteredProxyDocumentRequest,p048RegisteredResourceForRequest} from './lib/alg-l06-p048-registered-access-v1';
import {p060ProxyDocumentRequest} from './lib/alg-l06-p060-preview-policy-v1';
import {p058ProxyDocumentRequest} from './lib/alg-l06-p058-preview-policy-v1';
import {p057ProxyDocumentRequest} from './lib/alg-l06-p057-preview-policy-v1';
import {p056ProxyDocumentRequest} from './lib/alg-l06-p056-preview-policy-v1';
import {p033ProxyDocumentRequest} from './lib/alg-l06-p033-preview-policy-v1';
import {p050ProxyDocumentRequest} from './lib/alg-l06-p050-preview-policy-v1';
import {p049ProxyDocumentRequest} from './lib/alg-l06-p049-preview-policy-v1';
import {p048ProxyDocumentRequest} from './lib/alg-l06-p048-preview-policy-v1';
import {p060ResourceForRequest} from './lib/alg-l06-p060-local-request-v1';
import {p058ResourceForRequest} from './lib/alg-l06-p058-local-request-v1';
import {p057ResourceForRequest} from './lib/alg-l06-p057-local-request-v1';
import {p056ResourceForRequest} from './lib/alg-l06-p056-local-request-v1';
import {p033ResourceForRequest} from './lib/alg-l06-p033-local-request-v1';
import {p050ResourceForRequest} from './lib/alg-l06-p050-local-request-v1';
import {p049ResourceForRequest} from './lib/alg-l06-p049-local-request-v1';
import {p048ResourceForRequest} from './lib/alg-l06-p048-local-request-v1';
import {P047_REGISTERED_PATH,p047RegisteredProxyDocumentRequest,
 p047RegisteredResourceForRequest} from './lib/alg-l06-p047-registered-access-v1';
import {p047ProxyDocumentRequest} from './lib/alg-l06-p047-preview-policy-v1';
import {p047ResourceForRequest} from './lib/alg-l06-p047-local-request-v1';
import {P046_REGISTERED_PATH,p046RegisteredProxyDocumentRequest,
 p046RegisteredResourceForRequest} from './lib/alg-l06-p046-registered-access-v1';
import {p046ProxyDocumentRequest} from './lib/alg-l06-p046-preview-policy-v1';
import {p046ResourceForRequest} from './lib/alg-l06-p046-local-request-v1';
import {P045_REGISTERED_PATH,p045RegisteredProxyDocumentRequest,
 p045RegisteredResourceForRequest} from './lib/alg-l06-p045-registered-access-v1';
import {P044_REGISTERED_PATH,p044RegisteredProxyDocumentRequest,
 p044RegisteredResourceForRequest} from './lib/alg-l06-p044-registered-access-v1';
import {p045ProxyDocumentRequest} from './lib/alg-l06-p045-preview-policy-v1';
import {p044ProxyDocumentRequest} from './lib/alg-l06-p044-preview-policy-v1';
import {p045ResourceForRequest} from './lib/alg-l06-p045-local-request-v1';
import {p044ResourceForRequest} from './lib/alg-l06-p044-local-request-v1';
import {p043ProxyDocumentRequest} from './lib/alg-l06-p043-preview-policy-v1';
import {p043ResourceForRequest} from './lib/alg-l06-p043-local-request-v1';
import {p042ProxyDocumentRequest} from './lib/alg-l06-p042-preview-policy-v1';
import {p042ResourceForRequest} from './lib/alg-l06-p042-local-request-v1';
import {p041ProxyDocumentRequest} from './lib/alg-l06-p041-preview-policy-v1';
import {p041ResourceForRequest} from './lib/alg-l06-p041-local-request-v1';
import {p038ProxyDocumentRequest} from './lib/alg-l06-p038-preview-policy-v1';
import {p038ResourceForRequest} from './lib/alg-l06-p038-local-request-v1';
import {p035ProxyDocumentRequest} from './lib/alg-l06-p035-preview-policy-v1';
import {p035ResourceForRequest} from './lib/alg-l06-p035-local-request-v1';
import {p034ProxyDocumentRequest} from './lib/alg-l06-p034-preview-policy-v1';
import {p034ResourceForRequest} from './lib/alg-l06-p034-local-request-v1';
import {p032ProxyDocumentRequest} from './lib/alg-l06-p032-preview-policy-v1';
import {p032ResourceForRequest} from './lib/alg-l06-p032-local-request-v1';
import {p028ProxyDocumentRequest} from './lib/alg-l06-p028-preview-policy-v1';
import {p028ResourceForRequest} from './lib/alg-l06-p028-local-request-v1';
import {p027ProxyDocumentRequest} from './lib/alg-l06-p027-preview-policy-v1';
import {p027ResourceForRequest} from './lib/alg-l06-p027-local-request-v1';
import {p026ProxyDocumentRequest} from './lib/alg-l06-p026-preview-policy-v1';
import {p026ResourceForRequest} from './lib/alg-l06-p026-local-request-v1';
import {p025ProxyDocumentRequest} from './lib/alg-l06-p025-preview-policy-v1';
import {p025ResourceForRequest} from './lib/alg-l06-p025-local-request-v1';
import {p024ProxyDocumentRequest} from './lib/alg-l06-p024-preview-policy-v1';
import {p024ResourceForRequest} from './lib/alg-l06-p024-local-request-v1';
import {p023ProxyDocumentRequest} from './lib/alg-l06-p023-preview-policy-v1';
import {p023ResourceForRequest} from './lib/alg-l06-p023-local-request-v1';
import {p022ProxyDocumentRequest} from './lib/alg-l06-p022-preview-policy-v1';
import {p022ResourceForRequest} from './lib/alg-l06-p022-local-request-v1';
import {p021ProxyDocumentRequest} from './lib/alg-l06-p021-preview-policy-v1';
import {p021ResourceForRequest} from './lib/alg-l06-p021-local-request-v1';
import {p020ResourceForRequest} from './lib/alg-l06-p020-local-request-v1';
import {p019ResourceForRequest} from './lib/alg-l06-p019-local-request-v1';
import {p018ResourceForRequest} from './lib/alg-l06-p018-local-request-v1';
import {p017ResourceForRequest} from './lib/alg-l06-p017-local-request-v1';
import {p016ResourceForRequest} from './lib/alg-l06-p016-local-request-v1';
import {p015ResourceForRequest} from './lib/alg-l06-p015-local-request-v1';
import {p014ResourceForRequest} from './lib/alg-l06-p014-local-request-v1';
import {p013ResourceForRequest} from './lib/alg-l06-p013-local-request-v1';
import {p010LessonCanvasResourceForRequest} from './lib/alg-l06-p010-lesson-canvas-request-v1';
import {isP010ResourceRequest,P010_RESOURCE_PINS,type P010Resource} from './lib/alg-l06-p010-local-request-v1';
import {isP010PredecessorRequest} from './lib/alg-l06-p010-predecessor-request-v1';
import {isP008ResourceRequest,P008_RESOURCE_PINS,type P008Resource} from './lib/alg-l06-p008-local-request-v1';
import {isP008PredecessorRequest} from './lib/alg-l06-p008-predecessor-request-v1';
import {isP003OptionalSpanishRequest,P003_OPTIONAL_SPANISH_PATH} from './lib/alg-l06-p003-optional-spanish-access-v1';
import {isP004ResourceRequest,P004_RESOURCE_PINS,type P004Resource} from './lib/alg-l06-p004-local-request-v1';
import {isP004PredecessorRequest} from './lib/alg-l06-p004-predecessor-request-v1';
import {isP003ContinuousHostSearch} from './lib/alg-l06-p003-local-audio-request-v1';
import {isP003ContinuousSourceRequest} from './lib/alg-l06-p003-continuous-source-access-v2';
import {isP047AudioRequest,P047_AUDIO_PREFIX} from './lib/nms-l01-p047-audio-access';
import {isAlgL12P006AdmissionPath,isAlgL12P006AdmissionRequest} from './lib/g678-alg-l12-p006-admission-access';
import {isDatL05SourceAudioRequest,DAT_L05_SOURCE_AUDIO_ID} from './lib/dat-l05-source-audio-access';
import {isDatL02P002SourceAudioRequest, DAT_L02_P002_AUDIO_PATH} from
  './lib/dat-l02-p002-source-audio-access';
import {isDatL02P002SymbolRequest, DAT_L02_P002_SYMBOL_PREFIX} from
  './lib/dat-l02-p002-symbol-access';
import {clerkMiddleware} from '@clerk/nextjs/server';
import type {NextRequest} from 'next/server';
import type {NextFetchEvent} from 'next/server';
import {NextResponse} from 'next/server';

import {routing} from './i18n/routing';
import {isContinuousSourceAudioPath,isContinuousSourceAudioRequest} from './lib/continuous-source-audio-access';
import {isNmsL11SourceAudioRequest,NMS_L11_SOURCE_AUDIO_ID} from './lib/nms-l11-source-audio-access';
import {
  isG4L3ShowcaseAssetAuthorized,
  isG4L3ShowcaseAssetPath,
} from './lib/g4-l3-showcase-asset-policy';
import {
  currentJsShowcasePublication,
  G3_L2_SHOWCASE_RELEASE_ID,
  G4_L5_PAGE_ONLY_RELEASE_ID,
  G4_L10_PAGE_ONLY_RELEASE_ID,
  G4_L11_PAGE_ONLY_RELEASE_ID,
  G5_L3_SHOWCASE_RELEASE_ID,
  G5_L4_SHOWCASE_RELEASE_ID,
  G5_L5_SHOWCASE_RELEASE_ID,
} from './lib/current-js-showcase-publication';
import {
  classifyG4L3HostCompositeAsset,
  hasExactG4L3HostCompositeDigest,
} from './lib/g4-l3-host-composite-asset-policy';
import {
  isLocalReferenceDiagnosticRequestAllowed,
  LOCAL_REFERENCE_DIAGNOSTIC_CONTENT_SECURITY_POLICY,
} from './lib/local-reference-diagnostic-access';
import {
  isMigrationStatusAvailable,
  isMigrationStatusDesignerViewRequested,
} from './lib/migration-status-access';
import {
  isLocalAuthEnabled,
  isLocalAuthPath,
  isLocalAuthSessionApiPath,
} from './lib/local-auth-access';
import {
  isG678CalibrationAssetPath,
  isG678CalibrationProductPath,
  isG678LocalPreviewRequestUrl,
  isG678LoopbackHostname,
  isG678SameOriginCanvasAssetRequest,
  isG678ModuleCode,
  isG678ModuleCoursePath,
} from './lib/g678-preview-policy';
import {
  isPageOnlyCurrentJsShowcaseAssetAuthorized,
  isPageOnlyCurrentJsShowcaseAssetSegments,
} from './lib/page-only-current-js-showcase-asset-policy';
import {
  classifyG5L4PreviewAsset,
  hasExactG5L4AudioDigest,
  hasExactG5L4RuntimeDigest,
  isG5L4ShowcaseAudioAuthorized,
  isG5L4ShowcaseAssetAuthorized,
  isG5L4ShowcaseAssetSegments,
} from './lib/g5-l4-preview-asset-policy';

const loopbackHosts = new Set(['127.0.0.1', 'localhost', '[::1]']);

const publicPaths = new Set([
  '/',
  '/privacy',
  '/terms',
]);

const showcaseReleaseIdByCoursePath = Object.freeze({
  '/courses/3/2': G3_L2_SHOWCASE_RELEASE_ID,
  '/courses/4/5': G4_L5_PAGE_ONLY_RELEASE_ID,
  '/courses/4/10': G4_L10_PAGE_ONLY_RELEASE_ID,
  '/courses/4/11': G4_L11_PAGE_ONLY_RELEASE_ID,
  '/courses/5/3': G5_L3_SHOWCASE_RELEASE_ID,
  '/courses/5/4': G5_L4_SHOWCASE_RELEASE_ID,
  '/courses/5/5': G5_L5_SHOWCASE_RELEASE_ID,
} as const);

function notFoundResponse() {
  return new NextResponse('Not Found', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

function isReferencePath(pathname: string) {
  return /^\/reference\/[a-z0-9-]+$/u.test(pathname);
}

function isArchivePath(pathname: string, request: NextRequest) {
  if(pathname===`${L10_P004_ROUTE}/candidate-v1`||pathname===`${L10_P004_ROUTE}/registered-v1`)
    return l10P004ProxyDocumentRequest(request.nextUrl,request.headers,request.method,pathname.endsWith('/candidate-v1')?'candidate':'registered');
  for(const [route,check] of [[L8_P040_ROUTE,l8P040ProxyDocumentRequest],[L8_P050_ROUTE,l8P050ProxyDocumentRequest],[L8_P038_ROUTE,l8P038ProxyDocumentRequest],[L8_P039_ROUTE,l8P039ProxyDocumentRequest],[L8_P046_ROUTE,l8P046ProxyDocumentRequest],[L8_P047_ROUTE,l8P047ProxyDocumentRequest],[L8_P048_ROUTE,l8P048ProxyDocumentRequest],[L8_P037_ROUTE,l8P037ProxyDocumentRequest],[L8_P036_ROUTE,l8P036ProxyDocumentRequest],[L8_P035_ROUTE,l8P035ProxyDocumentRequest],[L8_P034_ROUTE,l8P034ProxyDocumentRequest],[L8_P033_ROUTE,l8P033ProxyDocumentRequest],[L8_P032_ROUTE,l8P032ProxyDocumentRequest],[L8_P031_ROUTE,l8P031ProxyDocumentRequest],[L8_P030_ROUTE,l8P030ProxyDocumentRequest],[L8_P029_ROUTE,l8P029ProxyDocumentRequest],[L8_P028_ROUTE,l8P028ProxyDocumentRequest],[L8_P027_ROUTE,l8P027ProxyDocumentRequest],[L8_P026_ROUTE,l8P026ProxyDocumentRequest],[L8_P024_ROUTE,l8P024ProxyDocumentRequest],[L8_P023_ROUTE,l8P023ProxyDocumentRequest],[L8_P022_ROUTE,l8P022ProxyDocumentRequest],[L8_P021_ROUTE,l8P021ProxyDocumentRequest],[L8_P020_ROUTE,l8P020ProxyDocumentRequest],[L8_P019_ROUTE,l8P019ProxyDocumentRequest],[L8_P018_ROUTE,l8P018ProxyDocumentRequest],[L8_P016_ROUTE,l8P016ProxyDocumentRequest],[L8_P015_ROUTE,l8P015ProxyDocumentRequest],[L8_P014_ROUTE,l8P014ProxyDocumentRequest],[L8_P013_ROUTE,l8P013ProxyDocumentRequest],[L8_P012_ROUTE,l8P012ProxyDocumentRequest],[L8_P011_ROUTE,l8P011ProxyDocumentRequest],[L8_P010_ROUTE,l8P010ProxyDocumentRequest],[L8_P009_ROUTE,l8P009ProxyDocumentRequest],[L8_P007_ROUTE,l8P007ProxyDocumentRequest],[L8_P006_ROUTE,l8P006ProxyDocumentRequest],[L8_P005_ROUTE,l8P005ProxyDocumentRequest],[L8_P001_ROUTE,l8P001ProxyDocumentRequest],[P002_ROUTE,p002ProxyDocumentRequest],[P003_ROUTE,p003ProxyDocumentRequest],[P006_ROUTE,p006ProxyDocumentRequest],[P007_ROUTE,p007ProxyDocumentRequest],[P009_ROUTE,p009ProxyDocumentRequest],[P010_ROUTE,p010ProxyDocumentRequest],[P011_ROUTE,p011ProxyDocumentRequest],[P012_ROUTE,p012ProxyDocumentRequest],[P013_ROUTE,p013ProxyDocumentRequest],[P014_ROUTE,p014ProxyDocumentRequest],[P015_ROUTE,p015ProxyDocumentRequest],[P016_ROUTE,p016ProxyDocumentRequest],[P017_ROUTE,p017ProxyDocumentRequest],[P018_ROUTE,p018ProxyDocumentRequest],[P019_ROUTE,p019ProxyDocumentRequest],[P020_ROUTE,p020ProxyDocumentRequest],[P021_ROUTE,l7P021ProxyDocumentRequest],[P022_ROUTE,l7P022ProxyDocumentRequest],[P023_ROUTE,l7P023ProxyDocumentRequest],[P025_ROUTE,l7P025ProxyDocumentRequest],[P026_ROUTE,l7P026ProxyDocumentRequest],[P027_ROUTE,l7P027ProxyDocumentRequest],[P030_ROUTE,l7P030ProxyDocumentRequest],[P031_ROUTE,l7P031ProxyDocumentRequest],[P032_ROUTE,l7P032ProxyDocumentRequest],[P033_ROUTE,l7P033ProxyDocumentRequest],[P034_ROUTE,l7P034ProxyDocumentRequest],[P036_ROUTE,l7P036ProxyDocumentRequest],[P037_ROUTE,l7P037ProxyDocumentRequest],[P038_ROUTE,l7P038ProxyDocumentRequest],[P039_ROUTE,l7P039ProxyDocumentRequest],[P040_ROUTE,l7P040ProxyDocumentRequest],[P041_ROUTE,l7P041ProxyDocumentRequest],[P043_ROUTE,l7P043ProxyDocumentRequest],[P050_ROUTE,l7P050ProxyDocumentRequest],[P058_ROUTE,l7P058ProxyDocumentRequest],[P062_ROUTE,l7P062ProxyDocumentRequest],[P060_ROUTE,l7P060ProxyDocumentRequest],[P059_ROUTE,l7P059ProxyDocumentRequest],[P052_ROUTE,l7P052ProxyDocumentRequest],[P051_ROUTE,l7P051ProxyDocumentRequest],[P049_ROUTE,l7P049ProxyDocumentRequest],[P048_ROUTE,l7P048ProxyDocumentRequest],[P046_ROUTE,l7P046ProxyDocumentRequest],[P047_ROUTE,l7P047ProxyDocumentRequest],[P045_ROUTE,l7P045ProxyDocumentRequest],[P044_ROUTE,l7P044ProxyDocumentRequest],[P042_ROUTE,l7P042ProxyDocumentRequest]] as const)for(const mode of ['candidate','registered'] as const)if(pathname===`${route}/${mode}-v1`)return check(request.nextUrl,request.headers,request.method,mode);
  if(pathname===`${P001_ROUTE}/registered-v1`)
    return p001ProxyDocumentRequest(request.nextUrl,request.headers,request.method,'registered');
  if(pathname===`${P001_ROUTE}/candidate-v1`)
    return p001ProxyDocumentRequest(request.nextUrl,request.headers,request.method,'candidate');
  if (pathname === P060_REGISTERED_PATH)
    return p060RegisteredProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === P058_REGISTERED_PATH)
    return p058RegisteredProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === P057_REGISTERED_PATH)
    return p057RegisteredProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === P056_REGISTERED_PATH)
    return p056RegisteredProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === P033_REGISTERED_PATH)
    return p033RegisteredProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === P050_REGISTERED_PATH)
    return p050RegisteredProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === P049_REGISTERED_PATH)
    return p049RegisteredProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === P048_REGISTERED_PATH)
    return p048RegisteredProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === P047_REGISTERED_PATH)
    return p047RegisteredProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === P046_REGISTERED_PATH)
    return p046RegisteredProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === P045_REGISTERED_PATH)
    return p045RegisteredProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === P044_REGISTERED_PATH)
    return p044RegisteredProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === '/migration-status/g678-calibration/shared-alg001-l06-p060/candidate-v1')
    return p060ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === '/migration-status/g678-calibration/shared-alg001-l06-p058/candidate-v1')
    return p058ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === '/migration-status/g678-calibration/shared-alg001-l06-p057/candidate-v1')
    return p057ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === '/migration-status/g678-calibration/shared-alg001-l06-p056/candidate-v1')
    return p056ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === '/migration-status/g678-calibration/shared-alg001-l06-p033/candidate-v1')
    return p033ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === '/migration-status/g678-calibration/shared-alg001-l06-p050/candidate-v1')
    return p050ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === '/migration-status/g678-calibration/shared-alg001-l06-p049/candidate-v1')
    return p049ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === '/migration-status/g678-calibration/shared-alg001-l06-p048/candidate-v1')
    return p048ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === '/migration-status/g678-calibration/shared-alg001-l06-p047/candidate-v1')
    return p047ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === '/migration-status/g678-calibration/shared-alg001-l06-p046/candidate-v1')
    return p046ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === '/migration-status/g678-calibration/shared-alg001-l06-p045/candidate-v1')
    return p045ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === '/migration-status/g678-calibration/shared-alg001-l06-p044/candidate-v1')
    return p044ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === '/migration-status/g678-calibration/shared-alg001-l06-p043/candidate-v1')
    return p043ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === '/migration-status/g678-calibration/shared-alg001-l06-p042/candidate-v1')
    return p042ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === '/migration-status/g678-calibration/shared-alg001-l06-p042/continuous-v1') {
    const candidate = request.nextUrl.clone();
    candidate.pathname = candidate.pathname.replace(/\/continuous-v1$/u, '/candidate-v1');
    return p042ProxyDocumentRequest(candidate,request.headers,request.method);
  }
  if (pathname === '/migration-status/g678-calibration/shared-alg001-l06-p041/candidate-v1')
    return p041ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === '/migration-status/g678-calibration/shared-alg001-l06-p041/continuous-v1') {
    const candidate = request.nextUrl.clone();
    candidate.pathname = candidate.pathname.replace(/\/continuous-v1$/u, '/candidate-v1');
    return p041ProxyDocumentRequest(candidate,request.headers,request.method);
  }
  if (pathname === '/migration-status/g678-calibration/shared-alg001-l06-p038/candidate-v1')
    return p038ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (pathname === '/migration-status/g678-calibration/shared-alg001-l06-p038/continuous-v1') {
    const candidate = request.nextUrl.clone();
    candidate.pathname = candidate.pathname.replace(/\/continuous-v1$/u, '/candidate-v1');
    return p038ProxyDocumentRequest(candidate,request.headers,request.method);
  }
  if (/^\/migration-status\/g678-calibration\/shared-alg001-l06-p035\/(?:candidate-v1|continuous-v1)$/.test(pathname))
    return p035ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (/^\/migration-status\/g678-calibration\/shared-alg001-l06-p034\/(?:candidate-v1|continuous-v1)$/.test(pathname))
    return p034ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (/^\/migration-status\/g678-calibration\/shared-alg001-l06-p032\/(?:candidate-v1|continuous-v1)$/.test(pathname))
    return p032ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (/^\/migration-status\/g678-calibration\/shared-alg001-l06-p028\/(?:candidate-v1|continuous-v1)$/.test(pathname))
  return p028ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (/^\/migration-status\/g678-calibration\/shared-alg001-l06-p027\/(?:candidate-v1|continuous-v1)$/.test(pathname))
    return p027ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (/^\/migration-status\/g678-calibration\/shared-alg001-l06-p026\/(?:candidate-v1|continuous-v1)$/.test(pathname))
    return p026ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (/^\/migration-status\/g678-calibration\/shared-alg001-l06-p025\/(?:candidate-v1|continuous-v1)$/.test(pathname))
    return p025ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (/^\/migration-status\/g678-calibration\/shared-alg001-l06-p024\/(?:candidate-v1|continuous-v1)$/.test(pathname))
    return p024ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (/^\/migration-status\/g678-calibration\/shared-alg001-l06-p023\/(?:candidate-v1|continuous-v1)$/.test(pathname))
    return p023ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (/^\/migration-status\/g678-calibration\/shared-alg001-l06-p022\/(?:candidate-v1|continuous-v1)$/.test(pathname))
    return p022ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (/^\/migration-status\/g678-calibration\/shared-alg001-l06-p021\/(?:candidate-v1|continuous-v1)$/.test(pathname))
    return p021ProxyDocumentRequest(request.nextUrl,request.headers,request.method);
  if (/^\/migration-status\/g678-calibration\/shared-alg001-l06-p020\/(?:candidate-v1|continuous-v1)$/.test(pathname))
    return process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
      ['GET','HEAD'].includes(request.method)&&isG678LocalPreviewRequestUrl(request.nextUrl)&&
      [...request.nextUrl.searchParams].every(([key,value])=>
        (key==='mode'&&value==='focus')||(key==='_rsc'&&/^[A-Za-z0-9_-]{1,128}$/.test(value)))&&
      request.nextUrl.searchParams.getAll('mode').length<=1&&request.nextUrl.searchParams.getAll('_rsc').length<=1;
  if (/^\/migration-status\/g678-calibration\/shared-alg001-l06-p019\/(?:candidate-v1|continuous-v1)$/.test(pathname))
    return process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
      ['GET','HEAD'].includes(request.method)&&isG678LocalPreviewRequestUrl(request.nextUrl)&&
      [...request.nextUrl.searchParams].every(([key,value])=>
        (key==='mode'&&value==='focus')||(key==='_rsc'&&/^[A-Za-z0-9_-]{1,128}$/.test(value)))&&
      request.nextUrl.searchParams.getAll('mode').length<=1&&request.nextUrl.searchParams.getAll('_rsc').length<=1;
  if (/^\/migration-status\/g678-calibration\/shared-alg001-l06-p018\/(?:candidate-v1|continuous-v1)$/.test(pathname))
    return process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
      ['GET','HEAD'].includes(request.method)&&isG678LocalPreviewRequestUrl(request.nextUrl)&&
      [...request.nextUrl.searchParams].every(([key,value])=>
        (key==='mode'&&value==='focus')||(key==='_rsc'&&/^[A-Za-z0-9_-]{1,128}$/.test(value)))&&
      request.nextUrl.searchParams.getAll('mode').length<=1&&request.nextUrl.searchParams.getAll('_rsc').length<=1;
  if (/^\/migration-status\/g678-calibration\/shared-alg001-l06-p017\/(?:candidate-v1|continuous-v1)$/.test(pathname))
    return process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
      ['GET','HEAD'].includes(request.method)&&isG678LocalPreviewRequestUrl(request.nextUrl)&&
      [...request.nextUrl.searchParams].every(([key,value])=>
        (key==='mode'&&value==='focus')||(key==='_rsc'&&/^[A-Za-z0-9_-]{1,128}$/.test(value)))&&
      request.nextUrl.searchParams.getAll('mode').length<=1&&request.nextUrl.searchParams.getAll('_rsc').length<=1;
  if (/^\/migration-status\/g678-calibration\/shared-alg001-l06-p016\/(?:candidate-v1|continuous-v1)$/.test(pathname))
    return process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
      ['GET','HEAD'].includes(request.method)&&isG678LocalPreviewRequestUrl(request.nextUrl)&&
      [...request.nextUrl.searchParams].every(([key,value])=>
        (key==='mode'&&value==='focus')||(key==='_rsc'&&/^[A-Za-z0-9_-]{1,128}$/.test(value)))&&
      request.nextUrl.searchParams.getAll('mode').length<=1&&request.nextUrl.searchParams.getAll('_rsc').length<=1;
  if (/^\/migration-status\/g678-calibration\/shared-alg001-l06-p015\/(?:candidate-v1|continuous-v1)$/.test(pathname))
    return process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
      ['GET','HEAD'].includes(request.method)&&isG678LocalPreviewRequestUrl(request.nextUrl)&&
      [...request.nextUrl.searchParams].every(([key,value])=>
        (key==='mode'&&value==='focus')||(key==='_rsc'&&/^[A-Za-z0-9_-]{1,128}$/.test(value)))&&
      request.nextUrl.searchParams.getAll('mode').length<=1&&request.nextUrl.searchParams.getAll('_rsc').length<=1;
  if (/^\/migration-status\/g678-calibration\/shared-alg001-l06-p014\/(?:candidate-v1|continuous-v1)$/.test(pathname))
    return process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
      ['GET','HEAD'].includes(request.method)&&isG678LocalPreviewRequestUrl(request.nextUrl)&&
      [...request.nextUrl.searchParams].every(([key,value])=>
        (key==='mode'&&value==='focus')||(key==='_rsc'&&/^[A-Za-z0-9_-]{1,128}$/.test(value)))&&
      request.nextUrl.searchParams.getAll('mode').length<=1&&request.nextUrl.searchParams.getAll('_rsc').length<=1;
  if (/^\/migration-status\/g678-calibration\/shared-alg001-l06-p013\/(?:candidate-v1|continuous-v1)$/.test(pathname))
    return process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
      ['GET','HEAD'].includes(request.method)&&isG678LocalPreviewRequestUrl(request.nextUrl)&&
      [...request.nextUrl.searchParams].every(([key,value])=>
        (key==='mode'&&value==='focus')||(key==='_rsc'&&/^[A-Za-z0-9_-]{1,128}$/.test(value)))&&
      request.nextUrl.searchParams.getAll('mode').length<=1&&request.nextUrl.searchParams.getAll('_rsc').length<=1;
  if (/^\/migration-status\/g678-calibration\/shared-alg001-l06-p010\/(?:candidate-v1|continuous-v1)$/.test(pathname))
    return process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
      ['GET','HEAD'].includes(request.method)&&isG678LocalPreviewRequestUrl(request.nextUrl)&&
      [...request.nextUrl.searchParams].every(([key,value])=>
        (key==='mode'&&value==='focus')||(key==='_rsc'&&/^[A-Za-z0-9_-]{1,128}$/.test(value)))&&
      request.nextUrl.searchParams.getAll('mode').length<=1&&request.nextUrl.searchParams.getAll('_rsc').length<=1;

  if ((pathname === '/migration-status/g678-calibration/shared-alg001-l06-p010/candidate-v1' || pathname === '/migration-status/g678-calibration/shared-alg001-l06-p008/candidate-v1' || pathname === '/migration-status/g678-calibration/shared-alg001-l06-p008/continuous-v1' || pathname === '/migration-status/g678-calibration/shared-alg001-l06-p004/candidate-v1' || pathname === '/migration-status/g678-calibration/shared-alg001-l06-p004/continuous-v1'))
    return process.env.NODE_ENV === 'development' && !process.env.VERCEL && !process.env.VERCEL_ENV &&
      ['GET','HEAD'].includes(request.method) && isG678LocalPreviewRequestUrl(request.nextUrl) &&
      [...request.nextUrl.searchParams].every(([key,value])=>key==='_rsc'&&/^[A-Za-z0-9_-]{1,128}$/.test(value)) &&
      request.nextUrl.searchParams.getAll('_rsc').length<=1;
  if (pathname === '/migration-status/g678-calibration/shared-alg001-l06-p003/continuous-v2')
    return ['GET', 'HEAD'].includes(request.method) && isP003ContinuousHostSearch(request.nextUrl.searchParams, true) && isG678LocalPreviewRequestUrl(request.nextUrl);
  if (isAlgL12P006AdmissionPath(pathname)) {
    return isAlgL12P006AdmissionRequest({pathname, method: request.method, url: request.nextUrl});
  }
  if (isG678CalibrationProductPath(pathname)) {
    return isG678LocalPreviewRequestUrl(request.nextUrl);
  }
  if (
    pathname === '/migration-status/g4-l5-product-bridge' ||
    pathname === '/migration-status/g4-l10-product-bridge' ||
    pathname === '/migration-status/g4-l11-migration-factory'
  ) {
    return process.env.NODE_ENV !== 'production';
  }
  if (pathname === '/migration-status') {
    return isMigrationStatusAvailable()
      && isMigrationStatusDesignerViewRequested(
        request.nextUrl.searchParams.getAll('view'),
      );
  }
  if (pathname === '/courses/4/3') return true;
  const showcaseReleaseId = showcaseReleaseIdByCoursePath[pathname as
    | '/courses/3/2'
    | '/courses/4/5'
    | '/courses/4/10'
    | '/courses/4/11'
    | '/courses/5/3'
    | '/courses/5/4'
    | '/courses/5/5'];
  if (showcaseReleaseId) {
    return process.env.NODE_ENV !== 'production' || currentJsShowcasePublication(
      showcaseReleaseId,
    ).enabled;
  }
  if (isG678ModuleCoursePath(pathname)) {
    return isG678LocalPreviewRequestUrl(request.nextUrl);
  }
  // The module URL rewrites onto /courses/{grade}/{lesson}?moduleCode=.
  // That follow-up has no module segment, so the allowlist above misses it.
  const rewrittenModuleCode = request.nextUrl.searchParams.get('moduleCode') ?? '';
  if (
    /^\/courses\/[6-8]\/\d{1,2}$/u.test(pathname) &&
    isG678ModuleCode(rewrittenModuleCode) &&
    isG678LocalPreviewRequestUrl(request.nextUrl)
  ) {
    return true;
  }
  if (
    /^\/migration-status\/g678-course\/[a-z]{3}\d{3}\/\d{1,2}$/iu.test(pathname) &&
    isG678LocalPreviewRequestUrl(request.nextUrl)
  ) {
    return true;
  }
  if (process.env.NODE_ENV === 'production') return false;
  if (pathname === '/library') return true;
  if (/^\/courses\/[3-5]\/\d{1,2}$/u.test(pathname)) return true;
  if (/^\/animations\/[a-z0-9-]+$/u.test(pathname)) return true;
  return false;
}

function normalizePath(pathname: string) {
  return pathname.length > 1 ? pathname.replace(/\/$/u, '') : pathname;
}

function localeFreePath(pathname: string) {
  if (
    pathname === '/en'
    || pathname.startsWith('/en/')
    || pathname === '/es'
    || pathname.startsWith('/es/')
  ) {
    return pathname.slice(3) || '/';
  }
  return pathname;
}

function sharedCourseRouteParts(pathname: string) {
  const match = pathname.match(
    /^\/courses\/([6-8])\/([a-z]{3}\d{3})\/(\d{1,2})$/iu,
  );
  if (!match || !isG678ModuleCode(match[2]!)) return undefined;
  return Object.freeze({
    grade: match[1]!,
    moduleCode: match[2]!.toUpperCase(),
    lesson: match[3]!,
  });
}

function isAllowed(pathname: string, request: NextRequest) {
  const l10CanvasRequest={method:request.method,url:request.nextUrl,headers:request.headers};
  if(l10LessonCanvasResourceForRequest(l10CanvasRequest)!==null)return true;
  if(pathname===L10_P004_ASSET_ROOT||pathname.startsWith(`${L10_P004_ASSET_ROOT}/`))
    return [L10_P004_ORIGIN,'http://localhost:3331'].includes(request.nextUrl.origin)&&
      !request.nextUrl.username&&!request.nextUrl.password&&!request.nextUrl.hash&&
      l10P004ResourceForRequest({method:request.method,url:new URL(`${L10_P004_ORIGIN}${request.nextUrl.pathname}${request.nextUrl.search}`),headers:request.headers})!==null;
  if(l7CurrentResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers},'registered')!==null||l7CurrentResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers},'candidate')!==null)return true;
  for(const mode of ['candidate','registered'] as const)if(l8CurrentResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers},mode)!==null)return true;
  if(l8LessonCanvasResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  for(const mode of ['candidate','registered'] as const)if(l8P001ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers},mode)!==null)return true;
  if(p001ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers},'registered')!==null)return true;
  if(p001ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers},'candidate')!==null)return true;
  if(p060RegisteredResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p058RegisteredResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p057RegisteredResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p056RegisteredResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p033RegisteredResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p050RegisteredResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p049RegisteredResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p048RegisteredResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p047RegisteredResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p046RegisteredResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p045RegisteredResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p044RegisteredResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p060ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p058ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p057ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p056ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p033ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p050ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p049ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p048ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p047ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p046ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p045ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p044ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p043ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p042ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p041ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p038ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p035ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p034ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p032ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p028ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p027ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p026ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p025ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p024ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p023ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p022ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p021ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p020ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p019ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p018ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p017ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p016ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p015ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p014ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p013ResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(p010LessonCanvasResourceForRequest({method:request.method,url:request.nextUrl,headers:request.headers})!==null)return true;
  if(isP010PredecessorRequest({method:request.method,url:request.nextUrl,headers:request.headers}))return true;
  for (const resource of Object.keys(P010_RESOURCE_PINS) as P010Resource[])
    if (pathname===P010_RESOURCE_PINS[resource].path) return isP010ResourceRequest({method:request.method,url:request.nextUrl,headers:request.headers},resource);
  if(isP008PredecessorRequest({method:request.method,url:request.nextUrl,headers:request.headers}))return true;
  for (const resource of Object.keys(P008_RESOURCE_PINS) as P008Resource[])
    if (pathname===P008_RESOURCE_PINS[resource].path) return isP008ResourceRequest({method:request.method,url:request.nextUrl,headers:request.headers},resource);
  if(isP004PredecessorRequest({method:request.method,url:request.nextUrl,headers:request.headers}))return true;
  for (const resource of Object.keys(P004_RESOURCE_PINS) as P004Resource[])
    if (pathname===P004_RESOURCE_PINS[resource].path) return isP004ResourceRequest({method:request.method,url:request.nextUrl,headers:request.headers},resource);
  if(pathname===P003_OPTIONAL_SPANISH_PATH)return isP003OptionalSpanishRequest({method:request.method,url:request.nextUrl,headers:request.headers});
  if (pathname === '/flash-assets/g678-local/shared-alg001-l06-p003/continuous-source-v2')
    return isP003ContinuousSourceRequest({method: request.method, url: request.nextUrl, headers: request.headers});
  if (
    isLocalAuthEnabled()
    && (isLocalAuthPath(pathname) || isLocalAuthSessionApiPath(pathname))
  ) return true;
  if (isReferencePath(pathname)) {
    return isLocalReferenceDiagnosticRequestAllowed({
      headers: request.headers,
      url: request.nextUrl,
    });
  }
  if(pathname.startsWith(P047_AUDIO_PREFIX))return isP047AudioRequest({method:request.method,url:request.nextUrl,headers:request.headers});
  if (pathname.startsWith(DAT_L02_P002_AUDIO_PATH)) {
    return isDatL02P002SourceAudioRequest({
      method: request.method, url: request.nextUrl, headers: request.headers,
    });
  }
  if (pathname.startsWith(DAT_L02_P002_SYMBOL_PREFIX)) {
    return isDatL02P002SymbolRequest({
      method: request.method, url: request.nextUrl, headers: request.headers,
    });
  }
  if(pathname.startsWith('/flash-assets/g678-local/'+DAT_L05_SOURCE_AUDIO_ID+'/interactive-audio/'))return isDatL05SourceAudioRequest({method:request.method,url:request.nextUrl,headers:request.headers});
  if(pathname.startsWith('/flash-assets/g678-local/'+NMS_L11_SOURCE_AUDIO_ID+'/interactive-audio/'))return isNmsL11SourceAudioRequest({method:request.method,url:request.nextUrl,headers:request.headers});
  if(isContinuousSourceAudioPath(pathname))return isContinuousSourceAudioRequest({url:request.nextUrl,headers:request.headers});
  if (isG678CalibrationAssetPath(pathname)) {
    return isG678LocalPreviewRequestUrl(request.nextUrl) &&
      isG678SameOriginCanvasAssetRequest(request.headers, request.nextUrl);
  }
  const localAuditPath =
    pathname.startsWith('/flash-assets/')
    || pathname === '/demos/conversion-1-2'
    || pathname === '/demos/conversion-1-4';
  const assetSegments = pathname.startsWith('/flash-assets/')
    ? pathname.slice('/flash-assets/'.length).split('/')
    : [];
  const g4HostCompositePolicy =
    classifyG4L3HostCompositeAsset(assetSegments);
  const g5L4ShowcasePolicy = classifyG5L4PreviewAsset(assetSegments);
  // Generated audio is independently gated even in local development. This
  // check must run before the local-audit fallback below, or a showcase-only
  // deployment would advertise audio whose route is not publication-safe.
  if (
    g5L4ShowcasePolicy.kind === 'audio'
    && !isG5L4ShowcaseAudioAuthorized()
  ) {
    return false;
  }
  if (
    g4HostCompositePolicy.controlled
    && !hasExactG4L3HostCompositeDigest(
      request.nextUrl,
      g4HostCompositePolicy.expectedSha256 as string,
    )
  ) {
    return false;
  }
  if (
    g5L4ShowcasePolicy.controlled
    && (
      (
        g5L4ShowcasePolicy.kind === 'runtime'
        && !hasExactG5L4RuntimeDigest(
          request.nextUrl,
          g5L4ShowcasePolicy.expectedSha256 as string,
        )
      )
      || (
        g5L4ShowcasePolicy.kind === 'audio'
        && !hasExactG5L4AudioDigest(
          request.nextUrl,
          g5L4ShowcasePolicy.expectedSha256 as string,
        )
      )
    )
  ) {
    return false;
  }
  const publicShowcaseAsset = isG4L3ShowcaseAssetPath(pathname)
    && isG4L3ShowcaseAssetAuthorized();
  const publicG5L4ShowcaseAsset = isG5L4ShowcaseAssetSegments(assetSegments)
    && (
      g5L4ShowcasePolicy.kind === 'audio'
        ? isG5L4ShowcaseAudioAuthorized()
        : isG5L4ShowcaseAssetAuthorized()
    );
  const publicPageOnlyCurrentJsShowcaseAsset =
    isPageOnlyCurrentJsShowcaseAssetSegments(assetSegments)
    && isPageOnlyCurrentJsShowcaseAssetAuthorized(assetSegments);
  return publicPaths.has(pathname)
    || isArchivePath(pathname, request)
    || publicShowcaseAsset
    || publicG5L4ShowcaseAsset
    || publicPageOnlyCurrentJsShowcaseAsset
    || (process.env.NODE_ENV !== 'production' && localAuditPath);
}

function protectLocalReferenceDiagnosticResponse(response: NextResponse) {
  response.headers.set(
    'Content-Security-Policy',
    LOCAL_REFERENCE_DIAGNOSTIC_CONTENT_SECURITY_POLICY,
  );
  response.headers.set(
    'X-Robots-Tag',
    'noindex, nofollow, noarchive, noimageindex',
  );
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('X-Helpmath-Local-Reference-Diagnostic', 'forensic-only');
  return response;
}

function hfrLoopbackRewriteDocument(request: NextRequest): boolean {
  const host = request.headers.get('host');
  const forwarded = request.headers.get('x-forwarded-host');
  if (!host || !forwarded || host.includes(',') || forwarded.includes(',')) return false;
  let actual: URL;
  let via: URL;
  try {
    actual = new URL(`http://${host}`);
    via = new URL(`http://${forwarded}`);
  } catch {
    return false;
  }
  if (
    !isG678LoopbackHostname(request.nextUrl.hostname) ||
    !isG678LoopbackHostname(actual.hostname) ||
    !isG678LoopbackHostname(via.hostname) ||
    actual.port !== request.nextUrl.port ||
    via.port !== request.nextUrl.port
  ) return false;
  const headers = new Headers(request.headers);
  headers.delete('x-forwarded-host');
  return hfrDocumentRequest(request.nextUrl, headers, request.method) !== null;
}

export async function proxyForRequest(request: NextRequest) {
  if (/^\/(?:en|es)\/migration-status\/g678-hfr\//u.test(request.nextUrl.pathname) ||
      /^\/flash-assets\/g678-local\/[^/]+\/hfr\//u.test(request.nextUrl.pathname)) {
    const directDocument = hfrDocumentRequest(request.nextUrl, request.headers, request.method);
    const directAsset = hfrAssetRequest(request.nextUrl, request.headers, request.method);
    const rewrittenDocument = !directDocument && !directAsset && hfrLoopbackRewriteDocument(request);
    if (!directDocument && !directAsset && !rewrittenDocument) return notFoundResponse();
    const requestHeaders = new Headers(request.headers);
    if (rewrittenDocument) requestHeaders.delete('x-forwarded-host');
    const response = NextResponse.next({request: {headers: requestHeaders}});
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, noimageindex');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  const originalPath = normalizePath(request.nextUrl.pathname);
  const normalizedLocaleFree = normalizePath(localeFreePath(originalPath));
  if(originalPath===`${L10_P004_ROUTE}/candidate-v1`||originalPath===`${L10_P004_ROUTE}/registered-v1`){
    const english=request.nextUrl.clone();english.pathname=`/en${originalPath}`;
    if(!l10P004ProxyDocumentRequest(english,request.headers,request.method,originalPath.endsWith('/candidate-v1')?'candidate':'registered'))return notFoundResponse();
    english.hostname='127.0.0.1';
    const response=NextResponse.redirect(english,307);
    response.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
    response.headers.set('Cache-Control','private, no-store, max-age=0');return response;
  }
  for(const [route,check] of [[L8_P040_ROUTE,l8P040ProxyDocumentRequest],[L8_P050_ROUTE,l8P050ProxyDocumentRequest],[L8_P038_ROUTE,l8P038ProxyDocumentRequest],[L8_P039_ROUTE,l8P039ProxyDocumentRequest],[L8_P046_ROUTE,l8P046ProxyDocumentRequest],[L8_P047_ROUTE,l8P047ProxyDocumentRequest],[L8_P048_ROUTE,l8P048ProxyDocumentRequest],[L8_P037_ROUTE,l8P037ProxyDocumentRequest],[L8_P036_ROUTE,l8P036ProxyDocumentRequest],[L8_P035_ROUTE,l8P035ProxyDocumentRequest],[L8_P034_ROUTE,l8P034ProxyDocumentRequest],[L8_P033_ROUTE,l8P033ProxyDocumentRequest],[L8_P032_ROUTE,l8P032ProxyDocumentRequest],[L8_P031_ROUTE,l8P031ProxyDocumentRequest],[L8_P030_ROUTE,l8P030ProxyDocumentRequest],[L8_P029_ROUTE,l8P029ProxyDocumentRequest],[L8_P028_ROUTE,l8P028ProxyDocumentRequest],[L8_P027_ROUTE,l8P027ProxyDocumentRequest],[L8_P026_ROUTE,l8P026ProxyDocumentRequest],[L8_P024_ROUTE,l8P024ProxyDocumentRequest],[L8_P023_ROUTE,l8P023ProxyDocumentRequest],[L8_P022_ROUTE,l8P022ProxyDocumentRequest],[L8_P021_ROUTE,l8P021ProxyDocumentRequest],[L8_P020_ROUTE,l8P020ProxyDocumentRequest],[L8_P019_ROUTE,l8P019ProxyDocumentRequest],[L8_P018_ROUTE,l8P018ProxyDocumentRequest],[L8_P016_ROUTE,l8P016ProxyDocumentRequest],[L8_P015_ROUTE,l8P015ProxyDocumentRequest],[L8_P014_ROUTE,l8P014ProxyDocumentRequest],[L8_P013_ROUTE,l8P013ProxyDocumentRequest],[L8_P012_ROUTE,l8P012ProxyDocumentRequest],[L8_P011_ROUTE,l8P011ProxyDocumentRequest],[L8_P010_ROUTE,l8P010ProxyDocumentRequest],[L8_P009_ROUTE,l8P009ProxyDocumentRequest],[L8_P007_ROUTE,l8P007ProxyDocumentRequest],[L8_P006_ROUTE,l8P006ProxyDocumentRequest],[L8_P005_ROUTE,l8P005ProxyDocumentRequest],[L8_P001_ROUTE,l8P001ProxyDocumentRequest],[P002_ROUTE,p002ProxyDocumentRequest],[P003_ROUTE,p003ProxyDocumentRequest],[P006_ROUTE,p006ProxyDocumentRequest],[P007_ROUTE,p007ProxyDocumentRequest],[P009_ROUTE,p009ProxyDocumentRequest],[P010_ROUTE,p010ProxyDocumentRequest],[P011_ROUTE,p011ProxyDocumentRequest],[P012_ROUTE,p012ProxyDocumentRequest],[P013_ROUTE,p013ProxyDocumentRequest],[P014_ROUTE,p014ProxyDocumentRequest],[P015_ROUTE,p015ProxyDocumentRequest],[P016_ROUTE,p016ProxyDocumentRequest],[P017_ROUTE,p017ProxyDocumentRequest],[P018_ROUTE,p018ProxyDocumentRequest],[P019_ROUTE,p019ProxyDocumentRequest],[P020_ROUTE,p020ProxyDocumentRequest],[P021_ROUTE,l7P021ProxyDocumentRequest],[P022_ROUTE,l7P022ProxyDocumentRequest],[P023_ROUTE,l7P023ProxyDocumentRequest],[P025_ROUTE,l7P025ProxyDocumentRequest],[P026_ROUTE,l7P026ProxyDocumentRequest],[P027_ROUTE,l7P027ProxyDocumentRequest],[P030_ROUTE,l7P030ProxyDocumentRequest],[P031_ROUTE,l7P031ProxyDocumentRequest],[P032_ROUTE,l7P032ProxyDocumentRequest],[P033_ROUTE,l7P033ProxyDocumentRequest],[P034_ROUTE,l7P034ProxyDocumentRequest],[P036_ROUTE,l7P036ProxyDocumentRequest],[P037_ROUTE,l7P037ProxyDocumentRequest],[P038_ROUTE,l7P038ProxyDocumentRequest],[P039_ROUTE,l7P039ProxyDocumentRequest],[P040_ROUTE,l7P040ProxyDocumentRequest],[P041_ROUTE,l7P041ProxyDocumentRequest],[P043_ROUTE,l7P043ProxyDocumentRequest],[P050_ROUTE,l7P050ProxyDocumentRequest],[P058_ROUTE,l7P058ProxyDocumentRequest],[P062_ROUTE,l7P062ProxyDocumentRequest],[P060_ROUTE,l7P060ProxyDocumentRequest],[P059_ROUTE,l7P059ProxyDocumentRequest],[P052_ROUTE,l7P052ProxyDocumentRequest],[P051_ROUTE,l7P051ProxyDocumentRequest],[P049_ROUTE,l7P049ProxyDocumentRequest],[P048_ROUTE,l7P048ProxyDocumentRequest],[P046_ROUTE,l7P046ProxyDocumentRequest],[P047_ROUTE,l7P047ProxyDocumentRequest],[P045_ROUTE,l7P045ProxyDocumentRequest],[P044_ROUTE,l7P044ProxyDocumentRequest],[P042_ROUTE,l7P042ProxyDocumentRequest]] as const)for(const mode of ['candidate','registered'] as const)if(originalPath===`${route}/${mode}-v1`){const english=request.nextUrl.clone();english.pathname=`/en${originalPath}`;if(!check(english,request.headers,request.method,mode))return notFoundResponse();const response=NextResponse.redirect(english,307);response.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');response.headers.set('Cache-Control','private, no-store, max-age=0');return response;}
  if(originalPath===`${P001_ROUTE}/registered-v1`||originalPath===`${P001_ROUTE}/candidate-v1`){
    const english=request.nextUrl.clone();english.pathname=`/en${originalPath}`;
    const mode=originalPath.endsWith('/registered-v1')?'registered':'candidate';
    if(!p001ProxyDocumentRequest(english,request.headers,request.method,mode))return notFoundResponse();
    const response=NextResponse.redirect(english,307);
    response.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
    response.headers.set('Cache-Control','private, no-store, max-age=0');
    return response;
  }
  if (originalPath === P060_REGISTERED_PATH) {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p060RegisteredProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === P058_REGISTERED_PATH) {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p058RegisteredProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === P057_REGISTERED_PATH) {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p057RegisteredProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === P056_REGISTERED_PATH) {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p056RegisteredProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === P033_REGISTERED_PATH) {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p033RegisteredProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === P050_REGISTERED_PATH) {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p050RegisteredProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === P049_REGISTERED_PATH) {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p049RegisteredProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === P048_REGISTERED_PATH) {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p048RegisteredProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === P047_REGISTERED_PATH) {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p047RegisteredProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === P046_REGISTERED_PATH) {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p046RegisteredProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === P045_REGISTERED_PATH) {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p045RegisteredProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === P044_REGISTERED_PATH) {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p044RegisteredProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === '/migration-status/g678-calibration/shared-alg001-l06-p060/candidate-v1') {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p060ProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === '/migration-status/g678-calibration/shared-alg001-l06-p058/candidate-v1') {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p058ProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === '/migration-status/g678-calibration/shared-alg001-l06-p057/candidate-v1') {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p057ProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === '/migration-status/g678-calibration/shared-alg001-l06-p056/candidate-v1') {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p056ProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === '/migration-status/g678-calibration/shared-alg001-l06-p033/candidate-v1') {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p033ProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === '/migration-status/g678-calibration/shared-alg001-l06-p050/candidate-v1') {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p050ProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === '/migration-status/g678-calibration/shared-alg001-l06-p049/candidate-v1') {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p049ProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === '/migration-status/g678-calibration/shared-alg001-l06-p048/candidate-v1') {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p048ProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === '/migration-status/g678-calibration/shared-alg001-l06-p047/candidate-v1') {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p047ProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === '/migration-status/g678-calibration/shared-alg001-l06-p046/candidate-v1') {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p046ProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === '/migration-status/g678-calibration/shared-alg001-l06-p045/candidate-v1') {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p045ProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === '/migration-status/g678-calibration/shared-alg001-l06-p044/candidate-v1') {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p044ProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === '/migration-status/g678-calibration/shared-alg001-l06-p043/candidate-v1') {
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p043ProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (originalPath === '/migration-status/g678-calibration/shared-alg001-l06-p042/candidate-v1') {
    // The language switch omits the default-locale prefix. Redirect this one
    // local audit URL to its exact source-authorized English document path.
    const english = request.nextUrl.clone();
    english.pathname = `/en${originalPath}`;
    if (!p042ProxyDocumentRequest(english, request.headers, request.method))
      return notFoundResponse();
    const response = NextResponse.redirect(english, 307);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }
  if (!isAllowed(normalizedLocaleFree, request)) return notFoundResponse();
  // The flash-asset route is intentionally locale-free. Rewriting it through
  // the default locale turns `/flash-assets/<x>` into `/en/flash-assets/<x>`,
  // where no route exists, so source-bound images and Canvas runtimes fail as
  // 404s before their own integrity policy can evaluate them.
  const localeFreeAsset = originalPath.startsWith('/flash-assets/');
  const localeFreeAuthApi = isLocalAuthSessionApiPath(originalPath);
  const localePrefixed = originalPath === '/en'
    || originalPath.startsWith('/en/')
    || originalPath === '/es'
    || originalPath.startsWith('/es/');
  const sharedRoute = sharedCourseRouteParts(normalizedLocaleFree);
  const gradeLessonMatch = normalizedLocaleFree.match(/^\/courses\/([6-8])\/(\d{1,2})$/u);
  const queryModuleCode = request.nextUrl.searchParams.get('moduleCode')?.trim().toUpperCase();
  const querySharedRoute = !sharedRoute && gradeLessonMatch && queryModuleCode &&
    isG678ModuleCode(queryModuleCode) && isG678LocalPreviewRequestUrl(request.nextUrl)
    ? Object.freeze({
        grade: gradeLessonMatch[1]!,
        moduleCode: queryModuleCode,
        lesson: gradeLessonMatch[2]!,
      })
    : undefined;
  const previewRoute = sharedRoute ?? querySharedRoute;
  const g678CalibrationRoute = normalizedLocaleFree === `${L10_P004_ROUTE}/candidate-v1` || normalizedLocaleFree === `${L10_P004_ROUTE}/registered-v1` ||
    [L8_P040_ROUTE,L8_P050_ROUTE,L8_P038_ROUTE,L8_P039_ROUTE,L8_P046_ROUTE,L8_P047_ROUTE,L8_P048_ROUTE,L8_P037_ROUTE,L8_P036_ROUTE,L8_P035_ROUTE,L8_P034_ROUTE,L8_P033_ROUTE,L8_P032_ROUTE,L8_P031_ROUTE,L8_P030_ROUTE,L8_P029_ROUTE,L8_P028_ROUTE,L8_P027_ROUTE,L8_P026_ROUTE,L8_P024_ROUTE,L8_P023_ROUTE,L8_P022_ROUTE,L8_P021_ROUTE,L8_P020_ROUTE,L8_P019_ROUTE,L8_P018_ROUTE,L8_P016_ROUTE,L8_P015_ROUTE,L8_P014_ROUTE,L8_P013_ROUTE,L8_P012_ROUTE,L8_P011_ROUTE,L8_P010_ROUTE,L8_P009_ROUTE,L8_P007_ROUTE,L8_P006_ROUTE,L8_P005_ROUTE,L8_P001_ROUTE,P002_ROUTE,P003_ROUTE,P006_ROUTE,P007_ROUTE,P009_ROUTE,P010_ROUTE,P011_ROUTE,P012_ROUTE,P013_ROUTE,P014_ROUTE,P015_ROUTE,P016_ROUTE,P017_ROUTE,P018_ROUTE,P019_ROUTE,P020_ROUTE,P021_ROUTE,P022_ROUTE,P023_ROUTE,P025_ROUTE,P026_ROUTE,P027_ROUTE,P030_ROUTE,P031_ROUTE,P032_ROUTE,P033_ROUTE,P034_ROUTE,P036_ROUTE,P037_ROUTE,P038_ROUTE,P039_ROUTE,P040_ROUTE,P041_ROUTE,P062_ROUTE,P060_ROUTE,P059_ROUTE,P058_ROUTE,P052_ROUTE,P051_ROUTE,P050_ROUTE,P049_ROUTE,P048_ROUTE,P046_ROUTE,P047_ROUTE,P045_ROUTE,P044_ROUTE,P043_ROUTE,P042_ROUTE].some(route=>['candidate','registered'].some(mode=>normalizedLocaleFree===`${route}/${mode}-v1`)) ||
    normalizedLocaleFree === `${P001_ROUTE}/registered-v1` ||
    normalizedLocaleFree === `${P001_ROUTE}/candidate-v1` ||
    normalizedLocaleFree === P060_REGISTERED_PATH ||
    normalizedLocaleFree === P058_REGISTERED_PATH ||
    normalizedLocaleFree === P057_REGISTERED_PATH ||
    normalizedLocaleFree === P056_REGISTERED_PATH ||
    normalizedLocaleFree === P033_REGISTERED_PATH ||
    normalizedLocaleFree === P050_REGISTERED_PATH ||
    normalizedLocaleFree === P049_REGISTERED_PATH ||
    normalizedLocaleFree === P048_REGISTERED_PATH ||
    normalizedLocaleFree === P047_REGISTERED_PATH ||
    normalizedLocaleFree === P046_REGISTERED_PATH ||
normalizedLocaleFree === P045_REGISTERED_PATH ||
    normalizedLocaleFree === P044_REGISTERED_PATH ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p060/candidate-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p058/candidate-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p057/candidate-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p056/candidate-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p033/candidate-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p050/candidate-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p049/candidate-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p048/candidate-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p047/candidate-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p046/candidate-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p045/candidate-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p044/candidate-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p043/candidate-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p042/candidate-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p042/continuous-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p041/candidate-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p041/continuous-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p038/candidate-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p038/continuous-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p035/candidate-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p035/continuous-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p034/candidate-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p034/continuous-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p032/candidate-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p032/continuous-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p028/candidate-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p028/continuous-v1' ||
    normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p027/candidate-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p027/continuous-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p026/candidate-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p026/continuous-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p025/candidate-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p025/continuous-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p024/candidate-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p024/continuous-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p023/continuous-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p023/candidate-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p022/candidate-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p022/continuous-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p021/candidate-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p021/continuous-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p020/continuous-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p020/candidate-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p019/continuous-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p019/candidate-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p018/continuous-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p018/candidate-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p017/continuous-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p017/candidate-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p016/continuous-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p016/candidate-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p015/continuous-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p015/candidate-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p014/continuous-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p014/candidate-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p013/continuous-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p013/candidate-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p010/continuous-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p010/candidate-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p008/candidate-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p008/continuous-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p004/candidate-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p004/continuous-v1' || normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p003/continuous-v2' || isAlgL12P006AdmissionPath(normalizedLocaleFree) || isG678CalibrationProductPath(
    normalizedLocaleFree,
  );
  let response: NextResponse;
  if (previewRoute) {
    // Local preview mounts the registered HFR lesson player. The course page
    // stays closed until grade mapping is approved, and a rewrite back onto
    // /courses/{grade}/{lesson} is rejected by the allowlist.
    const rewritten = request.nextUrl.clone();
    const localePrefix = originalPath === '/es' || originalPath.startsWith('/es/')
      ? '/es'
      : originalPath === '/en' || originalPath.startsWith('/en/')
        ? '/en'
        : `/${routing.defaultLocale}`;
    rewritten.pathname = `${localePrefix}/migration-status/g678-course/${previewRoute.moduleCode.toLowerCase()}/${Number(previewRoute.lesson)}`;
    rewritten.search = '';
    response = NextResponse.rewrite(rewritten);
  } else if (normalizedLocaleFree === '/migration-status/g678-calibration/shared-alg001-l06-p038/candidate-v1') {
    // The exact local document is served by a same-app beforeFiles rewrite.
    // Keep its browser URL as the source-asset referer.
    response = NextResponse.next();
  } else {
    response = localePrefixed || localeFreeAsset || localeFreeAuthApi
      ? NextResponse.next()
      : (() => {
          const rewritten = request.nextUrl.clone();
          rewritten.pathname = `/${routing.defaultLocale}${originalPath === '/' ? '' : originalPath}`;
          return NextResponse.rewrite(rewritten);
        })();
  }

  if (previewRoute || g678CalibrationRoute) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  }

  if (isReferencePath(normalizedLocaleFree)) {
    return protectLocalReferenceDiagnosticResponse(response);
  }
  return response;
}

const clerkAwareProxy = clerkMiddleware(
  (_auth, request) => proxyForRequest(request),
);

export function normalizeLocalClerkMiddlewareResponse(
  response: Response,
  requestUrl: URL,
) {
  const rewrite = response.headers.get('x-middleware-rewrite');
  if (!rewrite) return response;
  try {
    const rewriteUrl = new URL(rewrite, requestUrl);
    const sameLoopbackContinuation = requestUrl.protocol === 'http:'
      && rewriteUrl.protocol === 'http:'
      && loopbackHosts.has(requestUrl.hostname)
      && loopbackHosts.has(rewriteUrl.hostname)
      && requestUrl.port === rewriteUrl.port
      && requestUrl.pathname === rewriteUrl.pathname
      && requestUrl.search === rewriteUrl.search;
    if (!sameLoopbackContinuation) return response;
    response.headers.delete('x-middleware-rewrite');
    response.headers.set('x-middleware-next', '1');
  } catch {
    return response;
  }
  return response;
}

export default async function proxy(
  request: NextRequest,
  event?: NextFetchEvent,
): Promise<Response> {
  if (isLocalAuthSessionApiPath(request.nextUrl.pathname)) {
    if (!isLocalAuthEnabled() || !event) return NextResponse.next();
    const response = await clerkAwareProxy(request, event) ?? NextResponse.next();
    return normalizeLocalClerkMiddlewareResponse(response, request.nextUrl);
  }
  if (!isLocalAuthEnabled() || !event) return proxyForRequest(request);
  const response = await clerkAwareProxy(request, event) ?? NextResponse.next();
  return normalizeLocalClerkMiddlewareResponse(response, request.nextUrl);
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
    '/flash-assets/:path*',
    '/api/auth/session',
  ],
};
