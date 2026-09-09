@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.ilia.workschedule

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.TimePickerDialog
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.YearMonth
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.abs

private val Bronze = Color(0xFFE3B45F)
private val BronzeSoft = Color(0xFF9B7134)
private val Background = Color(0xFF0C1115)
private val Panel = Color(0xFF141B20)
private val Panel2 = Color(0xFF1B2329)
private val Panel3 = Color(0xFF232D34)
private val TextPrimary = Color(0xFFF7F4EE)
private val TextMuted = Color(0xFF8D969E)
private val Divider = Color.White.copy(alpha = .07f)

private val TemplatePalette = listOf(
    0xFFE3B45F.toInt(), 0xFF8BBEE8.toInt(), 0xFFD48CCB.toInt(), 0xFF7FC7A4.toInt(),
    0xFFED967F.toInt(), 0xFF9A8BE8.toInt(), 0xFF89D8D4.toInt(), 0xFFE6C985.toInt(),
    0xFFC68DA1.toInt(), 0xFFA7C879.toInt()
)

private data class ShiftTemplate(
    val id: Long = System.currentTimeMillis(),
    val name: String,
    val colorArgb: Int = TemplatePalette.first(),
    val imageUri: String = "",
    val note: String = "",
    val startMinutes: Int = 18 * 60,
    val endMinutes: Int = 2 * 60,
    val location: String = "",
    val reminderMinutes: Int = 60,
    val category: String = "Work"
)

private data class ShiftAssignment(val date: String, val templateId: Long)

private class ScheduleStore(private val context: Context) {
    private val prefs = context.getSharedPreferences("work_schedule_beta", Context.MODE_PRIVATE)

    fun jobName(): String = prefs.getString("job", "Main Job") ?: "Main Job"
    fun setJobName(value: String) = prefs.edit().putString("job", value).apply()
    fun jobLogo(): String = prefs.getString("job_logo", "") ?: ""
    fun setJobLogo(value: String) = prefs.edit().putString("job_logo", value).apply()
    fun notificationsEnabled(): Boolean = prefs.getBoolean("notifications_v3", true)
    fun setNotificationsEnabled(value: Boolean) = prefs.edit().putBoolean("notifications_v3", value).apply()

    fun loadTemplates(): List<ShiftTemplate> {
        val rawV3 = prefs.getString("templates_v3", null)
        if (rawV3 != null) return decodeTemplates(rawV3)
        val old = prefs.getString("templates_v2", "[]") ?: "[]"
        val migrated = decodeLegacyTemplates(old)
        saveTemplates(migrated)
        return migrated
    }

    private fun decodeTemplates(raw: String): List<ShiftTemplate> {
        val a = runCatching { JSONArray(raw) }.getOrElse { JSONArray() }
        return (0 until a.length()).map { i ->
            val o = a.getJSONObject(i)
            ShiftTemplate(
                id = o.optLong("id", System.currentTimeMillis() + i),
                name = o.optString("name", "Shift"),
                colorArgb = o.optInt("color", TemplatePalette[i % TemplatePalette.size]),
                imageUri = o.optString("image", ""),
                note = o.optString("note", ""),
                startMinutes = o.optInt("start", 18 * 60),
                endMinutes = o.optInt("end", 2 * 60),
                location = o.optString("location", ""),
                reminderMinutes = o.optInt("reminder", 60),
                category = o.optString("category", "Work")
            )
        }
    }

    private fun decodeLegacyTemplates(raw: String): List<ShiftTemplate> {
        val a = runCatching { JSONArray(raw) }.getOrElse { JSONArray() }
        return (0 until a.length()).map { i ->
            val o = a.getJSONObject(i)
            ShiftTemplate(
                id = o.optLong("id", System.currentTimeMillis() + i),
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
                put("image", t.imageUri); put("note", t.note); put("start", t.startMinutes)
                put("end", t.endMinutes); put("location", t.location); put("reminder", t.reminderMinutes)
                put("category", t.category)
            })
        }
        prefs.edit().putString("templates_v3", a.toString()).apply()
    }

    fun loadAssignments(): List<ShiftAssignment> {
        val raw = prefs.getString("assignments_v2", "[]") ?: "[]"
        val a = runCatching { JSONArray(raw) }.getOrElse { JSONArray() }
        return (0 until a.length()).mapNotNull { i ->
            val o = a.getJSONObject(i)
            val date = o.optString("date", "")
            if (date.isBlank()) null else ShiftAssignment(date, o.optLong("templateId"))
        }.distinctBy { it.date }
    }

    fun saveAssignments(items: List<ShiftAssignment>) {
        val a = JSONArray()
        items.distinctBy { it.date }.forEach { x ->
            a.put(JSONObject().apply { put("date", x.date); put("templateId", x.templateId) })
        }
        prefs.edit().putString("assignments_v2", a.toString()).apply()
    }
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        createReminderChannel(this)
        setContent { AppTheme { WorkScheduleApp() } }
    }
}

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val title = intent.getStringExtra("title") ?: "Upcoming shift"
        val text = intent.getStringExtra("text") ?: "Your shift is coming up"
        val id = intent.getIntExtra("notification_id", 1)
        val openIntent = Intent(context, MainActivity::class.java)
        val contentIntent = PendingIntent.getActivity(
            context, id, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val builder = NotificationCompat.Builder(context, "work_schedule_reminders")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setContentIntent(contentIntent)
        val imageUri = intent.getStringExtra("image_uri").orEmpty()
        if (imageUri.isNotBlank()) {
            runCatching {
                context.contentResolver.openInputStream(Uri.parse(imageUri))?.use { BitmapFactory.decodeStream(it) }
            }.getOrNull()?.let { builder.setLargeIcon(it) }
        }
        if (Build.VERSION.SDK_INT < 33 || ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
            (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).notify(id, builder.build())
        }
    }
}

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val store = ScheduleStore(context)
            if (store.notificationsEnabled()) scheduleAllReminders(context, store.loadTemplates(), store.loadAssignments())
        }
    }
}

private fun createReminderChannel(context: Context) {
    if (Build.VERSION.SDK_INT >= 26) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannel(
            NotificationChannel("work_schedule_reminders", "Shift reminders", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Upcoming work shift reminders"
            }
        )
    }
}

private fun reminderId(a: ShiftAssignment): Int = abs((a.date + "|" + a.templateId).hashCode()).coerceAtLeast(1)

private fun scheduleAllReminders(context: Context, templates: List<ShiftTemplate>, assignments: List<ShiftAssignment>) {
    val map = templates.associateBy { it.id }
    assignments.forEach { a -> map[a.templateId]?.let { scheduleReminder(context, a, it) } }
}

private fun cancelAllReminders(context: Context, assignments: List<ShiftAssignment>) {
    assignments.forEach { cancelReminder(context, it) }
}

private fun cancelReminder(context: Context, a: ShiftAssignment) {
    val intent = Intent(context, ReminderReceiver::class.java)
    val pending = PendingIntent.getBroadcast(
        context, reminderId(a), intent,
        PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
    )
    pending?.let { (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(it); it.cancel() }
}

private fun scheduleReminder(context: Context, a: ShiftAssignment, t: ShiftTemplate) {
    cancelReminder(context, a)
    if (t.reminderMinutes <= 0) return
    val date = runCatching { LocalDate.parse(a.date) }.getOrNull() ?: return
    val start = LocalDateTime.of(date, LocalTime.of(t.startMinutes / 60, t.startMinutes % 60))
    val trigger = start.minusMinutes(t.reminderMinutes.toLong()).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
    if (trigger <= System.currentTimeMillis()) return
    val whenLabel = when {
        t.reminderMinutes >= 24 * 60 -> "Tomorrow at ${formatMinutes(t.startMinutes)}"
        t.reminderMinutes >= 60 -> "Starts in ${t.reminderMinutes / 60}h at ${formatMinutes(t.startMinutes)}"
        else -> "Starts in ${t.reminderMinutes} min at ${formatMinutes(t.startMinutes)}"
    }
    val place = if (t.location.isBlank()) "" else " • ${t.location}"
    val intent = Intent(context, ReminderReceiver::class.java)
        .putExtra("title", t.name)
        .putExtra("text", whenLabel + place)
        .putExtra("notification_id", reminderId(a))
        .putExtra("image_uri", t.imageUri)
    val pending = PendingIntent.getBroadcast(
        context, reminderId(a), intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).setAndAllowWhileIdle(
        AlarmManager.RTC_WAKEUP, trigger, pending
    )
}

@Composable
private fun AppTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Bronze,
            secondary = BronzeSoft,
            background = Background,
            surface = Panel,
            surfaceVariant = Panel2,
            onBackground = TextPrimary,
            onSurface = TextPrimary
        ),
        content = content
    )
}

private enum class MainTab { CALENDAR, SHIFTS, ANALYTICS, SETTINGS }
private sealed interface Route {
    data object Main : Route
    data object TemplateLibrary : Route
    data class TemplateEditor(val templateId: Long? = null) : Route
}

@Composable
private fun WorkScheduleApp() {
    val context = LocalContext.current
    val store = remember { ScheduleStore(context) }
    var templates by remember { mutableStateOf(store.loadTemplates()) }
    var assignments by remember { mutableStateOf(store.loadAssignments()) }
    var notificationsEnabled by remember { mutableStateOf(store.notificationsEnabled()) }
    var tab by remember { mutableStateOf(MainTab.CALENDAR) }
    var route: Route by remember { mutableStateOf(Route.Main) }
    var month by remember { mutableStateOf(YearMonth.now()) }
    var paintMode by remember { mutableStateOf(false) }
    var selectedTemplateId by remember { mutableStateOf<Long?>(templates.firstOrNull()?.id) }
    var selectedDate by remember { mutableStateOf(LocalDate.now()) }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { }
    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }
    LaunchedEffect(templates, assignments, notificationsEnabled) {
        if (notificationsEnabled) scheduleAllReminders(context, templates, assignments)
        else cancelAllReminders(context, assignments)
    }

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
        val updated = if (existing?.templateId == templateId) assignments.filterNot { it.date == key }
        else assignments.filterNot { it.date == key } + ShiftAssignment(key, templateId)
        saveAssignments(updated)
        selectedDate = date
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
                        jobLogo = store.jobLogo(),
                        month = month,
                        selectedDate = selectedDate,
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
                        onDate = { date -> if (paintMode) paintDate(date) else selectedDate = date },
                        onCreateTemplate = { route = Route.TemplateEditor() },
                        onManageTemplates = { route = Route.TemplateLibrary },
                        onUpcoming = { tab = MainTab.SHIFTS },
                        onShare = { shareMonth(context, month, templates, assignments) }
                    )
                    MainTab.SHIFTS -> ShiftsScreen(
                        templates = templates,
                        assignments = assignments,
                        onManageTypes = { route = Route.TemplateLibrary },
                        onOpenTemplate = { route = Route.TemplateEditor(it.id) }
                    )
                    MainTab.ANALYTICS -> AnalyticsScreen(month, templates, assignments, onMonth = { month = it })
                    MainTab.SETTINGS -> SettingsScreen(
                        store = store,
                        templates = templates,
                        assignments = assignments,
                        notificationsEnabled = notificationsEnabled,
                        onNotifications = { enabled -> notificationsEnabled = enabled; store.setNotificationsEnabled(enabled) },
                        onManageTypes = { route = Route.TemplateLibrary }
                    )
                }
            }
        }
        Route.TemplateLibrary -> TemplateLibraryScreen(
            templates = templates,
            onBack = { route = Route.Main },
            onCreate = { route = Route.TemplateEditor() },
            onOpen = { route = Route.TemplateEditor(it.id) }
        )
        is Route.TemplateEditor -> {
            val existing = current.templateId?.let { id -> templates.firstOrNull { it.id == id } }
            TemplateEditorScreen(
                existing = existing,
                onBack = { route = Route.TemplateLibrary },
                onSave = { template ->
                    val updated = if (existing == null) templates + template else templates.map { if (it.id == template.id) template else it }
                    saveTemplates(updated)
                    selectedTemplateId = template.id
                    paintMode = true
                    route = Route.TemplateLibrary
                },
                onDelete = if (existing == null) null else ({
                    saveTemplates(templates.filterNot { it.id == existing.id })
                    saveAssignments(assignments.filterNot { it.templateId == existing.id })
                    route = Route.TemplateLibrary
                })
            )
        }
    }
}

@Composable
private fun BottomNavigation(tab: MainTab, onTab: (MainTab) -> Unit) {
    NavigationBar(containerColor = Background, modifier = Modifier.navigationBarsPadding()) {
        val items = listOf(
            MainTab.CALENDAR to Icons.Outlined.CalendarMonth,
            MainTab.SHIFTS to Icons.Outlined.Work,
            MainTab.ANALYTICS to Icons.Outlined.Analytics,
            MainTab.SETTINGS to Icons.Outlined.Settings
        )
        items.forEach { (item, icon) ->
            NavigationBarItem(
                selected = item == tab,
                onClick = { onTab(item) },
                icon = { Icon(icon, null) },
                label = { Text(item.name.lowercase().replaceFirstChar { it.uppercase() }, fontSize = 10.sp) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = Bronze, selectedTextColor = Bronze, indicatorColor = Bronze.copy(alpha = .09f),
                    unselectedIconColor = TextMuted, unselectedTextColor = TextMuted
                )
            )
        }
    }
}

@Composable
private fun CalendarScreen(
    jobName: String,
    jobLogo: String,
    month: YearMonth,
    selectedDate: LocalDate,
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
    onUpcoming: () -> Unit,
    onShare: () -> Unit
) {
    var drag by remember { mutableStateOf(0f) }
    val fmt = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.getDefault())
    val templateMap = templates.associateBy { it.id }
    val upcoming = assignments.mapNotNull { a ->
        val d = runCatching { LocalDate.parse(a.date) }.getOrNull() ?: return@mapNotNull null
        val t = templateMap[a.templateId] ?: return@mapNotNull null
        if (d.isBefore(LocalDate.now())) null else Triple(d, a, t)
    }.sortedBy { it.first }.take(3)

    LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 18.dp)) {
        item {
            Spacer(Modifier.height(10.dp))
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                if (jobLogo.isNotBlank()) { TemplatePhoto(jobLogo, Bronze.hashCode(), 42.dp); Spacer(Modifier.width(10.dp)) }
                Column {
                    Text(jobName + "⌄", fontSize = 24.sp, fontWeight = FontWeight.SemiBold)
                    Text("Plan your work, your life", color = TextMuted, fontSize = 11.sp)
                }
                Spacer(Modifier.weight(1f))
                IconButton(onClick = onUpcoming) { Icon(Icons.Outlined.Notifications, "Upcoming", tint = Bronze) }
                IconButton(onClick = onShare) { Icon(Icons.Outlined.Share, "Share") }
            }
            Spacer(Modifier.height(16.dp))
            Card(
                colors = CardDefaults.cardColors(containerColor = Panel),
                shape = RoundedCornerShape(22.dp),
                modifier = Modifier.border(1.dp, Divider, RoundedCornerShape(22.dp))
            ) {
                Row(Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = { onMonth(month.minusMonths(1)) }, modifier = Modifier.size(38.dp)) { Icon(Icons.Outlined.ChevronLeft, null, tint = TextMuted) }
                    Text(fmt.format(month.atDay(1)), fontSize = 21.sp, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                    IconButton(onClick = { onMonth(month.plusMonths(1)) }, modifier = Modifier.size(38.dp)) { Icon(Icons.Outlined.ChevronRight, null, tint = TextMuted) }
                    Spacer(Modifier.width(6.dp))
                    Box(
                        Modifier.size(46.dp).clip(CircleShape).background(Brush.radialGradient(listOf(Color(0xFFFFD98A), Bronze))).clickable(onClick = onTogglePaint),
                        contentAlignment = Alignment.Center
                    ) { Icon(if (paintMode) Icons.Outlined.Check else Icons.Outlined.Add, null, tint = Background) }
                }
            }
            Spacer(Modifier.height(14.dp))
            Row(Modifier.fillMaxWidth()) {
                listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun").forEachIndexed { i, day ->
                    Text(day, color = if (i > 4) TextMuted else TextPrimary, fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.weight(1f))
                }
            }
            Spacer(Modifier.height(6.dp))
            Card(
                colors = CardDefaults.cardColors(containerColor = Panel),
                shape = RoundedCornerShape(22.dp),
                modifier = Modifier.fillMaxWidth().border(1.dp, Divider, RoundedCornerShape(22.dp)).pointerInput(month) {
                    detectHorizontalDragGestures(
                        onHorizontalDrag = { _, amount -> drag += amount },
                        onDragEnd = {
                            if (drag > 80f) onMonth(month.minusMonths(1))
                            if (drag < -80f) onMonth(month.plusMonths(1))
                            drag = 0f
                        }
                    )
                }
            ) { MonthGrid(month, selectedDate, assignments, templateMap, paintMode, onDate) }
            Spacer(Modifier.height(18.dp))
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column { Text("Upcoming", fontSize = 20.sp, fontWeight = FontWeight.SemiBold); Text("Next scheduled shifts", color = TextMuted, fontSize = 11.sp) }
                Spacer(Modifier.weight(1f)); TextButton(onClick = onUpcoming) { Text("See all", color = Bronze) }
            }
            if (upcoming.isEmpty()) {
                EmptyCard("Nothing scheduled", "Choose a shift type below, then tap dates in the calendar.")
            } else {
                upcoming.forEach { (date, _, template) -> UpcomingCard(date, template) }
            }
            Spacer(Modifier.height(18.dp))
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column { Text("Shift types", fontSize = 20.sp, fontWeight = FontWeight.SemiBold); Text(if (paintMode) "Selected type paints calendar dates" else "Tap a type, then tap dates", color = TextMuted, fontSize = 11.sp) }
                Spacer(Modifier.weight(1f)); TextButton(onClick = onManageTemplates) { Text("Manage", color = Bronze) }
            }
            Spacer(Modifier.height(8.dp))
        }
        item {
            if (templates.isEmpty()) {
                EmptyCard("Create your first shift type", "Add your own photo, name, time, location and reminder.", onCreateTemplate)
            } else {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(templates, key = { it.id }) { template ->
                        CompactTypeCard(template, selectedTemplateId == template.id) { onSelectTemplate(template.id) }
                    }
                    item { CreateTypeCard(onCreateTemplate) }
                }
            }
            Spacer(Modifier.height(28.dp))
        }
    }
}

@Composable
private fun MonthGrid(
    month: YearMonth,
    selectedDate: LocalDate,
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
                    CalendarCell(date, inMonth, date == selectedDate, template, paintMode, Modifier.weight(1f)) { onDate(date) }
                }
            }
        }
    }
}

@Composable
private fun CalendarCell(
    date: LocalDate,
    inMonth: Boolean,
    selected: Boolean,
    template: ShiftTemplate?,
    paintMode: Boolean,
    modifier: Modifier,
    onClick: () -> Unit
) {
    val today = date == LocalDate.now()
    val accent = template?.let { Color(it.colorArgb) }
    val shape = RoundedCornerShape(11.dp)
    Box(
        modifier = modifier.padding(2.dp).height(50.dp).clip(shape)
            .background(if (selected) Bronze.copy(alpha = .16f) else Color.Transparent)
            .then(if (selected || today) Modifier.border(1.4.dp, if (selected) Bronze else TextMuted, shape) else Modifier)
            .clickable(onClick = onClick)
    ) {
        Text(date.dayOfMonth.toString(), color = if (inMonth) TextPrimary else TextMuted.copy(alpha = .35f), fontSize = 13.sp, modifier = Modifier.align(Alignment.TopCenter).padding(top = 6.dp))
        if (template != null) {
            Row(Modifier.align(Alignment.BottomCenter).padding(bottom = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                if (template.imageUri.isNotBlank()) TemplatePhoto(template.imageUri, template.colorArgb, 14.dp)
                else Box(Modifier.size(8.dp).background(accent ?: Bronze, CircleShape))
                if (paintMode) { Spacer(Modifier.width(3.dp)); Box(Modifier.size(4.dp).background(accent ?: Bronze, CircleShape)) }
            }
        }
    }
}

@Composable
private fun UpcomingCard(date: LocalDate, template: ShiftTemplate) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Panel2),
        shape = RoundedCornerShape(18.dp),
        modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp).border(1.dp, Divider, RoundedCornerShape(18.dp))
    ) {
        Row(Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
            TemplateHeroImage(template, Modifier.size(width = 76.dp, height = 58.dp).clip(RoundedCornerShape(13.dp)))
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(template.name, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                Text(dateLabel(date) + " • " + shiftTime(template), color = TextMuted, fontSize = 12.sp)
                if (template.location.isNotBlank()) Text(template.location, color = TextMuted, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            if (template.reminderMinutes > 0) {
                Surface(color = Bronze.copy(alpha = .13f), shape = RoundedCornerShape(10.dp)) {
                    Row(Modifier.padding(horizontal = 8.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Notifications, null, tint = Bronze, modifier = Modifier.size(14.dp)); Spacer(Modifier.width(4.dp)); Text(reminderLabel(template.reminderMinutes), color = Bronze, fontSize = 10.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun CompactTypeCard(template: ShiftTemplate, selected: Boolean, onClick: () -> Unit) {
    Card(
        modifier = Modifier.width(154.dp).height(118.dp).then(if (selected) Modifier.border(2.dp, Bronze, RoundedCornerShape(18.dp)) else Modifier).clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = Panel2), shape = RoundedCornerShape(18.dp)
    ) {
        Box(Modifier.fillMaxSize()) {
            TemplateHeroImage(template, Modifier.fillMaxSize())
            Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = .86f)))))
            Column(Modifier.align(Alignment.BottomStart).padding(10.dp)) {
                Text(template.name, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(formatMinutes(template.startMinutes) + if (template.location.isBlank()) "" else " • ${template.location}", color = TextPrimary.copy(alpha = .75f), fontSize = 10.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Box(Modifier.align(Alignment.TopEnd).padding(8.dp).size(9.dp).background(Color(template.colorArgb), CircleShape))
        }
    }
}

@Composable
private fun CreateTypeCard(onCreate: () -> Unit) {
    Card(
        modifier = Modifier.width(122.dp).height(118.dp).clickable(onClick = onCreate),
        colors = CardDefaults.cardColors(containerColor = Panel2), shape = RoundedCornerShape(18.dp)
    ) {
        Column(Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Box(Modifier.size(40.dp).background(Bronze.copy(alpha = .14f), CircleShape), contentAlignment = Alignment.Center) { Icon(Icons.Outlined.Add, null, tint = Bronze) }
            Spacer(Modifier.height(8.dp)); Text("Create type", fontSize = 12.sp)
        }
    }
}

@Composable
private fun ShiftsScreen(
    templates: List<ShiftTemplate>,
    assignments: List<ShiftAssignment>,
    onManageTypes: () -> Unit,
    onOpenTemplate: (ShiftTemplate) -> Unit
) {
    var filter by remember { mutableStateOf("Upcoming") }
    val map = templates.associateBy { it.id }
    val today = LocalDate.now()
    val items = assignments.mapNotNull { a ->
        val date = runCatching { LocalDate.parse(a.date) }.getOrNull() ?: return@mapNotNull null
        val t = map[a.templateId] ?: return@mapNotNull null
        date to t
    }.filter { (date, _) -> when (filter) { "Upcoming" -> !date.isBefore(today); "Past" -> date.isBefore(today); else -> true } }
        .sortedBy { it.first }

    LazyColumn(Modifier.fillMaxSize().padding(horizontal = 18.dp)) {
        item {
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("Shifts", fontSize = 30.sp, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.weight(1f))
                IconButton(onClick = onManageTypes) { Icon(Icons.Outlined.GridView, "Shift types", tint = Bronze) }
            }
            Spacer(Modifier.height(12.dp))
            SegmentedButtons(listOf("Upcoming", "Past", "All"), filter) { filter = it }
            Spacer(Modifier.height(14.dp))
            OutlinedButton(onClick = onManageTypes, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = ButtonDefaults.outlinedButtonColors(contentColor = Bronze)) {
                Icon(Icons.Outlined.GridView, null); Spacer(Modifier.width(8.dp)); Text("Manage shift types")
            }
            Spacer(Modifier.height(16.dp))
        }
        if (items.isEmpty()) {
            item { EmptyCard("No $filter shifts", if (filter == "Upcoming") "Assign a shift type to a future calendar date." else "Nothing to show here yet.") }
        } else {
            items(items, key = { it.first.toString() }) { (date, template) ->
                Card(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp).clickable { onOpenTemplate(template) },
                    colors = CardDefaults.cardColors(containerColor = Panel2), shape = RoundedCornerShape(18.dp)
                ) {
                    Row(Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                        TemplateHeroImage(template, Modifier.size(width = 82.dp, height = 62.dp).clip(RoundedCornerShape(13.dp)))
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(date.format(DateTimeFormatter.ofPattern("EEE, d MMM")), color = TextMuted, fontSize = 11.sp)
                            Text(template.name, fontWeight = FontWeight.SemiBold, fontSize = 17.sp)
                            Text(shiftTime(template) + if (template.location.isBlank()) "" else " • ${template.location}", color = TextMuted, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                        if (template.reminderMinutes > 0) Icon(Icons.Outlined.Notifications, null, tint = Bronze, modifier = Modifier.size(19.dp))
                        Spacer(Modifier.width(5.dp)); Icon(Icons.Outlined.ChevronRight, null, tint = TextMuted, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }
        item { Spacer(Modifier.height(24.dp)) }
    }
}

@Composable
private fun TemplateLibraryScreen(
    templates: List<ShiftTemplate>,
    onBack: () -> Unit,
    onCreate: () -> Unit,
    onOpen: (ShiftTemplate) -> Unit
) {
    var category by remember { mutableStateOf("All") }
    val shown = if (category == "All") templates else templates.filter { it.category == category }
    LazyColumn(Modifier.fillMaxSize().background(Background).statusBarsPadding().padding(horizontal = 18.dp)) {
        item {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) { Icon(Icons.Outlined.ArrowBack, null) }
                Text("Shift Types", fontSize = 23.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                IconButton(onClick = onCreate) { Icon(Icons.Outlined.Add, null, tint = Bronze) }
            }
            Spacer(Modifier.height(10.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(listOf("All", "Work", "Event", "Custom")) { c ->
                    val selected = category == c
                    Surface(
                        color = if (selected) Bronze else Panel2,
                        shape = RoundedCornerShape(18.dp),
                        modifier = Modifier.clickable { category = c }
                    ) { Text(c, color = if (selected) Background else TextPrimary, modifier = Modifier.padding(horizontal = 18.dp, vertical = 9.dp), fontSize = 12.sp) }
                }
            }
            Spacer(Modifier.height(14.dp))
        }
        items(shown.chunked(2)) { rowItems ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                rowItems.forEach { template ->
                    LibraryTypeCard(template, Modifier.weight(1f)) { onOpen(template) }
                }
                if (rowItems.size == 1) Spacer(Modifier.weight(1f))
            }
            Spacer(Modifier.height(10.dp))
        }
        item {
            Spacer(Modifier.height(8.dp))
            OutlinedButton(onClick = onCreate, modifier = Modifier.fillMaxWidth().height(54.dp), shape = RoundedCornerShape(16.dp), colors = ButtonDefaults.outlinedButtonColors(contentColor = Bronze)) {
                Icon(Icons.Outlined.Add, null); Spacer(Modifier.width(7.dp)); Text("Create Custom Type")
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun LibraryTypeCard(template: ShiftTemplate, modifier: Modifier, onClick: () -> Unit) {
    Card(modifier = modifier.height(156.dp).clickable(onClick = onClick), colors = CardDefaults.cardColors(containerColor = Panel2), shape = RoundedCornerShape(17.dp)) {
        Box(Modifier.fillMaxSize()) {
            TemplateHeroImage(template, Modifier.fillMaxSize())
            Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = .92f)))))
            Column(Modifier.align(Alignment.BottomStart).padding(10.dp)) {
                Text(template.name, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(template.category + " • " + formatMinutes(template.startMinutes), color = TextPrimary.copy(alpha = .72f), fontSize = 10.sp, maxLines = 1)
            }
            Box(Modifier.align(Alignment.TopEnd).padding(9.dp).size(10.dp).background(Color(template.colorArgb), CircleShape))
        }
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
    var colorArgb by remember(existing?.id) { mutableStateOf(existing?.colorArgb ?: TemplatePalette.first()) }
    var note by remember(existing?.id) { mutableStateOf(existing?.note ?: "") }
    var start by remember(existing?.id) { mutableStateOf(existing?.startMinutes ?: 18 * 60) }
    var end by remember(existing?.id) { mutableStateOf(existing?.endMinutes ?: 2 * 60) }
    var location by remember(existing?.id) { mutableStateOf(existing?.location ?: "") }
    var reminder by remember(existing?.id) { mutableStateOf(existing?.reminderMinutes ?: 60) }
    var category by remember(existing?.id) { mutableStateOf(existing?.category ?: "Work") }
    var confirmDelete by remember { mutableStateOf(false) }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? ->
        uri?.let {
            runCatching { context.contentResolver.takePersistableUriPermission(it, Intent.FLAG_GRANT_READ_URI_PERMISSION) }
            imageUri = it.toString()
        }
    }
    val template = ShiftTemplate(existing?.id ?: System.currentTimeMillis(), name.trim(), colorArgb, imageUri, note.trim(), start, end, location.trim(), reminder, category)

    Column(Modifier.fillMaxSize().background(Background).statusBarsPadding().padding(horizontal = 18.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            TextButton(onClick = onBack) { Text("Cancel", color = TextPrimary) }
            Text(if (existing == null) "New Shift Type" else "Edit Shift Type", modifier = Modifier.weight(1f), textAlign = TextAlign.Center, fontSize = 20.sp, fontWeight = FontWeight.SemiBold)
            TextButton(onClick = { onSave(template) }, enabled = name.isNotBlank()) { Text("Save", color = Bronze, fontWeight = FontWeight.Bold) }
        }
        LazyColumn(Modifier.weight(1f)) {
            item {
                Spacer(Modifier.height(10.dp))
                Card(colors = CardDefaults.cardColors(containerColor = Panel2), shape = RoundedCornerShape(22.dp), modifier = Modifier.fillMaxWidth().height(180.dp)) {
                    Box(Modifier.fillMaxSize()) {
                        TemplateHeroImage(template, Modifier.fillMaxSize())
                        Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = .86f)))))
                        Column(Modifier.align(Alignment.BottomStart).padding(16.dp)) {
                            Text(name.ifBlank { "Your shift type" }, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                            Text(category + " • " + shiftTime(template), color = TextPrimary.copy(alpha = .72f), fontSize = 12.sp)
                        }
                    }
                }
                Spacer(Modifier.height(10.dp))
                Button(onClick = { picker.launch(arrayOf("image/*")) }, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = Bronze, contentColor = Background), shape = RoundedCornerShape(14.dp)) {
                    Icon(Icons.Outlined.PhotoLibrary, null); Spacer(Modifier.width(8.dp)); Text(if (imageUri.isBlank()) "Upload your own picture / logo" else "Change picture / logo")
                }
                Spacer(Modifier.height(14.dp))
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Shift type name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(14.dp))
                Text("Category", color = TextMuted, fontSize = 12.sp)
                Spacer(Modifier.height(7.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(listOf("Work", "Event", "Custom")) { c ->
                        Surface(color = if (category == c) Bronze else Panel2, shape = RoundedCornerShape(16.dp), modifier = Modifier.clickable { category = c }) {
                            Text(c, color = if (category == c) Background else TextPrimary, modifier = Modifier.padding(horizontal = 16.dp, vertical = 9.dp), fontSize = 12.sp)
                        }
                    }
                }
                Spacer(Modifier.height(14.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    TimeField("Start", start, Modifier.weight(1f)) { h, m -> start = h * 60 + m }
                    TimeField("End", end, Modifier.weight(1f)) { h, m -> end = h * 60 + m }
                }
                Spacer(Modifier.height(14.dp))
                OutlinedTextField(value = location, onValueChange = { location = it }, label = { Text("Location (optional)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(16.dp))
                Text("Phone reminder", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(8.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(listOf(0, 15, 30, 60, 120, 1440)) { m ->
                        val selected = reminder == m
                        Surface(color = if (selected) Bronze else Panel2, shape = RoundedCornerShape(16.dp), modifier = Modifier.clickable { reminder = m }) {
                            Text(reminderLabel(m), color = if (selected) Background else TextPrimary, modifier = Modifier.padding(horizontal = 13.dp, vertical = 9.dp), fontSize = 11.sp)
                        }
                    }
                }
                Spacer(Modifier.height(16.dp))
                Text("Calendar accent", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(9.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(TemplatePalette) { argb ->
                        Box(Modifier.size(44.dp).background(Color(argb), CircleShape).then(if (argb == colorArgb) Modifier.border(3.dp, TextPrimary, CircleShape) else Modifier).clickable { colorArgb = argb })
                    }
                }
                Spacer(Modifier.height(14.dp))
                OutlinedTextField(value = note, onValueChange = { note = it }, label = { Text("Note (optional)") }, minLines = 3, modifier = Modifier.fillMaxWidth())
                if (onDelete != null) {
                    Spacer(Modifier.height(18.dp))
                    OutlinedButton(onClick = { confirmDelete = true }, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFFF8A8A))) {
                        Icon(Icons.Outlined.Delete, null); Spacer(Modifier.width(8.dp)); Text("Delete shift type")
                    }
                }
                Spacer(Modifier.height(28.dp))
            }
        }
    }

    if (confirmDelete) {
        AlertDialog(
            onDismissRequest = { confirmDelete = false },
            confirmButton = { TextButton(onClick = { confirmDelete = false; onDelete?.invoke() }) { Text("Delete", color = Color(0xFFFF8A8A)) } },
            dismissButton = { TextButton(onClick = { confirmDelete = false }) { Text("Cancel") } },
            title = { Text("Delete shift type?") },
            text = { Text("Calendar dates using this type will also be cleared.") }
        )
    }
}

@Composable
private fun TimeField(label: String, minutes: Int, modifier: Modifier, onTime: (Int, Int) -> Unit) {
    val context = LocalContext.current
    Card(
        modifier = modifier.clickable {
            TimePickerDialog(context, { _, h, m -> onTime(h, m) }, minutes / 60, minutes % 60, true).show()
        },
        colors = CardDefaults.cardColors(containerColor = Panel2), shape = RoundedCornerShape(15.dp)
    ) {
        Column(Modifier.padding(14.dp)) {
            Text(label, color = TextMuted, fontSize = 11.sp)
            Spacer(Modifier.height(3.dp)); Text(formatMinutes(minutes), fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun TemplatePhoto(uri: String, colorArgb: Int, size: Dp) {
    val bitmap = rememberBitmap(uri)
    Box(Modifier.size(size).clip(CircleShape).background(Color(colorArgb)), contentAlignment = Alignment.Center) {
        if (bitmap != null) Image(bitmap, null, Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        else Text("+", color = Background, fontSize = (size.value * .32f).sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun TemplateHeroImage(template: ShiftTemplate, modifier: Modifier) {
    val bitmap = rememberBitmap(template.imageUri)
    Box(modifier = modifier.background(Brush.linearGradient(listOf(Color(template.colorArgb).copy(alpha = .95f), Panel3)))) {
        if (bitmap != null) Image(bitmap, null, Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        else {
            Box(Modifier.fillMaxSize().background(Brush.radialGradient(listOf(Color(template.colorArgb), Panel3))))
            Text(template.name.take(2).uppercase(), modifier = Modifier.align(Alignment.Center), color = TextPrimary.copy(alpha = .9f), fontSize = 28.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun rememberBitmap(uri: String) = remember(uri) {
    if (uri.isBlank()) null else runCatching {
        val context = null
        null
    }.getOrNull()
}.let { cached ->
    val context = LocalContext.current
    remember(uri, context) {
        if (uri.isBlank()) null else runCatching {
            context.contentResolver.openInputStream(Uri.parse(uri))?.use { BitmapFactory.decodeStream(it) }?.asImageBitmap()
        }.getOrNull()
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
    val map = templates.associateBy { it.id }
    val fmt = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.getDefault())
    val weekCounts = (1..5).map { w -> monthAssignments.count { a -> ((LocalDate.parse(a.date).dayOfMonth - 1) / 7 + 1) == w } }

    LazyColumn(Modifier.fillMaxSize().padding(horizontal = 18.dp)) {
        item {
            Spacer(Modifier.height(12.dp)); Text("Analytics", fontSize = 30.sp, fontWeight = FontWeight.SemiBold)
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { onMonth(month.minusMonths(1)) }) { Icon(Icons.Outlined.ChevronLeft, null, tint = TextMuted) }
                Text(fmt.format(month.atDay(1)), modifier = Modifier.weight(1f), textAlign = TextAlign.Center, fontWeight = FontWeight.Medium)
                IconButton(onClick = { onMonth(month.plusMonths(1)) }) { Icon(Icons.Outlined.ChevronRight, null, tint = TextMuted) }
            }
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatCard("Total shifts", monthAssignments.size.toString(), Modifier.weight(1f))
                StatCard("Working days", monthAssignments.map { it.date }.distinct().size.toString(), Modifier.weight(1f))
            }
            Spacer(Modifier.height(12.dp))
            Card(colors = CardDefaults.cardColors(containerColor = Panel2), shape = RoundedCornerShape(20.dp), modifier = Modifier.fillMaxWidth()) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    DonutChart(counts, map, monthAssignments.size, Modifier.size(132.dp))
                    Spacer(Modifier.width(18.dp))
                    Column(Modifier.weight(1f)) {
                        Text("Shift type distribution", fontWeight = FontWeight.SemiBold)
                        Spacer(Modifier.height(8.dp))
                        counts.take(5).forEach { (id, count) ->
                            val t = map[id] ?: return@forEach
                            Row(Modifier.fillMaxWidth().padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
                                Box(Modifier.size(8.dp).background(Color(t.colorArgb), CircleShape)); Spacer(Modifier.width(7.dp)); Text(t.name, fontSize = 11.sp, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis); Text("$count", color = TextMuted, fontSize = 11.sp)
                            }
                        }
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
            Card(colors = CardDefaults.cardColors(containerColor = Panel2), shape = RoundedCornerShape(20.dp), modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text("Shifts per week", fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.height(16.dp))
                    Row(Modifier.fillMaxWidth().height(100.dp), horizontalArrangement = Arrangement.SpaceAround, verticalAlignment = Alignment.Bottom) {
                        val maxValue = (weekCounts.maxOrNull() ?: 1).coerceAtLeast(1)
                        weekCounts.forEachIndexed { i, value ->
                            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Bottom) {
                                Box(Modifier.width(26.dp).height((18 + 60 * value / maxValue).dp).clip(RoundedCornerShape(topStart = 6.dp, topEnd = 6.dp)).background(Brush.verticalGradient(listOf(Color(0xFFFFD98A), Bronze))))
                                Spacer(Modifier.height(5.dp)); Text("W${i + 1}", color = TextMuted, fontSize = 10.sp)
                            }
                        }
                    }
                }
            }
            Spacer(Modifier.height(28.dp))
        }
    }
}

@Composable
private fun DonutChart(counts: List<Pair<Long, Int>>, map: Map<Long, ShiftTemplate>, total: Int, modifier: Modifier) {
    Box(modifier, contentAlignment = Alignment.Center) {
        Canvas(Modifier.fillMaxSize()) {
            if (total == 0) drawArc(Panel3, -90f, 360f, false, style = Stroke(width = 16.dp.toPx()))
            else {
                var start = -90f
                counts.forEach { (id, count) ->
                    val sweep = 360f * count / total.toFloat()
                    drawArc(Color(map[id]?.colorArgb ?: TemplatePalette.first()), start, sweep, false, style = Stroke(width = 16.dp.toPx()))
                    start += sweep
                }
            }
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) { Text(total.toString(), fontSize = 24.sp, fontWeight = FontWeight.Bold); Text("Shifts", color = TextMuted, fontSize = 10.sp) }
    }
}

@Composable
private fun StatCard(label: String, value: String, modifier: Modifier) {
    Card(modifier, colors = CardDefaults.cardColors(containerColor = Panel2), shape = RoundedCornerShape(18.dp)) {
        Column(Modifier.padding(15.dp)) { Text(label, color = TextMuted, fontSize = 11.sp); Spacer(Modifier.height(5.dp)); Text(value, fontSize = 25.sp, fontWeight = FontWeight.Bold) }
    }
}

@Composable
private fun SettingsScreen(
    store: ScheduleStore,
    templates: List<ShiftTemplate>,
    assignments: List<ShiftAssignment>,
    notificationsEnabled: Boolean,
    onNotifications: (Boolean) -> Unit,
    onManageTypes: () -> Unit
) {
    val context = LocalContext.current
    var job by remember { mutableStateOf(store.jobName()) }
    var logo by remember { mutableStateOf(store.jobLogo()) }
    var editJob by remember { mutableStateOf(false) }
    var exportText by remember { mutableStateOf("") }
    val logoPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? ->
        uri?.let {
            runCatching { context.contentResolver.takePersistableUriPermission(it, Intent.FLAG_GRANT_READ_URI_PERMISSION) }
            logo = it.toString(); store.setJobLogo(logo)
        }
    }
    val exportLauncher = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("text/csv")) { uri: Uri? ->
        uri?.let { context.contentResolver.openOutputStream(it)?.use { stream -> stream.write(exportText.toByteArray()) } }
    }

    LazyColumn(Modifier.fillMaxSize().padding(horizontal = 18.dp)) {
        item {
            Spacer(Modifier.height(12.dp)); Text("Settings", fontSize = 30.sp, fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(14.dp))
            Card(colors = CardDefaults.cardColors(containerColor = Panel2), shape = RoundedCornerShape(20.dp), modifier = Modifier.fillMaxWidth().clickable { logoPicker.launch(arrayOf("image/*")) }) {
                Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                    TemplatePhoto(logo, Bronze.hashCode(), 58.dp); Spacer(Modifier.width(13.dp))
                    Column(Modifier.weight(1f)) { Text(job, fontSize = 18.sp, fontWeight = FontWeight.SemiBold); Text("Tap to upload your job logo", color = TextMuted, fontSize = 11.sp) }
                    Icon(Icons.Outlined.ChevronRight, null, tint = TextMuted)
                }
            }
            Spacer(Modifier.height(18.dp)); Text("Work profile", color = TextMuted, fontSize = 12.sp); Spacer(Modifier.height(7.dp))
            Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(18.dp)) {
                SettingsRow("Job name", job) { editJob = true }
                HorizontalDivider(color = Divider)
                SettingsRow("Manage shift types", "${templates.size} types", onManageTypes)
            }
            Spacer(Modifier.height(18.dp)); Text("Notifications", color = TextMuted, fontSize = 12.sp); Spacer(Modifier.height(7.dp))
            Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(18.dp)) {
                Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.Notifications, null, tint = Bronze); Spacer(Modifier.width(12.dp)); Column(Modifier.weight(1f)) { Text("Shift reminders"); Text("Phone notification before a scheduled shift", color = TextMuted, fontSize = 10.sp) }; Switch(checked = notificationsEnabled, onCheckedChange = onNotifications)
                }
            }
            Spacer(Modifier.height(18.dp)); Text("Data", color = TextMuted, fontSize = 12.sp); Spacer(Modifier.height(7.dp))
            Card(colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(18.dp)) {
                SettingsRow("Backup & Export", "CSV") { exportText = exportCsv(templates, assignments); exportLauncher.launch("work-schedule.csv") }
                HorizontalDivider(color = Divider)
                SettingsRow("About", "Beta 0.3.0") { }
            }
            Spacer(Modifier.height(28.dp))
        }
    }

    if (editJob) {
        var value by remember(job) { mutableStateOf(job) }
        AlertDialog(
            onDismissRequest = { editJob = false },
            confirmButton = { TextButton(onClick = { job = value.trim().ifBlank { "Main Job" }; store.setJobName(job); editJob = false }) { Text("Save", color = Bronze) } },
            dismissButton = { TextButton(onClick = { editJob = false }) { Text("Cancel") } },
            title = { Text("Job name") },
            text = { OutlinedTextField(value = value, onValueChange = { value = it }, singleLine = true) }
        )
    }
}

@Composable
private fun SettingsRow(label: String, value: String, onClick: () -> Unit) {
    Row(Modifier.fillMaxWidth().clickable(onClick = onClick).padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label, modifier = Modifier.weight(1f)); Text(value, color = TextMuted, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis); Spacer(Modifier.width(6.dp)); Icon(Icons.Outlined.ChevronRight, null, tint = TextMuted, modifier = Modifier.size(18.dp))
    }
}

@Composable
private fun SegmentedButtons(options: List<String>, selected: String, onSelect: (String) -> Unit) {
    Row(Modifier.fillMaxWidth().background(Panel, RoundedCornerShape(16.dp)).padding(3.dp)) {
        options.forEach { option ->
            val active = option == selected
            Box(
                Modifier.weight(1f).clip(RoundedCornerShape(13.dp)).background(if (active) Bronze.copy(alpha = .16f) else Color.Transparent).then(if (active) Modifier.border(1.dp, Bronze, RoundedCornerShape(13.dp)) else Modifier).clickable { onSelect(option) }.padding(vertical = 9.dp),
                contentAlignment = Alignment.Center
            ) { Text(option, color = if (active) Bronze else TextMuted, fontSize = 11.sp, fontWeight = if (active) FontWeight.SemiBold else FontWeight.Normal) }
        }
    }
}

@Composable
private fun EmptyCard(title: String, subtitle: String, onClick: (() -> Unit)? = null) {
    Card(
        modifier = Modifier.fillMaxWidth().then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier),
        colors = CardDefaults.cardColors(containerColor = Panel2), shape = RoundedCornerShape(18.dp)
    ) {
        Column(Modifier.padding(18.dp)) { Text(title, fontWeight = FontWeight.SemiBold); Spacer(Modifier.height(4.dp)); Text(subtitle, color = TextMuted, fontSize = 11.sp) }
    }
}

private fun formatMinutes(minutes: Int): String = "%02d:%02d".format(minutes / 60, minutes % 60)
private fun shiftTime(t: ShiftTemplate): String = formatMinutes(t.startMinutes) + " – " + formatMinutes(t.endMinutes) + if (t.endMinutes <= t.startMinutes) " (+1)" else ""
private fun reminderLabel(minutes: Int): String = when (minutes) { 0 -> "Off"; 15 -> "15m"; 30 -> "30m"; 60 -> "1h before"; 120 -> "2h before"; 1440 -> "1 day"; else -> "$minutes min" }
private fun dateLabel(date: LocalDate): String = when (date) { LocalDate.now() -> "Today"; LocalDate.now().plusDays(1) -> "Tomorrow"; else -> date.format(DateTimeFormatter.ofPattern("EEE, d MMM")) }

private fun shareMonth(context: Context, month: YearMonth, templates: List<ShiftTemplate>, assignments: List<ShiftAssignment>) {
    val map = templates.associateBy { it.id }
    val text = buildString {
        appendLine(month.atDay(1).format(DateTimeFormatter.ofPattern("MMMM yyyy", Locale.getDefault())))
        assignments.filter { runCatching { YearMonth.from(LocalDate.parse(it.date)) == month }.getOrDefault(false) }.sortedBy { it.date }.forEach { a ->
            val t = map[a.templateId]
            appendLine("${a.date} • ${t?.name ?: "Shift"} • ${t?.let { shiftTime(it) } ?: ""}${t?.location?.let { if (it.isBlank()) "" else " • $it" } ?: ""}")
        }
    }
    context.startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text), "Share schedule"))
}

private fun csv(value: String): String = "\"" + value.replace("\"", "\"\"") + "\""
private fun exportCsv(templates: List<ShiftTemplate>, assignments: List<ShiftAssignment>): String {
    val map = templates.associateBy { it.id }
    return buildString {
        appendLine("date,shift,start,end,location,reminder_minutes,category")
        assignments.sortedBy { it.date }.forEach { a ->
            val t = map[a.templateId]
            appendLine(listOf(a.date, t?.name ?: "Shift", t?.let { formatMinutes(it.startMinutes) } ?: "", t?.let { formatMinutes(it.endMinutes) } ?: "", t?.location ?: "", (t?.reminderMinutes ?: 0).toString(), t?.category ?: "").joinToString(",") { csv(it) })
        }
    }
}
