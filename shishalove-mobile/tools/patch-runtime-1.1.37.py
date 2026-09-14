#!/usr/bin/env python3
from pathlib import Path
import subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
subprocess.check_call([sys.executable,str(Path(__file__).with_name('patch-runtime-1.1.36.py'))])

def once(text,old,new,label):
    n=text.count(old)
    if n!=1: raise SystemExit(f'{label}: expected 1 anchor, found {n}')
    return text.replace(old,new,1)

# CUSTOMER: Android owns top AND bottom system-bar insets. The WebView therefore
# physically ends above Samsung's navigation area; the web bottom bar never shares
# pixels with Android system buttons.
p=ROOT/'customer/src/main/java/eu/shishalove/customer/CustomerActivityV134.java'
t=p.read_text(encoding='utf-8')
t=once(t,
"bottomInsetCssPx = Math.max(0, Math.round(bars.bottom / Math.max(1f, density)));",
"bottomInsetCssPx = 0;",
'customer native bottom css reset')
t=once(t,
"v.setPadding(bars.left, bars.top, bars.right, 0);",
"v.setPadding(bars.left, bars.top, bars.right, bars.bottom);",
'customer native bottom inset ownership')
t=t.replace('// Exactly one top safe area. No native bottom padding: the WebView/nav\n                // paints through the system navigation area itself.',
'''// Native root owns both system safe areas exactly once. The WebView ends
                // above Android navigation controls, so app navigation never overlaps them.''')
p.write_text(t,encoding='utf-8')

# Update the existing customer Gradle invariant to the new permanent safe model.
p=ROOT/'customer/build.gradle'; t=p.read_text(encoding='utf-8')
t=t.replace("'v.setPadding(bars.left, bars.top, bars.right, 0);'","'v.setPadding(bars.left, bars.top, bars.right, bars.bottom);'")
t=once(t,'versionCode 136','versionCode 137','customer versionCode')
t=once(t,"versionName '1.1.36'","versionName '1.1.37'",'customer versionName')
t=t.replace('ShishaLoveCustomer/1.1.36','ShishaLoveCustomer/1.1.37')
p.write_text(t,encoding='utf-8')

p=ROOT/'customer/src/main/java/eu/shishalove/customer/MainActivity.java'; t=p.read_text(encoding='utf-8')
t=once(t,'build=136','build=137','customer cache bust')
t=t.replace('ShishaLoveCustomer/1.1.36','ShishaLoveCustomer/1.1.37')
p.write_text(t,encoding='utf-8')

# MERCHANT: retain 1.1.36 native single-owner inset fix, bump only runtime/cache.
p=ROOT/'merchant/build.gradle'; t=p.read_text(encoding='utf-8')
t=once(t,'versionCode 136','versionCode 137','merchant versionCode')
t=once(t,"versionName '1.1.36'","versionName '1.1.37'",'merchant versionName')
t=t.replace('ShishaLoveMerchant/1.1.36','ShishaLoveMerchant/1.1.37')
p.write_text(t,encoding='utf-8')

p=ROOT/'merchant/src/main/java/eu/shishalove/merchant/MainActivity.java'; t=p.read_text(encoding='utf-8')
t=once(t,'build=136','build=137','merchant cache bust')
t=t.replace('ShishaLoveMerchant/1.1.36','ShishaLoveMerchant/1.1.37')
p.write_text(t,encoding='utf-8')

# Permanent invariants.
ca=(ROOT/'customer/src/main/java/eu/shishalove/customer/CustomerActivityV134.java').read_text(encoding='utf-8')
ma=(ROOT/'merchant/src/main/java/eu/shishalove/merchant/MerchantActivityV121.java').read_text(encoding='utf-8')
assert 'v.setPadding(bars.left, bars.top, bars.right, bars.bottom);' in ca
assert "bottomInsetCssPx = 0;" in ca
assert 'v.setPadding(bars.left, bars.top, bars.right, bars.bottom);' in ma
assert "--safe-bottom','0px','important'" in ma
assert 'versionCode 137' in (ROOT/'customer/build.gradle').read_text(encoding='utf-8')
assert 'versionCode 137' in (ROOT/'merchant/build.gradle').read_text(encoding='utf-8')
print('ShishaLove Android 1.1.37: canonical in-place update + permanent safe areas')
