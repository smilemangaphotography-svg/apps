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
    print(f'{label}: {chunk[:1200]}')

print('NAR_51_COMPACT_START')
props=sorted(set(re.findall(r'\bstate\.([A-Za-z_$][A-Za-z0-9_$]*)',s)))
interesting=[x for x in props if re.search(r'admin|store|brand|line|shisha|flavor|layout|gallery|owner',x,re.I)]
print('STATE_PROPS:',','.join(interesting))
for label,pat in [
 ('CHECKED_FLAVORS',r'Only checked flavors appear in this Tobacco Store subcategory\.'),
 ('SHISHA_STATE',r'state\.shishaLoveStore'),
 ('STORE_SETUP',r'Tobacco Store setup'),
 ('ACTIVE_LINES',r'activeLines'),
 ('STORE_FN',r'function\s+beta50Store\s*\('),
 ('SHISHA_FN',r'function\s+beta50ShishaStore\s*\('),
 ('ADMIN_STORE_FN',r'function\s+[A-Za-z0-9_$]*(?:Store|Brand|Line)[A-Za-z0-9_$]*\s*\('),
 ('STATE_SAVE',r'localStorage\.setItem\([^\n]{0,180}(?:admin|store|brand|line|shisha|flavor)'),
 ('STATE_LOAD',r'localStorage\.getItem\([^\n]{0,180}(?:admin|store|brand|line|shisha|flavor)')
]: one(label,pat)
funcs=sorted(set(re.findall(r'function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(',s)))
print('FUNCS:',','.join(f for f in funcs if re.search(r'store|brand|line|shisha|admin|owner|flavor',f,re.I)))
print('NAR_51_COMPACT_END')
