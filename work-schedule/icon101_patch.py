from pathlib import Path

p = Path('app/src/main/java/com/ilia/workschedule/Beta6Activity.kt')
s = p.read_text()

old1 = 'text={Text("Version 1.0.0\\nCalendar-first personal work planner.",color=B6Muted)}'
new1 = 'text={Text("Version 1.0.1\\nCalendar-first personal work planner.",color=B6Muted)}'
old2 = 'B10SettingsActionRow(Icons.Outlined.Info,"About","Version 1.0.0"){aboutOpen=true}'
new2 = 'B10SettingsActionRow(Icons.Outlined.Info,"About","Version 1.0.1"){aboutOpen=true}'

if old1 not in s:
    raise SystemExit('1.0.1 patch failed: About dialog version not found')
if old2 not in s:
    raise SystemExit('1.0.1 patch failed: About row version not found')

s = s.replace(old1, new1, 1).replace(old2, new2, 1)
p.write_text(s)
print('Applied Work Schedule 1.0.1 icon/version patch')
