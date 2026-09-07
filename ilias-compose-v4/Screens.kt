package com.iliaperformance.iliacoach2026

import android.net.Uri
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.media3.exoplayer.ExoPlayer
import kotlin.math.max

@Composable
fun SideDrawer(
    pages: List<OwnerPageConfig>,
    currentId: String,
    onSelect: (String) -> Unit
) {
    Column(
        Modifier
            .width(330.dp)
            .fillMaxSize()
            .background(CoachBgDeep)
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            Box(
                Modifier.size(58.dp).background(CoachBlue, RoundedCornerShape(18.dp)),
                contentAlignment = Alignment.Center
            ) { Text("IC", color = Color.White, fontWeight = FontWeight.Black, fontSize = 19.sp) }
            Column {
                Text("ILIAS COACH", color = CoachText, fontWeight = FontWeight.Black, fontSize = 22.sp)
                Text("TRAIN SMARTER · RECOVER STRONGER", color = CoachMuted, fontSize = 10.sp, letterSpacing = 1.3.sp)
            }
        }
        Spacer(Modifier.height(8.dp))
        Box(Modifier.fillMaxWidth().height(1.dp).background(CoachLine))
        pages.sortedBy { it.order }.forEach { page ->
            val selected = page.id == currentId
            Row(
                Modifier
                    .fillMaxWidth()
                    .background(if (selected) CoachCard2 else Color.Transparent, RoundedCornerShape(18.dp))
                    .clickable { onSelect(page.id) }
                    .padding(horizontal = 16.dp, vertical = 15.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text(drawerGlyph(page.id), color = if (selected) CoachBlue else CoachMuted, fontSize = 18.sp)
                Text(page.title, color = if (selected) CoachBlue else CoachText, fontWeight = FontWeight.Bold, fontSize = 17.sp)
            }
        }
    }
}

private fun drawerGlyph(id: String) = when (id) {
    "cover" -> "⌂"; "today" -> "▣"; "today-plan" -> "☷"; "next" -> "→"; "programs" -> "▥"
    "recovery" -> "◔"; "nutrition" -> "◉"; "progress" -> "▤"; "music" -> "♫"; "owner" -> "⚙"; "settings" -> "⚙"
    else -> "◆"
}

@Composable
fun CoachPageScreen(
    page: OwnerPageConfig,
    vm: CoachViewModel,
    onExercise: (String) -> Unit,
    onNavigate: (String) -> Unit,
    onPickLocalMusic: () -> Unit
) {
    val layout by vm.layout.collectAsState()
    val focus by vm.focus.collectAsState()
    val features by vm.features.collectAsState()
    val workout by vm.workoutState.collectAsState()
    val logs by vm.workoutLogs.collectAsState()
    val spotify by vm.spotifyState.collectAsState()
    val localMusicUri by vm.localMusicUri.collectAsState()
    val musicPlaying by vm.musicEngine.isPlaying.collectAsState()

    if (page.id == "owner") {
        OwnerLayoutScreen(vm)
        return
    }

    val blocks = layout.blocks.filter { it.pageId == page.id && it.visible }.sortedBy { it.order }
    Column(
        Modifier
            .fillMaxSize()
            .background(CoachBg)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp, vertical = 18.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        if (blocks.isEmpty()) {
            PremiumCard { Text("This page has no visible blocks. Restore or add blocks in Owner Layout.", color = CoachMuted) }
        }
        blocks.forEach { block ->
            OwnerEditableBlock(config = block) {
                RenderBlock(
                    block = block,
                    page = page,
                    vm = vm,
                    focus = focus,
                    features = features,
                    workout = workout,
                    logCount = logs.size,
                    spotify = spotify,
                    localMusicUri = localMusicUri,
                    musicPlaying = musicPlaying,
                    onExercise = onExercise,
                    onNavigate = onNavigate,
                    onPickLocalMusic = onPickLocalMusic
                )
            }
        }
        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun RenderBlock(
    block: OwnerBlockConfig,
    page: OwnerPageConfig,
    vm: CoachViewModel,
    focus: FocusProfile,
    features: FeatureToggles,
    workout: WorkoutStateEntity?,
    logCount: Int,
    spotify: SpotifyState,
    localMusicUri: String,
    musicPlaying: Boolean,
    onExercise: (String) -> Unit,
    onNavigate: (String) -> Unit,
    onPickLocalMusic: () -> Unit
) {
    when (block.kind) {
        "coverHero" -> CoverHero(onNavigate)
        "todayHero" -> TodayHero(focus, onExercise)
        "todayMetrics" -> TodayMetrics(focus, workout)
        "exerciseSequence" -> ExerciseSequence(adaptivePlan(focus), onExercise)
        "todayPlanList" -> TodayPlanList(adaptivePlan(focus), onExercise)
        "nextHero" -> NextHero(onExercise)
        "upcomingSessions" -> UpcomingSessions(onExercise)
        "programList" -> ProgramList(onExercise)
        "recoveryMetrics" -> RecoveryMetrics(focus, features)
        "recoveryExercises" -> ExerciseSequence(PlanCatalog.recovery, onExercise)
        "nutritionMetrics" -> NutritionMetrics()
        "mealList" -> MealList()
        "progressMetrics" -> ProgressMetrics(logCount, workout)
        "progressChart" -> ProgressChart(max(logCount, 1))
        "localMusic" -> LocalMusicBlock(vm, localMusicUri, musicPlaying, onPickLocalMusic)
        "spotify" -> SpotifyBlock(vm, spotify)
        "settingsFeatures" -> SettingsFeatureBlock(vm, features)
        "customText" -> PremiumCard(size = block.size) {
            Text(page.title, color = CoachText, fontSize = 24.sp, fontWeight = FontWeight.Black)
            Text("Owner-controlled custom page block.", color = CoachMuted)
        }
        "customMetrics" -> Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            MetricTile("${focus.upper}%", "Upper", modifier = Modifier.weight(1f))
            MetricTile("${focus.lower}%", "Lower", modifier = Modifier.weight(1f))
        }
        else -> PremiumCard(size = block.size) {
            Text(block.title, color = CoachText, fontWeight = FontWeight.Bold)
            Text("This replacement module is not assigned to this page type.", color = CoachMuted)
        }
    }
}

private fun adaptivePlan(focus: FocusProfile): List<String> = if (focus.lower >= focus.upper + 15) PlanCatalog.lowerA else PlanCatalog.upperA

@Composable
private fun CoverHero(onNavigate: (String) -> Unit) {
    Column(Modifier.fillMaxWidth().padding(top = 24.dp, bottom = 20.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
        Box(
            Modifier.size(82.dp).background(CoachBlue, RoundedCornerShape(24.dp)),
            contentAlignment = Alignment.Center
        ) { Text("IC", color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.Black) }
        Text("PERSONAL ADAPTIVE COACH", color = CoachBlue, fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 2.2.sp)
        Text("ILIAS\nCOACH", color = CoachText, fontSize = 54.sp, fontWeight = FontWeight.Black, lineHeight = 50.sp)
        Text("TRAIN SMARTER. RECOVER STRONGER.", color = CoachText, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Text("Training, physio, recovery, nutrition and progress in one precise native Android flow.", color = CoachMuted, fontSize = 17.sp, lineHeight = 24.sp)
        PrimaryButton("START TODAY →") { onNavigate("today") }
    }
}

@Composable
private fun TodayHero(focus: FocusProfile, onExercise: (String) -> Unit) {
    val lower = focus.lower >= focus.upper + 15
    val ids = if (lower) PlanCatalog.lowerA else PlanCatalog.upperA
    val first = ExerciseCatalog.require(ids.first())
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("TODAY · ADAPTIVE PLAN", color = CoachBlue, fontWeight = FontWeight.Bold, letterSpacing = 2.sp, fontSize = 12.sp)
        PremiumCard(size = BlockSize.Expanded, onClick = { onExercise(first.exerciseId) }) {
            AssetImage(first.posterAsset, Modifier.fillMaxWidth().height(260.dp), ContentScale.Fit)
            Text(if (lower) "Lower Body Strength" else "Upper Body Strength", color = CoachText, fontWeight = FontWeight.Black, fontSize = 34.sp)
            Text("${ids.size} exercises · 45–55 min · tap any exercise for exact Anatomy Motion", color = CoachMuted, fontSize = 15.sp)
            PrimaryButton("START WORKOUT →") { onExercise(first.exerciseId) }
        }
    }
}

@Composable
private fun TodayMetrics(focus: FocusProfile, workout: WorkoutStateEntity?) {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        MetricTile("${focus.upper}%", "Upper", modifier = Modifier.weight(1f))
        MetricTile("${focus.lower}%", "Lower", modifier = Modifier.weight(1f))
        MetricTile("${workout?.completedSets ?: 0}", "Sets", accent = CoachLime, modifier = Modifier.weight(1f))
    }
}

@Composable
private fun ExerciseSequence(ids: List<String>, onExercise: (String) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("EXERCISE SEQUENCE", color = CoachBlue, fontWeight = FontWeight.Bold, letterSpacing = 1.6.sp, fontSize = 12.sp)
        ids.forEachIndexed { index, id -> ExerciseRow(index + 1, ExerciseCatalog.require(id), onExercise) }
    }
}

@Composable
private fun TodayPlanList(ids: List<String>, onExercise: (String) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        ids.forEachIndexed { index, id ->
            val e = ExerciseCatalog.require(id)
            ExerciseRow(index + 1, e, onExercise, "${e.sets} sets · ${e.reps} · ${e.restSeconds}s rest")
        }
    }
}

@Composable
private fun ExerciseRow(index: Int, exercise: Exercise, onExercise: (String) -> Unit, detail: String = exercise.primaryMuscles.joinToString(" + ")) {
    PremiumCard(onClick = { onExercise(exercise.exerciseId) }) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            Box(Modifier.size(44.dp).background(CoachCard2, RoundedCornerShape(14.dp)), contentAlignment = Alignment.Center) {
                Text(index.toString(), color = CoachBlue, fontWeight = FontWeight.Black)
            }
            AssetImage(exercise.posterAsset, Modifier.size(76.dp).background(CoachCream, RoundedCornerShape(14.dp)), ContentScale.Crop)
            Column(Modifier.weight(1f)) {
                Text(exercise.name, color = CoachText, fontSize = 18.sp, fontWeight = FontWeight.Black, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(detail, color = CoachMuted, fontSize = 13.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Text("Tap for exact verified animation", color = CoachLime, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
            Text("›", color = CoachMuted, fontSize = 30.sp)
        }
    }
}

@Composable
private fun NextHero(onExercise: (String) -> Unit) {
    val e = ExerciseCatalog.require("barbell-hip-thrust")
    PremiumCard(size = BlockSize.Expanded, onClick = { onExercise(e.exerciseId) }) {
        Text("NEXT WORKOUT", color = CoachBlue, fontWeight = FontWeight.Bold, letterSpacing = 1.8.sp)
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Lower Body Strength", color = CoachText, fontSize = 32.sp, fontWeight = FontWeight.Black)
                Text("Tomorrow · 07:00–08:00", color = CoachMuted)
                Text("Adapts to your focus sliders in Owner Layout.", color = CoachMuted)
            }
            AssetImage(e.posterAsset, Modifier.size(150.dp).background(CoachCream, RoundedCornerShape(20.dp)), ContentScale.Crop)
        }
        PrimaryButton("PREVIEW MOTION →") { onExercise(e.exerciseId) }
    }
}

@Composable
private fun UpcomingSessions(onExercise: (String) -> Unit) {
    val sessions = listOf(
        Triple("Full Body + Core", "45 min · adaptive", PlanCatalog.fullBody.first()),
        Triple("Mobility & Recovery", "30 min · adaptive", PlanCatalog.recovery.first()),
        Triple("Running Support", "40 min · adaptive", PlanCatalog.runningSupport.first())
    )
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("UPCOMING SESSIONS", color = CoachBlue, fontWeight = FontWeight.Bold, letterSpacing = 1.8.sp)
        sessions.forEachIndexed { i, (title, detail, id) ->
            val e = ExerciseCatalog.require(id)
            PremiumCard(onClick = { onExercise(id) }) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    AssetImage(e.posterAsset, Modifier.size(86.dp).background(CoachCream, RoundedCornerShape(16.dp)), ContentScale.Crop)
                    Column(Modifier.weight(1f)) {
                        Text(title, color = CoachText, fontWeight = FontWeight.Black, fontSize = 18.sp)
                        Text(detail, color = CoachMuted)
                    }
                    Text("›", color = CoachMuted, fontSize = 28.sp)
                }
            }
        }
    }
}

@Composable
private fun ProgramList(onExercise: (String) -> Unit) {
    val items = listOf(
        Triple("Upper Body Strength", "8 weeks · strength", "machine-chest-press"),
        Triple("Lower Body Strength", "8 weeks · capacity", "goblet-squat"),
        Triple("Knee Capacity", "12 weeks · progressive", "backward-sled-drag"),
        Triple("Recovery & Rebuild", "6 weeks · controlled", "single-leg-leg-press"),
        Triple("Running Support", "8 weeks · resilient", "running")
    )
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        items.forEachIndexed { i, (title, detail, id) ->
            val e = ExerciseCatalog.require(id)
            PremiumCard(onClick = { onExercise(id) }) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    AssetImage(e.posterAsset, Modifier.size(90.dp).background(CoachCream, RoundedCornerShape(18.dp)), ContentScale.Crop)
                    Column(Modifier.weight(1f)) {
                        Text(title, color = CoachText, fontWeight = FontWeight.Black, fontSize = 19.sp)
                        Text(detail, color = CoachMuted)
                    }
                    Text("›", color = CoachMuted, fontSize = 28.sp)
                }
            }
        }
    }
}

@Composable
private fun RecoveryMetrics(focus: FocusProfile, features: FeatureToggles) {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        MetricTile("${focus.recovery}%", "Recovery", accent = CoachLime, modifier = Modifier.weight(1f))
        MetricTile("${focus.mobility}%", "Mobility", modifier = Modifier.weight(1f))
        MetricTile(if (features.painSafe) "ON" else "OFF", "Pain-safe", accent = CoachLime, modifier = Modifier.weight(1f))
    }
}

@Composable
private fun NutritionMetrics() {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        MetricTile("2,400", "Kcal", modifier = Modifier.weight(1f))
        MetricTile("160g", "Protein", accent = CoachLime, modifier = Modifier.weight(1f))
        MetricTile("2.5L", "Water", modifier = Modifier.weight(1f))
    }
}

@Composable
private fun MealList() {
    val meals = listOf(
        "Breakfast" to "Oats · fruit · protein",
        "Lunch" to "Chicken · rice · vegetables",
        "Dinner" to "Salmon · potatoes · salad",
        "Snack" to "Yogurt · fruit · nuts"
    )
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        meals.forEach { (title, detail) -> PremiumCard {
            Text(title, color = CoachText, fontWeight = FontWeight.Black, fontSize = 19.sp)
            Text(detail, color = CoachMuted)
        } }
    }
}

@Composable
private fun ProgressMetrics(logCount: Int, workout: WorkoutStateEntity?) {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        MetricTile(logCount.toString(), "Logged sets", accent = CoachLime, modifier = Modifier.weight(1f))
        MetricTile((workout?.completedSets ?: 0).toString(), "Session sets", modifier = Modifier.weight(1f))
        MetricTile(if (workout?.sessionActive == true) "LIVE" else "READY", "Workout", modifier = Modifier.weight(1f))
    }
}

@Composable
private fun ProgressChart(logCount: Int) {
    PremiumCard(size = BlockSize.Expanded) {
        Text("TRAINING TREND", color = CoachBlue, fontWeight = FontWeight.Bold, letterSpacing = 1.5.sp)
        Canvas(Modifier.fillMaxWidth().height(180.dp)) {
            val points = listOf(.82f, .75f, .78f, .61f, .66f, .46f, .5f, .3f, .18f)
            val path = Path()
            points.forEachIndexed { i, y ->
                val x = size.width * i / (points.size - 1)
                val yy = size.height * y
                if (i == 0) path.moveTo(x, yy) else path.lineTo(x, yy)
            }
            drawPath(path, color = CoachBlue, style = androidx.compose.ui.graphics.drawscope.Stroke(width = 5f))
            points.forEachIndexed { i, y -> drawCircle(CoachLime, radius = 5f, center = Offset(size.width * i / (points.size - 1), size.height * y)) }
        }
        Text("Based on your locally stored workout log · $logCount set records", color = CoachMuted, fontSize = 12.sp)
    }
}

@Composable
private fun LocalMusicBlock(vm: CoachViewModel, localUri: String, playing: Boolean, onPick: () -> Unit) {
    PremiumCard {
        Text("MEDIA3 · LOCAL MUSIC", color = CoachBlue, fontWeight = FontWeight.Bold, letterSpacing = 1.5.sp)
        Text(if (localUri.isBlank()) "No local track selected" else "Local track ready", color = CoachText, fontSize = 20.sp, fontWeight = FontWeight.Black)
        Text("Use audio you own or are licensed to play. The app does not bundle copyrighted songs.", color = CoachMuted, fontSize = 13.sp)
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            SecondaryButton("CHOOSE FILE", onPick)
            if (localUri.isNotBlank()) SecondaryButton(if (playing) "PAUSE" else "PLAY") {
                if (playing) vm.musicEngine.pause() else vm.playLocalMusic(Uri.parse(localUri))
            }
        }
    }
}

@Composable
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

@Composable
private fun SettingsFeatureBlock(vm: CoachViewModel, f: FeatureToggles) {
    PremiumCard {
        FeatureSwitch("Anatomy Motion", f.anatomyMotion) { vm.setFeature { it.copy(anatomyMotion = it@FeatureSwitch) } }
    }
}

@Composable
private fun FeatureSwitch(label: String, checked: Boolean, onChanged: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(label, color = CoachText, modifier = Modifier.weight(1f), fontWeight = FontWeight.Bold)
        Switch(
            checked = checked,
            onCheckedChange = onChanged,
            colors = SwitchDefaults.colors(checkedThumbColor = CoachBgDeep, checkedTrackColor = CoachLime)
        )
    }
}

@Composable
fun OwnerLayoutScreen(vm: CoachViewModel) {
    val layout by vm.layout.collectAsState()
    val focus by vm.focus.collectAsState()
    val features by vm.features.collectAsState()
    val spotify by vm.spotifyState.collectAsState()
    var newPage by remember { mutableStateOf("") }

    Column(
        Modifier.fillMaxSize().background(CoachBg).verticalScroll(rememberScrollState()).padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        PremiumCard {
            Text("OWNER LAYOUT", color = CoachText, fontSize = 28.sp, fontWeight = FontWeight.Black)
            Text("This is the real editor. Move, hide, restore, resize, reorder and replace app blocks. Changes persist in DataStore.", color = CoachMuted)
        }

        SectionTitle("PAGES")
        layout.pages.sortedBy { it.order }.forEach { page ->
            PremiumCard {
                OutlinedTextField(
                    value = page.title,
                    onValueChange = { vm.renamePage(page.id, it) },
                    label = { Text("Page title") },
                    modifier = Modifier.fillMaxWidth()
                )
                ToggleRow("Visible", page.visible) { vm.setPageVisible(page.id, it) }
                ToggleRow("Side drawer", page.showDrawer) { vm.setPageDrawer(page.id, it) }
                ToggleRow("Bottom bar", page.showBottom) { vm.setPageBottom(page.id, it) }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    MiniAction("↑") { vm.movePage(page.id, -1) }
                    MiniAction("↓") { vm.movePage(page.id, 1) }
                    if (!page.visible) MiniAction("RESTORE", accent = CoachLime) { vm.setPageVisible(page.id, true) }
                    if (page.custom) MiniAction("DELETE", accent = Color(0xFFFF6B6B)) { vm.removeCustomPage(page.id) }
                }
            }
        }
        PremiumCard {
            OutlinedTextField(value = newPage, onValueChange = { newPage = it }, label = { Text("New page name") }, modifier = Modifier.fillMaxWidth())
            PrimaryButton("+ ADD PAGE") { vm.addCustomPage(newPage); newPage = "" }
        }

        SectionTitle("BLOCKS / MODULES")
        Text("Exercise Player blocks are deliberately separate from the workout UI: title, anatomy, muscles, controls, music and stats each have their own owner configuration.", color = CoachMuted, fontSize = 13.sp)
        layout.blocks.groupBy { it.pageId }.toSortedMap().forEach { (pageId, blocks) ->
            Text(pageId.uppercase(), color = if (pageId == "exercise-player") CoachLime else CoachBlue, fontWeight = FontWeight.Black, letterSpacing = 1.5.sp)
            blocks.sortedBy { it.order }.forEach { block -> BlockEditor(block, vm) }
        }

        SectionTitle("TRAINING FOCUS")
        FocusSlider("Upper body", focus.upper) { vm.setFocus("upper", it) }
        FocusSlider("Lower body", focus.lower) { vm.setFocus("lower", it) }
        FocusSlider("Recovery", focus.recovery) { vm.setFocus("recovery", it) }
        FocusSlider("Mobility", focus.mobility) { vm.setFocus("mobility", it) }
        FocusSlider("Cardio", focus.cardio) { vm.setFocus("cardio", it) }
        FocusSlider("Core", focus.core) { vm.setFocus("core", it) }
        FocusSlider("Strength vs conditioning", focus.strength) { vm.setFocus("strength", it) }

        SectionTitle("FEATURE ACTIVATION")
        PremiumCard {
            ToggleRow("Anatomy Motion", features.anatomyMotion) { v -> vm.setFeature { it.copy(anatomyMotion = v) } }
            ToggleRow("Form Lock", features.formLock) { v -> vm.setFeature { it.copy(formLock = v) } }
            ToggleRow("Auto loop", features.autoLoop) { v -> vm.setFeature { it.copy(autoLoop = v) } }
            ToggleRow("Voice cues", features.voiceCue) { v -> vm.setFeature { it.copy(voiceCue = v) } }
            ToggleRow("Coaching text", features.coachingText) { v -> vm.setFeature { it.copy(coachingText = v) } }
            ToggleRow("Muscle highlighting", features.muscleHighlight) { v -> vm.setFeature { it.copy(muscleHighlight = v) } }
            ToggleRow("Automatic rest timer", features.timers) { v -> vm.setFeature { it.copy(timers = v) } }
            ToggleRow("Set logging", features.logging) { v -> vm.setFeature { it.copy(logging = v) } }
            ToggleRow("Pain-safe mode", features.painSafe) { v -> vm.setFeature { it.copy(painSafe = v) } }
            ToggleRow("Recovery mode", features.recoveryMode) { v -> vm.setFeature { it.copy(recoveryMode = v) } }
            ToggleRow("Auto-start local music", features.autoMusic) { v -> vm.setFeature { it.copy(autoMusic = v) } }
        }

        SectionTitle("SPOTIFY")
        PremiumCard {
            var client by remember(spotify.clientId) { mutableStateOf(spotify.clientId) }
            OutlinedTextField(
                value = client,
                onValueChange = { client = it },
                label = { Text("Spotify Client ID") },
                modifier = Modifier.fillMaxWidth()
            )
            SecondaryButton("SAVE CLIENT ID") { vm.setSpotifyClientId(client) }
            Text("Redirect URI: iliascoach://spotify-callback", color = CoachMuted, fontSize = 12.sp)
        }

        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            SecondaryButton("RESTORE DEFAULT LAYOUT") { vm.resetOwnerLayout() }
        }
        Spacer(Modifier.height(28.dp))
    }
}

@Composable
private fun BlockEditor(block: OwnerBlockConfig, vm: CoachViewModel) {
    var menu by remember { mutableStateOf(false) }
    val kinds = availableKinds(block.pageId)
    PremiumCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(block.title, color = CoachText, fontWeight = FontWeight.Black)
                Text("${block.kind} · ${block.size.name}", color = CoachMuted, fontSize = 12.sp)
            }
            Switch(checked = block.visible, onCheckedChange = { vm.setBlockVisible(block.id, it) })
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            MiniAction("↑") { vm.moveBlock(block.id, -1) }
            MiniAction("↓") { vm.moveBlock(block.id, 1) }
            MiniAction("RESIZE") { vm.resizeBlock(block.id) }
            if (!block.visible) MiniAction("RESTORE", accent = CoachLime) { vm.setBlockVisible(block.id, true) }
            Box {
                MiniAction("REPLACE") { menu = true }
                DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
                    kinds.forEach { kind -> DropdownMenuItem(text = { Text(kind) }, onClick = { vm.replaceBlock(block.id, kind); menu = false }) }
                }
            }
        }
    }
}

private fun availableKinds(pageId: String): List<String> = when (pageId) {
    "exercise-player" -> listOf("playerTitle", "playerAnatomy", "playerMuscles", "playerControls", "playerMusic", "playerStats")
    "today" -> listOf("todayHero", "todayMetrics", "exerciseSequence", "progressChart")
    "today-plan" -> listOf("todayPlanList", "exerciseSequence")
    "next" -> listOf("nextHero", "upcomingSessions")
    "programs" -> listOf("programList", "exerciseSequence")
    "recovery" -> listOf("recoveryMetrics", "recoveryExercises")
    "nutrition" -> listOf("nutritionMetrics", "mealList")
    "progress" -> listOf("progressMetrics", "progressChart")
    "music" -> listOf("localMusic", "spotify")
    "settings" -> listOf("settingsFeatures")
    "cover" -> listOf("coverHero")
    else -> listOf("customText", "customMetrics", "exerciseSequence")
}

@Composable
private fun FocusSlider(label: String, value: Int, onValue: (Int) -> Unit) {
    PremiumCard(size = BlockSize.Compact) {
        Row(Modifier.fillMaxWidth()) {
            Text(label, color = CoachText, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
            Text("$value%", color = CoachBlue, fontWeight = FontWeight.Black)
        }
        Slider(value = value.toFloat(), onValueChange = { onValue(it.toInt()) }, valueRange = 0f..100f)
    }
}

@Composable
private fun ToggleRow(label: String, checked: Boolean, onChanged: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(label, color = CoachText, modifier = Modifier.weight(1f), fontWeight = FontWeight.Bold)
        Switch(checked = checked, onCheckedChange = onChanged, colors = SwitchDefaults.colors(checkedThumbColor = CoachBgDeep, checkedTrackColor = CoachLime))
    }
}

@Composable
private fun SectionTitle(text: String) {
    Text(text, color = CoachBlue, fontWeight = FontWeight.Black, fontSize = 13.sp, letterSpacing = 2.sp)
}

@Composable
fun ExercisePlayerScreen(
    exercise: Exercise,
    vm: CoachViewModel,
    onBack: () -> Unit,
    onOpenOwner: () -> Unit
) {
    val layout by vm.layout.collectAsState()
    val features by vm.features.collectAsState()
    val workout by vm.workoutState.collectAsState()
    val spotify by vm.spotifyState.collectAsState()
    val localMusicUri by vm.localMusicUri.collectAsState()
    val musicPlaying by vm.musicEngine.isPlaying.collectAsState()
    val blocks = layout.blocks.filter { it.pageId == "exercise-player" && it.visible }.sortedBy { it.order }
    val exactUri = vm.anatomyEngine.exactAnimationUri(exercise)
    var player by remember(exercise.exerciseId) { mutableStateOf<ExoPlayer?>(null) }
    var playing by remember(exercise.exerciseId) { mutableStateOf(true) }
    var speed by remember(exercise.exerciseId) { mutableFloatStateOf(1f) }

    Column(Modifier.fillMaxSize().background(CoachBgDeep)) {
        Row(
            Modifier.fillMaxWidth().background(CoachBgDeep).padding(horizontal = 18.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            RoundIconButton(icon = { Icon(Icons.AutoMirrored.Rounded.ArrowBack, null, tint = CoachText) }, onClick = onBack)
            Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(exercise.primaryMuscles.joinToString(" + ").uppercase(), color = CoachBlue, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.5.sp)
                Text(exercise.name, color = CoachText, fontSize = 19.sp, fontWeight = FontWeight.Black, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            RoundIconButton(icon = { Icon(Icons.Rounded.Settings, null, tint = CoachText) }, onClick = onOpenOwner)
        }

        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            blocks.forEach { block ->
                when (block.kind) {
                    "playerTitle" -> PlayerTitle(exercise, features, block.size)
                    "playerAnatomy" -> PlayerAnatomy(exercise, exactUri, features, block.size) { player = it; it.setPlaybackSpeed(speed) }
                    "playerMuscles" -> PlayerMuscles(exercise, block.size)
                    "playerControls" -> PlayerControls(player, playing, speed, exactUri != null, block.size,
                        onPlay = {
                            val p = player
                            if (p != null) {
                                if (p.isPlaying) p.pause() else p.play()
                                playing = p.isPlaying
                            }
                        },
                        onSpeed = {
                            speed = when (speed) { .5f -> .75f; .75f -> 1f; 1f -> 1.25f; 1.25f -> 1.5f; else -> .5f }
                            player?.setPlaybackSpeed(speed)
                        }
                    )
                    "playerMusic" -> PlayerMusic(vm, spotify, localMusicUri, musicPlaying, block.size)
                    "playerStats" -> PlayerStats(exercise, workout, vm, block.size)
                }
            }
        }
    }
}

@Composable
private fun PlayerTitle(exercise: Exercise, features: FeatureToggles, size: BlockSize) {
    PremiumCard(size = size, modifier = Modifier.padding(horizontal = 18.dp)) {
        Text(exercise.primaryMuscles.joinToString(" + ").uppercase(), color = CoachLime, fontSize = 12.sp, fontWeight = FontWeight.Black, letterSpacing = 1.7.sp)
        Text(exercise.name, color = CoachText, fontSize = 36.sp, lineHeight = 38.sp, fontWeight = FontWeight.Black)
        if (features.coachingText) Text(exercise.cue, color = CoachMuted, fontSize = 16.sp, lineHeight = 22.sp)
    }
}

@Composable
private fun PlayerAnatomy(
    exercise: Exercise,
    exactUri: Uri?,
    features: FeatureToggles,
    size: BlockSize,
    onPlayer: (ExoPlayer) -> Unit
) {
    val height = when (size) { BlockSize.Compact -> 300.dp; BlockSize.Standard -> 430.dp; BlockSize.Expanded -> 540.dp }
    Box(
        Modifier.fillMaxWidth().height(height).background(CoachCream),
        contentAlignment = Alignment.Center
    ) {
        if (exactUri != null && features.anatomyMotion) {
            AnatomyVideo(exactUri, features.autoLoop, Modifier.fillMaxSize(), onPlayer)
        } else {
            AssetImage(exercise.posterAsset, Modifier.fillMaxSize(), ContentScale.Fit)
            Box(
                Modifier.align(Alignment.BottomCenter).fillMaxWidth().background(CoachBgDeep.copy(alpha = .9f)).padding(14.dp)
            ) {
                Text("VERIFIED ANIMATION UNAVAILABLE — no fallback exercise is substituted.", color = CoachLime, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
        Row(
            Modifier.align(Alignment.TopCenter).fillMaxWidth().padding(18.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            MotionPill("ANATOMY MOTION ▶", features.anatomyMotion)
            MotionPill("FORM LOCK 🔒", features.formLock)
        }
    }
}

@Composable
private fun MotionPill(text: String, active: Boolean) {
    Box(
        Modifier.background(if (active) CoachBgDeep.copy(alpha = .82f) else CoachCard.copy(alpha = .7f), RoundedCornerShape(24.dp))
            .border(1.dp, if (active) CoachLime.copy(alpha = .25f) else CoachLine, RoundedCornerShape(24.dp))
            .padding(horizontal = 16.dp, vertical = 11.dp)
    ) { Text(text, color = if (active) CoachLime else CoachMuted, fontWeight = FontWeight.Black, fontSize = 12.sp) }
}

@Composable
private fun PlayerMuscles(exercise: Exercise, size: BlockSize) {
    PremiumCard(size = size, modifier = Modifier.padding(horizontal = 18.dp)) {
        Text("MUSCLES", color = CoachLime, fontWeight = FontWeight.Black, letterSpacing = 1.7.sp)
        Text("Primary: ${exercise.primaryMuscles.joinToString(", ")}", color = CoachText, fontWeight = FontWeight.Bold)
        Text("Secondary: ${exercise.secondaryMuscles.joinToString(", ")}", color = CoachMuted)
        Text("Equipment: ${exercise.equipment}", color = CoachMuted)
        Text("Start · ${exercise.startPose}", color = CoachMuted, fontSize = 13.sp)
        Text("Contraction · ${exercise.contractionPose}", color = CoachMuted, fontSize = 13.sp)
        Text("End · ${exercise.endPose}", color = CoachMuted, fontSize = 13.sp)
        Text("Return · ${exercise.returnPose}", color = CoachMuted, fontSize = 13.sp)
    }
}

@Composable
private fun PlayerControls(
    player: ExoPlayer?,
    playing: Boolean,
    speed: Float,
    hasExactAsset: Boolean,
    size: BlockSize,
    onPlay: () -> Unit,
    onSpeed: () -> Unit
) {
    PremiumCard(size = size, modifier = Modifier.padding(horizontal = 18.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
            Column {
                Text("ANIMATION CONTROLS", color = CoachLime, fontWeight = FontWeight.Black, letterSpacing = 1.5.sp)
                Text(if (hasExactAsset) "Exact exercise asset mapped" else "No mapped asset", color = CoachMuted, fontSize = 12.sp)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Box(Modifier.size(66.dp).background(CoachCard2, CircleShape).clickable(enabled = hasExactAsset, onClick = onSpeed), contentAlignment = Alignment.Center) {
                    Text("${speed}×", color = CoachText, fontWeight = FontWeight.Black)
                }
                Box(Modifier.size(72.dp).background(if (hasExactAsset) CoachLime else CoachCard2, CircleShape).clickable(enabled = hasExactAsset, onClick = onPlay), contentAlignment = Alignment.Center) {
                    Text(if (player?.isPlaying == true || playing) "Ⅱ" else "▶", color = CoachBgDeep, fontSize = 24.sp, fontWeight = FontWeight.Black)
                }
            }
        }
    }
}

@Composable
private fun PlayerMusic(vm: CoachViewModel, spotify: SpotifyState, localUri: String, playing: Boolean, size: BlockSize) {
    PremiumCard(size = size, modifier = Modifier.padding(horizontal = 18.dp)) {
        Text("MUSIC", color = CoachLime, fontWeight = FontWeight.Black, letterSpacing = 1.5.sp)
        Text(
            when {
                spotify.connected -> "Spotify connected"
                localUri.isNotBlank() -> "Local Media3 track ready"
                else -> "Music not configured"
            },
            color = CoachText, fontWeight = FontWeight.Black, fontSize = 18.sp
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            if (spotify.connected) {
                MiniAction("‹‹") { vm.spotifyPrevious() }
                MiniAction("PLAY", accent = CoachLime) { vm.spotifyPlay() }
                MiniAction("Ⅱ") { vm.spotifyPause() }
                MiniAction("››") { vm.spotifyNext() }
            } else if (localUri.isNotBlank()) {
                MiniAction(if (playing) "PAUSE" else "PLAY", accent = CoachLime) {
                    if (playing) vm.musicEngine.pause() else vm.playLocalMusic(Uri.parse(localUri))
                }
            } else Text("Configure Spotify or local music in the Music page.", color = CoachMuted, fontSize = 12.sp)
        }
    }
}

@Composable
private fun PlayerStats(exercise: Exercise, workout: WorkoutStateEntity?, vm: CoachViewModel, size: BlockSize) {
    Column(Modifier.padding(horizontal = 18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            MetricTile(exercise.sets.toString(), "Sets", accent = CoachLime, modifier = Modifier.weight(1f))
            MetricTile(exercise.reps, "Reps", accent = CoachLime, modifier = Modifier.weight(1f))
            MetricTile("${exercise.restSeconds}s", "Rest", accent = CoachLime, modifier = Modifier.weight(1f))
        }
        PremiumCard(size = size) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("SET ${workout?.currentSet ?: 0} / ${exercise.sets}", color = CoachText, fontWeight = FontWeight.Black, fontSize = 20.sp)
                    Text("Workout state is persisted in Room.", color = CoachMuted, fontSize = 12.sp)
                }
                RestTimerChip(workout?.restEndsAt ?: 0L)
            }
            PrimaryButton("LOG SET + START REST") { vm.logSet(exercise) }
        }
    }
}

@Composable
private fun PrimaryButton(text: String, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(containerColor = CoachBlue, contentColor = Color.White),
        shape = RoundedCornerShape(18.dp),
        modifier = Modifier.wrapContentHeight()
    ) { Text(text, fontWeight = FontWeight.Black, fontSize = 14.sp) }
}

@Composable
private fun SecondaryButton(text: String, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(containerColor = CoachCard2, contentColor = CoachText),
        shape = RoundedCornerShape(16.dp)
    ) { Text(text, fontWeight = FontWeight.Bold, fontSize = 12.sp) }
}
