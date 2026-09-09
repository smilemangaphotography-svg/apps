from pathlib import Path
import re
p=Path('buildsrc/NAR-Mix/app/src/main/assets/app.js')
s=p.read_text()
print('NAR_51_SOURCE_INSPECT_START')
terms=['activeLines','active lines','Tobacco Store setup','state.shishaLoveStore','shishaLoveStore','beta50Store','adminStore','storeMeta','activeBrands','owned','subcategories','Only checked flavors','state.admin']
for term in terms:
    print('\n=== TERM',term,'===')
    for m in list(re.finditer(re.escape(term),s,re.I))[:12]:
        a=max(0,m.start()-700); b=min(len(s),m.end()+1400)
        print(s[a:b].replace('\r',''))
        print('\n---')
# enumerate state property tokens seen in source
props=sorted(set(re.findall(r'\bstate\.([A-Za-z_$][A-Za-z0-9_$]*)',s)))
print('\nSTATE_PROPERTIES',props)
# useful function names
funcs=sorted(set(re.findall(r'function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(',s)))
print('\nSTORE_ADMIN_FUNCTIONS',[f for f in funcs if re.search(r'store|brand|line|shisha|admin|owner|flavor',f,re.I)])
print('NAR_51_SOURCE_INSPECT_END')
