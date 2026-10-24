/** P024 source audio inventory. Playback alignment awaits browser decode and a live branch trace. */
export const P024_AUDIO_PLAN_SHA256=
 '97e3dbb4e2db144915540b1b224b60066be514324b3e378689ea31e204b34333';

export const P024_AUDIO_DOMAINS=[
 {id:'sprite-69',role:'wrong-feedback',frames:31,blockRange:[3,31],blocks:29,
  declaredSamples:52992,zeroPayloadFrames:[4],negativeSeekBlocks:[],
  localStopFrame:22,localTerminalFrame:31,closeGotoFrame:23,
  sourceBytes:11960,sourceSha256:'2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77',
  pcmSha256:'772979ef9653e41f556d409e131fbf4df53f1df72cf63d81621110b8bf4dbe10'},
 {id:'sprite-83',role:'wrong-feedback',frames:29,blockRange:[2,29],blocks:28,
  declaredSamples:51264,zeroPayloadFrames:[3],negativeSeekBlocks:[],
  localStopFrame:23,localTerminalFrame:29,closeGotoFrame:24,
  sourceBytes:11570,sourceSha256:'5bfd44f657eb1ee276cbae924e79bf448bfb0e6d7bef7515164118f295726f4d',
  pcmSha256:'2ed26437bdac07bc0c98cc66ce8647066878352119233164e22c5698b1b6ffca'},
 {id:'sprite-97',role:'wrong-feedback',frames:28,blockRange:[2,27],blocks:26,
  declaredSamples:45504,zeroPayloadFrames:[3,27],
  negativeSeekBlocks:[{frame:27,rawSeekSamples:-2093,mp3Bytes:0}],
  localStopFrame:20,localTerminalFrame:28,closeGotoFrame:21,
  sourceBytes:10270,sourceSha256:'1421b1c2ed818b79f66f9d94530176299e8ebfaff946ccbb0e851cec9d72234e',
  pcmSha256:'e6e201d88d57bdf42574ea209ff552c87f913591e932c07a9100a0543d8c6bb2'},
 {id:'sprite-123',role:'right-feedback',frames:31,blockRange:[2,31],blocks:30,
  declaredSamples:52992,zeroPayloadFrames:[3,31],
  negativeSeekBlocks:[{frame:31,rawSeekSamples:-1953,mp3Bytes:0}],
  localStopFrame:null,localTerminalFrame:31,closeGotoFrame:null,
  sourceBytes:11960,sourceSha256:'70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b',
  pcmSha256:'b48ce8f34d383e5017c52548e5e496cb6a465e9341a0a76567306bee663282ea'},
 {id:'sprite-155',role:'right-feedback',frames:25,blockRange:[2,25],blocks:24,
  declaredSamples:43776,zeroPayloadFrames:[3],negativeSeekBlocks:[],
  localStopFrame:null,localTerminalFrame:25,closeGotoFrame:null,
  sourceBytes:9880,sourceSha256:'105da94835aa6ae9fa8c8f149fdb28167ba1a2de31e842c7997e1a8557dc981d',
  pcmSha256:'f98216dd5dba6bff73147cedc6419d2196ed55bb9b4b20ca849c785524ee9cde'},
 {id:'sprite-188',role:'right-feedback',frames:27,blockRange:[1,27],blocks:27,
  declaredSamples:48960,zeroPayloadFrames:[2],negativeSeekBlocks:[],
  localStopFrame:null,localTerminalFrame:27,closeGotoFrame:null,
  sourceBytes:11050,sourceSha256:'b08449fd7fb0c0288fc90f56473e10d3f10494c1a9747e20481ec7dd50bdfe19',
  pcmSha256:'ac9d40de8f700a8d582ebce69e5fb46e237f73b103d90daad9f7344fc710aa36'},
 {id:'sprite-196',role:'right-feedback',frames:27,blockRange:[2,27],blocks:26,
  declaredSamples:47232,zeroPayloadFrames:[3],negativeSeekBlocks:[],
  localStopFrame:null,localTerminalFrame:27,closeGotoFrame:null,
  sourceBytes:10660,sourceSha256:'18e52976f77c535c485dccc2c41a17b63a651044748593990b355cee29b01aec',
  pcmSha256:'ca0f4f9ae2eed2dd21b860bfa70aacc1f53b5a1138ec7ffc4b2515f4da54171f'},
 {id:'sprite-208',role:'main',frames:381,blockRange:[2,381],blocks:380,
  declaredSamples:697536,zeroPayloadFrames:[3],negativeSeekBlocks:[],
  localStopFrame:154,localTerminalFrame:381,closeGotoFrame:null,
  sourceBytes:157430,sourceSha256:'d55b6869f9ba02d5c0921d5182b00c9d069242c2977b1ddc1a0743b5e57a46f3',
  pcmSha256:'1b1ceb8f0490c09913555b64a28dc39599e05483a94ff0524df02e3858d64516'},
] as const;

export type P024AudioDomainId=typeof P024_AUDIO_DOMAINS[number]['id'];
export const P024_MAIN_AUDIO_ID='sprite-208' as const;
export const P024_WRONG_FEEDBACK_AUDIO_IDS=['sprite-69','sprite-83','sprite-97'] as const;
export const P024_RIGHT_FEEDBACK_AUDIO_IDS=
 ['sprite-123','sprite-155','sprite-188','sprite-196'] as const;
export const P024_AUDIO_SOURCE_PREFIX='output/alg-l06-p024-audio-v1/' as const;
export const P024_AUDIO_SAMPLE_RATE=22050 as const;
export const P024_AUDIO_FIRST_SEEK_SAMPLES=1673 as const;
export const P024_AUDIO_FPS=12 as const;
export const P024_AUDIO_SA={role:'separate-sa',
 sourcePath:`${P024_AUDIO_SOURCE_PREFIX}separate-sa-source-v1.mp3`,
 sourceBytes:166320,
 sourceSha256:'dd7f04214d8bfcdaf9ae98b99e542aa7f72f70accd1703381990ff4f43f57f0e',
 ffmpegSampleRate:48000,ffmpegSamples:570240,
 pcmSha256:'4987a84f9982e78a296e80b4ab92b9d0a0c8270d53097cc3a905031750e29449',
 activation:'explicit-user-only',localeAutoplay:false,splicedIntoMain:false,
 browserDecodeObserved:false,originalRuntimeAccepted:false,listeningAccepted:false} as const;

export const P024_AUDIO_DISPOSITION={mainFrameDomain:'sprite-208',
 rootFrameCount:10,mainFrameCount:381,quizStopFrame:154,
 independentDomains:true,sourceBlockCount:570,
 mainContinuesOnlyAfterQuizState:true,feedbackVariantSourceSelection:'random(3)-or-random(4)',
 wrongPopupCloseToTerminalEstablished:false,sourceAlignment:'unresolved',
 syntheticSilenceAdded:false,domainsConcatenated:false,separateSaSpliced:false,
 localeStartsAudio:false,browserDecodeObserved:false,originalRuntimeAccepted:false,
 listeningAccepted:false,audioAccepted:false} as const;

/** Source domain lookup only. A live state machine must decide ownership and start/stop. */
export function p024AudioDomain(id:P024AudioDomainId){
 const domain=P024_AUDIO_DOMAINS.find(row=>row.id===id);
 if(!domain)throw Error('P024_INVALID_AUDIO_DOMAIN');
 return {...domain,
  sourcePath:`${P024_AUDIO_SOURCE_PREFIX}${id}-source-v1.mp3`,
  ffmpegSampleRate:P024_AUDIO_SAMPLE_RATE,
  ffmpegSamples:domain.declaredSamples,
  firstBlockRawSeekSamples:P024_AUDIO_FIRST_SEEK_SAMPLES};
}
