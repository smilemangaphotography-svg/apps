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
            elif ch==q:q=None
        else:
            if ch in "'\"`":q=ch
            elif ch=='{':depth+=1
            elif ch=='}':
                depth-=1
                if depth==0:
                    print('FUNC',name,re.sub(r'\s+',' ',s[m.start():i+1])[:limit]);return
        i+=1
    print('FUNC',name,'UNTERMINATED')

def around(label,pat,r=1200):
    ms=list(re.finditer(pat,s,re.I|re.S))
    print('MATCH',label,'COUNT',len(ms))
    for n,m in enumerate(ms[:8]):
        a=max(0,m.start()-r);b=min(len(s),m.end()+r)
        print('AROUND',label,n,'POS',m.start(),re.sub(r'\s+',' ',s[a:b])[:3200])

def positions(label,pat):
    ps=[m.start() for m in re.finditer(pat,s,re.S)]
    print('POSITIONS',label,ps[-30:])

print('NAR_SHISHA_V51_DIAG_START')
for n in ['beta50ShishaStore','publicShisha51','app','home']:
    func(n)
around('HOME_SHISHA',r'homeShisha50')
around('BETA50_SHISHA_ASSIGN',r'beta50ShishaStore\s*=')
around('SHISHA_OPEN',r'beta50ShishaOpen')
around('TOBACCO_BRANDS',r'Tobacco Brands')
print('NAR_SCOPE_DIAG_START')
for label,pat in [
 ('STATE_DECL',r'\b(?:const|let|var)\s+state\s*='),
 ('DOLLAR_DECL',r'\b(?:const|let|var)\s+\$\s*='),
 ('DB_DECL',r'\b(?:const|let|var)\s+DB\s*='),
 ('BETA50_MARK',r'NAR BETA 5\.0 — APPROVED 10-SCREEN LOCK'),
 ('BETA507_MARK',r'NAR BETA 5\.0\.7 — ROOT NAV \+ PROFILE ARCHITECTURE'),
 ('BETA51_MARK',r'NAR BETA 5\.1\.0 — OWNER DATA \+ LAYOUT FOUNDATION'),
]:
    positions(label,pat)
positions('IIFE_OPEN',r'\(function\s*\(\)\s*\{')
positions('IIFE_CLOSE',r'\}\)\(\);')
# Print the exact lexical neighborhood immediately before the 5.1 marker.
m=re.search(r'/\* NAR BETA 5\.1\.0 — OWNER DATA \+ LAYOUT FOUNDATION \*/',s)
if m:
    a=max(0,m.start()-5000);b=min(len(s),m.start()+500)
    print('BEFORE_51',re.sub(r'\s+',' ',s[a:b]))
# Print tail after 5.1 so we know whether anything important follows it.
print('TAIL',re.sub(r'\s+',' ',s[-5000:]))
print('NAR_SCOPE_DIAG_END')
print('NAR_SHISHA_V51_DIAG_END')
