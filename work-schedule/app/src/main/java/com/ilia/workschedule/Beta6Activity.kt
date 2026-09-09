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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
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
import kotlin.math.sqrt

private val B6Gold = Color(0xFFE9B95C)
private val B6Bg = Color(0xFF080D11)
private val B6Panel = Color(0xFF11181D)
private val B6Panel2 = Color(0xFF192127)
private val B6Panel3 = Color(0xFF222C33)
private val B6Text = Color(0xFFF7F4ED)
private val B6Muted = Color(0xFF929BA4)
private val B6Divider = Color.White.copy(alpha = .075f)

private val B6Presets = listOf(
    0xFFF5B53F.toInt(), 0xFFFF4E46.toInt(), 0xFF42D66E.toInt(), 0xFF4AAEFA.toInt(),
    0xFF9C4EF0.toInt(), 0xFFE95ABE.toInt(), 0xFF59D2CA.toInt(), 0xFFFF8A63.toInt(),
    0xFFFFD15A.toInt(), 0xFF69C7FF.toInt(), 0xFF63C89D.toInt(), 0xFFA58BFF.toInt(),
    0xFFF18479.toInt(), 0xFF98C963.toInt(), 0xFF9EA6B0.toInt(), 0xFFECECEC.toInt()
)

private enum class B6LogoSize(val label: String, val cellDp: Int) {
    SMALL("Small", 24), MEDIUM("Medium", 31), LARGE("Large", 38)
}

private data class B6Template(
    val id: Long = System.currentTimeMillis(),
    val name: String,
    val outlineArgb: Int = B6Presets.first(),
    val imageUri: String = "",
    val note: String = "",
    val startMinutes: Int = 18 * 60,
    val endMinutes: Int = 2 * 60,
    val location: String = "",
    val reminderMinutes: Int = 60,
    val category: String = "Work",
    val logoSize: B6LogoSize = B6LogoSize.LARGE
)

private data class B6Assignment(val date: String, val templateId: Long)

private class B6Store(private val context: Context) {
    private val prefs = context.getSharedPreferences("work_schedule_beta", Context.MODE_PRIVATE)

    fun jobName(): String = prefs.getString("job", "Main Job") ?: "Main Job"
    fun setJobName(v: String) = prefs.edit().putString("job", v).apply()
    fun defaultLocation(): String = prefs.getString("default_location", "Santai Lounge") ?: "Santai Lounge"
    fun setDefaultLocation(v: String) = prefs.edit().putString("default_location", v).apply()
    fun notificationsEnabled(): Boolean = prefs.getBoolean("notifications_v3", true)
    fun setNotificationsEnabled(v: Boolean) = prefs.edit().putBoolean("notifications_v3", v).apply()
    fun recentColors(): List<Int> = prefs.getString("recent_colors_v6", "").orEmpty().split(',').mapNotNull { it.toIntOrNull() }.take(8)
    fun setRecentColors(items: List<Int>) = prefs.edit().putString("recent_colors_v6", items.take(8).joinToString(",")).apply()

    fun loadTemplates(): List<B6Template> {
        prefs.getString("templates_v6", null)?.let { return decodeV6(it) }
        val old = prefs.getString("templates_v5", null)
            ?: prefs.getString("templates_v4", null)
            ?: prefs.getString("templates_v3", "[]")
            ?: "[]"
        val migrated = decodeLegacy(old)
        saveTemplates(migrated)
        return migrated
    }

    private fun decodeV6(raw: String): List<B6Template> {
        val a = runCatching { JSONArray(raw) }.getOrElse { JSONArray() }
        return (0 until a.length()).map { i ->
            val o = a.getJSONObject(i)
            B6Template(
                id = o.optLong("id", System.currentTimeMillis() + i),
                name = o.optString("name", "Shift"),
                outlineArgb = o.optInt("outline", B6Presets[i % B6Presets.size]),
                imageUri = o.optString("image", ""),
                note = o.optString("note", ""),
                startMinutes = o.optInt("start", 18 * 60),
                endMinutes = o.optInt("end", 2 * 60),
                location = o.optString("location", ""),
                reminderMinutes = o.optInt("reminder", 60),
                category = o.optString("category", "Work"),
                logoSize = runCatching { B6LogoSize.valueOf(o.optString("logoSize", "LARGE")) }.getOrDefault(B6LogoSize.LARGE)
            )
        }
    }

    private fun decodeLegacy(raw: String): List<B6Template> {
        val a = runCatching { JSONArray(raw) }.getOrElse { JSONArray() }
        return (0 until a.length()).map { i ->
            val o = a.getJSONObject(i)
            B6Template(
                id = o.optLong("id", System.currentTimeMillis() + i),
                name = o.optString("name", "Shift"),
                outlineArgb = o.optInt("outline", o.optInt("color", B6Presets[i % B6Presets.size])),
                imageUri = o.optString("image", ""),
                note = o.optString("note", ""),
                startMinutes = o.optInt("start", 18 * 60),
                endMinutes = o.optInt("end", 2 * 60),
                location = o.optString("location", ""),
                reminderMinutes = o.optInt("reminder", 60),
                category = o.optString("category", "Work"),
                logoSize = runCatching { B6LogoSize.valueOf(o.optString("logoSize", "LARGE")) }.getOrDefault(B6LogoSize.LARGE)
            )
        }
    }

    fun saveTemplates(items: List<B6Template>) {
        val a = JSONArray()
        items.forEach { t ->
            a.put(JSONObject().apply {
                put("id", t.id); put("name", t.name); put("outline", t.outlineArgb); put("image", t.imageUri)
                put("note", t.note); put("start", t.startMinutes); put("end", t.endMinutes); put("location", t.location)
                put("reminder", t.reminderMinutes); put("category", t.category); put("logoSize", t.logoSize.name)
            })
        }
        prefs.edit().putString("templates_v6", a.toString()).apply()
    }

    fun loadAssignments(): List<B6Assignment> {
        val raw = prefs.getString("assignments_v2", "[]") ?: "[]"
        val a = runCatching { JSONArray(raw) }.getOrElse { JSONArray() }
        return (0 until a.length()).mapNotNull { i ->
            val o = a.getJSONObject(i)
            val d = o.optString("date", "")
            if (d.isBlank()) null else B6Assignment(d, o.optLong("templateId"))
        }.distinctBy { it.date }
    }

    fun saveAssignments(items: List<B6Assignment>) {
        val a = JSONArray()
        items.distinctBy { it.date }.forEach { x -> a.put(JSONObject().apply { put("date", x.date); put("templateId", x.templateId) }) }
        prefs.edit().putString("assignments_v2", a.toString()).apply()
    }
}

private object B6ImageCache : LruCache<String, Bitmap>(32) {}

private fun b6LoadBitmap(context: Context, uri: String): Bitmap? {
    if (uri.isBlank()) return null
    B6ImageCache.get(uri)?.let { return it }
    val parsed = runCatching { Uri.parse(uri) }.getOrNull() ?: return null
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    runCatching { context.contentResolver.openInputStream(parsed)?.use { BitmapFactory.decodeStream(it, null, bounds) } }
    if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null
    var sample = 1
    while (maxOf(bounds.outWidth / sample, bounds.outHeight / sample) > 640) sample *= 2
    val opts = BitmapFactory.Options().apply { inSampleSize = sample }
    val bmp = runCatching { context.contentResolver.openInputStream(parsed)?.use { BitmapFactory.decodeStream(it, null, opts) } }.getOrNull() ?: return null
    B6ImageCache.put(uri, bmp)
    return bmp
}

@Composable private fun b6RememberImage(uri: String): ImageBitmap? {
    val context = LocalContext.current
    val state by produceState<ImageBitmap?>(initialValue = null, uri) {
        value = if (uri.isBlank()) null else withContext(Dispatchers.IO) { b6LoadBitmap(context, uri)?.asImageBitmap() }
    }
    return state
}

class Beta6Activity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        b6CreateChannel(this)
        setContent { B6Theme { B6App() } }
    }
}

class Beta6ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val title = intent.getStringExtra("title") ?: "Upcoming shift"
        val text = intent.getStringExtra("text") ?: "Your shift is coming up"
        val id = intent.getIntExtra("id", 1)
        val open = PendingIntent.getActivity(context, id, Intent(context, Beta6Activity::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val b = NotificationCompat.Builder(context, "work_schedule_v6")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title).setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true).setContentIntent(open)
        intent.getStringExtra("image").orEmpty().takeIf { it.isNotBlank() }?.let { b6LoadBitmap(context, it)?.let(b::setLargeIcon) }
        if (Build.VERSION.SDK_INT < 33 || ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
            (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).notify(id, b.build())
        }
    }
}

class Beta6BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val s = B6Store(context)
            if (s.notificationsEnabled()) b6ScheduleAll(context, s.loadTemplates(), s.loadAssignments())
        }
    }
}

private fun b6CreateChannel(context: Context) {
    if (Build.VERSION.SDK_INT >= 26) {
        (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(
            NotificationChannel("work_schedule_v6", "Shift reminders", NotificationManager.IMPORTANCE_HIGH).apply { description = "Upcoming shift reminders" }
        )
    }
}
private fun b6ReminderId(a: B6Assignment): Int = abs((a.date + "|" + a.templateId).hashCode()).coerceAtLeast(1)
private fun b6Cancel(context: Context, a: B6Assignment) {
    val p = PendingIntent.getBroadcast(context, b6ReminderId(a), Intent(context, Beta6ReminderReceiver::class.java), PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE)
    p?.let { (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(it); it.cancel() }
}
private fun b6ScheduleAll(context: Context, templates: List<B6Template>, assignments: List<B6Assignment>) {
    val map = templates.associateBy { it.id }
    assignments.forEach { a -> map[a.templateId]?.let { b6Schedule(context, a, it) } }
}
private fun b6Schedule(context: Context, a: B6Assignment, t: B6Template) {
    b6Cancel(context, a)
    if (t.reminderMinutes <= 0) return
    val d = runCatching { LocalDate.parse(a.date) }.getOrNull() ?: return
    val start = LocalDateTime.of(d, LocalTime.of(t.startMinutes / 60, t.startMinutes % 60))
    val trigger = start.minusMinutes(t.reminderMinutes.toLong()).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
    if (trigger <= System.currentTimeMillis()) return
    val label = when {
        t.reminderMinutes >= 1440 -> "Tomorrow at ${b6Time(t.startMinutes)}"
        t.reminderMinutes >= 60 -> "Starts in ${t.reminderMinutes / 60}h at ${b6Time(t.startMinutes)}"
        else -> "Starts in ${t.reminderMinutes} min at ${b6Time(t.startMinutes)}"
    }
    val text = label + if (t.location.isBlank()) "" else " • ${t.location}"
    val i = Intent(context, Beta6ReminderReceiver::class.java).putExtra("title", t.name).putExtra("text", text).putExtra("id", b6ReminderId(a)).putExtra("image", t.imageUri)
    val p = PendingIntent.getBroadcast(context, b6ReminderId(a), i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, p)
}

@Composable private fun B6Theme(content: @Composable () -> Unit) = MaterialTheme(
    colorScheme = darkColorScheme(primary = B6Gold, background = B6Bg, surface = B6Panel, surfaceVariant = B6Panel2, onBackground = B6Text, onSurface = B6Text),
    content = content
)

private enum class B6Tab { CALENDAR, SHIFTS, ANALYTICS, SETTINGS }
private sealed interface B6Route {
    data object Main : B6Route
    data class DatePreview(val date: LocalDate) : B6Route
    data object TypeLibrary : B6Route
    data class TypeEditor(val id: Long? = null) : B6Route
}

@Composable private fun B6App() {
    val context = LocalContext.current
    val store = remember { B6Store(context) }
    var templates by remember { mutableStateOf(store.loadTemplates()) }
    var assignments by remember { mutableStateOf(store.loadAssignments()) }
    var recentColors by remember { mutableStateOf(store.recentColors()) }
    var notifications by remember { mutableStateOf(store.notificationsEnabled()) }
    var tab by remember { mutableStateOf(B6Tab.CALENDAR) }
    var route: B6Route by remember { mutableStateOf(B6Route.Main) }
    var month by remember { mutableStateOf(YearMonth.now()) }
    var selectedDate by remember { mutableStateOf(LocalDate.now()) }
    var paintMode by remember { mutableStateOf(false) }
    var selectedTemplateId by remember { mutableStateOf<Long?>(templates.firstOrNull()?.id) }

    val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {}
    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) permission.launch(Manifest.permission.POST_NOTIFICATIONS)
    }
    LaunchedEffect(templates, assignments, notifications) {
        if (notifications) b6ScheduleAll(context, templates, assignments) else assignments.forEach { b6Cancel(context, it) }
    }

    fun saveTemplates(v: List<B6Template>) {
        templates = v; store.saveTemplates(v)
        if (selectedTemplateId !in v.map { it.id }) selectedTemplateId = v.firstOrNull()?.id
    }
    fun saveAssignments(v: List<B6Assignment>) { assignments = v.distinctBy { it.date }; store.saveAssignments(assignments) }
    fun rememberColor(c: Int) { recentColors = (listOf(c) + recentColors).distinct().take(8); store.setRecentColors(recentColors) }
    fun paint(date: LocalDate) {
        val id = selectedTemplateId ?: return
        val key = date.toString()
        val existing = assignments.firstOrNull { it.date == key }
        saveAssignments(if (existing?.templateId == id) assignments.filterNot { it.date == key } else assignments.filterNot { it.date == key } + B6Assignment(key, id))
        selectedDate = date; month = YearMonth.from(date)
    }

    BackHandler(enabled = route !is B6Route.Main) { route = B6Route.Main }

    when (val r = route) {
        B6Route.Main -> Scaffold(containerColor = B6Bg, bottomBar = { B6BottomBar(tab) { tab = it } }) { p ->
            Box(Modifier.fillMaxSize().padding(p).statusBarsPadding()) {
                when (tab) {
                    B6Tab.CALENDAR -> B6CalendarScreen(
                        jobName = store.jobName(), month = month, selectedDate = selectedDate, templates = templates, assignments = assignments,
                        paintMode = paintMode, selectedTemplateId = selectedTemplateId,
                        onMonth = { month = it }, onTogglePaint = { if (templates.isEmpty()) route = B6Route.TypeEditor() else paintMode = !paintMode },
                        onSelectType = { selectedTemplateId = it; paintMode = true },
                        onDate = { d -> if (paintMode) paint(d) else { selectedDate = d; route = B6Route.DatePreview(d) } },
                        onManageTypes = { route = B6Route.TypeLibrary }, onUpcoming = { tab = B6Tab.SHIFTS }
                    )
                    B6Tab.SHIFTS -> B6ShiftsScreen(templates, assignments, onManageTypes = { route = B6Route.TypeLibrary }, onDate = { selectedDate = it; route = B6Route.DatePreview(it) })
                    B6Tab.ANALYTICS -> B6AnalyticsScreen(month, templates, assignments, onMonth = { month = it })
                    B6Tab.SETTINGS -> B6SettingsScreen(
                        store = store, templates = templates, assignments = assignments, notifications = notifications,
                        onNotifications = { notifications = it; store.setNotificationsEnabled(it) }, onTypes = { route = B6Route.TypeLibrary }
                    )
                }
            }
        }
        is B6Route.DatePreview -> {
            val a = assignments.firstOrNull { it.date == r.date.toString() }
            val t = a?.let { x -> templates.firstOrNull { it.id == x.templateId } }
            B6DatePreviewScreen(r.date, t, onBack = { route = B6Route.Main }, onEdit = { t?.let { route = B6Route.TypeEditor(it.id) } }, onDelete = {
                saveAssignments(assignments.filterNot { it.date == r.date.toString() }); route = B6Route.Main
            })
        }
        B6Route.TypeLibrary -> B6TypeLibraryScreen(templates, onBack = { route = B6Route.Main }, onCreate = { route = B6Route.TypeEditor() }, onOpen = { route = B6Route.TypeEditor(it.id) })
        is B6Route.TypeEditor -> {
            val existing = r.id?.let { id -> templates.firstOrNull { it.id == id } }
            B6TypeEditorScreen(
                existing = existing, defaultLocation = store.defaultLocation(), recentColors = recentColors,
                onBack = { route = B6Route.TypeLibrary }, onRecentColor = ::rememberColor,
                onSave = { t ->
                    saveTemplates(if (existing == null) templates + t else templates.map { if (it.id == t.id) t else it })
                    selectedTemplateId = t.id; paintMode = true; route = B6Route.TypeLibrary
                },
                onDelete = if (existing == null) null else ({
                    saveTemplates(templates.filterNot { it.id == existing.id }); saveAssignments(assignments.filterNot { it.templateId == existing.id }); route = B6Route.TypeLibrary
                })
            )
        }
    }
}

@Composable private fun B6BottomBar(tab: B6Tab, onTab: (B6Tab) -> Unit) {
    NavigationBar(containerColor = B6Bg, modifier = Modifier.navigationBarsPadding()) {
        val rows = listOf(B6Tab.CALENDAR to Icons.Outlined.CalendarMonth, B6Tab.SHIFTS to Icons.Outlined.Work, B6Tab.ANALYTICS to Icons.Outlined.Analytics, B6Tab.SETTINGS to Icons.Outlined.Settings)
        rows.forEach { (item, icon) -> NavigationBarItem(
            selected = item == tab, onClick = { onTab(item) }, icon = { Icon(icon, null) }, label = { Text(item.name.lowercase().replaceFirstChar { it.uppercase() }, fontSize = 10.sp) },
            colors = NavigationBarItemDefaults.colors(selectedIconColor = B6Gold, selectedTextColor = B6Gold, indicatorColor = B6Gold.copy(alpha = .10f), unselectedIconColor = B6Muted, unselectedTextColor = B6Muted)
        ) }
    }
}

@Composable private fun B6CalendarScreen(
    jobName: String, month: YearMonth, selectedDate: LocalDate, templates: List<B6Template>, assignments: List<B6Assignment>, paintMode: Boolean, selectedTemplateId: Long?,
    onMonth: (YearMonth) -> Unit, onTogglePaint: () -> Unit, onSelectType: (Long) -> Unit, onDate: (LocalDate) -> Unit, onManageTypes: () -> Unit, onUpcoming: () -> Unit
) {
    val map = templates.associateBy { it.id }
    val upcoming = assignments.mapNotNull { a ->
        val d = runCatching { LocalDate.parse(a.date) }.getOrNull() ?: return@mapNotNull null
        val t = map[a.templateId] ?: return@mapNotNull null
        if (d.isBefore(LocalDate.now())) null else d to t
    }.sortedBy { it.first }.take(2)
    var drag by remember { mutableStateOf(0f) }
    LazyColumn(Modifier.fillMaxSize().padding(horizontal = 16.dp), contentPadding = PaddingValues(bottom = 16.dp)) {
        item {
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(jobName, fontSize = 25.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.width(6.dp)); Icon(Icons.Outlined.ArrowDropDown, null, tint = B6Text, modifier = Modifier.size(22.dp))
                Spacer(Modifier.weight(1f)); IconButton(onUpcoming) { Icon(Icons.Outlined.Notifications, null, tint = B6Gold) }; IconButton(onManageTypes) { Icon(Icons.Outlined.Settings, null, tint = B6Text) }
            }
            Text("Plan your work, your life", color = B6Muted, fontSize = 12.sp)
            Spacer(Modifier.height(12.dp))
            Card(colors = CardDefaults.cardColors(containerColor = B6Panel), shape = RoundedCornerShape(20.dp), modifier = Modifier.fillMaxWidth().border(1.dp, B6Divider, RoundedCornerShape(20.dp))) {
                Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) {
                    IconButton({ onMonth(month.minusMonths(1)) }) { Icon(Icons.Outlined.ChevronLeft, null, tint = B6Muted) }
                    Text(month.atDay(1).format(DateTimeFormatter.ofPattern("MMMM yyyy", Locale.getDefault())), modifier = Modifier.weight(1f), textAlign = TextAlign.Center, fontSize = 20.sp, fontWeight = FontWeight.SemiBold)
                    IconButton({ onMonth(month.plusMonths(1)) }) { Icon(Icons.Outlined.ChevronRight, null, tint = B6Muted) }
                    Box(Modifier.size(46.dp).clip(CircleShape).background(B6Gold).clickable(onClick = onTogglePaint), contentAlignment = Alignment.Center) { Icon(if (paintMode) Icons.Outlined.Check else Icons.Outlined.Add, null, tint = B6Bg) }
                }
            }
            Spacer(Modifier.height(10.dp))
            Row(Modifier.fillMaxWidth()) { listOf("Mon","Tue","Wed","Thu","Fri","Sat","Sun").forEachIndexed { i, d -> Text(d, color = if (i > 4) B6Muted else B6Text, textAlign = TextAlign.Center, fontSize = 11.sp, modifier = Modifier.weight(1f)) } }
            Spacer(Modifier.height(5.dp))
            Card(colors = CardDefaults.cardColors(containerColor = B6Panel), shape = RoundedCornerShape(20.dp), modifier = Modifier.fillMaxWidth().border(1.dp, B6Divider, RoundedCornerShape(20.dp)).pointerInput(month) {
                detectHorizontalDragGestures(onHorizontalDrag = { _, a -> drag += a }, onDragEnd = { if (drag > 80) onMonth(month.minusMonths(1)); if (drag < -80) onMonth(month.plusMonths(1)); drag = 0f })
            }) { B6MonthGrid(month, selectedDate, assignments, map, onDate) }
            if (paintMode) {
                Spacer(Modifier.height(10.dp)); Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) { Text("Choose shift type", fontWeight = FontWeight.SemiBold); Spacer(Modifier.weight(1f)); TextButton(onManageTypes) { Text("Manage", color = B6Gold) } }
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) { items(templates, key = { it.id }) { t -> B6TypeMini(t, selectedTemplateId == t.id) { onSelectType(t.id) } } }
            }
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) { Column { Text("Upcoming", fontSize = 20.sp, fontWeight = FontWeight.Bold); Text("Next scheduled shifts", color = B6Muted, fontSize = 11.sp) }; Spacer(Modifier.weight(1f)); TextButton(onUpcoming) { Text("See all", color = B6Gold) } }
            if (upcoming.isEmpty()) B6Empty("Nothing scheduled", "Tap +, choose a shift type and tap dates.") else upcoming.forEach { (d,t) -> B6UpcomingCompact(d,t) }
        }
    }
}

@Composable private fun B6MonthGrid(month: YearMonth, selectedDate: LocalDate, assignments: List<B6Assignment>, templates: Map<Long,B6Template>, onDate: (LocalDate)->Unit) {
    val first = month.atDay(1); val start = first.minusDays((first.dayOfWeek.value - 1).toLong()); val byDate = assignments.associateBy { it.date }
    Column(Modifier.padding(7.dp)) {
        repeat(6) { r -> Row(Modifier.fillMaxWidth()) { repeat(7) { c ->
            val d = start.plusDays((r*7+c).toLong()); val inMonth = YearMonth.from(d)==month; val t = byDate[d.toString()]?.let { templates[it.templateId] }
            B6CalendarCell(d,inMonth,d==selectedDate,t,Modifier.weight(1f)) { onDate(d) }
        } } }
    }
}

@Composable private fun B6CalendarCell(date: LocalDate, inMonth: Boolean, selected: Boolean, t: B6Template?, modifier: Modifier, onClick:()->Unit) {
    val shape = RoundedCornerShape(9.dp)
    val outline = t?.let { Color(it.outlineArgb) }
    val cellModifier = modifier.padding(2.dp).height(50.dp).clip(shape)
        .background(if (selected) B6Gold.copy(alpha=.12f) else Color.Transparent)
        .then(if (outline != null) Modifier.border(1.7.dp, outline, shape) else if (selected) Modifier.border(1.dp, B6Gold.copy(alpha=.5f), shape) else Modifier)
        .clickable(onClick=onClick)
    Box(cellModifier) {
        Text(date.dayOfMonth.toString(), color = if (inMonth) B6Text else B6Muted.copy(alpha=.35f), fontSize=10.sp, modifier=Modifier.align(Alignment.TopStart).padding(start=4.dp,top=2.dp))
        if (t != null) {
            B6Photo(t.imageUri, t.outlineArgb, t.logoSize.cellDp.dp, RoundedCornerShape(6.dp), border=false, modifier=Modifier.align(Alignment.Center).padding(top=3.dp,bottom=8.dp))
            Text(t.name, color=outline ?: B6Text, fontSize=6.3.sp, fontWeight=FontWeight.SemiBold, maxLines=1, overflow=TextOverflow.Ellipsis, textAlign=TextAlign.Center, modifier=Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(horizontal=2.dp,bottom=2.dp))
        }
    }
}

@Composable private fun B6UpcomingCompact(date: LocalDate, t: B6Template) {
    val days = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), date)
    val whenText = when(days){0L->"Today";1L->"Tomorrow";else->date.format(DateTimeFormatter.ofPattern("EEE, d MMM"))}
    Card(Modifier.fillMaxWidth().padding(vertical=3.dp).height(64.dp), colors=CardDefaults.cardColors(containerColor=B6Panel2), shape=RoundedCornerShape(15.dp)) {
        Row(Modifier.fillMaxSize().padding(7.dp), verticalAlignment=Alignment.CenterVertically) {
            B6Photo(t.imageUri,t.outlineArgb,48.dp,RoundedCornerShape(10.dp),border=true); Spacer(Modifier.width(9.dp)); Column(Modifier.weight(1f)) { Text(t.name,fontWeight=FontWeight.SemiBold,maxLines=1); Text("$whenText • ${b6Time(t.startMinutes)} – ${b6EndLabel(t)}",color=B6Muted,fontSize=10.5.sp,maxLines=1) }
            if(t.reminderMinutes>0) Surface(color=B6Gold.copy(alpha=.10f),shape=RoundedCornerShape(11.dp)){ Row(Modifier.padding(horizontal=7.dp,vertical=5.dp),verticalAlignment=Alignment.CenterVertically){ Icon(Icons.Outlined.Notifications,null,tint=B6Gold,modifier=Modifier.size(14.dp)); Spacer(Modifier.width(3.dp)); Text(b6ReminderShort(t.reminderMinutes),color=B6Gold,fontSize=9.sp) } }
        }
    }
}

@Composable private fun B6TypeMini(t:B6Template,selected:Boolean,onClick:()->Unit){
    Card(Modifier.width(88.dp).height(72.dp).then(if(selected) Modifier.border(1.5.dp,B6Gold,RoundedCornerShape(13.dp)) else Modifier).clickable(onClick=onClick),colors=CardDefaults.cardColors(containerColor=B6Panel2),shape=RoundedCornerShape(13.dp)){
        Column(Modifier.fillMaxSize().padding(6.dp),horizontalAlignment=Alignment.CenterHorizontally){ B6Photo(t.imageUri,t.outlineArgb,38.dp,RoundedCornerShape(8.dp),border=true); Spacer(Modifier.height(3.dp)); Text(t.name,fontSize=8.5.sp,maxLines=1,overflow=TextOverflow.Ellipsis) }
    }
}

@Composable private fun B6Photo(uri:String,outlineArgb:Int,size:Dp,shape:RoundedCornerShape,border:Boolean,modifier:Modifier=Modifier){
    val image=b6RememberImage(uri); val outline=Color(outlineArgb)
    Box(modifier.size(size).clip(shape).background(B6Bg).then(if(border) Modifier.border(1.6.dp,outline,shape) else Modifier).padding(if(border) 3.dp else 0.dp),contentAlignment=Alignment.Center){
        if(image!=null) Image(image,null,Modifier.fillMaxSize(),contentScale=ContentScale.Fit)
        else Icon(Icons.Outlined.Image,null,tint=outline,modifier=Modifier.size(size*.45f))
    }
}

@Composable private fun B6ShiftsScreen(templates:List<B6Template>,assignments:List<B6Assignment>,onManageTypes:()->Unit,onDate:(LocalDate)->Unit){
    val map=templates.associateBy{it.id}; var filter by remember{mutableStateOf("Upcoming")}; val today=LocalDate.now()
    val rows=assignments.mapNotNull{a->runCatching{LocalDate.parse(a.date)}.getOrNull()?.let{d->map[a.templateId]?.let{t->d to t}}}.filter{(d,_)->when(filter){"Past"->d.isBefore(today);"All"->true;else->!d.isBefore(today)}}.sortedBy{it.first}
    LazyColumn(Modifier.fillMaxSize().padding(horizontal=16.dp),contentPadding=PaddingValues(bottom=20.dp)){
        item{ Row(Modifier.fillMaxWidth().padding(top=10.dp),verticalAlignment=Alignment.CenterVertically){Text("Shifts",fontSize=28.sp,fontWeight=FontWeight.Bold);Spacer(Modifier.weight(1f));IconButton(onManageTypes){Icon(Icons.Outlined.GridView,null,tint=B6Gold)}}; Row(horizontalArrangement=Arrangement.spacedBy(7.dp)){listOf("Upcoming","Past","All").forEach{x->B6Chip(x,filter==x){filter=x}}};Spacer(Modifier.height(12.dp)) }
        items(rows,key={it.first.toString()}){(d,t)->Card(Modifier.fillMaxWidth().padding(vertical=3.dp).height(72.dp).clickable{onDate(d)},colors=CardDefaults.cardColors(containerColor=B6Panel2),shape=RoundedCornerShape(15.dp)){Row(Modifier.fillMaxSize().padding(7.dp),verticalAlignment=Alignment.CenterVertically){B6Photo(t.imageUri,t.outlineArgb,52.dp,RoundedCornerShape(10.dp),true);Spacer(Modifier.width(9.dp));Column(Modifier.weight(1f)){Text(d.format(DateTimeFormatter.ofPattern("EEE, d MMM")),color=B6Muted,fontSize=9.5.sp);Text(t.name,fontWeight=FontWeight.SemiBold);Text("${b6Time(t.startMinutes)} – ${b6EndLabel(t)}"+(if(t.location.isBlank())"" else " • ${t.location}"),color=B6Muted,fontSize=10.sp,maxLines=1)};Icon(Icons.Outlined.ChevronRight,null,tint=B6Muted)}}}
        item{Spacer(Modifier.height(12.dp));OutlinedButton(onManageTypes,Modifier.fillMaxWidth().height(48.dp)){Icon(Icons.Outlined.GridView,null);Spacer(Modifier.width(6.dp));Text("Manage shift types")}}
    }
}

@Composable private fun B6TypeLibraryScreen(templates:List<B6Template>,onBack:()->Unit,onCreate:()->Unit,onOpen:(B6Template)->Unit){
    var category by remember{mutableStateOf("All")}; val shown=if(category=="All")templates else templates.filter{it.category==category}
    LazyColumn(Modifier.fillMaxSize().background(B6Bg).statusBarsPadding().padding(horizontal=16.dp),contentPadding=PaddingValues(bottom=24.dp)){
        item{ B6Header("Shift Types",onBack,onCreate); LazyRow(horizontalArrangement=Arrangement.spacedBy(7.dp)){items(listOf("All","Work","Event","Custom")){c->B6Chip(c,category==c){category=c}}};Spacer(Modifier.height(12.dp)) }
        items(shown,key={it.id}){t->Card(Modifier.fillMaxWidth().padding(vertical=4.dp).height(74.dp).clickable{onOpen(t)},colors=CardDefaults.cardColors(containerColor=B6Panel2),shape=RoundedCornerShape(15.dp)){Row(Modifier.fillMaxSize().padding(7.dp),verticalAlignment=Alignment.CenterVertically){B6Photo(t.imageUri,t.outlineArgb,56.dp,RoundedCornerShape(10.dp),true);Spacer(Modifier.width(10.dp));Column(Modifier.weight(1f)){Text(t.name,fontWeight=FontWeight.SemiBold,fontSize=16.sp,maxLines=1);Text("${b6Time(t.startMinutes)} – ${b6EndLabel(t)}",color=B6Muted,fontSize=10.sp);Text(t.category,color=Color(t.outlineArgb),fontSize=9.sp)};Icon(Icons.Outlined.ChevronRight,null,tint=B6Muted)}}}
        item{Spacer(Modifier.height(10.dp));OutlinedButton(onCreate,Modifier.fillMaxWidth().height(50.dp),colors=ButtonDefaults.outlinedButtonColors(contentColor=B6Gold)){Icon(Icons.Outlined.Add,null);Spacer(Modifier.width(6.dp));Text("Create new shift type")}}
    }
}

@Composable private fun B6TypeEditorScreen(existing:B6Template?,defaultLocation:String,recentColors:List<Int>,onBack:()->Unit,onRecentColor:(Int)->Unit,onSave:(B6Template)->Unit,onDelete:(()->Unit)?){
    val context=LocalContext.current
    var name by remember(existing?.id){mutableStateOf(existing?.name?:"")}; var image by remember(existing?.id){mutableStateOf(existing?.imageUri?:"")}; var outline by remember(existing?.id){mutableStateOf(existing?.outlineArgb?:B6Presets.first())}
    var note by remember(existing?.id){mutableStateOf(existing?.note?:"")}; var start by remember(existing?.id){mutableStateOf(existing?.startMinutes?:18*60)}; var end by remember(existing?.id){mutableStateOf(existing?.endMinutes?:2*60)}
    var location by remember(existing?.id){mutableStateOf(existing?.location?:defaultLocation)}; var reminder by remember(existing?.id){mutableStateOf(existing?.reminderMinutes?:60)}; var category by remember(existing?.id){mutableStateOf(existing?.category?:"Work")}; var logoSize by remember(existing?.id){mutableStateOf(existing?.logoSize?:B6LogoSize.LARGE)}; var colorPicker by remember{mutableStateOf(false)}
    val picker=rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()){u:Uri?->u?.let{runCatching{context.contentResolver.takePersistableUriPermission(it,Intent.FLAG_GRANT_READ_URI_PERMISSION)};image=it.toString()}}
    if(colorPicker){ B6ColorPickerScreen(outline,recentColors,onBack={colorPicker=false},onColor={outline=it;onRecentColor(it);colorPicker=false}); return }
    val t=B6Template(existing?.id?:System.currentTimeMillis(),name.trim(),outline,image,note.trim(),start,end,location.trim(),reminder,category,logoSize)
    Column(Modifier.fillMaxSize().background(B6Bg).statusBarsPadding()){
        Row(Modifier.fillMaxWidth().height(58.dp).padding(horizontal=8.dp),verticalAlignment=Alignment.CenterVertically){IconButton(onBack){Icon(Icons.Outlined.ChevronLeft,null,tint=B6Text)};Text(if(existing==null)"New Shift Type" else "Edit Shift Type",modifier=Modifier.weight(1f),textAlign=TextAlign.Center,fontSize=19.sp,fontWeight=FontWeight.SemiBold,color=B6Text);TextButton({onSave(t)},enabled=name.isNotBlank()){Text("Save",color=B6Gold,fontWeight=FontWeight.Bold)}}
        LazyColumn(Modifier.fillMaxSize().padding(horizontal=16.dp),contentPadding=PaddingValues(bottom=36.dp)){
            item{
                Card(Modifier.fillMaxWidth().height(150.dp),colors=CardDefaults.cardColors(containerColor=B6Panel),shape=RoundedCornerShape(20.dp)){Box(Modifier.fillMaxSize(),contentAlignment=Alignment.Center){if(image.isBlank()){Column(horizontalAlignment=Alignment.CenterHorizontally){Icon(Icons.Outlined.Image,null,tint=B6Muted,modifier=Modifier.size(38.dp));Text("Add photo / logo",color=B6Muted,fontSize=11.sp)}}else B6Photo(image,outline,112.dp,RoundedCornerShape(18.dp),true)}}
                Spacer(Modifier.height(10.dp));Button({picker.launch(arrayOf("image/*"))},Modifier.fillMaxWidth().height(46.dp),colors=ButtonDefaults.buttonColors(containerColor=B6Gold,contentColor=B6Bg),shape=RoundedCornerShape(13.dp)){Icon(Icons.Outlined.Image,null);Spacer(Modifier.width(7.dp));Text(if(image.isBlank())"Upload your own picture / logo" else "Change picture / logo")}
                Spacer(Modifier.height(10.dp));OutlinedTextField(name,{name=it},label={Text("Shift type name")},singleLine=true,modifier=Modifier.fillMaxWidth())
                Spacer(Modifier.height(10.dp));Text("Category",color=B6Muted,fontSize=11.sp);Spacer(Modifier.height(6.dp));Row(horizontalArrangement=Arrangement.spacedBy(7.dp)){listOf("Work","Event","Custom").forEach{c->B6Chip(c,category==c){category=c}}}
                Spacer(Modifier.height(10.dp));Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){B6TimeCard("Start",start,Modifier.weight(1f)){h,m->start=h*60+m};B6TimeCard("End",end,Modifier.weight(1f)){h,m->end=h*60+m}}
                Spacer(Modifier.height(10.dp));OutlinedTextField(location,{location=it},label={Text("Location (optional)")},singleLine=true,modifier=Modifier.fillMaxWidth())
                Spacer(Modifier.height(10.dp));Text("Phone reminder",color=B6Muted,fontSize=11.sp);Spacer(Modifier.height(6.dp));LazyRow(horizontalArrangement=Arrangement.spacedBy(6.dp)){items(listOf(0,15,30,60,120,1440)){m->B6Chip(if(m==0)"Off" else b6ReminderLong(m),reminder==m){reminder=m}}}
                Spacer(Modifier.height(12.dp));Text("Logo size on calendar",fontWeight=FontWeight.SemiBold,fontSize=14.sp);Spacer(Modifier.height(6.dp));Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){B6LogoSize.entries.forEach{s->B6LogoSizeChoice(s,logoSize==s,Modifier.weight(1f)){logoSize=s}}}
                Spacer(Modifier.height(12.dp));Text("Outline color",fontWeight=FontWeight.SemiBold,fontSize=14.sp);Spacer(Modifier.height(6.dp));Card(Modifier.fillMaxWidth().height(54.dp).clickable{colorPicker=true},colors=CardDefaults.cardColors(containerColor=B6Panel2),shape=RoundedCornerShape(14.dp)){Row(Modifier.fillMaxSize().padding(horizontal=12.dp),verticalAlignment=Alignment.CenterVertically){Box(Modifier.size(28.dp).background(Color(outline),CircleShape).border(2.dp,B6Text,CircleShape));Spacer(Modifier.width(10.dp));Column{Text("Color wheel + presets",fontWeight=FontWeight.Medium);Text(b6Hex(outline),color=B6Muted,fontSize=10.sp)};Spacer(Modifier.weight(1f));Icon(Icons.Outlined.ColorLens,null,tint=B6Gold)}}
                Spacer(Modifier.height(10.dp));OutlinedTextField(note,{note=it},label={Text("Note (optional)")},modifier=Modifier.fillMaxWidth().height(92.dp))
                if(onDelete!=null){Spacer(Modifier.height(12.dp));OutlinedButton(onDelete,Modifier.fillMaxWidth().height(48.dp),colors=ButtonDefaults.outlinedButtonColors(contentColor=Color(0xFFFF6262))){Icon(Icons.Outlined.Delete,null);Spacer(Modifier.width(6.dp));Text("Delete shift type")}}
            }
        }
    }
}

@Composable private fun B6ColorPickerScreen(initial:Int,recent:List<Int>,onBack:()->Unit,onColor:(Int)->Unit){
    var selected by remember{mutableStateOf(initial)}
    Column(Modifier.fillMaxSize().background(B6Bg).statusBarsPadding().padding(horizontal=16.dp)){
        Row(Modifier.fillMaxWidth().height(58.dp),verticalAlignment=Alignment.CenterVertically){IconButton(onBack){Icon(Icons.Outlined.ChevronLeft,null,tint=B6Text)};Text("Choose Color",modifier=Modifier.weight(1f),textAlign=TextAlign.Center,fontSize=19.sp,fontWeight=FontWeight.SemiBold);TextButton({onColor(selected)}){Text("Done",color=B6Gold,fontWeight=FontWeight.Bold)}}
        Spacer(Modifier.height(6.dp)); B6ColorWheel(selected){selected=it}
        Spacer(Modifier.height(16.dp));Text("Recent colors",fontWeight=FontWeight.SemiBold);Spacer(Modifier.height(8.dp));LazyRow(horizontalArrangement=Arrangement.spacedBy(8.dp)){items((recent.ifEmpty{B6Presets.take(6)}).distinct()){c->B6ColorDot(c,selected==c){selected=c}}}
        Spacer(Modifier.height(18.dp));Text("Color charts",fontWeight=FontWeight.SemiBold);Spacer(Modifier.height(8.dp));B6ColorChart(B6Presets,selected){selected=it}
        Spacer(Modifier.height(18.dp));Text("Selected",color=B6Muted,fontSize=11.sp);Spacer(Modifier.height(7.dp));Card(colors=CardDefaults.cardColors(containerColor=B6Panel2),shape=RoundedCornerShape(14.dp)){Row(Modifier.fillMaxWidth().padding(12.dp),verticalAlignment=Alignment.CenterVertically){Box(Modifier.size(34.dp).background(Color(selected),CircleShape));Spacer(Modifier.width(10.dp));Text(b6Hex(selected),fontWeight=FontWeight.SemiBold)}}
    }
}

@Composable private fun B6ColorWheel(selected:Int,onSelect:(Int)->Unit){
    Box(Modifier.fillMaxWidth(),contentAlignment=Alignment.Center){
        Canvas(Modifier.size(235.dp).pointerInput(Unit){detectTapGestures{p->val cx=size.width/2f;val cy=size.height/2f;val dx=p.x-cx;val dy=p.y-cy;val radius=min(size.width,size.height)/2f;val sat=(sqrt(dx*dx+dy*dy)/radius).coerceIn(0f,1f);var hue=((atan2(dy,dx)*180f/PI.toFloat())+360f)%360f;onSelect(android.graphics.Color.HSVToColor(floatArrayOf(hue,sat,1f)))}}){
            drawCircle(brush=Brush.sweepGradient(listOf(Color.Red,Color.Yellow,Color.Green,Color.Cyan,Color.Blue,Color.Magenta,Color.Red)))
            drawCircle(brush=Brush.radialGradient(listOf(Color.White,Color.Transparent)),alpha=.92f)
        }
    }
}

@Composable private fun B6ColorChart(colors:List<Int>,selected:Int,onSelect:(Int)->Unit){ Column{colors.chunked(8).forEach{row->Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){row.forEach{c->B6ColorDot(c,selected==c){onSelect(c)}}};Spacer(Modifier.height(8.dp))}} }
@Composable private fun B6ColorDot(c:Int,selected:Boolean,onClick:()->Unit){Box(Modifier.size(34.dp).background(Color(c),CircleShape).then(if(selected)Modifier.border(3.dp,B6Text,CircleShape)else Modifier).clickable(onClick=onClick))}

@Composable private fun B6DatePreviewScreen(date:LocalDate,t:B6Template?,onBack:()->Unit,onEdit:()->Unit,onDelete:()->Unit){
    Column(Modifier.fillMaxSize().background(B6Bg).statusBarsPadding().padding(horizontal=16.dp)){
        Row(Modifier.fillMaxWidth().height(58.dp),verticalAlignment=Alignment.CenterVertically){IconButton(onBack){Icon(Icons.Outlined.ChevronLeft,null,tint=B6Text)};Text(date.format(DateTimeFormatter.ofPattern("EEE, d MMMM yyyy")),modifier=Modifier.weight(1f),textAlign=TextAlign.Center,fontSize=17.sp,fontWeight=FontWeight.SemiBold)}
        if(t==null){B6Empty("No shift on this date","Choose a shift type from Calendar and assign it to this date.");return@Column}
        Card(Modifier.fillMaxWidth().height(250.dp),colors=CardDefaults.cardColors(containerColor=B6Panel),shape=RoundedCornerShape(22.dp)){Column(Modifier.fillMaxSize().padding(16.dp),horizontalAlignment=Alignment.CenterHorizontally){B6Photo(t.imageUri,t.outlineArgb,150.dp,RoundedCornerShape(20.dp),true);Spacer(Modifier.height(10.dp));Text(t.name,fontSize=24.sp,fontWeight=FontWeight.Bold);Text("${b6Time(t.startMinutes)} – ${b6EndLabel(t)}",color=B6Muted,fontSize=13.sp)}}
        Spacer(Modifier.height(12.dp));Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){Button(onEdit,Modifier.weight(1f),colors=ButtonDefaults.buttonColors(containerColor=B6Gold,contentColor=B6Bg)){Icon(Icons.Outlined.Edit,null);Spacer(Modifier.width(5.dp));Text("Edit")};OutlinedButton(onDelete,Modifier.weight(1f),colors=ButtonDefaults.outlinedButtonColors(contentColor=Color(0xFFFF6262))){Icon(Icons.Outlined.Delete,null);Spacer(Modifier.width(5.dp));Text("Remove")}}
        Spacer(Modifier.height(12.dp));Card(colors=CardDefaults.cardColors(containerColor=B6Panel2),shape=RoundedCornerShape(16.dp)){Column(Modifier.fillMaxWidth().padding(14.dp)){B6Info(Icons.Outlined.Schedule,"Time","${b6Time(t.startMinutes)} – ${b6EndLabel(t)}");if(t.location.isNotBlank())B6Info(Icons.Outlined.LocationOn,"Location",t.location);B6Info(Icons.Outlined.Notifications,"Reminder",if(t.reminderMinutes<=0)"Off" else b6ReminderLong(t.reminderMinutes));if(t.note.isNotBlank())B6Info(Icons.Outlined.Notes,"Note",t.note)}}
    }
}

@Composable private fun B6AnalyticsScreen(month:YearMonth,templates:List<B6Template>,assignments:List<B6Assignment>,onMonth:(YearMonth)->Unit){
    val map=templates.associateBy{it.id}; val monthRows=assignments.mapNotNull{a->runCatching{LocalDate.parse(a.date)}.getOrNull()?.takeIf{YearMonth.from(it)==month}?.let{d->map[a.templateId]?.let{t->d to t}}}; val counts=monthRows.groupingBy{it.second.id}.eachCount().entries.sortedByDescending{it.value}
    LazyColumn(Modifier.fillMaxSize().padding(horizontal=16.dp),contentPadding=PaddingValues(bottom=20.dp)){
        item{Row(Modifier.fillMaxWidth().padding(top=10.dp),verticalAlignment=Alignment.CenterVertically){Text("Analytics",fontSize=28.sp,fontWeight=FontWeight.Bold)};Spacer(Modifier.height(10.dp));Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically){IconButton({onMonth(month.minusMonths(1))}){Icon(Icons.Outlined.ChevronLeft,null)};Text(month.atDay(1).format(DateTimeFormatter.ofPattern("MMMM yyyy")),modifier=Modifier.weight(1f),textAlign=TextAlign.Center,fontWeight=FontWeight.SemiBold);IconButton({onMonth(month.plusMonths(1))}){Icon(Icons.Outlined.ChevronRight,null)}};Spacer(Modifier.height(8.dp));Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){B6Stat("Total Shifts",monthRows.size.toString(),Modifier.weight(1f));B6Stat("Scheduled Days",monthRows.map{it.first}.distinct().size.toString(),Modifier.weight(1f))};Spacer(Modifier.height(14.dp));Text("Shifts by Type",fontWeight=FontWeight.SemiBold);Spacer(Modifier.height(7.dp))}
        items(counts){e->val t=map[e.key]?:return@items;val pct=if(monthRows.isEmpty())0 else (e.value*100/monthRows.size);Row(Modifier.fillMaxWidth().padding(vertical=6.dp),verticalAlignment=Alignment.CenterVertically){B6Photo(t.imageUri,t.outlineArgb,34.dp,RoundedCornerShape(7.dp),true);Spacer(Modifier.width(8.dp));Text(t.name,modifier=Modifier.width(90.dp),maxLines=1,overflow=TextOverflow.Ellipsis,fontSize=12.sp);LinearProgressIndicator(progress={pct/100f},modifier=Modifier.weight(1f).height(7.dp).clip(CircleShape),color=Color(t.outlineArgb),trackColor=B6Panel2);Spacer(Modifier.width(8.dp));Text("${e.value}  $pct%",color=B6Muted,fontSize=10.sp)} }
    }
}

@Composable private fun B6SettingsScreen(store:B6Store,templates:List<B6Template>,assignments:List<B6Assignment>,notifications:Boolean,onNotifications:(Boolean)->Unit,onTypes:()->Unit){
    val context=LocalContext.current; var job by remember{mutableStateOf(store.jobName())};var location by remember{mutableStateOf(store.defaultLocation())};var editJob by remember{mutableStateOf(false)};var editLoc by remember{mutableStateOf(false)}
    if(editJob)B6TextDialog("Job Name",job,{editJob=false}){job=it;store.setJobName(it);editJob=false}; if(editLoc)B6TextDialog("Default Location",location,{editLoc=false}){location=it;store.setDefaultLocation(it);editLoc=false}
    LazyColumn(Modifier.fillMaxSize().padding(horizontal=16.dp),contentPadding=PaddingValues(bottom=20.dp)){
        item{Text("Settings",fontSize=30.sp,fontWeight=FontWeight.Bold,modifier=Modifier.padding(top=14.dp,bottom=14.dp));Card(colors=CardDefaults.cardColors(containerColor=B6Panel2),shape=RoundedCornerShape(18.dp)){Column{B6SettingRow(Icons.Outlined.Person,"Job Name",job){editJob=true};HorizontalDivider(color=B6Divider);B6SettingRow(Icons.Outlined.LocationOn,"Default Location",location){editLoc=true};HorizontalDivider(color=B6Divider);B6SettingRow(Icons.Outlined.Notifications,"Phone Notifications",if(notifications)"On" else "Off",switch=notifications,onSwitch=onNotifications);HorizontalDivider(color=B6Divider);B6SettingRow(Icons.Outlined.DarkMode,"Appearance","Dark"){};HorizontalDivider(color=B6Divider);B6SettingRow(Icons.Outlined.GridView,"Shift Types",templates.size.toString(),onClick=onTypes);HorizontalDivider(color=B6Divider);B6SettingRow(Icons.Outlined.FileDownload,"Backup & Export",""){b6ExportCsv(context,templates,assignments)};HorizontalDivider(color=B6Divider);B6SettingRow(Icons.Outlined.Info,"About","Beta 0.6.0"){} }} }
    }
}

@Composable private fun B6Header(title:String,onBack:()->Unit,onAdd:(()->Unit)?=null){Row(Modifier.fillMaxWidth().height(58.dp),verticalAlignment=Alignment.CenterVertically){IconButton(onBack){Icon(Icons.Outlined.ChevronLeft,null,tint=B6Text)};Text(title,modifier=Modifier.weight(1f),textAlign=TextAlign.Center,fontSize=20.sp,fontWeight=FontWeight.SemiBold,color=B6Text);if(onAdd!=null)IconButton(onAdd){Icon(Icons.Outlined.Add,null,tint=B6Gold)}else Spacer(Modifier.width(48.dp))}}
@Composable private fun B6Chip(text:String,selected:Boolean,onClick:()->Unit){Surface(color=if(selected)B6Gold else B6Panel2,contentColor=if(selected)B6Bg else B6Text,shape=RoundedCornerShape(18.dp),modifier=Modifier.clickable(onClick=onClick)){Text(text,modifier=Modifier.padding(horizontal=13.dp,vertical=8.dp),fontSize=11.sp)}}
@Composable private fun B6LogoSizeChoice(size:B6LogoSize,selected:Boolean,modifier:Modifier,onClick:()->Unit){Card(modifier.height(76.dp).then(if(selected)Modifier.border(1.7.dp,B6Gold,RoundedCornerShape(14.dp))else Modifier).clickable(onClick=onClick),colors=CardDefaults.cardColors(containerColor=B6Panel2),shape=RoundedCornerShape(14.dp)){Column(Modifier.fillMaxSize(),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.Center){Box(Modifier.size((size.cellDp*.65f).dp).background(B6Gold,RoundedCornerShape(6.dp)));Spacer(Modifier.height(5.dp));Text(size.label,color=if(selected)B6Gold else B6Muted,fontSize=10.sp)}}}
@Composable private fun B6TimeCard(label:String,value:Int,modifier:Modifier,onTime:(Int,Int)->Unit){val context=LocalContext.current;Card(modifier.height(78.dp).clickable{TimePickerDialog(context,{_,h,m->onTime(h,m)},value/60,value%60,true).show()},colors=CardDefaults.cardColors(containerColor=B6Panel2),shape=RoundedCornerShape(14.dp)){Column(Modifier.fillMaxSize().padding(12.dp),verticalArrangement=Arrangement.Center){Text(label,color=B6Muted,fontSize=10.sp);Text(b6Time(value),fontSize=22.sp,fontWeight=FontWeight.SemiBold)}}}
@Composable private fun B6Info(icon:androidx.compose.ui.graphics.vector.ImageVector,label:String,value:String){Row(Modifier.fillMaxWidth().padding(vertical=7.dp),verticalAlignment=Alignment.CenterVertically){Icon(icon,null,tint=B6Gold,modifier=Modifier.size(18.dp));Spacer(Modifier.width(9.dp));Text(label,color=B6Muted,fontSize=11.sp,modifier=Modifier.width(70.dp));Text(value,fontSize=12.sp,modifier=Modifier.weight(1f))}}
@Composable private fun B6Stat(label:String,value:String,modifier:Modifier){Card(modifier.height(84.dp),colors=CardDefaults.cardColors(containerColor=B6Panel2),shape=RoundedCornerShape(14.dp)){Column(Modifier.fillMaxSize().padding(12.dp),verticalArrangement=Arrangement.Center){Text(label,color=B6Muted,fontSize=10.sp);Text(value,fontSize=24.sp,fontWeight=FontWeight.Bold)}}}
@Composable private fun B6Empty(title:String,subtitle:String){Card(Modifier.fillMaxWidth(),colors=CardDefaults.cardColors(containerColor=B6Panel2),shape=RoundedCornerShape(15.dp)){Column(Modifier.padding(14.dp)){Text(title,fontWeight=FontWeight.SemiBold);Text(subtitle,color=B6Muted,fontSize=10.sp)}}}

@Composable private fun B6SettingRow(icon:androidx.compose.ui.graphics.vector.ImageVector,label:String,value:String,onClick:()->Unit={},switch:Boolean?=null,onSwitch:(Boolean)->Unit={}){Row(Modifier.fillMaxWidth().height(62.dp).clickable(enabled=switch==null,onClick=onClick).padding(horizontal=13.dp),verticalAlignment=Alignment.CenterVertically){Icon(icon,null,tint=if(label=="Shift Types")B6Gold else B6Text,modifier=Modifier.size(19.dp));Spacer(Modifier.width(10.dp));Text(label,modifier=Modifier.weight(1f),fontSize=14.sp);if(switch!=null)Switch(checked=switch,onCheckedChange=onSwitch,colors=SwitchDefaults.colors(checkedThumbColor=B6Bg,checkedTrackColor=B6Gold))else{Text(value,color=B6Muted,fontSize=12.sp,maxLines=1);Spacer(Modifier.width(4.dp));Icon(Icons.Outlined.ChevronRight,null,tint=B6Muted,modifier=Modifier.size(18.dp))}}}
@Composable private fun B6TextDialog(title:String,current:String,onDismiss:()->Unit,onSave:(String)->Unit){var v by remember{mutableStateOf(current)};AlertDialog(onDismissRequest=onDismiss,title={Text(title)},text={OutlinedTextField(v,{v=it},singleLine=true)},confirmButton={TextButton({if(v.isNotBlank())onSave(v.trim())}){Text("Save",color=B6Gold)}},dismissButton={TextButton(onDismiss){Text("Cancel")}})}

private fun b6Time(minutes:Int)=String.format(Locale.getDefault(),"%02d:%02d",(minutes/60)%24,minutes%60)
private fun b6EndLabel(t:B6Template)=b6Time(t.endMinutes)+(if(t.endMinutes<=t.startMinutes)" (+1)" else "")
private fun b6ReminderShort(m:Int)=when{m>=1440->"1d";m>=60->"${m/60}h";else->"${m}m"}
private fun b6ReminderLong(m:Int)=when{m>=1440->"1 day";m>=60->"${m/60}h before";else->"${m}m"}
private fun b6Hex(c:Int)=String.format("#%06X",0xFFFFFF and c)
private fun b6ExportCsv(context:Context,templates:List<B6Template>,assignments:List<B6Assignment>){val map=templates.associateBy{it.id};val body=buildString{appendLine("Date,Shift,Start,End,Location,Reminder");assignments.sortedBy{it.date}.forEach{a->map[a.templateId]?.let{t->appendLine("${a.date},\"${t.name.replace("\"","\"\"")}\",${b6Time(t.startMinutes)},${b6EndLabel(t)},\"${t.location.replace("\"","\"\"")}\",${t.reminderMinutes}")}}};val intent=Intent(Intent.ACTION_SEND).apply{type="text/plain";putExtra(Intent.EXTRA_SUBJECT,"Work Schedule Export");putExtra(Intent.EXTRA_TEXT,body)};context.startActivity(Intent.createChooser(intent,"Export schedule"))}
