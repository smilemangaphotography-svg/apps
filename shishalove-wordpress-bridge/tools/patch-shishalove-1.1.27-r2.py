#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.27-r2.py <plugin-dir>')

here = Path(__file__).resolve().parent
original = here / 'patch-shishalove-1.1.27.py'
src = original.read_text(encoding='utf-8')

old_customer = r'''customer = replace_once(
    customer,
    "var CFG=window.SHISHALOVE_BRIDGE||{};\nvar root=document.getElementById('slb-root');",
    "var CFG=window.SHISHALOVE_BRIDGE||{};\nCFG.version='1.1.27';\nvar root=document.getElementById('slb-root');\nfunction slbRuntimeRefresh(){try{var q=new URLSearchParams(location.search),ua=navigator.userAgent||'';if((q.get('app')==='android'||q.has('build')||/\\bwv\\b/i.test(ua))&&/Android/i.test(ua))document.documentElement.classList.add('slb-android-app');var l=document.querySelector('link[href*=\"bridge.css\"]');if(l){var u=new URL(l.href,location.href);u.searchParams.set('slbfix','1.1.27');l.href=u.toString();}}catch(e){}}\nslbRuntimeRefresh();",
    'customer runtime freshness'
)
'''
new_customer = r'''customer = replace_once(
    customer,
    "var CFG=window.SHISHALOVE_BRIDGE||{};",
    "var CFG=window.SHISHALOVE_BRIDGE||{};\nCFG.version='1.1.27';\nfunction slbRuntimeRefresh(){try{var q=new URLSearchParams(location.search),ua=navigator.userAgent||'';if((q.get('app')==='android'||q.has('build')||/\\bwv\\b/i.test(ua))&&/Android/i.test(ua))document.documentElement.classList.add('slb-android-app');var l=document.querySelector('link[href*=\"bridge.css\"]');if(l){var u=new URL(l.href,location.href);u.searchParams.set('slbfix','1.1.27');l.href=u.toString();}}catch(e){}}\nslbRuntimeRefresh();",
    'customer runtime freshness'
)
'''

old_merchant = r'''merchant = replace_once(
    merchant,
    "var CFG=window.SHISHALOVE_BRIDGE||{};\nvar root=document.getElementById('slb-root');",
    "var CFG=window.SHISHALOVE_BRIDGE||{};\nCFG.version='1.1.27';\nvar root=document.getElementById('slb-root');\nfunction slmRuntimeRefresh(){try{var q=new URLSearchParams(location.search),ua=navigator.userAgent||'';if((q.get('app')==='android'||q.has('build')||/\\bwv\\b/i.test(ua))&&/Android/i.test(ua))document.documentElement.classList.add('slb-android-app');var l=document.querySelector('link[href*=\"bridge.css\"]');if(l){var u=new URL(l.href,location.href);u.searchParams.set('slbfix','1.1.27');l.href=u.toString();}}catch(e){}}\nslmRuntimeRefresh();",
    'merchant runtime freshness'
)
'''
new_merchant = r'''merchant = replace_once(
    merchant,
    "var CFG=window.SHISHALOVE_BRIDGE||{};",
    "var CFG=window.SHISHALOVE_BRIDGE||{};\nCFG.version='1.1.27';\nfunction slmRuntimeRefresh(){try{var q=new URLSearchParams(location.search),ua=navigator.userAgent||'';if((q.get('app')==='android'||q.has('build')||/\\bwv\\b/i.test(ua))&&/Android/i.test(ua))document.documentElement.classList.add('slb-android-app');var l=document.querySelector('link[href*=\"bridge.css\"]');if(l){var u=new URL(l.href,location.href);u.searchParams.set('slbfix','1.1.27');l.href=u.toString();}}catch(e){}}\nslmRuntimeRefresh();",
    'merchant runtime freshness'
)
'''

if old_customer not in src:
    raise SystemExit('1.1.27 customer source anchor missing')
if old_merchant not in src:
    raise SystemExit('1.1.27 merchant source anchor missing')
src = src.replace(old_customer, new_customer, 1).replace(old_merchant, new_merchant, 1)

ns = {'__name__': '__main__', '__file__': str(original)}
exec(compile(src, str(original), 'exec'), ns, ns)
