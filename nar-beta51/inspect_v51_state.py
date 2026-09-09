from pathlib import Path
import re
p=Path('buildsrc/NAR-Mix/app/src/main/assets/app.js')
s=p.read_text()

def one(label, pattern, radius=420, flags=re.I|re.S):
    m=re.search(pattern,s,flags)
    if not m:
        print(f'{label}: NOT_FOUND')
        return
    a=max(0,m.start()-radius); b=min(len(s),m.end()+radius)
    chunk=re.sub(r'\s+',' ',s[a:b]).strip()
    print(f'{label}: {chunk[:2400]}')

def function_body(name):
    m=re.search(r'function\s+'+re.escape(name)+r'\s*\([^)]*\)\s*\{',s)
    if not m:
        print(f'FUNC_{name}: NOT_FOUND')
        return
    start=m.start(); i=m.end()-1; depth=0; quote=None; esc=False
    while i < len(s):
        ch=s[i]
        if quote:
            if esc: esc=False
            elif ch=='\\': esc=True
            elif ch==quote: quote=None
        else:
            if ch in "'\"`": quote=ch
            elif ch=='{': depth+=1
            elif ch=='}':
                depth-=1
                if depth==0:
                    body=re.sub(r'\s+',' ',s[start:i+1]).strip()
                    print(f'FUNC_{name}: {body[:5000]}')
                    return
        i+=1
    print(f'FUNC_{name}: UNTERMINATED')

print('NAR_51_COMPACT_START')
props=sorted(set(re.findall(r'\bstate\.([A-Za-z_$][A-Za-z0-9_$]*)',s)))
interesting=[x for x in props if re.search(r'admin|store|brand|line|shisha|flavor|layout|gallery|owner',x,re.I)]
print('STATE_PROPS:',','.join(interesting))
for fn in ['ensureBetaState','betaActiveLines','betaLineActive','betaSetLineActive','lineNamesForBrand','lineAlias','save','admin','adminStoreModal','adminStoreBrandModal']:
    function_body(fn)
for label,pat in [
 ('STORE_ACTIVE_ASSIGN',r'state\.storeActiveLines\s*='),
 ('STORE_LINE_TOGGLE',r'data-store-line-toggle'),
 ('OWNER_STORE_BUTTON',r'(?:Tobacco Store setup|Store setup)'),
 ('ADMIN_STORE_CALL',r'adminStoreModal\s*\(')
]: one(label,pat,1000)
print('NAR_51_COMPACT_END')
