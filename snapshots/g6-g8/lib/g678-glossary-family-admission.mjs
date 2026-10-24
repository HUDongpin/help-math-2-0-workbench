/** Configuration-driven admission semantics for source-locked ALG glossary pages.
 * The common proof reader owns byte custody; this module checks page meaning. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const FAMILY_ACCEPTANCE_KEYS = Object.freeze([
  'authoritativeOriginalRuntime','fidelityAccepted','audioAccepted',
  'humanVisualAccepted','ownerAccepted','strictComplete','published',
]);
export const FAMILY_CONFIG_PATH = 'output/alg-l12-p015-admission-20260927/admission-config.json';
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const pinDigest = bytes => createHash('sha256').update(bytes).digest('hex');
const same = (actual, expected, why) => assert.deepStrictEqual(actual, expected, `G678_FAMILY_ADMISSION: ${why}`);
const demand = (condition, why) => assert(condition, `G678_FAMILY_ADMISSION: ${why}`);
const barePin = item => ({path:item.path,bytes:item.bytes,sha256:item.sha256});
const isPin = item => item && typeof item.path === 'string' && Number.isSafeInteger(item.bytes) &&
  item.bytes > 0 && /^[a-f0-9]{64}$/.test(item.sha256);

/** Source inventories are shared and mutable; only the exact configured member
 * projection enters a page proof. Later family pages cannot repin old proofs. */
export function projectGlossaryFamilySource(config, sourceInputs, hostResources) {
  demand(config?.schemaVersion === 1 && config.kind === 'g678-glossary-family-admission-config-v1', 'config schema');
  demand(sourceInputs?.schemaVersion === 1 && sourceInputs.kind === 'g678-glossary-pair-source-inputs-v1' &&
    sourceInputs.registered === false && sourceInputs.scaleOutAuthorized === false, 'source inventory status');
  demand(hostResources?.schemaVersion === 1 && hostResources.kind === 'alg-l12-glossary-pair-host-resources-v1' &&
    hostResources.registered === false, 'resource inventory status');
  const rows = sourceInputs.pages?.filter(item => item.animationId === config.animationId) ?? [];
  const resources = hostResources.pages?.filter(item => item.animationId === config.animationId) ?? [];
  demand(rows.length === 1 && resources.length === 1, 'one exact family source member');
  const page = rows[0], resource = resources[0];
  validateGlossaryFamilySourceFacts(config, page);
  same(resource.source, page.source, 'resource source');
  same([resource.frameDomain,resource.frameCount],
    [config.sourceFacts.frameDomain,config.sourceFacts.frameCount], 'resource frame domain');
  same(Object.keys(resource.resources).sort(), ['main.mp3','spanish-audio.mp3','typography.js'], 'resource names');
  same(barePin(resource.resources['typography.js']), config.resourcePins.nativeRuntime, 'native runtime resource');
  same(barePin(resource.resources['main.mp3']), config.resourcePins.mainAudio, 'main audio resource');
  same(barePin(resource.resources['spanish-audio.mp3']),
    {...config.spanishAudio,path:`${config.sourceRoot}/${config.spanishAudio.path}`}, 'Spanish audio source');
  same(sourceInputs.sharedInputs, [
    {...config.sourceXml,path:`${config.sourceRoot}/${config.sourceXml.path}`},
    ...config.keyterms.map(item=>({...item,path:`${config.keytermRoot}/${item.path}`})),
  ], 'lesson XML and bilingual key term custody');
  return {page,resources:resource.resources};
}

export function validateGlossaryFamilySourceFacts(config, page) {
  const expected=config.sourceFacts;
  same([page.animationId,page.rootFrame,page.rootFrameCount,page.frameDomain,page.frameCount,page.fps],
    [config.animationId,expected.rootFrame,expected.rootFrameCount,expected.frameDomain,
      expected.frameCount,expected.fps], 'frame/source identity');
  same(page.source,{...config.source,path:`${config.sourceRoot}/${config.source.path}`}, 'canonical SWF');
  same(page.sourceCatalogSha256,expected.sourceCatalogSha256,'source catalog');
  same(page.additionalGlobalReadParity,expected.additionalGlobalReadParity,'global read classification');
  same(page.registrationEffect,'none','source inventory registration effect');
  for(const key of ['controls','glossary','sourcePins','unresolvedSourceRisks']) {
    demand(Array.isArray(page[key]),`source array ${key}`);
    same(digest(page[key]),expected.digests[key],`source ${key} digest`);
  }
  same([page.controls.length,page.glossary.length],
    [expected.controlCount,expected.glossaryCount],'source control/dictionary counts');
  same(page.sourcePins[0],page.source,'source SWF in extracted closure');
  demand(page.sourcePins.slice(1).every(pin=>isPin(pin) && pin.path.startsWith(
    `output/alg-l12-next-glossary-20260927/${config.animationId.match(/-(p\d{3})$/)?.[1]}/`)),
  'page-owned extracted source paths');
  for(const control of page.controls) {
    same(control.action.operation,'open-glossary','control action');
    same(control.action.sourceStop,'animation_mc.animation','control pause target');
    demand(page.glossary.some(term=>term.id===control.entryId &&
      term.sourceKeyAttribute===control.action.sourceKeyAttribute),'control bilingual dictionary key');
  }
  same(page.controls.filter(control=>control.action.additionalSourceReads.length).map(control=>({
    entryId:control.entryId,read:control.action.additionalSourceReads[0],
    position:control.action.additionalReadPosition,
  })),expected.globalReadControls,'additional global reads are retained');
  const mismatches=[];
  for(const term of page.glossary) {
    for(const [locale,index] of [['en',0],['es',1]]) {
      demand(typeof term.labels?.[locale]==='string' && term.labels[locale].length>0 &&
        typeof term.definitions?.[locale]==='string' && term.definitions[locale].length>0,
      `bilingual entry ${term.id}/${locale}`);
      same(term.source[locale].sha256,config.keyterms[index].sha256,'key term provenance');
      if(term.sourceEntrySha256[locale]!==term.extractionLfNormalizedEntrySha256[locale])
        mismatches.push({entryId:term.id,locale,sourceEntrySha256:term.sourceEntrySha256[locale],
          extractionLfNormalizedEntrySha256:term.extractionLfNormalizedEntrySha256[locale],
          status:'reviewed-crlf-normalization',
          evidence:(expected.glossaryEntryHashExceptions??[]).find(item=>
            item.entryId===term.id && item.locale===locale)?.evidence});
    }
  }
  same(mismatches,expected.glossaryEntryHashExceptions??[],
    'explicit bilingual extraction hash exceptions');
  return true;
}

export function validateGlossaryFamilyAdmissionSemantics(packet, registration) {
  const config=packet?.familyConfig;
  demand(config?.schemaVersion===1 && config.kind==='g678-glossary-family-admission-config-v1',
    'embedded family config');
  const configBytes=Buffer.from(JSON.stringify(config,null,2)+'\n');
  demand(typeof config.configPath==='string' && !config.configPath.startsWith('/') &&
    !config.configPath.includes('..') && config.configPath.endsWith('/admission-config.json'),
    'bounded member config path');
  same(packet.familyConfigPin,{path:config.configPath,bytes:configBytes.length,
    sha256:pinDigest(configBytes)},'exact family config pin');
  demand(config.globalReadDisposition?.status==='reviewed' && isPin(config.globalReadDisposition.evidence),
    'reviewed source global-read disposition required');
  same([packet.schemaVersion,packet.calibrationId,packet.sourceRoot,packet.scope,packet.deploymentScope],
    [1,config.calibrationId,config.sourceRoot,'private-engineering','local-only'],
    'local page identity');
  same(packet.source,config.source,'source SWF');
  same(packet.sourceXml,config.sourceXml,'lesson XML');
  same(packet.optionalSpanishAudio,{source:config.spanishAudio,automaticLocalePlayback:false,
    spokenLanguageVerified:false,listeningAccepted:false},'Spanish sidecar qualification');
  validateGlossaryFamilySourceFacts(config,packet.sourceFacts);
  demand(packet.selectedPages?.length===1,'one selected page');
  const selected=packet.selectedPages[0], resource=config.resourcePins;
  same([selected.animationId,selected.placementId,selected.assetId,selected.stableLessonKey,
    selected.sourceSha256,selected.moduleCode,selected.lessonNumber,selected.globalPageOrdinal,
    selected.sectionCode,selected.sectionPageOrdinal,selected.complexityLane,
    selected.implementationLane],
  [config.animationId,config.animationId,`swf-${config.source.sha256}`,
    config.selectedPage.stableLessonKey,config.source.sha256,
    config.selectedPage.moduleCode,config.selectedPage.lessonNumber,
    config.selectedPage.globalPageOrdinal,config.selectedPage.sectionCode,
    config.selectedPage.sectionPageOrdinal,'interactive-understood',config.selectedPage.implementationLane],
  'selected source-ordered placement');
  same(selected.sourceSha256,config.source.sha256,'selected SWF SHA');
  same(selected.runtime,{stage:{width:800,height:600},rootFrameCount:config.sourceFacts.rootFrameCount,
    rootBeginFrame:config.sourceFacts.rootFrame,frameDomain:config.sourceFacts.frameDomain,
    frameCount:config.sourceFacts.frameCount,livePlaybackEndFrame:config.sourceFacts.frameCount,
    fps:config.sourceFacts.fps,language:'fixed-en',scenario:config.selectedPage.scenario,seed:'0',
    renderScale:2,canvas:{width:1600,height:1200},
    canvasRenderer:{...resource.canonicalRuntime,
      url:`/flash-assets/g678-local/${config.animationId}/typography.js?sha256=${resource.nativeRuntime.sha256}`}},
  'canonical selected runtime and source-static scenario');
  same(selected.runtimeEvidenceBoundary,{runtimeKind:'source-structure-bound-modern-current-js-candidate',
    actionScriptExecution:'not-executed',naturalTraceValidation:'not-established',
    audioAcceptance:'not-established',
    replaySemantics:'modern-full-frame-terminal-hold-original-runtime-parity-not-established',
    productBehavior:'maintained-glossary-pause-adapter-implemented',
    productVisualBehaviorComposite:'not-established'},'qualified runtime evidence');
  const entry=packet.entry;
  same(entry,{key:config.animationId,module:`./modules/${config.animationId}`,
    maturity:'private-current-js',complexityLane:'interactive-understood',
    artifacts:{module:entry?.artifacts?.module,timeline:entry?.artifacts?.timeline,
      runtime:resource.canonicalRuntime}},'one canonical registry entry');
  same(entry.artifacts.module.path,`packages/demos/src/modules/${config.animationId}.tsx`,'module path');
  same(entry.artifacts.timeline.path,`packages/demos/src/timelines/${config.animationId}.ts`,'timeline path');
  same(packet.visual.runtime,resource.canonicalRuntime,'freeze runtime = registered runtime');
  same(packet.visual.nativeRuntime,resource.nativeRuntime,'served native runtime separate');
  same(packet.audio.main,resource.mainAudio,'main audio bytes');
  same(packet.glossary,{sourceButtonCount:config.sourceFacts.controlCount,
    stopPath:'animation_mc.animation',closePolicy:'remain-paused',
    additionalGlobalReadParity:'unestablished',
    operationSideEffectParity:'unestablished',disposition:config.globalReadDisposition.evidence},'source read qualification');
  demand(packet.integrity?.scope==='single-family-member-source-and-implementation' &&
    packet.integrity.completeTransitiveClosure===false &&
    Array.isArray(packet.integrity.files),'page-owned closure');
  const own=packet.integrity.files;
  demand(new Set(own.map(item=>item.path)).size===own.length,'unique page inputs');
  for(const expected of [packet.familyConfigPin,entry.artifacts.module,entry.artifacts.timeline,
    resource.canonicalRuntime,resource.nativeRuntime,resource.mainAudio,
    config.globalReadDisposition.evidence,...packet.sourceFacts.sourcePins.slice(1)])
    demand(own.some(pin=>JSON.stringify(pin)===JSON.stringify(expected)),
      `own pinned input ${expected.path}`);
  demand(!own.some(pin=>config.sharedHostPaths.includes(pin.path)||
    pin.path==='packages/demos/private-current-js-registry.json'||
    pin.path.endsWith('/source-inputs.json')||pin.path.endsWith('/host-resources-v1.json')),
  'host, registry and mutable family inventory excluded');
  same(Object.keys(packet.acceptanceEffects??{}).sort(),[...FAMILY_ACCEPTANCE_KEYS].sort(),
    'independent gates');
  demand(Object.values(packet.acceptanceEffects).every(value=>value===false) &&
    packet.productCalibrationPassed===false && packet.scaleOutAuthorized===false,
  'no acceptance or scale-out');
  demand(isPin(packet.freezeManifest),'frozen packet pin');
  same(registration?.calibrationId,config.calibrationId,'registration calibration');
  same(registration?.deploymentScope,'local-only','registration scope');
  same(registration?.freezeManifestSha256,packet.freezeManifest.sha256,'freeze SHA');
  if(Array.isArray(registration.entries)) {
    same(registration.entries,[entry],'registration entry');
    same(registration.freezeManifest,packet.freezeManifest.path,'freeze path');
    same(registration.freezeManifestBytes,packet.freezeManifest.bytes,'freeze bytes');
  } else {
    same([registration.maturity,registration.scope,registration.moduleSha256,registration.timelineSha256,
      registration.runtimeSha256],
    ['private-current-js','private-engineering',entry.artifacts.module.sha256,entry.artifacts.timeline.sha256,
      entry.artifacts.runtime.sha256],'live registration');
  }
  return true;
}
