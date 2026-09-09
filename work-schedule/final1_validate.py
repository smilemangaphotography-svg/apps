from pathlib import Path

src = Path('app/src/main/java/com/ilia/workschedule/Beta6Activity.kt').read_text()
gradle = Path('app/build.gradle.kts').read_text()

required = [
    'Version 1.0.0',
    'enabled=name.isNotBlank() || image.isNotBlank()',
    'Shift type name (optional)',
    'B10SettingsActionRow(Icons.Outlined.Person,"Job Name"',
    'B10SettingsActionRow(Icons.Outlined.LocationOn,"Default Location"',
    'B10SettingsSwitchRow(Icons.Outlined.Notifications,"Phone Notifications"',
    'B10SettingsActionRow(Icons.Outlined.GridView,"Shift Types"',
    'if (t.name.isNotBlank())',
    'B6LogoSize.LARGE -> if (t.name.isBlank()) .82f else .74f',
    'Modifier.align(Alignment.TopEnd)',
    'contentScale = ContentScale.Fit',
]
for marker in required:
    if marker not in src:
        raise SystemExit(f'Final 1.0 validation failed: missing {marker}')

if 'Beta 0.10.0' in src:
    raise SystemExit('Final 1.0 validation failed: beta label still user-visible')
if 'versionName = "1.0.0"' not in gradle:
    raise SystemExit('Final 1.0 validation failed: versionName is not 1.0.0')
if 'versionCode = 100' not in gradle:
    raise SystemExit('Final 1.0 validation failed: versionCode is not 100')

print('Work Schedule Final 1.0 validation PASSED')
