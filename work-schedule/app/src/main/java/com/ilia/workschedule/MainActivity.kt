@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.ilia.workschedule

import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Analytics
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.ChevronLeft
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.Share
import androidx.compose.material.icons.outlined.Work
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.util.Locale

private val Bronze = Color(0xFFD6A85C)
private val Background = Color(0xFF171A20)
private val Panel = Color(0xFF242830)
private val Panel2 = Color(0xFF30343C)
private val TextPrimary = Color(0xFFF5F3EF)
private val TextMuted = Color(0xFF9EA3AD)

private val TemplatePalette = listOf(
    0xFFFFB6B9.toInt(), 0xFFFFC0B5.toInt(), 0xFFFFBE9F.toInt(), 0xFFFFE49D.toInt(),
    0xFFC6F5A5.toInt(), 0xFFB5F2BA.toInt(), 0xFFB9DFF8.toInt(), 0xFFD5C2FF.toInt(),
    0xFFFFB7EA.toInt(), 0xFFD6A85C.toInt()
)

data class ShiftTemplate(
    val id: Long = System.currentTimeMillis(),
    val name: String,
    val colorArgb: Int = TemplatePalette.first(),
    val imageUri: String = "",
    val note: String = ""
)

data class ShiftAssignment(val date: String, val templateId: Long)

private class ScheduleStore(private val context: Context) {
    private val prefs = context.getSharedPreferences("work_schedule_beta", Context.MODE_PRIVATE)

    fun jobName(): String = prefs.getString("job", "Main Job") ?: "Main Job"
    fun setJobName(value: String) = prefs.edit().putString("job", value).apply()

    fun loadTemplates(): List<ShiftTemplate> {
        migrateLegacyIfNeeded()
        val raw = prefs.getString("templates_v2", "[]") ?: "[]"
        val a = JSONArray(raw)
        return (0 until a.length()).map { i ->
            val o = a.getJSONObject(i)
            ShiftTemplate(
                id = o.optLong("id"),
                name = o.optString("name", "Shift"),
                colorArgb = o.optInt("color", TemplatePalette[i % TemplatePalette.size]),
                imageUri = o.optString("image", ""),
                note = o.optString("note", "")
            )
        }
    }

    fun saveTemplates(items: List<ShiftTemplate>) {
        val a = JSONArray()
        items.forEach { t ->
            a.put(JSONObject().apply {
                put("id", t.id); put("name", t.name); put("color", t.colorArgb)
                put("image", t.imageUri); put("note", t.note)
            })
        }
        prefs.edit().putString("templates_v2", a.toString()).apply()
    }

    fun loadAssignments(): List<ShiftAssignment> {
        migrateLegacyIfNeeded()
        val raw = prefs.getString("assignments_v2", "[]") ?: "[]"
        val a = JSONArray(raw)
        return (0 until a.length()).map { i ->
            val o = a.getJSONObject(i)
            ShiftAssignment(o.optString("date"), o.optLong("templateId"))
        }.filter { it.date.isNotBlank() }
    }

    fun saveAssignments(items: List<ShiftAssignment>) {
        val a = JSONArray()
        items.distinctBy { it.date }.forEach { x ->
            a.put(JSONObject().apply { put("date", x.date); put("templateId", x.templateId) })
        }
        prefs.edit().putString("assignments_v2", a.toString()).apply()
    }

    private fun migrateLegacyIfNeeded() {
        if (prefs.contains("templates_v2") || prefs.getBoolean("v2_migrated", false)) return
        val raw = prefs.getString("entries", "[]") ?: "[]"
        val legacy = runCatching { JSONArray(raw) }.getOrElse { JSONArray() }
        if (legacy.length() == 0) {
            saveTemplates(emptyList()); saveAssignments(emptyList())
            prefs.edit().putBoolean("v2_migrated", true).apply(); return
        }
        val labels = linkedMapOf<String, Long>()
        val templates = mutableListOf<ShiftTemplate>()
        val assignments = mutableListOf<ShiftAssignment>()
        for (i in 0 until legacy.length()) {
            val o = legacy.getJSONObject(i)
            val kind = o.optString("kind", "SHIFT")
            val label = if (kind == "SHIFT") o.optString("type", "Shift") else o.optString("title", "Personal")
            val templateId = labels.getOrPut(label) {
                val id = System.currentTimeMillis() + i
                templates += ShiftTemplate(
                    id = id,
                    name = label,
                    colorArgb = TemplatePalette[templates.size % TemplatePalette.size],
                    note = o.optString("location", "")
                )
                id
            }
            val date = o.optString("date", "")
            if (date.isNotBlank()) assignments += ShiftAssignment(date, templateId)
        }
        saveTemplates(templates); saveAssignments(assignments)
        prefs.edit().putBoolean("v2_migrated", true).apply()
    }
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { AppTheme { WorkScheduleApp() } }
    }
}

@Composable
private fun AppTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Bronze,
            background = Background,
            surface = Panel,
            onBackground = TextPrimary,
            onSurface = TextPrimary
        ),
        content = content
    )
}

private enum class MainTab { CALENDAR, SHIFTS, ANALYTICS, SETTINGS }
private sealed interface Route {
    data object Main : Route
    data class TemplateEditor(val templateId: Long? = null) : Route
}

@Composable
private fun WorkScheduleApp() {
    val context = LocalContext.current
    val store = remember { ScheduleStore(context) }
    var templates by remember { mutableStateOf(store.loadTemplates()) }
    var assignments by remember { mutableStateOf(store.loadAssignments()) }
    var tab by remember { mutableStateOf(MainTab.CALENDAR) }
    var route: Route by remember { mutableStateOf(Route.Main) }
    var month by remember { mutableStateOf(YearMonth.now()) }
    var paintMode by remember { mutableStateOf(false) }
    var selectedTemplateId by remember { mutableStateOf<Long?>(templates.firstOrNull()?.id) }

    fun saveTemplates(newItems: List<ShiftTemplate>) {
        templates = newItems
        store.saveTemplates(newItems)
        if (selectedTemplateId !in newItems.map { it.id }) selectedTemplateId = newItems.firstOrNull()?.id
    }
    fun saveAssignments(newItems: List<ShiftAssignment>) {
        assignments = newItems.distinctBy { it.date }
        store.saveAssignments(assignments)
    }
    fun paintDate(date: LocalDate) {
        val templateId = selectedTemplateId ?: return
        val key = date.toString()
        val existing = assignments.firstOrNull { it.date == key }
        val updated = when {
            existing?.templateId == templateId -> assignments.filterNot { it.date == key }
            else -> assignments.filterNot { it.date == key } + ShiftAssignment(key, templateId)
        }
        saveAssignments(updated)
        month = YearMonth.from(date)
    }

    BackHandler(enabled = route !is Route.Main) { route = Route.Main }

    when (val current = route) {
        Route.Main -> Scaffold(
            containerColor = Background,
            bottomBar = { BottomNavigation(tab) { tab = it } }
        ) { padding ->
            Box(Modifier.fillMaxSize().padding(padding).statusBarsPadding()) {
                when (tab) {
                    MainTab.CALENDAR -> CalendarScreen(
                        jobName = store.jobName(),
                        month = month,
                        templates = templates,
                        assignments = assignments,
                        paintMode = paintMode,
                        selectedTemplateId = selectedTemplateId,
                        onMonth = { month = it },
                        onTogglePaint = {
                            if (templates.isEmpty()) route = Route.TemplateEditor()
                            else paintMode = !paintMode
                        },
                        onSelectTemplate = { id -> selectedTemplateId = id; paintMode = true },
                        onDate = { date -> if (paintMode) paintDate(date) },
                        onCreateTemplate = { route = Route.TemplateEditor() },
                        onManageTemplates = { tab = MainTab.SHIFTS },
                        onShare = { shareMonth(context, month, templates, assignments) }
                    )
                    MainTab.SHIFTS -> TemplateListScreen(
                        templates = templates,
                        onCreate = { route = Route.TemplateEditor() },
                        onOpen = { route = Route.TemplateEditor(it.id) }
                    )
                    MainTab.ANALYTICS -> AnalyticsScreen(month, templates, assignments, onMonth = { month = it })
                    MainTab.SETTINGS -> SettingsScreen(store, templates, assignments)
                }
            }
        }
        is Route.TemplateEditor -> {
            val existing = current.templateId?.let { id -> templates.firstOrNull { it.id == id } }
            TemplateEditorScreen(
                existing = existing,
                onBack = { route = Route.Main },
                onSave = { template ->
                    val updated = if (existing == null) templates + template else templates.map { if (it.id == template.id) template else it }
                    saveTemplates(updated)
                    selectedTemplateId = template.id
                    paintMode = true
                    tab = MainTab.CALENDAR
                    route = Route.Main
                },
                onDelete = if (existing == null) null else ({
                    saveTemplates(templates.filterNot { it.id == existing.id })
                    saveAssignments(assignments.filterNot { it.templateId == existing.id })
                    route = Route.Main
                })
            )
        }
    }
}

@Composable
private fun BottomNavigation(tab: MainTab, onTab: (MainTab) -> Unit) {
    NavigationBar(containerColor = Background, modifier = Modifier.navigationBarsPadding()) {
        val items = listOf(
            MainTab.CALENDAR to Icons.Outlined.Home,
            MainTab.SHIFTS to Icons.Outlined.Work,
            MainTab.ANALYTICS to Icons.Outlined.Analytics,
            MainTab.SETTINGS to Icons.Outlined.Settings
        )
        items.forEach { (item, icon) ->
            NavigationBarItem(
                selected = item == tab,
                onClick = { onTab(item) },
                icon = { Icon(icon, null) },
                label = { Text(item.name.lowercase().replaceFirstChar { it.uppercase() }, fontSize = 11.sp) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = Bronze, selectedTextColor = Bronze, indicatorColor = Color.Transparent,
                    unselectedIconColor = TextMuted, unselectedTextColor = TextMuted
                )
            )
        }
    }
}

@Composable
private fun CalendarScreen(
    jobName: String,
    month: YearMonth,
    templates: List<ShiftTemplate>,
    assignments: List<ShiftAssignment>,
    paintMode: Boolean,
    selectedTemplateId: Long?,
    onMonth: (YearMonth) -> Unit,
    onTogglePaint: () -> Unit,
    onSelectTemplate: (Long) -> Unit,
    onDate: (LocalDate) -> Unit,
    onCreateTemplate: () -> Unit,
    onManageTemplates: () -> Unit,
    onShare: () -> Unit
) {
    var drag by remember { mutableStateOf(0f) }
    val fmt = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.getDefault())
    val templateMap = templates.associateBy { it.id }
    LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 20.dp)) {
        item {
            Row(Modifier.fillMaxWidth().padding(top = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(jobName + " ⌄", fontSize = 24.sp)
                Spacer(Modifier.weight(1f))
                IconButton(onClick = onShare) { Icon(Icons.Outlined.Share, "Share") }
                IconButton(onClick = onManageTemplates) { Icon(Icons.Outlined.Settings, "Shift templates") }
            }
            Spacer(Modifier.height(22.dp))
            Card(colors = CardDefaults.cardColors(containerColor = Panel2), shape = RoundedCornerShape(24.dp)) {
                Row(Modifier.fillMaxWidth().padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(fmt.format(month.atDay(1)), fontSize = 30.sp, fontWeight = FontWeight.Medium)
                    Spacer(Modifier.weight(1f))
                    IconButton(
                        onClick = onTogglePaint,
                        modifier = Modifier.size(58.dp).background(TextPrimary, CircleShape).border(2.dp, Background, CircleShape)
                    ) {
                        Icon(if (paintMode) Icons.Outlined.Check else Icons.Outlined.Add, null, tint = Background, modifier = Modifier.size(30.dp))
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth()) {
                listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun").forEachIndexed { i, day ->
                    Text(day, color = if (i > 4) TextMuted else TextPrimary, textAlign = TextAlign.Center, modifier = Modifier.weight(1f))
                }
            }
            Spacer(Modifier.height(10.dp))
            Card(
                colors = CardDefaults.cardColors(containerColor = Panel2),
                shape = RoundedCornerShape(24.dp),
                modifier = Modifier.fillMaxWidth().pointerInput(month) {
                    detectHorizontalDragGestures(
                        onHorizontalDrag = { _, amount -> drag += amount },
                        onDragEnd = {
                            if (drag > 80f) onMonth(month.minusMonths(1))
                            if (drag < -80f) onMonth(month.plusMonths(1))
                            drag = 0f
                        }
                    )
                }
            ) {
                MonthGrid(month, assignments, templateMap, paintMode, onDate)
            }
            Spacer(Modifier.height(24.dp))
            if (paintMode) {
                Text(
                    "Select a job type, then tap dates. Tap the same date again to remove it.",
                    color = TextMuted, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp)
                )
                Spacer(Modifier.height(18.dp))
            }
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("Job types", fontSize = 20.sp, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.weight(1f))
                TextButton(onClick = onManageTemplates) { Text("Manage") }
            }
            if (templates.isEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth().clickable(onClick = onCreateTemplate),
                    colors = CardDefaults.cardColors(containerColor = Panel2), shape = RoundedCornerShape(20.dp)
                ) {
                    Row(Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.size(54.dp).background(TextPrimary, CircleShape), contentAlignment = Alignment.Center) {
                            Icon(Icons.Outlined.Add, null, tint = Background)
                        }
                        Spacer(Modifier.width(14.dp))
                        Column { Text("Create your first shift", fontSize = 18.sp, fontWeight = FontWeight.SemiBold); Text("Add your own photo, name and color", color = TextMuted, fontSize = 13.sp) }
                    }
                }
            } else {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(templates, key = { it.id }) { template ->
                        TemplateChoiceCard(
                            template = template,
                            selected = selectedTemplateId == template.id,
                            onClick = { onSelectTemplate(template.id) }
                        )
                    }
                    item { CreateTemplateTile(onCreateTemplate) }
                }
            }
            Spacer(Modifier.height(14.dp))
            OutlinedButton(onClick = onCreateTemplate, modifier = Modifier.fillMaxWidth().height(58.dp), shape = RoundedCornerShape(18.dp)) {
                Icon(Icons.Outlined.Add, null); Spacer(Modifier.width(8.dp)); Text("Create new shift")
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun MonthGrid(
    month: YearMonth,
    assignments: List<ShiftAssignment>,
    templates: Map<Long, ShiftTemplate>,
    paintMode: Boolean,
    onDate: (LocalDate) -> Unit
) {
    val first = month.atDay(1)
    val start = first.minusDays((first.dayOfWeek.value - 1).toLong())
    val byDate = assignments.associateBy { it.date }
    Column(Modifier.padding(10.dp)) {
        repeat(6) { row ->
            Row(Modifier.fillMaxWidth()) {
                repeat(7) { col ->
                    val date = start.plusDays((row * 7 + col).toLong())
                    val inMonth = YearMonth.from(date) == month
                    val assignment = byDate[date.toString()]
                    val template = assignment?.let { templates[it.templateId] }
                    CalendarCell(date, inMonth, template, paintMode, Modifier.weight(1f)) { onDate(date) }
                }
            }
        }
    }
}

@Composable
private fun CalendarCell(
    date: LocalDate,
    inMonth: Boolean,
    template: ShiftTemplate?,
    paintMode: Boolean,
    modifier: Modifier,
    onClick: () -> Unit
) {
    val today = date == LocalDate.now()
    val bg = template?.let { Color(it.colorArgb) } ?: Color.Transparent
    val textColor = if (template != null) Color(0xFF1A1A1A) else if (inMonth) TextPrimary else TextMuted.copy(alpha = .65f)
    Box(
        modifier = modifier.padding(2.dp).height(55.dp)
            .clip(RoundedCornerShape(9.dp))
            .background(bg)
            .then(if (today) Modifier.border(1.5.dp, if (template == null) Bronze else Background, RoundedCornerShape(9.dp)) else Modifier)
            .clickable(enabled = paintMode, onClick = onClick)
    ) {
        Text(date.dayOfMonth.toString(), color = textColor, fontSize = 14.sp, modifier = Modifier.padding(6.dp))
        if (template != null) {
            Row(
                modifier = Modifier.align(Alignment.BottomStart).fillMaxWidth().padding(horizontal = 4.dp, vertical = 5.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (template.imageUri.isNotBlank()) {
                    TemplatePhoto(template.imageUri, template.colorArgb, 19.dp)
                    Spacer(Modifier.width(3.dp))
                }
                Text(template.name, color = Color(0xFF191919), fontSize = 8.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

@Composable
private fun TemplateChoiceCard(template: ShiftTemplate, selected: Boolean, onClick: () -> Unit) {
    Card(
        modifier = Modifier.width(158.dp).height(92.dp).then(if (selected) Modifier.border(2.dp, TextPrimary, RoundedCornerShape(18.dp)) else Modifier).clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = Color(template.colorArgb)), shape = RoundedCornerShape(18.dp)
    ) {
        Row(Modifier.fillMaxSize().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            TemplatePhoto(template.imageUri, template.colorArgb, 48.dp)
            Spacer(Modifier.width(10.dp))
            Column { Text(template.name, color = Color(0xFF171717), fontWeight = FontWeight.SemiBold, maxLines = 2, overflow = TextOverflow.Ellipsis); if (template.note.isNotBlank()) Text(template.note, color = Color(0xFF4F4F4F), fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis) }
        }
    }
}

@Composable
private fun CreateTemplateTile(onCreate: () -> Unit) {
    Card(
        modifier = Modifier.width(132.dp).height(92.dp).clickable(onClick = onCreate),
        colors = CardDefaults.cardColors(containerColor = Panel2), shape = RoundedCornerShape(18.dp)
    ) {
        Column(Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Box(Modifier.size(34.dp).background(TextPrimary, CircleShape), contentAlignment = Alignment.Center) { Icon(Icons.Outlined.Add, null, tint = Background) }
            Spacer(Modifier.height(5.dp)); Text("Create new", fontSize = 13.sp)
        }
    }
}

@Composable
private fun TemplateListScreen(templates: List<ShiftTemplate>, onCreate: () -> Unit, onOpen: (ShiftTemplate) -> Unit) {
    LazyColumn(Modifier.fillMaxSize().padding(horizontal = 20.dp)) {
        item {
            Row(Modifier.fillMaxWidth().padding(top = 18.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("Shift templates", fontSize = 30.sp, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.weight(1f))
            }
            Spacer(Modifier.height(18.dp))
            Card(
                modifier = Modifier.fillMaxWidth().clickable(onClick = onCreate),
                colors = CardDefaults.cardColors(containerColor = Panel2), shape = RoundedCornerShape(24.dp)
            ) {
                Row(Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(62.dp).background(TextPrimary, CircleShape).border(2.dp, Background, CircleShape), contentAlignment = Alignment.Center) { Icon(Icons.Outlined.Add, null, tint = Background, modifier = Modifier.size(28.dp)) }
                    Spacer(Modifier.width(16.dp)); Text("Create new", fontSize = 23.sp, fontWeight = FontWeight.Medium)
                }
            }
            Spacer(Modifier.height(20.dp))
        }
        items(templates, key = { it.id }) { template ->
            Card(
                modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp).clickable { onOpen(template) },
                colors = CardDefaults.cardColors(containerColor = Panel2), shape = RoundedCornerShape(22.dp)
            ) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    TemplatePhoto(template.imageUri, template.colorArgb, 58.dp)
                    Spacer(Modifier.width(16.dp))
                    Column(Modifier.weight(1f)) {
                        Text(template.name, fontSize = 21.sp, fontWeight = FontWeight.Medium)
                        if (template.note.isNotBlank()) Text(template.note, color = TextMuted, fontSize = 13.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                    }
                    Icon(Icons.Outlined.Edit, null, tint = TextMuted)
                }
            }
        }
        item { Spacer(Modifier.height(30.dp)) }
    }
}

@Composable
private fun TemplateEditorScreen(
    existing: ShiftTemplate?,
    onBack: () -> Unit,
    onSave: (ShiftTemplate) -> Unit,
    onDelete: (() -> Unit)?
) {
    val context = LocalContext.current
    var name by remember(existing?.id) { mutableStateOf(existing?.name ?: "") }
    var imageUri by remember(existing?.id) { mutableStateOf(existing?.imageUri ?: "") }
    var colorArgb by remember(existing?.id) { mutableStateOf(existing?.colorArgb ?: TemplatePalette[6]) }
    var note by remember(existing?.id) { mutableStateOf(existing?.note ?: "") }
    var confirmDelete by remember { mutableStateOf(false) }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? ->
        uri?.let {
            runCatching { context.contentResolver.takePersistableUriPermission(it, Intent.FLAG_GRANT_READ_URI_PERMISSION) }
            imageUri = it.toString()
        }
    }
    val template = ShiftTemplate(existing?.id ?: System.currentTimeMillis(), name.trim(), colorArgb, imageUri, note.trim())

    Column(Modifier.fillMaxSize().background(Background).statusBarsPadding().padding(horizontal = 20.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            TextButton(onClick = onBack) { Text("Back", color = TextPrimary) }
            Text(if (existing == null) "New shift" else "Edit shift", modifier = Modifier.weight(1f), textAlign = TextAlign.Center, fontSize = 22.sp, fontWeight = FontWeight.SemiBold)
            TextButton(onClick = { onSave(template) }, enabled = name.isNotBlank()) { Text("Save", color = Bronze, fontWeight = FontWeight.Bold) }
        }
        LazyColumn(Modifier.weight(1f)) {
            item {
                Spacer(Modifier.height(18.dp))
                Text("Photo / logo", color = TextMuted, fontSize = 13.sp)
                Spacer(Modifier.height(10.dp))
                Card(colors = CardDefaults.cardColors(containerColor = Panel2), shape = RoundedCornerShape(24.dp)) {
                    Column(Modifier.fillMaxWidth().padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        TemplatePhoto(imageUri, colorArgb, 112.dp)
                        Spacer(Modifier.height(14.dp))
                        Button(onClick = { picker.launch(arrayOf("image/*")) }, colors = ButtonDefaults.buttonColors(containerColor = Bronze, contentColor = Background)) { Text(if (imageUri.isBlank()) "Upload your own picture" else "Change picture") }
                        if (imageUri.isNotBlank()) TextButton(onClick = { imageUri = "" }) { Text("Remove picture") }
                    }
                }
                Spacer(Modifier.height(18.dp))
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Job type / shift name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(22.dp))
                Text("Calendar color", fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(10.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(TemplatePalette) { argb ->
                        val selected = argb == colorArgb
                        Box(
                            Modifier.size(52.dp).background(Color(argb), CircleShape)
                                .then(if (selected) Modifier.border(3.dp, TextPrimary, CircleShape) else Modifier)
                                .clickable { colorArgb = argb }
                        )
                    }
                }
                Spacer(Modifier.height(22.dp))
                OutlinedTextField(value = note, onValueChange = { note = it }, label = { Text("Note (optional)") }, minLines = 4, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(18.dp))
                Text("Duration and wage are intentionally not part of this shift template.", color = TextMuted, fontSize = 12.sp)
                if (onDelete != null) {
                    Spacer(Modifier.height(22.dp))
                    OutlinedButton(onClick = { confirmDelete = true }, modifier = Modifier.fillMaxWidth().height(54.dp)) {
                        Icon(Icons.Outlined.Delete, null); Spacer(Modifier.width(8.dp)); Text("Delete shift template")
                    }
                }
                Spacer(Modifier.height(30.dp))
            }
        }
    }

    if (confirmDelete) {
        AlertDialog(
            onDismissRequest = { confirmDelete = false },
            confirmButton = { TextButton(onClick = { confirmDelete = false; onDelete?.invoke() }) { Text("Delete") } },
            dismissButton = { TextButton(onClick = { confirmDelete = false }) { Text("Cancel") } },
            title = { Text("Delete shift template?") },
            text = { Text("Dates using this template will also be cleared.") }
        )
    }
}

@Composable
private fun TemplatePhoto(uri: String, colorArgb: Int, size: Dp) {
    val context = LocalContext.current
    val bitmap = remember(uri) {
        if (uri.isBlank()) null else runCatching {
            context.contentResolver.openInputStream(Uri.parse(uri))?.use { BitmapFactory.decodeStream(it) }?.asImageBitmap()
        }.getOrNull()
    }
    Box(
        modifier = Modifier.size(size).clip(CircleShape).background(Color(colorArgb)),
        contentAlignment = Alignment.Center
    ) {
        if (bitmap != null) Image(bitmap = bitmap, contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        else Text("+", color = Color(0xFF262626), fontSize = (size.value * .34f).sp, fontWeight = FontWeight.Light)
    }
}

@Composable
private fun AnalyticsScreen(
    month: YearMonth,
    templates: List<ShiftTemplate>,
    assignments: List<ShiftAssignment>,
    onMonth: (YearMonth) -> Unit
) {
    val monthAssignments = assignments.filter { runCatching { YearMonth.from(LocalDate.parse(it.date)) == month }.getOrDefault(false) }
    val counts = monthAssignments.groupingBy { it.templateId }.eachCount().toList().sortedByDescending { it.second }
    val mostUsed = counts.firstOrNull()?.first?.let { id -> templates.firstOrNull { it.id == id }?.name } ?: "—"
    val fmt = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.getDefault())
    LazyColumn(Modifier.fillMaxSize().padding(horizontal = 20.dp)) {
        item {
            Text("Analytics", fontSize = 30.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 18.dp))
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { onMonth(month.minusMonths(1)) }) { Icon(Icons.Outlined.ChevronLeft, null) }
                Text(fmt.format(month.atDay(1)), modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                IconButton(onClick = { onMonth(month.plusMonths(1)) }) { Icon(Icons.Outlined.ChevronRight, null) }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatCard("Scheduled days", monthAssignments.size.toString(), Modifier.weight(1f))
                StatCard("Job types used", counts.size.toString(), Modifier.weight(1f))
            }
            Spacer(Modifier.height(10.dp))
            StatCard("Most used", mostUsed, Modifier.fillMaxWidth())
            Spacer(Modifier.height(24.dp))
            Text("Job type breakdown", fontSize = 19.sp, fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(8.dp))
        }
        items(counts, key = { it.first }) { (id, count) ->
            templates.firstOrNull { it.id == id }?.let { t ->
                Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    TemplatePhoto(t.imageUri, t.colorArgb, 42.dp)
                    Spacer(Modifier.width(12.dp)); Text(t.name, modifier = Modifier.weight(1f)); Text(count.toString(), color = TextMuted)
                }
            }
        }
    }
}

@Composable
private fun StatCard(label: String, value: String, modifier: Modifier) {
    Card(modifier = modifier, colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(16.dp)) {
        Column(Modifier.padding(15.dp)) { Text(label, color = TextMuted, fontSize = 12.sp); Text(value, fontSize = 22.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis) }
    }
}

@Composable
private fun SettingsScreen(store: ScheduleStore, templates: List<ShiftTemplate>, assignments: List<ShiftAssignment>) {
    val context = LocalContext.current
    var job by remember { mutableStateOf(store.jobName()) }
    var editJob by remember { mutableStateOf(false) }
    var exportText by remember { mutableStateOf("") }
    val exportLauncher = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("text/csv")) { uri: Uri? ->
        uri?.let { context.contentResolver.openOutputStream(it)?.use { stream -> stream.write(exportText.toByteArray()) } }
    }
    Column(Modifier.fillMaxSize().padding(horizontal = 20.dp)) {
        Text("Settings", fontSize = 30.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 18.dp))
        Spacer(Modifier.height(18.dp))
        Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(18.dp)) {
            SettingsRow("Job name", job) { editJob = true }
            HorizontalDivider(color = Color.White.copy(alpha = .06f))
            SettingsRow("Shift templates", templates.size.toString()) { }
            HorizontalDivider(color = Color.White.copy(alpha = .06f))
            SettingsRow("Backup & Export", "CSV") {
                exportText = exportCsv(templates, assignments)
                exportLauncher.launch("work-schedule.csv")
            }
            HorizontalDivider(color = Color.White.copy(alpha = .06f))
            SettingsRow("Appearance", "Dark") { }
            HorizontalDivider(color = Color.White.copy(alpha = .06f))
            SettingsRow("About", "Beta 0.2.0") { }
        }
    }
    if (editJob) {
        var value by remember(job) { mutableStateOf(job) }
        AlertDialog(
            onDismissRequest = { editJob = false },
            confirmButton = { TextButton(onClick = { job = value.trim().ifBlank { "Main Job" }; store.setJobName(job); editJob = false }) { Text("Save") } },
            dismissButton = { TextButton(onClick = { editJob = false }) { Text("Cancel") } },
            title = { Text("Job name") },
            text = { OutlinedTextField(value = value, onValueChange = { value = it }, singleLine = true) }
        )
    }
}

@Composable
private fun SettingsRow(label: String, value: String, onClick: () -> Unit) {
    Row(Modifier.fillMaxWidth().clickable(onClick = onClick).padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label, modifier = Modifier.weight(1f)); Text(value, color = TextMuted, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Spacer(Modifier.width(5.dp)); Icon(Icons.Outlined.ChevronRight, null, tint = TextMuted, modifier = Modifier.size(18.dp))
    }
}

private fun shareMonth(context: Context, month: YearMonth, templates: List<ShiftTemplate>, assignments: List<ShiftAssignment>) {
    val map = templates.associateBy { it.id }
    val text = buildString {
        appendLine(month.atDay(1).format(DateTimeFormatter.ofPattern("MMMM yyyy")))
        assignments.filter { runCatching { YearMonth.from(LocalDate.parse(it.date)) == month }.getOrDefault(false) }
            .sortedBy { it.date }
            .forEach { a -> appendLine("${a.date} • ${map[a.templateId]?.name ?: "Shift"}") }
    }
    context.startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text), "Share schedule"))
}

private fun csv(value: String): String = "\"" + value.replace("\"", "\"\"") + "\""
private fun exportCsv(templates: List<ShiftTemplate>, assignments: List<ShiftAssignment>): String {
    val map = templates.associateBy { it.id }
    return buildString {
        appendLine("date,shift")
        assignments.sortedBy { it.date }.forEach { a -> appendLine("${csv(a.date)},${csv(map[a.templateId]?.name ?: "Shift")}") }
    }
}
