from pathlib import Path

p = Path('app/src/main/java/com/ilia/workschedule/Beta6Activity.kt')
s = p.read_text()


def replace_once(old: str, new: str, label: str):
    global s
    if old not in s:
        raise SystemExit(f'Final 1.0 patch failed: {label} not found')
    s = s.replace(old, new, 1)

# Remove beta wording from user-visible About content while preserving all
# approved Beta 0.8 calendar lock and Beta 0.10 interaction behavior.
replace_once(
    'text={Text("Beta 0.10.0\\nCalendar-first personal work planner.",color=B6Muted)}',
    'text={Text("Version 1.0.0\\nCalendar-first personal work planner.",color=B6Muted)}',
    'about dialog version'
)
replace_once(
    'B10SettingsActionRow(Icons.Outlined.Info,"About","Beta 0.10.0"){aboutOpen=true}',
    'B10SettingsActionRow(Icons.Outlined.Info,"About","Version 1.0.0"){aboutOpen=true}',
    'about row version'
)

p.write_text(s)
print('Applied Work Schedule Final 1.0 production UI patch')
