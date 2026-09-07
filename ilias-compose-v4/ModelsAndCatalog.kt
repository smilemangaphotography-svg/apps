package com.iliaperformance.iliacoach2026

data class Exercise(
    val exerciseId: String,
    val name: String,
    val equipment: String,
    val primaryMuscles: List<String>,
    val secondaryMuscles: List<String>,
    val startPose: String,
    val contractionPose: String,
    val endPose: String,
    val returnPose: String,
    val animationAsset: String,
    val posterAsset: String,
    val sets: Int,
    val reps: String,
    val restSeconds: Int,
    val cue: String
)

enum class BlockSize { Compact, Standard, Expanded }

data class OwnerPageConfig(
    val id: String,
    val title: String,
    val visible: Boolean = true,
    val order: Int,
    val showBottom: Boolean = false,
    val showDrawer: Boolean = true,
    val custom: Boolean = false
)

data class OwnerBlockConfig(
    val id: String,
    val pageId: String,
    val title: String,
    val visible: Boolean = true,
    val order: Int,
    val size: BlockSize = BlockSize.Standard,
    val kind: String
)

data class OwnerLayoutConfig(
    val pages: List<OwnerPageConfig>,
    val blocks: List<OwnerBlockConfig>
)

data class FeatureToggles(
    val anatomyMotion: Boolean = true,
    val formLock: Boolean = true,
    val autoLoop: Boolean = true,
    val voiceCue: Boolean = false,
    val coachingText: Boolean = true,
    val muscleHighlight: Boolean = true,
    val timers: Boolean = true,
    val logging: Boolean = true,
    val painSafe: Boolean = true,
    val recoveryMode: Boolean = true,
    val autoMusic: Boolean = false
)

data class FocusProfile(
    val upper: Int = 45,
    val lower: Int = 55,
    val recovery: Int = 60,
    val mobility: Int = 45,
    val cardio: Int = 30,
    val core: Int = 40,
    val strength: Int = 65
)

object CoachDefaults {
    val pages = listOf(
        OwnerPageConfig("cover", "Cover", order = 0),
        OwnerPageConfig("today", "Today", order = 1, showBottom = true),
        OwnerPageConfig("today-plan", "Today Plan", order = 2),
        OwnerPageConfig("next", "Next", order = 3),
        OwnerPageConfig("programs", "Programs", order = 4, showBottom = true),
        OwnerPageConfig("recovery", "Recovery / Physio", order = 5, showBottom = true),
        OwnerPageConfig("nutrition", "Nutrition", order = 6, showBottom = true),
        OwnerPageConfig("progress", "Progress", order = 7, showBottom = true),
        OwnerPageConfig("music", "Spotify / Music", order = 8),
        OwnerPageConfig("owner", "Owner Layout", order = 9),
        OwnerPageConfig("settings", "Settings", order = 10)
    )

    val blocks = listOf(
        OwnerBlockConfig("cover.hero", "cover", "Cover hero", order = 0, kind = "coverHero"),
        OwnerBlockConfig("today.hero", "today", "Today hero", order = 0, kind = "todayHero"),
        OwnerBlockConfig("today.metrics", "today", "Today metrics", order = 1, kind = "todayMetrics"),
        OwnerBlockConfig("today.sequence", "today", "Exercise sequence", order = 2, kind = "exerciseSequence"),
        OwnerBlockConfig("plan.list", "today-plan", "Plan list", order = 0, kind = "todayPlanList"),
        OwnerBlockConfig("next.hero", "next", "Next workout", order = 0, kind = "nextHero"),
        OwnerBlockConfig("next.sessions", "next", "Upcoming sessions", order = 1, kind = "upcomingSessions"),
        OwnerBlockConfig("programs.list", "programs", "Programs", order = 0, kind = "programList"),
        OwnerBlockConfig("recovery.metrics", "recovery", "Recovery metrics", order = 0, kind = "recoveryMetrics"),
        OwnerBlockConfig("recovery.exercises", "recovery", "Recovery exercises", order = 1, kind = "recoveryExercises"),
        OwnerBlockConfig("nutrition.metrics", "nutrition", "Nutrition metrics", order = 0, kind = "nutritionMetrics"),
        OwnerBlockConfig("nutrition.meals", "nutrition", "Meals", order = 1, kind = "mealList"),
        OwnerBlockConfig("progress.metrics", "progress", "Progress metrics", order = 0, kind = "progressMetrics"),
        OwnerBlockConfig("progress.chart", "progress", "Progress chart", order = 1, kind = "progressChart"),
        OwnerBlockConfig("music.local", "music", "Local music", order = 0, kind = "localMusic"),
        OwnerBlockConfig("music.spotify", "music", "Spotify", order = 1, kind = "spotify"),
        OwnerBlockConfig("settings.features", "settings", "Feature toggles", order = 0, kind = "settingsFeatures"),
        OwnerBlockConfig("player.title", "exercise-player", "Title", order = 0, kind = "playerTitle"),
        OwnerBlockConfig("player.anatomy", "exercise-player", "Anatomy", order = 1, size = BlockSize.Expanded, kind = "playerAnatomy"),
        OwnerBlockConfig("player.muscles", "exercise-player", "Muscles", order = 2, kind = "playerMuscles"),
        OwnerBlockConfig("player.controls", "exercise-player", "Controls", order = 3, kind = "playerControls"),
        OwnerBlockConfig("player.music", "exercise-player", "Music", order = 4, kind = "playerMusic"),
        OwnerBlockConfig("player.stats", "exercise-player", "Stats", order = 5, kind = "playerStats")
    )

    val layout = OwnerLayoutConfig(pages, blocks)
}

object ExerciseCatalog {
    private fun e(
        id: String, name: String, equipment: String, primary: List<String>, secondary: List<String>,
        start: String, contraction: String, end: String, ret: String,
        sets: Int, reps: String, rest: Int, cue: String
    ) = Exercise(
        exerciseId = id,
        name = name,
        equipment = equipment,
        primaryMuscles = primary,
        secondaryMuscles = secondary,
        startPose = start,
        contractionPose = contraction,
        endPose = end,
        returnPose = ret,
        animationAsset = "media/anatomy/$id.mp4",
        posterAsset = "media/anatomy/$id.webp",
        sets = sets,
        reps = reps,
        restSeconds = rest,
        cue = cue
    )

    val all = listOf(
        e("machine-chest-press", "Machine Chest Press", "Seated chest press machine", listOf("Pectoralis major"), listOf("Anterior deltoid", "Triceps"), "Shoulder blades supported; handles beside chest.", "Press forward without shrugging.", "Arms nearly straight; ribs controlled.", "Return under control until chest is loaded.", 4, "6–8", 75, "Press smoothly and keep the shoulder blades supported."),
        e("face-pull", "Face Pull", "Cable rope", listOf("Rear deltoids", "Mid traps"), listOf("Rotator cuff", "Rhomboids"), "Rope at eye level; arms long.", "Pull rope toward eyes while externally rotating.", "Hands finish beside temples; elbows high.", "Return slowly without losing shoulder position.", 3, "10–12", 45, "Pull toward eye level and rotate externally."),
        e("barbell-hip-thrust", "Barbell Hip Thrust", "Bench + barbell", listOf("Gluteus maximus"), listOf("Hamstrings", "Adductors"), "Upper back on bench; hips flexed; shins near vertical.", "Drive through heels and extend hips.", "Torso and thighs align; pelvis neutral.", "Lower hips under control without losing brace.", 4, "8–10", 75, "Drive through the heels and finish with the pelvis neutral."),
        e("lat-pulldown", "Lat Pulldown", "Cable pulldown", listOf("Latissimus dorsi"), listOf("Biceps", "Lower traps"), "Torso tall; bar overhead; shoulders set.", "Drive elbows down toward the ribs.", "Bar approaches upper chest without leaning back excessively.", "Return to full overhead reach under control.", 4, "5–7", 60, "Drive elbows toward your back pockets."),
        e("leg-press", "Leg Press", "45-degree leg press", listOf("Quadriceps", "Gluteus maximus"), listOf("Hamstrings", "Adductors"), "Feet planted; pelvis supported; knees flexed safely.", "Press platform away while knees track over toes.", "Legs extend without locking hard.", "Lower under control to tolerated depth.", 4, "8–12", 75, "Control depth and keep knees tracking over toes."),
        e("goblet-squat", "Goblet Squat", "Dumbbell", listOf("Quadriceps", "Gluteus maximus"), listOf("Core", "Adductors"), "Stand tall holding dumbbell at chest.", "Sit down between hips with knees tracking over toes.", "Reach stable bottom depth with tall torso.", "Drive through whole foot to stand.", 3, "8–10", 60, "Sit between the hips with a tall torso."),
        e("supported-single-arm-dumbbell-row", "Supported Single-Arm DB Row", "Bench + dumbbell", listOf("Latissimus dorsi", "Rhomboids"), listOf("Biceps", "Rear deltoid"), "One hand supported; spine neutral; arm long.", "Pull elbow toward hip without twisting.", "Dumbbell reaches torso with scapula retracted.", "Lower slowly to full reach.", 3, "8–12", 45, "Keep the torso fixed and pull the elbow toward the hip."),
        e("seated-hamstring-curl", "Seated Hamstring Curl", "Seated leg curl", listOf("Hamstrings"), listOf("Gastrocnemius"), "Hips pinned to seat; knees aligned with machine axis.", "Flex knees smoothly against the pad.", "Reach strong knee flexion without lifting hips.", "Return slowly to long hamstring position.", 3, "10–15", 45, "Curl smoothly without lifting the hips."),
        e("standing-calf-raise", "Standing Calf Raise", "Standing calf machine", listOf("Gastrocnemius"), listOf("Soleus"), "Heels lowered under control; knees soft.", "Rise through the balls of the feet.", "Pause at full plantar flexion.", "Lower into a controlled stretch.", 3, "12–15", 40, "Pause at the top and control the stretch."),
        e("incline-dumbbell-press", "Incline Dumbbell Press", "Incline bench + dumbbells", listOf("Upper pectoralis major"), listOf("Anterior deltoid", "Triceps"), "Shoulder blades anchored; dumbbells beside upper chest.", "Press upward and slightly inward.", "Arms extended over shoulders without shrugging.", "Lower with elbows controlled.", 3, "8–10", 60, "Keep wrists stacked and shoulder blades anchored."),
        e("dumbbell-lateral-raise", "Dumbbell Lateral Raise", "Dumbbells", listOf("Lateral deltoid"), listOf("Supraspinatus", "Upper traps"), "Stand tall; dumbbells by sides.", "Raise arms in scapular plane with soft elbows.", "Stop near shoulder height before shrugging.", "Lower slowly to sides.", 3, "10–15", 40, "Lead with the elbows and stop before shrugging."),
        e("backward-sled-drag", "Backward Sled Drag", "Weighted sled", listOf("Quadriceps"), listOf("Calves", "Glutes"), "Face sled; arms extended; knees slightly bent.", "Step backward with short continuous steps.", "Maintain quad tension and upright torso.", "Continue without letting the sled coast.", 4, "30–45s", 45, "Use short controlled steps and keep tension through the quads."),
        e("dumbbell-biceps-curl", "Dumbbell Biceps Curl", "Dumbbells", listOf("Biceps brachii"), listOf("Brachialis", "Brachioradialis"), "Arms long by sides; shoulders quiet.", "Flex elbows without swinging.", "Dumbbells approach shoulders with elbows stable.", "Lower fully under control.", 3, "8–12", 45, "Keep the elbows quiet and avoid body swing."),
        e("front-plank", "Front Plank", "Bodyweight", listOf("Rectus abdominis", "Transverse abdominis"), listOf("Glutes", "Serratus anterior"), "Elbows under shoulders; body long.", "Brace trunk and squeeze glutes.", "Maintain straight line head-to-heels.", "Finish set before lumbar position changes.", 3, "30–60s", 45, "Brace ribs over pelvis and keep the glutes active."),
        e("pallof-press", "Pallof Press", "Cable", listOf("Obliques", "Transverse abdominis"), listOf("Glutes", "Shoulder stabilizers"), "Stand side-on to cable; handle at chest.", "Press arms forward resisting rotation.", "Hold arms extended with torso square.", "Return handle to chest without twisting.", 3, "8–12/side", 40, "Resist rotation and keep the ribcage stacked over the pelvis."),
        e("push-up", "Push-Up", "Bodyweight", listOf("Pectoralis major"), listOf("Triceps", "Anterior deltoid", "Serratus anterior"), "Hands under shoulders; body rigid.", "Lower chest between hands with elbows controlled.", "Reach comfortable bottom while maintaining trunk line.", "Press floor away to start.", 3, "8–15", 45, "Keep the body rigid and press the floor away."),
        e("romanian-deadlift", "Romanian Deadlift", "Barbell", listOf("Hamstrings", "Gluteus maximus"), listOf("Erector spinae", "Adductors"), "Stand tall with bar close to thighs.", "Hinge hips back while keeping shins nearly vertical.", "Stop at strong hamstring tension with neutral spine.", "Drive hips forward to stand.", 3, "6–10", 75, "Push the hips back and keep the bar close to the legs."),
        e("rope-triceps-pressdown", "Rope Triceps Pressdown", "Cable rope", listOf("Triceps"), listOf("Anconeus"), "Elbows pinned near ribs; rope at chest level.", "Extend elbows without moving shoulders.", "Finish with arms long and rope separated slightly.", "Return slowly until forearms rise.", 3, "10–15", 40, "Keep the elbows pinned and move only at the elbow joint."),
        e("running", "Running", "Treadmill / outdoor", listOf("Glutes", "Quadriceps", "Calves"), listOf("Hamstrings", "Core"), "Tall posture with relaxed arms.", "Land under center of mass and transition smoothly.", "Push through stance without overstriding.", "Recover leg forward with compact mechanics.", 1, "20–45 min", 0, "Run tall, relaxed, and avoid reaching the foot far ahead."),
        e("seated-cable-row", "Seated Cable Row", "Cable row", listOf("Latissimus dorsi", "Rhomboids"), listOf("Biceps", "Rear deltoid"), "Sit tall; arms long; torso stable.", "Pull handle toward lower ribs.", "Finish with shoulders down and back.", "Return arms forward without collapsing torso.", 3, "8–12", 50, "Pull toward the lower ribs while keeping the torso quiet."),
        e("seated-calf-raise", "Seated Calf Raise", "Seated calf machine", listOf("Soleus"), listOf("Gastrocnemius"), "Balls of feet on platform; heels lowered.", "Raise heels as high as comfortable.", "Pause at top contraction.", "Lower slowly into stretch.", 3, "12–20", 40, "Use the full ankle range without bouncing."),
        e("seated-shoulder-press", "Seated Shoulder Press", "Shoulder press machine", listOf("Anterior deltoid", "Lateral deltoid"), listOf("Triceps"), "Back supported; handles beside shoulders.", "Press upward without arching lower back.", "Arms extend overhead without shrugging excessively.", "Lower handles under control.", 3, "6–10", 60, "Keep ribs down and press without shrugging."),
        e("side-plank", "Side Plank", "Bodyweight", listOf("Obliques"), listOf("Gluteus medius", "Quadratus lumborum"), "Elbow under shoulder; body aligned on side.", "Lift hips and brace trunk.", "Maintain straight line head-to-feet.", "Lower with control after the timed hold.", 3, "20–45s/side", 40, "Keep the hips stacked and the ribcage controlled."),
        e("single-leg-leg-press", "Single-Leg Leg Press", "Leg press", listOf("Quadriceps", "Gluteus maximus"), listOf("Hamstrings", "Adductors"), "One foot centered; pelvis supported.", "Press platform away while knee tracks over foot.", "Extend without pelvic rotation.", "Lower to a controlled tolerated depth.", 3, "8–12/side", 60, "Keep the pelvis square and control the knee path."),
        e("step-up", "Step-Up", "Box / bench", listOf("Quadriceps", "Gluteus maximus"), listOf("Hamstrings", "Calves"), "Working foot fully on box; torso tall.", "Drive through working leg to rise.", "Stand tall on box without pushing excessively from trailing leg.", "Lower under control to floor.", 3, "8–12/side", 45, "Drive through the working leg and control the descent."),
        e("supported-bulgarian-split-squat", "Supported Bulgarian Split Squat", "Bench + support", listOf("Quadriceps", "Gluteus maximus"), listOf("Adductors", "Hamstrings"), "Rear foot supported; front foot stable; light hand support.", "Lower vertically while front knee tracks over toes.", "Reach tolerated depth with pelvis controlled.", "Drive through front foot to rise.", 3, "8–10/side", 60, "Use the support for balance and keep the front knee tracking cleanly.")
    )

    private val byId = all.associateBy { it.exerciseId }
    fun find(exerciseId: String): Exercise? = byId[exerciseId]
    fun require(exerciseId: String): Exercise = byId[exerciseId]
        ?: error("No exact exercise mapping for $exerciseId")
}

object PlanCatalog {
    val upperA = listOf("machine-chest-press", "lat-pulldown", "supported-single-arm-dumbbell-row", "incline-dumbbell-press", "face-pull")
    val lowerA = listOf("goblet-squat", "barbell-hip-thrust", "leg-press", "seated-hamstring-curl", "standing-calf-raise")
    val fullBody = listOf("goblet-squat", "machine-chest-press", "seated-cable-row", "romanian-deadlift", "pallof-press")
    val recovery = listOf("backward-sled-drag", "step-up", "single-leg-leg-press", "pallof-press")
    val runningSupport = listOf("standing-calf-raise", "seated-calf-raise", "romanian-deadlift", "side-plank", "running")
}
