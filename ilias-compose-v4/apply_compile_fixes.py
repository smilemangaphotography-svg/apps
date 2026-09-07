from pathlib import Path

root = Path('buildsrc/Ilias-Coach/app/src/main/java/com/iliaperformance/iliacoach2026')

# Compose scope extension imports must not be imported directly outside scope.
p = root / 'CoachApp.kt'
s = p.read_text()
s = s.replace('import androidx.compose.foundation.layout.weight\n', '')
p.write_text(s)

# PremiumCard exposes a ColumnScope content lambda.
p = root / 'Components.kt'
s = p.read_text()
if 'import androidx.compose.foundation.layout.ColumnScope\n' not in s:
    s = s.replace('import androidx.compose.foundation.layout.Column\n', 'import androidx.compose.foundation.layout.Column\nimport androidx.compose.foundation.layout.ColumnScope\n')
p.write_text(s)

p = root / 'Screens.kt'
s = p.read_text()

# Make chart generic types explicit for Kotlin 1.9 compile stability.
s = s.replace('val points = listOf(.82f, .75f, .78f, .61f, .66f, .46f, .5f, .3f, .18f)',
              'val points: List<Float> = listOf(.82f, .75f, .78f, .61f, .66f, .46f, .5f, .3f, .18f)')
s = s.replace('points.forEachIndexed { i, y ->', 'points.forEachIndexed { i: Int, y: Float ->')

# Fix explicit feature toggle capture; never shadow the current FeatureToggles instance.
s = s.replace(
    'FeatureSwitch("Anatomy Motion", f.anatomyMotion) { vm.setFeature { it.copy(anatomyMotion = it@FeatureSwitch) } }',
    'FeatureSwitch("Anatomy Motion", f.anatomyMotion) { checked: Boolean -> vm.setFeature { current: FeatureToggles -> current.copy(anatomyMotion = checked) } }'
)

replacements = {
    'ToggleRow("Anatomy Motion", features.anatomyMotion) { v -> vm.setFeature { it.copy(anatomyMotion = v) } }':
        'ToggleRow("Anatomy Motion", features.anatomyMotion) { checked: Boolean -> vm.setFeature { current: FeatureToggles -> current.copy(anatomyMotion = checked) } }',
    'ToggleRow("Form Lock", features.formLock) { v -> vm.setFeature { it.copy(formLock = v) } }':
        'ToggleRow("Form Lock", features.formLock) { checked: Boolean -> vm.setFeature { current: FeatureToggles -> current.copy(formLock = checked) } }',
    'ToggleRow("Auto loop", features.autoLoop) { v -> vm.setFeature { it.copy(autoLoop = v) } }':
        'ToggleRow("Auto loop", features.autoLoop) { checked: Boolean -> vm.setFeature { current: FeatureToggles -> current.copy(autoLoop = checked) } }',
    'ToggleRow("Voice cues", features.voiceCue) { v -> vm.setFeature { it.copy(voiceCue = v) } }':
        'ToggleRow("Voice cues", features.voiceCue) { checked: Boolean -> vm.setFeature { current: FeatureToggles -> current.copy(voiceCue = checked) } }',
    'ToggleRow("Coaching text", features.coachingText) { v -> vm.setFeature { it.copy(coachingText = v) } }':
        'ToggleRow("Coaching text", features.coachingText) { checked: Boolean -> vm.setFeature { current: FeatureToggles -> current.copy(coachingText = checked) } }',
    'ToggleRow("Muscle highlighting", features.muscleHighlight) { v -> vm.setFeature { it.copy(muscleHighlight = v) } }':
        'ToggleRow("Muscle highlighting", features.muscleHighlight) { checked: Boolean -> vm.setFeature { current: FeatureToggles -> current.copy(muscleHighlight = checked) } }',
    'ToggleRow("Automatic rest timer", features.timers) { v -> vm.setFeature { it.copy(timers = v) } }':
        'ToggleRow("Automatic rest timer", features.timers) { checked: Boolean -> vm.setFeature { current: FeatureToggles -> current.copy(timers = checked) } }',
    'ToggleRow("Set logging", features.logging) { v -> vm.setFeature { it.copy(logging = v) } }':
        'ToggleRow("Set logging", features.logging) { checked: Boolean -> vm.setFeature { current: FeatureToggles -> current.copy(logging = checked) } }',
    'ToggleRow("Pain-safe mode", features.painSafe) { v -> vm.setFeature { it.copy(painSafe = v) } }':
        'ToggleRow("Pain-safe mode", features.painSafe) { checked: Boolean -> vm.setFeature { current: FeatureToggles -> current.copy(painSafe = checked) } }',
    'ToggleRow("Recovery mode", features.recoveryMode) { v -> vm.setFeature { it.copy(recoveryMode = v) } }':
        'ToggleRow("Recovery mode", features.recoveryMode) { checked: Boolean -> vm.setFeature { current: FeatureToggles -> current.copy(recoveryMode = checked) } }',
    'ToggleRow("Auto-start local music", features.autoMusic) { v -> vm.setFeature { it.copy(autoMusic = v) } }':
        'ToggleRow("Auto-start local music", features.autoMusic) { checked: Boolean -> vm.setFeature { current: FeatureToggles -> current.copy(autoMusic = checked) } }',

    # MiniAction has signature (text, onClick, accent). Because onClick is not the final
    # parameter Kotlin cannot use a trailing lambda. Make every click explicit.
    'MiniAction("‹‹") { vm.spotifyPrevious() }':
        'MiniAction("‹‹", onClick = { vm.spotifyPrevious() })',
    'MiniAction("PLAY", accent = CoachLime) { vm.spotifyPlay() }':
        'MiniAction("PLAY", onClick = { vm.spotifyPlay() }, accent = CoachLime)',
    'MiniAction("PAUSE") { vm.spotifyPause() }':
        'MiniAction("PAUSE", onClick = { vm.spotifyPause() })',
    'MiniAction("Ⅱ") { vm.spotifyPause() }':
        'MiniAction("Ⅱ", onClick = { vm.spotifyPause() })',
    'MiniAction("››") { vm.spotifyNext() }':
        'MiniAction("››", onClick = { vm.spotifyNext() })',
    'MiniAction("↑") { vm.movePage(page.id, -1) }':
        'MiniAction("↑", onClick = { vm.movePage(page.id, -1) })',
    'MiniAction("↓") { vm.movePage(page.id, 1) }':
        'MiniAction("↓", onClick = { vm.movePage(page.id, 1) })',
    'MiniAction("RESTORE", accent = CoachLime) { vm.setPageVisible(page.id, true) }':
        'MiniAction("RESTORE", onClick = { vm.setPageVisible(page.id, true) }, accent = CoachLime)',
    'MiniAction("DELETE", accent = Color(0xFFFF6B6B)) { vm.removeCustomPage(page.id) }':
        'MiniAction("DELETE", onClick = { vm.removeCustomPage(page.id) }, accent = Color(0xFFFF6B6B))',
    'MiniAction("↑") { vm.moveBlock(block.id, -1) }':
        'MiniAction("↑", onClick = { vm.moveBlock(block.id, -1) })',
    'MiniAction("↓") { vm.moveBlock(block.id, 1) }':
        'MiniAction("↓", onClick = { vm.moveBlock(block.id, 1) })',
    'MiniAction("RESIZE") { vm.resizeBlock(block.id) }':
        'MiniAction("RESIZE", onClick = { vm.resizeBlock(block.id) })',
    'MiniAction("RESTORE", accent = CoachLime) { vm.setBlockVisible(block.id, true) }':
        'MiniAction("RESTORE", onClick = { vm.setBlockVisible(block.id, true) }, accent = CoachLime)',
    'MiniAction("REPLACE") { menu = true }':
        'MiniAction("REPLACE", onClick = { menu = true })',
}
for old, new in replacements.items():
    s = s.replace(old, new)

# Multiline local-player control.
s = s.replace(
'''MiniAction(if (playing) "PAUSE" else "PLAY", accent = CoachLime) {
                    if (playing) vm.musicEngine.pause() else vm.playLocalMusic(Uri.parse(localUri))
                }''',
'''MiniAction(
                    if (playing) "PAUSE" else "PLAY",
                    onClick = { if (playing) vm.musicEngine.pause() else vm.playLocalMusic(Uri.parse(localUri)) },
                    accent = CoachLime
                )'''
)

p.write_text(s)

# Assertions make CI fail early if a known broken construct returns.
assert 'it@FeatureSwitch' not in s
assert 'MiniAction("PLAY", accent = CoachLime) {' not in s
assert 'MiniAction("RESTORE", accent = CoachLime) {' not in s
assert 'import androidx.compose.foundation.layout.weight' not in (root / 'CoachApp.kt').read_text()
assert 'import androidx.compose.foundation.layout.ColumnScope' in (root / 'Components.kt').read_text()
print('Applied native Compose compile fixes')
