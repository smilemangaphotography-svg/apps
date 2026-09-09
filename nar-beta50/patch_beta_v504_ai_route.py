from pathlib import Path
import re

p=Path('buildsrc/NAR-Mix/app/src/main/assets/app.js')
if not p.exists():
    raise SystemExit('Canonical NAR app.js not found')
s=p.read_text()
marker='NAR BETA 5.0.4 — OWNER AI ROUTE FIX'
if marker in s:
    raise SystemExit('NAR Beta 5.0.4 AI route fix already applied')
if 'function beta504AdminAiModal(){' not in s:
    raise SystemExit('Isolated Beta 5.0.4 AI function missing')

# Later Beta wrappers retain older adminAiModal declarations. Never route through
# that overloaded name. Bind the visible Owner Studio row to the unique 5.0.4
# function and add one capture guard so retained listeners cannot reopen the old sheet.
patterns=[
    r"(\$\(\s*['\"]#adminAi['\"]\s*\)\.onclick\s*=\s*)[^;]+;",
    r"(document\.querySelector\(\s*['\"]#adminAi['\"]\s*\)\.onclick\s*=\s*)[^;]+;",
]
count=0
for pat in patterns:
    s,n=re.subn(pat, r'\1beta504AdminAiModal;', s)
    count+=n

legacy_aliases=[
    'beta491BaseAdminAiModal',
    'beta50BaseAdminAiModal',
    'beta47BaseAdminAiModal',
    'adminAiModal',
]
for alias in legacy_aliases:
    pat=rf'(\.onclick\s*=\s*){re.escape(alias)}\s*;'
    s,n=re.subn(pat, r'\1beta504AdminAiModal;', s)
    count+=n

anchor=s.find('function aiBrandId(')
if anchor<0:
    raise SystemExit('Could not locate in-scope AI route insertion anchor')

guard=r'''/* NAR BETA 5.0.4 — OWNER AI ROUTE FIX */
if(!window.__narBeta504OwnerAiRoute){
  window.__narBeta504OwnerAiRoute=true;
  document.addEventListener('click',e=>{
    const node=e.target&&e.target.nodeType===1?e.target:null;
    const b=node&&node.closest?node.closest('#adminAi'):null;
    if(!b)return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    beta504AdminAiModal();
  },true);
}
'''
s=s[:anchor]+guard+s[anchor:]

p.write_text(s)
print(f'Applied NAR Beta 5.0.4 isolated Owner AI route: {count} direct binding(s) plus capture guard')
