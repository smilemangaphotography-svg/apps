#!/usr/bin/env python3
from pathlib import Path
import subprocess, sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.37.py <plugin-dir>')
root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.36.py'), str(root)])

def once(text, old, new, label):
    n=text.count(old)
    if n!=1: raise SystemExit(f'{label}: expected 1 anchor, found {n}')
    return text.replace(old,new,1)

# Version/cache keys.
p=root/'assets/customer.js'; t=p.read_text(encoding='utf-8')
t=once(t,"var BUILD='1.1.36';","var BUILD='1.1.37';",'customer build')
t=once(t,"CFG.version='1.1.36';","CFG.version='1.1.37';",'customer cfg')
t=once(t,"slbfix','1.1.36'","slbfix','1.1.37'",'customer bust')
p.write_text(t,encoding='utf-8')

p=root/'assets/merchant.js'; t=p.read_text(encoding='utf-8')
t=once(t,"CFG.version='1.1.36';","CFG.version='1.1.37';",'merchant cfg')
t=once(t,"slbfix','1.1.36'","slbfix','1.1.37'",'merchant bust')
t=once(t,'Bridge 1.1.36','Bridge 1.1.37','merchant label')

# Instant refresh: always paint cached rows first, even when Refresh requested.
product_cache_old="if(cached&&!force){state.productsByView[name]=cached;if(state.view===name)render();}"
product_cache_new="if(cached){state.productsByView[name]=cached;if(state.view===name)render();}"
count=t.count(product_cache_old)
if count!=2:
    raise SystemExit(f'merchant product/search stale-while-revalidate: expected 2 anchors, found {count}')
t=t.replace(product_cache_old,product_cache_new,2)
t=once(t,
"if(cached&&!force){state.orders=cached;if(state.view==='orders')render();}",
"if(cached){state.orders=cached;if(state.view==='orders')render();}",
'merchant orders stale-while-revalidate')
p.write_text(t,encoding='utf-8')

p=root/'assets/bridge.css'; css=p.read_text(encoding='utf-8')
css += r'''

/* ShishaLove 1.1.37 — strict viewport ownership and safe navigation. */

/* Customer selector: never truncate Recommended order. */
body.slb-customer .slb-toolbar{grid-template-columns:minmax(0,1fr) 205px!important;}
body.slb-customer .slb-toolbar select{width:205px!important;min-width:205px!important;max-width:205px!important;font-size:16px!important;padding-right:28px!important;text-overflow:clip!important;}

/* Browser/iPhone/Android-browser Merchant: one fixed application viewport.
   Header + one scroll surface + nav. There is no document content below nav. */
html:not(.slb-android-app) body.slb-merchant{margin:0!important;padding:0!important;overflow:hidden!important;}
html:not(.slb-android-app) body.slb-merchant .slm-app{
  position:fixed!important;
  inset:0!important;
  width:100%!important;
  height:auto!important;
  min-height:0!important;
  display:flex!important;
  flex-direction:column!important;
  overflow:hidden!important;
  padding:0!important;
  background:#fff!important;
}
html:not(.slb-android-app) body.slb-merchant .slm-top{flex:0 0 auto!important;position:relative!important;top:auto!important;}
html:not(.slb-android-app) body.slb-merchant .slm-page{
  flex:1 1 0!important;
  min-height:0!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  -webkit-overflow-scrolling:touch!important;
  overscroll-behavior:contain!important;
  padding-bottom:24px!important;
}
html:not(.slb-android-app) body.slb-merchant .slm-bottom{
  position:relative!important;
  inset:auto!important;
  flex:0 0 82px!important;
  width:100%!important;
  height:82px!important;
  min-height:82px!important;
  margin:0!important;
  padding:0!important;
  box-sizing:border-box!important;
  background:#fff!important;
  border-top:1px solid #eee!important;
  z-index:100!important;
}
'''
p.write_text(css,encoding='utf-8')
print('ShishaLove Bridge 1.1.37 applied')
