from pathlib import Path

p = Path('app/src/main/java/com/ilia/workschedule/Beta6Activity.kt')
s = p.read_text()

checks = {
    # Calendar main and calendar-cell lock.
    'calendar date top-right': 'Modifier.align(Alignment.TopEnd).padding(end = 4.dp, top = 2.dp)',
    'calendar one shift outline': 'Modifier.border(1.5.dp, outline, shape)',
    'calendar selected subtle glow': 'B6Gold.copy(alpha = .075f)',
    'large logo 74 percent': 'B6LogoSize.LARGE -> .74f',
    'medium logo 60 percent': 'B6LogoSize.MEDIUM -> .60f',
    'small logo 46 percent': 'B6LogoSize.SMALL -> .46f',
    'calendar name bottom band': 'Modifier.align(Alignment.BottomCenter).fillMaxWidth().height(12.dp)',
    'calendar logo fit': 'Image(image, null, Modifier.fillMaxSize(), contentScale = ContentScale.Fit)',
    'assignment tray fixed bottom': 'Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp)',
    'assignment tray title': 'Text("Choose shift type"',
    'normal upcoming': 'Text("Upcoming", fontSize = 20.sp',

    # Date preview.
    'date preview locked tile': 'Modifier.size(190.dp).clip(tileShape).background(B6Bg).border(2.dp,outline,tileShape)',
    'date preview date top-right': 'Modifier.align(Alignment.TopEnd).padding(12.dp)',
    'date preview edit': 'B6PreviewAction(Icons.Outlined.Edit,"Edit"',
    'date preview duplicate': 'B6PreviewAction(Icons.Outlined.ContentCopy,"Duplicate"',
    'date preview delete': 'B6PreviewAction(Icons.Outlined.Delete,"Delete"',
    'duplicate wired': 'val copy = original.copy(id = System.currentTimeMillis(), name = original.name + " copy")',

    # Editor.
    'editor upload': 'Upload your own picture / logo',
    'editor category work': 'listOf("Work","Event","Custom")',
    'editor start end': 'B6TimeCard("Start",start',
    'editor reminder': 'Text("Phone reminder"',
    'editor logo size locked previews': 'B6LogoSizeChoice(s,logoSize==s,image,outline',
    'editor color row': 'Color wheel + presets',
    'editor no wage': 'Wage rate per hour',

    # Color picker.
    'color picker visible title': 'Text("Choose Color",modifier=Modifier.weight(1f),textAlign=TextAlign.Center,fontSize=19.sp,fontWeight=FontWeight.SemiBold,color=B6Text)',
    'color wheel mode': 'B6Chip("Color Wheel",mode=="Color Wheel")',
    'presets mode': 'B6Chip("Presets",mode=="Presets")',
    'brightness slider': 'Slider(value=brightness',
    'recent colors': 'Text("Recent colors",fontWeight=FontWeight.SemiBold,color=B6Text)',
    'selected hex': 'Text(b6Hex(selected),fontWeight=FontWeight.SemiBold,color=B6Text)',
    'wheel marker outer': 'drawCircle(color=Color.White,radius=9f,center=point)',

    # Shift types.
    'shift types filters': 'listOf("All","Work","Event","Custom")',
    'shift types more action': 'Icon(Icons.Outlined.MoreVert,null,tint=B6Muted)',
    'create shift type': 'Text("Create new shift type")',

    # Settings / version.
    'settings job': 'B6SettingRow(Icons.Outlined.Person,"Job Name"',
    'settings location': 'B6SettingRow(Icons.Outlined.LocationOn,"Default Location"',
    'settings notifications': 'B6SettingRow(Icons.Outlined.Notifications,"Phone Notifications"',
    'settings appearance': 'B6SettingRow(Icons.Outlined.DarkMode,"Appearance","Dark")',
    'settings shift types': 'B6SettingRow(Icons.Outlined.GridView,"Shift Types"',
    'settings export': 'B6SettingRow(Icons.Outlined.FileDownload,"Backup & Export"',
    'settings beta version': 'B6SettingRow(Icons.Outlined.Info,"About","Beta 0.8.0"){}',
}

missing = []
for label, needle in checks.items():
    if label == 'editor no wage':
        if needle in s:
            missing.append('forbidden UI present: wage')
    elif needle not in s:
        missing.append(label)

# Additional forbidden legacy UI terms from the earlier design.
for forbidden in ['Default Hourly Rate', 'Default Break', 'Estimated pay', 'Paid hours', 'Calculate earnings']:
    if forbidden in s:
        missing.append(f'forbidden legacy UI present: {forbidden}')

if missing:
    raise SystemExit('Beta 0.8 mockup lock validation FAILED:\n- ' + '\n- '.join(missing))

print('Beta 0.8 mockup lock validation PASSED')
print(f'Validated {len(checks) - 1} required elements plus forbidden legacy UI checks.')
