import type{SceneNode}from'./scene';
/** Exact source18 background instances; never a generic rectangle/blue/ID filter. */
const BACKGROUNDS=new Set(['main/sprite-200/depth-116/generation-1','main/sprite-200/depth-83/generation-1']);
export function in009SemanticPaintIds(nodes:readonly SceneNode[]):string[]{
 const result:string[]=[];
 const walk=(items:readonly SceneNode[],parentVisible:boolean)=>{for(const node of items){const visible=parentVisible&&node.visible;if(!visible||node.clipDepth!==undefined)continue;
  if(node.kind==='sprite'){walk(node.children??[],visible);continue;}
  if(node.kind!=='shape'&&node.kind!=='morph')continue;
  if(node.characterId===18&&BACKGROUNDS.has(node.id))continue;
  // worldColor already composes every ancestor's color transform. A child's
  // additive alpha can survive a local zero multiplier; do not inspect local alpha.
  const multiply=node.worldColor.multiply[3],add=node.worldColor.add[3];
  if(Number.isFinite(multiply)&&Number.isFinite(add)&&Math.max(add,255*multiply/256+add)<=0)continue;
  result.push(node.id);
 }};walk(nodes,true);return result;
}
