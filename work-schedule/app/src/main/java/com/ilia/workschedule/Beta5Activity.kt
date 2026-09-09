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
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.LruCache
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
import androidx.compose.foundation.gestures.detectTapGestures
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
import androidx.compose.ui.graphics.ImageBitmap
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
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sqrt

private val B5Gold = Color(0xFFE9B95C)
private val B5Bg = Color(0xFF080D11)
private val B5Panel = Color(0xFF11181D)
private val B5Panel2 = Color(0xFF192127)
private val B5Text = Color(0xFFF7F4ED)
private val B5Muted = Color(0xFF9099A2)
private val B5Divider = Color.White.copy(alpha = .075f)

private val B5PresetColors = listOf(
    0xFFE9B95C.toInt(), 0xFF4FB6FF.toInt(), 0xFFE359B7.toInt(), 0xFF51C86B.toInt(),
    0xFF7A43E8.toInt(), 0xFFF14646.toInt(), 0xFF60D4CC.toInt(), 0xFFFF8C63.toInt(),
    0xFF9DCC4D.toInt(), 0xFF7D8DFF.toInt(), 0xFFF3D266.toInt(), 0xFFDD86E5.toInt()
)

private enum class B5LogoSize(val label: String, val cellDp: Int) {
    SMALL("Small", 26), MEDIUM("Medium", 34), LARGE("Large", 43)
}

private data class B5Template(
    val id: Long = System.currentTimeMillis(),
    val name: String,
    val outlineArgb: Int = B5PresetColors.first(),
    val imageUri: String = "",
    val note: String = "",
    val startMinutes: Int = 18 * 60,
    val endMinutes: Int = 2 * 60,
    val location: String = "",
    val reminderMinutes: Int = 60,
    val category: String = "Work",
    val logoSize: B5LogoSize = B5LogoSize.LARGE
)

private data class B5Assignment(val date: String, val templateId: Long)

private class B5Store(private val context: Context) {
    private val prefs = context.getSharedPreferences("work_schedule_beta", Context.MODE_PRIVATE)

    fun jobName(): String = prefs.getString("job", "Main Job") ?: "Main Job"
    fun setJobName(v: String) = prefs.edit().putString("job", v).apply()
    fun notificationsEnabled(): Boolean = prefs.getBoolean("notifications_v3", true)
    fun setNotificationsEnabled(v: Boolean) = prefs.edit().putBoolean("notifications_v3", v).apply()

    fun loadTemplates(): List<B5Template> {
        prefs.getString("templates_v5", null)?.let { return decodeV5(it) }
        val old = prefs.getString("templates_v4", null) ?: prefs.getString("templates_v3", "[]") ?: "[]"
        val migrated = decodeLegacy(old)
        saveTemplates(migrated)
        return migrated
    }

    private fun decodeV5(raw: String): List<B5Template> {
        val a = runCatching { JSONArray(raw) }.getOrElse { JSONArray() }
        return (0 until a.length()).map { i ->
            val o = a.getJSONObject(i)
            B5Template(
                id = o.optLong("id", System.currentTimeMillis() + i),
                name = o.optString("name", "Shift"),
                outlineArgb = o.optInt("outline", o.optInt("color", B5PresetColors[i % B5PresetColors.size])),
                imageUri = o.optString("image", ""),
                note = o.optString("note", ""),
                startMinutes = o.optInt("start", 18 * 60),
                endMinutes = o.optInt("end", 2 * 60),
                location = o.optString("location", ""),
                reminderMinutes = o.optInt("reminder", 60),
                category = o.optString("category", "Work"),
                logoSize = runCatching { B5LogoSize.valueOf(o.optString("logoSize", "LARGE")) }.getOrDefault(B5LogoSize.LARGE)
            )
        }
    }

    private fun decodeLegacy(raw: String): List<B5Template> {
        val a = runCatching { JSONArray(raw) }.getOrElse { JSONArray() }
        return (0 until a.length()).map { i ->
            val o = a.getJSONObject(i)
            B5Template(
                id = o.optLong("id", System.currentTimeMillis() + i),
                name = o.optString("name", "Shift"),
                outlineArgb = o.optInt("color", B5PresetColors[i % B5PresetColors.size]),
                imageUri = o.optString("image", ""),
                note = o.optString("note", ""),
                startMinutes = o.optInt("start", 18 * 60),
                endMinutes = o.optInt("end", 2 * 60),
                location = o.optString("location", ""),
                reminderMinutes = o.optInt("reminder", 60),
                category = o.optString("category", "Work"),
                logoSize = runCatching { B5LogoSize.valueOf(o.optString("logoSize", "LARGE")) }.getOrDefault(B5LogoSize.LARGE)
            )
        }
    }

    fun saveTemplates(items: List<B5Template>) {
        val a = JSONArray()
        items.forEach { t ->
            a.put(JSONObject().apply {
                put("id", t.id); put("name", t.name); put("outline", t.outlineArgb); put("image", t.imageUri)
                put("note", t.note); put("start", t.startMinutes); put("end", t.endMinutes); put("location", t.location)
                put("reminder", t.reminderMinutes); put("category", t.category); put("logoSize", t.logoSize.name)
            })
        }
        prefs.edit().putString("templates_v5", a.toString()).apply()
    }

    fun loadAssignments(): List<B5Assignment> {
        val raw = prefs.getString("assignments_v2", "[]") ?: "[]"
        val a = runCatching { JSONArray(raw) }.getOrElse { JSONArray() }
        return (0 until a.length()).mapNotNull { i ->
            val o = a.getJSONObject(i)
            val d = o.optString("date", "")
            if (d.isBlank()) null else B5Assignment(d, o.optLong("templateId"))
        }.distinctBy { it.date }
    }

    fun saveAssignments(items: List<B5Assignment>) {
        val a = JSONArray()
        items.distinctBy { it.date }.forEach { x ->
            a.put(JSONObject().apply { put("date", x.date); put("templateId", x.templateId) })
        }
        prefs.edit().putString("assignments_v2", a.toString()).apply()
    }
}

private object B5ImageCache : LruCache<String, Bitmap>(24) {}

private fun b5LoadBitmap(context: Context, uri: String): Bitmap? {
    if (uri.isBlank()) return null
    B5ImageCache.get(uri)?.let { return it }
    val original = runCatching {
        context.contentResolver.openInputStream(Uri.parse(uri))?.use { BitmapFactory.decodeStream(it) }
    }.getOrNull() ?: return null
    val maxSide = maxOf(original.width, original.height)
    val finalBitmap = if (maxSide > 640) {
        val scale = 640f / maxSide.toFloat()
        Bitmap.createScaledBitmap(
            original,
            (original.width * scale).roundToInt().coerceAtLeast(1),
            (original.height * scale).roundToInt().coerceAtLeast(1),
            true
        ).also { if (it !== original) original.recycle() }
    } else original
    B5ImageCache.put(uri, finalBitmap)
    return finalBitmap
}

@Composable
private fun b5RememberImage(uri: String): ImageBitmap? {
    val context = LocalContext.current
    return remember(uri) { b5LoadBitmap(context, uri)?.asImageBitmap() }
}

class Beta5Activity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        b5CreateChannel(this)
        setContent { B5Theme { B5App() } }
    }
}

class Beta5ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val title = intent.getStringExtra("title") ?: "Upcoming shift"
        val text = intent.getStringExtra("text") ?: "Your shift is coming up"
        val id = intent.getIntExtra("id", 1)
        val open = PendingIntent.getActivity(
            context, id, Intent(context, Beta5Activity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val b = NotificationCompat.Builder(context, "work_schedule_v5")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setContentIntent(open)
        intent.getStringExtra("image").orEmpty().takeIf { it.isNotBlank() }?.let { image ->
            b5LoadBitmap(context, image)?.let { b.setLargeIcon(it) }
        }
        if (Build.VERSION.SDK_INT < 33 || ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
            (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).notify(id, b.build())
        }
    }
}

class Beta5BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val s = B5Store(context)
            if (s.notificationsEnabled()) b5ScheduleAll(context, s.loadTemplates(), s.loadAssignments())
        }
    }
}

private fun b5CreateChannel(context: Context) {
    if (Build.VERSION.SDK_INT >= 26) {
        (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(
            NotificationChannel("work_schedule_v5", "Shift reminders", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Upcoming shift reminders"
            }
        )
    }
}

private fun b5ReminderId(a: B5Assignment): Int = abs((a.date + "|" + a.templateId).hashCode()).coerceAtLeast(1)

private fun b5Cancel(context: Context, a: B5Assignment) {
    val p = PendingIntent.getBroadcast(context, b5ReminderId(a), Intent(context, Beta5ReminderReceiver::class.java), PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE)
    p?.let { (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(it); it.cancel() }
}

private fun b5ScheduleAll(context: Context, templates: List<B5Template>, assignments: List<B5Assignment>) {
    val map = templates.associateBy { it.id }
    assignments.forEach { a -> map[a.templateId]?.let { b5Schedule(context, a, it) } }
}

private fun b5Schedule(context: Context, a: B5Assignment, t: B5Template) {
    b5Cancel(context, a)
    if (t.reminderMinutes <= 0) return
    val d = runCatching { LocalDate.parse(a.date) }.getOrNull() ?: return
    val start = LocalDateTime.of(d, LocalTime.of(t.startMinutes / 60, t.startMinutes % 60))
    val trigger = start.minusMinutes(t.reminderMinutes.toLong()).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
    if (trigger <= System.currentTimeMillis()) return
    val label = when {
        t.reminderMinutes >= 1440 -> "Tomorrow at ${b5Time(t.startMinutes)}"
        t.reminderMinutes >= 60 -> "Starts in ${t.reminderMinutes / 60}h at ${b5Time(t.startMinutes)}"
        else -> "Starts in ${t.reminderMinutes} min at ${b5Time(t.startMinutes)}"
    }
    val text = label + if (t.location.isBlank()) "" else " • ${t.location}"
    val i = Intent(context, Beta5ReminderReceiver::class.java).putExtra("title", t.name).putExtra("text", text)
        .putExtra("id", b5ReminderId(a)).putExtra("image", t.imageUri)
    val p = PendingIntent.getBroadcast(context, b5ReminderId(a), i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, p)
}

@Composable
private fun B5Theme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(primary = B5Gold, background = B5Bg, surface = B5Panel, surfaceVariant = B5Panel2, onBackground = B5Text, onSurface = B5Text),
        content = content
    )
}

private enum class B5Tab { CALENDAR, SHIFTS, ANALYTICS, SETTINGS }
private sealed interface B5Route {
    data object Main : B5Route
    data class DatePreview(val date: LocalDate) : B5Route
    data object TypeLibrary : B5Route
    data class TypeEditor(val id: Long? = null) : B5Route
}

@Composable
private fun B5App() {
    val context = LocalContext.current
    val store = remember { B5Store(context) }
    var templates by remember { mutableStateOf(store.loadTemplates()) }
    var assignments by remember { mutableStateOf(store.loadAssignments()) }
    var notifications by remember { mutableStateOf(store.notificationsEnabled()) }
    var tab by remember { mutableStateOf(B5Tab.CALENDAR) }
    var route: B5Route by remember { mutableStateOf(B5Route.Main) }
    var month by remember { mutableStateOf(YearMonth.now()) }
    var selectedDate by remember { mutableStateOf(LocalDate.now()) }
    var paintMode by remember { mutableStateOf(false) }
    var selectedTemplateId by remember { mutableStateOf<Long?>(templates.firstOrNull()?.id) }

    val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {}
    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) permission.launch(Manifest.permission.POST_NOTIFICATIONS)
    }
    LaunchedEffect(templates, assignments, notifications) {
        if (notifications) b5ScheduleAll(context, templates, assignments) else assignments.forEach { b5Cancel(context, it) }
    }

    fun saveTemplates(v: List<B5Template>) {
        templates = v
        store.saveTemplates(v)
        if (selectedTemplateId !in v.map { it.id }) selectedTemplateId = v.firstOrNull()?.id
    }
    fun saveAssignments(v: List<B5Assignment>) {
        assignments = v.distinctBy { it.date }
        store.saveAssignments(assignments)
    }
    fun paint(date: LocalDate) {
        val id = selectedTemplateId ?: return
        val key = date.toString()
        val existing = assignments.firstOrNull { it.date == key }
        saveAssignments(if (existing?.templateId == id) assignments.filterNot { it.date == key } else assignments.filterNot { it.date == key } + B5Assignment(key, id))
        selectedDate = date
        month = YearMonth.from(date)
    }

    BackHandler(enabled = route !is B5Route.Main) { route = B5Route.Main }
    when (val r = route) {
        B5Route.Main -> Scaffold(containerColor = B5Bg, bottomBar = { B5BottomBar(tab) { tab = it } }) { p ->
            Box(Modifier.fillMaxSize().padding(p).statusBarsPadding()) {
                when (tab) {
                    B5Tab.CALENDAR -> B5CalendarScreen(store.jobName(), month, selectedDate, templates, assignments, paintMode, selectedTemplateId,
                        onMonth = { month = it }, onTogglePaint = { if (templates.isEmpty()) route = B5Route.TypeEditor() else paintMode = !paintMode },
                        onSelectType = { selectedTemplateId = it; paintMode = true },
                        onDate = { d -> if (paintMode) paint(d) else { selectedDate = d; route = B5Route.DatePreview(d) } },
                        onManageTypes = { route = B5Route.TypeLibrary }, onSeeAll = { tab = B5Tab.SHIFTS })
                    B5Tab.SHIFTS -> B5ShiftsScreen(templates, assignments,
                        onDate = { selectedDate = it; route = B5Route.DatePreview(it) }, onManage = { route = B5Route.TypeLibrary })
                    B5Tab.ANALYTICS -> B5AnalyticsScreen(month, templates, assignments) { month = it }
                    B5Tab.SETTINGS -> B5SettingsScreen(store, templates.size, notifications,
                        onNotifications = { notifications = it; store.setNotificationsEnabled(it) }, onTypes = { route = B5Route.TypeLibrary })
                }
            }
        }
        is B5Route.DatePreview -> {
            val a = assignments.firstOrNull { it.date == r.date.toString() }
            val t = a?.let { x -> templates.firstOrNull { it.id == x.templateId } }
            B5DatePreview(r.date, t, onBack = { route = B5Route.Main }, onEdit = { t?.let { route = B5Route.TypeEditor(it.id) } }, onRemove = {
                saveAssignments(assignments.filterNot { it.date == r.date.toString() }); route = B5Route.Main
            })
        }
        B5Route.TypeLibrary -> B5TypeLibrary(templates, onBack = { route = B5Route.Main }, onCreate = { route = B5Route.TypeEditor() }, onOpen = { route = B5Route.TypeEditor(it.id) })
        is B5Route.TypeEditor -> {
            val existing = r.id?.let { id -> templates.firstOrNull { it.id == id } }
            B5TypeEditor(existing, templates.map { it.outlineArgb }.distinct(), onBack = { route = B5Route.TypeLibrary }, onSave = { t ->
                saveTemplates(if (existing == null) templates + t else templates.map { if (it.id == t.id) t else it })
                selectedTemplateId = t.id
                route = B5Route.TypeLibrary
            }, onDelete = if (existing == null) null else {{
                saveTemplates(templates.filterNot { it.id == existing.id })
                saveAssignments(assignments.filterNot { it.templateId == existing.id })
                route = B5Route.TypeLibrary
            }})
        }
    }
}

@Composable
private fun B5BottomBar(tab: B5Tab, onTab: (B5Tab) -> Unit) {
    NavigationBar(containerColor = B5Bg, modifier = Modifier.navigationBarsPadding()) {
        val items = listOf(B5Tab.CALENDAR to Icons.Outlined.CalendarMonth, B5Tab.SHIFTS to Icons.Outlined.Work, B5Tab.ANALYTICS to Icons.Outlined.Analytics, B5Tab.SETTINGS to Icons.Outlined.Settings)
        items.forEach { (item, icon) ->
            NavigationBarItem(selected = item == tab, onClick = { onTab(item) }, icon = { Icon(icon, null) },
                label = { Text(item.name.lowercase().replaceFirstChar { it.uppercase() }, fontSize = 10.sp) },
                colors = NavigationBarItemDefaults.colors(selectedIconColor = B5Gold, selectedTextColor = B5Gold, indicatorColor = B5Gold.copy(alpha = .1f), unselectedIconColor = B5Muted, unselectedTextColor = B5Muted))
        }
    }
}

@Composable
private fun B5CalendarScreen(jobName: String, month: YearMonth, selectedDate: LocalDate, templates: List<B5Template>, assignments: List<B5Assignment>, paintMode: Boolean, selectedTemplateId: Long?, onMonth: (YearMonth) -> Unit, onTogglePaint: () -> Unit, onSelectType: (Long) -> Unit, onDate: (LocalDate) -> Unit, onManageTypes: () -> Unit, onSeeAll: () -> Unit) {
    var drag by remember { mutableStateOf(0f) }
    val fmt = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.getDefault())
    val map = templates.associateBy { it.id }
    val upcoming = assignments.mapNotNull { a ->
        val d = runCatching { LocalDate.parse(a.date) }.getOrNull() ?: return@mapNotNull null
        val t = map[a.templateId] ?: return@mapNotNull null
        if (d.isBefore(LocalDate.now())) null else d to t
    }.sortedBy { it.first }.take(2)
    LazyColumn(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
        item {
            Spacer(Modifier.height(10.dp))
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column { Text(jobName + "⌄", fontSize = 27.sp, fontWeight = FontWeight.Bold); Text(if (paintMode) "Assignment mode • tap dates" else "Plan your work, your life", color = B5Muted, fontSize = 11.sp) }
                Spacer(Modifier.weight(1f)); IconButton(onClick = onSeeAll) { Icon(Icons.Outlined.Notifications, null, tint = B5Gold) }; IconButton(onClick = onManageTypes) { Icon(Icons.Outlined.Settings, null) }
            }
            Spacer(Modifier.height(14.dp))
            Card(colors = CardDefaults.cardColors(containerColor = B5Panel), shape = RoundedCornerShape(22.dp), modifier = Modifier.border(1.dp, B5Divider, RoundedCornerShape(22.dp))) {
                Row(Modifier.fillMaxWidth().padding(horizontal = 10.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                    IconButton({ onMonth(month.minusMonths(1)) }) { Icon(Icons.Outlined.ChevronLeft, null, tint = B5Muted) }
                    Text(fmt.format(month.atDay(1)), fontSize = 21.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
                    IconButton({ onMonth(month.plusMonths(1)) }) { Icon(Icons.Outlined.ChevronRight, null, tint = B5Muted) }
                    Spacer(Modifier.width(2.dp))
                    Box(Modifier.size(46.dp).clip(CircleShape).background(Brush.radialGradient(listOf(Color(0xFFFFD98A), B5Gold))).clickable(onClick = onTogglePaint), contentAlignment = Alignment.Center) {
                        Icon(if (paintMode) Icons.Outlined.Check else Icons.Outlined.Add, null, tint = B5Bg)
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth()) { listOf("Mon","Tue","Wed","Thu","Fri","Sat","Sun").forEachIndexed { i, d -> Text(d, color = if (i > 4) B5Muted else B5Text, fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.weight(1f)) } }
            Spacer(Modifier.height(6.dp))
            Card(colors = CardDefaults.cardColors(containerColor = B5Panel), shape = RoundedCornerShape(22.dp), modifier = Modifier.fillMaxWidth().border(1.dp, B5Divider, RoundedCornerShape(22.dp)).pointerInput(month) {
                detectHorizontalDragGestures(onHorizontalDrag = { _, amount -> drag += amount }, onDragEnd = { if (drag > 80f) onMonth(month.minusMonths(1)); if (drag < -80f) onMonth(month.plusMonths(1)); drag = 0f })
            }) { B5MonthGrid(month, selectedDate, assignments, map, onDate) }
            Spacer(Modifier.height(15.dp))
            if (paintMode && templates.isNotEmpty()) {
                Text("Choose a shift type, then tap as many dates as you want.", color = B5Muted, fontSize = 11.sp); Spacer(Modifier.height(8.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(9.dp)) { items(templates, key = { it.id }) { t -> B5MiniType(t, selectedTemplateId == t.id) { onSelectType(t.id) } } }
                Spacer(Modifier.height(12.dp))
            }
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column { Text("Upcoming", fontSize = 20.sp, fontWeight = FontWeight.Bold); Text("Next scheduled shifts", color = B5Muted, fontSize = 11.sp) }
                Spacer(Modifier.weight(1f)); TextButton(onClick = onSeeAll) { Text("See all", color = B5Gold) }
            }
            if (upcoming.isEmpty()) B5Empty("Nothing scheduled", "Select a shift type and tap a date.") else upcoming.forEach { (d, t) -> B5UpcomingCard(d, t) }
            Spacer(Modifier.height(18.dp))
        }
    }
}

@Composable
private fun B5MonthGrid(month: YearMonth, selectedDate: LocalDate, assignments: List<B5Assignment>, templates: Map<Long, B5Template>, onDate: (LocalDate) -> Unit) {
    val first = month.atDay(1); val start = first.minusDays((first.dayOfWeek.value - 1).toLong()); val byDate = assignments.associateBy { it.date }
    Column(Modifier.padding(8.dp)) {
        repeat(6) { row -> Row(Modifier.fillMaxWidth()) {
            repeat(7) { col -> val date = start.plusDays((row * 7 + col).toLong()); val t = byDate[date.toString()]?.let { templates[it.templateId] }
                B5DateCell(date, YearMonth.from(date) == month, date == selectedDate, t, Modifier.weight(1f)) { onDate(date) }
            }
        } }
    }
}

@Composable
private fun B5DateCell(date: LocalDate, inMonth: Boolean, selected: Boolean, template: B5Template?, modifier: Modifier, onClick: () -> Unit) {
    val shape = RoundedCornerShape(10.dp)
    Box(modifier.padding(1.5.dp).height(68.dp).clip(shape).background(if (selected) B5Gold.copy(alpha = .09f) else Color.Transparent).then(if (selected) Modifier.border(1.3.dp, B5Gold, shape) else Modifier).clickable(onClick = onClick)) {
        Text(date.dayOfMonth.toString(), color = if (inMonth) B5Text else B5Muted.copy(alpha = .38f), fontSize = 12.sp, modifier = Modifier.align(Alignment.TopStart).padding(4.dp))
        if (template != null) {
            B5OutlinedLogo(template, template.logoSize.cellDp.dp, Modifier.align(Alignment.Center).padding(top = 3.dp))
            Text(template.name, color = Color(template.outlineArgb), fontSize = 7.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis, textAlign = TextAlign.Center, modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(horizontal = 2.dp, vertical = 2.dp))
        }
    }
}

@Composable
private fun B5OutlinedLogo(template: B5Template, size: Dp, modifier: Modifier = Modifier) {
    val img = b5RememberImage(template.imageUri); val outline = Color(template.outlineArgb); val shape = RoundedCornerShape(8.dp)
    Box(modifier.size(size).clip(shape).background(Color(0xFF0C1115)).border(2.dp, outline, shape), contentAlignment = Alignment.Center) {
        if (img != null) Image(img, null, Modifier.fillMaxSize().padding(2.dp), contentScale = ContentScale.Crop)
        else Text(template.name.take(2).uppercase(), color = outline, fontWeight = FontWeight.Bold, fontSize = (size.value * .28f).sp)
    }
}

@Composable
private fun B5UpcomingCard(date: LocalDate, t: B5Template) {
    val days = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), date); val whenText = when (days) { 0L -> "Today"; 1L -> "Tomorrow"; else -> date.format(DateTimeFormatter.ofPattern("EEE, d MMM")) }
    Card(Modifier.fillMaxWidth().padding(vertical = 3.dp).height(66.dp), colors = CardDefaults.cardColors(containerColor = B5Panel2), shape = RoundedCornerShape(16.dp)) {
        Row(Modifier.fillMaxSize().padding(7.dp), verticalAlignment = Alignment.CenterVertically) {
            B5OutlinedLogo(t, 48.dp); Spacer(Modifier.width(10.dp)); Column(Modifier.weight(1f)) { Text(t.name, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, maxLines = 1); Text("$whenText • ${b5Time(t.startMinutes)} – ${b5End(t)}", color = B5Muted, fontSize = 10.sp, maxLines = 1) }
            if (t.reminderMinutes > 0) Surface(color = Color(t.outlineArgb).copy(alpha = .11f), shape = RoundedCornerShape(11.dp)) { Row(Modifier.padding(horizontal = 8.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Outlined.Notifications, null, tint = Color(t.outlineArgb), modifier = Modifier.size(14.dp)); Spacer(Modifier.width(3.dp)); Text(b5ReminderShort(t.reminderMinutes), color = Color(t.outlineArgb), fontSize = 9.sp) } }
        }
    }
}

@Composable
private fun B5MiniType(t: B5Template, selected: Boolean, onClick: () -> Unit) {
    Card(Modifier.width(100.dp).height(82.dp).then(if (selected) Modifier.border(1.5.dp, Color(t.outlineArgb), RoundedCornerShape(15.dp)) else Modifier).clickable(onClick = onClick), colors = CardDefaults.cardColors(containerColor = B5Panel2), shape = RoundedCornerShape(15.dp)) {
        Column(Modifier.fillMaxSize().padding(7.dp), horizontalAlignment = Alignment.CenterHorizontally) { B5OutlinedLogo(t, 46.dp); Spacer(Modifier.height(4.dp)); Text(t.name, fontSize = 9.sp, maxLines = 1, overflow = TextOverflow.Ellipsis) }
    }
}

@Composable
private fun B5DatePreview(date: LocalDate, template: B5Template?, onBack: () -> Unit, onEdit: () -> Unit, onRemove: () -> Unit) {
    Column(Modifier.fillMaxSize().background(B5Bg).statusBarsPadding().padding(horizontal = 16.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) { IconButton(onClick = onBack) { Icon(Icons.Outlined.ArrowBack, "Back") }; Text(date.format(DateTimeFormatter.ofPattern("EEE, d MMMM yyyy")), fontSize = 18.sp, fontWeight = FontWeight.SemiBold) }
        Spacer(Modifier.height(10.dp))
        if (template == null) { B5Empty("No shift on this date", "Go back, select a shift type and assign it."); return@Column }
        val t = template
        Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = B5Panel), shape = RoundedCornerShape(24.dp)) {
            Column(Modifier.fillMaxWidth().padding(18.dp), horizontalAlignment = Alignment.CenterHorizontally) { Text(date.dayOfMonth.toString(), modifier = Modifier.align(Alignment.Start), fontSize = 30.sp, fontWeight = FontWeight.Bold); Spacer(Modifier.height(4.dp)); B5OutlinedLogo(t, 190.dp); Spacer(Modifier.height(14.dp)); Text(t.name, fontSize = 28.sp, fontWeight = FontWeight.Bold); Text("${b5Time(t.startMinutes)} – ${b5End(t)}", color = B5Muted); if (t.location.isNotBlank()) Text(t.location, color = B5Muted, fontSize = 12.sp) }
        }
        Spacer(Modifier.height(14.dp))
        Card(colors = CardDefaults.cardColors(containerColor = B5Panel2), shape = RoundedCornerShape(18.dp)) { Column(Modifier.fillMaxWidth().padding(14.dp)) { B5Info(Icons.Outlined.Schedule, "Time", "${b5Time(t.startMinutes)} – ${b5End(t)}"); if (t.location.isNotBlank()) B5Info(Icons.Outlined.LocationOn, "Location", t.location); B5Info(Icons.Outlined.Notifications, "Reminder", if (t.reminderMinutes <= 0) "Off" else b5ReminderLong(t.reminderMinutes)); if (t.note.isNotBlank()) B5Info(Icons.Outlined.Notes, "Note", t.note) } }
        Spacer(Modifier.height(14.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) { Button(onClick = onEdit, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = B5Gold, contentColor = B5Bg)) { Icon(Icons.Outlined.Edit, null); Spacer(Modifier.width(6.dp)); Text("Edit") }; OutlinedButton(onClick = onRemove, modifier = Modifier.weight(1f)) { Icon(Icons.Outlined.Delete, null); Spacer(Modifier.width(6.dp)); Text("Remove") } }
    }
}

@Composable
private fun B5Info(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String) { Row(Modifier.fillMaxWidth().padding(vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) { Icon(icon, null, tint = B5Gold, modifier = Modifier.size(18.dp)); Spacer(Modifier.width(10.dp)); Text(label, color = B5Muted, fontSize = 11.sp, modifier = Modifier.width(68.dp)); Text(value, fontSize = 12.sp, modifier = Modifier.weight(1f)) } }

@Composable
private fun B5ShiftsScreen(templates: List<B5Template>, assignments: List<B5Assignment>, onDate: (LocalDate) -> Unit, onManage: () -> Unit) {
    val map = templates.associateBy { it.id }; var filter by remember { mutableStateOf("Upcoming") }; val today = LocalDate.now()
    val rows = assignments.mapNotNull { a -> val d = runCatching { LocalDate.parse(a.date) }.getOrNull() ?: return@mapNotNull null; val t = map[a.templateId] ?: return@mapNotNull null; d to t }.filter { (d, _) -> when (filter) { "Past" -> d.isBefore(today); "All" -> true; else -> !d.isBefore(today) } }.sortedBy { it.first }
    LazyColumn(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
        item { Row(Modifier.fillMaxWidth().padding(top = 12.dp), verticalAlignment = Alignment.CenterVertically) { Text("Shifts", fontSize = 29.sp, fontWeight = FontWeight.Bold); Spacer(Modifier.weight(1f)); IconButton(onClick = onManage) { Icon(Icons.Outlined.GridView, null, tint = B5Gold) } }; Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { listOf("Upcoming","Past","All").forEach { x -> B5Chip(x, filter == x) { filter = x } } }; Spacer(Modifier.height(12.dp)) }
        items(rows, key = { it.first.toString() }) { (d, t) -> Card(Modifier.fillMaxWidth().padding(vertical = 4.dp).height(72.dp).clickable { onDate(d) }, colors = CardDefaults.cardColors(containerColor = B5Panel2), shape = RoundedCornerShape(16.dp)) { Row(Modifier.fillMaxSize().padding(7.dp), verticalAlignment = Alignment.CenterVertically) { B5OutlinedLogo(t, 52.dp); Spacer(Modifier.width(10.dp)); Column(Modifier.weight(1f)) { Text(d.format(DateTimeFormatter.ofPattern("EEE, d MMM")), color = B5Muted, fontSize = 9.sp); Text(t.name, fontWeight = FontWeight.SemiBold); Text("${b5Time(t.startMinutes)} – ${b5End(t)}" + if (t.location.isBlank()) "" else " • ${t.location}", color = B5Muted, fontSize = 10.sp, maxLines = 1) }; Icon(Icons.Outlined.ChevronRight, null, tint = B5Muted) } } }
        item { Spacer(Modifier.height(16.dp)); OutlinedButton(onClick = onManage, Modifier.fillMaxWidth().height(50.dp)) { Icon(Icons.Outlined.GridView, null); Spacer(Modifier.width(7.dp)); Text("Manage shift types") }; Spacer(Modifier.height(20.dp)) }
    }
}

@Composable
private fun B5TypeLibrary(templates: List<B5Template>, onBack: () -> Unit, onCreate: () -> Unit, onOpen: (B5Template) -> Unit) {
    var category by remember { mutableStateOf("All") }; val shown = if (category == "All") templates else templates.filter { it.category == category }
    LazyColumn(Modifier.fillMaxSize().background(B5Bg).statusBarsPadding().padding(horizontal = 14.dp)) {
        item { Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) { IconButton(onClick = onBack) { Icon(Icons.Outlined.ArrowBack, "Back") }; Text("Shift Types", fontSize = 23.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f), textAlign = TextAlign.Center); IconButton(onClick = onCreate) { Icon(Icons.Outlined.Add, null, tint = B5Gold) } }; LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) { items(listOf("All","Work","Event","Custom")) { c -> B5Chip(c, category == c) { category = c } } }; Spacer(Modifier.height(12.dp)) }
        items(shown.chunked(2)) { pair -> Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) { pair.forEach { t -> B5LibraryCard(t, Modifier.weight(1f)) { onOpen(t) } }; if (pair.size == 1) Spacer(Modifier.weight(1f)) }; Spacer(Modifier.height(10.dp)) }
        item { OutlinedButton(onClick = onCreate, Modifier.fillMaxWidth().height(52.dp), colors = ButtonDefaults.outlinedButtonColors(contentColor = B5Gold)) { Icon(Icons.Outlined.Add, null); Spacer(Modifier.width(6.dp)); Text("Create new shift type") }; Spacer(Modifier.height(24.dp)) }
    }
}

@Composable
private fun B5LibraryCard(t: B5Template, modifier: Modifier, onClick: () -> Unit) { Card(modifier.height(154.dp).clickable(onClick = onClick), colors = CardDefaults.cardColors(containerColor = B5Panel2), shape = RoundedCornerShape(17.dp)) { Column(Modifier.fillMaxSize().padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) { B5OutlinedLogo(t, 96.dp); Spacer(Modifier.height(6.dp)); Text(t.name, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis); Text(t.category, color = B5Muted, fontSize = 9.sp) } } }

@Composable
private fun B5TypeEditor(existing: B5Template?, usedColors: List<Int>, onBack: () -> Unit, onSave: (B5Template) -> Unit, onDelete: (() -> Unit)?) {
    val context = LocalContext.current
    var name by remember(existing?.id) { mutableStateOf(existing?.name ?: "") }; var image by remember(existing?.id) { mutableStateOf(existing?.imageUri ?: "") }; var outline by remember(existing?.id) { mutableStateOf(existing?.outlineArgb ?: B5PresetColors.first()) }; var note by remember(existing?.id) { mutableStateOf(existing?.note ?: "") }
    var start by remember(existing?.id) { mutableStateOf(existing?.startMinutes ?: 18 * 60) }; var end by remember(existing?.id) { mutableStateOf(existing?.endMinutes ?: 2 * 60) }; var location by remember(existing?.id) { mutableStateOf(existing?.location ?: "") }; var reminder by remember(existing?.id) { mutableStateOf(existing?.reminderMinutes ?: 60) }; var category by remember(existing?.id) { mutableStateOf(existing?.category ?: "Work") }; var logoSize by remember(existing?.id) { mutableStateOf(existing?.logoSize ?: B5LogoSize.LARGE) }; var colorPicker by remember { mutableStateOf(false) }; var confirmDelete by remember { mutableStateOf(false) }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? -> uri?.let { runCatching { context.contentResolver.takePersistableUriPermission(it, Intent.FLAG_GRANT_READ_URI_PERMISSION) }; image = it.toString() } }
    if (colorPicker) { B5ColorPicker(outline, usedColors, onBack = { colorPicker = false }, onUse = { outline = it; colorPicker = false }); return }
    val preview = B5Template(existing?.id ?: System.currentTimeMillis(), name.ifBlank { "Your shift type" }, outline, image, note, start, end, location, reminder, category, logoSize)
    Column(Modifier.fillMaxSize().background(B5Bg).statusBarsPadding().padding(horizontal = 16.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) { IconButton(onClick = onBack) { Icon(Icons.Outlined.ArrowBack, "Back") }; Text(if (existing == null) "New Shift Type" else "Edit Shift Type", modifier = Modifier.weight(1f), textAlign = TextAlign.Center, fontSize = 19.sp, fontWeight = FontWeight.SemiBold); TextButton(onClick = { onSave(preview.copy(name = name.trim())) }, enabled = name.isNotBlank()) { Text("Save", color = B5Gold, fontWeight = FontWeight.Bold) } }
        LazyColumn(Modifier.weight(1f)) { item {
            Spacer(Modifier.height(6.dp)); Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = B5Panel), shape = RoundedCornerShape(22.dp)) { Column(Modifier.fillMaxWidth().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) { B5OutlinedLogo(preview, 150.dp); Spacer(Modifier.height(12.dp)); Text(preview.name, fontSize = 24.sp, fontWeight = FontWeight.Bold); Text("$category • ${b5Time(start)} – ${b5End(preview)}", color = B5Muted, fontSize = 11.sp) } }
            Spacer(Modifier.height(10.dp)); Button(onClick = { picker.launch(arrayOf("image/*")) }, modifier = Modifier.fillMaxWidth().height(48.dp), colors = ButtonDefaults.buttonColors(containerColor = B5Gold, contentColor = B5Bg), shape = RoundedCornerShape(14.dp)) { Icon(Icons.Outlined.Image, null); Spacer(Modifier.width(8.dp)); Text(if (image.isBlank()) "Upload your own picture / logo" else "Change picture / logo") }
            Spacer(Modifier.height(12.dp)); OutlinedTextField(name, { name = it }, label = { Text("Shift type name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(12.dp)); Text("Category", color = B5Muted, fontSize = 11.sp); Spacer(Modifier.height(6.dp)); Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { listOf("Work","Event","Custom").forEach { c -> B5Chip(c, category == c) { category = c } } }
            Spacer(Modifier.height(12.dp)); Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) { B5TimeCard("Start", start, Modifier.weight(1f)) { h,m -> start = h * 60 + m }; B5TimeCard("End", end, Modifier.weight(1f)) { h,m -> end = h * 60 + m } }
            Spacer(Modifier.height(12.dp)); OutlinedTextField(location, { location = it }, label = { Text("Location (optional)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(12.dp)); Text("Phone reminder", color = B5Muted, fontSize = 11.sp); Spacer(Modifier.height(6.dp)); LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) { items(listOf(0,15,30,60,120,1440)) { m -> B5Chip(when (m) { 0 -> "Off"; 60 -> "1h"; 120 -> "2h"; 1440 -> "1 day"; else -> "${m}m" }, reminder == m) { reminder = m } } }
            Spacer(Modifier.height(14.dp)); Text("Logo size on calendar", fontSize = 17.sp, fontWeight = FontWeight.SemiBold); Text("Controls the image size. The colored outline stays outside the logo.", color = B5Muted, fontSize = 10.sp); Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { B5LogoSize.values().forEach { s -> Card(Modifier.weight(1f).height(100.dp).then(if (logoSize == s) Modifier.border(2.dp, B5Gold, RoundedCornerShape(16.dp)) else Modifier).clickable { logoSize = s }, colors = CardDefaults.cardColors(containerColor = B5Panel2), shape = RoundedCornerShape(16.dp)) { Column(Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) { B5OutlinedLogo(preview.copy(logoSize = s), s.cellDp.dp); Spacer(Modifier.height(5.dp)); Text(s.label, color = if (logoSize == s) B5Gold else B5Muted, fontSize = 10.sp) } } } }
            Spacer(Modifier.height(14.dp)); Text("Outline color", fontSize = 17.sp, fontWeight = FontWeight.SemiBold); Text("This colors only the outside border. Your uploaded logo is not recolored.", color = B5Muted, fontSize = 10.sp); Spacer(Modifier.height(8.dp))
            Card(Modifier.fillMaxWidth().clickable { colorPicker = true }, colors = CardDefaults.cardColors(containerColor = B5Panel2), shape = RoundedCornerShape(16.dp)) { Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically) { Box(Modifier.size(40.dp).background(Color(outline), CircleShape).border(2.dp, B5Text, CircleShape)); Spacer(Modifier.width(12.dp)); Column(Modifier.weight(1f)) { Text("Choose from full color wheel", fontWeight = FontWeight.SemiBold); Text("Preset + previously used colors", color = B5Muted, fontSize = 10.sp) }; Icon(Icons.Outlined.ChevronRight, null, tint = B5Muted) } }
            Spacer(Modifier.height(12.dp)); OutlinedTextField(note, { note = it }, label = { Text("Note (optional)") }, minLines = 3, modifier = Modifier.fillMaxWidth())
            if (onDelete != null) { Spacer(Modifier.height(16.dp)); OutlinedButton(onClick = { confirmDelete = true }, Modifier.fillMaxWidth().height(48.dp)) { Icon(Icons.Outlined.Delete, null); Spacer(Modifier.width(6.dp)); Text("Delete shift type") } }
            Spacer(Modifier.height(24.dp))
        } }
    }
    if (confirmDelete) AlertDialog(onDismissRequest = { confirmDelete = false }, title = { Text("Delete shift type?") }, text = { Text("Dates using it will be cleared.") }, confirmButton = { TextButton(onClick = { confirmDelete = false; onDelete?.invoke() }) { Text("Delete") } }, dismissButton = { TextButton(onClick = { confirmDelete = false }) { Text("Cancel") } })
}

@Composable
private fun B5ColorPicker(initial: Int, usedColors: List<Int>, onBack: () -> Unit, onUse: (Int) -> Unit) {
    var chosen by remember { mutableStateOf(initial) }; val wheel = listOf(Color.Red, Color.Yellow, Color.Green, Color.Cyan, Color.Blue, Color.Magenta, Color.Red)
    Column(Modifier.fillMaxSize().background(B5Bg).statusBarsPadding().padding(horizontal = 16.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) { IconButton(onClick = onBack) { Icon(Icons.Outlined.ArrowBack, "Back") }; Text("Choose Outline Color", fontSize = 21.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f), textAlign = TextAlign.Center); TextButton(onClick = { onUse(chosen) }) { Text("Use", color = B5Gold, fontWeight = FontWeight.Bold) } }
        Spacer(Modifier.height(12.dp))
        Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { Canvas(Modifier.size(260.dp).pointerInput(Unit) { detectTapGestures { p -> val cx = size.width / 2f; val cy = size.height / 2f; val dx = p.x - cx; val dy = p.y - cy; val r = min(size.width, size.height) / 2f; val sat = (sqrt(dx * dx + dy * dy) / r).coerceIn(0f, 1f); var hue = (atan2(dy, dx) * 180f / PI.toFloat() + 360f) % 360f; hue = (hue + 90f) % 360f; chosen = android.graphics.Color.HSVToColor(floatArrayOf(hue, sat, 1f)) } }) { drawCircle(brush = Brush.sweepGradient(wheel)); drawCircle(brush = Brush.radialGradient(listOf(Color.White, Color.Transparent))) } }
        Spacer(Modifier.height(16.dp)); Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) { Box(Modifier.size(48.dp).background(Color(chosen), CircleShape).border(2.dp, B5Text, CircleShape)); Spacer(Modifier.width(12.dp)); Column { Text("Selected color", fontWeight = FontWeight.SemiBold); Text(String.format("#%06X", 0xFFFFFF and chosen), color = B5Muted, fontSize = 11.sp) } }
        Spacer(Modifier.height(20.dp)); Text("Color chart", fontSize = 17.sp, fontWeight = FontWeight.SemiBold); Spacer(Modifier.height(8.dp)); LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) { items(B5PresetColors) { c -> Box(Modifier.size(46.dp).background(Color(c), CircleShape).then(if (c == chosen) Modifier.border(3.dp, B5Text, CircleShape) else Modifier).clickable { chosen = c }) } }
        if (usedColors.isNotEmpty()) { Spacer(Modifier.height(18.dp)); Text("Previously used", fontSize = 17.sp, fontWeight = FontWeight.SemiBold); Spacer(Modifier.height(8.dp)); LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) { items(usedColors) { c -> Box(Modifier.size(46.dp).background(Color(c), CircleShape).then(if (c == chosen) Modifier.border(3.dp, B5Text, CircleShape) else Modifier).clickable { chosen = c }) } } }
        Spacer(Modifier.height(24.dp)); Button(onClick = { onUse(chosen) }, modifier = Modifier.fillMaxWidth().height(52.dp), colors = ButtonDefaults.buttonColors(containerColor = B5Gold, contentColor = B5Bg)) { Text("Use this outline color", fontWeight = FontWeight.Bold) }
    }
}

@Composable
private fun B5TimeCard(label: String, minutes: Int, modifier: Modifier, onTime: (Int, Int) -> Unit) {
    val context = LocalContext.current
    Card(modifier.clickable { TimePickerDialog(context, { _, h, m -> onTime(h, m) }, minutes / 60, minutes % 60, true).show() }, colors = CardDefaults.cardColors(containerColor = B5Panel2), shape = RoundedCornerShape(15.dp)) { Column(Modifier.padding(14.dp)) { Text(label, color = B5Muted, fontSize = 10.sp); Text(b5Time(minutes), fontSize = 20.sp, fontWeight = FontWeight.SemiBold) } }
}

@Composable
private fun B5Chip(text: String, selected: Boolean, onClick: () -> Unit) { Surface(color = if (selected) B5Gold else B5Panel2, contentColor = if (selected) B5Bg else B5Text, shape = RoundedCornerShape(18.dp), modifier = Modifier.clickable(onClick = onClick)) { Text(text, modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp), fontSize = 11.sp) } }

@Composable
private fun B5AnalyticsScreen(month: YearMonth, templates: List<B5Template>, assignments: List<B5Assignment>, onMonth: (YearMonth) -> Unit) {
    val monthRows = assignments.filter { runCatching { YearMonth.from(LocalDate.parse(it.date)) == month }.getOrDefault(false) }; val counts = monthRows.groupingBy { it.templateId }.eachCount().toList().sortedByDescending { it.second }; val map = templates.associateBy { it.id }; val fmt = DateTimeFormatter.ofPattern("MMMM yyyy")
    LazyColumn(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
        item { Text("Analytics", fontSize = 29.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 12.dp)); Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) { IconButton({ onMonth(month.minusMonths(1)) }) { Icon(Icons.Outlined.ChevronLeft, null) }; Text(fmt.format(month.atDay(1)), modifier = Modifier.weight(1f), textAlign = TextAlign.Center); IconButton({ onMonth(month.plusMonths(1)) }) { Icon(Icons.Outlined.ChevronRight, null) } }; Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) { B5Stat("Scheduled days", monthRows.size.toString(), Modifier.weight(1f)); B5Stat("Shift types", counts.size.toString(), Modifier.weight(1f)) }; Spacer(Modifier.height(16.dp)); Text("Shifts by type", fontSize = 18.sp, fontWeight = FontWeight.SemiBold); Spacer(Modifier.height(6.dp)) }
        items(counts, key = { it.first }) { (id, count) -> map[id]?.let { t -> Row(Modifier.fillMaxWidth().padding(vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) { B5OutlinedLogo(t, 42.dp); Spacer(Modifier.width(10.dp)); Text(t.name, modifier = Modifier.weight(1f)); Text(count.toString(), color = B5Muted) } } }
    }
}

@Composable
private fun B5Stat(label: String, value: String, modifier: Modifier) { Card(modifier, colors = CardDefaults.cardColors(containerColor = B5Panel2), shape = RoundedCornerShape(16.dp)) { Column(Modifier.padding(14.dp)) { Text(label, color = B5Muted, fontSize = 10.sp); Text(value, fontSize = 23.sp, fontWeight = FontWeight.Bold) } } }

@Composable
private fun B5SettingsScreen(store: B5Store, typeCount: Int, notifications: Boolean, onNotifications: (Boolean) -> Unit, onTypes: () -> Unit) {
    var job by remember { mutableStateOf(store.jobName()) }; var editJob by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
        Text("Settings", fontSize = 29.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 12.dp)); Spacer(Modifier.height(12.dp))
        Card(colors = CardDefaults.cardColors(containerColor = B5Panel2), shape = RoundedCornerShape(18.dp)) { B5SettingsRow("Job Name", job) { editJob = true }; HorizontalDivider(color = B5Divider); B5SettingsRow("Shift Types", typeCount.toString(), onTypes); HorizontalDivider(color = B5Divider); Row(Modifier.fillMaxWidth().padding(15.dp), verticalAlignment = Alignment.CenterVertically) { Text("Phone Notifications", modifier = Modifier.weight(1f)); Switch(checked = notifications, onCheckedChange = onNotifications) }; HorizontalDivider(color = B5Divider); B5SettingsRow("Appearance", "Dark") {}; HorizontalDivider(color = B5Divider); B5SettingsRow("About", "Beta 0.5.0") {} }
    }
    if (editJob) { var value by remember(job) { mutableStateOf(job) }; AlertDialog(onDismissRequest = { editJob = false }, title = { Text("Job name") }, text = { OutlinedTextField(value, { value = it }, singleLine = true) }, confirmButton = { TextButton(onClick = { job = value.trim().ifBlank { "Main Job" }; store.setJobName(job); editJob = false }) { Text("Save") } }, dismissButton = { TextButton(onClick = { editJob = false }) { Text("Cancel") } }) }
}

@Composable
private fun B5SettingsRow(label: String, value: String, onClick: () -> Unit) { Row(Modifier.fillMaxWidth().clickable(onClick = onClick).padding(15.dp), verticalAlignment = Alignment.CenterVertically) { Text(label, modifier = Modifier.weight(1f)); Text(value, color = B5Muted, fontSize = 11.sp); Spacer(Modifier.width(5.dp)); Icon(Icons.Outlined.ChevronRight, null, tint = B5Muted, modifier = Modifier.size(17.dp)) } }

@Composable
private fun B5Empty(title: String, text: String) { Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = B5Panel2), shape = RoundedCornerShape(16.dp)) { Column(Modifier.padding(16.dp)) { Text(title, fontWeight = FontWeight.SemiBold); Text(text, color = B5Muted, fontSize = 10.sp) } } }

private fun b5Time(m: Int): String = "%02d:%02d".format((m / 60) % 24, m % 60)
private fun b5End(t: B5Template): String = b5Time(t.endMinutes) + if (t.endMinutes <= t.startMinutes) " (+1)" else ""
private fun b5ReminderShort(m: Int): String = when { m >= 1440 -> "${m / 1440}d"; m >= 60 -> "${m / 60}h"; else -> "${m}m" }
private fun b5ReminderLong(m: Int): String = when { m >= 1440 -> "${m / 1440} day before"; m >= 60 -> "${m / 60} hour before"; else -> "$m minutes before" }
