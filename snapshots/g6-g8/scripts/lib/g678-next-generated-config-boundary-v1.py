"""Verify only known Next-generated type paths before exact-byte restoration."""
import json,re

def verified_generated_config(name,before,current,dist_directory):
    if current==before:return False
    assert dist_directory=='.next-alg-p001-production-scan','exact local scan target'
    if name=='next-env.d.ts':
        pattern=rb'import "(\./[^"\n]+/)(routes|root-params)\.d\.ts";'
        imports=list(re.finditer(pattern,before))
        assert len(imports)==2 and {m.group(2) for m in imports}=={b'routes',b'root-params'},'two known Next imports'
        baseline={m.group(1) for m in imports};assert len(baseline)==1,'one exact baseline type tree'
        prefix=baseline.pop()
        assert prefix in {b'./.next/dev/types/',b'./.next-alg-p001-local-qa/dev/types/'},'known default or local QA baseline'
        replacement=b'./'+dist_directory.encode()+b'/types/'
        assert current==before.replace(prefix,replacement),'exact Next import rewrite only'
    elif name=='tsconfig.json':
        source,generated=json.loads(before),json.loads(current)
        added=[dist_directory+'/types/**/*.ts',dist_directory+'/dev/types/**/*.ts']
        assert generated['include']==source['include']+added,'two known scan includes only'
        generated['include']=source['include']
        assert generated==source,'all other TypeScript config unchanged'
    else:raise AssertionError('unreviewed config mutation: '+name)
    return True
