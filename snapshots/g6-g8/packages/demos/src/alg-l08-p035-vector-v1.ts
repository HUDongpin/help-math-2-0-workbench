import type {P035Node,P035Vector,P035Visual,P035ColorTransform} from './alg-l08-p035-source-v1';
/** A source clip-depth interval masks later display objects at the same level.
 * The mask itself is never painted. P035's selected scenes contain no masks;
 * this generic interval handling preserves any source clip-depth intervals. */
export function p035SceneLayers(visual:P035Visual){
 const nodes=[...visual.nodes].sort((a,b)=>a.depth-b.depth);
 if(new Set(nodes.map(n=>n.depth)).size!==nodes.length)throw Error('p035-duplicate-display-depth');
 const masks=nodes.filter((n):n is P035Vector=>n.kind==='vector'&&n.clipDepth!==null);
 if(masks.some(m=>!Number.isInteger(m.clipDepth)||m.clipDepth!<=m.depth))throw Error('p035-invalid-clip-depth');
 return {masks,layers:nodes.filter(n=>n.kind!=='vector'||n.clipDepth===null).map(node=>({node,masks:masks.filter(mask=>node.depth>mask.depth&&node.depth<=mask.clipDepth!)}))};
}
export function p035RgbTransform(transform:P035ColorTransform){
 if(transform.divisor!==256||transform.multiply.length!==4||transform.add.length!==4||transform.add[3]!==0)throw Error('unsupported-p035-color-transform');
 return [0,1,2].map(i=>({slope:transform.multiply[i]/256,intercept:transform.add[i]/255}));
}
export function p035NeedsRgbFilter(node:P035Node){return p035RgbTransform(node.colorTransform).some(t=>t.slope!==1||t.intercept!==0);}
