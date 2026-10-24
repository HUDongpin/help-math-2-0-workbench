import {createHash} from "node:crypto";
import {inflateSync} from "node:zlib";

// This is a structural reader, never an ActionScript interpreter. Coordinates
// and code units are evidence; reading order and runtime visibility are not.
export const TEXT_SOURCE_SCHEMA_VERSION = 1;
export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const NAMES = {0:"End",1:"ShowFrame",2:"DefineShape",4:"PlaceObject",5:"RemoveObject",6:"DefineBits",7:"DefineButton",10:"DefineFont",11:"DefineText",12:"DoAction",13:"DefineFontInfo",20:"DefineBitsLossless",21:"DefineBitsJPEG2",22:"DefineShape2",26:"PlaceObject2",28:"RemoveObject2",32:"DefineShape3",33:"DefineText2",34:"DefineButton2",35:"DefineBitsJPEG3",36:"DefineBitsLossless2",37:"DefineEditText",39:"DefineSprite",43:"FrameLabel",48:"DefineFont2",59:"DoInitAction",62:"DefineFontInfo2",70:"PlaceObject3",75:"DefineFont3",82:"DoABC",83:"DefineShape4",88:"DefineFontName",90:"DefineBitsJPEG4",91:"DefineFont4",94:"PlaceObject4"};
const FONT_TAGS = new Set([10,13,48,62,75,88,91]);
const TEXT_TAGS = new Set([11,33,37]);
const SHAPE_TAGS = new Set([2,22,32,46,83,84]);
const BITMAP_TAGS = new Set([6,20,21,35,36,90]);
const identity = () => [1,0,0,1,0,0];
const assert = (condition, message) => {if (!condition) throw new Error(message);};

class Reader {
  constructor(bytes, offset = 0) {this.bytes=bytes; this.bit=offset*8;}
  get offset() {assert(this.bit%8===0,"unaligned byte read");return this.bit/8;}
  bits(n, signed=false) {
    assert(n>=0 && n<=32 && this.bit+n<=this.bytes.length*8,"truncated bit field");
    let v=0; for(let i=0;i<n;i++){v=v*2+((this.bytes[this.bit>>3]>>(7-(this.bit%8)))&1);this.bit++;}
    return signed && n>0 && v>=2**(n-1) ? v-2**n : v;
  }
  align(){this.bit=Math.ceil(this.bit/8)*8;}
  take(n){const p=this.offset;assert(Number.isSafeInteger(n)&&n>=0&&p+n<=this.bytes.length,"truncated byte field");this.bit+=n*8;return this.bytes.subarray(p,p+n);}
  u8(){return this.take(1)[0];}
  u16(){return this.take(2).readUInt16LE();}
  i16(){return this.take(2).readInt16LE();}
  u32(){return this.take(4).readUInt32LE();}
  rect(){const n=this.bits(5);const [left,right,top,bottom]=Array.from({length:4},()=>this.bits(n,true));this.align();return {left,right,top,bottom};}
  matrix(){let a=1,d=1,b=0,c=0;if(this.bits(1)){const n=this.bits(5);a=this.bits(n,true)/65536;d=this.bits(n,true)/65536;}if(this.bits(1)){const n=this.bits(5);b=this.bits(n,true)/65536;c=this.bits(n,true)/65536;}const n=this.bits(5);const tx=this.bits(n,true),ty=this.bits(n,true);this.align();return [a,b,c,d,tx,ty];}
  color(alpha=true){return [...this.take(alpha?4:3),...(alpha?[]:[255])];}
  colorTransform(alpha=true){const hasAdd=this.bits(1),hasMultiply=this.bits(1),n=this.bits(4);const count=alpha?4:3;const multiply=hasMultiply?Array.from({length:count},()=>this.bits(n,true)):Array(count).fill(256);const add=hasAdd?Array.from({length:count},()=>this.bits(n,true)):Array(count).fill(0);this.align();return {multiply,add,divisor:256};}
  string(version){const start=this.offset;const end=this.bytes.indexOf(0,start);assert(end>=0,"unterminated string");const raw=this.take(end-start);this.take(1);return decodeSourceString(raw,version);}
}

export function decodeSourceString(raw, swfVersion) {
  let text=null,status="unresolved-legacy-string-encoding";
  if(raw.every(v=>v<128)){text=raw.toString("ascii");status="exact-ascii";}
  else if(swfVersion>=6){try{text=new TextDecoder("utf-8",{fatal:true}).decode(raw);status="exact-utf8";}catch{status="invalid-utf8";}}
  return {text,decodeStatus:status,rawSha256:sha256(raw),rawHex:text===null?raw.toString("hex"):null};
}

function fontName(raw,version){const nullTerminated=raw.at(-1)===0;return {...decodeSourceString(nullTerminated?raw.subarray(0,-1):raw,version),fieldRawSha256:sha256(raw),nullTerminated};}

export function decodeFontCode(code, font) {
  if(!Number.isInteger(code))return {unicode:null,status:"missing-font-code-table"};
  if(!font)return {unicode:null,status:"missing-font"};
  if(/symbol|wingdings|webdings|dingbat/i.test(font.name?.text??""))return {unicode:null,status:"symbol-font-semantic-mapping-unresolved"};
  if(font.flags?.shiftJis)return {unicode:null,status:"shift-jis-code-unresolved"};
  if(font.flags?.ansi && code>=128)return {unicode:null,status:"ansi-code-page-unresolved"};
  if(code<0||code>0x10ffff||(code>=0xd800&&code<=0xdfff))return {unicode:null,status:"non-scalar-font-code"};
  return {unicode:String.fromCodePoint(code),status:font.flags?.ansi?"exact-ascii-code":"embedded-unicode-code-table"};
}

function fontRecord(record, version) {
  const r=new Reader(record.payload),characterId=r.u16();
  const base={characterId,tagName:record.tagName,sourceTagOffset:record.offset,sourceTagSha256:record.sha256};
  if(record.code===10){const first=r.u16();assert(first>=2&&first%2===0,"invalid DefineFont offset table");return {...base,glyphCount:first/2,codes:null,parseStatus:"requires-font-info"};}
  if(record.code===91){const flags=r.u8(),name=r.string(version);return {...base,name,flags:{hasFontData:Boolean(flags&4),italic:Boolean(flags&2),bold:Boolean(flags&1)},codes:null,parseStatus:"cff-code-table-unresolved"};}
  if(record.code===88)return {...base,name:r.string(version),copyright:r.string(version),parseStatus:"font-name-companion"};
  if(record.code===13||record.code===62){
    const name=fontName(r.take(r.u8()),version),flagsByte=r.u8();
    const flags={smallText:Boolean(flagsByte&32),shiftJis:Boolean(flagsByte&16),ansi:Boolean(flagsByte&8),italic:Boolean(flagsByte&4),bold:Boolean(flagsByte&2),wideCodes:Boolean(flagsByte&1)};
    const languageCode=record.code===62?r.u8():null,codes=[];
    while(r.offset<record.payload.length)codes.push(flags.wideCodes?r.u16():r.u8());
    return {...base,name,flagsByte,flags,languageCode,codes,parseStatus:"font-info-companion"};
  }
  const flagsByte=r.u8(),languageCode=r.u8(),name=fontName(r.take(r.u8()),version);
  const flags={hasLayout:Boolean(flagsByte&128),shiftJis:Boolean(flagsByte&64),smallText:Boolean(flagsByte&32),ansi:Boolean(flagsByte&16),wideOffsets:Boolean(flagsByte&8),wideCodes:Boolean(flagsByte&4),italic:Boolean(flagsByte&2),bold:Boolean(flagsByte&1)};
  const glyphCount=r.u16(),tableStart=r.offset,width=flags.wideOffsets?4:2;
  if(glyphCount===0&&r.offset===record.payload.length)return {...base,name,flagsByte,flags,languageCode,glyphCount,codes:[],layout:null,unitsPerEm:record.code===75?20480:1024,parseStatus:"empty-device-font-no-embedded-glyphs"};
  r.take(glyphCount*width);const codeOffset=flags.wideOffsets?r.u32():r.u16();
  assert(tableStart+codeOffset>=r.offset,"font code table overlaps offsets");
  r.take(tableStart+codeOffset-r.offset);const codes=Array.from({length:glyphCount},()=>flags.wideCodes?r.u16():r.u8());
  let layout=null;
  if(flags.hasLayout){const ascent=r.i16(),descent=r.i16(),leading=r.i16(),advances=Array.from({length:glyphCount},()=>r.i16()),bounds=Array.from({length:glyphCount},()=>r.rect());const kerningCount=r.u16(),kerning=Array.from({length:kerningCount},()=>({leftCode:flags.wideCodes?r.u16():r.u8(),rightCode:flags.wideCodes?r.u16():r.u8(),adjustment:r.i16()}));layout={ascent,descent,leading,advances,bounds,kerning};}
  assert(r.offset===record.payload.length,"trailing font definition bytes");
  return {...base,name,flagsByte,flags,languageCode,glyphCount,codes,layout,unitsPerEm:record.code===75?20480:1024,parseStatus:"structurally-parsed"};
}

function textRecord(record, fonts, version) {
  const r=new Reader(record.payload),characterId=r.u16(),boundsTwips=r.rect();
  const base={sourceTextId:`character-${characterId}`,characterId,tagName:record.tagName,sourceTagOffset:record.offset,sourceTagSha256:record.sha256,boundsTwips};
  if(record.code===37){
    const names=["hasText","wordWrap","multiline","password","readOnly","hasTextColor","hasMaxLength","hasFont","hasFontClass","autoSize","hasLayout","noSelect","border","wasStatic","html","useOutlines"];
    const flags=Object.fromEntries(names.map(k=>[k,Boolean(r.bits(1))]));r.align();
    const fontId=flags.hasFont?r.u16():null,fontClass=flags.hasFontClass?r.string(version):null,fontHeightTwips=flags.hasFont?r.u16():null,colorRgba=flags.hasTextColor?r.color():null,maxLength=flags.hasMaxLength?r.u16():null;
    const layout=flags.hasLayout?{align:r.u8(),leftMarginTwips:r.u16(),rightMarginTwips:r.u16(),indentTwips:r.u16(),leadingTwips:r.i16()}:null;
    const variableName=r.string(version),initialText=flags.hasText?r.string(version):null;
    assert(r.offset===record.payload.length,"trailing EditText bytes");
    return {...base,kind:"dynamic-field",flags,fontId,fontClass,fontHeightTwips,colorRgba,maxLength,layout,variableName,initialText,parseStatus:"structurally-parsed",runtimeValueResolved:false};
  }
  const matrix=r.matrix(),glyphBits=r.u8(),advanceBits=r.u8(),runs=[];
  let fontId=null,fontHeightTwips=null,colorRgba=null,xOffsetTwips=null,yOffsetTwips=null,terminated=false;
  while(r.offset<record.payload.length){const flags=r.u8();if(flags===0){terminated=true;break;}assert((flags&128)!==0,"invalid TextRecord flag");
    const changed={font:Boolean(flags&8),color:Boolean(flags&4),yOffset:Boolean(flags&2),xOffset:Boolean(flags&1)};
    if(changed.font)fontId=r.u16();if(changed.color)colorRgba=r.color(record.code===33);if(changed.xOffset)xOffsetTwips=r.i16();if(changed.yOffset)yOffsetTwips=r.i16();if(changed.font)fontHeightTwips=r.u16();
    const glyphCount=r.u8(),glyphs=[];for(let i=0;i<glyphCount;i++){const index=r.bits(glyphBits),advanceTwips=r.bits(advanceBits,true),code=fonts.get(fontId)?.codes?.[index]??null;glyphs.push({index,advanceTwips,code,...decodeFontCode(code,fonts.get(fontId))});}r.align();
    const text=glyphs.every(g=>g.unicode!==null)?glyphs.map(g=>g.unicode).join(""):null;
    runs.push({sourceTextId:`character-${characterId}/run-${runs.length}`,runIndex:runs.length,flags,changed,fontId,fontHeightTwips,colorRgba,xOffsetTwips,yOffsetTwips,glyphs,text,decodeStatus:text===null?"unresolved-one-or-more-glyphs":"code-table-decoded-not-semantic-review"});
  }
  assert(terminated&&r.offset===record.payload.length,"unterminated or trailing static text");
  return {...base,kind:"static-text",matrix,glyphBits,advanceBits,runs,parseStatus:"structurally-parsed"};
}

function filterList(r){const start=r.offset,count=r.u8(),types=[];for(let i=0;i<count;i++){const type=r.u8();types.push(type);if(type===0)r.take(23);else if(type===1)r.take(9);else if(type===2)r.take(15);else if(type===3)r.take(27);else if(type===4||type===7){const n=r.u8();r.take(n*5+19);}else if(type===5){const x=r.u8(),y=r.u8();r.take(13+x*y*4);}else if(type===6)r.take(80);else throw new Error(`unsupported filter ${type}`);}return {types,rawSha256:sha256(r.bytes.subarray(start,r.offset))};}

function buttonRecord(record){
  const r=new Reader(record.payload),characterId=r.u16(),isButton2=record.code===34;
  const trackAsMenu=isButton2?Boolean(r.u8()&1):false,actionOffset=isButton2?r.u16():null,statePlacements=[];
  let terminated=false;
  while(r.offset<record.payload.length){const flags=r.u8();if(flags===0){terminated=true;break;}const childCharacterId=r.u16(),depth=r.u16(),matrix=r.matrix();
    const placement={instanceId:`button-${characterId}/record-${statePlacements.length}`,recordIndex:statePlacements.length,characterId:childCharacterId,depth,matrix,flags,states:{up:Boolean(flags&1),over:Boolean(flags&2),down:Boolean(flags&4),hitTest:Boolean(flags&8)}};
    if(isButton2)placement.colorTransform=r.colorTransform();
    if(flags&16)placement.filters=filterList(r);if(flags&32)placement.blendMode=r.u8();
    statePlacements.push(placement);
  }
  assert(terminated,"unterminated button records");const actionBytes=r.take(record.payload.length-r.offset);
  return {characterId,tagName:record.tagName,sourceTagOffset:record.offset,sourceTagSha256:record.sha256,trackAsMenu,actionOffset,statePlacements,actions:{bytes:actionBytes.length,sha256:sha256(actionBytes),execution:"not-interpreted"},status:"structural-state-records-only",runtimeStateResolved:false};
}

function placementRecord(record, version){
  const r=new Reader(record.payload);let event;
  if(record.code===5)return {kind:"remove",characterId:r.u16(),depth:r.u16()};
  if(record.code===28)return {kind:"remove",depth:r.u16()};
  if(record.code===4){event={kind:"place",move:false,characterId:r.u16(),depth:r.u16(),matrix:r.matrix()};if(r.offset<record.payload.length)event.colorTransform=r.colorTransform(false);return event;}
  const f=r.u8(),f2=record.code===70?r.u8():0,depth=r.u16();
  const flags={hasClipActions:Boolean(f&128),hasClipDepth:Boolean(f&64),hasName:Boolean(f&32),hasRatio:Boolean(f&16),hasColorTransform:Boolean(f&8),hasMatrix:Boolean(f&4),hasCharacter:Boolean(f&2),move:Boolean(f&1),hasOpaqueBackground:Boolean(f2&64),hasVisible:Boolean(f2&32),hasImage:Boolean(f2&16),hasClassName:Boolean(f2&8),hasCacheAsBitmap:Boolean(f2&4),hasBlendMode:Boolean(f2&2),hasFilterList:Boolean(f2&1)};
  event={kind:"place",depth,move:flags.move,flags};
  if(flags.hasClassName||(flags.hasImage&&flags.hasCharacter))event.className=r.string(version);
  if(flags.hasCharacter)event.characterId=r.u16();if(flags.hasMatrix)event.matrix=r.matrix();if(flags.hasColorTransform)event.colorTransform=r.colorTransform();if(flags.hasRatio)event.ratio=r.u16();if(flags.hasName)event.name=r.string(version);if(flags.hasClipDepth)event.clipDepth=r.u16();if(flags.hasFilterList)event.filters=filterList(r);if(flags.hasBlendMode)event.blendMode=r.u8();if(flags.hasCacheAsBitmap)event.cacheAsBitmap=r.u8();if(flags.hasVisible)event.visible=r.u8();if(flags.hasOpaqueBackground)event.backgroundColorRgba=r.color();
  if(flags.hasClipActions){const rest=r.take(record.payload.length-r.offset);event.clipActions={bytes:rest.length,sha256:sha256(rest),execution:"not-interpreted"};}
  assert(r.offset===record.payload.length,"trailing placement bytes");return event;
}

// Identity is local to a timeline definition, not an invented root runtime path.
// Every new/replaced character at a depth starts another generation. Updates
// inherit its identity, Remove ends it, and duplicate placements stay distinct.
export function derivePlacementLifecycles(timelineId, events, declaredFrameCount){
  const active=new Map(),generation=new Map(),instances=[],risks=[];
  for(const event of events){
    if(event.kind==="remove"){
      const old=active.get(event.depth);if(old){old.lastFrameExclusive=event.frame;old.removedByEventId=event.eventId;event.instanceId=old.instanceId;active.delete(event.depth);}else risks.push({kind:"remove-without-structural-placement",eventId:event.eventId});continue;
    }
    if(event.kind!=="place")continue;
    let current=active.get(event.depth);
    if(event.characterId!==undefined){
      if(current){current.lastFrameExclusive=event.frame;current.replacedByEventId=event.eventId;}
      const ordinal=(generation.get(event.depth)??0)+1;generation.set(event.depth,ordinal);
      current={instanceId:`${timelineId}/depth-${event.depth}/generation-${ordinal}`,timelineId,depth:event.depth,generation:ordinal,characterId:event.characterId,firstFrame:event.frame,lastFrameExclusive:declaredFrameCount+1,createdByEventId:event.eventId,updates:[]};instances.push(current);active.set(event.depth,current);
    }else if(!current){risks.push({kind:"update-without-structural-placement",eventId:event.eventId});continue;}
    event.instanceId=current.instanceId;current.updates.push(event.eventId);
  }
  return {instances,risks};
}

export function collectSwfTextSourceCatalog(sourceBytes){
  assert(Buffer.isBuffer(sourceBytes)&&sourceBytes.length>=8,"truncated SWF header");
  const signature=sourceBytes.toString("ascii",0,3),version=sourceBytes[3],declaredBytes=sourceBytes.readUInt32LE(4);
  assert(signature==="FWS"||signature==="CWS",`unsupported SWF compression ${signature}`);
  const body=signature==="CWS"?inflateSync(sourceBytes.subarray(8),{maxOutputLength:256*1024*1024}):sourceBytes.subarray(8);
  assert(body.length+8===declaredBytes,"SWF declared/decompressed length mismatch");
  const h=new Reader(body),stageBoundsTwips=h.rect(),frameRate=h.u16()/256,frameCount=h.u16();
  const records=[],timelineInputs=[],unparsedTags=[],risks=[];
  function scan(bytes,start,end,timelineId,declaredFrameCount,absoluteBase=8,depth=0){
    assert(depth<=128,"SWF sprite nesting exceeds reader limit");const timeline={timelineId,declaredFrameCount,records:[],trailingAfterEnd:null};timelineInputs.push(timeline);let p=start,ended=false;
    while(p<end){assert(p+2<=end,"truncated tag header");const offset=p,head=bytes.readUInt16LE(p);p+=2;const code=head>>6;let size=head&63;if(size===63){assert(p+4<=end,"truncated long tag header");size=bytes.readUInt32LE(p);p+=4;}assert(p+size<=end,"tag payload exceeds container");const payload=bytes.subarray(p,p+size),record={code,tagName:NAMES[code]??`Tag${code}`,offset:absoluteBase+offset,sha256:sha256(Buffer.concat([Buffer.from([code&255,code>>8]),payload])),payload,timelineId};records.push(record);timeline.records.push(record);
      if(code===39){assert(size>=4,"truncated sprite definition");scan(bytes,p+4,p+size,`sprite-${payload.readUInt16LE(0)}`,payload.readUInt16LE(2),absoluteBase,depth+1);}p+=size;if(code===0){ended=true;break;}
    }
    assert(ended,"timeline missing End tag");if(p<end){timeline.trailingAfterEnd={bytes:end-p,sha256:sha256(bytes.subarray(p,end)),allZero:bytes.subarray(p,end).every(v=>v===0)};if(!timeline.trailingAfterEnd.allZero)risks.push({kind:"nonzero-bytes-after-end",timelineId});}
  }
  scan(body,h.offset,body.length,"root",frameCount);
  const fonts=[],fontMap=new Map();
  function safely(record,fn){try{return fn();}catch(error){unparsedTags.push({tagName:record.tagName,tagCode:record.code,timelineId:record.timelineId,sourceTagOffset:record.offset,sourceTagSha256:record.sha256,characterId:record.payload.length>=2?record.payload.readUInt16LE(0):null,error:error.message});return null;}}
  for(const record of records.filter(r=>FONT_TAGS.has(r.code))){const font=safely(record,()=>fontRecord(record,version));if(!font)continue;fonts.push(font);const old=fontMap.get(font.characterId);if(record.code===13||record.code===62||record.code===88)fontMap.set(font.characterId,{...old,...font,codes:font.codes??old?.codes});else fontMap.set(font.characterId,{...old,...font,codes:font.codes??old?.codes});}
  const textDefinitions=records.filter(r=>TEXT_TAGS.has(r.code)).map(record=>safely(record,()=>textRecord(record,fontMap,version))).filter(Boolean);
  const timelines=timelineInputs.map(input=>{let frame=1;const events=[];for(const record of input.records){const common={eventId:`${input.timelineId}/tag-${record.offset}`,frame,tagName:record.tagName,sourceTagOffset:record.offset,sourceTagSha256:record.sha256};if(record.code===1)frame++;else if([4,5,26,28,70].includes(record.code)){const parsed=safely(record,()=>placementRecord(record,version));if(parsed)events.push({...common,...parsed});}else if(record.code===94){unparsedTags.push({...common,tagCode:94,timelineId:input.timelineId,error:"PlaceObject4 not supported"});}else if(record.code===43){const label=safely(record,()=>new Reader(record.payload).string(version));if(label)events.push({...common,kind:"frame-label",label});}else if([12,59,82].includes(record.code))events.push({...common,kind:"action-bytes",bytes:record.payload.length,execution:"not-interpreted"});}
    const observedFrameCount=frame-1;if(observedFrameCount!==input.declaredFrameCount)risks.push({kind:"frame-count-mismatch",timelineId:input.timelineId,declared:input.declaredFrameCount,observed:observedFrameCount});
    const lifecycle=derivePlacementLifecycles(input.timelineId,events,input.declaredFrameCount);risks.push(...lifecycle.risks);
    return {timelineId:input.timelineId,declaredFrameCount:input.declaredFrameCount,observedFrameCount,trailingAfterEnd:input.trailingAfterEnd,events,instances:lifecycle.instances};});
  const shapeDefinitions=records.filter(r=>SHAPE_TAGS.has(r.code)).map(r=>({characterId:r.payload.readUInt16LE(0),tagName:r.tagName,sourceTagOffset:r.offset,sourceTagSha256:r.sha256}));
  const bitmapDefinitions=records.filter(r=>BITMAP_TAGS.has(r.code)).map(r=>({characterId:r.payload.readUInt16LE(0),tagName:r.tagName,sourceTagOffset:r.offset,sourceTagSha256:r.sha256}));
  const buttonDefinitions=records.filter(r=>r.code===7||r.code===34).map(record=>safely(record,()=>buttonRecord(record))).filter(Boolean);
  const runs=textDefinitions.flatMap(t=>t.runs??[]),unresolvedRuns=runs.filter(r=>r.text===null).length,dynamicFields=textDefinitions.filter(t=>t.kind==="dynamic-field").length;
  if(shapeDefinitions.length)risks.push({kind:"shape-text-unclassified",definitionCount:shapeDefinitions.length,meaning:"Shapes may include outlined text or mathematical symbols; presence is not confirmation of text."});
  if(bitmapDefinitions.length)risks.push({kind:"bitmap-text-unclassified",definitionCount:bitmapDefinitions.length,meaning:"Bitmap presence does not establish embedded text; visual/source review required."});
  if(buttonDefinitions.length)risks.push({kind:"button-runtime-state-and-actions-not-interpreted",definitionCount:buttonDefinitions.length});
  if(unresolvedRuns)risks.push({kind:"unresolved-font-codes",runCount:unresolvedRuns});
  if(dynamicFields)risks.push({kind:"dynamic-text-runtime-value-unresolved",fieldCount:dynamicFields});
  if(unparsedTags.length)risks.push({kind:"unparsed-source-tags",count:unparsedTags.length});
  if(timelines.some(t=>t.events.some(e=>e.kind==="action-bytes")))risks.push({kind:"actionscript-visibility-and-values-not-interpreted"});
  if(timelines.some(t=>t.events.some(e=>e.clipDepth!==undefined||e.filters||e.blendMode>1)))risks.push({kind:"mask-filter-blend-semantics-unresolved"});
  return {schemaVersion:TEXT_SOURCE_SCHEMA_VERSION,kind:"swf-text-source-catalog-v1",sourceSha256:sha256(sourceBytes),header:{signature,version,sourceBytes:sourceBytes.length,declaredBytes,stageBoundsTwips,frameRate,frameCount},claimBoundary:{structuralOnly:true,runtimeVisibilityEstablished:false,semanticReadingOrderEstablished:false,modernizationComplete:false},fonts,textDefinitions,timelines,shapeDefinitions,bitmapDefinitions,buttonDefinitions,unparsedTags,risks,summary:{fontRecords:fonts.length,textDefinitions:textDefinitions.length,staticTextDefinitions:textDefinitions.length-dynamicFields,dynamicFields,textRuns:runs.length,decodedRuns:runs.length-unresolvedRuns,unresolvedRuns,timelines:timelines.length,placementInstances:timelines.reduce((n,t)=>n+t.instances.length,0),placementEvents:timelines.reduce((n,t)=>n+t.events.filter(e=>e.kind==="place").length,0),buttonDefinitions:buttonDefinitions.length,buttonStatePlacements:buttonDefinitions.reduce((n,b)=>n+b.statePlacements.length,0),shapeDefinitions:shapeDefinitions.length,bitmapDefinitions:bitmapDefinitions.length,unparsedTags:unparsedTags.length}};
}
