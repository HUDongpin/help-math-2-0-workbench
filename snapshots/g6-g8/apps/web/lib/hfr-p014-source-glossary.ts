import assert from 'node:assert/strict';
import {P014_META} from '../../../packages/demos/src/hfr/nms-l11-p014-meta';
import type {HfrOwnGlossarySource} from './hfr-p009-source-html-glossary';
/** P014 has seven original button actions and six bilingual dictionary entries.
 * Validate every action before reducing descriptor membership; the two Rational
 * numbers actions keep distinct source IDs and bytecode identities. */
export function hfrP014SourceGlossaryRequests(pageKey:string,sourceSha256:string,addition:HfrOwnGlossarySource){
 assert.equal(pageKey,P014_META.key);assert.equal(sourceSha256,P014_META.sourceSha256);
 assert.equal(addition.sourceHtmlLinks,undefined,'P014 uses seven source buttons');
 assert.deepEqual(addition.sourceGlossary,P014_META.sourceGlossary,'P014 all seven exact source button actions');
 const terms=addition.sourceGlossary.terms;
 assert.deepEqual(terms.map(t=>t.sourceButtonCharacterId),[40,41,42,43,78,79,80]);
 const byEntry=new Map<string,(typeof terms)[number]>();
 for(const t of terms){const prior=byEntry.get(t.dictionaryEntryId);if(prior)assert.equal(prior.sourceKeyAttribute,t.sourceKeyAttribute);else byEntry.set(t.dictionaryEntryId,t);}
 assert.deepEqual([...byEntry.keys()].sort(),['expression','integers','number-line','position','ratio','rational-numbers']);
 return [...byEntry.values()];
}
