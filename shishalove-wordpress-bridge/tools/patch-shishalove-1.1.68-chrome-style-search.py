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
for f in (php,js,css,customer):
    if not f.exists():
        raise SystemExit(f"missing {f}")

p=php.read_text(encoding="utf-8")
m=js.read_text(encoding="utf-8")
c=css.read_text(encoding="utf-8")
customer_before=customer.read_bytes()

def one(text,old,new,label):
    n=text.count(old)
    if n != 1:
        raise SystemExit(f"{label}: expected 1 occurrence, found {n}")
    return text.replace(old,new,1)

if p.count("Version: 1.1.67") != 1 or p.count("define('SLB_VERSION', '1.1.67');") != 1:
    raise SystemExit("expected exact Bridge 1.1.67 baseline")

p=one(p,"Version: 1.1.67","Version: 1.1.68","plugin version")
p=one(p,"define('SLB_VERSION', '1.1.67');","define('SLB_VERSION', '1.1.68');","version constant")

m=one(
    m,
    "var state={view:'products',bootstrap:null,query:'',mainCategoryId:0,contextKind:'',contextId:0,categoryId:0,brandId:0,filterMode:'all',stockStatus:'all',sortBy:'date',sortOrder:'DESC',page:1,per:20,productsByView:{products:null,stock:null},searchPools:{products:null,stock:null},orders:null,orderDetail:null,menuOpen:false,editor:null,quickEdit:null,visualSearch:null,photoSearchOpen:false,selectedCats:[],catSearch:''};",
    "var state={view:'products',bootstrap:null,query:'',queryDraft:'',mainCategoryId:0,contextKind:'',contextId:0,categoryId:0,brandId:0,filterMode:'all',stockStatus:'all',sortBy:'date',sortOrder:'DESC',page:1,per:20,productsByView:{products:null,stock:null},searchPools:{products:null,stock:null},orders:null,orderDetail:null,menuOpen:false,editor:null,quickEdit:null,visualSearch:null,selectedCats:[],catSearch:''};",
    "state query draft"
)

m=one(
    m,
    """  return '<main class="slm-page"><div class="slm-head"><div><h1>'+(stock?'Stock':'Products')+'</h1><div class="slm-muted">'+(data?total+' matching products':'Products')+'</div></div>'+(stock?'':'<button class="add" data-act="new-product">+ Add</button>')+'</div><div class="slm-search"><div class="slm-search-input-wrap"><input id="slm-product-search" type="search" enterkeyhint="search" placeholder="Search product name or SKU" value="'+esc(state.query)+'"><button type="button" class="slm-visual-trigger" data-act="visual-search-pick" aria-label="Photo search" title="Photo search">📷</button><input id="slm-visual-camera" class="slm-visual-file" type="file" accept="image/*" capture="environment" aria-hidden="true" tabindex="-1"><input id="slm-visual-gallery" class="slm-visual-file" type="file" accept="image/*" aria-hidden="true" tabindex="-1"></div><button data-act="search-products">Search</button></div>'+filters+'<section id="slm-product-list">'+(data?productRows(items):ghostRows(6))+'</section><div id="slm-product-pager">'+pagerMarkup(data)+'</div></main>';""",
    """  return '<main class="slm-page"><div class="slm-head"><div><h1>'+(stock?'Stock':'Products')+'</h1><div class="slm-muted">'+(data?total+' matching products':'Products')+'</div></div>'+(stock?'':'<button class="add" data-act="new-product">+ Add</button>')+'</div><div class="slm-search"><div class="slm-search-input-wrap"><input id="slm-product-search" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" placeholder="Search product name or SKU" value="'+esc(state.queryDraft||state.query)+'"><button type="button" class="slm-visual-trigger" data-act="visual-search-pick" aria-label="Visual Search" title="Visual Search"><svg class="slm-lens-icon" viewBox="0 0 28 28" aria-hidden="true" focusable="false"><path d="M8.1 4.5H6.4a1.9 1.9 0 0 0-1.9 1.9v1.7M19.9 4.5h1.7a1.9 1.9 0 0 1 1.9 1.9v1.7M23.5 19.9v1.7a1.9 1.9 0 0 1-1.9 1.9h-1.7M8.1 23.5H6.4a1.9 1.9 0 0 1-1.9-1.9v-1.7"/><circle cx="14" cy="14" r="4.4"/><circle class="slm-lens-dot" cx="21.1" cy="7" r="1.45"/></svg></button><input id="slm-visual-camera" class="slm-visual-file" type="file" accept="image/*" capture="environment" aria-hidden="true" tabindex="-1"><input id="slm-visual-gallery" class="slm-visual-file" type="file" accept="image/*" aria-hidden="true" tabindex="-1"></div></div>'+filters+'<section id="slm-product-list">'+(data?productRows(items):ghostRows(6))+'</section><div id="slm-product-pager">'+pagerMarkup(data)+'</div></main>';""",
    "search markup"
)

m=one(
    m,
    "function shell(body){return '<div class=\"slm-app\">'+top()+body+bottom()+merchantMenu()+orderPanel()+editorPanel()+quickEditPanel()+visualSearchPanel()+photoSearchSheet()+'</div>';}",
    "function shell(body){return '<div class=\"slm-app\">'+top()+body+bottom()+merchantMenu()+orderPanel()+editorPanel()+quickEditPanel()+visualSearchPanel()+'</div>';}",
    "shell"
)

start=m.index("function photoSearchSheet(){")
end=m.index("function visualSearchPanel(){",start)
m=m[:start]+r'''function visualChooserCameraIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8.2 6.5 9.4 4.8h5.2l1.2 1.7h2.6a2.1 2.1 0 0 1 2.1 2.1v8.6a2.1 2.1 0 0 1-2.1 2.1H5.6a2.1 2.1 0 0 1-2.1-2.1V8.6a2.1 2.1 0 0 1 2.1-2.1h2.6Z"/><circle cx="12" cy="12.9" r="3.2"/></svg>';}
function visualChooserGalleryIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="4.2" width="17" height="15.6" rx="2.2"/><circle cx="8.2" cy="9" r="1.5"/><path d="m5.4 17 4.2-4 3 2.7 2.3-2 3.7 3.3"/></svg>';}
function dismissPhotoSearchSheet(){var b=document.querySelector('.slm-photo-backdrop');if(b)b.remove();}
function openPhotoSearchSheet(){
  dismissPhotoSearchSheet();
  var host=document.querySelector('.slm-app')||document.body,wrap=document.createElement('div');
  wrap.className='slm-photo-backdrop';
  wrap.innerHTML='<section class="slm-photo-sheet" role="dialog" aria-modal="true" aria-label="Visual Search"><div class="slm-photo-title">VISUAL SEARCH</div><button type="button" data-act="photo-search-camera">'+visualChooserCameraIcon()+'<strong>Take Photo</strong></button><button type="button" data-act="photo-search-gallery">'+visualChooserGalleryIcon()+'<strong>Choose Photo</strong></button><button type="button" class="slm-photo-cancel">Cancel</button></section>';
  host.appendChild(wrap);
  wrap.onclick=function(ev){if(ev.target===wrap)dismissPhotoSearchSheet();};
  var cam=wrap.querySelector('[data-act="photo-search-camera"]');if(cam)cam.onclick=function(ev){ev.preventDefault();ev.stopPropagation();launchVisualInput('slm-visual-camera');};
  var gal=wrap.querySelector('[data-act="photo-search-gallery"]');if(gal)gal.onclick=function(ev){ev.preventDefault();ev.stopPropagation();launchVisualInput('slm-visual-gallery');};
  var cancel=wrap.querySelector('.slm-photo-cancel');if(cancel)cancel.onclick=function(ev){ev.preventDefault();ev.stopPropagation();dismissPhotoSearchSheet();};
}
function launchVisualInput(id){var f=document.getElementById(id);dismissPhotoSearchSheet();if(f){f.value='';f.click();}}
function bindVisualFileInput(id){var f=document.getElementById(id);if(f)f.onchange=function(){var file=this.files&&this.files[0];if(file)startVisualSearch(file);};}
function submitProductTextSearch(){
  var input=document.getElementById('slm-product-search');
  state.queryDraft=String(input?input.value:state.queryDraft||'');
  var next=state.queryDraft.trim();
  if(next===String(state.query||'').trim())return;
  merchantReturnScroll=null;state.query=next;state.queryDraft=state.query;state.page=1;resetProductResults(state.view);loadProducts(state.view==='stock',true);
}
'''+m[end:]

m=one(
    m,
    """root.querySelectorAll('[data-act="visual-search-pick"],[data-act="visual-search-retry"]').forEach(function(e){e.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}openPhotoSearchSheet();};});root.querySelectorAll('[data-act="photo-search-cancel"]').forEach(function(e){e.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}dismissPhotoSearchSheet();};});root.querySelectorAll('[data-act="photo-search-camera"]').forEach(function(e){e.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}launchVisualInput('slm-visual-camera');};});root.querySelectorAll('[data-act="photo-search-gallery"]').forEach(function(e){e.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}launchVisualInput('slm-visual-gallery');};});bindVisualFileInput('slm-visual-camera');bindVisualFileInput('slm-visual-gallery');""",
    """root.querySelectorAll('[data-act="visual-search-pick"],[data-act="visual-search-retry"]').forEach(function(e){e.onclick=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}openPhotoSearchSheet();};});bindVisualFileInput('slm-visual-camera');bindVisualFileInput('slm-visual-gallery');""",
    "visual picker binding"
)

m=one(
    m,
    """root.querySelectorAll('[data-act="search-products"]').forEach(function(e){e.onclick=function(){merchantReturnScroll=null;state.query=val('slm-product-search').trim();state.page=1;resetProductResults(state.view);render();loadProducts(state.view==='stock',true);};});""",
    "",
    "black search handler"
)

m=one(
    m,
    """var s=document.getElementById('slm-product-search');if(s){
  s.oninput=function(){
    var input=this,viewAtType=state.view;
    clearTimeout(window.__slmProductSearchTimer);
    window.__slmProductSearchTimer=setTimeout(function(){
      if(state.view!==viewAtType)return;
      merchantReturnScroll=null;state.query=String(input.value||'').trim();state.page=1;resetProductResults(state.view);
      loadProducts(state.view==='stock',true);
    },220);
  };
  s.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();clearTimeout(window.__slmProductSearchTimer);document.querySelector('[data-act="search-products"]').click();}};
}""",
    """var s=document.getElementById('slm-product-search');if(s){
  s.oninput=function(){state.queryDraft=String(this.value||'');};
  s.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();submitProductTextSearch();}};
  s.onsearch=function(){state.queryDraft=String(this.value||'');submitProductTextSearch();};
}""",
    "text handlers"
)

marker="/* 1.1.67 unified text + camera + gallery Merchant search */"
idx=c.find(marker)
if idx < 0:
    raise SystemExit("1.1.67 CSS block missing")
c=c[:idx].rstrip()+"\n"

c += r'''
/* 1.1.68 — Chrome-style unified Merchant search pill. */
body.slb-merchant .slm-page .slm-search{display:block!important;width:100%!important;margin:14px 0 16px!important;overflow:visible!important}
body.slb-merchant .slm-page .slm-search-input-wrap{position:relative!important;display:flex!important;align-items:center!important;width:100%!important;height:56px!important;min-width:0!important;background:#f7f7f8!important;border:1px solid #d9d9dd!important;border-radius:28px!important;box-sizing:border-box!important;overflow:hidden!important;transition:border-color .15s ease,box-shadow .15s ease,background-color .15s ease!important}
body.slb-merchant .slm-page .slm-search-input-wrap:focus-within{background:#fff!important;border-color:#c8c8cd!important;box-shadow:0 0 0 3px rgba(179,17,39,.055)!important}
body.slb-merchant .slm-page .slm-search-input-wrap>input[type="search"]{position:relative!important;z-index:1!important;flex:1 1 auto!important;width:100%!important;min-width:0!important;height:54px!important;margin:0!important;padding:0 66px 0 18px!important;border:0!important;border-radius:28px!important;outline:0!important;background:transparent!important;color:#151515!important;font-size:15.5px!important;font-weight:500!important;line-height:54px!important;box-shadow:none!important;-webkit-appearance:none!important;appearance:none!important}
body.slb-merchant .slm-page .slm-search-input-wrap>input[type="search"]::placeholder{color:#747478!important;opacity:1!important}
body.slb-merchant .slm-page .slm-search-input-wrap>input[type="search"]::-webkit-search-cancel-button{-webkit-appearance:none!important}
body.slb-merchant .slm-page .slm-search .slm-visual-trigger{position:absolute!important;z-index:3!important;right:6px!important;top:5px!important;width:44px!important;min-width:44px!important;max-width:44px!important;height:44px!important;min-height:44px!important;padding:0!important;margin:0!important;border:0!important;border-radius:50%!important;background:transparent!important;color:#242426!important;display:grid!important;place-items:center!important;cursor:pointer!important;box-shadow:none!important}
body.slb-merchant .slm-page .slm-search .slm-visual-trigger:hover,body.slb-merchant .slm-page .slm-search .slm-visual-trigger:focus-visible{background:#ececef!important;outline:0!important}
body.slb-merchant .slm-page .slm-search .slm-visual-trigger:active{transform:scale(.96)!important;background:#e6e6e9!important}
body.slb-merchant .slm-lens-icon{width:27px!important;height:27px!important;display:block!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important}
body.slb-merchant .slm-lens-icon .slm-lens-dot{fill:var(--sl-red)!important;stroke:var(--sl-red)!important;stroke-width:0!important}
body.slb-merchant .slm-visual-file{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;left:-9999px!important}
/* compact Visual Search chooser; no emoji artwork */
body.slb-merchant .slm-photo-backdrop{position:fixed;z-index:260;inset:0;background:rgba(17,17,18,.28);display:flex;align-items:flex-end;justify-content:center;padding:14px calc(14px + var(--safe-right)) calc(14px + var(--safe-bottom)) calc(14px + var(--safe-left));box-sizing:border-box}
body.slb-merchant .slm-photo-sheet{width:min(100%,430px);background:#fff;border-radius:20px;padding:12px;box-shadow:0 22px 64px rgba(0,0,0,.22);display:grid;gap:7px;box-sizing:border-box}
body.slb-merchant .slm-photo-title{padding:7px 9px 8px;font-size:12px;font-weight:900;letter-spacing:.075em;color:#77777c}
body.slb-merchant .slm-photo-sheet button{width:100%;min-height:54px;border:0;border-radius:13px;background:#f5f5f6;color:#151515;display:flex;align-items:center;justify-content:flex-start;gap:13px;padding:0 15px;font-size:15px;text-align:left;box-sizing:border-box}
body.slb-merchant .slm-photo-sheet button svg{width:24px;height:24px;flex:0 0 24px;fill:none;stroke:#202023;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
body.slb-merchant .slm-photo-sheet button strong{font-weight:800}
body.slb-merchant .slm-photo-sheet .slm-photo-cancel{justify-content:center;background:#fff;border:1px solid #e3e3e6;margin-top:2px;font-weight:800;text-align:center;color:#444448}
body.slb-merchant .slm-photo-sheet button:active{transform:scale(.99);background:#ededf0}
@media(min-width:700px){body.slb-merchant .slm-photo-backdrop{align-items:center}}
'''

php.write_text(p,encoding="utf-8")
js.write_text(m,encoding="utf-8")
css.write_text(c,encoding="utf-8")

if customer.read_bytes() != customer_before:
    raise SystemExit("customer.js unexpectedly changed")

for token in (
    "Version: 1.1.68",
    'placeholder="Search product name or SKU"',
    'class="slm-lens-icon"',
    'capture="environment"',
    'id="slm-visual-gallery"',
    "function submitProductTextSearch()",
    "Take Photo",
    "Choose Photo",
):
    if token not in p+m:
        raise SystemExit(f"missing token: {token}")

for forbidden in ('>📷<','>🖼<','data-act="search-products">Search</button>','window.__slmProductSearchTimer'):
    if forbidden in m:
        raise SystemExit(f"obsolete search UI remains: {forbidden}")

print("Bridge 1.1.68 Chrome-style search patch applied")
