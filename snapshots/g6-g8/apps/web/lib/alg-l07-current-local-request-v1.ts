import{P062_RESOURCE_PINS}from'./alg-l07-p062-local-request-v1';
import{P060_RESOURCE_PINS}from'./alg-l07-p060-local-request-v1';
import{P059_RESOURCE_PINS}from'./alg-l07-p059-local-request-v1';
import{P058_RESOURCE_PINS}from'./alg-l07-p058-local-request-v1';
import{P052_RESOURCE_PINS}from'./alg-l07-p052-local-request-v1';
import{P051_RESOURCE_PINS}from'./alg-l07-p051-local-request-v1';
import{P050_RESOURCE_PINS}from'./alg-l07-p050-local-request-v1';
import{P049_RESOURCE_PINS}from'./alg-l07-p049-local-request-v1';
import{P048_RESOURCE_PINS}from'./alg-l07-p048-local-request-v1';
import{P046_RESOURCE_PINS}from'./alg-l07-p046-local-request-v1';
import{P047_RESOURCE_PINS}from'./alg-l07-p047-local-request-v1';
import{P045_RESOURCE_PINS}from'./alg-l07-p045-local-request-v1';
import{P044_RESOURCE_PINS}from'./alg-l07-p044-local-request-v1';
import{P043_RESOURCE_PINS}from'./alg-l07-p043-local-request-v1';
import{P042_RESOURCE_PINS}from'./alg-l07-p042-local-request-v1';
import{P041_RESOURCE_PINS}from'./alg-l07-p041-local-request-v1';
import{P040_RESOURCE_PINS}from'./alg-l07-p040-local-request-v1';
import{P039_RESOURCE_PINS}from'./alg-l07-p039-local-request-v1';
import{P038_RESOURCE_PINS}from'./alg-l07-p038-local-request-v1';
import{P037_RESOURCE_PINS}from'./alg-l07-p037-local-request-v1';
import{P036_RESOURCE_PINS}from'./alg-l07-p036-local-request-v1';
import{P034_RESOURCE_PINS}from'./alg-l07-p034-local-request-v1';
import{P033_RESOURCE_PINS}from'./alg-l07-p033-local-request-v1';
import{P032_RESOURCE_PINS}from'./alg-l07-p032-local-request-v1';
import{P031_RESOURCE_PINS}from'./alg-l07-p031-local-request-v1';
import{P030_RESOURCE_PINS}from'./alg-l07-p030-local-request-v1';
import{P027_RESOURCE_PINS}from'./alg-l07-p027-local-request-v1';
import{P026_RESOURCE_PINS}from'./alg-l07-p026-local-request-v1';
import{P025_RESOURCE_PINS}from'./alg-l07-p025-local-request-v1';
import{P023_RESOURCE_PINS}from'./alg-l07-p023-local-request-v1';
import{P022_RESOURCE_PINS}from'./alg-l07-p022-local-request-v1';
import{P021_RESOURCE_PINS}from'./alg-l07-p021-local-request-v1';
import{P020_RESOURCE_PINS}from'./alg-l07-p020-local-request-v1';
import{P019_RESOURCE_PINS}from'./alg-l07-p019-local-request-v1';
import{P018_RESOURCE_PINS}from'./alg-l07-p018-local-request-v1';
import{P017_RESOURCE_PINS}from'./alg-l07-p017-local-request-v1';
import{P016_RESOURCE_PINS}from'./alg-l07-p016-local-request-v1';
import{P015_RESOURCE_PINS}from'./alg-l07-p015-local-request-v1';
import{P014_RESOURCE_PINS}from'./alg-l07-p014-local-request-v1';
import{P013_RESOURCE_PINS}from'./alg-l07-p013-local-request-v1';
import{P012_RESOURCE_PINS}from'./alg-l07-p012-local-request-v1';
import{P011_RESOURCE_PINS}from'./alg-l07-p011-local-request-v1';
import{P010_RESOURCE_PINS}from'./alg-l07-p010-local-request-v1';
import{P009_RESOURCE_PINS}from'./alg-l07-p009-local-request-v1';
import{P007_RESOURCE_PINS}from'./alg-l07-p007-local-request-v1';
import{P006_RESOURCE_PINS}from'./alg-l07-p006-local-request-v1';
import{isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,type G678PreviewEnvironment}from'./g678-preview-policy';
import{P001_RESOURCE_PINS}from'./alg-l07-p001-local-request-v1';
import{P002_RESOURCE_PINS}from'./alg-l07-p002-local-request-v1';
import{P003_RESOURCE_PINS}from'./alg-l07-p003-local-request-v1';
import{l7CurrentDocumentReferer,l7LocalDevelopment,L7_LOCAL_ORIGIN}from'./alg-l07-current-local-documents-v1';
// These two source-bound loaders have different request modes: P002 uses anonymous CORS plus SRI; P003 inserts a plain same-origin script.
if(P002_RESOURCE_PINS['native-canvas-renderer.js'].destination!=='script'||P002_RESOURCE_PINS['native-canvas-renderer.js'].mode!=='cors'||P003_RESOURCE_PINS['canvas-renderer.js'].destination!=='script'||P003_RESOURCE_PINS['canvas-renderer.js'].mode!=='no-cors')throw Error('L7_CURRENT_NATIVE_LOADER_REQUEST_CONTRACT');
type Row={originalPath:string;path:string;bytes:number;sha256:string;contentType:string;destination:string;mode:string;owner:'p001'|'p002'|'p003'|'p006'|'p007'|'p009'|'p010'|'p011'|'p012'|'p013'|'p014'|'p015'|'p016'|'p017'|'p018'|'p019'|'p020'|'p021'|'p022'|'p023'|'p025'|'p026'|'p027'|'p030'|'p031'|'p032'|'p033'|'p034'|'p036'|'p037'|'p038'|'p039'|'p040'|'p041'|'p042'|'p043'|'p044'|'p045'|'p047'|'p046'|'p048'|'p049'|'p050'|'p051'|'p052'|'p058'|'p059'|'p060'|'p062';resource:string};
const row=(pin:Omit<Row,'owner'|'resource'|'destination'|'mode'>&Partial<Pick<Row,'destination'|'mode'>>,owner:Row['owner'],resource:string):Row=>Object.freeze({...pin,destination:pin.destination??'empty',mode:pin.mode??'cors',owner,resource});
export const L7_CURRENT_RESOURCE_PINS:Readonly<Record<string,Row>>=Object.freeze({
 ...Object.fromEntries(Object.entries(P062_RESOURCE_PINS).map(([token,pin])=>[`p062-${token}`,row(pin,'p062',token)])),
 'p060-feedback-61':row(P060_RESOURCE_PINS['feedback-61'],'p060','feedback-61'),
 'p060-feedback-95':row(P060_RESOURCE_PINS['feedback-95'],'p060','feedback-95'),
 'p060-feedback-120':row(P060_RESOURCE_PINS['feedback-120'],'p060','feedback-120'),
 'p060-feedback-133':row(P060_RESOURCE_PINS['feedback-133'],'p060','feedback-133'),
 'p060-feedback-147':row(P060_RESOURCE_PINS['feedback-147'],'p060','feedback-147'),
 'p060-feedback-158':row(P060_RESOURCE_PINS['feedback-158'],'p060','feedback-158'),
 'p060-feedback-176':row(P060_RESOURCE_PINS['feedback-176'],'p060','feedback-176'),
 'p060-source-stream':row(P060_RESOURCE_PINS['source-stream'],'p060','source-stream'),
 'p060-optional-spanish-audio':row(P060_RESOURCE_PINS['optional-spanish-audio'],'p060','optional-spanish-audio'),

 'p059-feedback-38':row(P059_RESOURCE_PINS['feedback-38'],'p059','feedback-38'),
 'p059-feedback-55':row(P059_RESOURCE_PINS['feedback-55'],'p059','feedback-55'),
 'p059-feedback-88':row(P059_RESOURCE_PINS['feedback-88'],'p059','feedback-88'),
 'p059-feedback-100':row(P059_RESOURCE_PINS['feedback-100'],'p059','feedback-100'),
 'p059-feedback-112':row(P059_RESOURCE_PINS['feedback-112'],'p059','feedback-112'),
 'p059-feedback-140':row(P059_RESOURCE_PINS['feedback-140'],'p059','feedback-140'),
 'p059-source-stream':row(P059_RESOURCE_PINS['source-stream'],'p059','source-stream'),
 'p059-feedback-67':row(P059_RESOURCE_PINS['feedback-67'],'p059','feedback-67'),
 'p059-optional-spanish-audio':row(P059_RESOURCE_PINS['optional-spanish-audio'],'p059','optional-spanish-audio'),

 'p058-source-stream':row(P058_RESOURCE_PINS['source-stream'],'p058','source-stream'),
 'p058-feedback-60':row(P058_RESOURCE_PINS['feedback-60'],'p058','feedback-60'),
 'p058-feedback-94':row(P058_RESOURCE_PINS['feedback-94'],'p058','feedback-94'),
 'p058-feedback-119':row(P058_RESOURCE_PINS['feedback-119'],'p058','feedback-119'),
 'p058-feedback-132':row(P058_RESOURCE_PINS['feedback-132'],'p058','feedback-132'),
 'p058-feedback-146':row(P058_RESOURCE_PINS['feedback-146'],'p058','feedback-146'),
 'p058-feedback-157':row(P058_RESOURCE_PINS['feedback-157'],'p058','feedback-157'),
 'p058-feedback-175':row(P058_RESOURCE_PINS['feedback-175'],'p058','feedback-175'),
 'p058-optional-spanish-audio':row(P058_RESOURCE_PINS['optional-spanish-audio'],'p058','optional-spanish-audio'),

 'p052-feedback-157':row(P052_RESOURCE_PINS['feedback-157'],'p052','feedback-157'),
 'p052-feedback-170':row(P052_RESOURCE_PINS['feedback-170'],'p052','feedback-170'),
 'p052-optional-spanish-audio':row(P052_RESOURCE_PINS['optional-spanish-audio'],'p052','optional-spanish-audio'),
 'p052-bitmap-77.png':row(P052_RESOURCE_PINS['bitmap-77.png'],'p052','bitmap-77.png'),
 'p052-bitmap-222.png':row(P052_RESOURCE_PINS['bitmap-222.png'],'p052','bitmap-222.png'),

 'p051-source-stream':row(P051_RESOURCE_PINS['source-stream'],'p051','source-stream'),
 'p051-optional-spanish-audio':row(P051_RESOURCE_PINS['optional-spanish-audio'],'p051','optional-spanish-audio'),

 'p050-source-stream':row(P050_RESOURCE_PINS['source-stream'],'p050','source-stream'),
 'p050-optional-spanish-audio':row(P050_RESOURCE_PINS['optional-spanish-audio'],'p050','optional-spanish-audio'),
 'p050-feedback-257':row(P050_RESOURCE_PINS['feedback-257'],'p050','feedback-257'),
 'p050-feedback-340':row(P050_RESOURCE_PINS['feedback-340'],'p050','feedback-340'),

 'p049-source-stream':row(P049_RESOURCE_PINS['source-stream'],'p049','source-stream'),
 'p049-optional-spanish-audio':row(P049_RESOURCE_PINS['optional-spanish-audio'],'p049','optional-spanish-audio'),
 'p049-feedback-154':row(P049_RESOURCE_PINS['feedback-154'],'p049','feedback-154'),
 'p049-feedback-238':row(P049_RESOURCE_PINS['feedback-238'],'p049','feedback-238'),

 'p048-source-stream':row(P048_RESOURCE_PINS['source-stream'],'p048','source-stream'),
 'p048-optional-spanish-audio':row(P048_RESOURCE_PINS['optional-spanish-audio'],'p048','optional-spanish-audio'),
 'p048-feedback-234':row(P048_RESOURCE_PINS['feedback-234'],'p048','feedback-234'),
 'p048-feedback-317':row(P048_RESOURCE_PINS['feedback-317'],'p048','feedback-317'),

 'p046-source-stream':row(P046_RESOURCE_PINS['source-stream'],'p046','source-stream'),
 'p046-optional-spanish-audio':row(P046_RESOURCE_PINS['optional-spanish-audio'],'p046','optional-spanish-audio'),
 'p046-feedback-143':row(P046_RESOURCE_PINS['feedback-143'],'p046','feedback-143'),
 'p046-feedback-158':row(P046_RESOURCE_PINS['feedback-158'],'p046','feedback-158'),
 'p046-feedback-173':row(P046_RESOURCE_PINS['feedback-173'],'p046','feedback-173'),
 'p046-feedback-213':row(P046_RESOURCE_PINS['feedback-213'],'p046','feedback-213'),
 'p046-feedback-264':row(P046_RESOURCE_PINS['feedback-264'],'p046','feedback-264'),
 'p046-feedback-230':row(P046_RESOURCE_PINS['feedback-230'],'p046','feedback-230'),
 'p046-feedback-244':row(P046_RESOURCE_PINS['feedback-244'],'p046','feedback-244'),

 'p047-source-stream':row(P047_RESOURCE_PINS['source-stream'],'p047','source-stream'),
 'p047-optional-spanish-audio':row(P047_RESOURCE_PINS['optional-spanish-audio'],'p047','optional-spanish-audio'),
 'p047-feedback-333':row(P047_RESOURCE_PINS['feedback-333'],'p047','feedback-333'),
 'p047-feedback-415':row(P047_RESOURCE_PINS['feedback-415'],'p047','feedback-415'),

 'p045-source-stream':row(P045_RESOURCE_PINS['source-stream'],'p045','source-stream'),
 'p045-optional-spanish-audio':row(P045_RESOURCE_PINS['optional-spanish-audio'],'p045','optional-spanish-audio'),
 'p045-feedback-317':row(P045_RESOURCE_PINS['feedback-317'],'p045','feedback-317'),
 'p045-feedback-399':row(P045_RESOURCE_PINS['feedback-399'],'p045','feedback-399'),

 'p044-source-stream':row(P044_RESOURCE_PINS['source-stream'],'p044','source-stream'),
 'p044-optional-spanish-audio':row(P044_RESOURCE_PINS['optional-spanish-audio'],'p044','optional-spanish-audio'),
 'p044-feedback-328':row(P044_RESOURCE_PINS['feedback-328'],'p044','feedback-328'),
 'p044-feedback-409':row(P044_RESOURCE_PINS['feedback-409'],'p044','feedback-409'),

 'p043-source-stream':row(P043_RESOURCE_PINS['source-stream'],'p043','source-stream'),
 'p043-optional-spanish-audio':row(P043_RESOURCE_PINS['optional-spanish-audio'],'p043','optional-spanish-audio'),
 'p043-feedback-314':row(P043_RESOURCE_PINS['feedback-314'],'p043','feedback-314'),
 'p043-feedback-396':row(P043_RESOURCE_PINS['feedback-396'],'p043','feedback-396'),

 'p042-source-stream':row(P042_RESOURCE_PINS['source-stream'],'p042','source-stream'),
 'p042-optional-spanish-audio':row(P042_RESOURCE_PINS['optional-spanish-audio'],'p042','optional-spanish-audio'),
 'p042-feedback-255':row(P042_RESOURCE_PINS['feedback-255'],'p042','feedback-255'),
 'p042-feedback-339':row(P042_RESOURCE_PINS['feedback-339'],'p042','feedback-339'),

 'p041-source-stream':row(P041_RESOURCE_PINS['source-stream'],'p041','source-stream'),
 'p041-optional-spanish-audio':row(P041_RESOURCE_PINS['optional-spanish-audio'],'p041','optional-spanish-audio'),
 'p041-feedback-109':row(P041_RESOURCE_PINS['feedback-109'],'p041','feedback-109'),
 'p041-feedback-126':row(P041_RESOURCE_PINS['feedback-126'],'p041','feedback-126'),
 'p041-feedback-147':row(P041_RESOURCE_PINS['feedback-147'],'p041','feedback-147'),
 'p041-feedback-159':row(P041_RESOURCE_PINS['feedback-159'],'p041','feedback-159'),
 'p041-feedback-186':row(P041_RESOURCE_PINS['feedback-186'],'p041','feedback-186'),
 'p041-feedback-200':row(P041_RESOURCE_PINS['feedback-200'],'p041','feedback-200'),

 'p040-source-stream':row(P040_RESOURCE_PINS['source-stream'],'p040','source-stream'),
 'p040-optional-spanish-audio':row(P040_RESOURCE_PINS['optional-spanish-audio'],'p040','optional-spanish-audio'),
 'p040-feedback-237':row(P040_RESOURCE_PINS['feedback-237'],'p040','feedback-237'),
 'p040-feedback-319':row(P040_RESOURCE_PINS['feedback-319'],'p040','feedback-319'),

 'p039-source-stream':row(P039_RESOURCE_PINS['source-stream'],'p039','source-stream'),
 'p039-optional-spanish-audio':row(P039_RESOURCE_PINS['optional-spanish-audio'],'p039','optional-spanish-audio'),
 'p039-feedback-280':row(P039_RESOURCE_PINS['feedback-280'],'p039','feedback-280'),
 'p039-feedback-361':row(P039_RESOURCE_PINS['feedback-361'],'p039','feedback-361'),

 'p038-source-stream':row(P038_RESOURCE_PINS['source-stream'],'p038','source-stream'),
 'p038-optional-spanish-audio':row(P038_RESOURCE_PINS['optional-spanish-audio'],'p038','optional-spanish-audio'),
 'p038-feedback-104':row(P038_RESOURCE_PINS['feedback-104'],'p038','feedback-104'),
 'p038-feedback-138':row(P038_RESOURCE_PINS['feedback-138'],'p038','feedback-138'),
 'p038-feedback-146':row(P038_RESOURCE_PINS['feedback-146'],'p038','feedback-146'),
 'p038-feedback-160':row(P038_RESOURCE_PINS['feedback-160'],'p038','feedback-160'),
 'p038-feedback-185':row(P038_RESOURCE_PINS['feedback-185'],'p038','feedback-185'),
 'p038-feedback-200':row(P038_RESOURCE_PINS['feedback-200'],'p038','feedback-200'),
 'p038-feedback-231':row(P038_RESOURCE_PINS['feedback-231'],'p038','feedback-231'),

 'p037-source-stream':row(P037_RESOURCE_PINS['source-stream'],'p037','source-stream'),
 'p037-feedback-57':row(P037_RESOURCE_PINS['feedback-57'],'p037','feedback-57'),
 'p037-optional-spanish-audio':row(P037_RESOURCE_PINS['optional-spanish-audio'],'p037','optional-spanish-audio'),

 'p036-source-stream':row(P036_RESOURCE_PINS['source-stream'],'p036','source-stream'),
 'p036-optional-spanish-audio':row(P036_RESOURCE_PINS['optional-spanish-audio'],'p036','optional-spanish-audio'),
 'p036-feedback-63':row(P036_RESOURCE_PINS['feedback-63'],'p036','feedback-63'),
 'p036-feedback-51':row(P036_RESOURCE_PINS['feedback-51'],'p036','feedback-51'),
 'p036-feedback-89':row(P036_RESOURCE_PINS['feedback-89'],'p036','feedback-89'),
 'p036-feedback-114':row(P036_RESOURCE_PINS['feedback-114'],'p036','feedback-114'),
 'p036-feedback-159':row(P036_RESOURCE_PINS['feedback-159'],'p036','feedback-159'),
 'p036-feedback-128':row(P036_RESOURCE_PINS['feedback-128'],'p036','feedback-128'),
 'p036-feedback-75':row(P036_RESOURCE_PINS['feedback-75'],'p036','feedback-75'),

 'p034-source-stream':row(P034_RESOURCE_PINS['source-stream'],'p034','source-stream'),
 'p034-optional-spanish-audio':row(P034_RESOURCE_PINS['optional-spanish-audio'],'p034','optional-spanish-audio'),
 'p034-feedback-60':row(P034_RESOURCE_PINS['feedback-60'],'p034','feedback-60'),
 'p034-feedback-62':row(P034_RESOURCE_PINS['feedback-62'],'p034','feedback-62'),

 'p033-source-stream':row(P033_RESOURCE_PINS['source-stream'],'p033','source-stream'),
 'p033-optional-spanish-audio':row(P033_RESOURCE_PINS['optional-spanish-audio'],'p033','optional-spanish-audio'),
 'p033-feedback-90':row(P033_RESOURCE_PINS['feedback-90'],'p033','feedback-90'),
 'p033-feedback-57':row(P033_RESOURCE_PINS['feedback-57'],'p033','feedback-57'),
 'p033-feedback-115':row(P033_RESOURCE_PINS['feedback-115'],'p033','feedback-115'),
 'p033-feedback-143':row(P033_RESOURCE_PINS['feedback-143'],'p033','feedback-143'),
 'p033-feedback-177':row(P033_RESOURCE_PINS['feedback-177'],'p033','feedback-177'),
 'p033-feedback-157':row(P033_RESOURCE_PINS['feedback-157'],'p033','feedback-157'),
 'p033-feedback-102':row(P033_RESOURCE_PINS['feedback-102'],'p033','feedback-102'),

 'p032-source-stream':row(P032_RESOURCE_PINS['source-stream'],'p032','source-stream'),
 'p032-optional-spanish-audio':row(P032_RESOURCE_PINS['optional-spanish-audio'],'p032','optional-spanish-audio'),

 'p031-source-stream':row(P031_RESOURCE_PINS['source-stream'],'p031','source-stream'),
 'p031-optional-spanish-audio':row(P031_RESOURCE_PINS['optional-spanish-audio'],'p031','optional-spanish-audio'),
 'p031-feedback-69':row(P031_RESOURCE_PINS['feedback-69'],'p031','feedback-69'),
 'p031-feedback-81':row(P031_RESOURCE_PINS['feedback-81'],'p031','feedback-81'),
 'p031-feedback-106':row(P031_RESOURCE_PINS['feedback-106'],'p031','feedback-106'),
 'p031-feedback-131':row(P031_RESOURCE_PINS['feedback-131'],'p031','feedback-131'),
 'p031-feedback-144':row(P031_RESOURCE_PINS['feedback-144'],'p031','feedback-144'),
 'p031-feedback-159':row(P031_RESOURCE_PINS['feedback-159'],'p031','feedback-159'),
 'p031-feedback-93':row(P031_RESOURCE_PINS['feedback-93'],'p031','feedback-93'),

 'p030-source-stream':row(P030_RESOURCE_PINS['source-stream'],'p030','source-stream'),
 'p030-optional-spanish-audio':row(P030_RESOURCE_PINS['optional-spanish-audio'],'p030','optional-spanish-audio'),
 'p030-feedback-82':row(P030_RESOURCE_PINS['feedback-82'],'p030','feedback-82'),
 'p030-feedback-110':row(P030_RESOURCE_PINS['feedback-110'],'p030','feedback-110'),
 'p030-feedback-135':row(P030_RESOURCE_PINS['feedback-135'],'p030','feedback-135'),
 'p030-feedback-151':row(P030_RESOURCE_PINS['feedback-151'],'p030','feedback-151'),
 'p030-feedback-172':row(P030_RESOURCE_PINS['feedback-172'],'p030','feedback-172'),
 'p030-feedback-198':row(P030_RESOURCE_PINS['feedback-198'],'p030','feedback-198'),
 'p030-feedback-229':row(P030_RESOURCE_PINS['feedback-229'],'p030','feedback-229'),
 'p030-feedback-250':row(P030_RESOURCE_PINS['feedback-250'],'p030','feedback-250'),

 'p027-source-stream':row(P027_RESOURCE_PINS['source-stream'],'p027','source-stream'),
 'p027-optional-spanish-audio':row(P027_RESOURCE_PINS['optional-spanish-audio'],'p027','optional-spanish-audio'),
 'p027-feedback-71':row(P027_RESOURCE_PINS['feedback-71'],'p027','feedback-71'),
 'p027-feedback-99':row(P027_RESOURCE_PINS['feedback-99'],'p027','feedback-99'),
 'p027-feedback-124':row(P027_RESOURCE_PINS['feedback-124'],'p027','feedback-124'),
 'p027-feedback-138':row(P027_RESOURCE_PINS['feedback-138'],'p027','feedback-138'),
 'p027-feedback-150':row(P027_RESOURCE_PINS['feedback-150'],'p027','feedback-150'),
 'p027-feedback-178':row(P027_RESOURCE_PINS['feedback-178'],'p027','feedback-178'),
 'p027-feedback-192':row(P027_RESOURCE_PINS['feedback-192'],'p027','feedback-192'),
 'p027-feedback-212':row(P027_RESOURCE_PINS['feedback-212'],'p027','feedback-212'),

 'p026-source-stream':row(P026_RESOURCE_PINS['source-stream'],'p026','source-stream'),
 'p026-optional-spanish-audio':row(P026_RESOURCE_PINS['optional-spanish-audio'],'p026','optional-spanish-audio'),
 'p026-feedback-65':row(P026_RESOURCE_PINS['feedback-65'],'p026','feedback-65'),
 'p026-feedback-90':row(P026_RESOURCE_PINS['feedback-90'],'p026','feedback-90'),
 'p026-feedback-123':row(P026_RESOURCE_PINS['feedback-123'],'p026','feedback-123'),
 'p026-feedback-148':row(P026_RESOURCE_PINS['feedback-148'],'p026','feedback-148'),
 'p026-feedback-162':row(P026_RESOURCE_PINS['feedback-162'],'p026','feedback-162'),
 'p026-feedback-176':row(P026_RESOURCE_PINS['feedback-176'],'p026','feedback-176'),
 'p026-feedback-102':row(P026_RESOURCE_PINS['feedback-102'],'p026','feedback-102'),

 'p025-source-stream':row(P025_RESOURCE_PINS['source-stream'],'p025','source-stream'),
 'p025-optional-spanish-audio':row(P025_RESOURCE_PINS['optional-spanish-audio'],'p025','optional-spanish-audio'),

 'p023-source-stream':row(P023_RESOURCE_PINS['source-stream'],'p023','source-stream'),
 'p023-optional-spanish-audio':row(P023_RESOURCE_PINS['optional-spanish-audio'],'p023','optional-spanish-audio'),
 'p023-feedback-54':row(P023_RESOURCE_PINS['feedback-54'],'p023','feedback-54'),
 'p023-feedback-66':row(P023_RESOURCE_PINS['feedback-66'],'p023','feedback-66'),
 'p023-feedback-83':row(P023_RESOURCE_PINS['feedback-83'],'p023','feedback-83'),
 'p023-feedback-97':row(P023_RESOURCE_PINS['feedback-97'],'p023','feedback-97'),
 'p023-feedback-124':row(P023_RESOURCE_PINS['feedback-124'],'p023','feedback-124'),
 'p023-feedback-137':row(P023_RESOURCE_PINS['feedback-137'],'p023','feedback-137'),
 'p023-feedback-156':row(P023_RESOURCE_PINS['feedback-156'],'p023','feedback-156'),

 'p001-source-stream':row(P001_RESOURCE_PINS['source-stream'],'p001','source-stream'),
 'p002-source-stream':row(P002_RESOURCE_PINS['source-stream'],'p002','source-stream'),
 'p002-native-canvas-renderer.js':row(P002_RESOURCE_PINS['native-canvas-renderer.js'],'p002','native-canvas-renderer.js'),
 'p002-optional-spanish-audio':row(P002_RESOURCE_PINS['optional-spanish-audio'],'p002','optional-spanish-audio'),
 'p003-source-stream':row(P003_RESOURCE_PINS['source-stream'],'p003','source-stream'),
 'p003-canvas-renderer.js':row(P003_RESOURCE_PINS['canvas-renderer.js'],'p003','canvas-renderer.js'),
 'p006-source-stream':row(P006_RESOURCE_PINS['source-stream'],'p006','source-stream'),
 'p006-canvas-renderer.js':row(P006_RESOURCE_PINS['canvas-renderer.js'],'p006','canvas-renderer.js'),
 'p007-feedback-67':row(P007_RESOURCE_PINS['feedback-67'],'p007','feedback-67'),
 'p007-feedback-98':row(P007_RESOURCE_PINS['feedback-98'],'p007','feedback-98'),
 'p007-feedback-119':row(P007_RESOURCE_PINS['feedback-119'],'p007','feedback-119'),
 'p007-feedback-145':row(P007_RESOURCE_PINS['feedback-145'],'p007','feedback-145'),
 'p007-feedback-177':row(P007_RESOURCE_PINS['feedback-177'],'p007','feedback-177'),
 'p007-feedback-210':row(P007_RESOURCE_PINS['feedback-210'],'p007','feedback-210'),
 'p007-feedback-224':row(P007_RESOURCE_PINS['feedback-224'],'p007','feedback-224'),
 'p007-source-stream':row(P007_RESOURCE_PINS['source-stream'],'p007','source-stream'),
 'p007-optional-spanish-audio':row(P007_RESOURCE_PINS['optional-spanish-audio'],'p007','optional-spanish-audio'),
 'p009-retained-hint-stream':row(P009_RESOURCE_PINS['retained-hint-stream'],'p009','retained-hint-stream'),
 'p009-source-stream':row(P009_RESOURCE_PINS['source-stream'],'p009','source-stream'),
 'p009-optional-spanish-audio':row(P009_RESOURCE_PINS['optional-spanish-audio'],'p009','optional-spanish-audio'),
 'p010-source-stream':row(P010_RESOURCE_PINS['source-stream'],'p010','source-stream'),
 'p010-optional-spanish-audio':row(P010_RESOURCE_PINS['optional-spanish-audio'],'p010','optional-spanish-audio'),
 'p011-source-stream':row(P011_RESOURCE_PINS['source-stream'],'p011','source-stream'),
 'p011-source-feedback':row(P011_RESOURCE_PINS['source-feedback'],'p011','source-feedback'),
 'p011-optional-spanish-audio':row(P011_RESOURCE_PINS['optional-spanish-audio'],'p011','optional-spanish-audio'),
 'p012-source-stream':row(P012_RESOURCE_PINS['source-stream'],'p012','source-stream'),
 'p012-source-feedback':row(P012_RESOURCE_PINS['source-feedback'],'p012','source-feedback'),
 'p012-optional-spanish-audio':row(P012_RESOURCE_PINS['optional-spanish-audio'],'p012','optional-spanish-audio'),
 'p013-source-stream':row(P013_RESOURCE_PINS['source-stream'],'p013','source-stream'),
 'p013-optional-spanish-audio':row(P013_RESOURCE_PINS['optional-spanish-audio'],'p013','optional-spanish-audio'),
 'p014-source-stream':row(P014_RESOURCE_PINS['source-stream'],'p014','source-stream'),
 'p014-source-feedback':row(P014_RESOURCE_PINS['source-feedback'],'p014','source-feedback'),
 'p014-optional-spanish-audio':row(P014_RESOURCE_PINS['optional-spanish-audio'],'p014','optional-spanish-audio'),
 'p015-source-stream':row(P015_RESOURCE_PINS['source-stream'],'p015','source-stream'),
 'p015-source-feedback':row(P015_RESOURCE_PINS['source-feedback'],'p015','source-feedback'),
 'p015-optional-spanish-audio':row(P015_RESOURCE_PINS['optional-spanish-audio'],'p015','optional-spanish-audio'),
 'p016-source-stream':row(P016_RESOURCE_PINS['source-stream'],'p016','source-stream'),
 'p016-optional-spanish-audio':row(P016_RESOURCE_PINS['optional-spanish-audio'],'p016','optional-spanish-audio'),
 'p017-source-stream':row(P017_RESOURCE_PINS['source-stream'],'p017','source-stream'),
 'p017-source-feedback':row(P017_RESOURCE_PINS['source-feedback'],'p017','source-feedback'),
 'p017-optional-spanish-audio':row(P017_RESOURCE_PINS['optional-spanish-audio'],'p017','optional-spanish-audio'),
 'p018-source-stream':row(P018_RESOURCE_PINS['source-stream'],'p018','source-stream'),
 'p018-source-feedback':row(P018_RESOURCE_PINS['source-feedback'],'p018','source-feedback'),
 'p018-optional-spanish-audio':row(P018_RESOURCE_PINS['optional-spanish-audio'],'p018','optional-spanish-audio'),
 'p019-source-stream':row(P019_RESOURCE_PINS['source-stream'],'p019','source-stream'),
 'p019-optional-spanish-audio':row(P019_RESOURCE_PINS['optional-spanish-audio'],'p019','optional-spanish-audio'),
 'p020-source-stream':row(P020_RESOURCE_PINS['source-stream'],'p020','source-stream'),
 'p020-optional-spanish-audio':row(P020_RESOURCE_PINS['optional-spanish-audio'],'p020','optional-spanish-audio'),
 'p021-source-stream':row(P021_RESOURCE_PINS['source-stream'],'p021','source-stream'),
 'p021-optional-spanish-audio':row(P021_RESOURCE_PINS['optional-spanish-audio'],'p021','optional-spanish-audio'),
 'p022-source-stream':row(P022_RESOURCE_PINS['source-stream'],'p022','source-stream'),
 'p022-optional-spanish-audio':row(P022_RESOURCE_PINS['optional-spanish-audio'],'p022','optional-spanish-audio'),
 'p021-feedback-67':row(P021_RESOURCE_PINS['feedback-67'],'p021','feedback-67'),
 'p021-feedback-101':row(P021_RESOURCE_PINS['feedback-101'],'p021','feedback-101'),
 'p021-feedback-109':row(P021_RESOURCE_PINS['feedback-109'],'p021','feedback-109'),
 'p021-feedback-137':row(P021_RESOURCE_PINS['feedback-137'],'p021','feedback-137'),
 'p021-feedback-158':row(P021_RESOURCE_PINS['feedback-158'],'p021','feedback-158'),
 'p021-feedback-183':row(P021_RESOURCE_PINS['feedback-183'],'p021','feedback-183'),
 'p021-feedback-198':row(P021_RESOURCE_PINS['feedback-198'],'p021','feedback-198'),
 'p021-feedback-213':row(P021_RESOURCE_PINS['feedback-213'],'p021','feedback-213'),
 'p020-feedback-62':row(P020_RESOURCE_PINS['feedback-62'],'p020','feedback-62'),
 'p020-feedback-78':row(P020_RESOURCE_PINS['feedback-78'],'p020','feedback-78'),
 'p020-feedback-90':row(P020_RESOURCE_PINS['feedback-90'],'p020','feedback-90'),
 'p020-feedback-111':row(P020_RESOURCE_PINS['feedback-111'],'p020','feedback-111'),
 'p020-feedback-135':row(P020_RESOURCE_PINS['feedback-135'],'p020','feedback-135'),
 'p020-feedback-150':row(P020_RESOURCE_PINS['feedback-150'],'p020','feedback-150'),
 'p020-feedback-181':row(P020_RESOURCE_PINS['feedback-181'],'p020','feedback-181'),
});
export function l7CurrentResourceForRequest(request:{method:string;url:URL;headers:Pick<Headers,'get'>},mode:'candidate'|'registered',env:G678PreviewEnvironment=process.env):string|null{
 const{method,url,headers}=request;if(!l7LocalDevelopment(env)||!isG678LocalPreviewRequestUrl(url,env)||!isG678LocalPreviewRequestHeaders(headers,env)||url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||headers.get('host')!=='127.0.0.1:3331'||![null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))||![null,'http'].includes(headers.get('x-forwarded-proto'))||headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin'||![null,L7_LOCAL_ORIGIN].includes(headers.get('origin'))||!l7CurrentDocumentReferer(headers.get('referer'),mode)||!['GET','HEAD'].includes(method))return null;
 for(const[token,pin]of Object.entries(L7_CURRENT_RESOURCE_PINS))if([pin.originalPath,`/flash-assets/g678-local/alg-l07-current-${mode}/${token}`].includes(url.pathname)&&url.search===`?sha256=${pin.sha256}`&&headers.get('sec-fetch-dest')===pin.destination&&headers.get('sec-fetch-mode')===pin.mode)return token;return null;
}
