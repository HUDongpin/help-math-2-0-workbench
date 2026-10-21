import sys,os,zlib,struct,json,collections
ROOTS={'_level0','_root','_parent','_global'}
calls=collections.Counter(); files=collections.defaultdict(set); sets=collections.Counter()
def actions(data,p,end,fname):
    pool=[]; st=[]
    def pop():
        return st.pop() if st else None
    while p<end:
        code=data[p]; p+=1
        if code==0: break
        ln=0
        if code>=0x80: ln=struct.unpack('<H',data[p:p+2])[0]; p+=2
        body=data[p:p+ln]
        if code==0x88:
            n=struct.unpack('<H',body[:2])[0]; q=2; pool=[]
            for _ in range(n):
                e=body.index(0,q); pool.append(body[q:e].decode('latin1')); q=e+1
        elif code==0x96:
            q=0
            while q<len(body):
                t=body[q]; q+=1
                if t==0: e=body.index(0,q); st.append(('s',body[q:e].decode('latin1'))); q=e+1
                elif t==1: st.append(('n',None)); q+=4
                elif t in (2,3): st.append(('u',None))
                elif t==4: st.append(('r',None)); q+=1
                elif t==5: st.append(('b',None)); q+=1
                elif t==6: st.append(('n',None)); q+=8
                elif t==7: st.append(('i',struct.unpack('<i',body[q:q+4])[0])); q+=4
                elif t==8: i=body[q]; st.append(('s',pool[i] if i<len(pool) else None)); q+=1
                elif t==9: i=struct.unpack('<H',body[q:q+2])[0]; st.append(('s',pool[i] if i<len(pool) else None)); q+=2
                else: break
        elif code==0x1C: # GetVariable
            n=pop()
            if n and n[0]=='s' and n[1] and n[1].split('.')[0] in ROOTS: st.append(('root',n[1]))
            else: st.append(('?',None))
        elif code==0x4E: # GetMember
            mname=pop(); obj=pop()
            if obj and obj[0]=='root' and mname and mname[0]=='s':
                st.append(('root',obj[1]+'.'+str(mname[1])))
            else: st.append(('?',None))
        elif code==0x52: # CallMethod
            mname=pop(); obj=pop(); nargs=pop()
            if obj and obj[0]=='root' and mname and mname[0]=='s':
                k=obj[1]+'.'+str(mname[1])+'()'; calls[k]+=1; files[k].add(fname)
            n=nargs[1] if nargs and nargs[0]=='i' else 0
            for _ in range(n if isinstance(n,int) and 0<=n<50 else 0): pop()
            st.append(('?',None))
        elif code==0x4F: # SetMember
            val=pop(); mname=pop(); obj=pop()
            if obj and obj[0]=='root' and mname and mname[0]=='s':
                k=obj[1]+'.'+str(mname[1])+' ='; calls[k]+=1; files[k].add(fname)
        elif code==0x1D: # SetVariable
            val=pop(); n=pop()
            if n and n[0]=='s' and n[1] and n[1].split('.')[0] in ROOTS:
                k=n[1]+' ='; calls[k]+=1; files[k].add(fname)
        elif code==0x3D: # CallFunction
            fn=pop(); nargs=pop()
            n=nargs[1] if nargs and nargs[0]=='i' else 0
            for _ in range(n if isinstance(n,int) and 0<=n<50 else 0): pop()
            st.append(('?',None))
        elif code==0x17: pop()
        elif code in (0x9D,0x99,0x9B,0x8E,0x87,0x4C,0x4D): 
            if code==0x9D: pop()
            if code==0x4C and st: st.append(st[-1])
            if code==0x4D and len(st)>1: st[-1],st[-2]=st[-2],st[-1]
            if code in (0x9B,0x8E): st.clear()
        else:
            st.clear()
        p+=ln
def walk(data,p,end,fname):
    while p<end:
        h=struct.unpack('<H',data[p:p+2])[0]; p+=2
        code=h>>6; ln=h&0x3f
        if ln==0x3f: ln=struct.unpack('<I',data[p:p+4])[0]; p+=4
        if code==12: actions(data,p,p+ln,fname)
        elif code==59: actions(data,p+2,p+ln,fname)
        elif code==39: walk(data,p+4,p+ln,fname)
        elif code==34:
            q=p+3; off=struct.unpack('<H',data[q:q+2])[0]
            if off:
                q=q+off
                while q<p+ln:
                    sz=struct.unpack('<H',data[q:q+2])[0]
                    actions(data,q+4,(q+sz) if sz else p+ln,fname)
                    if sz==0: break
                    q+=sz
        p+=ln
        if code==0 and p>=end: return
for dp,dn,fn in os.walk(sys.argv[1]):
    for n in fn:
        if not n.lower().endswith('.swf'): continue
        b=open(os.path.join(dp,n),'rb').read()
        if b[:3]==b'CWS': body=zlib.decompress(b[8:])
        elif b[:3]==b'FWS': body=b[8:]
        else: continue
        nb=body[0]>>3; rb=(5+4*nb+7)//8
        try: walk(body,rb+4,len(body),os.path.join(dp,n))
        except Exception as e: pass
rows=sorted(((k,len(files[k]),calls[k]) for k in calls),key=lambda x:-x[1])
json.dump(rows,open(sys.argv[2],'w'),indent=0)
for k,f,c in rows[:90]: print(f'{f:5d} files {c:6d} uses  {k}')
print('distinct root-anchored members',len(rows))
