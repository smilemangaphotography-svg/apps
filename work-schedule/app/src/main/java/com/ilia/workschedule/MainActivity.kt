@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.ilia.workschedule

import android.Manifest
import android.app.*
import android.content.*
import android.content.pm.PackageManager
import android.net.Uri
import android.os.*
import androidx.activity.ComponentActivity
import androidx.activity.compose.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.*
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject
import java.time.*
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.max

private val Bronze=Color(0xFFD6A85C); private val Bg=Color(0xFF171A20); private val Panel=Color(0xFF242830)
private val Panel2=Color(0xFF30343C); private val Txt=Color(0xFFF5F3EF); private val Muted=Color(0xFF9EA3AD); private val Pink=Color(0xFFF0A8D8)

data class Entry(val id:Long=System.currentTimeMillis(), val kind:String="SHIFT", val title:String="Night Shift", val date:String=LocalDate.now().toString(), val start:Int=18*60, val end:Int=2*60, val breakMin:Int=30, val type:String="Night", val location:String="", val rate:Double=0.0, val notes:String="", val reminder:Int=60)

class Store(private val c:Context){
    private val p=c.getSharedPreferences("work_schedule",Context.MODE_PRIVATE)
    fun load():List<Entry>{ val a=JSONArray(p.getString("entries","[]")); return (0 until a.length()).map{ o(a.getJSONObject(it)) }.sortedWith(compareBy<Entry>{it.date}.thenBy{it.start}) }
    fun save(list:List<Entry>){ val a=JSONArray(); list.forEach{e->a.put(j(e))}; p.edit().putString("entries",a.toString()).apply() }
    fun s(k:String,d:String)=p.getString(k,d)?:d; fun f(k:String,d:Float)=p.getFloat(k,d); fun i(k:String,d:Int)=p.getInt(k,d); fun b(k:String,d:Boolean)=p.getBoolean(k,d)
    fun put(k:String,v:String)=p.edit().putString(k,v).apply(); fun put(k:String,v:Float)=p.edit().putFloat(k,v).apply(); fun put(k:String,v:Int)=p.edit().putInt(k,v).apply(); fun put(k:String,v:Boolean)=p.edit().putBoolean(k,v).apply()
    private fun j(e:Entry)=JSONObject().apply{put("id",e.id);put("kind",e.kind);put("title",e.title);put("date",e.date);put("start",e.start);put("end",e.end);put("break",e.breakMin);put("type",e.type);put("location",e.location);put("rate",e.rate);put("notes",e.notes);put("reminder",e.reminder)}
    private fun o(x:JSONObject)=Entry(x.optLong("id"),x.optString("kind","SHIFT"),x.optString("title"),x.optString("date"),x.optInt("start"),x.optInt("end"),x.optInt("break"),x.optString("type"),x.optString("location"),x.optDouble("rate"),x.optString("notes"),x.optInt("reminder"))
}

class MainActivity:ComponentActivity(){ override fun onCreate(b:Bundle?){super.onCreate(b); channel(this); setContent{ Theme{ App() } } } }
class ReminderReceiver:BroadcastReceiver(){ override fun onReceive(c:Context,i:Intent){ val n=NotificationCompat.Builder(c,"schedule").setSmallIcon(android.R.drawable.ic_popup_reminder).setContentTitle(i.getStringExtra("t")?:"Work Schedule").setContentText(i.getStringExtra("b")?:"Upcoming event").setPriority(NotificationCompat.PRIORITY_HIGH).setAutoCancel(true).build(); (c.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).notify(i.getLongExtra("id",1).toInt(),n) } }
private fun channel(c:Context){if(Build.VERSION.SDK_INT>=26)(c.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(NotificationChannel("schedule","Schedule reminders",NotificationManager.IMPORTANCE_HIGH))}
private fun alarm(c:Context,e:Entry){if(e.reminder<=0)return; val t=LocalDateTime.of(LocalDate.parse(e.date),LocalTime.of(e.start/60,e.start%60)).minusMinutes(e.reminder.toLong()).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli(); if(t<=System.currentTimeMillis())return; val i=Intent(c,ReminderReceiver::class.java).putExtra("id",e.id).putExtra("t",if(e.kind=="SHIFT")"Upcoming ${e.type} shift" else e.title).putExtra("b","${ft(e.start)} • ${e.location.ifBlank{"Work Schedule"}}"); val pi=PendingIntent.getBroadcast(c,e.id.toInt(),i,PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE); (c.getSystemService(Context.ALARM_SERVICE) as AlarmManager).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,t,pi)}

@Composable private fun Theme(x: @Composable () -> Unit)=MaterialTheme(colorScheme=darkColorScheme(primary=Bronze,background=Bg,surface=Panel,onBackground=Txt,onSurface=Txt),content=x)
enum class Tab{CALENDAR,SHIFTS,ANALYTICS,SETTINGS}; sealed interface Route{data object Main:Route; data class Day(val d:LocalDate):Route; data class Edit(val d:LocalDate,val e:Entry?=null,val personal:Boolean=false):Route}

@Composable fun App(){
    val c=LocalContext.current; val st=remember{Store(c)}; var data by remember{mutableStateOf(st.load())}; var tab by remember{mutableStateOf(Tab.CALENDAR)}; var route:Route by remember{mutableStateOf(Route.Main)}; var month by remember{mutableStateOf(YearMonth.now())}; var sheet by remember{mutableStateOf(false)}; var addDate by remember{mutableStateOf(LocalDate.now())}
    val perm=rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()){}; LaunchedEffect(Unit){if(Build.VERSION.SDK_INT>=33&&ContextCompat.checkSelfPermission(c,Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)perm.launch(Manifest.permission.POST_NOTIFICATIONS)}
    fun persist(v:List<Entry>){data=v.sortedWith(compareBy<Entry>{it.date}.thenBy{it.start});st.save(data)}
    BackHandler(route !is Route.Main){route=Route.Main}
    when(val r=route){
        Route.Main->Scaffold(containerColor=Bg,bottomBar={Nav(tab){tab=it}}){p->Box(Modifier.fillMaxSize().padding(p).statusBarsPadding()){
            when(tab){
                Tab.CALENDAR->Calendar(data,month,st,{month=it},{route=Route.Day(it)},{d->addDate=d;sheet=true},{share(c,month,data)},{tab=Tab.SETTINGS})
                Tab.SHIFTS->Shifts(data){route=Route.Edit(LocalDate.parse(it.date),it,it.kind=="PERSONAL")}
                Tab.ANALYTICS->Analytics(data)
                Tab.SETTINGS->Settings(st,data)
            }
        }; if(sheet)AddSheet({sheet=false},{sheet=false;route=Route.Edit(addDate)},{sheet=false;route=Route.Edit(addDate,personal=true)},{sheet=false;route=Route.Edit(addDate)})}
        is Route.Day->Day(r.d,data.filter{it.date==r.d.toString()},{route=Route.Main},{route=Route.Edit(r.d)},{route=Route.Edit(r.d,personal=true)},{route=Route.Edit(r.d,it,it.kind=="PERSONAL")})
        is Route.Edit->Editor(r.d,r.e,r.personal,st,{route=Route.Main},{e,repeat,days->
            val old=data.filterNot{it.id==r.e?.id}; val made=if(r.e!=null)listOf(e.copy(id=r.e.id)) else repeat(e,repeat,days); persist(old+made); made.filter{st.b("notifications",true)}.forEach{alarm(c,it)}; month=YearMonth.from(LocalDate.parse(e.date));route=Route.Main;tab=Tab.CALENDAR
        },if(r.e!=null){{persist(data.filterNot{it.id==r.e.id});route=Route.Main}}else null)
    }
}

@Composable fun Nav(s:Tab,on:(Tab)->Unit){NavigationBar(containerColor=Bg,modifier=Modifier.navigationBarsPadding()){listOf(Tab.CALENDAR to Icons.Outlined.Home,Tab.SHIFTS to Icons.Outlined.Work,Tab.ANALYTICS to Icons.Outlined.Analytics,Tab.SETTINGS to Icons.Outlined.Settings).forEach{(t,i)->NavigationBarItem(t==s,{on(t)},{Icon(i,null)},{Text(t.name.lowercase().replaceFirstChar{it.uppercase()},fontSize=11.sp)},colors=NavigationBarItemDefaults.colors(selectedIconColor=Bronze,selectedTextColor=Bronze,indicatorColor=Color.Transparent,unselectedIconColor=Muted,unselectedTextColor=Muted))}}}

@Composable fun Calendar(data:List<Entry>,m:YearMonth,st:Store,onM:(YearMonth)->Unit,onD:(LocalDate)->Unit,onAdd:(LocalDate)->Unit,onShare:()->Unit,onSettings:()->Unit){
    var drag by remember{mutableStateOf(0f)}; val fmt=DateTimeFormatter.ofPattern("MMMM yyyy",Locale.getDefault()); Column(Modifier.fillMaxSize().padding(horizontal=20.dp)){
        Row(Modifier.fillMaxWidth().padding(top=12.dp),verticalAlignment=Alignment.CenterVertically){Text(st.s("job","Main Job")+" ⌄",fontSize=24.sp);Spacer(Modifier.weight(1f));IconButton(onShare){Icon(Icons.Outlined.Share,null)};IconButton(onSettings){Icon(Icons.Outlined.CalendarMonth,null)}}
        Spacer(Modifier.height(22.dp)); Card(colors=CardDefaults.cardColors(Panel2),shape=RoundedCornerShape(24.dp)){Row(Modifier.fillMaxWidth().padding(20.dp),verticalAlignment=Alignment.CenterVertically){Text(fmt.format(m.atDay(1)),fontSize=30.sp,fontWeight=FontWeight.Medium);Spacer(Modifier.weight(1f));IconButton({onAdd(if(YearMonth.from(LocalDate.now())==m)LocalDate.now() else m.atDay(1))},Modifier.size(56.dp).background(Txt,CircleShape)){Icon(Icons.Outlined.Add,null,tint=Bg,modifier=Modifier.size(30.dp))}}}
        Spacer(Modifier.height(12.dp));Row(Modifier.fillMaxWidth()){listOf("Mon","Tue","Wed","Thu","Fri","Sat","Sun").forEachIndexed{i,d->Text(d,color=if(i>4)Muted else Txt,textAlign=TextAlign.Center,modifier=Modifier.weight(1f))}};Spacer(Modifier.height(10.dp))
        Card(colors=CardDefaults.cardColors(Panel2),shape=RoundedCornerShape(24.dp),modifier=Modifier.fillMaxWidth().weight(1f).pointerInput(m){detectHorizontalDragGestures(onHorizontalDrag={_,a->drag+=a},onDragEnd={if(drag>80)onM(m.minusMonths(1));if(drag< -80)onM(m.plusMonths(1));drag=0f})}){Grid(m,data,onD)};Spacer(Modifier.height(8.dp))
    }
}
@Composable fun Grid(m:YearMonth,data:List<Entry>,onD:(LocalDate)->Unit){val off=m.atDay(1).dayOfWeek.value-1;val n=m.lengthOfMonth();Column(Modifier.padding(12.dp)){repeat(6){r->Row(Modifier.weight(1f)){repeat(7){c->val d=r*7+c-off+1;if(d in 1..n){val dt=m.atDay(d);val ev=data.filter{it.date==dt.toString()};Column(Modifier.weight(1f).fillMaxHeight().padding(2.dp).clickable{onD(dt)},horizontalAlignment=Alignment.CenterHorizontally){Text("$d",fontSize=16.sp,modifier=Modifier.padding(top=5.dp));ev.take(2).forEach{e->Text(if(e.kind=="SHIFT")e.type else e.title,fontSize=9.sp,color=Color(0xFF17120B),maxLines=1,overflow=TextOverflow.Ellipsis,modifier=Modifier.fillMaxWidth().padding(1.dp).background(if(e.kind=="SHIFT")Bronze else Pink,RoundedCornerShape(4.dp)).padding(horizontal=3.dp,vertical=2.dp))}}}else Spacer(Modifier.weight(1f))}}}}}

@Composable fun AddSheet(close:()->Unit,shift:()->Unit,personal:()->Unit,repeat:()->Unit){ModalBottomSheet(close,containerColor=Panel2){Text("Add to schedule",fontSize=20.sp,fontWeight=FontWeight.SemiBold,modifier=Modifier.padding(horizontal=20.dp));Action("Add Shift","Add a work shift",Icons.Outlined.Work,shift);Action("Add Personal Event","Appointment, travel, etc.",Icons.Outlined.Event,personal);Action("Quick Repeat Shift","Add multiple shifts",Icons.Outlined.Schedule,repeat);Spacer(Modifier.height(20.dp))}}
@Composable fun Action(t:String,s:String,i:androidx.compose.ui.graphics.vector.ImageVector,on:()->Unit){Card(Modifier.fillMaxWidth().padding(horizontal=16.dp,vertical=6.dp).clickable(onClick=on),colors=CardDefaults.cardColors(Panel),shape=RoundedCornerShape(18.dp)){Row(Modifier.padding(16.dp),verticalAlignment=Alignment.CenterVertically){Icon(i,null,tint=Bronze);Spacer(Modifier.width(14.dp));Column(Modifier.weight(1f)){Text(t,fontWeight=FontWeight.SemiBold);Text(s,color=Muted,fontSize=13.sp)};Icon(Icons.Outlined.ChevronRight,null,color=Muted)}}}

@Composable fun Day(d:LocalDate,ev:List<Entry>,back:()->Unit,addS:()->Unit,addP:()->Unit,open:(Entry)->Unit){Column(Modifier.fillMaxSize().background(Bg).statusBarsPadding().padding(20.dp)){Row(verticalAlignment=Alignment.CenterVertically){IconButton(back){Icon(Icons.Outlined.ChevronLeft,null)};Text(d.format(DateTimeFormatter.ofPattern("EEE, d MMMM yyyy")),fontSize=21.sp,fontWeight=FontWeight.SemiBold)};Spacer(Modifier.height(12.dp));LazyColumn(Modifier.weight(1f)){items(ev,key={it.id}){CardEntry(it,open)}};Button(addS,Modifier.fillMaxWidth(),colors=ButtonDefaults.buttonColors(containerColor=Bronze,contentColor=Bg)){Text("+  Add Shift")};Spacer(Modifier.height(8.dp));OutlinedButton(addP,Modifier.fillMaxWidth()){Text("+  Add Personal Event")};Spacer(Modifier.navigationBarsPadding())}}
@Composable fun CardEntry(e:Entry,open:(Entry)->Unit){Card(Modifier.fillMaxWidth().padding(vertical=5.dp).clickable{open(e)},colors=CardDefaults.cardColors(Panel),shape=RoundedCornerShape(17.dp)){Row(Modifier.padding(15.dp),verticalAlignment=Alignment.CenterVertically){Icon(if(e.kind=="SHIFT")Icons.Outlined.Work else Icons.Outlined.Event,null,tint=if(e.kind=="SHIFT")Bronze else Pink);Spacer(Modifier.width(12.dp));Column(Modifier.weight(1f)){Text(if(e.kind=="SHIFT")"${e.type} Shift" else e.title,fontWeight=FontWeight.SemiBold);Text(timeLine(e),color=Muted,fontSize=13.sp);if(e.kind=="SHIFT")Text("${dur(paid(e))} • €${"%.2f".format(e.rate*paid(e)/60.0)}",color=Bronze,fontSize=13.sp)};Icon(Icons.Outlined.Edit,null,tint=Muted)}}}

@Composable fun Shifts(data:List<Entry>,open:(Entry)->Unit){var f by remember{mutableStateOf("Upcoming")};val today=LocalDate.now();val x=data.filter{val d=LocalDate.parse(it.date);when(f){"Upcoming"->!d.isBefore(today);"Past"->d.isBefore(today);else->true}};Column(Modifier.fillMaxSize().padding(horizontal=20.dp)){Text("Shifts",fontSize=30.sp,fontWeight=FontWeight.SemiBold,modifier=Modifier.padding(top=18.dp));Row(horizontalArrangement=Arrangement.spacedBy(8.dp),modifier=Modifier.padding(vertical=12.dp)){listOf("Upcoming","Past","All").forEach{o->FilterChip(f==o,{f=o},{Text(o)})}};LazyColumn{items(x,key={it.id}){e->Text(LocalDate.parse(e.date).format(DateTimeFormatter.ofPattern("EEE, d MMM")),color=Muted,fontSize=12.sp,modifier=Modifier.padding(top=8.dp));CardEntry(e,open)}}}}

@Composable fun Analytics(data:List<Entry>){var m by remember{mutableStateOf(YearMonth.now())};val x=data.filter{it.kind=="SHIFT"&&YearMonth.from(LocalDate.parse(it.date))==m};val min=x.sumOf{paid(it)};val earn=x.sumOf{it.rate*paid(it)/60.0};Column(Modifier.fillMaxSize().padding(horizontal=20.dp)){Text("Analytics",fontSize=30.sp,fontWeight=FontWeight.SemiBold,modifier=Modifier.padding(top=18.dp));Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically){IconButton({m=m.minusMonths(1)}){Icon(Icons.Outlined.ChevronLeft,null)};Text(m.atDay(1).format(DateTimeFormatter.ofPattern("MMMM yyyy")),textAlign=TextAlign.Center,modifier=Modifier.weight(1f));IconButton({m=m.plusMonths(1)}){Icon(Icons.Outlined.ChevronRight,null)}};Row(horizontalArrangement=Arrangement.spacedBy(10.dp)){Stat("Total Hours",dur(min),Modifier.weight(1f));Stat("Total Shifts","${x.size}",Modifier.weight(1f))};Spacer(Modifier.height(10.dp));Row(horizontalArrangement=Arrangement.spacedBy(10.dp)){Stat("Total Earnings","€${"%.2f".format(earn)}",Modifier.weight(1f));Stat("Avg. per Shift","€${"%.2f".format(if(x.isEmpty())0.0 else earn/x.size)}",Modifier.weight(1f))};Spacer(Modifier.height(24.dp));Text("Shift Types",fontSize=18.sp,fontWeight=FontWeight.SemiBold);x.groupingBy{it.type}.eachCount().forEach{(t,n)->Row(Modifier.fillMaxWidth().padding(vertical=7.dp)){Box(Modifier.size(10.dp).background(Bronze,CircleShape));Spacer(Modifier.width(8.dp));Text(t,Modifier.weight(1f));Text("$n (${if(x.isEmpty())0 else n*100/x.size}%)",color=Muted)}}}}
@Composable fun Stat(l:String,v:String,m:Modifier){Card(m,colors=CardDefaults.cardColors(Panel),shape=RoundedCornerShape(16.dp)){Column(Modifier.padding(15.dp)){Text(l,color=Muted,fontSize=12.sp);Text(v,fontSize=23.sp,fontWeight=FontWeight.SemiBold)}}}

@Composable fun Settings(st:Store,data:List<Entry>){val c=LocalContext.current;var job by remember{mutableStateOf(st.s("job","Main Job"))};var loc by remember{mutableStateOf(st.s("location","Santai Lounge"))};var rate by remember{mutableStateOf(st.f("rate",8.5f))};var br by remember{mutableStateOf(st.i("break",30))};var notif by remember{mutableStateOf(st.b("notifications",true))};var edit by remember{mutableStateOf("")};var export by remember{mutableStateOf(false)};var content by remember{mutableStateOf("")};val launcher=rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("text/csv")){u:Uri?->u?.let{c.contentResolver.openOutputStream(it)?.use{o->o.write(content.toByteArray())}}};Column(Modifier.fillMaxSize().padding(horizontal=20.dp)){Text("Settings",fontSize=30.sp,fontWeight=FontWeight.SemiBold,modifier=Modifier.padding(top=18.dp));Text("Work Profile",color=Muted,fontSize=13.sp,modifier=Modifier.padding(top=14.dp,bottom=6.dp));Card(colors=CardDefaults.cardColors(Panel),shape=RoundedCornerShape(18.dp)){SetRow("Job Name",job){edit="job"};HorizontalDivider(color=Color.White.copy(.06f));SetRow("Default Location",loc){edit="loc"};HorizontalDivider(color=Color.White.copy(.06f));SetRow("Default Hourly Rate","€${"%.2f".format(rate)}"){edit="rate"};HorizontalDivider(color=Color.White.copy(.06f));SetRow("Default Break","$br min"){edit="break"}};Spacer(Modifier.height(14.dp));Card(colors=CardDefaults.cardColors(Panel),shape=RoundedCornerShape(18.dp)){SetRow("Shift Types","Day • Evening • Night • Split • Extra • Holiday"){};HorizontalDivider(color=Color.White.copy(.06f));Row(Modifier.fillMaxWidth().padding(16.dp),verticalAlignment=Alignment.CenterVertically){Icon(Icons.Outlined.Notifications,null,tint=Bronze);Spacer(Modifier.width(12.dp));Text("Notifications",Modifier.weight(1f));Switch(notif,{notif=it;st.put("notifications",it)})};HorizontalDivider(color=Color.White.copy(.06f));SetRow("Appearance","Dark"){};HorizontalDivider(color=Color.White.copy(.06f));SetRow("Backup & Export","CSV"){export=true};HorizontalDivider(color=Color.White.copy(.06f));SetRow("About","Beta 0.1.0"){}}}
    if(edit.isNotEmpty()){val cur=when(edit){"job"->job;"loc"->loc;"rate"->rate.toString();else->br.toString()};EditDialog(edit,cur,{edit=""}){v->when(edit){"job"->{job=v;st.put("job",v)};"loc"->{loc=v;st.put("location",v)};"rate"->{rate=v.toFloatOrNull()?:rate;st.put("rate",rate)};else->{br=v.toIntOrNull()?:br;st.put("break",br)}};edit=""}}
    if(export)AlertDialog({export=false},{TextButton({export=false}){Text("Cancel")}},{Button({content=csv(data);export=false;launcher.launch("work-schedule.csv")}){Text("Export CSV")}},{Text("Backup & Export")},{Text("Export your schedule, hours and earnings as CSV.")})
}
@Composable fun SetRow(l:String,v:String,on:()->Unit){Row(Modifier.fillMaxWidth().clickable(onClick=on).padding(16.dp),verticalAlignment=Alignment.CenterVertically){Text(l,Modifier.weight(1f));Text(v,color=Muted,fontSize=12.sp,maxLines=1,overflow=TextOverflow.Ellipsis);Icon(Icons.Outlined.ChevronRight,null,tint=Muted,modifier=Modifier.size(18.dp))}}
@Composable fun EditDialog(k:String,cur:String,close:()->Unit,save:(String)->Unit){var t by remember(cur){mutableStateOf(cur)};AlertDialog(close,{TextButton(close){Text("Cancel")}},{TextButton({save(t)}){Text("Save")}},{Text(k.replaceFirstChar{it.uppercase()})},{OutlinedTextField(t,{t=it},singleLine=true,keyboardOptions=KeyboardOptions(keyboardType=if(k=="rate"||k=="break")KeyboardType.Decimal else KeyboardType.Text))})}

@Composable fun Editor(d:LocalDate,old:Entry?,personal:Boolean,st:Store,cancel:()->Unit,save:(Entry,String,Set<DayOfWeek>)->Unit,delete:(()->Unit)?){val c=LocalContext.current;var date by remember{mutableStateOf(old?.let{LocalDate.parse(it.date)}?:d)};var title by remember{mutableStateOf(old?.title?:if(personal)"" else "Night Shift")};var start by remember{mutableStateOf(old?.start?:if(personal)19*60 else 18*60)};var end by remember{mutableStateOf(old?.end?:2*60)};var br by remember{mutableStateOf(old?.breakMin?:st.i("break",30))};var type by remember{mutableStateOf(old?.type?:"Night")};var loc by remember{mutableStateOf(old?.location?:st.s("location","Santai Lounge"))};var rate by remember{mutableStateOf(old?.rate?:st.f("rate",8.5f).toDouble())};var notes by remember{mutableStateOf(old?.notes?:"")};var reminder by remember{mutableStateOf(old?.reminder?:60)};var rep by remember{mutableStateOf("Never")};var days by remember{mutableStateOf(setOf(date.dayOfWeek))};var menu by remember{mutableStateOf("")};var del by remember{mutableStateOf(false)};val e=Entry(old?.id?:System.currentTimeMillis(),if(personal)"PERSONAL" else "SHIFT",if(personal)title.ifBlank{"Personal Event"} else "$type Shift",date.toString(),start,if(personal)start else end,if(personal)0 else br,type,loc,if(personal)0.0 else rate,notes,reminder)
    Column(Modifier.fillMaxSize().background(Bg).statusBarsPadding().padding(horizontal=20.dp)){Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically){TextButton(cancel){Text("Cancel",color=Txt)};Text(if(personal)if(old==null)"Personal Event" else "Edit Event" else if(old==null)"Add Shift" else "Edit Shift",Modifier.weight(1f),textAlign=TextAlign.Center,fontSize=20.sp,fontWeight=FontWeight.SemiBold);TextButton({save(e,if(old==null)rep else "Never",days)},enabled=!personal||title.isNotBlank()){Text("Save",color=Bronze,fontWeight=FontWeight.Bold)}};LazyColumn(Modifier.weight(1f)){item{Spacer(Modifier.height(10.dp));if(personal){Field("Event Title",title){title=it};Spacer(Modifier.height(8.dp))};Pick("Date",date.format(DateTimeFormatter.ofPattern("EEE, d MMMM yyyy"))){datePick(c,date){date=it}};Spacer(Modifier.height(8.dp));Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){Pick(if(personal)"Time" else "Start Time",ft(start),Modifier.weight(1f)){timePick(c,start){start=it}};if(!personal)Pick("End Time",ft(end)+(if(end<=start)" (+1)" else ""),Modifier.weight(1f)){timePick(c,end){end=it}}};if(!personal){Spacer(Modifier.height(8.dp));Field("Break (minutes)",br.toString(),true){br=it.toIntOrNull()?:0};Spacer(Modifier.height(8.dp));Box{Pick("Shift Type",type){menu="type"};DropdownMenu(menu=="type",{menu=""}){listOf("Day","Evening","Night","Split","Extra","Holiday").forEach{x->DropdownMenuItem({Text(x)},{type=x;menu=""})}}}};Spacer(Modifier.height(8.dp));Field("Location",loc){loc=it};if(!personal){Spacer(Modifier.height(8.dp));Field("Hourly Rate (€)",rate.toString(),true){rate=it.toDoubleOrNull()?:0.0};if(old==null){Spacer(Modifier.height(8.dp));Box{Pick("Repeat",rep){menu="rep"};DropdownMenu(menu=="rep",{menu=""}){listOf("Never","Daily","Weekly","Custom").forEach{x->DropdownMenuItem({Text(x)},{rep=x;menu=""})}}};if(rep=="Custom")Days(days){days=it}}};Spacer(Modifier.height(8.dp));Box{Pick("Reminder",remLabel(reminder)){menu="rem"};DropdownMenu(menu=="rem",{menu=""}){listOf(0,30,60,120,1440).forEach{x->DropdownMenuItem({Text(remLabel(x))},{reminder=x;menu=""})}}};Spacer(Modifier.height(8.dp));OutlinedTextField(notes,{notes=it},label={Text("Notes")},minLines=4,modifier=Modifier.fillMaxWidth());if(!personal){Spacer(Modifier.height(10.dp));Card(colors=CardDefaults.cardColors(Panel),shape=RoundedCornerShape(16.dp)){Column(Modifier.padding(15.dp)){Sum("Total time",dur(total(e)));Sum("Break","- ${e.breakMin}m");Sum("Paid hours",dur(paid(e)));Sum("Estimated pay","€${"%.2f".format(e.rate*paid(e)/60.0)}",Bronze)}}};if(delete!=null){Spacer(Modifier.height(14.dp));OutlinedButton({del=true},Modifier.fillMaxWidth()){Icon(Icons.Outlined.Delete,null);Spacer(Modifier.width(8.dp));Text("Delete")}};Spacer(Modifier.height(24.dp))}}}
    if(del)AlertDialog({del=false},{TextButton({del=false}){Text("Cancel")}},{TextButton({del=false;delete?.invoke()}){Text("Delete")}},{Text("Delete entry?")},{Text("This cannot be undone.")})
}
@Composable fun Pick(l:String,v:String,m:Modifier=Modifier,on:()->Unit){Card(m.fillMaxWidth().clickable(onClick=on),colors=CardDefaults.cardColors(Panel),shape=RoundedCornerShape(16.dp)){Column(Modifier.padding(14.dp)){Text(l,color=Muted,fontSize=12.sp);Text(v,fontSize=16.sp)}}}
@Composable fun Field(l:String,v:String,num:Boolean=false,on:(String)->Unit){OutlinedTextField(v,on,label={Text(l)},singleLine=true,keyboardOptions=KeyboardOptions(keyboardType=if(num)KeyboardType.Decimal else KeyboardType.Text),modifier=Modifier.fillMaxWidth())}
@Composable fun Days(s:Set<DayOfWeek>,on:(Set<DayOfWeek>)->Unit){Card(colors=CardDefaults.cardColors(Panel)){Column(Modifier.padding(8.dp)){DayOfWeek.values().forEach{d->Row(verticalAlignment=Alignment.CenterVertically){Checkbox(d in s,{x->on(if(x)s+d else s-d)});Text(d.name.lowercase().replaceFirstChar{it.uppercase()})}}}}}
@Composable fun Sum(l:String,v:String,c:Color=Txt){Row(Modifier.fillMaxWidth().padding(vertical=2.dp)){Text(l,color=Muted,modifier=Modifier.weight(1f));Text(v,color=c)}}

private fun datePick(c:Context,d:LocalDate,on:(LocalDate)->Unit)=DatePickerDialog(c,{_,y,m,x->on(LocalDate.of(y,m+1,x))},d.year,d.monthValue-1,d.dayOfMonth).show()
private fun timePick(c:Context,m:Int,on:(Int)->Unit)=TimePickerDialog(c,{_,h,x->on(h*60+x)},m/60,m%60,true).show()
private fun total(e:Entry):Int{var x=e.end-e.start;if(x<=0)x+=1440;return x}
private fun paid(e:Entry)=max(0,total(e)-e.breakMin)
private fun ft(m:Int)="%02d:%02d".format(m/60,m%60)
private fun dur(m:Int)="${m/60}h ${m%60}m"
private fun timeLine(e:Entry)=if(e.kind=="SHIFT")"${ft(e.start)} – ${ft(e.end)}${if(e.end<=e.start)" (+1)" else ""}${if(e.location.isNotBlank())" • ${e.location}" else ""}" else "${ft(e.start)}${if(e.location.isNotBlank())" • ${e.location}" else ""}"
private fun remLabel(x:Int)=when(x){0->"None";30->"30 minutes before";60->"1 hour before";120->"2 hours before";1440->"1 day before";else->"$x minutes before"}
private fun repeat(e:Entry,r:String,days:Set<DayOfWeek>):List<Entry>{val s=LocalDate.parse(e.date);val end=s.plusYears(1);return when(r){"Daily"->generateSequence(s){it.plusDays(1)}.takeWhile{!it.isAfter(end)}.map{e.copy(id=System.nanoTime()+it.toEpochDay(),date=it.toString())}.toList();"Weekly"->generateSequence(s){it.plusWeeks(1)}.takeWhile{!it.isAfter(end)}.map{e.copy(id=System.nanoTime()+it.toEpochDay(),date=it.toString())}.toList();"Custom"->generateSequence(s){it.plusDays(1)}.takeWhile{!it.isAfter(end)}.filter{it.dayOfWeek in days}.map{e.copy(id=System.nanoTime()+it.toEpochDay(),date=it.toString())}.toList();else->listOf(e)}}
private fun share(c:Context,m:YearMonth,d:List<Entry>){val t=buildString{appendLine(m.atDay(1).format(DateTimeFormatter.ofPattern("MMMM yyyy")));d.filter{YearMonth.from(LocalDate.parse(it.date))==m}.forEach{appendLine("${it.date} • ${if(it.kind=="SHIFT")it.type else it.title} • ${ft(it.start)}")}};c.startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT,t),"Share schedule"))}
private fun csvEscape(v:Any)="\""+v.toString().replace("\"","\"\"")+"\""
private fun csv(d:List<Entry>)=buildString{
    appendLine("date,kind,title,start,end,break,type,location,rate,notes")
    d.forEach{e->appendLine(listOf(e.date,e.kind,e.title,ft(e.start),ft(e.end),e.breakMin,e.type,e.location,e.rate,e.notes).joinToString(","){csvEscape(it)})}
}
