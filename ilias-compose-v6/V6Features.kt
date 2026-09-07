package com.iliaperformance.iliacoach2026

import android.content.Context
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import org.json.JSONArray
import org.json.JSONObject

private val Context.coachV6Store by preferencesDataStore("coach_v6_profile")

data class NutritionProfile(
    val avoid: Set<String> = setOf("Beef", "Pork", "Prawns", "Butter", "Cheese", "Avocado"),
    val prefer: Set<String> = setOf("Chicken", "Salmon", "Sea bass", "Eggs", "Oats", "Rice", "Potatoes", "Vegetables", "Fruit")
)

data class WeekDayPlan(
    val day: String,
    val time: String,
    val title: String,
    val exerciseIds: List<String>,
    val enabled: Boolean = true
)

object V6Defaults {
    val week = listOf(
        WeekDayPlan("MON", "18:30", "Lower Body Strength", PlanCatalog.lowerA),
        WeekDayPlan("TUE", "20:00", "Mobility & Recovery", PlanCatalog.recovery),
        WeekDayPlan("WED", "18:30", "Upper Body Strength", PlanCatalog.upperA),
        WeekDayPlan("THU", "20:00", "Recovery / Physio", PlanCatalog.recovery),
        WeekDayPlan("FRI", "18:30", "Full Body + Core", PlanCatalog.fullBody),
        WeekDayPlan("SAT", "10:00", "Running Support", PlanCatalog.runningSupport),
        WeekDayPlan("SUN", "—", "Rest / Recovery", emptyList(), enabled = false)
    )
}

class V6Preferences(private val context: Context) {
    private object Keys {
        val nutrition = stringPreferencesKey("nutrition_profile")
        val week = stringPreferencesKey("week_schedule")
    }

    val nutritionFlow: Flow<NutritionProfile> = context.coachV6Store.data.map { decodeNutrition(it[Keys.nutrition]) }
    val weekFlow: Flow<List<WeekDayPlan>> = context.coachV6Store.data.map { decodeWeek(it[Keys.week]) }

    suspend fun saveNutrition(value: NutritionProfile) {
        context.coachV6Store.edit { it[Keys.nutrition] = encodeNutrition(value) }
    }

    suspend fun saveWeek(value: List<WeekDayPlan>) {
        context.coachV6Store.edit { it[Keys.week] = encodeWeek(value) }
    }

    private fun encodeNutrition(p: NutritionProfile) = JSONObject().apply {
        put("avoid", JSONArray(p.avoid.sorted()))
        put("prefer", JSONArray(p.prefer.sorted()))
    }.toString()

    private fun decodeNutrition(raw: String?): NutritionProfile = runCatching {
        if (raw.isNullOrBlank()) return@runCatching NutritionProfile()
        val o = JSONObject(raw)
        fun set(name: String) = buildSet {
            val a = o.optJSONArray(name) ?: JSONArray()
            for (i in 0 until a.length()) add(a.optString(i))
        }.filter { it.isNotBlank() }.toSet()
        NutritionProfile(set("avoid"), set("prefer"))
    }.getOrDefault(NutritionProfile())

    private fun encodeWeek(days: List<WeekDayPlan>) = JSONArray().apply {
        days.forEach { d -> put(JSONObject().apply {
            put("day", d.day); put("time", d.time); put("title", d.title); put("enabled", d.enabled)
            put("exercises", JSONArray(d.exerciseIds))
        }) }
    }.toString()

    private fun decodeWeek(raw: String?): List<WeekDayPlan> = runCatching {
        if (raw.isNullOrBlank()) return@runCatching V6Defaults.week
        val a = JSONArray(raw)
        buildList {
            for (i in 0 until a.length()) {
                val o = a.getJSONObject(i); val e = o.optJSONArray("exercises") ?: JSONArray()
                add(WeekDayPlan(
                    day = o.optString("day"), time = o.optString("time"), title = o.optString("title"),
                    exerciseIds = buildList { for (j in 0 until e.length()) add(e.optString(j)) }.filter { ExerciseCatalog.find(it) != null },
                    enabled = o.optBoolean("enabled", true)
                ))
            }
        }.ifEmpty { V6Defaults.week }
    }.getOrDefault(V6Defaults.week)
}

object V6LayoutMigration {
    fun merge(layout: OwnerLayoutConfig): OwnerLayoutConfig {
        val pages = layout.pages.toMutableList()
        if (pages.none { it.id == "week" }) {
            val insert = (pages.indexOfFirst { it.id == "today-plan" } + 1).coerceAtLeast(0)
            pages.add(insert, OwnerPageConfig("week", "Week Plan", order = insert, showDrawer = true))
        }
        val normalizedPages = pages.mapIndexed { index, p -> p.copy(order = index) }
        val blocks = layout.blocks.toMutableList()
        if (blocks.none { it.id == "week.plan" }) blocks.add(OwnerBlockConfig("week.plan", "week", "Weekly workout plan", order = 0, size = BlockSize.Expanded, kind = "weekPlan"))
        if (blocks.none { it.id == "nutrition.preferences" }) {
            val meal = blocks.firstOrNull { it.id == "nutrition.meals" }
            blocks.add(OwnerBlockConfig("nutrition.preferences", "nutrition", "Food preferences", order = meal?.order ?: 1, kind = "nutritionPreferences"))
            for (i in blocks.indices) if (blocks[i].pageId == "nutrition" && blocks[i].id == "nutrition.meals") blocks[i] = blocks[i].copy(order = 2)
        }
        return OwnerLayoutConfig(normalizedPages, blocks)
    }
}

@Composable
fun CoverHeroV6(onNavigate: (String) -> Unit) {
    PremiumCard(size = BlockSize.Expanded) {
        Box(Modifier.fillMaxWidth().height(210.dp), contentAlignment = Alignment.Center) {
            Canvas(Modifier.fillMaxWidth().height(210.dp)) {
                val c = Offset(size.width * .76f, size.height * .42f)
                drawCircle(CoachBlue.copy(alpha = .12f), radius = size.minDimension * .34f, center = c)
                drawCircle(CoachLime.copy(alpha = .07f), radius = size.minDimension * .23f, center = c)
                drawLine(CoachBlue.copy(alpha = .45f), Offset(0f, size.height * .82f), Offset(size.width, size.height * .82f), 2f)
            }
            Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(9.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Box(Modifier.size(54.dp).background(CoachBlue.copy(alpha=.16f), RoundedCornerShape(17.dp)).border(1.dp, CoachBlue.copy(alpha=.45f), RoundedCornerShape(17.dp)), contentAlignment = Alignment.Center) {
                        Text("IC", color = CoachBlue, fontSize = 18.sp, fontWeight = FontWeight.Black)
                    }
                    Column {
                        Text("ILIAS COACH", color = CoachText, fontSize = 20.sp, fontWeight = FontWeight.Black, letterSpacing = 1.4.sp)
                        Text("PERSONAL PERFORMANCE SYSTEM", color = CoachMuted, fontSize = 9.sp, letterSpacing = 1.5.sp)
                    }
                }
                Spacer(Modifier.height(8.dp))
                Text("TRAIN WITH PURPOSE.", color = CoachText, fontSize = 31.sp, fontWeight = FontWeight.Black)
                Text("RECOVER WITH PRECISION.", color = CoachBlue, fontSize = 24.sp, fontWeight = FontWeight.Black)
                Text("One adaptive plan for strength, movement, recovery and nutrition.", color = CoachMuted, fontSize = 14.sp)
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            MetricTile("7", "Day view", modifier = Modifier.weight(1f))
            MetricTile("100%", "Editable", accent = CoachLime, modifier = Modifier.weight(1f))
            MetricTile("HD", "Anatomy", modifier = Modifier.weight(1f))
        }
        PrimaryButton("OPEN TODAY →") { onNavigate("today") }
        SecondaryButton("VIEW WEEK PLAN") { onNavigate("week") }
    }
}

private val foodOptions = listOf("Beef","Pork","Chicken","Salmon","Sea bass","Prawns","Eggs","Milk","Yogurt","Cheese","Butter","Avocado","Nuts","Oats","Rice","Pasta","Potatoes","Vegetables","Fruit")

@Composable
fun NutritionPreferencesBlock(vm: CoachViewModel) {
    val profile by vm.nutritionProfile.collectAsState()
    var custom by remember { mutableStateOf("") }
    PremiumCard {
        Text("FOOD PROFILE", color = CoachBlue, fontWeight = FontWeight.Black, fontSize = 13.sp, letterSpacing = 1.8.sp)
        Text("Tap foods you avoid. Meals below update automatically.", color = CoachMuted, fontSize = 13.sp)
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            foodOptions.chunked(3).forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    row.forEach { food ->
                        val off = profile.avoid.any { it.equals(food, true) }
                        Box(
                            Modifier.weight(1f).background(if (off) Color(0xFF3A1F25) else CoachCard2, RoundedCornerShape(14.dp))
                                .border(1.dp, if (off) Color(0xFFB85A6B) else CoachLine, RoundedCornerShape(14.dp))
                                .clickable { vm.toggleAvoidFood(food) }.padding(horizontal = 9.dp, vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) { Text(if (off) "✕ $food" else food, color = if (off) Color(0xFFFFB4C0) else CoachText, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                    }
                }
            }
        }
        OutlinedTextField(value = custom, onValueChange = { custom = it }, label = { Text("Add food I avoid") }, modifier = Modifier.fillMaxWidth())
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            MiniAction("ADD") { if (custom.isNotBlank()) { vm.addAvoidFood(custom); custom = "" } }
            MiniAction("CLEAR", accent = CoachMuted) { vm.clearAvoidFoods() }
        }
        if (profile.avoid.isNotEmpty()) Text("Avoiding: ${profile.avoid.sorted().joinToString(" · ")}", color = CoachMuted, fontSize = 11.sp)
    }
}

data class AdaptiveMeal(val title: String, val detail: String, val protein: String)

private fun buildMeals(profile: NutritionProfile): List<AdaptiveMeal> {
    val a = profile.avoid.map { it.lowercase() }.toSet()
    fun allowed(vararg words: String) = words.none { w -> a.any { it.contains(w.lowercase()) || w.lowercase().contains(it) } }
    val breakfast = when {
        allowed("eggs") -> AdaptiveMeal("Breakfast", "Eggs · oats · fruit", "30–35g protein")
        allowed("yogurt", "milk") -> AdaptiveMeal("Breakfast", "High-protein yogurt · oats · fruit", "25–30g protein")
        else -> AdaptiveMeal("Breakfast", "Oats · fruit · plant protein", "25–30g protein")
    }
    val lunch = when {
        allowed("chicken") -> AdaptiveMeal("Lunch", "Grilled chicken · rice · vegetables", "40–45g protein")
        allowed("salmon") -> AdaptiveMeal("Lunch", "Salmon · rice · vegetables", "35–40g protein")
        allowed("eggs") -> AdaptiveMeal("Lunch", "Eggs · potatoes · vegetables", "30–35g protein")
        else -> AdaptiveMeal("Lunch", "Legume bowl · rice · vegetables", "25–30g protein")
    }
    val dinner = when {
        allowed("salmon") -> AdaptiveMeal("Dinner", "Salmon · potatoes · salad", "35–40g protein")
        allowed("sea bass") -> AdaptiveMeal("Dinner", "Sea bass · potatoes · salad", "35–40g protein")
        allowed("chicken") -> AdaptiveMeal("Dinner", "Chicken · potatoes · salad", "40–45g protein")
        else -> AdaptiveMeal("Dinner", "Lentils · rice · salad", "25–30g protein")
    }
    val snack = when {
        allowed("yogurt", "milk") && allowed("nuts") -> AdaptiveMeal("Snack", "Yogurt · fruit · nuts", "18–25g protein")
        allowed("nuts") -> AdaptiveMeal("Snack", "Fruit · nuts · protein drink", "20–25g protein")
        else -> AdaptiveMeal("Snack", "Fruit · rice cakes · protein drink", "20–25g protein")
    }
    return listOf(breakfast, lunch, dinner, snack)
}

@Composable
fun AdaptiveMealList(vm: CoachViewModel) {
    val profile by vm.nutritionProfile.collectAsState()
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("ADAPTED TO YOUR FOOD PROFILE", color = CoachBlue, fontWeight = FontWeight.Black, fontSize = 12.sp, letterSpacing = 1.5.sp)
        buildMeals(profile).forEach { meal ->
            PremiumCard {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(meal.title, color = CoachText, fontWeight = FontWeight.Black, fontSize = 19.sp)
                        Text(meal.detail, color = CoachMuted, fontSize = 15.sp)
                    }
                    Text(meal.protein, color = CoachLime, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
        Text("Meal suggestions are planning aids, not medical nutrition advice.", color = CoachMuted, fontSize = 10.sp)
    }
}

@Composable
fun WeekPlanBlock(vm: CoachViewModel, onExercise: (String) -> Unit) {
    val week by vm.weekPlan.collectAsState()
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("YOUR WEEK · WHAT + WHEN", color = CoachBlue, fontWeight = FontWeight.Black, fontSize = 12.sp, letterSpacing = 1.8.sp)
        week.forEachIndexed { index, day ->
            PremiumCard(onClick = { day.exerciseIds.firstOrNull()?.let(onExercise) }) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Box(Modifier.size(56.dp).background(if (day.enabled) CoachCard2 else CoachBgDeep, RoundedCornerShape(16.dp)), contentAlignment = Alignment.Center) {
                        Text(day.day, color = if (day.enabled) CoachBlue else CoachMuted, fontWeight = FontWeight.Black)
                    }
                    Column(Modifier.weight(1f)) {
                        Text(day.title, color = CoachText, fontSize = 18.sp, fontWeight = FontWeight.Black)
                        Text(if (day.enabled) "${day.time} · ${day.exerciseIds.size} exercises" else "Recovery / no scheduled workout", color = CoachMuted, fontSize = 12.sp)
                        if (day.exerciseIds.isNotEmpty()) Text(day.exerciseIds.take(4).mapNotNull { ExerciseCatalog.find(it)?.name }.joinToString(" · "), color = CoachMuted, fontSize = 10.sp)
                    }
                    Text(if (day.exerciseIds.isNotEmpty()) "›" else "—", color = CoachBlue, fontSize = 26.sp)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    MiniAction("TIME") { vm.cycleWeekTime(index) }
                    MiniAction(if (day.enabled) "ACTIVE" else "REST", accent = if (day.enabled) CoachLime else CoachMuted) { vm.toggleWeekDay(index) }
                    MiniAction("PLAN") { vm.cycleWeekProgram(index) }
                }
            }
        }
        Text("TIME cycles through common slots. PLAN cycles Lower → Upper → Full Body → Running → Recovery. All changes are saved.", color = CoachMuted, fontSize = 10.sp)
    }
}
