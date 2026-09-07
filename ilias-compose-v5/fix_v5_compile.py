from pathlib import Path

p = Path('buildsrc/Ilias-Coach/app/src/main/java/com/iliaperformance/iliacoach2026/Screens.kt')
s = p.read_text()

replacements = {
    'MiniAction("−") { vm.setFocus("sets", focus.sets - 1) }':
        'MiniAction("−", onClick = { vm.setFocus("sets", focus.sets - 1) })',
    'MiniAction("+") { vm.setFocus("sets", focus.sets + 1) }':
        'MiniAction("+", onClick = { vm.setFocus("sets", focus.sets + 1) })',
    'MiniAction("‹‹") { vm.spotifyPrevious() }':
        'MiniAction("‹‹", onClick = { vm.spotifyPrevious() })',
    'MiniAction("PLAY", accent = CoachLime) { vm.spotifyPlay() }':
        'MiniAction("PLAY", onClick = { vm.spotifyPlay() }, accent = CoachLime)',
    'MiniAction("PAUSE") { vm.spotifyPause() }':
        'MiniAction("PAUSE", onClick = { vm.spotifyPause() })',
    'MiniAction("››") { vm.spotifyNext() }':
        'MiniAction("››", onClick = { vm.spotifyNext() })',
    'MiniAction("−") { onValue(value - 1) }':
        'MiniAction("−", onClick = { onValue(value - 1) })',
    'MiniAction("+") { onValue(value + 1) }':
        'MiniAction("+", onClick = { onValue(value + 1) })',
}

for old, new in replacements.items():
    if old in s:
        s = s.replace(old, new)

# Guard against reintroducing the exact unsafe V5 call forms.
unsafe = [
    'MiniAction("−") { vm.setFocus',
    'MiniAction("+") { vm.setFocus',
    'MiniAction("‹‹") { vm.spotifyPrevious',
    'MiniAction("PLAY", accent = CoachLime) { vm.spotifyPlay',
    'MiniAction("PAUSE") { vm.spotifyPause',
    'MiniAction("››") { vm.spotifyNext',
    'MiniAction("−") { onValue',
    'MiniAction("+") { onValue',
]
for needle in unsafe:
    if needle in s:
        raise SystemExit(f'Unsafe MiniAction call remains: {needle}')

p.write_text(s)
print('Fixed V5 MiniAction call sites with explicit onClick arguments')
