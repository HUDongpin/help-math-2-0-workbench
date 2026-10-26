"""Source audit for the observed ALG introduction two-layer title family.

Accepts exact source pins and a reviewed title/frame count. It writes nothing;
page-owned generators persist the result. Neither library shape counts nor a
successful extraction authorize original-runtime or typography acceptance.
"""
from pathlib import Path
import base64,collections,hashlib,json,struct,xml.etree.ElementTree as E,zlib

def digest(b):return hashlib.sha256(b).hexdigest()
def file_pin(p,root=None):
 p=Path(p);assert p.is_file()and not p.is_symlink()and p.resolve()==p,str(p)
 b=p.read_bytes();return dict(path=str(p.relative_to(root))if root and p.is_relative_to(root)else str(p),bytes=len(b),sha256=digest(b))
def source_tags(body,start):
 while start<len(body):
  assert start+2<=len(body);h=struct.unpack_from('<H',body,start)[0];start+=2;code,size=h>>6,h&63
  if size==63:assert start+4<=len(body);size=struct.unpack_from('<I',body,start)[0];start+=4
  data=body[start:start+size];assert len(data)==size;start+=size;yield code,data
  if code==0:assert start==len(body),'unreviewed post-End bytes';break

def derive_title_source(*,root,animation_id,source,source_sha,copy,xml,export,frame_count,title,catalog=None):
 root=Path(root);source,copy,xml,export=map(Path,(source,copy,xml,export));source_pin=file_pin(source);assert source_pin['sha256']==source_sha;assert copy.read_bytes()==source.read_bytes();xml_pin=file_pin(xml,root);swf=E.fromstring(xml.read_bytes());h=swf.find('Header');tags=h.find('tags')
 assert swf.get('version')=='6'and h.attrib=={'framerate':'12','frames':'10'};assert h.find('size/Rectangle').attrib=={'left':'0','right':'16000','top':'0','bottom':'12000'}
 assert tags.find('SetBackgroundColor/color/Color').attrib=={'red':'184','green':'216','blue':'247'}
 frame=1;placements=[];actions=[]
 for t in tags:
  if t.tag=='ShowFrame':frame+=1
  elif t.tag.startswith('PlaceObject'):placements.append((frame,t))
  elif t.tag=='DoAction':actions.append(frame)
 assert frame==11 and actions==[1,6]and len(placements)==1
 f,p=placements[0];assert f==6 and p.attrib=={'replace':'0','depth':'1','objectID':'142','morph':'5','name':'animation'};assert p.find('transform/Transform').attrib=={'transX':'8248','transY':'5666'};assert len(list(p))==1
 root_scripts=[]
 for f,expected in [(1,'_level0.InternalPreloader.gotoAndPlay("jump_check");\nstop();'),(6,'stop();')]:
  s=export/f'scripts/frame_{f}/DoAction.as';assert '\n'.join(s.read_text().splitlines()).strip()==expected;root_scripts.append(file_pin(s,root))
 # Both DoInitAction tags belong to unplaced library component symbols.
 init_ids=[int(t.get('sprite'))for t in tags if t.tag=='DoInitAction'];assert init_ids==[13,94]
 font=tags.find('DefineFont2[@objectID="118"]');assert font.get('name')=='Bauhaus Md BT';glyphs=[chr(int(g.get('map')))for g in font.find('glyphs')];texts=[]
 for cid,color in [(140,{'red':'255','green':'255','blue':'255'}),(141,{'red':'16','green':'60','blue':'156'})]:
  t=tags.find(f'DefineText[@objectID="{cid}"]');value=''.join(glyphs[int(g.get('glyph'))]for g in t.findall('.//TextEntry'));assert ' '.join(value.split())==title
  fp=export/f'texts/{cid}.txt';assert ' '.join(fp.read_text().replace('--- RECORDSEPARATOR ---','').split())==title
  records=[r for r in t.findall('.//TextRecord6')if r.get('isSetup')=='1'];assert all(r.get('objectID','118')=='118'for r in records)
  run_color=None;runs=[]
  for rr in t.findall('.//TextRecord6'):
   if rr.get('isSetup')=='1':
    cc=rr.find('color/Color')
    if cc is not None:run_color=cc.attrib
   else:
    part=''.join(glyphs[int(g.get('glyph'))]for g in rr.findall('.//TextEntry'));assert run_color==color or (cid==141 and not part.strip()and run_color=={'red':'255','green':'255','blue':'255'});runs.append(dict(text=part,color=run_color))
  texts.append(dict(characterId=cid,text=value,fontCharacterId=118,runs=runs,boundsTwips=t.find('bounds/Rectangle').attrib,records=[dict(attributes=r.attrib,color=r.find('color/Color').attrib if r.find('color/Color')is not None else None)for r in records],ffdec=file_pin(fp,root)))
 sprite=tags.find('DefineSprite[@objectID="142"]');assert sprite.get('frames')==str(frame_count);st=sprite.find('tags');assert collections.Counter(t.tag for t in st)=={'PlaceObject2':2*frame_count-2,'SoundStreamBlock':frame_count,'ShowFrame':frame_count,'SoundStreamHead':1,'End':1}
 head=st.find('SoundStreamHead');assert head.attrib=={'playbackRate':'2','playbackSize':'1','playbackStereo':'0','compression':'2','soundRate':'2','soundSize':'1','soundStereo':'0','sampleSize':'1837'}
 active={};frames=[];blocks=[];audio=None;sample_count=0
 for t in st:
  if t.tag=='PlaceObject2':
   assert set(t.attrib)<={'replace','depth','objectID'};depth=int(t.get('depth'));assert depth in (1,2);cid=int(t.get('objectID',active.get(depth,{}).get('characterId',0)));assert cid==139+depth
   m=t.find('transform/Transform');c=t.find('colorTransform/ColorTransform2');assert m is not None and not any(k in m.attrib for k in ('skewX','skewY'));assert all(x.tag in ['transform','colorTransform']for x in t);assert c is None or set(c.attrib)<={'factorRed','factorGreen','factorBlue','factorAlpha','offsetRed','offsetGreen','offsetBlue','offsetAlpha'}
   if c is not None:assert all(int(c.get(k,'256'))==256 for k in ['factorRed','factorGreen','factorBlue'])and all(int(c.get(k,'0'))==0 for k in ['offsetRed','offsetGreen','offsetBlue','offsetAlpha'])
   active[depth]=dict(characterId=cid,depth=depth,scaleX=float(m.get('scaleX','1')),scaleY=float(m.get('scaleY','1')),xTwips=int(m.get('transX','0')),yTwips=int(m.get('transY','0')),alpha256=int(c.get('factorAlpha','256'))if c is not None else 256)
  elif t.tag=='SoundStreamBlock':
   assert audio is None;raw=base64.b64decode(t.findtext('data'),validate=True);assert len(raw)>=4;samples,seek=struct.unpack('<Hh',raw[:4]);assert seek>=0
   audio=dict(sampleCount=samples,seekSamples=seek,mp3Bytes=len(raw)-4,mp3Sha256=digest(raw[4:]));blocks.append(raw);sample_count+=samples
  elif t.tag=='ShowFrame':
   assert set(active)=={1,2}and audio is not None;assert tuple(active[1][k]for k in ['scaleX','scaleY','alpha256'])==tuple(active[2][k]for k in ['scaleX','scaleY','alpha256']);frames.append(dict(frame=len(frames)+1,layers=[active[1],active[2]],audio=audio));audio=None
 assert len(frames)==frame_count and frames[0]['audio']['seekSamples']==1673 and frames[-1]['layers']==frames[-2]['layers']
 raw=source.read_bytes();assert raw[:3]in[b'CWS',b'FWS'];body=zlib.decompress(raw[8:])if raw[:3]==b'CWS'else raw[8:];assert len(body)+8==struct.unpack_from('<I',raw,4)[0];offset=(5+4*(body[0]>>3)+7)//8+4
 sprites={struct.unpack_from('<H',d)[0]:d for c,d in source_tags(body,offset)if c==39};binary_blocks=[d for c,d in source_tags(sprites[142],4)if c==19];assert binary_blocks==blocks
 mp3=b''.join(b[4:]for b in blocks);catalog_pin=None
 if catalog is not None:
  catalog=Path(catalog);catalog_pin=file_pin(catalog,root);cat=json.loads(catalog.read_text());assert cat['sourceSha256']==source_sha and not cat['unparsedTags'];main=next(t for t in cat['timelines']if t['timelineId']=='sprite-142');assert main['observedFrameCount']==main['declaredFrameCount']==frame_count;assert not main['trailingAfterEnd'];assert not any(e['kind']=='action-bytes'or e.get('flags',{}).get('hasClipActions')for e in main['events'])
 model=dict(schemaVersion=1,animationId=animation_id,source=source_pin,copy=file_pin(copy,root),xml=xml_pin,binaryCatalog=catalog_pin,rootScripts=root_scripts,title=title,stage=dict(width=800,height=600,backgroundColor='#b8d8f7'),fps=12,rootFrameCount=10,rootEntryFrame=6,rootPlacement=dict(characterId=142,xTwips=8248,yTwips=5666),frameDomain='sprite-142',frameCount=frame_count,texts=texts,frames=frames,stream=dict(head=head.attrib,blockCount=len(blocks),sampleCount=sample_count,firstSeekSamples=1673,bytes=len(mp3),sha256=digest(mp3),binaryXmlEquivalent=True),behavior=dict(sourceChildDisposition='loop-no-terminal-script',rootHostDependency='InternalPreloader.jump_check; exact historical host execution unverified',reachableInteractiveControls=0,unreachableLibraryScripts='DoInitAction symbols13/94 and progress-bar/button symbols are not placed by the reachable root/main display list.',sourceLoopClaim='Authored timeline disposition only; historical shell interference is not established.',spanishAudio='No separate same-stem audio in the audited lesson source inventory; embedded voice language and listening are unaccepted.',originalRuntimeAccepted=False))
 return model,mp3
