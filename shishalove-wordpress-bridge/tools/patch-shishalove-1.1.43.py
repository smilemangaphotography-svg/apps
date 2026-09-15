#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.43.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.40.py'), str(root)])


def replace_func(text, name, replacement):
    marker = 'function ' + name + '('
    s = text.find(marker)
    if s < 0:
        raise SystemExit('missing function ' + name)
    m = re.search(r'\nfunction\s+[A-Za-z0-9_]+\(', text[s + 1:])
    if not m:
        raise SystemExit('next function missing after ' + name)
    e = s + 1 + m.start() + 1
    return text[:s] + replacement.rstrip() + '\n' + text[e:]


def once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 anchor, found {n}')
    return text.replace(old, new, 1)

p = root / 'assets/merchant.js'
t = p.read_text(encoding='utf-8')

# Release identity/cache bust. Customer remains exactly as 1.1.40.
t = once(t, "CFG.version='1.1.40';", "CFG.version='1.1.43';", 'merchant cfg')
t = once(t, "slbfix','1.1.40'", "slbfix','1.1.43'", 'merchant css bust')
t = once(t, 'Bridge 1.1.40', 'Bridge 1.1.43', 'merchant label')

# Keep the editor return position outside the general view state so switching tabs,
# searching, or filtering remains an explicit user action.
esc_anchor = "function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'})[c];});}"
if esc_anchor not in t:
    raise SystemExit('merchant esc anchor missing')
t = t.replace(esc_anchor, "var merchantReturnScroll=null;\n" + esc_anchor, 1)

# Products and Stock both get one explicit stock filter with exactly the requested
# choices: All / In stock / Out of stock.
t = replace_func(t, 'stockFilterMarkup', r'''function stockFilterMarkup(){
  return '<select id="slm-stock-filter" aria-label="Filter products by stock status" style="width:100%;min-height:48px;border:1px solid #ddd;border-radius:14px;background:#fff;padding:0 14px;font-size:16px;font-weight:700">'+
    '<option value="all"'+(state.stockStatus==='all'?' selected':'')+'>Filter · All</option>'+
    '<option value="instock"'+(state.stockStatus==='instock'?' selected':'')+'>Filter · In stock</option>'+
    '<option value="outofstock"'+(state.stockStatus==='outofstock'?' selected':'')+'>Filter · Out of stock</option>'+
  '</select>';
}''')

t = replace_func(t, 'productsBody', r'''function productsBody(stock){
  var data=currentProductData(stock),items=data&&data.items||[],total=data&&data.total||0;
  var filters='<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin:12px 0">'+categoryFilterMarkup()+stockFilterMarkup()+'</div>';
  return '<main class="slm-page"><div class="slm-head"><div><h1>'+(stock?'Stock':'Products')+'</h1><div class="slm-muted">'+(data?total+' matching products':'Products')+'</div></div>'+(stock?'':'<button class="add" data-act="new-product">+ Add</button>')+'</div><div class="slm-search"><input id="slm-product-search" placeholder="Search product name or SKU" value="'+esc(state.query)+'"><button data-act="search-products">Search</button></div>'+filters+(stock?'':'<div class="slm-filter-tabs"><button class="'+(!state.categoryId?'active':'')+'" data-filter-cat="0">All</button>'+topFilterTabs()+'</div>')+'<section id="slm-product-list">'+(data?productRows(items):ghostRows(6))+'</section>'+pagerMarkup(data)+'</main>';
}''')

# Stock filtering is a catalogue filter, not a Stock-tab-only behavior.
t = replace_func(t, 'buildProductUrl', r'''function buildProductUrl(stock,page,per){
  var url='merchant/products?page='+page+'&per_page='+per+'&search='+encodeURIComponent(state.query);
  if(state.categoryId)url+='&category_id='+state.categoryId;
  if(state.stockStatus!=='all')url+='&stock_status='+encodeURIComponent(state.stockStatus);
  return url;
}''')

# Preserve the scroll position of the exact search/filter/page the merchant was
# working on before opening an editor. The editor remains a full-screen overlay.
helper = r'''function currentMerchantScroll(){return Math.max(0,Number(window.scrollY||document.documentElement.scrollTop||document.body.scrollTop||0));}
function restoreMerchantScroll(clear){
  if(merchantReturnScroll==null)return;
  var y=Math.max(0,Number(merchantReturnScroll)||0);
  setTimeout(function(){window.scrollTo(0,y);},0);
  if(clear)merchantReturnScroll=null;
}
'''
open_marker = 'function openEditor(id){'
pos = t.find(open_marker)
if pos < 0:
    raise SystemExit('merchant openEditor marker missing')
t = t[:pos] + helper + t[pos:]

t = replace_func(t, 'openEditor', r'''function openEditor(id){
  merchantReturnScroll=currentMerchantScroll();
  state.catSearch='';state.selectedCats=[];
  if(!id){state.editor={id:0,name:'',sku:'',status:'publish',visibility:'public',catalog_visibility:'visible',regular_price:'',sale_price:'',tax_status:'taxable',tax_class:'',points_earned:'',max_points_discount:'',manage_stock:false,stock_quantity:'',stock_status:'instock',short_description:'',description:'',categories:[],tags:[],brands:[],brand_ids:[],age_restricted:true,fullscreen_description:false,header_transparency:'inherit',product_layout:'inherit',youtube_video:'',permalink:'',image:'',image_id:0,gallery:[],gallery_ids:[]};render();return;}
  var cached=null,name=state.view==='stock'?'stock':'products',data=state.productsByView[name]||state.productsByView.products||state.productsByView.stock;
  if(data&&data.items)data.items.some(function(p){if(Number(p.id)===Number(id)){cached=p;return true;}return false;});
  state.editor=cached||{id:Number(id),name:'',status:'publish',visibility:'public',catalog_visibility:'visible',stock_status:'instock',categories:[],tags:[],brands:[],brand_ids:[],image:'',image_id:0,gallery:[],gallery_ids:[]};
  if(!Array.isArray(state.editor.gallery))state.editor.gallery=[];if(!Array.isArray(state.editor.gallery_ids))state.editor.gallery_ids=[];if(!Array.isArray(state.editor.tags))state.editor.tags=[];if(!Array.isArray(state.editor.brand_ids))state.editor.brand_ids=[];
  state.selectedCats=(state.editor.categories||[]).map(function(c){return Number(c.id);});render();
  api('merchant/product/'+id).then(function(p){state.editor=p;if(!Array.isArray(state.editor.gallery))state.editor.gallery=[];if(!Array.isArray(state.editor.gallery_ids))state.editor.gallery_ids=[];if(!Array.isArray(state.editor.tags))state.editor.tags=[];if(!Array.isArray(state.editor.brand_ids))state.editor.brand_ids=[];state.selectedCats=(p.categories||[]).map(function(c){return Number(c.id);});render();}).catch(function(){});
}''')

# Update/create no longer resets query, category, stock filter, page or tab.
# The active list stays painted while WooCommerce revalidates it in place.
t = replace_func(t, 'saveProduct', r'''function saveProduct(){
  if(!state.editor||state.editor._mediaBusy)return;
  var brandIds=[];root.querySelectorAll('[data-brand-check]:checked').forEach(function(e){brandIds.push(Number(e.dataset.brandCheck));});
  var ms=document.getElementById('slm-manage-stock'),manage=!!(ms&&ms.checked);
  var body={name:val('slm-name'),sku:val('slm-sku'),status:val('slm-status'),visibility:val('slm-visibility'),catalog_visibility:val('slm-catalog'),regular_price:val('slm-price'),sale_price:val('slm-sale'),stock_status:val('slm-stock'),manage_stock:manage,stock_quantity:manage?val('slm-stock-qty'):'',short_description:val('slm-desc'),category_ids:state.selectedCats.slice(),brand_ids:brandIds,ensure_artwork:true,image_id:Number(state.editor.image_id)||0,gallery_ids:Array.isArray(state.editor.gallery_ids)?state.editor.gallery_ids.map(Number).filter(function(id){return id>0;}):[]};
  var btn=document.querySelector('[data-act="save-product"]');if(btn){btn.disabled=true;btn.textContent='SAVING…';}
  var path=state.editor.id?'merchant/product/'+state.editor.id:'merchant/product';
  api(path,{method:'POST',body:JSON.stringify(body)}).then(function(saved){
    var stockView=state.view==='stock',activeName=stockView?'stock':'products',activeData=state.productsByView[activeName];
    cdelPrefix('slm-products-');state.searchPools={products:null,stock:null};state.productsByView={products:null,stock:null};state.productsByView[activeName]=activeData;
    state.editor=null;state.catSearch='';render();restoreMerchantScroll(false);loadProducts(stockView,true);
    if(saved&&saved.permalink){try{navigator.clipboard&&navigator.clipboard.writeText(saved.permalink);}catch(e){}}
  }).catch(function(){if(btn){btn.disabled=false;btn.textContent=state.editor&&state.editor.id?'UPDATE':'CREATE';}alert('Could not save product.');});
}''')

# Trash follows the same context-preserving rule: remove/revalidate the current
# filtered list instead of dumping the merchant back at All Products.
t = replace_func(t, 'trashProduct', r'''function trashProduct(){
  if(!state.editor||!state.editor.id||state.editor._mediaBusy)return;
  var id=Number(state.editor.id)||0,name=state.editor.name||'this product';
  if(!id||!window.confirm('Move "'+name+'" to Trash? You can restore it later from WordPress Trash.'))return;
  var btn=document.querySelector('[data-act="trash-product"]');if(btn){btn.disabled=true;btn.textContent='MOVING TO TRASH…';}
  api('merchant/product/'+id,{method:'DELETE'}).then(function(){
    var stockView=state.view==='stock',activeName=stockView?'stock':'products',activeData=state.productsByView[activeName];
    cdelPrefix('slm-products-');state.searchPools={products:null,stock:null};state.productsByView={products:null,stock:null};state.productsByView[activeName]=activeData;
    state.editor=null;state.catSearch='';render();restoreMerchantScroll(false);loadProducts(stockView,true);
  }).catch(function(){if(btn){btn.disabled=false;btn.textContent='TRASH PRODUCT';}alert('Could not move product to Trash.');});
}''')

# Final async revalidation restores the exact working scroll position, then clears
# the return marker. If the changed item no longer matches In/Out-of-stock filter,
# WooCommerce removes it from that same filtered result set.
t = replace_func(t, 'applySearchPool', r'''function applySearchPool(stock){
  var name=stock?'stock':'products',pool=state.searchPools[name],items=pool&&pool.items||[],total=items.length,pages=Math.max(1,Math.ceil(total/state.per));
  if(state.page>pages)state.page=pages;var start=(state.page-1)*state.per;
  var d={items:items.slice(start,start+state.per),page:state.page,per_page:state.per,total:total,pages:pages};
  state.productsByView[name]=d;cset(productCacheKey(stock),d);if(state.view===name){render();restoreMerchantScroll(true);}
}''')

t = replace_func(t, 'loadExactSearch', r'''function loadExactSearch(stock,force){
  var name=stock?'stock':'products',poolKey=searchPoolKey(stock),pool=state.searchPools[name],cached=cget(productCacheKey(stock),0);
  if(pool&&pool.key===poolKey&&!force){applySearchPool(stock);return;}
  if(cached){state.productsByView[name]=cached;if(state.view===name){render();restoreMerchantScroll(false);}}
  api(buildProductUrl(stock,1,50)).then(function(first){var pages=Math.max(1,Math.min(60,Number(first.pages)||1)),pageNums=[];for(var i=2;i<=pages;i++)pageNums.push(i);return fetchSearchPages(stock,pageNums,0,[]).then(function(rest){var all=(first.items||[]).slice();rest.forEach(function(d){all=all.concat(d.items||[]);});var seen={},exact=[];all.forEach(function(p){if(!p||seen[p.id]||!matchesExactSearch(p))return;seen[p.id]=1;exact.push(p);});state.searchPools[name]={key:poolKey,items:exact};applySearchPool(stock);});}).catch(function(){state.productsByView[name]={items:[],page:1,per_page:state.per,total:0,pages:1};if(state.view===name){render();restoreMerchantScroll(true);}});
}''')

t = replace_func(t, 'loadProducts', r'''function loadProducts(stock,force){
  var key=productCacheKey(stock),cached=cget(key,0),name=stock?'stock':'products';
  if(String(state.query||'').trim()!==''){loadExactSearch(stock,force);return;}
  state.searchPools[name]=null;if(cached){state.productsByView[name]=cached;if(state.view===name){render();restoreMerchantScroll(false);}}
  var url=buildProductUrl(stock,state.page,state.per);
  api(url).then(function(d){state.productsByView[name]=d;cset(key,d);if(state.view===name){render();restoreMerchantScroll(true);}}).catch(function(){if(!state.productsByView[name]){state.productsByView[name]={items:[],page:1,per_page:state.per,total:0,pages:1};if(state.view===name){render();restoreMerchantScroll(true);}}else{restoreMerchantScroll(true);}});
}''')

# Cancel/back returns to the same search results and scroll position.
old_close = "root.querySelectorAll('[data-act=\"close-editor\"]').forEach(function(e){e.onclick=function(){state.editor=null;state.catSearch='';render();};});"
new_close = "root.querySelectorAll('[data-act=\"close-editor\"]').forEach(function(e){e.onclick=function(){state.editor=null;state.catSearch='';render();restoreMerchantScroll(true);};});"
t = once(t, old_close, new_close, 'editor return context')

# The same stock filter works from both Products and Stock views.
old_sf = "var sf=document.getElementById('slm-stock-filter');if(sf)sf.onchange=function(){state.stockStatus=this.value||'all';state.page=1;resetProductResults('stock');render();loadProducts(true,true);};"
new_sf = "var sf=document.getElementById('slm-stock-filter');if(sf)sf.onchange=function(){merchantReturnScroll=null;state.stockStatus=this.value||'all';state.page=1;resetProductResults(state.view);render();window.scrollTo(0,0);loadProducts(state.view==='stock',true);};"
t = once(t, old_sf, new_sf, 'stock filter both views')

# A deliberate new search/category/tab starts a new context at the top.
t = t.replace("e.onclick=function(){state.query=val('slm-product-search').trim();state.page=1;", "e.onclick=function(){merchantReturnScroll=null;state.query=val('slm-product-search').trim();state.page=1;", 1)
t = t.replace("e.onclick=function(){state.categoryId=Number(this.dataset.filterCat)||0;state.page=1;", "e.onclick=function(){merchantReturnScroll=null;state.categoryId=Number(this.dataset.filterCat)||0;state.page=1;", 1)
t = t.replace("if(cf)cf.onchange=function(){state.categoryId=Number(this.value)||0;state.page=1;", "if(cf)cf.onchange=function(){merchantReturnScroll=null;state.categoryId=Number(this.value)||0;state.page=1;", 1)
t = t.replace("function navigate(view){state.menuOpen=false;", "function navigate(view){merchantReturnScroll=null;state.menuOpen=false;", 1)

p.write_text(t, encoding='utf-8')

final = p.read_text(encoding='utf-8')
assert "CFG.version='1.1.43'" in final
assert '>Filter · All<' in final and '>Filter · In stock<' in final and '>Filter · Out of stock<' in final
assert 'if(state.stockStatus!==\'all\')url+=\'&stock_status=\'' in final
assert "state.query='';state.categoryId=0;state.stockStatus='all';state.page=1;state.view='products'" not in final
assert 'restoreMerchantScroll(true)' in final
assert "loadProducts(state.view==='stock',true)" in final
print('ShishaLove Bridge 1.1.43: Merchant stock filter + exact edit-context return applied')
