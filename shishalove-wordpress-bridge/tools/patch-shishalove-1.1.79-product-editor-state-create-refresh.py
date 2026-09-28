#!/usr/bin/env python3
from pathlib import Path
import re
import sys

if len(sys.argv) != 2:
    raise SystemExit("usage: patch-shishalove-1.1.79-product-editor-state-create-refresh.py <plugin-dir>")

root = Path(sys.argv[1])
php = root / "shishalove-app-bridge.php"
merchant = root / "assets" / "merchant.js"
customer = root / "assets" / "customer.js"
css = root / "assets" / "bridge.css"

for p in (php, merchant, customer, css):
    if not p.exists():
        raise SystemExit(f"missing {p}")

p = php.read_text(encoding="utf-8")
m = merchant.read_text(encoding="utf-8")
customer_before = customer.read_bytes()
css_before = css.read_bytes()

# Exact forward-only baseline. 1.1.78 is the current production line at the
# repository head this patch was authored against.
if p.count("Version: 1.1.78") != 1:
    raise SystemExit("expected exact Bridge 1.1.78 baseline")
if "Version: 1.1.79" in p:
    raise SystemExit("1.1.79 already applied")

if "merchantSearchRequest" not in m:
    raise SystemExit("current Merchant request-generation guard missing")
if "date_created" not in (p + m):
    raise SystemExit("recent-first product ordering lock missing")
if "function toggleCat(" not in m or "function renderEditorOnly(" not in m or "function saveProduct(" not in m:
    raise SystemExit("current product editor anchors missing")

p = p.replace("Version: 1.1.78", "Version: 1.1.79", 1)
if "define('SLB_VERSION', '1.1.78');" in p:
    p = p.replace("define('SLB_VERSION', '1.1.78');", "define('SLB_VERSION', '1.1.79');", 1)
elif 'define("SLB_VERSION", "1.1.78");' in p:
    p = p.replace('define("SLB_VERSION", "1.1.78");', 'define("SLB_VERSION", "1.1.79");', 1)
else:
    raise SystemExit("SLB_VERSION 1.1.78 constant missing")

# ---------------------------------------------------------------------------
# Product-list request generation.
# Existing exact-text search already has merchantSearchRequest. Add a
# per-view catalog generation so a pre-CREATE Products/Stock response can
# never overwrite the optimistic newly-created product.
# ---------------------------------------------------------------------------
if "var merchantCatalogRequest=" not in m:
    m = m.replace(
        "var merchantSearchRequest=0;",
        "var merchantSearchRequest=0;\n"
        "var merchantCatalogRequest={products:0,stock:0};\n"
        "function invalidateMerchantCatalogRequests(){"
        "merchantSearchRequest++;"
        "merchantCatalogRequest.products++;"
        "merchantCatalogRequest.stock++;"
        "}",
        1,
    )

load_products = r"""function loadProducts(stock,force){
  var name=stock?'stock':'products',seq=++merchantCatalogRequest[name],key=productCacheKey(stock),cached=cget(key,0);
  if(String(state.query||'').trim()!==''){loadExactSearch(stock,force);return;}
  state.searchPools[name]=null;
  if(cached&&!force){
    state.productsByView[name]=cached;
    if(state.view===name){render();restoreMerchantScroll(false);}
  }
  var url=buildProductUrl(stock,state.page,state.per)+(force?'&_slm_fresh='+Date.now():'');
  api(url,{cache:'no-store'}).then(function(d){
    if(seq!==merchantCatalogRequest[name])return;
    state.productsByView[name]=d;
    cset(key,d);
    if(state.view===name){render();restoreMerchantScroll(true);}
  }).catch(function(){
    if(seq!==merchantCatalogRequest[name])return;
    if(!state.productsByView[name]){
      state.productsByView[name]={items:[],page:1,per_page:state.per,total:0,pages:1};
      if(state.view===name){render();restoreMerchantScroll(true);}
    }else{
      restoreMerchantScroll(true);
    }
  });
}"""

m, n = re.subn(
    r"function loadProducts\(stock,force\)\{.*?\n\}(?=\nfunction ordersKey\(\))",
    load_products,
    m,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit("loadProducts replacement failed")

# ---------------------------------------------------------------------------
# One authoritative editor draft.
# ---------------------------------------------------------------------------
editor_helpers = r"""
function syncEditorCategoryDraft(){
  if(!state.editor)return;
  var ids=state.selectedCats.slice().map(Number).filter(function(id){return id>0;});
  state.editor.category_ids=ids;
  var all=(categoryData().all||[]),byId={};
  all.forEach(function(c){byId[Number(c.id)]=c;});
  state.editor.categories=ids.map(function(id){var c=byId[id];return c?{id:Number(c.id),name:c.name,slug:c.slug||''}:{id:id};});
  state.editor._draftDirty=true;
}
function syncEditorDraftFromDom(markDirty){
  if(!state.editor)return;
  var map={
    'slm-name':'name',
    'slm-sku':'sku',
    'slm-status':'status',
    'slm-visibility':'visibility',
    'slm-catalog':'catalog_visibility',
    'slm-price':'regular_price',
    'slm-sale':'sale_price',
    'slm-stock':'stock_status',
    'slm-stock-qty':'stock_quantity',
    'slm-desc':'short_description',
    'slm-description':'description',
    'slm-tax-status':'tax_status',
    'slm-tax-class':'tax_class',
    'slm-points-earned':'points_earned',
    'slm-max-points-discount':'max_points_discount',
    'slm-youtube-video':'youtube_video'
  };
  Object.keys(map).forEach(function(id){
    var e=document.getElementById(id);
    if(e)state.editor[map[id]]=e.value;
  });
  var ms=document.getElementById('slm-manage-stock');
  if(ms)state.editor.manage_stock=!!ms.checked;
  var brandIds=[];
  root.querySelectorAll('[data-brand-check]:checked').forEach(function(e){
    var id=Number(e.dataset.brandCheck)||0;
    if(id)brandIds.push(id);
  });
  if(root.querySelector('[data-brand-check]'))state.editor.brand_ids=brandIds;
  state.editor.category_ids=state.selectedCats.slice().map(Number).filter(function(id){return id>0;});
  if(markDirty!==false)state.editor._draftDirty=true;
}
function bindEditorDraftControls(){
  if(!state.editor)return;
  ['slm-name','slm-sku','slm-status','slm-visibility','slm-catalog','slm-price','slm-sale','slm-stock','slm-stock-qty','slm-desc','slm-description','slm-tax-status','slm-tax-class','slm-points-earned','slm-max-points-discount','slm-youtube-video'].forEach(function(id){
    var e=document.getElementById(id);
    if(!e)return;
    var evt=(e.tagName==='SELECT')?'change':'input';
    e.addEventListener(evt,function(){syncEditorDraftFromDom(true);});
  });
  var ms=document.getElementById('slm-manage-stock');
  if(ms)ms.addEventListener('change',function(){syncEditorDraftFromDom(true);});
  root.querySelectorAll('[data-brand-check]').forEach(function(e){
    e.addEventListener('change',function(){syncEditorDraftFromDom(true);});
  });
}
function updateCategorySelectionDom(id){
  id=Number(id);
  var on=state.selectedCats.indexOf(id)>=0;
  root.querySelectorAll('[data-cat-toggle="'+id+'"]').forEach(function(e){e.classList.toggle('sel',on);});
  root.querySelectorAll('[data-cat-check="'+id+'"]').forEach(function(e){e.checked=on;});
}
function bindCategoryControls(){
  root.querySelectorAll('[data-cat-toggle]').forEach(function(e){
    e.onclick=function(){toggleCat(this.dataset.catToggle);};
  });
  root.querySelectorAll('[data-cat-check]').forEach(function(e){
    e.onchange=function(){toggleCat(this.dataset.catCheck);};
  });
  var cs=document.getElementById('slm-cat-search');
  if(cs)cs.oninput=function(){
    state.catSearch=this.value;
    clearTimeout(window.__slmCategorySearchTimer);
    var pos=typeof this.selectionStart==='number'?this.selectionStart:null;
    window.__slmCategorySearchTimer=setTimeout(function(){renderCategoryPickerOnly(pos);},120);
  };
}
function renderCategoryPickerOnly(focusPos){
  var old=document.querySelector('#slm-panel .slm-categories');
  if(!old)return;
  syncEditorDraftFromDom(false);
  var quick=old.querySelector('.slm-quick-scroll'),left=quick?quick.scrollLeft:0;
  var panel=document.getElementById('slm-panel'),panelTop=panel?panel.scrollTop:0;
  var tmp=document.createElement('div');
  tmp.innerHTML=categoryPicker();
  old.replaceWith(tmp.firstChild);
  bindCategoryControls();
  var nextQuick=document.querySelector('#slm-panel .slm-quick-scroll');
  if(nextQuick)nextQuick.scrollLeft=left;
  var nextPanel=document.getElementById('slm-panel');
  if(nextPanel)nextPanel.scrollTop=panelTop;
  var nextSearch=document.getElementById('slm-cat-search');
  if(nextSearch){
    try{nextSearch.focus({preventScroll:true});}catch(e){nextSearch.focus();}
    if(focusPos!=null&&nextSearch.setSelectionRange){try{nextSearch.setSelectionRange(focusPos,focusPos);}catch(e){}}
  }
}
"""

m = m.replace("function toggleCat(id){", editor_helpers + "\nfunction toggleCat(id){", 1)

m, n = re.subn(
    r"function toggleCat\(id\)\{.*?\}(?=\nfunction renderEditorOnly\(\))",
    """function toggleCat(id){
  syncEditorDraftFromDom(true);
  id=Number(id);
  var i=state.selectedCats.indexOf(id);
  if(i>=0)state.selectedCats.splice(i,1);else state.selectedCats.push(id);
  syncEditorCategoryDraft();
  updateCategorySelectionDom(id);
}""",
    m,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit("toggleCat replacement failed")

m, n = re.subn(
    r"function renderEditorOnly\(\)\{.*?\}(?=\nfunction saveProduct\(\))",
    """function renderEditorOnly(){
  var old=document.getElementById('slm-panel');
  if(!old)return;
  syncEditorDraftFromDom(false);
  var panelTop=old.scrollTop||0;
  var quick=old.querySelector('.slm-quick-scroll'),quickLeft=quick?quick.scrollLeft:0;
  var tmp=document.createElement('div');
  tmp.innerHTML=editorPanel();
  old.replaceWith(tmp.firstChild);
  bind();
  var next=document.getElementById('slm-panel');
  if(next)next.scrollTop=panelTop;
  var nextQuick=next&&next.querySelector('.slm-quick-scroll');
  if(nextQuick)nextQuick.scrollLeft=quickLeft;
}""",
    m,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit("renderEditorOnly replacement failed")

# Respect the draft manage_stock value instead of forcing the checkbox back on.
m = re.sub(
    r"var p=state\.editor,creating=!p\.id,busy=!!p\._mediaBusy,manage=[^;]+;",
    "var p=state.editor,creating=!p.id,busy=!!p._mediaBusy,manage=p.manage_stock!==false;",
    m,
    count=1,
)

# ---------------------------------------------------------------------------
# CREATE: optimistic insert + one authoritative page-1 reconciliation.
# UPDATE keeps the current existing behavior.
# ---------------------------------------------------------------------------
save_product = r"""function optimisticInsertCreatedProduct(saved){
  if(!saved||!saved.id)return;
  var current=state.productsByView.products||{items:[],page:1,per_page:state.per,total:0,pages:1};
  var items=(current.items||[]).filter(function(p){return Number(p.id)!==Number(saved.id);});
  items.unshift(saved);
  if(items.length>state.per)items=items.slice(0,state.per);
  var total=Math.max(items.length,Number(current.total||0)+1);
  var pages=Math.max(1,Math.ceil(total/state.per));
  var next={items:items,page:1,per_page:state.per,total:total,pages:pages};
  state.productsByView.products=next;
  cset(productCacheKey(false),next);
}
function saveProduct(){
  if(!state.editor||state.editor._mediaBusy)return;
  syncEditorDraftFromDom(false);
  var draft=state.editor,creating=!draft.id;
  var manage=draft.manage_stock!==false;
  var body={
    name:String(draft.name||''),
    sku:String(draft.sku||''),
    status:String(draft.status||'publish'),
    visibility:String(draft.visibility||'public'),
    catalog_visibility:String(draft.catalog_visibility||'visible'),
    regular_price:String(draft.regular_price==null?'':draft.regular_price),
    sale_price:String(draft.sale_price==null?'':draft.sale_price),
    stock_status:String(draft.stock_status||'instock'),
    manage_stock:manage,
    stock_quantity:manage?String(draft.stock_quantity==null?'':draft.stock_quantity):'',
    short_description:String(draft.short_description||''),
    category_ids:state.selectedCats.slice(),
    brand_ids:Array.isArray(draft.brand_ids)?draft.brand_ids.slice():[],
    ensure_artwork:true,
    image_id:Number(draft.image_id)||0,
    gallery_ids:Array.isArray(draft.gallery_ids)?draft.gallery_ids.map(Number).filter(function(id){return id>0;}):[]
  };
  if(Object.prototype.hasOwnProperty.call(draft,'description'))body.description=String(draft.description||'');
  var btn=document.querySelector('[data-act="save-product"]');
  if(btn){btn.disabled=true;btn.textContent='SAVING…';}
  var path=draft.id?'merchant/product/'+draft.id:'merchant/product';
  api(path,{method:'POST',body:JSON.stringify(body)}).then(function(saved){
    invalidateMerchantCatalogRequests();
    cdelPrefix('slm-products-');
    state.searchPools={products:null,stock:null};
    state.productsByView.stock=null;
    state.editor=null;
    state.catSearch='';
    if(creating){
      state.view='products';
      state.page=1;
      optimisticInsertCreatedProduct(saved);
      render();
      restoreMerchantScroll(false);
      setTimeout(function(){loadProducts(false,true);},0);
    }else{
      state.productsByView.products=null;
      render();
      restoreMerchantScroll(false);
      loadProducts(state.view==='stock',true);
    }
    if(saved&&saved.permalink){try{navigator.clipboard&&navigator.clipboard.writeText(saved.permalink);}catch(e){}}
  }).catch(function(){
    if(btn){btn.disabled=false;btn.textContent=state.editor&&state.editor.id?'UPDATE':'CREATE';}
    alert('Could not save product.');
  });
}"""

m, n = re.subn(
    r"function saveProduct\(\)\{.*?\n\}(?=\nfunction trashProduct\(\))",
    save_product,
    m,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit("saveProduct replacement failed")

# Category toggles are now bound through bindCategoryControls(), preventing a
# full editor rebuild on each selection.
old_cat_bind = "root.querySelectorAll('[data-cat-toggle]').forEach(function(e){e.onclick=function(){toggleCat(this.dataset.catToggle);};});root.querySelectorAll('[data-cat-check]').forEach(function(e){e.onchange=function(){toggleCat(this.dataset.catCheck);};});"
if old_cat_bind in m:
    m = m.replace(old_cat_bind, "", 1)

# Replace the old category-search -> full editor rerender binding with the new
# draft/category-only binders. Keep any other existing editor bindings intact.
m, n = re.subn(
    r"var cs=document\.getElementById\('slm-cat-search'\);if\(cs\)cs\.oninput=function\(\)\{state\.catSearch=this\.value;clearTimeout\(cs\._t\);cs\._t=setTimeout\(renderEditorOnly,120\);\};",
    "bindEditorDraftControls();bindCategoryControls();",
    m,
    count=1,
)
if n != 1:
    # Newer 1.1.78 builds may already have a different category-search timer.
    # In that case inject the authoritative binders immediately before the
    # final normalizeBrandLockups() call in bind().
    marker = "normalizeBrandLockups();}"
    if m.count(marker) != 1:
        raise SystemExit("bind() category-search anchor missing")
    m = m.replace(marker, "bindEditorDraftControls();bindCategoryControls();" + marker, 1)

# Do not force manage-stock back to ON inside bind().
m = re.sub(
    r"var ms=document\.getElementById\('slm-manage-stock'\);if\(ms\)\{.*?\};(?=var nm=document\.getElementById\('slm-name'\))",
    """var ms=document.getElementById('slm-manage-stock');if(ms){ms.onchange=function(){if(state.editor)state.editor.manage_stock=!!this.checked;var q=document.getElementById('slm-stock-qty-wrap');if(q)q.style.display=this.checked?'block':'none';syncEditorDraftFromDom(true);};}""",
    m,
    count=1,
    flags=re.S,
)

# Existing-product async hydration must not overwrite edits made against the
# cached editor while the full product request is in flight.
m = re.sub(
    r"api\('merchant/product/'\+id\)\.then\(function\(p\)\{state\.editor=p;",
    "api('merchant/product/'+id).then(function(p){if(!state.editor||Number(state.editor.id)!==Number(id)||state.editor._draftDirty)return;state.editor=p;",
    m,
    count=1,
)

# Release gates: no design/backend/Customer/CSS changes.
required = [
    "Version: 1.1.79",
    "syncEditorDraftFromDom",
    "renderCategoryPickerOnly",
    "updateCategorySelectionDom",
    "optimisticInsertCreatedProduct",
    "invalidateMerchantCatalogRequests",
    "merchantCatalogRequest",
    "date_created",
]
for token in required:
    if token not in (p + m):
        raise SystemExit("missing 1.1.79 editor-state token: " + token)

for forbidden in [
    "function toggleCat(id){id=Number(id);var i=state.selectedCats.indexOf(id);if(i>=0)state.selectedCats.splice(i,1);else state.selectedCats.push(id);renderEditorOnly();}",
    "cs._t=setTimeout(renderEditorOnly,120)",
]:
    if forbidden in m:
        raise SystemExit("destructive editor rerender remains: " + forbidden)

if customer.read_bytes() != customer_before:
    raise SystemExit("customer.js unexpectedly changed")
if css.read_bytes() != css_before:
    raise SystemExit("bridge.css unexpectedly changed")

php.write_text(p, encoding="utf-8")
merchant.write_text(m, encoding="utf-8")

print("Bridge 1.1.79 product editor draft + optimistic create refresh fix applied")
