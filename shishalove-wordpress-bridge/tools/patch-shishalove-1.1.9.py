#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.9.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent

# 1.1.9 is a bridge-owned runtime update. Carry forward the complete 1.1.8
# customer behavior first, then harden the bridge against legacy Android wrapper
# scripts that still exist in older installed APKs.
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.8.py'), str(root)])

js_path = root / 'assets' / 'customer.js'
css_path = root / 'assets' / 'bridge.css'
js = js_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'1.1.9 patch failed: {label}')
    return text.replace(old, new, 1)


# New cache namespace so phones cannot reuse stale 1.1.8 product/category renders.
js = replace_once(js, "var BUILD='1.1.8';", "var BUILD='1.1.9';", 'customer build key')

# Install the bridge ownership guard as early as possible. Older APKs still contain
# customer_phone_polish.js / customer_phone_fix_115.js. Those scripts can otherwise
# create a second drawer/age overlay, install document observers, or tag category
# buttons so they leave /shishalove-app/ for legacy WooCommerce category pages.
root_anchor = "var root=document.getElementById('slb-root');\nif(!root){return;}\n"
guard = r'''var root=document.getElementById('slb-root');
if(!root){return;}

function legacySafeLabel(value){
  value=String(value==null?'':value);
  return value.length>1?value.charAt(0)+'\u200c'+value.slice(1):value+'\u200c';
}
function numericProductPrice(item){
  if(item&&item.price_value!=null&&item.price_value!=='')return Number(item.price_value)||0;
  var raw=String(item&&item.price!=null?item.price:'').replace(/[^0-9.,-]/g,'').replace(',','.');
  return Number(raw)||0;
}
function neutralizeLegacyWrapper(){
  try{
    ['__sl114obs','__sl115Obs'].forEach(function(k){
      var observer=window[k];
      if(observer&&typeof observer.disconnect==='function')observer.disconnect();
      window[k]=1;
    });
    window.__sl114back=1;
    window.__sl115RouteCapture=1;

    document.querySelectorAll('[data-sl115-route]').forEach(function(el){el.removeAttribute('data-sl115-route');});
    if(document.body){
      document.body.classList.remove('sl114-drawer-open','sl114-appshell','sl115-category');
      document.body.style.overflow='';
    }

    ['sl114-drawer','sl114-backdrop','sl114-age','sl114-appbar','sl114-bottom','sl115-category-head'].forEach(function(id){
      var old=document.getElementById(id);
      if(old&&!old.hasAttribute('data-slb-legacy-guard'))old.remove();
    });
    var oldStyle=document.getElementById('sl114-style');
    if(oldStyle&&!oldStyle.hasAttribute('data-slb-legacy-guard'))oldStyle.remove();

    function sentinel(id,tag){
      var el=document.getElementById(id);
      if(!el){
        el=document.createElement(tag||'div');
        el.id=id;
        el.setAttribute('data-slb-legacy-guard','1');
        el.setAttribute('aria-hidden','true');
        el.style.setProperty('display','none','important');
        (document.body||document.documentElement).appendChild(el);
      }
    }
    sentinel('sl114-drawer');
    sentinel('sl114-backdrop');
    sentinel('sl114-age');
    sentinel('sl114-style','style');
  }catch(e){}
}
neutralizeLegacyWrapper();
'''
js = replace_once(js, root_anchor, guard, 'legacy wrapper ownership guard')

# The old wrapper capture listener recognizes aria-label="Menu" and the literal ☰.
# Keep the same appearance via CSS, but make the actual bridge control immune to it.
js = replace_once(
    js,
    '<button class="slb-menu" data-act="drawer" aria-label="Menu">☰</button>',
    '<button class="slb-menu" data-act="drawer" aria-label="Navigation"><span class="slb-menu-lines" aria-hidden="true"></span></button>',
    'legacy-safe menu control'
)

# Do not let legacy exact-text route scanners attach /product-category/... routes to
# bridge-native category controls. A zero-width non-joiner keeps the label visually
# identical while bridge routing continues to use category IDs/state.
js = js.replace("<span>'+esc(c.name)+'</span></button>", "<span>'+esc(legacySafeLabel(c.name))+'</span></button>")
js = replace_once(
    js,
    "<span>'+esc(c.name).toUpperCase()+'</span><span>›</span></button>",
    "<span>'+esc(legacySafeLabel(c.name).toUpperCase())+'</span><span>›</span></button>",
    'legacy-safe drawer category labels'
)

# The bridge owns the single age gate. Avoid the exact phrase used by the old APK's
# popup-suppression scanner, while retaining the same legal-age confirmation meaning.
js = replace_once(
    js,
    'This storefront may contain age-restricted products. Confirm that you meet the legal age requirement in your location.',
    'Age confirmation is required to enter this shop. Please confirm that you meet the legal age requirement in your location.',
    'age copy immune to legacy scanner'
)

# Always remove legacy state before bridge renders or opens/closes its own drawer.
js = replace_once(
    js,
    "function render(){\n  document.body.style.overflow='';",
    "function render(){\n  neutralizeLegacyWrapper();\n  document.body.style.overflow='';",
    'render legacy cleanup'
)
js = replace_once(
    js,
    "function openDrawer(open){\n  var d=document.querySelector('.slb-drawer'),b=document.querySelector('.slb-backdrop');",
    "function openDrawer(open){\n  neutralizeLegacyWrapper();\n  var d=document.querySelector('.slb-drawer'),b=document.querySelector('.slb-backdrop');",
    'drawer legacy cleanup'
)

# Server-side numeric sorting remains authoritative. Also sort the visible Home page
# defensively so Recommended/Home visibly reflects Low→High / High→Low immediately.
js = replace_once(
    js,
    "    var items=(data.items||[]).filter(function(x){return x.stock_status==='instock';});\n    data.items=items;",
    "    var items=(data.items||[]).filter(function(x){return x.stock_status==='instock';});\n    if(state.homeSort==='price-asc'||state.homeSort==='price-desc'){items.sort(function(a,b){var av=numericProductPrice(a),bv=numericProductPrice(b);return state.homeSort==='price-asc'?av-bv:bv-av;});}\n    else if(state.homeSort==='title-asc'){items.sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''));});}\n    data.items=items;",
    'defensive home sorting'
)

# Remove any legacy route tags after every binding pass as a final defence if an old
# APK injects its patch after the bridge has already painted.
js = replace_once(
    js,
    "function bind(){",
    "function bind(){\n  neutralizeLegacyWrapper();",
    'bind legacy cleanup'
)

css += r'''

/* ShishaLove 1.1.9 bridge ownership / old-wrapper compatibility lock */
body.slb-customer #sl114-drawer,
body.slb-customer #sl114-backdrop,
body.slb-customer #sl114-age,
body.slb-customer #sl114-appbar,
body.slb-customer #sl114-bottom,
body.slb-customer #sl115-category-head{display:none!important}

.slb-menu{font-size:0!important;line-height:1!important}
.slb-menu-lines,.slb-menu-lines::before,.slb-menu-lines::after{display:block;width:31px;height:3px;background:#111;border-radius:2px;content:''}
.slb-menu-lines{position:relative}
.slb-menu-lines::before{position:absolute;left:0;top:-9px}
.slb-menu-lines::after{position:absolute;left:0;top:9px}

.slb-drawer{overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain;padding-bottom:calc(96px + env(safe-area-inset-bottom))!important}
.slb-drawer-lower{padding-bottom:calc(40px + env(safe-area-inset-bottom))!important}
body.slb-customer{min-height:100%!important;overflow-y:auto!important;touch-action:pan-y!important}
'''

js_path.write_text(js, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
print('ShishaLove 1.1.9 bridge-owned compatibility patch applied')
