from pathlib import Path
import re
p=Path('buildsrc/NAR-Mix/app/src/main/assets/app.js')
s=p.read_text()

def func(name,limit=5000):
    m=re.search(r'function\s+'+re.escape(name)+r'\s*\([^)]*\)\s*\{',s)
    if not m:
        print('FUNC',name,'NOT_FOUND');return
    i=m.end()-1;depth=0;q=None;esc=False
    while i<len(s):
        ch=s[i]
        if q:
            if esc: esc=False
            elif ch=='\\': esc=True
            elif ch==q: q=None
        else:
            if ch in "'\"`": q=ch
            elif ch=='{': depth+=1
            elif ch=='}':
                depth-=1
                if depth==0:
                    print('FUNC',name, re.sub(r'\s+',' ',s[m.start():i+1])[:limit]);return
        i+=1
    print('FUNC',name,'UNTERMINATED')

def around(label,pat,r=1200):
    ms=list(re.finditer(pat,s,re.I|re.S))
    print('MATCH',label,'COUNT',len(ms))
    for n,m in enumerate(ms[:6]):
        a=max(0,m.start()-r);b=min(len(s),m.end()+r)
        print('AROUND',label,n,re.sub(r'\s+',' ',s[a:b])[:3000])

print('NAR_SHISHA_V51_DIAG_START')
for n in ['beta50ShishaStore','publicShisha51','app','home']:
    func(n)
around('HOME_SHISHA',r'homeShisha50')
around('BETA50_SHISHA_ASSIGN',r'beta50ShishaStore\s*=')
around('SHISHA_OPEN',r'beta50ShishaOpen')
around('TOBACCO_BRANDS',r'Tobacco Brands')
print('NAR_SHISHA_V51_DIAG_END')
