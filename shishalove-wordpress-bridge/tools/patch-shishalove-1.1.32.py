#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.32.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.31.py'), str(root)])


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


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one anchor, found {count}')
    return text.replace(old, new, 1)

# -----------------------------------------------------------------------------
# CUSTOMER — only force the four bottom-nav labels to true black in the actual
# rendered markup. Icon active/inactive colors remain exactly as before.
# -----------------------------------------------------------------------------
customer_path = root / 'assets' / 'customer.js'
customer = customer_path.read_text(encoding='utf-8')
customer = replace_once(customer, "var BUILD='1.1.31';", "var BUILD='1.1.32';", 'customer build')
customer = replace_once(customer, "CFG.version='1.1.31';", "CFG.version='1.1.32';", 'customer cfg')
customer = replace_once(customer, "slbfix','1.1.31'", "slbfix','1.1.32'", 'customer css bust')
customer = replace_func(customer, 'bottom', r'''function bottom(active){
  var items=[['home','⌂','Home'],['search','⌕','Search'],['favorites','♡','Favorites'],['account','♙','Account']];
  return '<nav class="slb-bottom">'+items.map(function(x){return '<button data-nav="'+x[0]+'" class="'+(active===x[0]?'active':'')+'"><i>'+x[1]+'</i><span class="slb-bottom-label" style="color:#000!important;-webkit-text-fill-color:#000!important;opacity:1!important">'+x[2]+'</span></button>';}).join('')+'</nav>';
}''')
customer_path.write_text(customer, encoding='utf-8')

# -----------------------------------------------------------------------------
# MERCHANT — expose WooCommerce stock management/quantity already supported by
# the backend, make order badges uniform, and add Previous/Next order paging.
# -----------------------------------------------------------------------------
merchant_path = root / 'assets' / 'merchant.js'
merchant = merchant_path.read_text(encoding='utf-8')
merchant = replace_once(merchant, "CFG.version='1.1.31';", "CFG.version='1.1.32';", 'merchant cfg')
merchant = replace_once(merchant, "slbfix','1.1.31'", "slbfix','1.1.32'", 'merchant css bust')
merchant = replace_once(merchant, 'Bridge 1.1.31', 'Bridge 1.1.32', 'merchant version label')

merchant = replace_func(merchant, 'ordersBody', r'''function ordersBody(){
  var data=state.orders||cget(ordersKey(),15*60*1000),items=data&&data.items||[];
  return '<main class="slm-page"><div class="slm-head"><div><h1>Orders</h1><div class="slm-muted">Latest WooCommerce orders</div></div></div><section id="slm-orders">'+(data?orderRows(items):ghostRows(5))+'</section>'+pagerMarkup(data)+'</main>';
}''')

merchant = replace_func(merchant, 'editorPanel', r'''function editorPanel(){
  if(!state.editor)return '<section class="slm-panel" id="slm-panel"></section>';
  var p=state.editor,creating=!p.id,busy=!!p._mediaBusy,manage=!!p.manage_stock;
  return '<section class="slm-panel open" id="slm-panel">'+
    '<div class="slm-panel-head"><button data-act="close-editor" aria-label="Back">←</button><h1>'+(creating?'New Product':'Edit Product')+'</h1><button data-act="close-editor" aria-label="Close">×</button></div>'+
    '<div class="slm-form"><label>Name</label><input id="slm-name" value="'+esc(p.name||'')+'">'+productLinkField(p,creating)+editorMedia(p)+
    '<label>SKU</label><input id="slm-sku" value="'+esc(p.sku||'')+'">'+
    '<div class="slm-two-col"><label>Regular price<input id="slm-price" inputmode="decimal" value="'+esc(p.regular_price||'')+'"></label><label>Sale price<input id="slm-sale" inputmode="decimal" value="'+esc(p.sale_price||'')+'"></label></div>'+
    '<label>Stock status</label><select id="slm-stock"><option value="instock"'+(p.stock_status==='instock'?' selected':'')+'>In stock</option><option value="outofstock"'+(p.stock_status==='outofstock'?' selected':'')+'>Out of stock</option><option value="onbackorder"'+(p.stock_status==='onbackorder'?' selected':'')+'>On backorder</option></select>'+
    '<div class="slm-stock-management"><label class="slm-stock-manage-row"><input type="checkbox" id="slm-manage-stock" '+(manage?'checked':'')+'><span><strong>Stock management</strong><small>Track stock quantity for this product</small></span></label><label id="slm-stock-qty-wrap" style="display:'+(manage?'block':'none')+'">Stock quantity<input id="slm-stock-qty" type="number" min="0" step="1" inputmode="numeric" value="'+esc(p.stock_quantity==null?'':p.stock_quantity)+'"></label></div>'+
    advancedProductFields(p)+categoryPicker()+
    '<label>Short description</label><textarea id="slm-desc">'+esc(p.short_description||'')+'</textarea>'+
    '<div class="slm-form-actions"><button class="slm-cancel" data-act="close-editor" '+(busy?'disabled':'')+'>CANCEL</button><button class="slm-save" data-act="save-product" '+(busy?'disabled':'')+'>'+(busy?'UPLOADING…':(creating?'CREATE':'UPDATE'))+'</button></div>'+
    (!creating?'<button type="button" class="slm-trash-product" data-act="trash-product" '+(busy?'disabled':'')+'>TRASH PRODUCT</button>':'')+
    '</div></section>';
}''')

merchant = replace_func(merchant, 'saveProduct', r'''function saveProduct(){
  if(!state.editor||state.editor._mediaBusy)return;
  var brandIds=[];root.querySelectorAll('[data-brand-check]:checked').forEach(function(e){brandIds.push(Number(e.dataset.brandCheck));});
  var ms=document.getElementById('slm-manage-stock'),manage=!!(ms&&ms.checked);
  var body={name:val('slm-name'),sku:val('slm-sku'),status:val('slm-status'),visibility:val('slm-visibility'),catalog_visibility:val('slm-catalog'),regular_price:val('slm-price'),sale_price:val('slm-sale'),stock_status:val('slm-stock'),manage_stock:manage,stock_quantity:manage?val('slm-stock-qty'):'',short_description:val('slm-desc'),category_ids:state.selectedCats.slice(),brand_ids:brandIds,ensure_artwork:true,image_id:Number(state.editor.image_id)||0,gallery_ids:Array.isArray(state.editor.gallery_ids)?state.editor.gallery_ids.map(Number).filter(function(id){return id>0;}):[]};
  var btn=document.querySelector('[data-act="save-product"]');if(btn){btn.disabled=true;btn.textContent='SAVING…';}
  var path=state.editor.id?'merchant/product/'+state.editor.id:'merchant/product';
  api(path,{method:'POST',body:JSON.stringify(body)}).then(function(saved){cdelPrefix('slm-products-');state.searchPools={products:null,stock:null};state.productsByView={products:null,stock:null};state.editor=null;state.query='';state.categoryId=0;state.stockStatus='all';state.page=1;state.view='products';render();loadProducts(false,true);if(saved&&saved.permalink){try{navigator.clipboard&&navigator.clipboard.writeText(saved.permalink);}catch(e){}}}).catch(function(){if(btn){btn.disabled=false;btn.textContent=state.editor&&state.editor.id?'UPDATE':'CREATE';}alert('Could not save product.');});
}''')

old_pager = "root.querySelectorAll('[data-page-dir]').forEach(function(e){e.onclick=function(){var d=currentProductData(state.view==='stock'),pages=Math.max(1,Number(d&&d.pages||1));if(this.dataset.pageDir==='next'&&state.page<pages)state.page++;if(this.dataset.pageDir==='prev'&&state.page>1)state.page--;var pool=state.searchPools[state.view==='stock'?'stock':'products'];if(String(state.query||'').trim()!==''&&pool&&pool.key===searchPoolKey(state.view==='stock'))applySearchPool(state.view==='stock');else{resetProductResults(state.view);hydrateViewFromCache(state.view);render();loadProducts(state.view==='stock',false);}window.scrollTo({top:0,behavior:'smooth'});};});"
new_pager = "root.querySelectorAll('[data-page-dir]').forEach(function(e){e.onclick=function(){if(state.view==='orders'){var od=state.orders||cget(ordersKey(),15*60*1000),opages=Math.max(1,Number(od&&od.pages||1));if(this.dataset.pageDir==='next'&&state.page<opages)state.page++;if(this.dataset.pageDir==='prev'&&state.page>1)state.page--;state.orders=null;hydrateViewFromCache('orders');render();loadOrders(false);window.scrollTo({top:0,behavior:'smooth'});return;}var d=currentProductData(state.view==='stock'),pages=Math.max(1,Number(d&&d.pages||1));if(this.dataset.pageDir==='next'&&state.page<pages)state.page++;if(this.dataset.pageDir==='prev'&&state.page>1)state.page--;var pool=state.searchPools[state.view==='stock'?'stock':'products'];if(String(state.query||'').trim()!==''&&pool&&pool.key===searchPoolKey(state.view==='stock'))applySearchPool(state.view==='stock');else{resetProductResults(state.view);hydrateViewFromCache(state.view);render();loadProducts(state.view==='stock',false);}window.scrollTo({top:0,behavior:'smooth'});};});"
merchant = replace_once(merchant, old_pager, new_pager, 'orders pager binding')

name_anchor = "var nm=document.getElementById('slm-name');"
merchant = replace_once(merchant, name_anchor, "var ms=document.getElementById('slm-manage-stock');if(ms)ms.onchange=function(){var q=document.getElementById('slm-stock-qty-wrap');if(q)q.style.display=this.checked?'block':'none';};" + name_anchor, 'stock management toggle binding')
merchant_path.write_text(merchant, encoding='utf-8')

# -----------------------------------------------------------------------------
# CSS — only the requested label, stock-management and order-badge corrections.
# -----------------------------------------------------------------------------
css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')
css += r'''

/* ShishaLove 1.1.32 — scoped nav, stock and orders corrections only */
body.slb-customer .slb-bottom button .slb-bottom-label,
body.slb-customer .slb-bottom button.active .slb-bottom-label{
  color:#000!important;-webkit-text-fill-color:#000!important;opacity:1!important;filter:none!important;font-weight:900!important;
}
body.slb-merchant .slm-stock-management{
  margin:14px 0 18px!important;padding:14px!important;border:1px solid #e5e5e7!important;border-radius:14px!important;background:#fff!important;
}
body.slb-merchant .slm-stock-manage-row{
  display:flex!important;align-items:center!important;gap:12px!important;margin:0!important;font-weight:800!important;
}
body.slb-merchant .slm-stock-manage-row input{
  width:24px!important;height:24px!important;min-width:24px!important;margin:0!important;
}
body.slb-merchant .slm-stock-manage-row span{display:flex!important;flex-direction:column!important;gap:3px!important}
body.slb-merchant .slm-stock-manage-row small{display:block!important;color:#777!important;font-size:12px!important;font-weight:500!important}
body.slb-merchant #slm-stock-qty-wrap{margin-top:14px!important}
body.slb-merchant .slm-order .slm-badge{
  display:inline-flex!important;align-items:center!important;justify-content:center!important;
  width:118px!important;min-width:118px!important;height:42px!important;min-height:42px!important;
  padding:0 10px!important;box-sizing:border-box!important;border-radius:22px!important;white-space:nowrap!important;text-align:center!important;
}
'''
css_path.write_text(css, encoding='utf-8')

print('ShishaLove 1.1.32: black customer labels, stock management quantity, uniform order badges, order pagination')
