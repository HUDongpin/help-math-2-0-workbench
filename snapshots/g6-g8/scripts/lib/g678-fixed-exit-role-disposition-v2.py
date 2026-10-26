"""Source role disposition from explicit per-page roles and audited reachability.

Only records source engineering observations. It never changes product acceptance.
"""
from pathlib import Path
import json, hashlib, sys, datetime
B=Path(sys.argv[1]); load=lambda p:json.loads(p.read_text())
m=load(B/'native-v1/source-model-v1.json'); c=load(B/'generator-v1/source-config-v1.json'); cfg=load(B/'generator-v1/role-config-v1.json'); reach=load(B/'audit-v1/reachability-v1.json')
assert c['page']==cfg['page'] and c['page']in [44,45]
def pin(p):
 b=p.read_bytes();return dict(path=str(p),bytes=len(b),sha256=hashlib.sha256(b).hexdigest())
active=set(reach['activeDefinitions']); placed=set(reach['placementReachableDefinitions']); dormant=set(m['findings']['dormantFeedbackStreams']); roles={int(k):v for k,v in cfg['shapeRoles'].items()}
assert set(roles)==active&{s['characterId']for s in m['shapes']}
assert reach['activeTimelineIds']==sorted([c['help'],c['title'],c['right'],c['dynamicDomains'][-1],c['wrong'],c['main']])
domains=[]
for t in m['timelines']:
 key=t['timelineId']; id=None if key=='root'else int(key[7:]); active_domain=id is None or id in reach['activeTimelineIds']
 if id in dormant:assert not t['frames'][0]
 role='Active source domain'if active_domain else'Placed feedback stopped on empty first frame, never selected'if id in dormant else'Dormant feedback descendant'if id in placed else'Unplaced source library'
 domains.append(dict(frameDomain=key,frames=t['declaredFrameCount'],disposition=role,inProduct=active_domain,originalRuntimeVerified=False))
assert len(domains)==c['domains'] and sum(d['inProduct']for d in domains)==7
result=dict(at=datetime.datetime.now(datetime.timezone.utc).isoformat(),source=pin(B/'native-v1/source-model-v1.json'),visual=pin(B/'native-v1/teaching-visual-source-v1.json'),configuration=pin(B/'generator-v1/role-config-v1.json'),generator=pin(Path(__file__).relative_to(Path.cwd())if Path(__file__).is_absolute()else Path(__file__)),domains=domains,shapes=[dict(characterId=s['characterId'],sourceTagSha256=s['sourceTagSha256'],tagName=s['tagName'],disposition=roles[s['characterId']]if s['characterId']in active else'Dormant feedback asset, not selected'if s['characterId']in placed else'Unplaced source library retained')for s in m['shapes']],**reach,activeButtonIds=sorted(active&{s['characterId']for s in m['buttons']}),dynamicText=[dict(characterId=t['characterId'],disposition='Active WrongFeed from current source attempt count'if t['characterId']in active else'Dormant feedback text')for t in m['texts']if t.get('kind')!='static-text'],reviewedImages=[pin(B/p)for p in cfg['reviewedContacts']],scope=cfg['staticScope'],unresolvedLocalCallback=dict(call='_parent.enableButton()',resolution='No local definition; do not invent an unlock operation or alias it to enableQuizButton.'),gates=dict(currentJs=False,registered=False,originalRuntime=False,fidelity=False,listening=False,human=False,owner=False,strict=False,release=False,publication=False))
(B/'audit-v1/source-role-disposition-v1.json').open('x').write(json.dumps(result,indent=2)+'\n');print(json.dumps(dict(page=c['page'],domains=len(domains),activeDomains=7,activeShapes=len(roles))))
