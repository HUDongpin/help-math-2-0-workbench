# Source-model successor: preserve every exact source action spelling while sharing case-insensitive dictionary content.
from pathlib import Path
import json,hashlib,sys
B=Path(sys.argv[1]);read=lambda p:json.loads(p.read_text());m=read(B/'native-v1/source-model-v1.json');c=read(B/'generator-v1/source-config-v1.json');v=read(B/'native-v1'/c.get('teachingVisualSource','teaching-visual-source-v1.json'));streams=read(B/'native-v1/streams-v1.json');decoded=read(B/'native-v1/decode-native-v1.json');glossary=read(B/'native-v1/glossary-model-v1.json');sha=lambda b:hashlib.sha256(b).hexdigest()
assert m['source']['sha256']==v['sourceSha256']==c['sourceSha256']==sha((B/'source-v1'/(c['stem']+'.swf')).read_bytes());assert decoded['pass']and len(decoded['streams'])==10
clocks=[];sa=None
for d in decoded['streams']:
 assert d['contextClosed'];decoder={k:d[k]for k in['sourceBytes','sourceSha256','sampleRate','channels','decodedSamples','pcmSha256']}
 if d['spriteId']=='SA':sa=decoder;continue
 s=next(s for s in streams if s['spriteId']==d['spriteId']);assert s['sourceSha256']==d['sourceSha256']and s['decodedSamplesCandidate']==d['decodedSamples']
 if d['spriteId']not in[c['right'],c['wrong'],c['main']]:continue
 clocks.append(dict(spriteId=d['spriteId'],sourceFrameCount=s['frameCount'],decoder=decoder,segments=s['segments'],emptyNegativeBlocks=[{k:b[k]for k in['frame','samples','seek','mp3Bytes']}for b in s['blocks']if b['samples']==0 and b['seek']<0]))
assert len(clocks)==3 and sa['sourceSha256']==m['spanishAudio']['sha256']
active=set(read(B/'audit-v1/source-role-disposition-v1.json')['activeDefinitions']);texts=[dict(characterId=t['characterId'],sourceTextId=t['sourceTextId'],text=''.join(r['text']for r in t['runs'])if'runs'in t else None,sourceTagSha256=t['sourceTagSha256'])for t in m['texts']if t['characterId']in active]
terms=[]
for e in glossary['entries']:
 keys=sorted(set(b['sourceActionKey']for b in glossary['caseBindings']if b['dictionaryKey']==e['sourceKeyAttribute']));assert keys and all(k.casefold()==e['sourceKeyAttribute'].casefold()for k in keys)
 for key in keys:terms.append(dict(**e,sourceActionKey=key))
assert len(terms)==len(set(t['sourceActionKey']for t in terms))
assert set(t['sourceActionKey']for t in terms)==set(key for _,key,*_ in c['glossary'])
model=dict(**{k:value for k,value in v.items()if k not in['originalRuntimeAccepted','registered']},fps=12,mainSpriteId=c['main'],mainFrameCount=c['last'],quizFrame=c['quiz'],postQuizFrame=c['quiz']+1,correctAnswer=next(i for i,a in enumerate(c['answers'],1)if a.get('correct')),clocks=clocks,sa=sa,terms=terms,sourceTexts=texts,title='Linear and Nonlinear Functions: Try It!',titleSourceShapeId=c['titleShape'],titleSvgSha256=sha((B/f"source-v1/ffdec/shapes/{c['titleShape']}.svg").read_bytes()),behavior=m['findings'],independentPending=['original-runtime','fidelity','listening','human','Owner','strict','publication'])
p=B/'native-v1'/c.get('productModelFile','visual-model-v1.json');out=json.dumps(model,separators=(',',':'),ensure_ascii=False)+'\n'
if p.exists()or'--check'in sys.argv:assert p.read_text()==out
else:p.open('x').write(out)
print(json.dumps(dict(page=c['page'],spans=len(model['visualStates']),clocks=3,branches=2,sourceTextCount=len(texts),terms=len(terms),registered=False)))
