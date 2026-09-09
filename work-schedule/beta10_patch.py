from pathlib import Path

p = Path('app/src/main/java/com/ilia/workschedule/Beta6Activity.kt')
s = p.read_text()


def replace_once(old: str, new: str, label: str):
    global s
    if old not in s:
        raise SystemExit(f'Beta 0.10 patch failed: {label} not found')
    s = s.replace(old, new, 1)


def replace_section(start_marker: str, end_marker: str, new_text: str, label: str):
    global s
    start = s.find(start_marker)
    if start < 0:
        raise SystemExit(f'Beta 0.10 patch failed: {label} start not found')
    end = s.find(end_marker, start)
    if end < 0:
        raise SystemExit(f'Beta 0.10 patch failed: {label} end not found')
    s = s[:start] + new_text.rstrip() + '\n\n' + s[end:]

# -----------------------------------------------------------------------------
# Logo-only shift types
# -----------------------------------------------------------------------------
# A shift type may be saved with no name when it has an uploaded image/logo.
replace_once(
    'TextButton({onSave(t)},enabled=name.isNotBlank()){Text("Save",color=B6Gold,fontWeight=FontWeight.Bold)}',
    'TextButton({onSave(t)},enabled=name.isNotBlank() || image.isNotBlank()){Text("Save",color=B6Gold,fontWeight=FontWeight.Bold)}',
    'logo-only save enablement'
)
replace_once(
    'OutlinedTextField(name,{name=it},label={Text("Shift type name")},singleLine=true,modifier=Modifier.fillMaxWidth())',
    'OutlinedTextField(name,{name=it},label={Text("Shift type name (optional)")},singleLine=true,modifier=Modifier.fillMaxWidth())',
    'optional shift name label'
)

# Calendar cell: if the shift has no name, remove the name strip and give the logo
# more visual space while preserving the locked date-top-right design.
replace_once(
'''            val fraction = when (t.logoSize) {
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
            }''',
'''            val fraction = when (t.logoSize) {
                B6LogoSize.SMALL -> if (t.name.isBlank()) .52f else .46f
                B6LogoSize.MEDIUM -> if (t.name.isBlank()) .68f else .60f
                B6LogoSize.LARGE -> if (t.name.isBlank()) .82f else .74f
            }
            Box(
                Modifier.align(Alignment.Center).offset(y = if (t.name.isBlank()) 1.dp else (-3).dp).fillMaxWidth(fraction).aspectRatio(1f),
                contentAlignment = Alignment.Center
            ) {
                if (image != null) Image(image, null, Modifier.fillMaxSize(), contentScale = ContentScale.Fit)
                else Icon(Icons.Outlined.Image, null, tint = outline ?: B6Muted, modifier = Modifier.fillMaxSize(.48f))
            }
            if (t.name.isNotBlank()) {
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
            }''',
    'logo-only calendar cell'
)

# Shift picker tray: logo-only templates do not reserve a text row.
replace_once(
'''        Column(Modifier.fillMaxSize().padding(6.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.Center){
            B6Photo(t.imageUri,t.outlineArgb,50.dp,RoundedCornerShape(8.dp),border=false)
            Spacer(Modifier.height(3.dp))
            Text(t.name,fontSize=8.5.sp,color=B6Text,maxLines=1,softWrap=false,overflow=TextOverflow.Ellipsis,textAlign=TextAlign.Center,modifier=Modifier.fillMaxWidth())
        }''',
'''        Column(Modifier.fillMaxSize().padding(6.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.Center){
            B6Photo(t.imageUri,t.outlineArgb,if(t.name.isBlank()) 62.dp else 50.dp,RoundedCornerShape(8.dp),border=false)
            if(t.name.isNotBlank()){
                Spacer(Modifier.height(3.dp))
                Text(t.name,fontSize=8.5.sp,color=B6Text,maxLines=1,softWrap=false,overflow=TextOverflow.Ellipsis,textAlign=TextAlign.Center,modifier=Modifier.fillMaxWidth())
            }
        }''',
    'logo-only shift picker'
)

# Date preview: logo-only means exactly that; no blank title gap.
replace_once(
'''            Spacer(Modifier.height(12.dp))
            Text(t.name,fontSize=24.sp,fontWeight=FontWeight.Bold,color=B6Text)
            Text("${b6Time(t.startMinutes)} – ${b6EndLabel(t)}",color=B6Muted,fontSize=13.sp)''',
'''            Spacer(Modifier.height(if(t.name.isBlank()) 6.dp else 12.dp))
            if(t.name.isNotBlank()) Text(t.name,fontSize=24.sp,fontWeight=FontWeight.Bold,color=B6Text)
            Text("${b6Time(t.startMinutes)} – ${b6EndLabel(t)}",color=B6Muted,fontSize=13.sp)''',
    'logo-only date preview'
)

# Upcoming card avoids an empty title row for logo-only templates.
replace_once(
'Text(t.name,fontWeight=FontWeight.SemiBold,maxLines=1); Text("$whenText • ${b6Time(t.startMinutes)} – ${b6EndLabel(t)}",color=B6Muted,fontSize=10.5.sp,maxLines=1)',
'if(t.name.isNotBlank()) Text(t.name,fontWeight=FontWeight.SemiBold,maxLines=1); Text("$whenText • ${b6Time(t.startMinutes)} – ${b6EndLabel(t)}",color=if(t.name.isBlank()) B6Text else B6Muted,fontSize=10.5.sp,maxLines=1)',
'logo-only upcoming card'
)

# Notification title should remain meaningful even when the template intentionally has no name.
replace_once(
'val i = Intent(context, Beta6ReminderReceiver::class.java).putExtra("title", t.name).putExtra("text", text)',
'val i = Intent(context, Beta6ReminderReceiver::class.java).putExtra("title", if(t.name.isBlank()) "Upcoming shift" else t.name).putExtra("text", text)',
'logo-only notification title'
)

# -----------------------------------------------------------------------------
# Settings: replace passive-looking rows with explicit full-width interactive rows.
# Every setting has a direct action and visible feedback.
# -----------------------------------------------------------------------------
settings = r'''@Composable private fun B6SettingsScreen(store:B6Store,templates:List<B6Template>,assignments:List<B6Assignment>,notifications:Boolean,onNotifications:(Boolean)->Unit,onTypes:()->Unit){
    var job by remember{mutableStateOf(store.jobName())}
    var location by remember{mutableStateOf(store.defaultLocation())}
    var editJob by remember{mutableStateOf(false)}
    var editLoc by remember{mutableStateOf(false)}
    var aboutOpen by remember{mutableStateOf(false)}

    if(editJob) B10EditDialog(
        title="Job Name", current=job, placeholder="Main Job", allowBlank=false,
        onDismiss={editJob=false},
        onSave={job=it;store.setJobName(it);editJob=false}
    )
    if(editLoc) B10EditDialog(
        title="Default Location", current=location, placeholder="Optional", allowBlank=true,
        onDismiss={editLoc=false},
        onSave={location=it;store.setDefaultLocation(it);editLoc=false}
    )
    if(aboutOpen) AlertDialog(
        onDismissRequest={aboutOpen=false},
        title={Text("Work Schedule",color=B6Text)},
        text={Text("Beta 0.10.0\nCalendar-first personal work planner.",color=B6Muted)},
        confirmButton={TextButton({aboutOpen=false}){Text("Close",color=B6Gold)}}
    )

    LazyColumn(Modifier.fillMaxSize().padding(horizontal=16.dp),contentPadding=PaddingValues(bottom=24.dp)){
        item{
            Text("Settings",fontSize=30.sp,fontWeight=FontWeight.Bold,color=B6Text,modifier=Modifier.padding(top=14.dp,bottom=14.dp))
            Column(verticalArrangement=Arrangement.spacedBy(8.dp)){
                B10SettingsActionRow(Icons.Outlined.Person,"Job Name",job){editJob=true}
                B10SettingsActionRow(Icons.Outlined.LocationOn,"Default Location",if(location.isBlank())"Not set" else location){editLoc=true}
                B10SettingsSwitchRow(Icons.Outlined.Notifications,"Phone Notifications",notifications){onNotifications(it)}
                B10SettingsActionRow(Icons.Outlined.GridView,"Shift Types",templates.size.toString(),accent=true){onTypes()}
                B10SettingsActionRow(Icons.Outlined.Info,"About","Beta 0.10.0"){aboutOpen=true}
            }
        }
    }
}

@Composable private fun B10SettingsActionRow(icon:androidx.compose.ui.graphics.vector.ImageVector,label:String,value:String,accent:Boolean=false,onClick:()->Unit){
    val shape=RoundedCornerShape(16.dp)
    Surface(
        modifier=Modifier.fillMaxWidth().height(68.dp).clip(shape).clickable(onClick=onClick),
        color=B6Panel2, shape=shape
    ){
        Row(Modifier.fillMaxSize().padding(horizontal=16.dp),verticalAlignment=Alignment.CenterVertically){
            Icon(icon,null,tint=if(accent)B6Gold else B6Text,modifier=Modifier.size(21.dp))
            Spacer(Modifier.width(13.dp))
            Text(label,color=B6Text,fontSize=15.sp,modifier=Modifier.weight(1f))
            Text(value,color=B6Muted,fontSize=12.sp,maxLines=1,overflow=TextOverflow.Ellipsis,modifier=Modifier.widthIn(max=150.dp),textAlign=TextAlign.End)
            Spacer(Modifier.width(7.dp))
            Icon(Icons.Outlined.ChevronRight,null,tint=B6Muted,modifier=Modifier.size(20.dp))
        }
    }
}

@Composable private fun B10SettingsSwitchRow(icon:androidx.compose.ui.graphics.vector.ImageVector,label:String,checked:Boolean,onChecked:(Boolean)->Unit){
    val shape=RoundedCornerShape(16.dp)
    Surface(
        modifier=Modifier.fillMaxWidth().height(68.dp).clip(shape).clickable{onChecked(!checked)},
        color=B6Panel2, shape=shape
    ){
        Row(Modifier.fillMaxSize().padding(horizontal=16.dp),verticalAlignment=Alignment.CenterVertically){
            Icon(icon,null,tint=B6Text,modifier=Modifier.size(21.dp))
            Spacer(Modifier.width(13.dp))
            Text(label,color=B6Text,fontSize=15.sp,modifier=Modifier.weight(1f))
            Switch(checked=checked,onCheckedChange=onChecked,colors=SwitchDefaults.colors(checkedThumbColor=B6Bg,checkedTrackColor=B6Gold))
        }
    }
}

@Composable private fun B10EditDialog(title:String,current:String,placeholder:String,allowBlank:Boolean,onDismiss:()->Unit,onSave:(String)->Unit){
    var value by remember(current){mutableStateOf(current)}
    AlertDialog(
        onDismissRequest=onDismiss,
        title={Text(title,color=B6Text)},
        text={OutlinedTextField(value,{value=it},placeholder={Text(placeholder)},singleLine=true,modifier=Modifier.fillMaxWidth())},
        confirmButton={
            TextButton({onSave(value.trim())},enabled=allowBlank || value.isNotBlank()){
                Text("Save",color=if(allowBlank || value.isNotBlank()) B6Gold else B6Muted)
            }
        },
        dismissButton={TextButton(onDismiss){Text("Cancel",color=B6Muted)}}
    )
}'''
replace_section('@Composable private fun B6SettingsScreen(', '@Composable private fun B6Header', settings, 'interactive settings screen')

p.write_text(s)
print('Applied Work Schedule Beta 0.10 logo-only + settings interaction patch')
