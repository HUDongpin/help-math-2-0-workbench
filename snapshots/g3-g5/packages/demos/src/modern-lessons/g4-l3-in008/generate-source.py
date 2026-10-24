from pathlib import Path
import json,gzip,hashlib,sys,runpy
B=Path(__file__).resolve().parent
closure=runpy.run_path(str(B/'verify-inputs.py'));R=closure['ROOT'];S=closure['INPUTS'];OUT=B/'source.generated.json'
sha=lambda b:hashlib.sha256(b).hexdigest()
refs=[]
for name in ['frames.json.gz','texts.json','word-reveal.json','roles/shape-roles.json','host-and-quiz-contract.json','source-actions.txt']:
 p=S/name;b=p.read_bytes();refs.append({'path':str(p.relative_to(R)),'bytes':len(b),'sha256':sha(b)})
frames=json.loads(gzip.decompress((S/'frames.json.gz').read_bytes()));texts=json.loads((S/'texts.json').read_text());text={t['characterId']:t for t in texts};words=json.loads((S/'word-reveal.json').read_text());assert len(frames)==217
roles=json.loads((S/'roles/shape-roles.json').read_text());assert len(roles)==18
alpha=lambda p:max(0,min(1,((p.get('colorTransform')or{}).get('multiply',[256]*4)[3]/256)+((p.get('colorTransform')or{}).get('add',[0]*4)[3]/255)))
states=[]
for row in frames:
 f=row['frame'];dl=row['displayList'];present=lambda c:[p for p in dl if p['characterId']==c and alpha(p)>0]
 prose=[]
 for item in words:
  c=item['characterId'];placement=present(c);visible=bool(placement)and all(alpha(p)>=1 for p in placement)
  admitted=[w for w in item['words']if w['wholeWordFrame'] is not None and w['wholeWordFrame']<=f]if visible else[]
  end=max((w['characterRange'][1]for w in admitted),default=0)
  prose.append({'characterId':c,'text':item['text'][:end].rstrip(),'sourceTextIds':[r['sourceTextId']for r in text[c]['runs']],'visible':end>0})
 pointer=present(23);assert len(pointer)<=1
 pointerValue=None if not pointer else {'instanceId':pointer[0]['instanceId'],'x':pointer[0]['matrix'][4],'y':pointer[0]['matrix'][5],'alpha':alpha(pointer[0]),'matrix':pointer[0]['matrix'],'sourceShapeIds':[23,24,26],'sourceBitmapId':25}
 states.append({'frame':f,'phase':'demonstration'if f<216 else 'quiz'if f==216 else 'post-stop-inspection','prompt':prose[0]['text'],'instructions':[p['text']for p in prose[1:]],'prose':prose,'demonstration':{'visible':f<216,'prefix':['10','5','0','−5'],'firstAnswer':'?'if present(28)else'','secondAnswer':'','caret':bool(present(27)),'pointer':pointerValue,'patternEmphasis':bool(present(22)),'newProblemEmphasis':bool(present(32))},'keywordVisible':bool(present(19))and bool(prose[0]['text']),'quizEnabled':f==216})
# The number order is recovered from source glyph x positions rather than guessed.
first=frames[0]['directText'];glyphs=sorted([r for r in first if r['characterId']in[7,8,9,10]],key=lambda r:r['matrix'][4]+text[r['characterId']]['boundsTwips']['left']);prefixRaw=''.join(r['text']for r in glyphs);assert prefixRaw=='10,5,0,5,'
minus=next(p for p in frames[0]['displayList']if p['characterId']==11);bounds=next(r['boundsTwips']for r in roles if r['characterId']==11);minusX=minus['matrix'][4]+bounds['left']*minus['matrix'][0];assert -1557<minusX<-870
out={'schemaVersion':1,'animationId':'course-g04-l03-in-008','sourceSwfSha256':'5462ead920862a48ddbacf7be068f9cadf9e509e7032a2dbbb2659a28e08757f','frameDomain':'sprite-57','frames':217,'quizFrame':216,'title':text[4]['text'],'labels':{'checkAnswer':text[15]['text'],'newProblem':text[16]['text']},'separators':{'prefix':text[7]['text'],'betweenAnswers':text[13]['text'],'afterAnswers':text[12]['text']},'proseDefinitions':words,'states':states,'sourceRefs':refs,'teachingDecisions':{'prefix':'Source x-ordered glyphs 10,5,0,5 plus source shape11 minus immediately before final5. Native full signed token−5.','caret':'Source character27 I flashes inside first answer box63/65/67; rendered as decorative insertion caret, never mathematical letter I.','questionMark':'Sourcecharacter28 question mark is readonly demonstration firstanswer68..185; no inventedtypednumericanswers.','pointer':'Source23/24/26 bitmap25 drawing is tutorialpointer; retain sourcex/y and map to maintained semantic-control anchors, not a secondtimer.','prose':'Whole-source-word full-opacity admission; originaltext preserved, no translation fabricated.','quiz':'Existing maintained seeded five-question reducer; AVM1 random execution notclaimed.','postStop':'217 sourceinspection only; interactivequiz admitted216 only.'}}
raw=(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n').encode()
if '--check'in sys.argv:assert OUT.read_bytes()==raw
else:OUT.write_bytes(raw)
print(json.dumps({'status':'PASS','frames':len(states),'bytes':len(raw),'sha256':sha(raw),'pointerFrames':sum(s['demonstration']['pointer']is not None for s in states)}))
