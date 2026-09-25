#!/usr/bin/env python3
from pathlib import Path
import re, sys

if len(sys.argv) != 2:
    raise SystemExit("usage: patch-shishalove-1.1.70-bottom-nav-safe-area.py <plugin-dir>")

root=Path(sys.argv[1])
php=root/"shishalove-app-bridge.php"
css=root/"assets"/"bridge.css"
merchant=root/"assets"/"merchant.js"
customer=root/"assets"/"customer.js"
for f in (php,css,merchant,customer):
    if not f.exists():
        raise SystemExit("missing "+str(f))

p=php.read_text(encoding="utf-8")
c=css.read_text(encoding="utf-8")
m0=merchant.read_bytes()
u0=customer.read_bytes()

def one(text, old, new, label):
    n=text.count(old)
    if n != 1:
        raise SystemExit(label+": expected 1 occurrence, found "+str(n))
    return text.replace(old,new,1)

if p.count("Version: 1.1.69") != 1 or p.count("define('SLB_VERSION', '1.1.69');") != 1:
    raise SystemExit("expected exact Bridge 1.1.69 baseline")

p=one(p,"Version: 1.1.69","Version: 1.1.70","plugin version")
p=one(p,"define('SLB_VERSION', '1.1.69');","define('SLB_VERSION', '1.1.70');","version constant")

# Remove the two historical Android viewport sections that performed document-scroll
# and fixed-nav corrections before the native inset was known. 1.1.23 and later
# retain the approved header/logo rules.
for start,end,label in (
    ("/* ShishaLove 1.1.21 Merchant Android viewport correction only.","/* ShishaLove 1.1.22 PERMANENT Merchant Android header + scroll correction.","1.1.21 viewport section"),
    ("/* ShishaLove 1.1.22 PERMANENT Merchant Android header + scroll correction.","/* ShishaLove 1.1.23 PERMANENT Merchant header-logo size/alignment lock.","1.1.22 viewport section"),
):
    pattern=re.escape(start)+r".*?(?="+re.escape(end)+r")"
    c,n=re.subn(pattern,"",c,count=1,flags=re.S)
    if n != 1:
        raise SystemExit("failed to remove "+label)

c=one(c,"html.slb-android-app{--slb-native-bottom:48px}","html.slb-android-app{--slb-native-bottom:0px}","remove guessed 48px inset")

c=one(c,'''html.slb-android-app body.slb-merchant .slm-bottom{
  bottom:var(--slb-native-bottom)!important;height:76px!important;padding-bottom:0!important;
}
html.slb-android-app body.slb-merchant .slm-app{
  padding-bottom:calc(88px + var(--slb-native-bottom))!important;
}
''',"","remove legacy native-bottom nav/app geometry")

c=one(c,"html.slb-android-app body.slb-merchant.slb-platform-android .slm-page{padding-bottom:calc(176px + var(--slb-native-bottom))!important}\n","","remove legacy 176px content pad")

c += r'''

/* ShishaLove Merchant 1.1.70 — first-paint Android safe-area lock.
   Android WindowInsetsCompat.systemBars() owns the physical safe area before reveal.
   CSS owns only Merchant viewport/nav geometry inside that already-safe WebView. */
html.slb-android-app{--slb-native-bottom:0px!important;--safe-bottom:0px!important}
html.slb-android-app body.slb-merchant.slb-platform-android{
  margin:0!important;padding:0!important;width:100%!important;height:100dvh!important;min-height:100dvh!important;
  overflow:hidden!important;overscroll-behavior:none!important;
}
html.slb-android-app body.slb-merchant.slb-platform-android #slb-root{
  position:relative!important;width:100%!important;height:100dvh!important;min-height:0!important;overflow:hidden!important;
}
html.slb-android-app body.slb-merchant.slb-platform-android .slm-app{
  position:fixed!important;inset:0!important;width:100%!important;height:100dvh!important;min-height:0!important;
  margin:0!important;padding:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;background:#fff!important;
}
html.slb-android-app body.slb-merchant.slb-platform-android .slm-top{
  position:relative!important;top:auto!important;flex:0 0 auto!important;
}
html.slb-android-app body.slb-merchant.slb-platform-android .slm-page{
  position:relative!important;flex:1 1 0!important;min-height:0!important;height:auto!important;
  overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;
  overscroll-behavior:contain!important;touch-action:pan-y!important;
  padding-bottom:106px!important;scroll-padding-bottom:106px!important;
}
html.slb-android-app body.slb-merchant.slb-platform-android .slm-bottom{
  position:fixed!important;left:0!important;right:0!important;top:auto!important;bottom:0!important;inset:auto 0 0 0!important;
  transform:none!important;width:100%!important;height:82px!important;min-height:82px!important;
  margin:0!important;padding:0!important;box-sizing:border-box!important;background:#fff!important;border-top:1px solid #eee!important;z-index:100!important;
}
'''

php.write_text(p,encoding="utf-8")
css.write_text(c,encoding="utf-8")

if merchant.read_bytes()!=m0:
    raise SystemExit("merchant.js unexpectedly changed")
if customer.read_bytes()!=u0:
    raise SystemExit("customer.js unexpectedly changed")

required=("Version: 1.1.70","height:100dvh!important","padding-bottom:106px!important","scroll-padding-bottom:106px!important","inset:auto 0 0 0!important")
for token in required:
    if token not in p+c:
        raise SystemExit("missing required token: "+token)

for forbidden in ("html.slb-android-app{--slb-native-bottom:48px}","calc(176px + var(--slb-native-bottom))","bottom:var(--slb-native-bottom)!important;height:76px"):
    if forbidden in c:
        raise SystemExit("legacy Android geometry remains: "+forbidden)

print("Bridge 1.1.70 first-paint bottom-nav safe-area patch applied")
