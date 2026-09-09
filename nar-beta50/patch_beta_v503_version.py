from pathlib import Path
import re

app = Path('buildsrc/NAR-Mix/app')
candidates = [app / 'build.gradle', app / 'build.gradle.kts']
files = [p for p in candidates if p.exists()]
if not files:
    raise SystemExit('NAR app Gradle file not found')

changed = False
for p in files:
    s = p.read_text()
    original = s
    # Keep one canonical package/install lineage while making the visible Beta
    # version agree with the tested release name.
    s = re.sub(r'(?m)^(\s*versionCode\s*[= ]\s*)\d+', r'\g<1>550', s)
    s = re.sub(r'(?m)^(\s*versionName\s*[= ]\s*)["\'][^"\']*["\']', r'\g<1>"5.0.0-beta"', s)
    if s != original:
        p.write_text(s)
        changed = True

if not changed:
    raise SystemExit('NAR Beta version metadata hook not found')
print('Applied NAR Beta 5.0.3 version metadata: versionCode 550, versionName 5.0.0-beta')
