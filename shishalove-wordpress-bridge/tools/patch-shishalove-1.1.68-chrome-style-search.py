#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit("usage: patch-shishalove-1.1.68-chrome-style-search.py <plugin-dir>")

root=Path(sys.argv[1])
php=root/"shishalove-app-bridge.php"
js=root/"assets"/"merchant.js"
css=root/"assets"/"bridge.css"
customer=root/"assets"/"customer.js"
for p in (php,js,css,customer):
    if not p.exists(): raise SystemExit(f"missing {p}")

p=php.read_text(encoding="utf-8")
m=js.read_text(encoding="utf-8")
c=css.read_text(encoding="utf-8")
customer_before=customer.read_bytes()

def one(text,old,new,label):
    n=text.count(old)
    if n != 1: raise SystemExit(f"{label}: expected 1 occurrence, found {n}")
    return text.replace(old,new,1)

if p.count("Version: 1.1.67") != 1 or p.count("define('SLB_VERSION', '1.1.67');") != 1:
    raise SystemExit("expected exact Bridge 1.1.67 baseline")

p=one(p,"Version: 1.1.67","Version: 1.1.68","plugin version")
p=one(p,"define('SLB_VERSION', '1.1.67');","define('SLB_VERSION', '1.1.68');","version constant")

m=one(m,
"function shell(body){return '<div class=\"slm-app\">'+top()+body+bottom()+merchantMenu()+orderPanel()+editorPanel()+quickEditPanel()+visualSearchPanel()+photoSearchSheet()+'</div>';}",
"function shell(body){return '<div class=\"slm-app\">'+top()+body+bottom()+merchantMenu()+orderPanel()+editorPanel()+quickEditPanel()+visualSearchPanel()+'</div>';}",
"remove photo sheet")

m=one(m,
'''<div class="slm-search"><div class="slm-search-input-wrap"><input id="slm-product-search" type="search" enterkeyhint="search" placeholder="Search product name or SKU" value="'+esc(state.query)+'"><button type="button" class="slm-visual-trigger" data-act="visual-search-pick" aria-label="Photo search" title="Photo search">📷</button><input id="slm-visual-camera" class="slm-visual-file" type="file" accept="image/*" capture="environment" aria-hidden="true" tabindex="-1"><input id="slm-visual-gallery" class="slm-visual-file" type="file" accept="image/*" aria-hidden="true" tabindex="-1"></div><button data-act="search-products">Search</button></div>''',
'''<div class="slm-search"><div class="slm-search-input-wrap"><input id="slm-product-search" type="search" enterkeyhint="search" inputmode="search" autocomplete="off" placeholder="Search product name or SKU" value="'+esc(state.query)+'"><button type="button" class="slm-search-icon slm-camera-trigger" data-act="visual-search-camera" aria-label="Take photo" title="Take photo">📷</button><button type="button" class="slm-search-icon slm-gallery-trigger" data-act="visual-search-gallery" aria-label="Choose photo" title="Choose photo">🖼</button><input id="slm-visual-camera" class="slm-visual-file" type="file" accept="image/*" capture="environment" aria-hidden="true" tabindex="-1"><input id="slm-visual-gallery" class="slm-visual-file" type="file" accept="image/*" aria-hidden="true" tabindex="-1"></div><button type="button" data-act="search-products">Search</button></div>''',
"search control")

start=m.index("function photoSearchSheet(){")
end=m.index("function visualSearchPanel(){",start)
m=m[:start]+'''function syncProductSearchDraft(){var s=document.getElementById('slm-product-search');if(s)state.query=String(s.value||'');}
function launchVisualInput(id){syncProductSearchDraft();var f=document.getElementById(id);if(f){f.value='';f.click();}}
function bindVisualFileInput(id){var f=document.getElementById(id);if(f)f.onchange=function(){var file=this.files&&this.files[0];if(file)startVisualSearch(file);};}
function executeProductSearch(){
  var input=document.getElementById('slm-product-search');
  if(input)state.query=String(input.value||'').trim();else state.query=String(state.query||'').trim();
  state.page=1;
  resetProductResults(state.view);
  return loadProducts(state.view==='stock',true);
}
'''+m[end:]

m=one(m,
'''root.querySelectorAll('[data-act="visual-search-pick"],[data-act="visual-search-retry"]').forEach(function(e){e.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}openPhotoSearchSheet();};});root.querySelectorAll('[data-act="photo-search-cancel"]').forEach(function(e){e.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}dismissPhotoSearchSheet();};});root.querySelectorAll('[data-act="photo-search-camera"]').forEach(function(e){e.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}launchVisualInput('slm-visual-camera');};});root.querySelectorAll('[data-act="photo-search-gallery"]').forEach(function(e){e.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}launchVisualInput('slm-visual-gallery');};});bindVisualFileInput('slm-visual-camera');bindVisualFileInput('slm-visual-gallery');''',
'''root.querySelectorAll('[data-act="visual-search-camera"]').forEach(function(e){e.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}launchVisualInput('slm-visual-camera');};});root.querySelectorAll('[data-act="visual-search-gallery"],[data-act="visual-search-retry"]').forEach(function(e){e.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}launchVisualInput('slm-visual-gallery');};});bindVisualFileInput('slm-visual-camera');bindVisualFileInput('slm-visual-gallery');''',
"photo bindings")

m=one(m,
'''root.querySelectorAll('[data-act="search-products"]').forEach(function(e){e.onclick=function(){merchantReturnScroll=null;state.query=val('slm-product-search').trim();state.page=1;resetProductResults(state.view);render();loadProducts(state.view==='stock',true);};});''',
'''root.querySelectorAll('[data-act="search-products"]').forEach(function(e){e.onclick=function(ev){if(ev)ev.preventDefault();executeProductSearch();};});''',
"search button")

m=one(m,
'''  s.oninput=function(){
    var input=this,viewAtType=state.view;
    clearTimeout(window.__slmProductSearchTimer);
    window.__slmProductSearchTimer=setTimeout(function(){
      if(state.view!==viewAtType)return;
      merchantReturnScroll=null;state.query=String(input.value||'').trim();state.page=1;resetProductResults(state.view);
      loadProducts(state.view==='stock',true);
    },220);
  };
  s.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();clearTimeout(window.__slmProductSearchTimer);document.querySelector('[data-act="search-products"]').click();}};''',
'''  s.oninput=function(){state.query=String(this.value||'');};
  s.onsearch=function(){executeProductSearch();};
  s.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();executeProductSearch();}};''',
"text handlers")

marker="/* 1.1.67 unified text + camera + gallery Merchant search */"
idx=c.find(marker)
if idx < 0: raise SystemExit("1.1.67 CSS block missing")
c=c[:idx].rstrip()+"\n"

c=c.replace(
'''body.slb-merchant .slm-search-input-wrap>input[type="search"]{width:100%;padding-right:50px!important}
body.slb-merchant .slm-search .slm-visual-trigger{position:absolute;right:4px;top:4px;width:42px;height:42px;border:0;border-radius:11px;background:#f2f2f3;color:#111;font-size:20px;display:grid;place-items:center;padding:0;z-index:2}
body.slb-merchant .slm-search .slm-visual-trigger:active{transform:scale(.97)}''',
'''body.slb-merchant .slm-search-input-wrap>input[type="search"]{width:100%;padding-right:96px!important}
body.slb-merchant .slm-search .slm-search-icon{position:absolute;top:4px;width:40px;height:42px;border:0;border-radius:10px;background:transparent;color:#111;font-size:19px;display:grid;place-items:center;padding:0;z-index:2}
body.slb-merchant .slm-search .slm-camera-trigger{right:45px}
body.slb-merchant .slm-search .slm-gallery-trigger{right:4px}
body.slb-merchant .slm-search .slm-search-icon:active{background:#f2f2f3;transform:scale(.97)}''')

c += '''
/* 1.1.68 Chrome-style unified Merchant search */
body.slb-merchant .slm-search-input-wrap{background:#fff;border-radius:14px}
body.slb-merchant .slm-search-input-wrap>input[type="search"]{background:#fff;color:#111}
body.slb-merchant .slm-search-input-wrap>input[type="search"]::placeholder{color:#777;opacity:1}
body.slb-merchant .slm-search-input-wrap:focus-within>input[type="search"]{border-color:var(--sl-red)!important;box-shadow:0 0 0 1px var(--sl-red)}
body.slb-merchant .slm-search .slm-search-icon{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
'''

php.write_text(p,encoding="utf-8")
js.write_text(m,encoding="utf-8")
css.write_text(c,encoding="utf-8")

if customer.read_bytes()!=customer_before:
    raise SystemExit("customer.js unexpectedly changed")
for token in (
    "Version: 1.1.68",
    "data-act=\"visual-search-camera\"",
    "data-act=\"visual-search-gallery\"",
    "capture=\"environment\"",
    "function executeProductSearch()",
):
    if token not in (p+m): raise SystemExit(f"missing {token}")
for forbidden in ("photoSearchSheet","openPhotoSearchSheet","PHOTO SEARCH","window.__slmProductSearchTimer"):
    if forbidden in m: raise SystemExit(f"obsolete token remains: {forbidden}")

print("Bridge 1.1.68 Chrome-style unified search patch applied")
