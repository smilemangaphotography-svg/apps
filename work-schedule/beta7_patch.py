from pathlib import Path

p = Path('app/src/main/java/com/ilia/workschedule/Beta6Activity.kt')
s = p.read_text()


def replace(old: str, new: str, label: str):
    global s
    if old not in s:
        raise SystemExit(f'Beta 0.7 patch failed: {label} not found')
    s = s.replace(old, new, 1)

# Version label shown in Settings.
replace('B6SettingRow(Icons.Outlined.Info,"About","Beta 0.6.0"){}',
        'B6SettingRow(Icons.Outlined.Info,"About","Beta 0.7.0"){}',
        'about version')

# Calendar proportions: use more of each date cell for the uploaded logo while
# retaining a dedicated bottom label band.
replace('SMALL("Small", 24), MEDIUM("Medium", 31), LARGE("Large", 38)',
        'SMALL("Small", 27), MEDIUM("Medium", 35), LARGE("Large", 42)',
        'calendar logo sizes')
replace('LazyColumn(Modifier.fillMaxSize().padding(horizontal = 16.dp), contentPadding = PaddingValues(bottom = 16.dp)) {',
        'LazyColumn(Modifier.fillMaxSize().padding(horizontal = 16.dp), contentPadding = PaddingValues(bottom = 104.dp)) {',
        'calendar bottom padding')

old_cell = '''@Composable private fun B6CalendarCell(date: LocalDate, inMonth: Boolean, selected: Boolean, t: B6Template?, modifier: Modifier, onClick:()->Unit) {
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
}'''
new_cell = '''@Composable private fun B6CalendarCell(date: LocalDate, inMonth: Boolean, selected: Boolean, t: B6Template?, modifier: Modifier, onClick:()->Unit) {
    val shape = RoundedCornerShape(9.dp)
    val outline = t?.let { Color(it.outlineArgb) }
    val cellModifier = modifier.padding(1.5.dp).height(56.dp).clip(shape)
        .background(if (selected) B6Gold.copy(alpha=.075f) else Color.Transparent)
        .then(if (outline != null) Modifier.border(1.45.dp, outline, shape) else if (selected) Modifier.border(1.dp, B6Gold.copy(alpha=.42f), shape) else Modifier)
        .clickable(onClick=onClick)
    Box(cellModifier) {
        Text(date.dayOfMonth.toString(), color = if (inMonth) B6Text else B6Muted.copy(alpha=.35f), fontSize=9.5.sp, modifier=Modifier.align(Alignment.TopStart).padding(start=4.dp,top=2.dp))
        if (t != null) {
            B6Photo(t.imageUri, t.outlineArgb, t.logoSize.cellDp.dp, RoundedCornerShape(6.dp), border=false, modifier=Modifier.align(Alignment.Center).offset(y=(-2).dp))
            Surface(color=B6Bg.copy(alpha=.90f), shape=RoundedCornerShape(4.dp), modifier=Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(horizontal=2.dp,bottom=1.5.dp)) {
                Text(t.name, color=outline ?: B6Text, fontSize=6.1.sp, lineHeight=7.sp, fontWeight=FontWeight.SemiBold, maxLines=1, overflow=TextOverflow.Ellipsis, textAlign=TextAlign.Center, modifier=Modifier.padding(horizontal=2.dp,vertical=1.dp))
            }
        }
    }
}'''
replace(old_cell, new_cell, 'calendar cell')

# Explicit light text fixes for the color page to prevent theme/inherited black text.
replace('Text("Choose Color",modifier=Modifier.weight(1f),textAlign=TextAlign.Center,fontSize=19.sp,fontWeight=FontWeight.SemiBold);',
        'Text("Choose Color",modifier=Modifier.weight(1f),textAlign=TextAlign.Center,fontSize=19.sp,fontWeight=FontWeight.SemiBold,color=B6Text);',
        'color title')
replace('Text("Recent colors",fontWeight=FontWeight.SemiBold);',
        'Text("Recent colors",fontWeight=FontWeight.SemiBold,color=B6Text);',
        'recent colors title')
replace('Text("Color charts",fontWeight=FontWeight.SemiBold);',
        'Text("Color charts",fontWeight=FontWeight.SemiBold,color=B6Text);',
        'color charts title')

# Add a visible selection marker to the wheel. It is derived from the selected
# color's HSV value, so it also follows preset/recent-color selections.
replace('import androidx.compose.ui.Alignment\n',
        'import androidx.compose.ui.Alignment\nimport androidx.compose.ui.geometry.Offset\n',
        'Offset import')
replace('import kotlin.math.atan2\n',
        'import kotlin.math.atan2\nimport kotlin.math.cos\nimport kotlin.math.sin\n',
        'trig imports')
old_wheel = '''@Composable private fun B6ColorWheel(selected:Int,onSelect:(Int)->Unit){
    Box(Modifier.fillMaxWidth(),contentAlignment=Alignment.Center){
        Canvas(Modifier.size(235.dp).pointerInput(Unit){detectTapGestures{p->val cx=size.width/2f;val cy=size.height/2f;val dx=p.x-cx;val dy=p.y-cy;val radius=min(size.width,size.height)/2f;val sat=(sqrt(dx*dx+dy*dy)/radius).coerceIn(0f,1f);var hue=((atan2(dy,dx)*180f/PI.toFloat())+360f)%360f;onSelect(android.graphics.Color.HSVToColor(floatArrayOf(hue,sat,1f)))}}){
            drawCircle(brush=Brush.sweepGradient(listOf(Color.Red,Color.Yellow,Color.Green,Color.Cyan,Color.Blue,Color.Magenta,Color.Red)))
            drawCircle(brush=Brush.radialGradient(listOf(Color.White,Color.Transparent)),alpha=.92f)
        }
    }
}'''
new_wheel = '''@Composable private fun B6ColorWheel(selected:Int,onSelect:(Int)->Unit){
    val hsv = remember(selected) { FloatArray(3).also { android.graphics.Color.colorToHSV(selected, it) } }
    Box(Modifier.fillMaxWidth(),contentAlignment=Alignment.Center){
        Canvas(Modifier.size(235.dp).pointerInput(Unit){detectTapGestures{p->val cx=size.width/2f;val cy=size.height/2f;val dx=p.x-cx;val dy=p.y-cy;val radius=min(size.width,size.height)/2f;val sat=(sqrt(dx*dx+dy*dy)/radius).coerceIn(0f,1f);val hue=((atan2(dy,dx)*180f/PI.toFloat())+360f)%360f;onSelect(android.graphics.Color.HSVToColor(floatArrayOf(hue,sat,1f)))}}){
            drawCircle(brush=Brush.sweepGradient(listOf(Color.Red,Color.Yellow,Color.Green,Color.Cyan,Color.Blue,Color.Magenta,Color.Red)))
            drawCircle(brush=Brush.radialGradient(listOf(Color.White,Color.Transparent)),alpha=.92f)
            val radius=min(size.width,size.height)/2f
            val angle=hsv[0]*PI.toFloat()/180f
            val r=radius*hsv[1].coerceIn(0f,1f)
            val point=Offset(size.width/2f+cos(angle)*r,size.height/2f+sin(angle)*r)
            drawCircle(color=Color.White,radius=9f,center=point)
            drawCircle(color=Color(selected),radius=5.5f,center=point)
        }
    }
}'''
replace(old_wheel, new_wheel, 'color wheel marker')

p.write_text(s)
print('Applied Work Schedule Beta 0.7 visual polish patch')
