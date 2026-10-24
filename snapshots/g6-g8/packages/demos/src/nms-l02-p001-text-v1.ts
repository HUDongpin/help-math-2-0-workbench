import type {LessonTextBinding} from './lesson-text-contract';import {buildLessonTextSnapshot} from './lesson-text-snapshot';import type {P001FrameState} from './nms-l02-p001-timeline-v1';
export const P001_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p001-native-source-v1',animationId:'shared-nms002-l02-p001',placementId:'shared-nms002-l02-p001',sourceSwfSha256:'1985e363a5f283bfde0c9e48718a97d49a055b583220525c8e6ed1e20e6b1b42',template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:['character-100/run-0','character-101/run-0'],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'introduction',sourceTextIds:['character-100/run-1','character-101/run-1'],role:'body',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'fractions',sourceTextIds:['character-87','character-88','character-89','character-91','character-93'],sourceShapeIds:[90,92,94],role:'label',language:'en',readingOrder:2,valueSource:'source-static'},
 {id:'decimal-list',sourceTextIds:['character-103'],role:'label',language:'en',readingOrder:3,valueSource:'source-static'},
 {id:'number-forms',sourceTextIds:['character-106','character-109','character-111'],sourceShapeIds:[110],role:'label',language:'en',readingOrder:4,valueSource:'source-static'},
 ...([96,97,98,99]as const).map((id,index)=>({id:'ambient-'+id,sourceTextIds:['character-'+id],role:'label' as const,language:'en' as const,readingOrder:5+index,valueSource:'source-static' as const}))
]as const)});
export function p001TextSnapshot(state:P001FrameState){const has=(...ids:number[])=>ids.some(id=>state.visibleTextIds.includes(id));return buildLessonTextSnapshot(P001_TEXT_BINDING,{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:'source-introduction',lang:state.language,seed:state.seed,replay:state.replay},{
 'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible:has(100,101)},introduction:{text:'Introduction',visible:has(100,101)},fractions:{text:'1/2, 1/5, 1 2/3',visible:has(87,88,89,93)},'decimal-list':{text:'0, −10, −4.5',visible:has(103)},'number-forms':{text:'3, 3.0, 3.0 × 10², π, √2',visible:has(106,109,111)},'ambient-96':{text:'0.4',visible:has(96)},'ambient-97':{text:'−1',visible:has(97)},'ambient-98':{text:'−2.3',visible:has(98)},'ambient-99':{text:'10',visible:has(99)}
});}
