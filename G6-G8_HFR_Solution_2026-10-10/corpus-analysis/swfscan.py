import sys, zlib, struct, os, json, hashlib, collections
TAGS = {0:'End',1:'ShowFrame',2:'DefineShape',4:'PlaceObject',5:'RemoveObject',6:'DefineBits',7:'DefineButton',8:'JPEGTables',9:'SetBackgroundColor',10:'DefineFont',11:'DefineText',12:'DoAction',13:'DefineFontInfo',14:'DefineSound',15:'StartSound',17:'DefineButtonSound',18:'SoundStreamHead',19:'SoundStreamBlock',20:'DefineBitsLossless',21:'DefineBitsJPEG2',22:'DefineShape2',24:'Protect',26:'PlaceObject2',28:'RemoveObject2',32:'DefineShape3',33:'DefineText2',34:'DefineButton2',35:'DefineBitsJPEG3',36:'DefineBitsLossless2',37:'DefineEditText',39:'DefineSprite',43:'FrameLabel',45:'SoundStreamHead2',46:'DefineMorphShape',48:'DefineFont2',56:'ExportAssets',57:'ImportAssets',58:'EnableDebugger',59:'DoInitAction',60:'DefineVideoStream',61:'VideoFrame',62:'DefineFontInfo2',64:'EnableDebugger2',65:'ScriptLimits',66:'SetTabIndex',69:'FileAttributes',70:'PlaceObject3',71:'ImportAssets2',73:'DefineFontAlignZones',74:'CSMTextSettings',75:'DefineFont3',76:'SymbolClass',77:'Metadata',78:'DefineScalingGrid',82:'DoABC',83:'DefineShape4',84:'DefineMorphShape2',86:'DefineSceneAndFrameLabelData',87:'DefineBinaryData',88:'DefineFontName',89:'StartSound2',90:'DefineBitsJPEG4',91:'DefineFont4',72:'DoABC1',41:'ProductInfo',63:'DebugID'}
def read(path):
    b=open(path,'rb').read()
    sig=b[:3]; ver=b[3]
    if sig==b'CWS': body=zlib.decompress(b[8:])
    elif sig==b'FWS': body=b[8:]
    else: return {'path':path,'sig':sig.decode('latin1'),'error':'unsupported'}
    nbits=body[0]>>3; rbytes=(5+4*nbits+7)//8
    pos=rbytes
    fr=body[pos+1]+body[pos]/256; fc=struct.unpack('<H',body[pos+2:pos+4])[0]; pos+=4
    # rect
    bits=''.join(f'{x:08b}' for x in body[:rbytes])
    vals=[int(bits[5+i*nbits:5+(i+1)*nbits],2) for i in range(4)]
    def s(v):
        return v-(1<<nbits) if v&(1<<(nbits-1)) else v
    xmin,xmax,ymin,ymax=[s(v) for v in vals]
    counts=collections.Counter(); action_bytes=0; sprite_frames=0; nested_actions=0
    def walk(data,p,end,depth):
        nonlocal action_bytes,sprite_frames,nested_actions
        while p<end:
            h=struct.unpack('<H',data[p:p+2])[0]; p+=2
            code=h>>6; ln=h&0x3f
            if ln==0x3f: ln=struct.unpack('<I',data[p:p+4])[0]; p+=4
            name=TAGS.get(code,f'T{code}')
            counts[name]+=1
            if code in (12,59):
                action_bytes+=ln
                if depth>0: nested_actions+=1
            if code==39:
                sprite_frames+=struct.unpack('<H',data[p+2:p+4])[0]
                walk(data,p+4,p+ln,depth+1)
            if code in (7,34,26,70):
                pass
            p+=ln
            if code==0 and depth>0: return
    walk(body,pos,len(body),0)
    avm2 = counts.get('DoABC',0)+counts.get('DoABC1',0)>0
    return {'path':path,'sig':sig.decode(),'version':ver,'w':(xmax-xmin)/20,'h':(ymax-ymin)/20,'fps':fr,'frames':fc,
            'avm':'AVM2' if avm2 else 'AVM1','actionBytes':action_bytes,'nestedActionTags':nested_actions,'spriteFrames':sprite_frames,
            'tags':dict(counts),'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b)}
if __name__=='__main__':
    root=sys.argv[1]; out=sys.argv[2]
    with open(out,'w') as f:
        for dp,dn,fn in os.walk(root):
            for n in fn:
                if n.lower().endswith('.swf'):
                    p=os.path.join(dp,n)
                    try: r=read(p)
                    except Exception as e: r={'path':p,'error':repr(e)}
                    f.write(json.dumps(r)+'\n')
