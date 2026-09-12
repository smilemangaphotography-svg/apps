#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.8.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent

# Carry forward the already-approved 1.1.7 customer behavior first:
# Recommended + Recent Arrivals, numeric price sorting, 1:1 product detail,
# category shortcuts and working pager.
subprocess.check_call([sys.executable, str(tools / 'run-customer-1.1.7-rc2.py'), str(root)])

js_path = root / 'assets' / 'customer.js'
css_path = root / 'assets' / 'bridge.css'
php_path = root / 'shishalove-app-bridge.php'

js = js_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')
php = php_path.read_text(encoding='utf-8')


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'1.1.8 patch failed: {label}')
    return text.replace(old, new, 1)


def sub_once(text, pattern, repl, label):
    out, count = re.subn(pattern, repl, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'1.1.8 patch failed: {label} ({count})')
    return out

# A new build key invalidates stale local product/category caches from prior RCs.
js = replace_once(js, "var BUILD='1.1.7-rc.3';", "var BUILD='1.1.8';", 'customer build key')

# Never synthesize a second wordmark beside a valid WordPress logo. The website's
# official custom logo must be the single source shown in the customer header/drawer.
logo_pattern = r'''function logo\(\)\{.*?\n\}'''
logo_repl = r'''function logo(){
  if(CFG.logo){return '<span class="slb-brand-lockup wide-logo"><img class="slb-brand-mark" src="'+esc(CFG.logo)+'" alt="ShishaLove"></span>';}
  return '<span class="slb-brand-lockup"><span class="slb-brand-word">shishalove</span></span>';
}'''
js = sub_once(js, logo_pattern, logo_repl, 'single official logo')

# Migrate every age-confirmation key used by older wrappers/bridge builds into one
# stable acknowledgement plus a first-party cookie. This prevents the age dialog
# from randomly returning after normal refresh/navigation.
age_pattern = r'''function ageGate\(\)\{.*?\n\}'''
age_repl = r'''function ageAccepted(){
  var ok=false;
  try{
    var keys=['slb-age-ok','slb-age-ok-v116','sl-age-confirmed-v114','sl-age-confirmed-v113','slb-age-ok-stable'];
    for(var i=0;i<keys.length;i++){if(localStorage.getItem(keys[i])==='1'){ok=true;break;}}
    if(!ok&&/(?:^|;\\s*)slb_age_ok=1(?:;|$)/.test(document.cookie||''))ok=true;
    if(ok){localStorage.setItem('slb-age-ok-stable','1');localStorage.setItem('slb-age-ok','1');}
  }catch(e){}
  return ok;
}
function rememberAge(){
  try{
    ['slb-age-ok-stable','slb-age-ok','slb-age-ok-v116','sl-age-confirmed-v114','sl-age-confirmed-v113'].forEach(function(k){localStorage.setItem(k,'1');});
    document.cookie='slb_age_ok=1; Max-Age=31536000; Path=/; SameSite=Lax';
  }catch(e){}
}
function ageGate(){
  if(ageAccepted())return;
  if(document.querySelector('.slb-age'))return;
  var a=document.createElement('div');a.className='slb-age';
  a.innerHTML='<div class="slb-age-card"><h2>Welcome to<br>ShishaLove</h2><p>This storefront may contain age-restricted products. Confirm that you meet the legal age requirement in your location.</p><button class="slb-primary">I confirm I am of legal age</button><a class="slb-age-leave" href="https://www.google.com/">Leave</a></div>';
  document.body.appendChild(a);
  a.querySelector('button').onclick=function(){rememberAge();a.remove();};
}'''
js = sub_once(js, age_pattern, age_repl, 'stable age gate')

# Always release a drawer-induced body scroll lock before replacing a page.
js = replace_once(js, "function render(){\n  if(!state.bootstrap)", "function render(){\n  document.body.style.overflow='';\n  if(!state.bootstrap)", 'scroll unlock')

# Cached bootstrap paints instantly. A background bootstrap refresh should update
# state/cache without forcing a second full-page render/flicker.
js = replace_once(js, "    else{render();}\n  }", "    else{state.bootstrap=data;}\n  }", 'no duplicate bootstrap render')

# The official website custom logo wins deterministically. Attachment-name search is
# only a fallback if the active theme has no custom logo configured.
needle = "    $logo_id = (int) get_theme_mod('custom_logo');\n    if ($logo_id) { $candidates[] = $logo_id; }"
replacement = "    $logo_id = (int) get_theme_mod('custom_logo');\n    if ($logo_id) {\n        $official = (string) wp_get_attachment_image_url($logo_id, 'full');\n        if ($official) {\n            $official = (string) apply_filters('slb_brand_logo_url', $official);\n            set_transient($cache_key, $official, 12 * HOUR_IN_SECONDS);\n            return $official;\n        }\n        $candidates[] = $logo_id;\n    }"
php = replace_once(php, needle, replacement, 'official WordPress custom logo')

# Expose a numeric price for deterministic client validation/debugging and force
# WordPress meta sorting to numeric semantics for low/high price ordering.
php = replace_once(php, "        'price' => $product->get_price(),", "        'price' => $product->get_price(),\n        'price_value' => (float) $product->get_price(),", 'numeric price payload')
php = replace_once(php, "    if ($meta_key !== '') { $args['meta_key'] = $meta_key; }", "    if ($meta_key !== '') { $args['meta_key'] = $meta_key; $args['meta_type'] = 'NUMERIC'; }", 'numeric meta ordering')

# Defensive in-page ordering: server pagination stays authoritative, but each returned
# page is guaranteed to render in the exact selected numeric price direction.
js = replace_once(
    js,
    "    data.items=(data.items||[]).filter(function(x){return x.stock_status==='instock';});\n    state.pages=Math.max(1,Number(data.pages||1));cacheSet(key,data);",
    "    data.items=(data.items||[]).filter(function(x){return x.stock_status==='instock';});\n    if(state.sort==='price-asc'||state.sort==='price-desc'){data.items.sort(function(a,b){var av=Number(a.price_value!=null?a.price_value:String(a.price||'').replace(/[^0-9.,-]/g,'').replace(',','.'))||0;var bv=Number(b.price_value!=null?b.price_value:String(b.price||'').replace(/[^0-9.,-]/g,'').replace(',','.'))||0;return state.sort==='price-asc'?av-bv:bv-av;});}\n    state.pages=Math.max(1,Number(data.pages||1));cacheSet(key,data);",
    'defensive category price ordering'
)

css += r'''

/* ShishaLove 1.1.8 regression lock */
html,body{height:auto!important;min-height:100%!important;overflow-x:hidden!important}
body.slb-customer{overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important}
.slb-app,.slb-page,.slb-product-area,.slb-home-feed{overflow:visible}
.slb-top-logo .slb-brand-lockup.wide-logo .slb-brand-mark{max-width:205px!important;max-height:64px!important;width:auto!important;height:auto!important;object-fit:contain!important}
@media(max-width:390px){.slb-top-logo .slb-brand-lockup.wide-logo .slb-brand-mark{max-width:178px!important;max-height:58px!important}}
'''

js_path.write_text(js, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
php_path.write_text(php, encoding='utf-8')
print('ShishaLove 1.1.8 canonical customer regression patch applied')
