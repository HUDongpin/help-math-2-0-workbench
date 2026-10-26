from pathlib import Path
import base64,struct,hashlib,json,xml.etree.ElementTree as E,sys,zlib
B=Path(sys.argv[1]).resolve(); ROOT=Path.cwd();config=json.loads((B/'generator-v1/source-config-v1.json').read_text())
OLD=B/'source-v1'
sha=lambda b:hashlib.sha256(b).hexdigest()
swf=(B/'source-v1'/(config['stem']+'.swf')).read_bytes();assert sha(swf)==config['sourceSha256']
def put(p,b):
 if '--check' in sys.argv or p.exists():assert p.read_bytes()==b
 else:p.open('xb').write(b)
put(B/'source-v1/movie.xml',(OLD/'movie.xml').read_bytes())
xml=E.parse(OLD/'movie.xml').getroot();body=zlib.decompress(swf[8:]);assert len(body)+8==struct.unpack('<I',swf[4:8])[0]
def tags(raw,start):
 while start<len(raw):
  h=struct.unpack_from('<H',raw,start)[0];start+=2;c,n=h>>6,h&63
  if n==63:n=struct.unpack_from('<I',raw,start)[0];start+=4
  d=raw[start:start+n];assert len(d)==n;start+=n;yield c,d
  if c==0:break
root_start=(5+4*(body[0]>>3)+7)//8+4
sprites={struct.unpack_from('<H',d)[0]:d for c,d in tags(body,root_start)if c==39}
models=[]
for sid in [r[0]for r in config['rightDomains']+config['wrongDomains']]+[config['main']]:
 sprite=xml.find(f'Header/tags/DefineSprite[@objectID="{sid}"]');head=sprite.find('tags/SoundStreamHead')
 assert(head.get('compression'),head.get('soundRate'),head.get('soundStereo'),head.get('sampleSize'))==('2','2','0','1837')
 latency=struct.unpack('<h',base64.b64decode(head.find('latencySeek/data').text))[0];assert latency==1673
 frame=1;before=0;blocks=[];payload=[]
 for tag in sprite.find('tags'):
  if tag.tag=='SoundStreamBlock':
   raw=base64.b64decode(tag.find('data').text);samples,seek=struct.unpack('<Hh',raw[:4]);part=raw[4:]
   blocks.append({'frame':frame,'samples':samples,'seek':seek,'mp3Bytes':len(part),'samplesBefore':before,'sourceTargetSample':before+seek});before+=samples;payload.append(part)
  if tag.tag=='ShowFrame':frame+=1
 binary=[d for c,d in tags(sprites[sid],4)if c==19]
 assert [(struct.unpack('<Hh',d[:4]),d[4:])for d in binary]==[((b['samples'],b['seek']),p)for b,p in zip(blocks,payload)]
 mp3=b''.join(payload);put(B/f'source-v1/stream-{sid}.mp3',mp3)
 positive=[b for b in blocks if b['samples']>0];first=positive[0]['frame'];runs=[]
 for block in positive:
  residual=block['sourceTargetSample']-(block['frame']-first)*1837
  if not runs or residual!=runs[-1]['sourceResidual']:
   if runs:runs[-1]['endDecodedSample']=block['samplesBefore']
   runs.append({'firstFrame':block['frame'],'firstDecodedSample':block['sourceTargetSample'],'sourceResidual':residual})
 runs[-1]['endDecodedSample']=before
 models.append({'spriteId':sid,'frameCount':frame-1,'sourceSwfSha256':sha(swf),'frameDomain':f'sprite-{sid}','sourceBytes':len(mp3),'sourceSha256':sha(mp3),'sampleRate':22050,'channels':1,'decodedSamplesCandidate':before,'latency':latency,'blocks':blocks,'segments':[{k:r[k]for k in ['firstFrame','firstDecodedSample','endDecodedSample']}for r in runs],'binaryXmlEquivalent':True,'sourceSampleSize':1837,'physicalSamplesPerFrame':1837.5,'maxWithinRunPhysicalResidualSamples':max((b['frame']-runs[-1]['firstFrame'])*.5 for b in positive),'clockScope':'source-coordinate grouping and native physical-rate candidate; fractional per-frame discrepancy retained; no original-runtime alignment claim'})
put(B/'native-v1/streams-v1.json',(json.dumps(models,indent=2)+'\n').encode());print(json.dumps([{'sprite':m['spriteId'],'bytes':m['sourceBytes'],'segments':m['segments']}for m in models]))
