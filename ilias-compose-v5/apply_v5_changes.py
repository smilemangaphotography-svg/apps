from pathlib import Path

ROOT = Path('buildsrc/Ilias-Coach/app/src/main/java/com/iliaperformance/iliacoach2026')


def replace(path: Path, old: str, new: str, label: str):
    s = path.read_text()
    if old not in s:
        raise SystemExit(f'Missing patch target: {label} in {path.name}')
    path.write_text(s.replace(old, new, 1))

# -----------------------------------------------------------------------------
# Model: persist an owner-controlled global set target.
# -----------------------------------------------------------------------------
models = ROOT / 'ModelsAndCatalog.kt'
replace(models,
'''data class FocusProfile(
    val upper: Int = 45,
    val lower: Int = 55,
    val recovery: Int = 60,''',
'''data class FocusProfile(
    val upper: Int = 45,
    val lower: Int = 55,
    val sets: Int = 3,
    val recovery: Int = 60,''',
'FocusProfile sets')

replace(models,
'''        OwnerBlockConfig("music.local", "music", "Local music", order = 0, kind = "localMusic"),
        OwnerBlockConfig("music.spotify", "music", "Spotify", order = 1, kind = "spotify"),''',
'''        OwnerBlockConfig("music.local", "music", "Local music", visible = false, order = 1, kind = "localMusic"),
        OwnerBlockConfig("music.spotify", "music", "Spotify", order = 0, kind = "spotify"),''',
'hide local music by default')

# -----------------------------------------------------------------------------
# DataStore: sets survive app restarts.
# -----------------------------------------------------------------------------
persistence = ROOT / 'Persistence.kt'
replace(persistence,
'''        put("upper", f.upper); put("lower", f.lower); put("recovery", f.recovery); put("mobility", f.mobility)
        put("cardio", f.cardio); put("core", f.core); put("strength", f.strength)''',
'''        put("upper", f.upper); put("lower", f.lower); put("sets", f.sets); put("recovery", f.recovery); put("mobility", f.mobility)
        put("cardio", f.cardio); put("core", f.core); put("strength", f.strength)''',
'encode focus sets')

replace(persistence,
'''            upper = o.optInt("upper", 45), lower = o.optInt("lower", 55), recovery = o.optInt("recovery", 60),
            mobility = o.optInt("mobility", 45), cardio = o.optInt("cardio", 30), core = o.optInt("core", 40),''',
'''            upper = o.optInt("upper", 45), lower = o.optInt("lower", 55), sets = o.optInt("sets", 3).coerceIn(1, 8),
            recovery = o.optInt("recovery", 60), mobility = o.optInt("mobility", 45), cardio = o.optInt("cardio", 30), core = o.optInt("core", 40),''',
'decode focus sets')

# -----------------------------------------------------------------------------
# ViewModel: linked U/L, 1-8 sets, Spotify-friendly normal-user behavior.
# -----------------------------------------------------------------------------
vm = ROOT / 'CoachViewModel.kt'
replace(vm,
'''            "upper" -> f.copy(upper = v, lower = 100 - v)
            "lower" -> f.copy(lower = v, upper = 100 - v)
            "recovery" -> f.copy(recovery = v)''',
'''            "upper" -> f.copy(upper = v, lower = 100 - v)
            "lower" -> f.copy(lower = v, upper = 100 - v)
            "sets" -> f.copy(sets = value.coerceIn(1, 8))
            "recovery" -> f.copy(recovery = v)''',
'setFocus sets')

replace(vm,
'''    fun connectSpotify() = viewModelScope.launch {
        if (!spotify.beginLogin()) _message.value = "Add your Spotify Client ID in Owner Layout first."
    }
''',
'''    fun connectSpotify() = viewModelScope.launch {
        if (!spotify.beginLogin()) _message.value = "Spotify setup is not configured yet. Complete the one-time Owner setup."
    }

    fun openSpotifySearch(query: String) {
        val app = getApplication<Application>()
        val spotifyUri = Uri.parse("spotify:search:${Uri.encode(query)}")
        val spotifyIntent = android.content.Intent(android.content.Intent.ACTION_VIEW, spotifyUri)
            .setPackage("com.spotify.music")
            .addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
        runCatching { app.startActivity(spotifyIntent) }.onFailure {
            val web = Uri.parse("https://open.spotify.com/search/${Uri.encode(query)}")
            app.startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW, web).addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK))
        }
    }
''',
'Spotify user messaging/search')

replace(vm,
'''        if (features.value.autoMusic && localMusicUri.value.isNotBlank()) {
            runCatching { musicEngine.play(Uri.parse(localMusicUri.value)) }
        }
''',
'''        if (features.value.autoMusic) {
            when {
                spotifyState.value.connected -> viewModelScope.launch { spotify.play() }
                localMusicUri.value.isNotBlank() -> runCatching { musicEngine.play(Uri.parse(localMusicUri.value)) }
            }
        }
''',
'auto-start workout music')

replace(vm,
'''        musicEngine.pause()
    }
''',
'''        musicEngine.pause()
        if (spotifyState.value.connected) spotify.pause()
    }
''',
'stop Spotify at workout end')

# -----------------------------------------------------------------------------
# Screens: Today controls are direct + persistent; global sets affect plan/player.
# -----------------------------------------------------------------------------
screens = ROOT / 'Screens.kt'
replace(screens,
'''        "todayMetrics" -> TodayMetrics(focus, workout)''',
'''        "todayMetrics" -> TodayMetrics(vm, focus)''',
'RenderBlock TodayMetrics')

replace(screens,
'''        "todayPlanList" -> TodayPlanList(adaptivePlan(focus), onExercise)''',
'''        "todayPlanList" -> TodayPlanList(adaptivePlan(focus), focus.sets, onExercise)''',
'RenderBlock TodayPlan sets')

replace(screens,
'''private fun adaptivePlan(focus: FocusProfile): List<String> = if (focus.lower >= focus.upper + 15) PlanCatalog.lowerA else PlanCatalog.upperA''',
'''private fun adaptivePlan(focus: FocusProfile): List<String> = if (focus.lower > focus.upper) PlanCatalog.lowerA else PlanCatalog.upperA''',
'adaptive plan threshold')

replace(screens,
'''    val lower = focus.lower >= focus.upper + 15''',
'''    val lower = focus.lower > focus.upper''',
'TodayHero threshold')

old_today_metrics = '''@Composable
private fun TodayMetrics(focus: FocusProfile, workout: WorkoutStateEntity?) {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        MetricTile("${focus.upper}%", "Upper", modifier = Modifier.weight(1f))
        MetricTile("${focus.lower}%", "Lower", modifier = Modifier.weight(1f))
        MetricTile("${workout?.completedSets ?: 0}", "Sets", accent = CoachLime, modifier = Modifier.weight(1f))
    }
}
'''
new_today_metrics = '''@Composable
private fun TodayMetrics(vm: CoachViewModel, focus: FocusProfile) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            MetricTile("${focus.upper}%", "Upper", modifier = Modifier.weight(1f))
            MetricTile("${focus.lower}%", "Lower", modifier = Modifier.weight(1f))
            MetricTile(focus.sets.toString(), "Sets", accent = CoachLime, modifier = Modifier.weight(1f))
        }
        PremiumCard(size = BlockSize.Compact) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("WORKOUT BALANCE", color = CoachBlue, fontWeight = FontWeight.Black, fontSize = 12.sp, letterSpacing = 1.5.sp)
                    Text("Upper ${focus.upper}%  ·  Lower ${focus.lower}%", color = CoachText, fontWeight = FontWeight.Bold)
                }
                Text("Saved", color = CoachLime, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
            Slider(
                value = focus.upper.toFloat(),
                onValueChange = { vm.setFocus("upper", it.toInt()) },
                valueRange = 0f..100f
            )
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("SETS PER EXERCISE", color = CoachMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.2.sp)
                    Text("Applies to Today Plan and Exercise Player", color = CoachMuted, fontSize = 11.sp)
                }
                MiniAction("−") { vm.setFocus("sets", focus.sets - 1) }
                Text(focus.sets.toString(), color = CoachText, fontSize = 22.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(horizontal = 12.dp))
                MiniAction("+") { vm.setFocus("sets", focus.sets + 1) }
            }
        }
    }
}
'''
replace(screens, old_today_metrics, new_today_metrics, 'TodayMetrics controls')

replace(screens,
'''private fun TodayPlanList(ids: List<String>, onExercise: (String) -> Unit) {''',
'''private fun TodayPlanList(ids: List<String>, targetSets: Int, onExercise: (String) -> Unit) {''',
'TodayPlanList signature')
replace(screens,
'''            ExerciseRow(index + 1, e, onExercise, "${e.sets} sets · ${e.reps} · ${e.restSeconds}s rest")''',
'''            ExerciseRow(index + 1, e, onExercise, "$targetSets sets · ${e.reps} · ${e.restSeconds}s rest")''',
'TodayPlan sets display')

# Owner Layout gets the same set target, while Today remains the quick-edit surface.
replace(screens,
'''        FocusSlider("Strength vs conditioning", focus.strength) { vm.setFocus("strength", it) }
''',
'''        FocusSlider("Strength vs conditioning", focus.strength) { vm.setFocus("strength", it) }
        SetsControl("Sets per exercise", focus.sets) { vm.setFocus("sets", it) }
''',
'Owner sets control')

insert_after_focus = '''@Composable
private fun FocusSlider(label: String, value: Int, onValue: (Int) -> Unit) {
    PremiumCard(size = BlockSize.Compact) {
        Row(Modifier.fillMaxWidth()) {
            Text(label, color = CoachText, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
            Text("$value%", color = CoachBlue, fontWeight = FontWeight.Black)
        }
        Slider(value = value.toFloat(), onValueChange = { onValue(it.toInt()) }, valueRange = 0f..100f)
    }
}
'''
sets_control = insert_after_focus + '''
@Composable
private fun SetsControl(label: String, value: Int, onValue: (Int) -> Unit) {
    PremiumCard(size = BlockSize.Compact) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(label, color = CoachText, fontWeight = FontWeight.Bold)
                Text("1–8 · saved in DataStore", color = CoachMuted, fontSize = 11.sp)
            }
            MiniAction("−") { onValue(value - 1) }
            Text(value.toString(), color = CoachLime, fontWeight = FontWeight.Black, fontSize = 22.sp, modifier = Modifier.padding(horizontal = 12.dp))
            MiniAction("+") { onValue(value + 1) }
        }
    }
}
'''
replace(screens, insert_after_focus, sets_control, 'SetsControl composable')

# Exercise Player uses global set target rather than ignoring the user's Today choice.
replace(screens,
'''    val workout by vm.workoutState.collectAsState()
    val spotify by vm.spotifyState.collectAsState()''',
'''    val workout by vm.workoutState.collectAsState()
    val focus by vm.focus.collectAsState()
    val spotify by vm.spotifyState.collectAsState()''',
'ExercisePlayer focus state')
replace(screens,
'''                    "playerStats" -> PlayerStats(exercise, workout, vm, block.size)''',
'''                    "playerStats" -> PlayerStats(exercise, workout, focus.sets, vm, block.size)''',
'PlayerStats call')
replace(screens,
'''private fun PlayerStats(exercise: Exercise, workout: WorkoutStateEntity?, vm: CoachViewModel, size: BlockSize) {''',
'''private fun PlayerStats(exercise: Exercise, workout: WorkoutStateEntity?, targetSets: Int, vm: CoachViewModel, size: BlockSize) {''',
'PlayerStats signature')
replace(screens,
'''            MetricTile(exercise.sets.toString(), "Sets", accent = CoachLime, modifier = Modifier.weight(1f))''',
'''            MetricTile(targetSets.toString(), "Sets", accent = CoachLime, modifier = Modifier.weight(1f))''',
'PlayerStats set tile')
replace(screens,
'''                    Text("SET ${workout?.currentSet ?: 0} / ${exercise.sets}", color = CoachText, fontWeight = FontWeight.Black, fontSize = 20.sp)''',
'''                    Text("SET ${workout?.currentSet ?: 0} / $targetSets", color = CoachText, fontWeight = FontWeight.Black, fontSize = 20.sp)''',
'PlayerStats target label')

# -----------------------------------------------------------------------------
# Music page: consumer-facing Spotify experience; local files stay restorable by Owner.
# -----------------------------------------------------------------------------
old_spotify = '''@Composable
private fun SpotifyBlock(vm: CoachViewModel, spotify: SpotifyState) {
    PremiumCard {
        Text("SPOTIFY", color = CoachLime, fontWeight = FontWeight.Black, letterSpacing = 1.5.sp)
        Text(if (spotify.connected) "Connected" else "Official Spotify PKCE connection", color = CoachText, fontSize = 21.sp, fontWeight = FontWeight.Black)
        Text("Playback uses Spotify authorization and the Spotify Web API. A Spotify Client ID is configured in Owner Layout; no client secret is stored in the APK.", color = CoachMuted, fontSize = 13.sp)
        if (!spotify.connected) {
            PrimaryButton("CONNECT SPOTIFY") { vm.connectSpotify() }
        } else {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                MiniAction("‹‹") { vm.spotifyPrevious() }
                MiniAction("PLAY", accent = CoachLime) { vm.spotifyPlay() }
                MiniAction("PAUSE") { vm.spotifyPause() }
                MiniAction("››") { vm.spotifyNext() }
            }
            SecondaryButton("DISCONNECT") { vm.disconnectSpotify() }
        }
    }
}
'''
new_spotify = '''@Composable
private fun SpotifyBlock(vm: CoachViewModel, spotify: SpotifyState) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        PremiumCard(size = BlockSize.Expanded) {
            Text("SPOTIFY", color = CoachLime, fontWeight = FontWeight.Black, letterSpacing = 1.5.sp)
            Text(if (spotify.connected) "Workout soundtrack ready" else "Connect your workout soundtrack", color = CoachText, fontSize = 24.sp, fontWeight = FontWeight.Black)
            Text("Motivational rap · heavy rock · trance · cinematic training energy", color = CoachMuted, fontSize = 14.sp)
            if (!spotify.connected) {
                PrimaryButton("CONNECT SPOTIFY") { vm.connectSpotify() }
            } else {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    MiniAction("‹‹") { vm.spotifyPrevious() }
                    MiniAction("PLAY", accent = CoachLime) { vm.spotifyPlay() }
                    MiniAction("PAUSE") { vm.spotifyPause() }
                    MiniAction("››") { vm.spotifyNext() }
                }
                Text("Spotify connected · playback follows your active Spotify device", color = CoachLime, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                SecondaryButton("DISCONNECT") { vm.disconnectSpotify() }
            }
        }

        Text("TRAINING MODES", color = CoachBlue, fontWeight = FontWeight.Black, letterSpacing = 1.6.sp, fontSize = 12.sp)
        SpotifyModeCard("DRIVE", "Eminem · Five Finger Death Punch", "Aggressive strength / heavy sets") {
            vm.openSpotifySearch("Eminem Five Finger Death Punch workout")
        }
        SpotifyModeCard("CARDIO", "Armin van Buuren · trance / EDM", "Continuous energy for running and conditioning") {
            vm.openSpotifySearch("Armin van Buuren workout trance")
        }
        SpotifyModeCard("ROCKY MODE", "Rocky-style motivation · cinematic training", "High-intensity motivational sessions") {
            vm.openSpotifySearch("Rocky training motivation soundtrack")
        }
        SpotifyModeCard("FOCUS", "Cinematic · deep focus", "Controlled strength and technique work") {
            vm.openSpotifySearch("cinematic workout focus")
        }
    }
}

@Composable
private fun SpotifyModeCard(title: String, artists: String, detail: String, onOpen: () -> Unit) {
    PremiumCard(onClick = onOpen) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(title, color = CoachText, fontWeight = FontWeight.Black, fontSize = 18.sp)
                Text(artists, color = CoachLime, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Text(detail, color = CoachMuted, fontSize = 12.sp)
            }
            Text("›", color = CoachBlue, fontSize = 28.sp)
        }
    }
}
'''
replace(screens, old_spotify, new_spotify, 'consumer Spotify page')

# Wording: auto-music now covers Spotify or local Media3, not just local audio.
s = screens.read_text()
s = s.replace('ToggleRow("Auto-start local music", features.autoMusic)', 'ToggleRow("Auto-start workout music", features.autoMusic)')
s = s.replace('Configure Spotify or local music in the Music page.', 'Open Music to connect Spotify or choose a soundtrack.')
screens.write_text(s)

# -----------------------------------------------------------------------------
# Build-time invariants for this pass.
# -----------------------------------------------------------------------------
checks = {
    'ModelsAndCatalog.kt': ['val sets: Int = 3', 'visible = false, order = 1, kind = "localMusic"'],
    'Persistence.kt': ['put("sets", f.sets)', 'sets = o.optInt("sets", 3).coerceIn(1, 8)'],
    'CoachViewModel.kt': ['"sets" -> f.copy(sets = value.coerceIn(1, 8))', 'fun openSpotifySearch', 'spotifyState.value.connected ->'],
    'Screens.kt': ['WORKOUT BALANCE', 'SETS PER EXERCISE', 'SpotifyModeCard("DRIVE"', 'PlayerStats(exercise, workout, focus.sets'],
}
for filename, needles in checks.items():
    text = (ROOT / filename).read_text()
    for needle in needles:
        if needle not in text:
            raise SystemExit(f'V5 invariant missing: {needle} in {filename}')

print('Applied ILIAS COACH V5: quick U/L + sets controls, persistent set target, consumer Spotify UX, workout-linked music')
