from pathlib import Path
import re

p=Path('buildsrc/NAR-Mix/app/src/main/assets/app.js')
if not p.exists():
    raise SystemExit('Canonical NAR app.js not found')
s=p.read_text()
marker='NAR BETA 5.0.4 — OWNER AI ROUTE FIX'
if marker in s:
    raise SystemExit('NAR Beta 5.0.4 AI route fix already applied')

# Later Beta wrappers retained the original admin AI function under an alias and
# bound #adminAi to that old function. Force the visible Owner Studio AI row to
# the new 5.0.4 full-page adminAiModal while keeping the backend/data model intact.
patterns=[
    r"(\$\(\s*['\"]#adminAi['\"]\s*\)\.onclick\s*=\s*)[^;]+;",
    r"(document\.querySelector\(\s*['\"]#adminAi['\"]\s*\)\.onclick\s*=\s*)[^;]+;",
]
count=0
for pat in patterns:
    s,n=re.subn(pat, r'\1adminAiModal;', s)
    count+=n

# If the binding is assigned through an element variable, patch the common Beta
# wrapper call where the legacy function alias is used for the admin AI row.
legacy_aliases=[
    'beta491BaseAdminAiModal',
    'beta50BaseAdminAiModal',
    'beta47BaseAdminAiModal',
]
if count==0:
    for alias in legacy_aliases:
        # Limit replacement to onclick assignments so other compatibility paths
        # remain untouched.
        pat=rf'(\.onclick\s*=\s*){re.escape(alias)}\s*;'
        s,n=re.subn(pat, r'\1adminAiModal;', s)
        count+=n

if count==0:
    # Print nearby source in CI for deterministic diagnosis rather than silently
    # shipping a route that still opens the old bottom sheet.
    i=s.find('adminAi')
    print(s[max(0,i-600):i+1200])
    raise SystemExit('Owner Studio #adminAi binding hook not found')

s += f"\n/* {marker}: rebound {count} owner AI click binding(s) */\n"
p.write_text(s)
print(f'Applied NAR Beta 5.0.4 Owner AI route fix to {count} binding(s)')
