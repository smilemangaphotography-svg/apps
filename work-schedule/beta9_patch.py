from pathlib import Path

p = Path('app/src/main/java/com/ilia/workschedule/Beta6Activity.kt')
s = p.read_text()


def replace_once(old: str, new: str, label: str):
    global s
    if old not in s:
        raise SystemExit(f'Beta 0.9 patch failed: {label} not found')
    s = s.replace(old, new, 1)


def replace_section(start_marker: str, end_marker: str, new_text: str, label: str):
    global s
    start = s.find(start_marker)
    if start < 0:
        raise SystemExit(f'Beta 0.9 patch failed: {label} start not found')
    end = s.find(end_marker, start)
    if end < 0:
        raise SystemExit(f'Beta 0.9 patch failed: {label} end not found')
    s = s[:start] + new_text.rstrip() + '\n\n' + s[end:]

# Calendar header gear must open Settings, not Shift Types.
replace_once(
    'onManageTypes = { route = B6Route.TypeLibrary }, onUpcoming = { tab = B6Tab.SHIFTS }',
    'onManageTypes = { route = B6Route.TypeLibrary }, onUpcoming = { tab = B6Tab.SHIFTS }, onSettings = { tab = B6Tab.SETTINGS }',
    'calendar call settings callback'
)
replace_once(
    'onMonth: (YearMonth) -> Unit, onTogglePaint: () -> Unit, onSelectType: (Long) -> Unit, onDate: (LocalDate) -> Unit, onManageTypes: () -> Unit, onUpcoming: () -> Unit\n)',
    'onMonth: (YearMonth) -> Unit, onTogglePaint: () -> Unit, onSelectType: (Long) -> Unit, onDate: (LocalDate) -> Unit, onManageTypes: () -> Unit, onUpcoming: () -> Unit, onSettings: () -> Unit\n)',
    'calendar signature settings callback'
)
replace_once(
    'IconButton(onManageTypes) { Icon(Icons.Outlined.Settings, null, tint = B6Text) }',
    'IconButton(onSettings) { Icon(Icons.Outlined.Settings, null, tint = B6Text) }',
    'calendar gear action'
)

# Keep Settings focused only on useful, working controls.
settings = r'''@Composable private fun B6SettingsScreen(store:B6Store,templates:List<B6Template>,assignments:List<B6Assignment>,notifications:Boolean,onNotifications:(Boolean)->Unit,onTypes:()->Unit){
    var job by remember{mutableStateOf(store.jobName())}
    var location by remember{mutableStateOf(store.defaultLocation())}
    var editJob by remember{mutableStateOf(false)}
    var editLoc by remember{mutableStateOf(false)}
    var aboutOpen by remember{mutableStateOf(false)}

    if(editJob) B6TextDialog("Job Name",job,{editJob=false}){job=it;store.setJobName(it);editJob=false}
    if(editLoc) B6TextDialog("Default Location",location,{editLoc=false}){location=it;store.setDefaultLocation(it);editLoc=false}
    if(aboutOpen) AlertDialog(
        onDismissRequest={aboutOpen=false},
        title={Text("Work Schedule",color=B6Text)},
        text={Text("Beta 0.9.0\nCalendar-first personal work planner.",color=B6Muted)},
        confirmButton={TextButton({aboutOpen=false}){Text("Close",color=B6Gold)}}
    )

    LazyColumn(Modifier.fillMaxSize().padding(horizontal=16.dp),contentPadding=PaddingValues(bottom=20.dp)){
        item{
            Text("Settings",fontSize=30.sp,fontWeight=FontWeight.Bold,color=B6Text,modifier=Modifier.padding(top=14.dp,bottom=14.dp))
            Card(colors=CardDefaults.cardColors(containerColor=B6Panel2),shape=RoundedCornerShape(18.dp)){
                Column{
                    B6SettingRow(Icons.Outlined.Person,"Job Name",job){editJob=true}
                    HorizontalDivider(color=B6Divider)
                    B6SettingRow(Icons.Outlined.LocationOn,"Default Location",location){editLoc=true}
                    HorizontalDivider(color=B6Divider)
                    B6SettingRow(Icons.Outlined.Notifications,"Phone Notifications",if(notifications)"On" else "Off",switch=notifications,onSwitch=onNotifications)
                    HorizontalDivider(color=B6Divider)
                    B6SettingRow(Icons.Outlined.GridView,"Shift Types",templates.size.toString(),onClick=onTypes)
                    HorizontalDivider(color=B6Divider)
                    B6SettingRow(Icons.Outlined.Info,"About","Beta 0.9.0"){aboutOpen=true}
                }
            }
        }
    }
}'''
replace_section('@Composable private fun B6SettingsScreen(', '@Composable private fun B6Header', settings, 'settings screen')

p.write_text(s)
print('Applied Work Schedule Beta 0.9 settings cleanup')
