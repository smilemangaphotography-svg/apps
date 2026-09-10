from pathlib import Path

# Run the canonical 5.1.2 patch with the Gradle module path corrected for
# this repository layout. The NAR Android module itself is buildsrc/NAR-Mix/app,
# so its build.gradle is directly under root, not under root/app/.
p=Path('nar-beta51/patch_beta_v512_add_photos.py')
s=p.read_text()
old="gradle_candidates=[root/'app/build.gradle',root/'app/build.gradle.kts']"
new="gradle_candidates=[root/'build.gradle',root/'build.gradle.kts']"
if old not in s:
    raise SystemExit('NAR 5.1.2 Gradle path hook missing')
s=s.replace(old,new,1)
exec(compile(s,str(p),'exec'))
