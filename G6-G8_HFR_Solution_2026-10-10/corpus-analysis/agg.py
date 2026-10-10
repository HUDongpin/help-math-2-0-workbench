import json,sys,collections,statistics
rows=[json.loads(l) for l in open(sys.argv[1])]
print('pages',len(rows))
fatal=[r for r in rows if not r.get('ok')]; print('fatal',len(fatal), collections.Counter(r.get('fatal','')[:80] for r in fatal).most_common(8))
ok=[r for r in rows if r.get('ok')]
err=[r for r in ok if r['errors']]; print('pages with interpreter errors',len(err))
ec=collections.Counter()
for r in err:
    for e in set(r['errors']): ec[e[:110]]+=1
for e,c in ec.most_common(25): print(f'  {c:5d} {e}')
mb=collections.Counter()
for r in ok:
    for k in r['missingBuiltin']: mb[k]+=1
print('missing builtins (pages):', mb.most_common(30))
ms=collections.Counter()
for r in ok:
    for k in r['missingShell']: ms[k]+=1
print('missing shell (pages):', ms.most_common(30))
notes=collections.Counter()
for r in ok:
    for k in r['notes']: notes[k.split(':')[0]]+=1
print('notes kinds (pages):', notes.most_common(10))
clean=[r for r in ok if not r['errors'] and not r['missingBuiltin']]
print('clean (no errors, no missing builtins):',len(clean), f"{100*len(clean)/len(rows):.1f}%")
for flag in (True,False):
    sub=[r for r in rows if r['registered']==flag]; c=[r for r in sub if r.get('ok') and not r['errors'] and not r['missingBuiltin']]
    print(' registered' if flag else ' unregistered', len(sub), 'clean', len(c), f"{100*len(c)/len(sub):.1f}%")
print('ticks median',statistics.median(r['ticks'] for r in ok),'clicks median',statistics.median(len(r['clicks']) for r in ok),'ms median',statistics.median(r['ms'] for r in rows),'ms max',max(r['ms'] for r in rows))
print('pages with zero clicks',sum(1 for r in ok if not r['clicks']))
hk=collections.Counter()
for r in ok:
    for k in r['host']: hk[k]+=1
print('host calls (pages):',hk.most_common(25))
print('preloader handshake reached', sum(1 for r in ok if 'shell.preloader' in r['host']))
fb=sum(1 for r in ok if 'shell.showRightFeed' in r['host'] or 'shell.showWrongFeed' in r['host']); print('pages reaching right/wrong feedback via shell',fb)
oc=collections.Counter()
for r in ok:
    for k in r['opcodes']: oc[k]+=1
print('distinct opcodes executed',len(oc))
