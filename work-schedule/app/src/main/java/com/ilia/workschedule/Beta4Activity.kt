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

private val V4Bronze = Color(0xFFE9B95C)
private val V4Bg = Color(0xFF090E12)
private val V4Panel = Color(0xFF12191E)
private val V4Panel2 = Color(0xFF1A2228)
private val V4Panel3 = Color(0xFF222C33)
private val V4Text = Color(0xFFF7F4ED)
private val V4Muted = Color(0xFF8F99A2)
private val V4Divider = Color.White.copy(alpha = .075f)

private val V4Palette = listOf(
    0xFFE9B95C.toInt(), 0xFF86B9E5.toInt(), 0xFFD68ACD.toInt(), 0xFF83C7A0.toInt(),
    0xFFEF927D.toInt(), 0xFF9B8BE9.toInt(), 0xFF7FD4D0.toInt(), 0xFFE9CE84.toInt(),
    0xFFC78FA4.toInt(), 0xFFA4C978.toInt()
)

private enum class V4LogoSize(val label: String) { SMALL("Small"), MEDIUM("Medium"), LARGE("Large") }

private data class V4Template(
    val id: Long = System.currentTimeMillis(),
    val name: String,
    val colorArgb: Int = V4Palette.first(),
    val imageUri: String = "",
    val note: String = "",
    val startMinutes: Int = 18 * 60,
    val endMinutes: Int = 2 * 60,
    val location: String = "",
    val reminderMinutes: Int = 60,
    val category: String = "Work",
    val logoSize: V4LogoSize = V4LogoSize.LARGE
)

private data class V4Assignment(val date: String, val templateId: Long)

private class V4Store(private val context: Context) {
    private val prefs = context.getSharedPreferences("work_schedule_beta", Context.MODE_PRIVATE)

    fun jobName(): String = prefs.getString("job", "Main Job") ?: "Main Job"
    fun setJobName(v: String) = prefs.edit().putString("job", v).apply()
    fun jobLogo(): String = prefs.getString("job_logo", "") ?: ""
    fun setJobLogo(v: String) = prefs.edit().putString("job_logo", v).apply()
    fun notificationsEnabled(): Boolean = prefs.getBoolean("notifications_v3", true)
    fun setNotificationsEnabled(v: Boolean) = prefs.edit().putBoolean("notifications_v3", v).apply()

    fun loadTemplates(): List<V4Template> {
        val v4 = prefs.getString("templates_v4", null)
        if (v4 != null) return decodeV4(v4)
        val v3 = prefs.getString("templates_v3", "[]") ?: "[]"
        val migrated = decodeV3(v3)
        saveTemplates(migrated)
        return migrated
    }

    private fun decodeV4(raw: String): List<V4Template> {
        val a = runCatching { JSONArray(raw) }.getOrElse { JSONArray() }
        return (0 until a.length()).map { i ->
            val o = a.getJSONObject(i)
            V4Template(
                id = o.optLong("id", System.currentTimeMillis() + i),
                name = o.optString("name", "Shift"),
                colorArgb = o.optInt("color", V4Palette[i % V4Palette.size]),
                imageUri = o.optString("image", ""),
                note = o.optString("note", ""),
                startMinutes = o.optInt("start", 18 * 60),
                endMinutes = o.optInt("end", 2 * 60),
                location = o.optString("location", ""),
                reminderMinutes = o.optInt("reminder", 60),
                category = o.optString("category", "Work"),
                logoSize = runCatching { V4LogoSize.valueOf(o.optString("logoSize", "LARGE")) }.getOrDefault(V4LogoSize.LARGE)
            )
        }
    }

    private fun decodeV3(raw: String): List<V4Template> {
        val a = runCatching { JSONArray(raw) }.getOrElse { JSONArray() }
        return (0 until a.length()).map { i ->
            val o = a.getJSONObject(i)
            V4Template(
                id = o.optLong("id", System.currentTimeMillis() + i),
                name = o.optString("name", "Shift"),
                colorArgb = o.optInt("color", V4Palette[i % V4Palette.size]),
                imageUri = o.optString("image", ""),
                note = o.optString("note", ""),
                startMinutes = o.optInt("start", 18 * 60),
                endMinutes = o.optInt("end", 2 * 60),
                location = o.optString("location", ""),
                reminderMinutes = o.optInt("reminder", 60),
                category = o.optString("category", "Work"),
                logoSize = V4LogoSize.LARGE
            )
        }
    }

    fun saveTemplates(items: List<V4Template>) {
        val a = JSONArray()
        items.forEach { t ->
            a.put(JSONObject().apply {
                put("id", t.id); put("name", t.name); put("color", t.colorArgb); put("image", t.imageUri)
                put("note", t.note); put("start", t.startMinutes); put("end", t.endMinutes); put("location", t.location)
                put("reminder", t.reminderMinutes); put("category", t.category); put("logoSize", t.logoSize.name)
            })
        }
        prefs.edit().putString("templates_v4", a.toString()).apply()
    }

    fun loadAssignments(): List<V4Assignment> {
        val raw = prefs.getString("assignments_v2", "[]") ?: "[]"
        val a = runCatching { JSONArray(raw) }.getOrElse { JSONArray() }
        return (0 until a.length()).mapNotNull { i ->
            val o = a.getJSONObject(i)
            val d = o.optString("date", "")
            if (d.isBlank()) null else V4Assignment(d, o.optLong("templateId"))
        }.distinctBy { it.date }
    }

    fun saveAssignments(items: List<V4Assignment>) {
        val a = JSONArray()
        items.distinctBy { it.date }.forEach { x -> a.put(JSONObject().apply { put("date", x.date); put("templateId", x.templateId) }) }
        prefs.edit().putString("assignments_v2", a.toString()).apply()
    }
}

class Beta4Activity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        v4CreateChannel(this)
        setContent { V4Theme { V4App() } }
    }
}

class Beta4ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val title = intent.getStringExtra("title") ?: "Upcoming shift"
        val text = intent.getStringExtra("text") ?: "Your shift is coming up"
        val id = intent.getIntExtra("id", 1)
        val open = PendingIntent.getActivity(
            context, id, Intent(context, Beta4Activity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val b = NotificationCompat.Builder(context, "work_schedule_v4")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setContentIntent(open)
        val image = intent.getStringExtra("image").orEmpty()
        if (image.isNotBlank()) {
            runCatching { context.contentResolver.openInputStream(Uri.parse(image))?.use { BitmapFactory.decodeStream(it) } }
                .getOrNull()?.let { b.setLargeIcon(it) }
        }
        if (Build.VERSION.SDK_INT < 33 || ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
            (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).notify(id, b.build())
        }
    }
}

class Beta4BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val s = V4Store(context)
            if (s.notificationsEnabled()) v4ScheduleAll(context, s.loadTemplates(), s.loadAssignments())
        }
    }
}

private fun v4CreateChannel(context: Context) {
    if (Build.VERSION.SDK_INT >= 26) {
        (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(
            NotificationChannel("work_schedule_v4", "Shift reminders", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Upcoming shift reminders"
            }
        )
    }
}

private fun v4ReminderId(a: V4Assignment): Int = abs((a.date + "|" + a.templateId).hashCode()).coerceAtLeast(1)
private fun v4Cancel(context: Context, a: V4Assignment) {
    val p = PendingIntent.getBroadcast(context, v4ReminderId(a), Intent(context, Beta4ReminderReceiver::class.java), PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE)
    p?.let { (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(it); it.cancel() }
}
private fun v4ScheduleAll(context: Context, templates: List<V4Template>, assignments: List<V4Assignment>) {
    val map = templates.associateBy { it.id }
    assignments.forEach { a -> map[a.templateId]?.let { v4Schedule(context, a, it) } }
}
private fun v4Schedule(context: Context, a: V4Assignment, t: V4Template) {
    v4Cancel(context, a)
    if (t.reminderMinutes <= 0) return
    val d = runCatching { LocalDate.parse(a.date) }.getOrNull() ?: return
    val start = LocalDateTime.of(d, LocalTime.of(t.startMinutes / 60, t.startMinutes % 60))
    val trigger = start.minusMinutes(t.reminderMinutes.toLong()).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
    if (trigger <= System.currentTimeMillis()) return
    val label = when {
        t.reminderMinutes >= 1440 -> "Tomorrow at ${v4Time(t.startMinutes)}"
        t.reminderMinutes >= 60 -> "Starts in ${t.reminderMinutes / 60}h at ${v4Time(t.startMinutes)}"
        else -> "Starts in ${t.reminderMinutes} min at ${v4Time(t.startMinutes)}"
    }
    val text = label + if (t.location.isBlank()) "" else " • ${t.location}"
    val i = Intent(context, Beta4ReminderReceiver::class.java).putExtra("title", t.name).putExtra("text", text)
        .putExtra("id", v4ReminderId(a)).putExtra("image", t.imageUri)
    val p = PendingIntent.getBroadcast(context, v4ReminderId(a), i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, p)
}

@Composable private fun V4Theme(content: @Composable () -> Unit) = MaterialTheme(
    colorScheme = darkColorScheme(primary = V4Bronze, background = V4Bg, surface = V4Panel, surfaceVariant = V4Panel2, onBackground = V4Text, onSurface = V4Text),
    content = content
)

private enum class V4Tab { CALENDAR, SHIFTS, ANALYTICS, SETTINGS }
private sealed interface V4Route {
    data object Main : V4Route
    data class DatePreview(val date: LocalDate) : V4Route
    data object TypeLibrary : V4Route
    data class TypeEditor(val id: Long? = null) : V4Route
}

@Composable private fun V4App() {
    val context = LocalContext.current
    val store = remember { V4Store(context) }
    var templates by remember { mutableStateOf(store.loadTemplates()) }
    var assignments by remember { mutableStateOf(store.loadAssignments()) }
    var notifications by remember { mutableStateOf(store.notificationsEnabled()) }
    var tab by remember { mutableStateOf(V4Tab.CALENDAR) }
    var route: V4Route by remember { mutableStateOf(V4Route.Main) }
    var month by remember { mutableStateOf(YearMonth.now()) }
    var selectedDate by remember { mutableStateOf(LocalDate.now()) }
    var paintMode by remember { mutableStateOf(false) }
    var selectedTemplateId by remember { mutableStateOf<Long?>(templates.firstOrNull()?.id) }

    val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {}
    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) permission.launch(Manifest.permission.POST_NOTIFICATIONS)
    }
    LaunchedEffect(templates, assignments, notifications) {
        if (notifications) v4ScheduleAll(context, templates, assignments) else assignments.forEach { v4Cancel(context, it) }
    }

    fun saveTemplates(v: List<V4Template>) {
        templates = v; store.saveTemplates(v)
        if (selectedTemplateId !in v.map { it.id }) selectedTemplateId = v.firstOrNull()?.id
    }
    fun saveAssignments(v: List<V4Assignment>) { assignments = v.distinctBy { it.date }; store.saveAssignments(assignments) }
    fun paint(date: LocalDate) {
        val id = selectedTemplateId ?: return
        val key = date.toString()
        val existing = assignments.firstOrNull { it.date == key }
        saveAssignments(if (existing?.templateId == id) assignments.filterNot { it.date == key } else assignments.filterNot { it.date == key } + V4Assignment(key, id))
        selectedDate = date; month = YearMonth.from(date)
    }

    BackHandler(enabled = route !is V4Route.Main) { route = V4Route.Main }
    when (val r = route) {
        V4Route.Main -> Scaffold(containerColor = V4Bg, bottomBar = { V4BottomBar(tab) { tab = it } }) { p ->
            Box(Modifier.fillMaxSize().padding(p).statusBarsPadding()) {
                when (tab) {
                    V4Tab.CALENDAR -> V4CalendarScreen(store.jobName(), store.jobLogo(), month, selectedDate, templates, assignments, paintMode, selectedTemplateId,
                        onMonth = { month = it }, onTogglePaint = { if (templates.isEmpty()) route = V4Route.TypeEditor() else paintMode = !paintMode },
                        onSelectType = { selectedTemplateId = it; paintMode = true }, onDate = { d -> if (paintMode) paint(d) else { selectedDate = d; route = V4Route.DatePreview(d) } },
                        onManageTypes = { route = V4Route.TypeLibrary }, onSeeAll = { tab = V4Tab.SHIFTS }, onAddType = { route = V4Route.TypeEditor() })
                    V4Tab.SHIFTS -> V4ShiftsScreen(templates, assignments, onManageTypes = { route = V4Route.TypeLibrary }, onDate = { route = V4Route.DatePreview(it) })
                    V4Tab.ANALYTICS -> V4AnalyticsScreen(month, templates, assignments) { month = it }
                    V4Tab.SETTINGS -> V4SettingsScreen(store, templates, assignments, notifications,
                        onNotifications = { notifications = it; store.setNotificationsEnabled(it) }, onManageTypes = { route = V4Route.TypeLibrary })
                }
            }
        }
        is V4Route.DatePreview -> {
            val a = assignments.firstOrNull { it.date == r.date.toString() }
            val t = a?.let { x -> templates.firstOrNull { it.id == x.templateId } }
            V4DatePreviewScreen(r.date, t, onBack = { route = V4Route.Main }, onEdit = { t?.let { route = V4Route.TypeEditor(it.id) } }, onDelete = {
                saveAssignments(assignments.filterNot { it.date == r.date.toString() }); route = V4Route.Main
            })
        }
        V4Route.TypeLibrary -> V4TypeLibraryScreen(templates, onBack = { route = V4Route.Main }, onCreate = { route = V4Route.TypeEditor() }, onOpen = { route = V4Route.TypeEditor(it.id) })
        is V4Route.TypeEditor -> {
            val existing = r.id?.let { id -> templates.firstOrNull { it.id == id } }
            V4TypeEditorScreen(existing, onBack = { route = V4Route.TypeLibrary }, onSave = { t ->
                saveTemplates(if (existing == null) templates + t else templates.map { if (it.id == t.id) t else it })
                selectedTemplateId = t.id; paintMode = true; route = V4Route.TypeLibrary
            }, onDelete = if (existing == null) null else ({
                saveTemplates(templates.filterNot { it.id == existing.id }); saveAssignments(assignments.filterNot { it.templateId == existing.id }); route = V4Route.TypeLibrary
            }))
        }
    }
}

@Composable private fun V4BottomBar(tab: V4Tab, onTab: (V4Tab) -> Unit) {
    NavigationBar(containerColor = V4Bg, modifier = Modifier.navigationBarsPadding()) {
        val items = listOf(V4Tab.CALENDAR to Icons.Outlined.CalendarMonth, V4Tab.SHIFTS to Icons.Outlined.Work, V4Tab.ANALYTICS to Icons.Outlined.Analytics, V4Tab.SETTINGS to Icons.Outlined.Settings)
        items.forEach { (t, i) -> NavigationBarItem(selected = t == tab, onClick = { onTab(t) }, icon = { Icon(i, null) },
            label = { Text(t.name.lowercase().replaceFirstChar { it.uppercase() }, fontSize = 10.sp) },
            colors = NavigationBarItemDefaults.colors(selectedIconColor = V4Bronze, selectedTextColor = V4Bronze, indicatorColor = V4Bronze.copy(alpha = .09f), unselectedIconColor = V4Muted, unselectedTextColor = V4Muted)) }
    }
}

@Composable private fun V4CalendarScreen(
    jobName: String, jobLogo: String, month: YearMonth, selectedDate: LocalDate, templates: List<V4Template>, assignments: List<V4Assignment>,
    paintMode: Boolean, selectedTemplateId: Long?, onMonth: (YearMonth) -> Unit, onTogglePaint: () -> Unit, onSelectType: (Long) -> Unit,
    onDate: (LocalDate) -> Unit, onManageTypes: () -> Unit, onSeeAll: () -> Unit, onAddType: () -> Unit
) {
    var drag by remember { mutableStateOf(0f) }
    val map = templates.associateBy { it.id }
    val upcoming = assignments.mapNotNull { a ->
        val d = runCatching { LocalDate.parse(a.date) }.getOrNull() ?: return@mapNotNull null
        val t = map[a.templateId] ?: return@mapNotNull null
        if (d.isBefore(LocalDate.now())) null else d to t
    }.sortedBy { it.first }.take(2)
    LazyColumn(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
        item {
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                if (jobLogo.isNotBlank()) { V4Photo(jobLogo, V4Bronze.hashCode(), 38.dp, RoundedCornerShape(10.dp)); Spacer(Modifier.width(10.dp)) }
                Column { Text(jobName + " ⌄", fontSize = 24.sp, fontWeight = FontWeight.SemiBold); Text("Plan your work, your life", color = V4Muted, fontSize = 11.sp) }
                Spacer(Modifier.weight(1f)); IconButton(onClick = onSeeAll) { Icon(Icons.Outlined.Notifications, null, tint = V4Bronze) }; IconButton(onClick = onManageTypes) { Icon(Icons.Outlined.Settings, null) }
            }
            Spacer(Modifier.height(14.dp))
            Card(colors = CardDefaults.cardColors(V4Panel), shape = RoundedCornerShape(20.dp), modifier = Modifier.border(1.dp, V4Divider, RoundedCornerShape(20.dp))) {
                Row(Modifier.fillMaxWidth().padding(horizontal = 10.dp, vertical = 9.dp), verticalAlignment = Alignment.CenterVertically) {
                    IconButton({ onMonth(month.minusMonths(1)) }, Modifier.size(36.dp)) { Icon(Icons.Outlined.ChevronLeft, null, tint = V4Muted) }
                    Text(month.atDay(1).format(DateTimeFormatter.ofPattern("MMMM yyyy", Locale.getDefault())), modifier = Modifier.weight(1f), textAlign = TextAlign.Center, fontSize = 20.sp, fontWeight = FontWeight.Medium)
                    IconButton({ onMonth(month.plusMonths(1)) }, Modifier.size(36.dp)) { Icon(Icons.Outlined.ChevronRight, null, tint = V4Muted) }
                    Spacer(Modifier.width(6.dp)); Box(Modifier.size(44.dp).clip(CircleShape).background(Brush.radialGradient(listOf(Color(0xFFFFD98A), V4Bronze))).clickable(onClick = onTogglePaint), contentAlignment = Alignment.Center) {
                        Icon(if (paintMode) Icons.Outlined.Check else Icons.Outlined.Add, null, tint = V4Bg)
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth()) { listOf("Mon","Tue","Wed","Thu","Fri","Sat","Sun").forEachIndexed { i, d -> Text(d, color = if (i > 4) V4Muted else V4Text, fontSize = 11.sp, textAlign = TextAlign.Center, modifier = Modifier.weight(1f)) } }
            Spacer(Modifier.height(5.dp))
            Card(colors = CardDefaults.cardColors(V4Panel), shape = RoundedCornerShape(22.dp), modifier = Modifier.fillMaxWidth().border(1.dp, V4Divider, RoundedCornerShape(22.dp)).pointerInput(month) {
                detectHorizontalDragGestures(onHorizontalDrag = { _, a -> drag += a }, onDragEnd = { if (drag > 80) onMonth(month.minusMonths(1)); if (drag < -80) onMonth(month.plusMonths(1)); drag = 0f })
            }) { V4MonthGrid(month, selectedDate, assignments, map, onDate) }
            Spacer(Modifier.height(14.dp))
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) { Column { Text("Upcoming", fontSize = 18.sp, fontWeight = FontWeight.SemiBold); Text("Next scheduled shifts", color = V4Muted, fontSize = 10.sp) }; Spacer(Modifier.weight(1f)); TextButton(onClick = onSeeAll) { Text("See all", color = V4Bronze) } }
            if (upcoming.isEmpty()) V4Empty("Nothing scheduled", "Select a shift type and tap a date.") else upcoming.forEach { (d, t) -> V4UpcomingCompact(d, t) }
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) { Text("Shift types", fontSize = 18.sp, fontWeight = FontWeight.SemiBold); Spacer(Modifier.weight(1f)); TextButton(onClick = onManageTypes) { Text("Manage", color = V4Bronze) } }
            Spacer(Modifier.height(4.dp))
        }
        item {
            if (templates.isEmpty()) V4Empty("Create your first shift type", "Upload your own photo/logo and choose its calendar size.", onAddType) else LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                items(templates, key = { it.id }) { t -> V4TypeMini(t, selectedTemplateId == t.id) { onSelectType(t.id) } }
                item { Card(Modifier.size(94.dp).clickable(onClick = onAddType), colors = CardDefaults.cardColors(V4Panel2), shape = RoundedCornerShape(16.dp)) { Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Icon(Icons.Outlined.Add, null, tint = V4Bronze) } } }
            }
            Spacer(Modifier.height(22.dp))
        }
    }
}

@Composable private fun V4MonthGrid(month: YearMonth, selectedDate: LocalDate, assignments: List<V4Assignment>, templates: Map<Long,V4Template>, onDate: (LocalDate) -> Unit) {
    val first = month.atDay(1); val start = first.minusDays((first.dayOfWeek.value - 1).toLong()); val byDate = assignments.associateBy { it.date }
    Column(Modifier.padding(8.dp)) { repeat(6) { r -> Row(Modifier.fillMaxWidth()) { repeat(7) { c ->
        val date = start.plusDays((r * 7 + c).toLong()); val inMonth = YearMonth.from(date) == month; val t = byDate[date.toString()]?.let { templates[it.templateId] }
        V4CalendarCell(date, inMonth, date == selectedDate, t, Modifier.weight(1f)) { onDate(date) }
    } } } }
}

@Composable private fun V4CalendarCell(date: LocalDate, inMonth: Boolean, selected: Boolean, t: V4Template?, modifier: Modifier, onClick: () -> Unit) {
    val shape = RoundedCornerShape(10.dp)
    val imageSize = when (t?.logoSize) { V4LogoSize.SMALL -> 22.dp; V4LogoSize.MEDIUM -> 31.dp; V4LogoSize.LARGE -> 41.dp; null -> 0.dp }
    Box(modifier.padding(1.5.dp).height(68.dp).clip(shape).background(if (selected) V4Bronze.copy(alpha = .13f) else Color.Transparent)
        .then(if (selected) Modifier.border(1.6.dp, V4Bronze, shape) else Modifier).clickable(onClick = onClick)) {
        Text(date.dayOfMonth.toString(), color = if (inMonth) V4Text else V4Muted.copy(alpha = .45f), fontSize = 13.sp, modifier = Modifier.align(Alignment.TopStart).padding(5.dp))
        if (t != null) {
            Box(Modifier.align(Alignment.Center).padding(top = 4.dp), contentAlignment = Alignment.Center) {
                V4Photo(t.imageUri, t.colorArgb, imageSize, RoundedCornerShape(8.dp))
            }
            Text(t.name, color = Color(t.colorArgb), fontSize = 7.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Center, modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(horizontal = 2.dp, vertical = 3.dp))
        }
    }
}

@Composable private fun V4UpcomingCompact(date: LocalDate, t: V4Template) {
    val days = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), date)
    val whenText = when (days) { 0L -> "Today"; 1L -> "Tomorrow"; else -> date.format(DateTimeFormatter.ofPattern("EEE, d MMM")) }
    Card(Modifier.fillMaxWidth().padding(vertical = 3.dp).height(70.dp), colors = CardDefaults.cardColors(V4Panel2), shape = RoundedCornerShape(16.dp)) {
        Row(Modifier.fillMaxSize().padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
            V4Photo(t.imageUri, t.colorArgb, 50.dp, RoundedCornerShape(11.dp)); Spacer(Modifier.width(10.dp)); Column(Modifier.weight(1f)) {
                Text(t.name, fontWeight = FontWeight.SemiBold, maxLines = 1); Text("$whenText • ${v4Time(t.startMinutes)} – ${v4EndLabel(t)}", color = V4Muted, fontSize = 11.sp, maxLines = 1)
            }
            if (t.reminderMinutes > 0) Surface(color = V4Bronze.copy(alpha = .12f), shape = RoundedCornerShape(12.dp)) { Row(Modifier.padding(horizontal = 8.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Outlined.Notifications, null, tint = V4Bronze, modifier = Modifier.size(15.dp)); Spacer(Modifier.width(3.dp)); Text(v4ReminderShort(t.reminderMinutes), color = V4Bronze, fontSize = 10.sp) } }
        }
    }
}

@Composable private fun V4TypeMini(t: V4Template, selected: Boolean, onClick: () -> Unit) {
    Card(Modifier.width(112.dp).height(94.dp).then(if (selected) Modifier.border(1.5.dp, V4Bronze, RoundedCornerShape(16.dp)) else Modifier).clickable(onClick = onClick), colors = CardDefaults.cardColors(V4Panel2), shape = RoundedCornerShape(16.dp)) {
        Box(Modifier.fillMaxSize()) { V4Hero(t, Modifier.fillMaxSize()); Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = .9f))))); Text(t.name, modifier = Modifier.align(Alignment.BottomStart).padding(8.dp), fontSize = 11.sp, fontWeight = FontWeight.SemiBold, maxLines = 1) }
    }
}

@Composable private fun V4DatePreviewScreen(date: LocalDate, t: V4Template?, onBack: () -> Unit, onEdit: () -> Unit, onDelete: () -> Unit) {
    Column(Modifier.fillMaxSize().background(V4Bg).statusBarsPadding().padding(horizontal = 18.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) { IconButton(onBack) { Icon(Icons.Outlined.ChevronLeft, null) }; Text(date.format(DateTimeFormatter.ofPattern("EEE, d MMMM yyyy")), fontSize = 18.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f)) }
        Spacer(Modifier.height(10.dp))
        if (t == null) { V4Empty("No shift on this date", "Return to Calendar, choose a shift type and assign it to this date."); return@Column }
        Card(Modifier.fillMaxWidth().height(330.dp), colors = CardDefaults.cardColors(V4Panel), shape = RoundedCornerShape(26.dp)) { Box(Modifier.fillMaxSize()) {
            V4Hero(t, Modifier.fillMaxSize()); Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Black.copy(alpha = .05f), Color.Black.copy(alpha = .9f))))); Text(date.dayOfMonth.toString(), modifier = Modifier.align(Alignment.TopStart).padding(18.dp), fontSize = 38.sp, fontWeight = FontWeight.Bold)
            Column(Modifier.align(Alignment.BottomStart).padding(20.dp)) { Text(t.name, fontSize = 29.sp, fontWeight = FontWeight.Bold); Text("${v4Time(t.startMinutes)} – ${v4EndLabel(t)}", color = V4Text.copy(alpha = .78f), fontSize = 16.sp); if (t.location.isNotBlank()) Text(t.location, color = V4Text.copy(alpha = .66f), fontSize = 13.sp) }
        } }
        Spacer(Modifier.height(16.dp)); Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Button(onEdit, Modifier.weight(1f), colors = ButtonDefaults.buttonColors(V4Bronze, V4Bg)) { Icon(Icons.Outlined.Edit, null); Spacer(Modifier.width(6.dp)); Text("Edit") }
            OutlinedButton(onDelete, Modifier.weight(1f)) { Icon(Icons.Outlined.Delete, null); Spacer(Modifier.width(6.dp)); Text("Remove") }
        }
        Spacer(Modifier.height(14.dp)); Card(colors = CardDefaults.cardColors(V4Panel2), shape = RoundedCornerShape(18.dp)) { Column(Modifier.fillMaxWidth().padding(16.dp)) {
            V4InfoRow(Icons.Outlined.Schedule, "Time", "${v4Time(t.startMinutes)} – ${v4EndLabel(t)}"); if (t.location.isNotBlank()) V4InfoRow(Icons.Outlined.LocationOn, "Location", t.location); V4InfoRow(Icons.Outlined.Notifications, "Reminder", if (t.reminderMinutes <= 0) "Off" else v4ReminderLong(t.reminderMinutes)); if (t.note.isNotBlank()) V4InfoRow(Icons.Outlined.Notes, "Note", t.note)
        } }
    }
}

@Composable private fun V4InfoRow(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String) { Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) { Icon(icon, null, tint = V4Bronze, modifier = Modifier.size(19.dp)); Spacer(Modifier.width(10.dp)); Text(label, color = V4Muted, fontSize = 12.sp, modifier = Modifier.width(72.dp)); Text(value, fontSize = 13.sp, modifier = Modifier.weight(1f)) } }

@Composable private fun V4ShiftsScreen(templates: List<V4Template>, assignments: List<V4Assignment>, onManageTypes: () -> Unit, onDate: (LocalDate) -> Unit) {
    val map = templates.associateBy { it.id }; var filter by remember { mutableStateOf("Upcoming") }; val today = LocalDate.now()
    val rows = assignments.mapNotNull { a -> runCatching { LocalDate.parse(a.date) }.getOrNull()?.let { d -> map[a.templateId]?.let { t -> d to t } } }.filter { (d, _) -> when (filter) { "Past" -> d.isBefore(today); "All" -> true; else -> !d.isBefore(today) } }.sortedBy { it.first }
    LazyColumn(Modifier.fillMaxSize().padding(horizontal = 18.dp)) {
        item { Row(Modifier.fillMaxWidth().padding(top = 12.dp), verticalAlignment = Alignment.CenterVertically) { Text("Shifts", fontSize = 30.sp, fontWeight = FontWeight.Bold); Spacer(Modifier.weight(1f)); IconButton(onManageTypes) { Icon(Icons.Outlined.GridView, null, tint = V4Bronze) } }; Spacer(Modifier.height(10.dp)); Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { listOf("Upcoming","Past","All").forEach { x -> V4Chip(x, filter == x) { filter = x } } }; Spacer(Modifier.height(14.dp)) }
        items(rows, key = { it.first.toString() }) { (d, t) -> Card(Modifier.fillMaxWidth().padding(vertical = 4.dp).height(78.dp).clickable { onDate(d) }, colors = CardDefaults.cardColors(V4Panel2), shape = RoundedCornerShape(16.dp)) { Row(Modifier.fillMaxSize().padding(8.dp), verticalAlignment = Alignment.CenterVertically) { V4Photo(t.imageUri, t.colorArgb, 58.dp, RoundedCornerShape(11.dp)); Spacer(Modifier.width(10.dp)); Column(Modifier.weight(1f)) { Text(d.format(DateTimeFormatter.ofPattern("EEE, d MMM")), color = V4Muted, fontSize = 10.sp); Text(t.name, fontWeight = FontWeight.SemiBold); Text("${v4Time(t.startMinutes)} – ${v4EndLabel(t)}" + if (t.location.isBlank()) "" else " • ${t.location}", color = V4Muted, fontSize = 11.sp, maxLines = 1) }; Icon(Icons.Outlined.ChevronRight, null, tint = V4Muted) } } }
        item { Spacer(Modifier.height(20.dp)); OutlinedButton(onManageTypes, Modifier.fillMaxWidth().height(52.dp)) { Icon(Icons.Outlined.GridView, null); Spacer(Modifier.width(7.dp)); Text("Manage shift types") }; Spacer(Modifier.height(24.dp)) }
    }
}

@Composable private fun V4TypeLibraryScreen(templates: List<V4Template>, onBack: () -> Unit, onCreate: () -> Unit, onOpen: (V4Template) -> Unit) {
    var category by remember { mutableStateOf("All") }; val shown = if (category == "All") templates else templates.filter { it.category == category }
    LazyColumn(Modifier.fillMaxSize().background(V4Bg).statusBarsPadding().padding(horizontal = 16.dp)) {
        item { Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) { IconButton(onBack) { Icon(Icons.Outlined.ChevronLeft, null) }; Text("Shift Types", fontSize = 23.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f), textAlign = TextAlign.Center); IconButton(onCreate) { Icon(Icons.Outlined.Add, null, tint = V4Bronze) } }; Spacer(Modifier.height(8.dp)); LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) { items(listOf("All","Work","Event","Custom")) { c -> item@ V4Chip(c, category == c) { category = c } } }; Spacer(Modifier.height(14.dp)) }
        items(shown.chunked(2)) { rowItems -> Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) { rowItems.forEach { t -> V4LibraryCard(t, Modifier.weight(1f)) { onOpen(t) } }; if (rowItems.size == 1) Spacer(Modifier.weight(1f)) }; Spacer(Modifier.height(10.dp)) }
        item { Spacer(Modifier.height(8.dp)); OutlinedButton(onCreate, Modifier.fillMaxWidth().height(54.dp), colors = ButtonDefaults.outlinedButtonColors(contentColor = V4Bronze)) { Icon(Icons.Outlined.Add, null); Spacer(Modifier.width(6.dp)); Text("Create Custom Type") }; Spacer(Modifier.height(24.dp)) }
    }
}

@Composable private fun V4LibraryCard(t: V4Template, modifier: Modifier, onClick: () -> Unit) { Card(modifier.height(165.dp).clickable(onClick = onClick), colors = CardDefaults.cardColors(V4Panel2), shape = RoundedCornerShape(17.dp)) { Box(Modifier.fillMaxSize()) { V4Hero(t, Modifier.fillMaxSize()); Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = .92f))))); Column(Modifier.align(Alignment.BottomStart).padding(10.dp)) { Text(t.name, fontWeight = FontWeight.Bold, maxLines = 1); Text("${t.category} • ${v4Time(t.startMinutes)}", color = V4Text.copy(alpha = .72f), fontSize = 10.sp) }; Box(Modifier.align(Alignment.TopEnd).padding(9.dp).size(10.dp).background(Color(t.colorArgb), CircleShape)) } } }

@Composable private fun V4TypeEditorScreen(existing: V4Template?, onBack: () -> Unit, onSave: (V4Template) -> Unit, onDelete: (() -> Unit)?) {
    val context = LocalContext.current
    var name by remember(existing?.id) { mutableStateOf(existing?.name ?: "") }; var image by remember(existing?.id) { mutableStateOf(existing?.imageUri ?: "") }; var color by remember(existing?.id) { mutableStateOf(existing?.colorArgb ?: V4Palette.first()) }
    var note by remember(existing?.id) { mutableStateOf(existing?.note ?: "") }; var start by remember(existing?.id) { mutableStateOf(existing?.startMinutes ?: 18*60) }; var end by remember(existing?.id) { mutableStateOf(existing?.endMinutes ?: 2*60) }
    var location by remember(existing?.id) { mutableStateOf(existing?.location ?: "") }; var reminder by remember(existing?.id) { mutableStateOf(existing?.reminderMinutes ?: 60) }; var category by remember(existing?.id) { mutableStateOf(existing?.category ?: "Work") }; var logoSize by remember(existing?.id) { mutableStateOf(existing?.logoSize ?: V4LogoSize.LARGE) }; var confirmDelete by remember { mutableStateOf(false) }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? -> uri?.let { runCatching { context.contentResolver.takePersistableUriPermission(it, Intent.FLAG_GRANT_READ_URI_PERMISSION) }; image = it.toString() } }
    val t = V4Template(existing?.id ?: System.currentTimeMillis(), name.trim(), color, image, note.trim(), start, end, location.trim(), reminder, category, logoSize)
    Column(Modifier.fillMaxSize().background(V4Bg).statusBarsPadding().padding(horizontal = 16.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) { TextButton(onBack) { Text("Cancel", color = V4Text) }; Text(if (existing == null) "New Shift Type" else "Edit Shift Type", modifier = Modifier.weight(1f), textAlign = TextAlign.Center, fontSize = 20.sp, fontWeight = FontWeight.SemiBold); TextButton({ onSave(t) }, enabled = name.isNotBlank()) { Text("Save", color = V4Bronze, fontWeight = FontWeight.Bold) } }
        LazyColumn(Modifier.weight(1f)) { item {
            Spacer(Modifier.height(8.dp)); Card(Modifier.fillMaxWidth().height(190.dp), colors = CardDefaults.cardColors(V4Panel2), shape = RoundedCornerShape(22.dp)) { Box(Modifier.fillMaxSize()) { V4Hero(t.copy(name = name.ifBlank { "Your shift type" }), Modifier.fillMaxSize()); Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = .82f))))); Column(Modifier.align(Alignment.BottomStart).padding(16.dp)) { Text(name.ifBlank { "Your shift type" }, fontSize = 27.sp, fontWeight = FontWeight.Bold); Text("$category • ${v4Time(start)} – ${v4EndLabel(t.copy(startMinutes = start, endMinutes = end))}", color = V4Text.copy(alpha = .72f), fontSize = 13.sp) } } }
            Spacer(Modifier.height(12.dp)); Button({ picker.launch(arrayOf("image/*")) }, Modifier.fillMaxWidth().height(50.dp), colors = ButtonDefaults.buttonColors(V4Bronze, V4Bg), shape = RoundedCornerShape(14.dp)) { Icon(Icons.Outlined.Image, null); Spacer(Modifier.width(8.dp)); Text(if (image.isBlank()) "Upload your own picture / logo" else "Change picture / logo") }
            Spacer(Modifier.height(14.dp)); OutlinedTextField(name, { name = it }, label = { Text("Shift type name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(14.dp)); Text("Category", color = V4Muted, fontSize = 12.sp); Spacer(Modifier.height(7.dp)); Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { listOf("Work","Event","Custom").forEach { c -> V4Chip(c, category == c) { category = c } } }
            Spacer(Modifier.height(14.dp)); Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) { V4TimeCard("Start", start, Modifier.weight(1f)) { h,m -> start = h*60+m }; V4TimeCard("End", end, Modifier.weight(1f)) { h,m -> end = h*60+m } }
            Spacer(Modifier.height(14.dp)); OutlinedTextField(location, { location = it }, label = { Text("Location (optional)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(14.dp)); Text("Phone reminder", color = V4Muted, fontSize = 12.sp); Spacer(Modifier.height(7.dp)); LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) { items(listOf(0,15,30,60,120,1440)) { m -> V4Chip(if (m == 0) "Off" else v4ReminderLong(m), reminder == m) { reminder = m } } }
            Spacer(Modifier.height(16.dp)); Text("Logo size on calendar", fontSize = 17.sp, fontWeight = FontWeight.SemiBold); Text("This controls how much of each date cell your image fills.", color = V4Muted, fontSize = 11.sp); Spacer(Modifier.height(9.dp)); Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) { V4LogoSize.values().forEach { s -> V4LogoSizePreview(image, color, s, logoSize == s, Modifier.weight(1f)) { logoSize = s } } }
            Spacer(Modifier.height(16.dp)); Text("Calendar accent", fontSize = 17.sp, fontWeight = FontWeight.SemiBold); Spacer(Modifier.height(8.dp)); LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) { items(V4Palette) { c -> Box(Modifier.size(42.dp).background(Color(c), CircleShape).then(if (c == color) Modifier.border(3.dp, V4Text, CircleShape) else Modifier).clickable { color = c }) } }
            Spacer(Modifier.height(16.dp)); OutlinedTextField(note, { note = it }, label = { Text("Note (optional)") }, minLines = 3, modifier = Modifier.fillMaxWidth())
            if (onDelete != null) { Spacer(Modifier.height(18.dp)); OutlinedButton({ confirmDelete = true }, Modifier.fillMaxWidth().height(50.dp)) { Icon(Icons.Outlined.Delete, null); Spacer(Modifier.width(7.dp)); Text("Delete shift type") } }
            Spacer(Modifier.height(28.dp))
        } }
    }
    if (confirmDelete) AlertDialog(onDismissRequest = { confirmDelete = false }, confirmButton = { TextButton({ confirmDelete = false; onDelete?.invoke() }) { Text("Delete", color = Color(0xFFFF8585)) } }, dismissButton = { TextButton({ confirmDelete = false }) { Text("Cancel") } }, title = { Text("Delete shift type?") }, text = { Text("Dates using this type will also be cleared.") })
}

@Composable private fun V4LogoSizePreview(uri: String, color: Int, size: V4LogoSize, selected: Boolean, modifier: Modifier, onClick: () -> Unit) {
    val img = when(size) { V4LogoSize.SMALL -> 26.dp; V4LogoSize.MEDIUM -> 38.dp; V4LogoSize.LARGE -> 52.dp }
    Card(modifier.height(96.dp).then(if (selected) Modifier.border(1.8.dp, V4Bronze, RoundedCornerShape(15.dp)) else Modifier).clickable(onClick = onClick), colors = CardDefaults.cardColors(V4Panel2), shape = RoundedCornerShape(15.dp)) { Column(Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) { V4Photo(uri, color, img, RoundedCornerShape(7.dp)); Spacer(Modifier.height(5.dp)); Text(size.label, color = if (selected) V4Bronze else V4Muted, fontSize = 10.sp) } }
}

@Composable private fun V4TimeCard(label: String, minutes: Int, modifier: Modifier, onTime: (Int,Int) -> Unit) {
    val context = LocalContext.current
    Card(modifier.height(86.dp).clickable { TimePickerDialog(context, { _,h,m -> onTime(h,m) }, minutes/60, minutes%60, true).show() }, colors = CardDefaults.cardColors(V4Panel2), shape = RoundedCornerShape(16.dp)) { Column(Modifier.fillMaxSize().padding(14.dp), verticalArrangement = Arrangement.Center) { Text(label, color = V4Muted, fontSize = 11.sp); Text(v4Time(minutes), fontSize = 22.sp, fontWeight = FontWeight.SemiBold) } }
}

@Composable private fun V4AnalyticsScreen(month: YearMonth, templates: List<V4Template>, assignments: List<V4Assignment>, onMonth: (YearMonth) -> Unit) {
    val map = templates.associateBy { it.id }; val rows = assignments.filter { runCatching { YearMonth.from(LocalDate.parse(it.date)) == month }.getOrDefault(false) }; val counts = rows.groupingBy { it.templateId }.eachCount().toList().sortedByDescending { it.second }
    LazyColumn(Modifier.fillMaxSize().padding(horizontal = 18.dp)) { item { Text("Analytics", fontSize = 30.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 14.dp)); Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) { IconButton({ onMonth(month.minusMonths(1)) }) { Icon(Icons.Outlined.ChevronLeft,null) }; Text(month.atDay(1).format(DateTimeFormatter.ofPattern("MMMM yyyy")), Modifier.weight(1f), textAlign = TextAlign.Center); IconButton({ onMonth(month.plusMonths(1)) }) { Icon(Icons.Outlined.ChevronRight,null) } }; Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) { V4Stat("Scheduled days", rows.size.toString(), Modifier.weight(1f)); V4Stat("Shift types", counts.size.toString(), Modifier.weight(1f)) }; Spacer(Modifier.height(18.dp)); Text("Shifts by type", fontSize = 18.sp, fontWeight = FontWeight.SemiBold); Spacer(Modifier.height(8.dp)) }
        items(counts, key = { it.first }) { (id,count) -> map[id]?.let { t -> Row(Modifier.fillMaxWidth().padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) { V4Photo(t.imageUri, t.colorArgb, 42.dp, RoundedCornerShape(9.dp)); Spacer(Modifier.width(10.dp)); Text(t.name, Modifier.weight(1f)); Text(count.toString(), color = V4Bronze, fontWeight = FontWeight.SemiBold) } } }
    }
}

@Composable private fun V4Stat(label: String, value: String, modifier: Modifier) { Card(modifier, colors = CardDefaults.cardColors(V4Panel2), shape = RoundedCornerShape(16.dp)) { Column(Modifier.padding(14.dp)) { Text(label, color = V4Muted, fontSize = 11.sp); Text(value, fontSize = 25.sp, fontWeight = FontWeight.Bold) } } }

@Composable private fun V4SettingsScreen(store: V4Store, templates: List<V4Template>, assignments: List<V4Assignment>, notifications: Boolean, onNotifications: (Boolean) -> Unit, onManageTypes: () -> Unit) {
    val context = LocalContext.current; var job by remember { mutableStateOf(store.jobName()) }; var logo by remember { mutableStateOf(store.jobLogo()) }; var editJob by remember { mutableStateOf(false) }
    val logoPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? -> uri?.let { runCatching { context.contentResolver.takePersistableUriPermission(it, Intent.FLAG_GRANT_READ_URI_PERMISSION) }; logo = it.toString(); store.setJobLogo(logo) } }
    Column(Modifier.fillMaxSize().padding(horizontal = 18.dp)) { Text("Settings", fontSize = 30.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 14.dp)); Spacer(Modifier.height(16.dp)); Card(colors = CardDefaults.cardColors(V4Panel2), shape = RoundedCornerShape(18.dp)) { Row(Modifier.fillMaxWidth().padding(14.dp).clickable { editJob = true }, verticalAlignment = Alignment.CenterVertically) { V4Photo(logo, V4Bronze.hashCode(), 54.dp, RoundedCornerShape(12.dp)); Spacer(Modifier.width(12.dp)); Column(Modifier.weight(1f)) { Text(job, fontSize = 18.sp, fontWeight = FontWeight.SemiBold); Text("Work profile", color = V4Muted, fontSize = 11.sp) }; Icon(Icons.Outlined.ChevronRight,null,tint=V4Muted) } }; Spacer(Modifier.height(14.dp)); Text("Notifications", color = V4Muted, fontSize = 12.sp); Spacer(Modifier.height(6.dp)); Card(colors = CardDefaults.cardColors(V4Panel2), shape = RoundedCornerShape(18.dp)) { Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Outlined.Notifications,null,tint=V4Bronze); Spacer(Modifier.width(10.dp)); Column(Modifier.weight(1f)) { Text("Shift reminders"); Text("Phone notifications before shifts", color=V4Muted,fontSize=11.sp) }; Switch(notifications,onNotifications) } }; Spacer(Modifier.height(14.dp)); Card(colors = CardDefaults.cardColors(V4Panel2), shape = RoundedCornerShape(18.dp)) { V4SettingRow("Manage shift types", "${templates.size}", onManageTypes); HorizontalDivider(color=V4Divider); V4SettingRow("Change job logo", "Photo / logo") { logoPicker.launch(arrayOf("image/*")) }; HorizontalDivider(color=V4Divider); V4SettingRow("Appearance", "Dark") {}; HorizontalDivider(color=V4Divider); V4SettingRow("About", "Beta 0.4.0") {} } }
    if (editJob) { var v by remember(job) { mutableStateOf(job) }; AlertDialog(onDismissRequest={editJob=false},confirmButton={TextButton({job=v.trim().ifBlank{"Main Job"};store.setJobName(job);editJob=false}){Text("Save")}},dismissButton={TextButton({editJob=false}){Text("Cancel")}},title={Text("Job name")},text={OutlinedTextField(v,{v=it},singleLine=true)}) }
}

@Composable private fun V4SettingRow(label:String,value:String,onClick:()->Unit){Row(Modifier.fillMaxWidth().clickable(onClick=onClick).padding(15.dp),verticalAlignment=Alignment.CenterVertically){Text(label,Modifier.weight(1f));Text(value,color=V4Muted,fontSize=12.sp);Spacer(Modifier.width(4.dp));Icon(Icons.Outlined.ChevronRight,null,tint=V4Muted,modifier=Modifier.size(18.dp))}}

@Composable private fun V4Chip(text:String,selected:Boolean,onClick:()->Unit){Surface(color=if(selected)V4Bronze else V4Panel2,shape=RoundedCornerShape(16.dp),modifier=Modifier.clickable(onClick=onClick)){Text(text,color=if(selected)V4Bg else V4Text,fontSize=12.sp,modifier=Modifier.padding(horizontal=15.dp,vertical=8.dp))}}
@Composable private fun V4Empty(title:String,subtitle:String,onClick:(()->Unit)?=null){Card(Modifier.fillMaxWidth().then(if(onClick!=null)Modifier.clickable(onClick=onClick)else Modifier),colors=CardDefaults.cardColors(V4Panel2),shape=RoundedCornerShape(16.dp)){Column(Modifier.padding(15.dp)){Text(title,fontWeight=FontWeight.SemiBold);Text(subtitle,color=V4Muted,fontSize=11.sp)}}}
@Composable private fun V4Photo(uri:String,color:Int,size:Dp,shape:androidx.compose.ui.graphics.Shape){val context=LocalContext.current;val bmp=remember(uri){if(uri.isBlank())null else runCatching{context.contentResolver.openInputStream(Uri.parse(uri))?.use{BitmapFactory.decodeStream(it)}?.asImageBitmap()}.getOrNull()};Box(Modifier.size(size).clip(shape).background(Color(color)),contentAlignment=Alignment.Center){if(bmp!=null)Image(bmp,null,Modifier.fillMaxSize(),contentScale=ContentScale.Crop)else Text("+",color=V4Bg,fontWeight=FontWeight.Bold)}}
@Composable private fun V4Hero(t:V4Template,modifier:Modifier){val context=LocalContext.current;val bmp=remember(t.imageUri){if(t.imageUri.isBlank())null else runCatching{context.contentResolver.openInputStream(Uri.parse(t.imageUri))?.use{BitmapFactory.decodeStream(it)}?.asImageBitmap()}.getOrNull()};Box(modifier.background(Brush.linearGradient(listOf(Color(t.colorArgb).copy(alpha=.8f),V4Panel3)))){if(bmp!=null)Image(bmp,null,Modifier.fillMaxSize(),contentScale=ContentScale.Crop)else Text(t.name.take(2).uppercase(),modifier=Modifier.align(Alignment.Center),fontSize=32.sp,fontWeight=FontWeight.Bold,color=V4Text)}}

private fun v4Time(m:Int)=String.format(Locale.getDefault(),"%02d:%02d",(m/60)%24,m%60)
private fun v4EndLabel(t:V4Template)=v4Time(t.endMinutes)+if(t.endMinutes<=t.startMinutes)" (+1)" else ""
private fun v4ReminderShort(m:Int)=when{m>=1440->"1d";m>=60->"${m/60}h";else->"${m}m"}
private fun v4ReminderLong(m:Int)=when{m>=1440->"1 day before";m>=60->"${m/60}h before";else->"${m}m"}
