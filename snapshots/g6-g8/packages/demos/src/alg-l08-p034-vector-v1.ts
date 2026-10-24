import type {P034Node,P034Vector,P034Visual,P034ColorTransform} from './alg-l08-p034-source-v1';
/** A source clip-depth interval masks later display objects at the same level.
 * The mask itself is never painted. There is one observed mask in P034's
 * selected right feedback, while this preserves overlapping intervals. */
export function p034SceneLayers(visual:P034Visual){
 const nodes=[...visual.nodes].sort((a,b)=>a.depth-b.depth);
 if(new Set(nodes.map(n=>n.depth)).size!==nodes.length)throw Error('p034-duplicate-display-depth');
 const masks=nodes.filter((n):n is P034Vector=>n.kind==='vector'&&n.clipDepth!==null);
 if(masks.some(m=>!Number.isInteger(m.clipDepth)||m.clipDepth!<=m.depth))throw Error('p034-invalid-clip-depth');
 return {masks,layers:nodes.filter(n=>n.kind!=='vector'||n.clipDepth===null).map(node=>({node,masks:masks.filter(mask=>node.depth>mask.depth&&node.depth<=mask.clipDepth!)}))};
}
export function p034RgbTransform(transform:P034ColorTransform){
 if(transform.divisor!==256||transform.multiply.length!==4||transform.add.length!==4||transform.add[3]!==0)throw Error('unsupported-p034-color-transform');
 return [0,1,2].map(i=>({slope:transform.multiply[i]/256,intercept:transform.add[i]/255}));
}
export function p034NeedsRgbFilter(node:P034Node){return p034RgbTransform(node.colorTransform).some(t=>t.slope!==1||t.intercept!==0);}
