from pathlib import Path

p = Path("app/src/main/java/com/ilia/workschedule/MainActivity.kt")
s = p.read_text(encoding="utf-8")

replacements = {
    'JSONArray(p.getString("entries","[]"))': 'JSONArray(p.getString("entries","[]")?:"[]")',
    'NavigationBarItem(t==s,{on(t)},{Icon(i,null)},{Text(t.name.lowercase().replaceFirstChar{it.uppercase()},fontSize=11.sp)},colors=': 'NavigationBarItem(selected=t==s,onClick={on(t)},icon={Icon(i,null)},label={Text(t.name.lowercase().replaceFirstChar{it.uppercase()},fontSize=11.sp)},colors=',
    'Text(st.s("job","Main Job")+" ⌄",fontSize=24.sp);': 'Text(st.s("job","Main Job")+" ⌄",fontSize=24.sp,modifier=Modifier.clickable(onClick=onSettings));',
    'Icon(Icons.Outlined.ChevronRight,null,color=Muted)': 'Icon(Icons.Outlined.ChevronRight,null,tint=Muted)',
    'FilterChip(f==o,{f=o},{Text(o)})': 'FilterChip(selected=f==o,onClick={f=o},label={Text(o)})',
    'if(export)AlertDialog({export=false},{TextButton({export=false}){Text("Cancel")}},{Button({content=csv(data);export=false;launcher.launch("work-schedule.csv")}){Text("Export CSV")}},{Text("Backup & Export")},{Text("Export your schedule, hours and earnings as CSV.")})': 'if(export)AlertDialog(onDismissRequest={export=false},confirmButton={Button({content=csv(data);export=false;launcher.launch("work-schedule.csv")}){Text("Export CSV")}},dismissButton={TextButton({export=false}){Text("Cancel")}},title={Text("Backup & Export")},text={Text("Export your schedule, hours and earnings as CSV.")})',
    'AlertDialog(close,{TextButton(close){Text("Cancel")}},{TextButton({save(t)}){Text("Save")}},{Text(k.replaceFirstChar{it.uppercase()})},{OutlinedTextField(t,{t=it},singleLine=true,keyboardOptions=KeyboardOptions(keyboardType=if(k=="rate"||k=="break")KeyboardType.Decimal else KeyboardType.Text))})': 'AlertDialog(onDismissRequest=close,confirmButton={TextButton({save(t)}){Text("Save")}},dismissButton={TextButton(close){Text("Cancel")}},title={Text(k.replaceFirstChar{it.uppercase()})},text={OutlinedTextField(t,{t=it},singleLine=true,keyboardOptions=KeyboardOptions(keyboardType=if(k=="rate"||k=="break")KeyboardType.Decimal else KeyboardType.Text))})',
    'if(del)AlertDialog({del=false},{TextButton({del=false}){Text("Cancel")}},{TextButton({del=false;delete?.invoke()}){Text("Delete")}},{Text("Delete entry?")},{Text("This cannot be undone.")})': 'if(del)AlertDialog(onDismissRequest={del=false},confirmButton={TextButton({del=false;delete?.invoke()}){Text("Delete")}},dismissButton={TextButton({del=false}){Text("Cancel")}},title={Text("Delete entry?")},text={Text("This cannot be undone.")})',
}

for old, new in replacements.items():
    if old not in s:
        print("warning: replacement target not found:", old[:90])
    s = s.replace(old, new)

p.write_text(s, encoding="utf-8")
print("Applied Work Schedule Beta compile fixes")
