from pathlib import Path

manifest = Path('app/src/main/AndroidManifest.xml').read_text()
gradle = Path('app/build.gradle.kts').read_text()
source = Path('app/src/main/java/com/ilia/workschedule/Beta6Activity.kt').read_text()
required = [
    ('android:icon="@mipmap/ic_launcher"', manifest),
    ('android:roundIcon="@mipmap/ic_launcher_round"', manifest),
    ('versionCode = 101', gradle),
    ('versionName = "1.0.1"', gradle),
    ('Version 1.0.1', source),
]
for token, text in required:
    if token not in text:
        raise SystemExit(f'1.0.1 icon validation failed: {token}')
for path in [
    'app/src/main/res/drawable/ic_launcher_foreground.xml',
    'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
    'app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
    'app/src/main/res/values/colors.xml',
]:
    if not Path(path).exists():
        raise SystemExit(f'1.0.1 icon validation failed: missing {path}')
print('Work Schedule 1.0.1 launcher icon validation passed')
