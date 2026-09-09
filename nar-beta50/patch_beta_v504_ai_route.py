from pathlib import Path
import re

p=Path('buildsrc/NAR-Mix/app/src/main/assets/app.js')
if not p.exists():
    raise SystemExit('Canonical NAR app.js not found')
s=p.read_text()
marker='NAR BETA 5.0.4 — OWNER AI ROUTE FIX'
if marker in s:
    raise SystemExit('NAR Beta 5.0.4 AI route fix already applied')

# Later Beta wrappers retained the original admin AI function under aliases/listeners.
# Rebind direct onclick hooks where possible, then install one capture-phase guard
# INSIDE the canonical app closure. The guard stops any retained legacy listener
# before it can reopen the old bottom sheet.
patterns=[
    r"(\$\(\s*['\"]#adminAi['\"]\s*\)\.onclick\s*=\s*)[^;]+;",
    r"(document\.querySelector\(\s*['\"]#adminAi['\"]\s*\)\.onclick\s*=\s*)[^;]+;",
]
count=0
for pat in patterns:
    s,n=re.subn(pat, r'\1adminAiModal;', s)
    count+=n

legacy_aliases=[
    'beta491BaseAdminAiModal',
    'beta50BaseAdminAiModal',
    'beta47BaseAdminAiModal',
]
for alias in legacy_aliases:
    pat=rf'(\.onclick\s*=\s*){re.escape(alias)}\s*;'
    s,n=re.subn(pat, r'\1adminAiModal;', s)
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
    adminAiModal();
  },true);
}
'''
s=s[:anchor]+guard+s[anchor:]

p.write_text(s)
print(f'Applied NAR Beta 5.0.4 Owner AI route fix: {count} direct binding(s) plus capture guard')
