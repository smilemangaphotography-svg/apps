from pathlib import Path

p = Path('app/src/main/java/com/ilia/workschedule/Beta6Activity.kt')
s = p.read_text()


def replace_once(old: str, new: str, label: str):
    global s
    if old not in s:
        raise SystemExit(f'Beta 0.8 patch failed: {label} not found')
    s = s.replace(old, new, 1)


def replace_section(start_marker: str, end_marker: str, new_text: str, label: str):
    global s
    start = s.find(start_marker)
    if start < 0:
        raise SystemExit(f'Beta 0.8 patch failed: {label} start not found')
    end = s.find(end_marker, start)
    if end < 0:
        raise SystemExit(f'Beta 0.8 patch failed: {label} end not found')
    s = s[:start] + new_text.rstrip() + '\n\n' + s[end:]

# Settings/version lock.
replace_once('B6SettingRow(Icons.Outlined.Info,"About","Beta 0.7.0"){}',
             'B6SettingRow(Icons.Outlined.Info,"About","Beta 0.8.0"){}',
             'about version')

# Remove the inner dark image square whenever a photo is intentionally used without a border.
replace_once(
    'Box(modifier.size(size).clip(shape).background(B6Bg).then(if(border) Modifier.border(1.6.dp,outline,shape) else Modifier).padding(if(border) 3.dp else 0.dp),contentAlignment=Alignment.Center){',
    'Box(modifier.size(size).clip(shape).background(if(border) B6Bg else Color.Transparent).then(if(border) Modifier.border(1.6.dp,outline,shape) else Modifier).padding(if(border) 3.dp else 0.dp),contentAlignment=Alignment.Center){',
    'photo background')

# Calendar page: normal mode shows Upcoming; assignment mode gets a fixed tray above navigation.
calendar_screen = r'''@Composable private fun B6CalendarScreen(
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

    Box(Modifier.fillMaxSize()) {
        LazyColumn(
            Modifier.fillMaxSize().padding(horizontal = 16.dp),
            contentPadding = PaddingValues(bottom = if (paintMode) 132.dp else 18.dp)
        ) {
            item {
                Spacer(Modifier.height(8.dp))
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text(jobName, fontSize = 25.sp, fontWeight = FontWeight.Bold, color = B6Text)
                    Spacer(Modifier.width(6.dp))
                    Icon(Icons.Outlined.ArrowDropDown, null, tint = B6Text, modifier = Modifier.size(22.dp))
                    Spacer(Modifier.weight(1f))
                    IconButton(onUpcoming) { Icon(Icons.Outlined.Notifications, null, tint = B6Gold) }
                    IconButton(onManageTypes) { Icon(Icons.Outlined.Settings, null, tint = B6Text) }
                }
                Text("Plan your work, your life", color = B6Muted, fontSize = 12.sp)
                Spacer(Modifier.height(12.dp))
                Card(
                    colors = CardDefaults.cardColors(containerColor = B6Panel),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.fillMaxWidth().border(1.dp, B6Divider, RoundedCornerShape(20.dp))
                ) {
                    Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) {
                        IconButton({ onMonth(month.minusMonths(1)) }) { Icon(Icons.Outlined.ChevronLeft, null, tint = B6Muted) }
                        Text(
                            month.atDay(1).format(DateTimeFormatter.ofPattern("MMMM yyyy", Locale.getDefault())),
                            modifier = Modifier.weight(1f), textAlign = TextAlign.Center,
                            fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = B6Text
                        )
                        IconButton({ onMonth(month.plusMonths(1)) }) { Icon(Icons.Outlined.ChevronRight, null, tint = B6Muted) }
                        Box(
                            Modifier.size(46.dp).clip(CircleShape).background(B6Gold).clickable(onClick = onTogglePaint),
                            contentAlignment = Alignment.Center
                        ) { Icon(if (paintMode) Icons.Outlined.Check else Icons.Outlined.Add, null, tint = B6Bg) }
                    }
                }
                Spacer(Modifier.height(10.dp))
                Row(Modifier.fillMaxWidth()) {
                    listOf("Mon","Tue","Wed","Thu","Fri","Sat","Sun").forEachIndexed { i, d ->
                        Text(d, color = if (i > 4) B6Muted else B6Text, textAlign = TextAlign.Center, fontSize = 11.sp, modifier = Modifier.weight(1f))
                    }
                }
                Spacer(Modifier.height(5.dp))
                Card(
                    colors = CardDefaults.cardColors(containerColor = B6Panel),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.fillMaxWidth().border(1.dp, B6Divider, RoundedCornerShape(20.dp)).pointerInput(month) {
                        detectHorizontalDragGestures(
                            onHorizontalDrag = { _, a -> drag += a },
                            onDragEnd = {
                                if (drag > 80) onMonth(month.minusMonths(1))
                                if (drag < -80) onMonth(month.plusMonths(1))
                                drag = 0f
                            }
                        )
                    }
                ) { B6MonthGrid(month, selectedDate, assignments, map, onDate) }

                if (!paintMode) {
                    Spacer(Modifier.height(12.dp))
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Column {
                            Text("Upcoming", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = B6Text)
                            Text("Next scheduled shifts", color = B6Muted, fontSize = 11.sp)
                        }
                        Spacer(Modifier.weight(1f))
                        TextButton(onUpcoming) { Text("See all", color = B6Gold) }
                    }
                    if (upcoming.isEmpty()) B6Empty("Nothing scheduled", "Tap +, choose a shift type and tap dates.")
                    else upcoming.forEach { (d,t) -> B6UpcomingCompact(d,t) }
                }
            }
        }

        if (paintMode) {
            Surface(
                modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
                color = B6Panel,
                shape = RoundedCornerShape(20.dp),
                shadowElevation = 8.dp
            ) {
                Column(Modifier.padding(top = 9.dp, bottom = 9.dp)) {
                    Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("Choose shift type", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = B6Text)
                        Spacer(Modifier.weight(1f))
                        TextButton(onManageTypes) { Text("Manage", color = B6Gold, fontWeight = FontWeight.SemiBold) }
                    }
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 10.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(templates, key = { it.id }) { t ->
                            B6TypeMini(t, selectedTemplateId == t.id) { onSelectType(t.id) }
                        }
                    }
                }
            }
        }
    }
}'''
replace_section('@Composable private fun B6CalendarScreen(', '@Composable private fun B6MonthGrid(', calendar_screen, 'calendar screen')

# Calendar cell lock: one outline, date top-right, dominant logo, dedicated name band.
calendar_cell = r'''@Composable private fun B6CalendarCell(date: LocalDate, inMonth: Boolean, selected: Boolean, t: B6Template?, modifier: Modifier, onClick:()->Unit) {
    val shape = RoundedCornerShape(9.dp)
    val outline = t?.let { Color(it.outlineArgb) }
    val image = t?.let { b6RememberImage(it.imageUri) }
    val cellModifier = modifier.padding(1.5.dp).height(58.dp).clip(shape)
        .background(if (selected) B6Gold.copy(alpha = .075f) else Color.Transparent)
        .then(
            if (outline != null) Modifier.border(1.5.dp, outline, shape)
            else if (selected) Modifier.border(1.dp, B6Gold.copy(alpha = .42f), shape)
            else Modifier
        )
        .clickable(onClick = onClick)

    Box(cellModifier) {
        Text(
            date.dayOfMonth.toString(),
            color = if (inMonth) B6Text else B6Muted.copy(alpha = .35f),
            fontSize = 9.5.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.align(Alignment.TopEnd).padding(end = 4.dp, top = 2.dp)
        )
        if (t != null) {
            val fraction = when (t.logoSize) {
                B6LogoSize.SMALL -> .46f
                B6LogoSize.MEDIUM -> .60f
                B6LogoSize.LARGE -> .74f
            }
            Box(
                Modifier.align(Alignment.Center).offset(y = (-3).dp).fillMaxWidth(fraction).aspectRatio(1f),
                contentAlignment = Alignment.Center
            ) {
                if (image != null) Image(image, null, Modifier.fillMaxSize(), contentScale = ContentScale.Fit)
                else Icon(Icons.Outlined.Image, null, tint = outline ?: B6Muted, modifier = Modifier.fillMaxSize(.48f))
            }
            Box(
                Modifier.align(Alignment.BottomCenter).fillMaxWidth().height(12.dp).padding(horizontal = 2.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    t.name,
                    color = B6Text,
                    fontSize = 6.8.sp,
                    lineHeight = 7.2.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    softWrap = false,
                    overflow = TextOverflow.Ellipsis,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}'''
replace_section('@Composable private fun B6CalendarCell(', '@Composable private fun B6UpcomingCompact', calendar_cell, 'calendar cell')

# Shift picker cards: one colored outer outline and no nested border around the image.
type_mini = r'''@Composable private fun B6TypeMini(t:B6Template,selected:Boolean,onClick:()->Unit){
    val shape = RoundedCornerShape(13.dp)
    val frame = if (selected) B6Gold else Color(t.outlineArgb)
    Card(
        Modifier.width(82.dp).height(82.dp).border(if(selected) 2.dp else 1.4.dp, frame, shape).clickable(onClick=onClick),
        colors=CardDefaults.cardColors(containerColor=B6Panel2), shape=shape
    ){
        Column(Modifier.fillMaxSize().padding(6.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.Center){
            B6Photo(t.imageUri,t.outlineArgb,50.dp,RoundedCornerShape(8.dp),border=false)
            Spacer(Modifier.height(3.dp))
            Text(t.name,fontSize=8.5.sp,color=B6Text,maxLines=1,softWrap=false,overflow=TextOverflow.Ellipsis,textAlign=TextAlign.Center,modifier=Modifier.fillMaxWidth())
        }
    }
}'''
replace_section('@Composable private fun B6TypeMini(', '@Composable private fun B6Photo(', type_mini, 'shift type mini')

# Date preview: locked large tile + working Edit/Duplicate/Delete actions.
date_preview = r'''@Composable private fun B6DatePreviewScreen(date:LocalDate,t:B6Template?,onBack:()->Unit,onEdit:()->Unit,onDuplicate:()->Unit,onDelete:()->Unit){
    Column(Modifier.fillMaxSize().background(B6Bg).statusBarsPadding().padding(horizontal=16.dp)){
        Row(Modifier.fillMaxWidth().height(58.dp),verticalAlignment=Alignment.CenterVertically){
            IconButton(onBack){Icon(Icons.Outlined.ChevronLeft,null,tint=B6Text)}
            Text(date.format(DateTimeFormatter.ofPattern("EEE, d MMMM yyyy")),modifier=Modifier.weight(1f),textAlign=TextAlign.Center,fontSize=17.sp,fontWeight=FontWeight.SemiBold,color=B6Text)
            Spacer(Modifier.width(48.dp))
        }
        if(t==null){B6Empty("No shift on this date","Choose a shift type from Calendar and assign it to this date.");return@Column}
        val outline=Color(t.outlineArgb)
        val image=b6RememberImage(t.imageUri)
        Column(Modifier.fillMaxWidth(),horizontalAlignment=Alignment.CenterHorizontally){
            val tileShape=RoundedCornerShape(22.dp)
            Box(Modifier.size(190.dp).clip(tileShape).background(B6Bg).border(2.dp,outline,tileShape)){
                Text(date.dayOfMonth.toString(),color=B6Text,fontSize=18.sp,fontWeight=FontWeight.Bold,modifier=Modifier.align(Alignment.TopEnd).padding(12.dp))
                Box(Modifier.align(Alignment.Center).fillMaxSize(.72f),contentAlignment=Alignment.Center){
                    if(image!=null) Image(image,null,Modifier.fillMaxSize(),contentScale=ContentScale.Fit)
                    else Icon(Icons.Outlined.Image,null,tint=outline,modifier=Modifier.fillMaxSize(.42f))
                }
            }
            Spacer(Modifier.height(12.dp))
            Text(t.name,fontSize=24.sp,fontWeight=FontWeight.Bold,color=B6Text)
            Text("${b6Time(t.startMinutes)} – ${b6EndLabel(t)}",color=B6Muted,fontSize=13.sp)
            Spacer(Modifier.height(8.dp))
            Surface(color=outline.copy(alpha=.16f),shape=RoundedCornerShape(16.dp)){Text(t.category,color=outline,fontWeight=FontWeight.SemiBold,fontSize=11.sp,modifier=Modifier.padding(horizontal=14.dp,vertical=6.dp))}
        }
        Spacer(Modifier.height(16.dp))
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceEvenly){
            B6PreviewAction(Icons.Outlined.Edit,"Edit",B6Gold,onEdit)
            B6PreviewAction(Icons.Outlined.ContentCopy,"Duplicate",B6Text,onDuplicate)
            B6PreviewAction(Icons.Outlined.Delete,"Delete",Color(0xFFFF6262),onDelete)
        }
        Spacer(Modifier.height(16.dp))
        Card(colors=CardDefaults.cardColors(containerColor=B6Panel2),shape=RoundedCornerShape(16.dp)){
            Column(Modifier.fillMaxWidth().padding(14.dp)){
                B6Info(Icons.Outlined.Schedule,"Time","${b6Time(t.startMinutes)} – ${b6EndLabel(t)}")
                if(t.location.isNotBlank())B6Info(Icons.Outlined.LocationOn,"Location",t.location)
                B6Info(Icons.Outlined.Notifications,"Reminder",if(t.reminderMinutes<=0)"Off" else b6ReminderLong(t.reminderMinutes))
                if(t.note.isNotBlank())B6Info(Icons.Outlined.Notes,"Note",t.note)
            }
        }
    }
}

@Composable private fun B6PreviewAction(icon:androidx.compose.ui.graphics.vector.ImageVector,label:String,tint:Color,onClick:()->Unit){
    Column(horizontalAlignment=Alignment.CenterHorizontally){
        Surface(modifier=Modifier.size(54.dp).clickable(onClick=onClick),shape=CircleShape,color=B6Panel2,border=androidx.compose.foundation.BorderStroke(1.dp,tint.copy(alpha=.65f))){
            Box(Modifier.fillMaxSize(),contentAlignment=Alignment.Center){Icon(icon,null,tint=tint,modifier=Modifier.size(22.dp))}
        }
        Spacer(Modifier.height(5.dp));Text(label,color=B6Text,fontSize=10.sp)
    }
}'''
replace_section('@Composable private fun B6DatePreviewScreen(', '@Composable private fun B6AnalyticsScreen', date_preview, 'date preview')

# Wire the Duplicate action in the route. Duplicate creates an editable copy rather than a dead button.
old_preview_call = '''B6DatePreviewScreen(r.date, t, onBack = { route = B6Route.Main }, onEdit = { t?.let { route = B6Route.TypeEditor(it.id) } }, onDelete = {
                saveAssignments(assignments.filterNot { it.date == r.date.toString() }); route = B6Route.Main
            })'''
new_preview_call = '''B6DatePreviewScreen(r.date, t, onBack = { route = B6Route.Main }, onEdit = { t?.let { route = B6Route.TypeEditor(it.id) } }, onDuplicate = {
                t?.let { original ->
                    val copy = original.copy(id = System.currentTimeMillis(), name = original.name + " copy")
                    saveTemplates(templates + copy)
                    selectedTemplateId = copy.id
                    route = B6Route.TypeEditor(copy.id)
                }
            }, onDelete = {
                saveAssignments(assignments.filterNot { it.date == r.date.toString() }); route = B6Route.Main
            })'''
replace_once(old_preview_call,new_preview_call,'date preview duplicate wiring')

# Color page: wheel/presets mode, explicit text colors, functional brightness slider, recent colors and chart.
color_picker = r'''@Composable private fun B6ColorPickerScreen(initial:Int,recent:List<Int>,onBack:()->Unit,onColor:(Int)->Unit){
    fun brightnessOf(c:Int):Float{val hsv=FloatArray(3);android.graphics.Color.colorToHSV(c,hsv);return hsv[2]}
    var selected by remember{mutableStateOf(initial)}
    var brightness by remember{mutableFloatStateOf(brightnessOf(initial))}
    var mode by remember{mutableStateOf("Color Wheel")}
    fun choose(c:Int){selected=c;brightness=brightnessOf(c)}
    Column(Modifier.fillMaxSize().background(B6Bg).statusBarsPadding().padding(horizontal=16.dp)){
        Row(Modifier.fillMaxWidth().height(58.dp),verticalAlignment=Alignment.CenterVertically){
            IconButton(onBack){Icon(Icons.Outlined.ChevronLeft,null,tint=B6Text)}
            Text("Choose Color",modifier=Modifier.weight(1f),textAlign=TextAlign.Center,fontSize=19.sp,fontWeight=FontWeight.SemiBold,color=B6Text)
            TextButton({onColor(selected)}){Text("Done",color=B6Gold,fontWeight=FontWeight.Bold)}
        }
        Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){B6Chip("Color Wheel",mode=="Color Wheel"){mode="Color Wheel"};B6Chip("Presets",mode=="Presets"){mode="Presets"}}
        Spacer(Modifier.height(10.dp))
        if(mode=="Color Wheel"){
            B6ColorWheel(selected){c->selected=c;brightness=brightnessOf(c)}
            Spacer(Modifier.height(8.dp))
            Text("Brightness",color=B6Muted,fontSize=10.sp)
            Slider(value=brightness,onValueChange={v->
                brightness=v
                val hsv=FloatArray(3);android.graphics.Color.colorToHSV(selected,hsv);hsv[2]=v;selected=android.graphics.Color.HSVToColor(hsv)
            },colors=SliderDefaults.colors(thumbColor=B6Text,activeTrackColor=Color(selected),inactiveTrackColor=B6Panel2))
        } else {
            Spacer(Modifier.height(8.dp));Text("Color charts",fontWeight=FontWeight.SemiBold,color=B6Text);Spacer(Modifier.height(10.dp));B6ColorChart(B6Presets,selected){choose(it)}
        }
        Spacer(Modifier.height(12.dp));Text("Recent colors",fontWeight=FontWeight.SemiBold,color=B6Text);Spacer(Modifier.height(8.dp))
        LazyRow(horizontalArrangement=Arrangement.spacedBy(8.dp)){items((recent.ifEmpty{B6Presets.take(6)}).distinct()){c->B6ColorDot(c,selected==c){choose(c)}}}
        if(mode=="Color Wheel"){
            Spacer(Modifier.height(16.dp));Text("Color charts",fontWeight=FontWeight.SemiBold,color=B6Text);Spacer(Modifier.height(8.dp));B6ColorChart(B6Presets,selected){choose(it)}
        }
        Spacer(Modifier.height(18.dp));Text("Selected",color=B6Muted,fontSize=11.sp);Spacer(Modifier.height(7.dp))
        Card(colors=CardDefaults.cardColors(containerColor=B6Panel2),shape=RoundedCornerShape(14.dp)){
            Row(Modifier.fillMaxWidth().padding(12.dp),verticalAlignment=Alignment.CenterVertically){Box(Modifier.size(34.dp).background(Color(selected),CircleShape));Spacer(Modifier.width(10.dp));Text(b6Hex(selected),fontWeight=FontWeight.SemiBold,color=B6Text)}
        }
    }
}'''
replace_section('@Composable private fun B6ColorPickerScreen(', '@Composable private fun B6ColorWheel', color_picker, 'color picker')

# Shift type list: action affordance matches mockup; tapping it opens the editor.
type_library = r'''@Composable private fun B6TypeLibraryScreen(templates:List<B6Template>,onBack:()->Unit,onCreate:()->Unit,onOpen:(B6Template)->Unit){
    var category by remember{mutableStateOf("All")}; val shown=if(category=="All")templates else templates.filter{it.category==category}
    LazyColumn(Modifier.fillMaxSize().background(B6Bg).statusBarsPadding().padding(horizontal=16.dp),contentPadding=PaddingValues(bottom=24.dp)){
        item{ B6Header("Shift Types",onBack,onCreate); LazyRow(horizontalArrangement=Arrangement.spacedBy(7.dp)){items(listOf("All","Work","Event","Custom")){c->B6Chip(c,category==c){category=c}}};Spacer(Modifier.height(12.dp)) }
        items(shown,key={it.id}){t->
            Card(Modifier.fillMaxWidth().padding(vertical=4.dp).height(74.dp).clickable{onOpen(t)},colors=CardDefaults.cardColors(containerColor=B6Panel2),shape=RoundedCornerShape(15.dp)){
                Row(Modifier.fillMaxSize().padding(7.dp),verticalAlignment=Alignment.CenterVertically){
                    B6Photo(t.imageUri,t.outlineArgb,56.dp,RoundedCornerShape(10.dp),true)
                    Spacer(Modifier.width(10.dp))
                    Column(Modifier.weight(1f)){
                        Text(t.name,fontWeight=FontWeight.SemiBold,fontSize=16.sp,color=B6Text,maxLines=1)
                        Text("${b6Time(t.startMinutes)} – ${b6EndLabel(t)}",color=B6Muted,fontSize=10.sp)
                        Text(t.category,color=Color(t.outlineArgb),fontSize=9.sp)
                    }
                    IconButton({onOpen(t)}){Icon(Icons.Outlined.MoreVert,null,tint=B6Muted)}
                }
            }
        }
        item{Spacer(Modifier.height(10.dp));OutlinedButton(onCreate,Modifier.fillMaxWidth().height(50.dp),colors=ButtonDefaults.outlinedButtonColors(contentColor=B6Gold)){Icon(Icons.Outlined.Add,null);Spacer(Modifier.width(6.dp));Text("Create new shift type")}}
    }
}'''
replace_section('@Composable private fun B6TypeLibraryScreen(', '@Composable private fun B6TypeEditorScreen', type_library, 'shift type list')

# Editor size cards use miniature calendar-style previews with the actual uploaded logo.
replace_once('B6LogoSize.entries.forEach{s->B6LogoSizeChoice(s,logoSize==s,Modifier.weight(1f)){logoSize=s}}',
             'B6LogoSize.entries.forEach{s->B6LogoSizeChoice(s,logoSize==s,image,outline,Modifier.weight(1f)){logoSize=s}}',
             'logo size choice call')
logo_choice = r'''@Composable private fun B6LogoSizeChoice(size:B6LogoSize,selected:Boolean,imageUri:String,outlineArgb:Int,modifier:Modifier,onClick:()->Unit){
    val image=b6RememberImage(imageUri);val outline=Color(outlineArgb);val fraction=when(size){B6LogoSize.SMALL->.42f;B6LogoSize.MEDIUM->.58f;B6LogoSize.LARGE->.74f}
    Card(modifier.height(88.dp).then(if(selected)Modifier.border(1.7.dp,B6Gold,RoundedCornerShape(14.dp))else Modifier).clickable(onClick=onClick),colors=CardDefaults.cardColors(containerColor=B6Panel2),shape=RoundedCornerShape(14.dp)){
        Column(Modifier.fillMaxSize().padding(6.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.Center){
            val sh=RoundedCornerShape(7.dp)
            Box(Modifier.size(54.dp).clip(sh).background(B6Bg).border(1.2.dp,outline,sh)){
                Text("9",color=B6Text,fontSize=7.sp,modifier=Modifier.align(Alignment.TopEnd).padding(3.dp))
                Box(Modifier.align(Alignment.Center).fillMaxSize(fraction),contentAlignment=Alignment.Center){if(image!=null)Image(image,null,Modifier.fillMaxSize(),contentScale=ContentScale.Fit)else Icon(Icons.Outlined.Image,null,tint=outline,modifier=Modifier.fillMaxSize(.45f))}
            }
            Spacer(Modifier.height(4.dp));Text(size.label,color=if(selected)B6Gold else B6Muted,fontSize=10.sp)
        }
    }
}'''
replace_section('@Composable private fun B6LogoSizeChoice(', '@Composable private fun B6TimeCard(', logo_choice, 'logo size choice')

p.write_text(s)
print('Applied Work Schedule Beta 0.8 mockup-lock patch')
