import sys,json,os,collections
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import avm1lib
manifest,registry,srcroot,swfscan,out=sys.argv[1:6]
m=json.load(open(manifest)); reg=json.load(open(registry))
regkeys=set(e['key'] for c in reg['calibrations'] for e in c['entries'])
scan={}
for l in open(swfscan):
    r=json.loads(l)
    if 'sha256' in r: scan[r['sha256']]=r
FEAT={
 'drag':lambda o,s:'StartDrag' in o or 'startDrag' in s,
 'drawingAPI':lambda o,s:'lineTo' in s or 'beginFill' in s,
 'mxUIComponents':lambda o,s:'FUIComponentClass' in s,
 'mxScrollBar':lambda o,s:'FScrollBarClass' in s,
 'setInterval':lambda o,s:'setInterval' in s,
 'onEnterFrame':lambda o,s:'onEnterFrame' in s,
 'random':lambda o,s:'RandomNumber' in o or 'random' in s,
 'attachMovie':lambda o,s:'attachMovie' in s or 'duplicateMovieClip' in s or 'CloneSprite' in o,
 'SoundObject':lambda o,s:'Sound' in s or 'attachSound' in s,
 'textInput/Selection':lambda o,s:'Selection' in s or 'onChanged' in s,
 'KeyListener':lambda o,s:'Key' in s,
 'hitTest':lambda o,s:'hitTest' in s,
 'quizTemplate':lambda o,s:'showRightFeed' in s or 'quizTryCount' in s or 'disableQuizButton' in s,
 'glossaryHyperlinks':lambda o,s:'DoHyperLinks' in s,
 'functions':lambda o,s:'DefineFunction' in o or 'DefineFunction2' in o,
 'clipEvents':lambda o,s:'ClipActions(PlaceObject2)' in o,
 'getURL/fscommand':lambda o,s:'GetURL' in o or 'GetURL2' in o,
 'tellTarget/with':lambda o,s:'SetTarget' in o or 'SetTarget2' in o or 'With' in o,
}
rows=[]
for rel in m['releases']:
    for mem in rel['members']:
        sha=mem['source']['sha256']; path=os.path.join(srcroot,mem['source']['path'].replace('HELP_COURSES/',''))
        r=avm1lib.scan_file(path) if os.path.exists(path) else None
        if r is None: rows.append({'id':mem['animationId'],'missing':True}); continue
        o,s=r; sc=scan.get(sha,{})
        tags=sc.get('tags',{})
        f={k:bool(fn(o,s)) for k,fn in FEAT.items()}
        f['morphShapes']=tags.get('DefineMorphShape',0)>0
        f['streamAudio']=tags.get('SoundStreamBlock',0)>0
        f['buttons']=tags.get('DefineButton2',0)>0
        f['editText']=tags.get('DefineEditText',0)>0
        f['bitmaps']=any(tags.get(t,0) for t in ('DefineBits','DefineBitsJPEG2','DefineBitsJPEG3','DefineBitsLossless','DefineBitsLossless2'))
        rows.append({'id':mem['animationId'],'section':mem['sectionCode'],'registered':mem['animationId'] in regkeys,'version':sc.get('version'),'actionBytes':sc.get('actionBytes'),'spriteFrames':sc.get('spriteFrames'),'rootFrames':sc.get('frames'),'f':f})
json.dump(rows,open(out,'w'))
reg_=[r for r in rows if r.get('registered')]; un=[r for r in rows if r.get('registered') is False]
print('placements',len(rows),'registered',len(reg_),'unregistered',len(un),'missing',sum(1 for r in rows if r.get('missing')))
keys=list(rows[0]['f'].keys())
print(f"{'feature':22s} {'unreg':>6s} {'%':>6s} {'reg':>6s} {'%':>6s}")
for k in keys:
    a=sum(1 for r in un if r['f'][k]); b=sum(1 for r in reg_ if r['f'][k])
    print(f'{k:22s} {a:6d} {100*a/len(un):6.1f} {b:6d} {100*b/len(reg_):6.1f}')
print('unreg by section',collections.Counter(r['section'] for r in un))
print('reg by section',collections.Counter(r['section'] for r in reg_))
import statistics
print('actionBytes median unreg',statistics.median(r['actionBytes'] for r in un),'reg',statistics.median(r['actionBytes'] for r in reg_))
