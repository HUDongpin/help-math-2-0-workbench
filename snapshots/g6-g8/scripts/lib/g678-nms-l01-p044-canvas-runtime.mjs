// Maintained exact-page drawing request validation, not source behavior execution.
export function createMethods({targetCanvas,sourceImages,placements,domains,rootStep,sourceDraw}) {
  const exact=(value,keys,label)=>{if(!value||Array.isArray(value)||typeof value!=='object'||Object.keys(value).sort().join('|')!==keys.slice().sort().join('|'))throw Error(`Invalid ${label} fields`);};
  const stepKey=step=>{exact(step,['parentDomain','depth','sourceObjectId','placementFrame'],'source instance step');
    if(typeof step.parentDomain!=='string'||!Number.isSafeInteger(step.depth)||!Number.isSafeInteger(step.sourceObjectId)||!Number.isSafeInteger(step.placementFrame))throw Error('Invalid source instance identity');
    return [step.parentDomain,step.depth,step.sourceObjectId,step.placementFrame];};
  const pathKey=path=>{if(!Array.isArray(path)||path.length<2||path.length>18)throw Error('Invalid full instance path');
    const key=path.map(stepKey);if(JSON.stringify(key[0])!==JSON.stringify(stepKey(rootStep)))throw Error('Invalid source root instance');return JSON.stringify(key);};
  const identity=p=>({parentDomain:p.parentDomain,depth:p.depth,sourceObjectId:p.sourceObjectId,placementFrame:p.placementFrame});
  function prepare(request){exact(request,['rootFrame','mainFrame','instances'],'drawing request');if(request.rootFrame!==6||!Number.isSafeInteger(request.mainFrame)||request.mainFrame<1||request.mainFrame>759||!Array.isArray(request.instances)||request.instances.length>512)throw Error('Invalid source drawing frame or overrides');
    const overrideMap=new Map();for(const override of request.instances){exact(override,['path','frame','visible'],'instance override');const key=pathKey(override.path);if(overrideMap.has(key)||typeof override.visible!=='boolean'||!Number.isSafeInteger(override.frame)||override.frame<1)throw Error('Duplicate or invalid source override');overrideMap.set(key,override);}
    const used=new Set(),active=[],activeKeys=new Set();
    function visit(domain,frame,parentPath,seen){if(seen.includes(domain))throw Error('Unexpected source recursion');const scope=domains[domain];if(!scope||frame<1||frame>scope.frameCount)throw Error('Invalid source child frame');
      for(const[index,defaultFrame0]of scope.frames[frame-1]){const p=placements[index],path=parentPath.concat(identity(p)),key=pathKey(path),override=overrideMap.get(key),nextFrame=override?.frame??(defaultFrame0%p.frameCount+1);
        if(nextFrame>p.frameCount)throw Error('Override outside exact source child domain');if(activeKeys.has(key))throw Error('Source instance identity collision');activeKeys.add(key);if(override)used.add(key);
        active.push({path,sourceObjectId:p.sourceObjectId,name:p.name,frame:nextFrame,visible:override?.visible??true});
        const child=`sprite-${p.sourceObjectId}`;if(domains[child])visit(child,nextFrame,path,seen.concat(domain));
      }
    }
    visit('sprite-293',request.mainFrame,[rootStep],[]);if(used.size!==overrideMap.size)throw Error('Unknown, stale, or aliased source instance override');
    return {overrideMap,active,request};
  }
  let readyPromise;
  function ready(){if(!readyPromise)readyPromise=Promise.all(sourceImages.map((image,index)=>{if(typeof image.src!=='string'||!image.src.startsWith('data:image/'))return Promise.reject(Error('Non-embedded source image'));
      if(image.complete&&image.naturalWidth>0)return Promise.resolve();return new Promise((resolve,reject)=>{image.onload=()=>{image.onload=null;image.onerror=null;if(image.naturalWidth>0)resolve();else reject(Error(`Empty source image ${index}`));};image.onerror=()=>reject(Error(`Source image decode failed ${index}`));});})).then(()=>undefined);return readyPromise;}
  function listInstances(request){return prepare(request).active;}
  function render(request){const state=prepare(request);if(targetCanvas.width!==800||targetCanvas.height!==600)throw Error('Exact source canvas must be800x600');
    if(sourceImages.some(image=>!image.complete||image.naturalWidth<1))throw Error('Await source ready() before render');sourceDraw(state);
    return {rootFrame:6,mainFrame:request.mainFrame,sourceObjectId:293,activeInstanceCount:state.active.length,overriddenInstances:state.overrideMap.size};}
  return Object.freeze({ready,render,listInstances});
}
