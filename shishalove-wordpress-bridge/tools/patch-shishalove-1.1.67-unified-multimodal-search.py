#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit("usage: patch-shishalove-1.1.67-unified-multimodal-search.py <plugin-dir>")

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

p=one(p,"Version: 1.1.66","Version: 1.1.67","plugin version")
p=one(p,"define('SLB_VERSION', '1.1.66');","define('SLB_VERSION', '1.1.67');","version constant")

m=one(m,
"var state={view:'products',bootstrap:null,query:'',mainCategoryId:0,contextKind:'',contextId:0,categoryId:0,brandId:0,filterMode:'all',stockStatus:'all',sortBy:'date',sortOrder:'DESC',page:1,per:20,productsByView:{products:null,stock:null},searchPools:{products:null,stock:null},orders:null,orderDetail:null,menuOpen:false,editor:null,quickEdit:null,visualSearch:null,selectedCats:[],catSearch:''};",
"var state={view:'products',bootstrap:null,query:'',mainCategoryId:0,contextKind:'',contextId:0,categoryId:0,brandId:0,filterMode:'all',stockStatus:'all',sortBy:'date',sortOrder:'DESC',page:1,per:20,productsByView:{products:null,stock:null},searchPools:{products:null,stock:null},orders:null,orderDetail:null,menuOpen:false,editor:null,quickEdit:null,visualSearch:null,photoSearchOpen:false,selectedCats:[],catSearch:''};",
"state")

m=one(m,
"function shell(body){return '<div class=\"slm-app\">'+top()+body+bottom()+merchantMenu()+orderPanel()+editorPanel()+quickEditPanel()+visualSearchPanel()+'</div>';}",
"function shell(body){return '<div class=\"slm-app\">'+top()+body+bottom()+merchantMenu()+orderPanel()+editorPanel()+quickEditPanel()+visualSearchPanel()+photoSearchSheet()+'</div>';}",
"shell")

m=one(m,
"<button type=\"button\" class=\"slm-visual-trigger\" data-act=\"visual-search-pick\" aria-label=\"Search by product photo\" title=\"Search by product photo\">📷</button><input id=\"slm-visual-file\" class=\"slm-visual-file\" type=\"file\" accept=\"image/*\" aria-hidden=\"true\" tabindex=\"-1\">",
"<button type=\"button\" class=\"slm-visual-trigger\" data-act=\"visual-search-pick\" aria-label=\"Photo search\" title=\"Photo search\">📷</button><input id=\"slm-visual-camera\" class=\"slm-visual-file\" type=\"file\" accept=\"image/*\" capture=\"environment\" aria-hidden=\"true\" tabindex=\"-1\"><input id=\"slm-visual-gallery\" class=\"slm-visual-file\" type=\"file\" accept=\"image/*\" aria-hidden=\"true\" tabindex=\"-1\">",
"visual inputs")

helper=r'''function photoSearchSheet(){
  if(!state.photoSearchOpen)return '';
  return '<div class="slm-photo-backdrop" data-act="photo-search-cancel"><section class="slm-photo-sheet" role="dialog" aria-modal="true" aria-label="Photo Search" onclick="event.stopPropagation()"><div class="slm-photo-title">PHOTO SEARCH</div><button type="button" data-act="photo-search-camera"><span>📷</span><strong>TAKE PHOTO</strong></button><button type="button" data-act="photo-search-gallery"><span>🖼</span><strong>CHOOSE PHOTO</strong></button><button type="button" class="slm-photo-cancel" data-act="photo-search-cancel">CANCEL</button></section></div>';
}
function syncProductSearchDraft(){var s=document.getElementById('slm-product-search');if(s)state.query=String(s.value||'');}
function openPhotoSearchSheet(){syncProductSearchDraft();state.photoSearchOpen=true;render();restoreMerchantScroll(false);}
function dismissPhotoSearchSheet(){state.photoSearchOpen=false;var b=document.querySelector('.slm-photo-backdrop');if(b)b.remove();}
function launchVisualInput(id){var f=document.getElementById(id);dismissPhotoSearchSheet();if(f){f.value='';f.click();}}
function bindVisualFileInput(id){var f=document.getElementById(id);if(f)f.onchange=function(){var file=this.files&&this.files[0];if(file)startVisualSearch(file);};}
'''
m=one(m,"function visualSearchPanel(){\n",helper+"function visualSearchPanel(){\n","photo sheet helpers")

m=one(m,
"""root.querySelectorAll('[data-act="visual-search-pick"],[data-act="visual-search-retry"]').forEach(function(e){e.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}var f=document.getElementById('slm-visual-file');if(f){f.value='';f.click();}};});var vf=document.getElementById('slm-visual-file');if(vf)vf.onchange=function(){var file=this.files&&this.files[0];if(file)startVisualSearch(file);};""",
"""root.querySelectorAll('[data-act="visual-search-pick"],[data-act="visual-search-retry"]').forEach(function(e){e.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}openPhotoSearchSheet();};});root.querySelectorAll('[data-act="photo-search-cancel"]').forEach(function(e){e.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}dismissPhotoSearchSheet();};});root.querySelectorAll('[data-act="photo-search-camera"]').forEach(function(e){e.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}launchVisualInput('slm-visual-camera');};});root.querySelectorAll('[data-act="photo-search-gallery"]').forEach(function(e){e.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}launchVisualInput('slm-visual-gallery');};});bindVisualFileInput('slm-visual-camera');bindVisualFileInput('slm-visual-gallery');""",
"visual picker bindings")

c += r'''
/* 1.1.67 unified text + camera + gallery Merchant search */
body.slb-merchant .slm-photo-backdrop{position:fixed;z-index:260;inset:0;background:rgba(0,0,0,.34);display:flex;align-items:flex-end;justify-content:center;padding:14px calc(14px + var(--safe-right)) calc(14px + var(--safe-bottom)) calc(14px + var(--safe-left));box-sizing:border-box}
body.slb-merchant .slm-photo-sheet{width:min(100%,470px);background:#fff;border-radius:20px;padding:14px;box-shadow:0 20px 60px rgba(0,0,0,.28);display:grid;gap:8px}
body.slb-merchant .slm-photo-title{padding:5px 6px 9px;font-size:12px;font-weight:900;letter-spacing:.07em;color:#777}
body.slb-merchant .slm-photo-sheet button{min-height:54px;border:0;border-radius:13px;background:#f4f4f5;color:#111;display:flex;align-items:center;justify-content:flex-start;gap:12px;padding:0 16px;font-size:14px;text-align:left}
body.slb-merchant .slm-photo-sheet button span{font-size:21px;width:26px;text-align:center}
body.slb-merchant .slm-photo-sheet button strong{font-weight:900}
body.slb-merchant .slm-photo-sheet .slm-photo-cancel{justify-content:center;background:#fff;border:1px solid #e1e1e3;margin-top:2px;font-weight:900;text-align:center}
body.slb-merchant .slm-photo-sheet button:active{transform:scale(.99)}
@media(min-width:700px){body.slb-merchant .slm-photo-backdrop{align-items:center}}
'''

php.write_text(p,encoding="utf-8")
js.write_text(m,encoding="utf-8")
css.write_text(c,encoding="utf-8")

if customer.read_bytes()!=customer_before:
    raise SystemExit("customer.js unexpectedly changed")
for marker in (
    'type="search" enterkeyhint="search" placeholder="Search product name or SKU"',
    'capture="environment"',
    'PHOTO SEARCH',
    'TAKE PHOTO',
    'CHOOSE PHOTO',
    "apiForm('merchant/visual-search'",
):
    if marker not in m: raise SystemExit(f"missing {marker}")

print("Bridge 1.1.67 unified multimodal search patch applied")
