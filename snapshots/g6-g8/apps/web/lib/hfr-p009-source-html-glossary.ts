import assert from 'node:assert/strict';
import {P009_NATIVE} from '../../../packages/demos/src/hfr/nms-l11-p009-native-binding';
export interface HfrSourceHtmlGlossaryLink {
 readonly kind:'source-html-function-link-v1';readonly sourceTextCharacterId:number;readonly sourceTextTagSha256:string;
 readonly popupSpriteCharacterId:number;readonly sourceFunction:string;readonly sourceActionSha256:string;
 readonly sourceKeyAttribute:string;readonly dictionaryEntryId:string;
}
export interface HfrOwnGlossarySource {
 readonly sourceGlossary:Readonly<{pageKey:string;sourceSha256:string;terms:readonly {dictionaryEntryId:string;sourceKeyAttribute?:string;sourceButtonCharacterId?:number;sourceActionSha256?:string}[]}>;
 readonly sourceHtmlLinks?:readonly HfrSourceHtmlGlossaryLink[];
}
/** Packet byte integrity is verified by the existing reader first. This exact
 * semantic union retains two button releases plus four separately identified
 * source HTML calls; no pseudo-button identity is introduced. */
export function hfrP009SourceGlossaryRequests(pageKey:string,sourceSha256:string,addition:HfrOwnGlossarySource):readonly {dictionaryEntryId:string;sourceKeyAttribute?:string}[]{
 if(pageKey!==P009_NATIVE.animationId){assert.equal(addition.sourceHtmlLinks,undefined,'HTML glossary links require an exact reviewed page');return addition.sourceGlossary.terms;}
 assert.equal(sourceSha256,P009_NATIVE.sourceSha256,'P009 source identity');assert.deepEqual(addition.sourceGlossary,P009_NATIVE.sourceGlossary,'P009 two exact source button releases');
 assert.deepEqual(addition.sourceHtmlLinks,P009_NATIVE.sourceHtmlLinks,'P009 four exact source HTML function links');
 const requests=[...addition.sourceGlossary.terms,...addition.sourceHtmlLinks!];const byEntry=new Map<string,{dictionaryEntryId:string;sourceKeyAttribute?:string}>();
 for(const r of requests){const prior=byEntry.get(r.dictionaryEntryId);if(prior)assert.equal(prior.sourceKeyAttribute,r.sourceKeyAttribute,'P009 button and HTML source key must agree');else byEntry.set(r.dictionaryEntryId,r);}
 assert.deepEqual([...byEntry.keys()].sort(),['express','integers','ratio','rational-numbers']);return [...byEntry.values()];
}
