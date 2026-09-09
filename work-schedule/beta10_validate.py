from pathlib import Path

p = Path('app/src/main/java/com/ilia/workschedule/Beta6Activity.kt')
s = p.read_text()

checks = {
    'logo-only save enabled': 'enabled=name.isNotBlank() || image.isNotBlank()',
    'optional shift name label': 'Shift type name (optional)',
    'logo-only calendar enlargement': 'B6LogoSize.LARGE -> if (t.name.isBlank()) .82f else .74f',
    'calendar hides blank name': 'if (t.name.isNotBlank()) {',
    'notification fallback title': 'if(t.name.isBlank()) "Upcoming shift" else t.name',
    'interactive settings action row': '@Composable private fun B10SettingsActionRow',
    'interactive settings switch row': '@Composable private fun B10SettingsSwitchRow',
    'job edit dialog': 'title="Job Name"',
    'location edit dialog': 'title="Default Location"',
    'shift types action': 'B10SettingsActionRow(Icons.Outlined.GridView,"Shift Types"',
    'about version': 'Beta 0.10.0',
}

missing = [name for name, token in checks.items() if token not in s]
if missing:
    raise SystemExit('Beta 0.10 validation failed: ' + ', '.join(missing))

print('Beta 0.10 validation passed: logo-only shifts and all settings controls are wired')
