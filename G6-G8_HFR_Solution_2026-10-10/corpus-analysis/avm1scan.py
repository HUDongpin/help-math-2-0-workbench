import sys, zlib, struct, os, json, collections
OPS={0x04:'NextFrame',0x05:'PreviousFrame',0x06:'Play',0x07:'Stop',0x08:'ToggleQuality',0x09:'StopSounds',0x0A:'Add',0x0B:'Subtract',0x0C:'Multiply',0x0D:'Divide',0x0E:'Equals',0x0F:'Less',0x10:'And',0x11:'Or',0x12:'Not',0x13:'StringEquals',0x14:'StringLength',0x15:'StringExtract',0x17:'Pop',0x18:'ToInteger',0x1C:'GetVariable',0x1D:'SetVariable',0x20:'SetTarget2',0x21:'StringAdd',0x22:'GetProperty',0x23:'SetProperty',0x24:'CloneSprite',0x25:'RemoveSprite',0x26:'Trace',0x27:'StartDrag',0x28:'EndDrag',0x29:'StringLess',0x2A:'Throw',0x2B:'CastOp',0x2C:'ImplementsOp',0x30:'RandomNumber',0x31:'MBStringLength',0x32:'CharToAscii',0x33:'AsciiToChar',0x34:'GetTime',0x35:'MBStringExtract',0x36:'MBCharToAscii',0x37:'MBAsciiToChar',0x3A:'Delete',0x3B:'Delete2',0x3C:'DefineLocal',0x3D:'CallFunction',0x3E:'Return',0x3F:'Modulo',0x40:'NewObject',0x41:'DefineLocal2',0x42:'InitArray',0x43:'InitObject',0x44:'TypeOf',0x45:'TargetPath',0x46:'Enumerate',0x47:'Add2',0x48:'Less2',0x49:'Equals2',0x4A:'ToNumber',0x4B:'ToString',0x4C:'PushDuplicate',0x4D:'StackSwap',0x4E:'GetMember',0x4F:'SetMember',0x50:'Increment',0x51:'Decrement',0x52:'CallMethod',0x53:'NewMethod',0x54:'InstanceOf',0x55:'Enumerate2',0x60:'BitAnd',0x61:'BitOr',0x62:'BitXor',0x63:'BitLShift',0x64:'BitRShift',0x65:'BitURShift',0x66:'StrictEquals',0x67:'Greater',0x68:'StringGreater',0x69:'Extends',0x81:'GotoFrame',0x83:'GetURL',0x87:'StoreRegister',0x88:'ConstantPool',0x8A:'WaitForFrame',0x8B:'SetTarget',0x8C:'GoToLabel',0x8D:'WaitForFrame2',0x8E:'DefineFunction2',0x8F:'Try',0x94:'With',0x96:'Push',0x99:'Jump',0x9A:'GetURL2',0x9B:'DefineFunction',0x9D:'If',0x9E:'Call',0x9F:'GotoFrame2'}
def cstr(b,p):
    e=b.index(0,p); return b[p:e].decode('latin1'),e+1
opc=collections.Counter(); opfiles=collections.Counter(); strs=collections.Counter(); strfiles=collections.Counter()
geturl=collections.Counter(); unknown=collections.Counter()
def actions(data, p, end, fileops, filestrs):
    while p<end:
        code=data[p]; p+=1
        if code==0: break
        ln=0
        if code>=0x80:
            ln=struct.unpack('<H',data[p:p+2])[0]; p+=2
        name=OPS.get(code); 
        if name is None: unknown[hex(code)]+=1; name=hex(code)
        opc[name]+=1; fileops.add(name)
        body=data[p:p+ln]
        if code==0x88:
            n=struct.unpack('<H',body[:2])[0]; q=2
            for _ in range(n):
                s,q=cstr(body,q); strs[s]+=1; filestrs.add(s)
        elif code==0x96:
            q=0
            while q<len(body):
                t=body[q]; q+=1
                if t==0: s,q=cstr(body,q); strs[s]+=1; filestrs.add(s)
                elif t==1: q+=4
                elif t in (2,3): pass
                elif t==4: q+=1
                elif t==5: q+=1
                elif t==6: q+=8
                elif t==7: q+=4
                elif t==8: q+=1
                elif t==9: q+=2
                else: break
        elif code==0x83:
            u,q=cstr(body,0); t,_=cstr(body,q); geturl[(u[:60],t[:30])]+=1
        elif code in (0x9B,0x8E):
            # function bodies follow inline; codeSize at end of header; we just continue scanning linearly (bodies are inline)
            pass
        p+=ln
def walk(data,p,end,fileops,filestrs):
    while p<end:
        h=struct.unpack('<H',data[p:p+2])[0]; p+=2
        code=h>>6; ln=h&0x3f
        if ln==0x3f: ln=struct.unpack('<I',data[p:p+4])[0]; p+=4
        if code==12: actions(data,p,p+ln,fileops,filestrs)
        elif code==59: actions(data,p+2,p+ln,fileops,filestrs)
        elif code==39: walk(data,p+4,p+ln,fileops,filestrs)
        elif code==34: # DefineButton2: id(2) flags(1) actionOffset(2) ... records... then BUTTONCONDACTION
            q=p+3; off=struct.unpack('<H',data[q:q+2])[0]
            if off:
                q=q+off
                while q<p+ln:
                    sz=struct.unpack('<H',data[q:q+2])[0]
                    actions(data,q+4,(q+sz) if sz else p+ln,fileops,filestrs)
                    if sz==0: break
                    q+=sz
        elif code==26: # PlaceObject2 with clip actions
            flags=data[p]
            if flags & 0x80:
                q=p+1+2  # depth
                if flags&0x02: q+=2
                # matrix / cxform variable length; skip by heuristic: not parsed
                fileops.add('ClipActions(PlaceObject2)'); opc['ClipActions(PlaceObject2)']+=1
        p+=ln
        if code==0 and p>=end: return
files=0
for dp,dn,fn in os.walk(sys.argv[1]):
    for n in fn:
        if not n.lower().endswith('.swf'): continue
        b=open(os.path.join(dp,n),'rb').read()
        if b[:3]==b'CWS': body=zlib.decompress(b[8:])
        elif b[:3]==b'FWS': body=b[8:]
        else: continue
        nbits=body[0]>>3; rb=(5+4*nbits+7)//8
        fo=set(); fs=set()
        try: walk(body,rb+4,len(body),fo,fs)
        except Exception as e: pass
        for o in fo: opfiles[o]+=1
        for s in fs: strfiles[s]+=1
        files+=1
out={'files':files,'opcodes':{k:[opc[k],opfiles[k]] for k in sorted(opc,key=lambda k:-opfiles[k])},'unknown':dict(unknown),
     'getURL':[[list(k),v] for k,v in geturl.most_common(80)],
     'strings_by_files':[[s,c] for s,c in strfiles.most_common(1500)]}
json.dump(out,open(sys.argv[2],'w'),indent=0)
print('files',files,'distinct opcodes',len(opc),'distinct strings',len(strfiles))
