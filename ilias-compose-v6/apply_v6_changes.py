from pathlib import Path

ROOT = Path('buildsrc/Ilias-Coach/app/src/main/java/com/iliaperformance/iliacoach2026')

def rep(file, old, new, label):
    p=ROOT/file; s=p.read_text()
    if old not in s: raise SystemExit(f'Missing V6 target {label} in {file}')
    p.write_text(s.replace(old,new,1))

# Defaults: add a persistent week page + editable nutrition profile block.
rep('ModelsAndCatalog.kt',
'''        OwnerPageConfig("today-plan", "Today Plan", order = 2),
        OwnerPageConfig("next", "Next", order = 3),''',
'''        OwnerPageConfig("today-plan", "Today Plan", order = 2),
        OwnerPageConfig("week", "Week Plan", order = 3),
        OwnerPageConfig("next", "Next", order = 4),''','week page')

rep('ModelsAndCatalog.kt',
'''        OwnerBlockConfig("plan.list", "today-plan", "Plan list", order = 0, kind = "todayPlanList"),
        OwnerBlockConfig("next.hero", "next", "Next workout", order = 0, kind = "nextHero"),''',
'''        OwnerBlockConfig("plan.list", "today-plan", "Plan list", order = 0, kind = "todayPlanList"),
        OwnerBlockConfig("week.plan", "week", "Weekly workout plan", order = 0, size = BlockSize.Expanded, kind = "weekPlan"),
        OwnerBlockConfig("next.hero", "next", "Next workout", order = 0, kind = "nextHero"),''','week block')

rep('ModelsAndCatalog.kt',
'''        OwnerBlockConfig("nutrition.metrics", "nutrition", "Nutrition metrics", order = 0, kind = "nutritionMetrics"),
        OwnerBlockConfig("nutrition.meals", "nutrition", "Meals", order = 1, kind = "mealList"),''',
'''        OwnerBlockConfig("nutrition.metrics", "nutrition", "Nutrition metrics", order = 0, kind = "nutritionMetrics"),
        OwnerBlockConfig("nutrition.preferences", "nutrition", "Food preferences", order = 1, kind = "nutritionPreferences"),
        OwnerBlockConfig("nutrition.meals", "nutrition", "Meals", order = 2, kind = "mealList"),''','nutrition profile block')

# Merge new V6 defaults even when upgrading over V5 with an existing DataStore layout.
rep('Persistence.kt',
'''    val layoutFlow: Flow<OwnerLayoutConfig> = context.ownerDataStore.data.map { prefs ->
        decodeLayout(prefs[Keys.layout]) ?: CoachDefaults.layout
    }''',
'''    val layoutFlow: Flow<OwnerLayoutConfig> = context.ownerDataStore.data.map { prefs ->
        V6LayoutMigration.merge(decodeLayout(prefs[Keys.layout]) ?: CoachDefaults.layout)
    }''','layout migration')

# ViewModel: V6 DataStore-backed food profile and weekly schedule.
rep('CoachViewModel.kt',
'''    private val prefs = OwnerPreferences(app)
    private val dao = CoachDatabase.get(app).workoutDao()''',
'''    private val prefs = OwnerPreferences(app)
    val v6Prefs = V6Preferences(app)
    private val dao = CoachDatabase.get(app).workoutDao()''','v6 prefs')

rep('CoachViewModel.kt',
'''    val focus: StateFlow<FocusProfile> = prefs.focusFlow.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5_000), FocusProfile()
    )''',
'''    val focus: StateFlow<FocusProfile> = prefs.focusFlow.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5_000), FocusProfile()
    )
    val nutritionProfile: StateFlow<NutritionProfile> = v6Prefs.nutritionFlow.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5_000), NutritionProfile()
    )
    val weekPlan: StateFlow<List<WeekDayPlan>> = v6Prefs.weekFlow.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5_000), V6Defaults.week
    )''','v6 flows')

anchor='''    fun setSpotifyClientId(value: String) = viewModelScope.launch { prefs.saveSpotifyClientId(value) }
'''
methods='''    fun toggleAvoidFood(food: String) {
        val value = food.trim(); if (value.isBlank()) return
        val p = nutritionProfile.value
        val next = if (p.avoid.any { it.equals(value, true) }) p.copy(avoid = p.avoid.filterNot { it.equals(value, true) }.toSet()) else p.copy(avoid = p.avoid + value)
        viewModelScope.launch { v6Prefs.saveNutrition(next) }
    }
    fun addAvoidFood(food: String) { val v=food.trim(); if(v.isNotBlank()) viewModelScope.launch { v6Prefs.saveNutrition(nutritionProfile.value.copy(avoid=nutritionProfile.value.avoid+v)) } }
    fun clearAvoidFoods() = viewModelScope.launch { v6Prefs.saveNutrition(nutritionProfile.value.copy(avoid=emptySet())) }
    fun toggleWeekDay(index: Int) { val w=weekPlan.value.toMutableList(); if(index in w.indices){ w[index]=w[index].copy(enabled=!w[index].enabled); viewModelScope.launch{v6Prefs.saveWeek(w)} } }
    fun cycleWeekTime(index: Int) { val slots=listOf("07:00","10:00","12:00","18:30","20:00"); val w=weekPlan.value.toMutableList(); if(index in w.indices){ val d=w[index]; val n=slots[(slots.indexOf(d.time)+1).let{if(it<=0)0 else it%slots.size}]; w[index]=d.copy(time=n,enabled=true); viewModelScope.launch{v6Prefs.saveWeek(w)} } }
    fun cycleWeekProgram(index: Int) {
        val choices=listOf(
            "Lower Body Strength" to PlanCatalog.lowerA,
            "Upper Body Strength" to PlanCatalog.upperA,
            "Full Body + Core" to PlanCatalog.fullBody,
            "Running Support" to PlanCatalog.runningSupport,
            "Mobility & Recovery" to PlanCatalog.recovery
        )
        val w=weekPlan.value.toMutableList(); if(index !in w.indices) return
        val d=w[index]; val i=choices.indexOfFirst{it.first==d.title}; val c=choices[(i+1).coerceAtLeast(0)%choices.size]
        w[index]=d.copy(title=c.first,exerciseIds=c.second,enabled=true); viewModelScope.launch{v6Prefs.saveWeek(w)}
    }

'''+anchor
rep('CoachViewModel.kt',anchor,methods,'v6 viewmodel methods')

# Screen routing and upgraded cover/nutrition/week.
rep('Screens.kt','''    "cover" -> "⌂"; "today" -> "▣"; "today-plan" -> "☷"; "next" -> "→"; "programs" -> "▥"''','''    "cover" -> "⌂"; "today" -> "▣"; "today-plan" -> "☷"; "week" -> "▦"; "next" -> "→"; "programs" -> "▥"''','week glyph')
rep('Screens.kt','''        "coverHero" -> CoverHero(onNavigate)''','''        "coverHero" -> CoverHeroV6(onNavigate)''','v6 cover')
rep('Screens.kt','''        "nutritionMetrics" -> NutritionMetrics()
        "mealList" -> MealList()''','''        "nutritionMetrics" -> NutritionMetrics()
        "nutritionPreferences" -> NutritionPreferencesBlock(vm)
        "mealList" -> AdaptiveMealList(vm)
        "weekPlan" -> WeekPlanBlock(vm, onExercise)''','adaptive nutrition/week render')
rep('Screens.kt','''    "today-plan" -> listOf("todayPlanList", "exerciseSequence")
    "next" -> listOf("nextHero", "upcomingSessions")''','''    "today-plan" -> listOf("todayPlanList", "exerciseSequence")
    "week" -> listOf("weekPlan", "exerciseSequence")
    "next" -> listOf("nextHero", "upcomingSessions")''','week owner kinds')
rep('Screens.kt','''    "nutrition" -> listOf("nutritionMetrics", "mealList")''','''    "nutrition" -> listOf("nutritionMetrics", "nutritionPreferences", "mealList")''','nutrition owner kinds')

# Header metadata.
rep('CoachApp.kt','''                                "today-plan" -> "CURRENT WORKOUT"
                                "next" -> "UPCOMING TRAINING"''','''                                "today-plan" -> "CURRENT WORKOUT"
                                "week" -> "YOUR 7-DAY TRAINING MAP"
                                "next" -> "UPCOMING TRAINING"''','week header')

# Compile guards.
checks={
 'ModelsAndCatalog.kt':['OwnerPageConfig("week", "Week Plan"','kind = "nutritionPreferences"'],
 'Persistence.kt':['V6LayoutMigration.merge'],
 'CoachViewModel.kt':['val nutritionProfile: StateFlow<NutritionProfile>','fun cycleWeekProgram'],
 'Screens.kt':['CoverHeroV6(onNavigate)','NutritionPreferencesBlock(vm)','WeekPlanBlock(vm, onExercise)'],
 'CoachApp.kt':['"week" -> "YOUR 7-DAY TRAINING MAP"']
}
for f, needles in checks.items():
    t=(ROOT/f).read_text()
    for n in needles:
        if n not in t: raise SystemExit(f'V6 invariant missing {n} in {f}')
print('Applied ILIAS COACH V6 cover, adaptive nutrition and weekly schedule')
