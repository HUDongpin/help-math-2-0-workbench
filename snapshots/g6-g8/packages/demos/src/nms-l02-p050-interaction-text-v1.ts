import {P050_ITEMS,type P050State} from './nms-l02-p050-practice-v1';
import {p050CanSelect} from './nms-l02-p050-choice-v1';
import {P050_TEXT,type P050Language} from './nms-l02-p050-text-v1';
export function p050TargetLabel(state:P050State,itemId:number,language:P050Language){
 const item=P050_ITEMS.find(value=>value.id===itemId);if(!item)throw Error('P050_TARGET_LABEL');
 const text=P050_TEXT[language],index=[...P050_ITEMS].sort((a,b)=>a.tenths-b.tenths).findIndex(value=>value.id===itemId);
 return state.solved.includes(itemId)?`${text.solved}: ${item.decimal}`:`${text.position} ${index+1}`;
}
export function p050SelectionText(state:P050State,selection:number|null,language:P050Language){
 if(selection===null||!p050CanSelect(state,selection))return '';
 return `${P050_TEXT[language].selected}: ${P050_ITEMS.find(item=>item.id===selection)!.decimal}`;
}
