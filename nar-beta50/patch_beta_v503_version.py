from pathlib import Path
import re

root = Path('buildsrc/NAR-Mix')
if not root.exists():
    raise SystemExit('Extracted NAR project not found')

# The canonical source/earlier patches may express Android version metadata in
# Gradle or the manifest. Search only Android build metadata files and update
# the existing version string in place; package/application identity is not touched.
files = []
for pattern in ('**/build.gradle', '**/build.gradle.kts', '**/AndroidManifest.xml'):
    files.extend(root.glob(pattern))
files = list(dict.fromkeys(files))
if not files:
    raise SystemExit('NAR Android metadata files not found')

changed = False
found_version = False
for p in files:
    try:
        s = p.read_text()
    except UnicodeDecodeError:
        continue
    original = s

    # Groovy/Kotlin DSL forms: versionName "x", versionName 'x', versionName = "x".
    s, n1 = re.subn(
        r'(?m)(\bversionName\s*(?:=\s*)?)["\'][^"\']+["\']',
        r'\g<1>"5.0.0-beta"',
        s,
    )
    # Manifest form: android:versionName="x".
    s, n2 = re.subn(
        r'(android:versionName\s*=\s*)["\'][^"\']+["\']',
        r'\g<1>"5.0.0-beta"',
        s,
    )
    # Fallback for the known prior Beta string if a plugin generated unusual syntax.
    if '4.9.1-beta' in s:
        s = s.replace('4.9.1-beta', '5.0.0-beta')
        n1 += 1

    # Preserve/increment canonical install lineage to versionCode 550.
    s, _ = re.subn(r'(?m)(\bversionCode\s*(?:=\s*)?)\d+', r'\g<1>550', s)
    s, _ = re.subn(r'(android:versionCode\s*=\s*)["\']\d+["\']', r'\g<1>"550"', s)

    if '5.0.0-beta' in s:
        found_version = True
    if s != original:
        p.write_text(s)
        changed = True
        print(f'Updated Beta version metadata in {p}')

if not found_version:
    raise SystemExit('NAR Beta versionName metadata hook not found')

print('Applied NAR Beta 5.0.3 metadata: versionCode 550, versionName 5.0.0-beta' + (' (updated)' if changed else ' (already correct)'))
