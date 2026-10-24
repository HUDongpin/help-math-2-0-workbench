import metrics from'./layout-metrics.json';
export interface Rect {left:number;top:number;right:number;bottom:number}
export const bounds=(x:number,y:number,w:number,h:number):Rect=>({left:x-w/2,top:y-h/2,right:x+w/2,bottom:y+h/2});
export const intersects=(a:Rect,b:Rect)=>Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top);
export function cityBadgeBounds(text:string,x:number,y:number){const d=(metrics.badgeDimensions as Record<string,{width:number;height:number}>)[text];if(!d)throw Error('Uncalibrated city badge');return bounds(x,y,d.width+1,d.height+1)}
export function placeDemoMarker(x:number,y:number,obstacles:readonly Rect[]){for(const dy of[0,-36,36,-72,72]){const candidate=bounds(x,y+dy,30,30);if(candidate.left>=0&&candidate.right<=800&&candidate.top>=0&&candidate.bottom<=600&&!obstacles.some(b=>intersects(candidate,b)))return{x,y:y+dy,dy,sourceX:x,sourceY:y,bounds:candidate}}throw Error('No clear bounded demo marker position');}
