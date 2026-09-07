from pathlib import Path

p=Path('buildsrc/Ilias-Coach/app/src/main/java/com/iliaperformance/iliacoach2026/V6Features.kt')
s=p.read_text()
s=s.replace('PrimaryButton("OPEN TODAY →") { onNavigate("today") }','V6PrimaryButton("OPEN TODAY →") { onNavigate("today") }')
s=s.replace('SecondaryButton("VIEW WEEK PLAN") { onNavigate("week") }','V6SecondaryButton("VIEW WEEK PLAN") { onNavigate("week") }')
s=s.replace('MiniAction("ADD") { if (custom.isNotBlank()) { vm.addAvoidFood(custom); custom = "" } }','MiniAction("ADD", onClick = { if (custom.isNotBlank()) { vm.addAvoidFood(custom); custom = "" } })')
s=s.replace('MiniAction("CLEAR", accent = CoachMuted) { vm.clearAvoidFoods() }','MiniAction("CLEAR", onClick = { vm.clearAvoidFoods() }, accent = CoachMuted)')
s=s.replace('MiniAction("TIME") { vm.cycleWeekTime(index) }','MiniAction("TIME", onClick = { vm.cycleWeekTime(index) })')
s=s.replace('MiniAction(if (day.enabled) "ACTIVE" else "REST", accent = if (day.enabled) CoachLime else CoachMuted) { vm.toggleWeekDay(index) }','MiniAction(if (day.enabled) "ACTIVE" else "REST", onClick = { vm.toggleWeekDay(index) }, accent = if (day.enabled) CoachLime else CoachMuted)')
s=s.replace('MiniAction("PLAN") { vm.cycleWeekProgram(index) }','MiniAction("PLAN", onClick = { vm.cycleWeekProgram(index) })')

if 'private fun V6PrimaryButton' not in s:
    s += '''\n\n@Composable\nprivate fun V6PrimaryButton(text: String, onClick: () -> Unit) {\n    androidx.compose.material3.Button(\n        onClick = onClick,\n        colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = CoachBlue, contentColor = Color.White),\n        shape = RoundedCornerShape(18.dp)\n    ) { Text(text, fontWeight = FontWeight.Black, fontSize = 14.sp) }\n}\n\n@Composable\nprivate fun V6SecondaryButton(text: String, onClick: () -> Unit) {\n    androidx.compose.material3.Button(\n        onClick = onClick,\n        colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = CoachCard2, contentColor = CoachText),\n        shape = RoundedCornerShape(16.dp)\n    ) { Text(text, fontWeight = FontWeight.Bold, fontSize = 12.sp) }\n}\n'''

p.write_text(s)
for needle in ['V6PrimaryButton("OPEN TODAY →")','MiniAction("ADD", onClick =','MiniAction("PLAN", onClick =','private fun V6PrimaryButton']:
    if needle not in s: raise SystemExit(f'V6 compile fix missing: {needle}')
print('Applied V6 Kotlin compile fixes')
