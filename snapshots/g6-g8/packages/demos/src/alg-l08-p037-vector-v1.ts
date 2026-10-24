import type {P037Node,P037Vector,P037Visual,P037ColorTransform} from './alg-l08-p037-source-v1';
/** A source clip-depth interval masks later display objects at the same level.
 * The mask itself is never painted. There is one observed mask in P037's
 * selected right feedback, while this preserves overlapping intervals. */
export function p037SceneLayers(visual:P037Visual){
 const nodes=[...visual.nodes].sort((a,b)=>a.depth-b.depth);
 if(new Set(nodes.map(n=>n.depth)).size!==nodes.length)throw Error('p037-duplicate-display-depth');
 const masks=nodes.filter((n):n is P037Vector=>n.kind==='vector'&&n.clipDepth!==null);
 if(masks.some(m=>!Number.isInteger(m.clipDepth)||m.clipDepth!<=m.depth))throw Error('p037-invalid-clip-depth');
 return {masks,layers:nodes.filter(n=>n.kind!=='vector'||n.clipDepth===null).map(node=>({node,masks:masks.filter(mask=>node.depth>mask.depth&&node.depth<=mask.clipDepth!)}))};
}
export function p037RgbTransform(transform:P037ColorTransform){
 if(transform.divisor!==256||transform.multiply.length!==4||transform.add.length!==4||transform.add[3]!==0)throw Error('unsupported-p037-color-transform');
 return [0,1,2].map(i=>({slope:transform.multiply[i]/256,intercept:transform.add[i]/255}));
}
export function p037NeedsRgbFilter(node:P037Node){return p037RgbTransform(node.colorTransform).some(t=>t.slope!==1||t.intercept!==0);}
