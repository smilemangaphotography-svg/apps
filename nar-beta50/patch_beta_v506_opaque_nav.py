from pathlib import Path
import re

root=Path('buildsrc/NAR-Mix/app')
css_path=root/'src/main/assets/app.css'
if not css_path.exists():
    raise SystemExit('Canonical NAR CSS not found')
css=css_path.read_text()
MARK='NAR BETA 5.0.6 — OPAQUE ANDROID NAV SHELF'

if MARK not in css:
    css += r'''

/* NAR BETA 5.0.6 — OPAQUE ANDROID NAV SHELF
   The fixed NĀR tab bar must be visually solid. Scrolling flavor cards may
   continue underneath it for natural scrolling, but they must never be
   visible through the bar or through the Android-safe strip beneath it. */
:root{--nar-nav-solid:#050705}
.betaNav,
.pixelNarNav,
.beta50Shell .betaNav,
.beta50Shell .pixelNarNav{
  background:var(--nar-nav-solid)!important;
  background-color:var(--nar-nav-solid)!important;
  background-image:none!important;
  -webkit-backdrop-filter:none!important;
  backdrop-filter:none!important;
  opacity:1!important;
  isolation:isolate!important;
  overflow:visible!important;
  z-index:10000!important;
  box-shadow:0 -1px 0 rgba(224,164,91,.14),0 -18px 28px -24px rgba(0,0,0,.95)!important;
}
/* Fill the full safe strip between the NĀR bar and Android's system controls. */
.betaNav::after,
.pixelNarNav::after{
  content:""!important;
  position:absolute!important;
  left:0!important;
  right:0!important;
  top:100%!important;
  height:max(64px,calc(env(safe-area-inset-bottom,0px) + 18px))!important;
  background:var(--nar-nav-solid)!important;
  opacity:1!important;
  pointer-events:none!important;
  z-index:0!important;
}
.betaNav>* ,
.pixelNarNav>*{
  position:relative!important;
  z-index:2!important;
}
/* Keep enough scroll clearance so the last card can be brought completely
   above the opaque shelf instead of ending behind it. */
.beta50Shell #page{
  padding-bottom:max(250px,calc(172px + env(safe-area-inset-bottom,0px)))!important;
  scroll-padding-bottom:max(250px,calc(172px + env(safe-area-inset-bottom,0px)))!important;
}
.beta505BottomSpacer{
  height:max(250px,calc(172px + env(safe-area-inset-bottom,0px)))!important;
  min-height:max(250px,calc(172px + env(safe-area-inset-bottom,0px)))!important;
  flex-basis:max(250px,calc(172px + env(safe-area-inset-bottom,0px)))!important;
}
'''

css_path.write_text(css)

# Canonical in-place version bump.
metadata=[]
for pattern in ('**/build.gradle','**/build.gradle.kts','**/AndroidManifest.xml'):
    metadata.extend(root.parent.glob(pattern))
metadata=list(dict.fromkeys(metadata))
found=False
for p in metadata:
    try:s=p.read_text()
    except UnicodeDecodeError:continue
    old=s
    s=re.sub(r'(?m)(\bversionName\s*(?:=\s*)?)["\'][^"\']+["\']',r'\g<1>"5.0.6-beta"',s)
    s=re.sub(r'(android:versionName\s*=\s*)["\'][^"\']+["\']',r'\g<1>"5.0.6-beta"',s)
    s=re.sub(r'(?m)(\bversionCode\s*(?:=\s*)?)\d+',r'\g<1>556',s)
    s=re.sub(r'(android:versionCode\s*=\s*)["\']\d+["\']',r'\g<1>"556"',s)
    if '5.0.6-beta' in s: found=True
    if s!=old:p.write_text(s)
if not found: raise SystemExit('Beta 5.0.6 version metadata hook not found')
print('Applied NAR Beta 5.0.6 opaque Android navigation shelf; versionCode 556')
