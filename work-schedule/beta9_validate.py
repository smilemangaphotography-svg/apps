from pathlib import Path

s = Path('app/src/main/java/com/ilia/workschedule/Beta6Activity.kt').read_text()

required = [
    'B6SettingRow(Icons.Outlined.Person,"Job Name"',
    'B6SettingRow(Icons.Outlined.LocationOn,"Default Location"',
    'B6SettingRow(Icons.Outlined.Notifications,"Phone Notifications"',
    'B6SettingRow(Icons.Outlined.GridView,"Shift Types"',
    'B6SettingRow(Icons.Outlined.Info,"About","Beta 0.9.0")',
    'onSettings = { tab = B6Tab.SETTINGS }',
    'IconButton(onSettings) { Icon(Icons.Outlined.Settings, null, tint = B6Text) }',
]
for token in required:
    if token not in s:
        raise SystemExit(f'Beta 0.9 validation failed: missing {token}')

for forbidden in [
    'B6SettingRow(Icons.Outlined.DarkMode,"Appearance"',
    'B6SettingRow(Icons.Outlined.FileDownload,"Backup & Export"',
]:
    # These must not appear inside the Settings screen after the patch.
    start = s.find('@Composable private fun B6SettingsScreen(')
    end = s.find('@Composable private fun B6Header', start)
    settings = s[start:end]
    if forbidden in settings:
        raise SystemExit(f'Beta 0.9 validation failed: unneeded setting remains: {forbidden}')

print('Beta 0.9 settings validation passed')
