from pathlib import Path
import json,gzip,hashlib,sys,runpy,subprocess,tempfile,shutil,argparse
B=Path(__file__).resolve().parent;closure=runpy.run_path(str(B/'verify-inputs.py'));R=closure['ROOT'];I=closure['INPUTS'];M=closure['MANIFEST'];parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');parser.add_argument('--source-swf');args=parser.parse_args();SWF=Path(args.source_swf).resolve()if args.source_swf else R/M['sourceSwfRepositoryPath'];subprocess.run(['node',str(B/'source-verify.mjs'),'--source-swf',str(SWF)],check=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
def ref(p):b=p.read_bytes();return {'path':str(p.relative_to(R)),'bytes':len(b),'sha256':sha(b)}
def emit(name,value,indent=None):
 b=(json.dumps(value,ensure_ascii=False,indent=indent,separators=None if indent else(',',':'))+'\n').encode();target=B/name
 if args.check:assert target.read_bytes()==b,name+' drift'
 else:target.write_bytes(b)
 return sha(b)
with tempfile.TemporaryDirectory(prefix='in009-source-replay-')as tmp:
 T=Path(tmp)
 for row in M['files']:
  if 'replayPath'not in row:continue
  dest=T/row['replayPath'];dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(R/row['path'],dest)
 dest=T/M['sourceSwfRepositoryPath'];dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(SWF,dest)
 W=T/'work/typography-v1';S=W/'g4l3-in009-source-v1'
 def run(name,*tail):subprocess.run([sys.executable,str(W/name),*tail],check=True,stdout=subprocess.DEVNULL)
 for name in ['extract.py','morphs.py','dispositions.py','words.py']:run('g4l3-in009-source-v1/'+name)
 # Every regenerated source audit output must retain its reviewed bytes; archived contact sheets/logs remain frozen evidence, not freshly generated claims.
 sourceManifest=json.loads((I/'source/manifest.json').read_text())
 for row in sourceManifest['outputs']:
  b=(T/row['path']).read_bytes();assert len(b)==row['bytes']and sha(b)==row['sha256'],row['path']
 run('g4l3-in009-geometry-v1/generate-geometry.py','--check');run('g4l3-in009-runtime-packing-v1/pack.py','--check');run('g4l3-in009-map-clip-v2/project.py','--check')
 run('g4l3-in009-native-source-v1/generate.py','--check');run('g4l3-in009-weather-data-v3/generate.py','--census',str(W/'g4l3-in009-weather-census-v3/census.json'),'--sha','710a8ae281a18dddf9b7700e9ac49e7755a5014d25d9e98515a3fa624b86d16a');run('g4l3-in009-native-surface-v1/generate-geometry.py')
 source=json.loads((W/'g4l3-in009-native-source-v1/staged/source.generated.json').read_text());assert sha((W/'g4l3-in009-native-source-v1/staged/source.generated.json').read_bytes())=='f12047d65b178ff9e759f169e1981f5c26528ac4bc918d8a9231bd5404906efa';source.pop('pending');source.pop('acceptance');source['kind']='in009-native-source';source['policies']['terminal']='Modern once visual hold637 with separately declared terminal audio EOF; original source637 contains no authored stop.';source['sourceRefs']=[ref(I/'source'/Path(x['path']).relative_to('work/typography-v1/g4l3-in009-source-v1'))for x in source['sourceRefs']]
 weather=json.loads((W/'g4l3-in009-weather-data-v3/dataset.generated.json').read_text());oldWeather=json.loads((I/'reviewed/weather-reference.json').read_text());assert weather==oldWeather;weather['kind']='in009-weather-native-labels';[weather.pop(k)for k in ['censusStatus','censusReview','censusClaimBoundary']]
 rawClip=json.loads(gzip.decompress((W/'g4l3-in009-map-clip-v2/projection.json.gz').read_bytes()));keep=['sourceFrame','sourceInstanceId','sourceShapeId','visible','alpha','clipPaths','admittedLabelIds','semanticVisibility','tiles'];clip={'sourceRef':ref(I/'reviewed/projection.json.gz'),'frames':[{'frame':f['frame'],'slots':[{k:s[k]for k in keep}for s in f['slots']]}for f in rawClip['frames']]};assert clip['frames']==json.loads((I/'reviewed/clip-reference.json').read_text())['frames']
 thermo=json.loads((W/'g4l3-in009-native-surface-v1/geometry.generated.json').read_text());assert thermo==json.loads((I/'reviewed/thermometer-reference.json').read_text());thermo['references']=[ref(I/'reviewed/source-reference.json'),ref(I/'source/texts.json'),ref(I/'source/frames.json.gz'),ref(I/'reviewed/census.json'),ref(I/'reviewed/clip-summary.json')]
 hashes={name:emit(name,value,indent)for name,value,indent in [('source.generated.json',source,None),('weather.generated.json',weather,2),('clip.generated.json',clip,None),('thermometer-geometry.generated.json',thermo,2)]}
 for value in[source,weather,clip,thermo]:assert 'work/typography-v1'not in json.dumps(value),'Runtime output work dependency'
print(json.dumps({'status':'CLEAN_INPUT_SOURCE_REPLAY_CHECK_PASS'if args.check else'CLEAN_INPUT_GENERATED','outputs':hashes,'source41Preserved':True,'geometry074cPacked255aClipf94Nativef120Replayed':True,'newFfdecOrOcr':False}))
