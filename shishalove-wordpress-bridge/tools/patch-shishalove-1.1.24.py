#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.24.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent

# FINAL OWNER LOCK: start from the fully approved 1.1.23 lineage and change ONLY:
# 1) Customer first-open category loading (no false empty state; request starts immediately).
# 2) Merchant refresh responsiveness (keep current data visible during revalidation).
# 3) Merchant Edit/Create Product main image + WooCommerce gallery restoration.
# No navigation, sorting, recommendations, orders, stock rules, branding, header, footer,
# catalogue structure or unrelated UI is changed.
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.23.py'), str(root)])


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'{label}: expected anchor not found')
    if text.count(old) != 1:
        raise SystemExit(f'{label}: expected exactly one anchor, found {text.count(old)}')
    return text.replace(old, new, 1)

# -----------------------------------------------------------------------------
# CUSTOMER: never render a false "0 products / No in-stock products found" while
# a first-time category request is still in flight. Start the request synchronously
# on the tap, share it with loadCategory(), and show a neutral loading state only
# when no real cached data exists.
# -----------------------------------------------------------------------------
customer_path = root / 'assets' / 'customer.js'
customer = customer_path.read_text(encoding='utf-8')

customer = replace_once(
    customer,
    "  var key=productKey(cat,state.page,state.sort,state.per,''),cached=cacheGet(key,10*60*1000);\n  var data=cached||{items:[],total:0,pages:1,page:state.page};",
    "  var key=productKey(cat,state.page,state.sort,state.per,''),cached=cacheGet(key,10*60*1000),loading=!cached;\n  var data=cached||{items:[],total:0,pages:1,page:state.page};",
    'customer category loading flag'
)
customer = replace_once(
    customer,
    "'<div class=\"slb-toolbar\"><div class=\"count\" id=\"slb-count\">'+Number(data.total||0)+' products</div><select id=\"slb-sort\">'",
    "'<div class=\"slb-toolbar\"><div class=\"count\" id=\"slb-count\">'+(loading?'Loading products…':Number(data.total||0)+' products')+'</div><select id=\"slb-sort\">'",
    'customer category count loading state'
)
customer = replace_once(
    customer,
    "'<div class=\"slb-product-area\" id=\"slb-product-area\">'+productsMarkup(data.items||[])+'</div><div id=\"slb-pager-wrap\">'+pagerMarkup(state.page,state.pages)+'</div></main>';",
    "'<div class=\"slb-product-area\" id=\"slb-product-area\">'+(loading?'<div class=\"slb-category-loading\" style=\"grid-column:1/-1;text-align:center;padding:44px 12px;color:#777\">Loading products…</div>':productsMarkup(data.items||[]))+'</div><div id=\"slb-pager-wrap\">'+pagerMarkup(state.page,state.pages)+'</div></main>';",
    'customer category product loading state'
)

# Shared one-request-per-category/page/sort key. This avoids the render timer creating
# a duplicate request and starts the fetch before the category page is painted.
request_helper = """
var categoryPending={};
function categoryRequestShared(cat,key){
  if(categoryPending[key])return categoryPending[key];
  var p=categoryRequest(cat);
  categoryPending[key]=p;
  p.then(function(){delete categoryPending[key];},function(){delete categoryPending[key];});
  return p;
}
"""
customer = replace_once(
    customer,
    "function loadCategory(){\n",
    request_helper + "function loadCategory(){\n",
    'customer shared category request helper'
)
customer = replace_once(
    customer,
    "  categoryRequest(cat).then(function(data){",
    "  categoryRequestShared(cat,key).then(function(data){",
    'customer shared category request use'
)
customer = replace_once(
    customer,
    "  state.category=cat;state.product=null;state.view='category';state.page=1;state.pages=1;state.sort='date-desc';state.per=30;\n  routeWrite(!!replace);render();",
    "  state.category=cat;state.product=null;state.view='category';state.page=1;state.pages=1;state.sort='date-desc';state.per=30;\n  var key=productKey(cat,state.page,state.sort,state.per,'');\n  if(!cacheGet(key,10*60*1000))categoryRequestShared(cat,key);\n  routeWrite(!!replace);render();",
    'customer request starts on category tap'
)
customer_path.write_text(customer, encoding='utf-8')

# -----------------------------------------------------------------------------
# MERCHANT: stale-while-revalidate refresh + real main image/gallery editing.
# -----------------------------------------------------------------------------
merchant_path = root / 'assets' / 'merchant.js'
merchant = merchant_path.read_text(encoding='utf-8')

# Keep current Products/Stock rows visible while fresh data is fetched.
merchant = replace_once(
    merchant,
    "function refresh(){state.productsByView[state.view==='stock'?'stock':'products']=null;if(state.view==='products')loadProducts(false,true);else if(state.view==='stock')loadProducts(true,true);else if(state.view==='orders')loadOrders(true);else bootstrap(true);}",
    "function refresh(){if(state.view==='products')loadProducts(false,true);else if(state.view==='stock')loadProducts(true,true);else if(state.view==='orders')loadOrders(true);else bootstrap(true);}",
    'merchant non-destructive refresh'
)

media_helpers = r'''
function editorMedia(p){
  var gallery=Array.isArray(p.gallery)?p.gallery:[],busy=!!p._mediaBusy,status=p._mediaStatus||'';
  var main=p.image||'';
  return '<section class="slm-media-editor"><label>Product image</label><div class="slm-main-media">'+(main?'<img src="'+esc(main)+'" alt="Product image">':'<div class="slm-media-empty">No product image</div>')+'</div><label class="slm-media-pick '+(busy?'disabled':'')+'" for="slm-main-image-input">'+(main?'CHANGE IMAGE':'ADD IMAGE')+'</label><input id="slm-main-image-input" type="file" accept="image/*" '+(busy?'disabled':'')+' hidden><div class="slm-gallery-head"><label>Gallery</label><label class="slm-media-pick '+(busy?'disabled':'')+'" for="slm-gallery-input">+ ADD PHOTOS</label></div><input id="slm-gallery-input" type="file" accept="image/*" multiple '+(busy?'disabled':'')+' hidden><div class="slm-gallery-grid">'+(gallery.length?gallery.map(function(src,i){return '<div class="slm-gallery-item"><img src="'+esc(src)+'" alt="Gallery image"><button type="button" data-gallery-remove="'+i+'" aria-label="Remove image">×</button></div>';}).join(''):'<div class="slm-media-empty">No gallery images</div>')+'</div>'+(status?'<div class="slm-media-status">'+esc(status)+'</div>':'')+'</section>';
}
function uploadMerchantMedia(file){
  var fd=new FormData();fd.append('file',file,file.name||'product-image.jpg');
  var h={};if(CFG.restNonce)h['X-WP-Nonce']=CFG.restNonce;
  return fetch(CFG.rest+'merchant/media',{method:'POST',credentials:'same-origin',headers:h,body:fd}).then(function(r){if(!r.ok)throw new Error('Media HTTP '+r.status);return r.json();});
}
function uploadMerchantMediaList(files,index,out){
  if(index>=files.length)return Promise.resolve(out);
  return uploadMerchantMedia(files[index]).then(function(row){out.push(row);return uploadMerchantMediaList(files,index+1,out);});
}
function chooseEditorMedia(files,isGallery){
  if(!state.editor||!files||!files.length)return;
  var list=Array.prototype.slice.call(files);if(!isGallery)list=list.slice(0,1);
  state.editor._mediaBusy=true;state.editor._mediaStatus='Uploading image'+(list.length>1?'s':'')+'…';renderEditorOnly();
  uploadMerchantMediaList(list,0,[]).then(function(rows){
    if(!state.editor)return;
    if(isGallery){
      if(!Array.isArray(state.editor.gallery))state.editor.gallery=[];
      if(!Array.isArray(state.editor.gallery_ids))state.editor.gallery_ids=[];
      rows.forEach(function(row){state.editor.gallery.push(row.source_url||'');state.editor.gallery_ids.push(Number(row.id)||0);});
    }else if(rows[0]){
      state.editor.image=rows[0].source_url||state.editor.image||'';
      state.editor.image_id=Number(rows[0].id)||0;
    }
    state.editor._mediaBusy=false;state.editor._mediaStatus='';renderEditorOnly();
  }).catch(function(){if(state.editor){state.editor._mediaBusy=false;state.editor._mediaStatus='Image upload failed. Try again.';renderEditorOnly();}});
}
function removeGalleryImage(index){
  if(!state.editor)return;index=Number(index);if(!Array.isArray(state.editor.gallery))state.editor.gallery=[];if(!Array.isArray(state.editor.gallery_ids))state.editor.gallery_ids=[];state.editor.gallery.splice(index,1);state.editor.gallery_ids.splice(index,1);renderEditorOnly();
}
function bindMediaControls(){
  var main=document.getElementById('slm-main-image-input');if(main)main.onchange=function(){chooseEditorMedia(this.files,false);};
  var gallery=document.getElementById('slm-gallery-input');if(gallery)gallery.onchange=function(){chooseEditorMedia(this.files,true);};
  root.querySelectorAll('[data-gallery-remove]').forEach(function(e){e.onclick=function(){removeGalleryImage(this.dataset.galleryRemove);};});
}
'''
merchant = replace_once(
    merchant,
    "function editorPanel(){",
    media_helpers + "function editorPanel(){",
    'merchant media helpers'
)

start = merchant.find("function editorPanel(){")
end = merchant.find("function quickCategories(){", start)
if start < 0 or end < 0:
    raise SystemExit('merchant editorPanel function range not found')
new_editor = """function editorPanel(){if(!state.editor)return '<section class=\"slm-panel\" id=\"slm-panel\"></section>';var p=state.editor,creating=!p.id,busy=!!p._mediaBusy;return '<section class=\"slm-panel open\" id=\"slm-panel\"><div class=\"slm-panel-head\"><button data-act=\"close-editor\">←</button><h1>'+(creating?'New Product':'Edit Product')+'</h1><button data-act=\"close-editor\">×</button></div><div class=\"slm-form\"><label>Name</label><input id=\"slm-name\" value=\"'+esc(p.name||'')+'\">'+productLinkField(p,creating)+editorMedia(p)+'<label>SKU</label><input id=\"slm-sku\" value=\"'+esc(p.sku||'')+'\"><label>Status</label><select id=\"slm-status\"><option value=\"publish\"'+(p.status==='publish'?' selected':'')+'>Published</option><option value=\"draft\"'+(p.status==='draft'?' selected':'')+'>Draft</option><option value=\"pending\"'+(p.status==='pending'?' selected':'')+'>Pending</option></select><label>Regular price</label><input id=\"slm-price\" inputmode=\"decimal\" value=\"'+esc(p.regular_price||'')+'\"><label>Sale price</label><input id=\"slm-sale\" inputmode=\"decimal\" value=\"'+esc(p.sale_price||'')+'\"><label>Stock status</label><select id=\"slm-stock\"><option value=\"instock\"'+(p.stock_status==='instock'?' selected':'')+'>In stock</option><option value=\"outofstock\"'+(p.stock_status==='outofstock'?' selected':'')+'>Out of stock</option><option value=\"onbackorder\"'+(p.stock_status==='onbackorder'?' selected':'')+'>On backorder</option></select>'+categoryPicker()+'<label>Short description</label><textarea id=\"slm-desc\">'+esc(p.short_description||'')+'</textarea><div class=\"slm-form-actions\"><button class=\"slm-cancel\" data-act=\"close-editor\" '+(busy?'disabled':'')+'>CANCEL</button><button class=\"slm-save\" data-act=\"save-product\" '+(busy?'disabled':'')+'>'+(busy?'UPLOADING…':(creating?'CREATE':'UPDATE'))+'</button></div></div></section>';}\n"""
merchant = merchant[:start] + new_editor + merchant[end:]

start = merchant.find("function openEditor(id){")
end = merchant.find("function toggleCat(id){", start)
if start < 0 or end < 0:
    raise SystemExit('merchant openEditor function range not found')
new_open = """function openEditor(id){state.catSearch='';state.selectedCats=[];if(!id){state.editor={id:0,name:'',sku:'',status:'publish',regular_price:'',sale_price:'',stock_status:'instock',short_description:'',categories:[],permalink:'',image:'',image_id:0,gallery:[],gallery_ids:[]};render();return;}var cached=null;var data=state.productsByView.products||state.productsByView.stock;if(data&&data.items)data.items.some(function(p){if(Number(p.id)===Number(id)){cached=p;return true;}return false;});state.editor=cached||{id:Number(id),name:'',status:'publish',stock_status:'instock',categories:[],image:'',image_id:0,gallery:[],gallery_ids:[]};if(!Array.isArray(state.editor.gallery))state.editor.gallery=[];if(!Array.isArray(state.editor.gallery_ids))state.editor.gallery_ids=[];state.selectedCats=(state.editor.categories||[]).map(function(c){return Number(c.id);});render();api('merchant/product/'+id).then(function(p){state.editor=p;if(!Array.isArray(state.editor.gallery))state.editor.gallery=[];if(!Array.isArray(state.editor.gallery_ids))state.editor.gallery_ids=[];state.selectedCats=(p.categories||[]).map(function(c){return Number(c.id);});render();}).catch(function(){});}\n"""
merchant = merchant[:start] + new_open + merchant[end:]

start = merchant.find("function saveProduct(){")
end = merchant.find("function val(id){", start)
if start < 0 or end < 0:
    raise SystemExit('merchant saveProduct function range not found')
new_save = """function saveProduct(){if(!state.editor||state.editor._mediaBusy)return;var body={name:val('slm-name'),sku:val('slm-sku'),status:val('slm-status'),regular_price:val('slm-price'),sale_price:val('slm-sale'),stock_status:val('slm-stock'),short_description:val('slm-desc'),category_ids:state.selectedCats.slice(),image_id:Number(state.editor.image_id)||0,gallery_ids:Array.isArray(state.editor.gallery_ids)?state.editor.gallery_ids.map(Number).filter(function(id){return id>0;}):[]};var btn=document.querySelector('[data-act=\"save-product\"]');if(btn){btn.disabled=true;btn.textContent='SAVING…';}var path=state.editor.id?'merchant/product/'+state.editor.id:'merchant/product';api(path,{method:'POST',body:JSON.stringify(body)}).then(function(saved){cdelPrefix('slm-products-');state.searchPools={products:null,stock:null};state.productsByView={products:null,stock:null};state.editor=null;state.query='';state.categoryId=0;state.stockStatus='all';state.page=1;state.view='products';render();loadProducts(false,true);if(saved&&saved.permalink){try{navigator.clipboard&&navigator.clipboard.writeText(saved.permalink);}catch(e){}}}).catch(function(){if(btn){btn.disabled=false;btn.textContent=state.editor&&state.editor.id?'UPDATE':'CREATE';}alert('Could not save product.');});}\n"""
merchant = merchant[:start] + new_save + merchant[end:]
merchant = replace_once(merchant, "function bind(){", "function bind(){bindMediaControls();", 'merchant media binding')
merchant_path.write_text(merchant, encoding='utf-8')

# -----------------------------------------------------------------------------
# PHP Bridge: expose media IDs, save image/gallery IDs, and add an authenticated
# Merchant-only image upload endpoint. WooCommerce remains the source of truth.
# -----------------------------------------------------------------------------
main_path = root / 'shishalove-app-bridge.php'
main = main_path.read_text(encoding='utf-8')
main = replace_once(
    main,
    "        'image' => $image ?: wc_placeholder_img_src('woocommerce_thumbnail'),\n        'gallery' => $gallery,",
    "        'image' => $image ?: wc_placeholder_img_src('woocommerce_thumbnail'),\n        'image_id' => (int) $image_id,\n        'gallery' => $gallery,\n        'gallery_ids' => array_values(array_map('intval', (array) $product->get_gallery_image_ids())),",
    'php product media ids'
)
main = replace_once(
    main,
    "    if (array_key_exists('stock_status', $body) && in_array($body['stock_status'], array('instock','outofstock','onbackorder'), true)) { $product->set_stock_status($body['stock_status']); }\n    $saved_id = $product->save();",
    "    if (array_key_exists('stock_status', $body) && in_array($body['stock_status'], array('instock','outofstock','onbackorder'), true)) { $product->set_stock_status($body['stock_status']); }\n    if (array_key_exists('image_id', $body)) { $product->set_image_id(absint($body['image_id'])); }\n    if (array_key_exists('gallery_ids', $body) && is_array($body['gallery_ids'])) { $product->set_gallery_image_ids(array_values(array_unique(array_filter(array_map('absint', $body['gallery_ids']))))); }\n    $saved_id = $product->save();",
    'php save product media ids'
)

upload_fn = r'''
function slb_upload_merchant_media($request) {
    if (empty($_FILES['file']) || !is_array($_FILES['file'])) {
        return new WP_Error('missing_file', 'No image was supplied', array('status' => 400));
    }
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $id = media_handle_upload('file', 0, array(), array('test_form' => false));
    if (is_wp_error($id)) { return $id; }
    $url = wp_get_attachment_image_url($id, 'full');
    return array('id' => (int) $id, 'source_url' => $url ? $url : wp_get_attachment_url($id));
}

'''
main = replace_once(main, "function slb_save_product($request, $id = 0) {", upload_fn + "function slb_save_product($request, $id = 0) {", 'php merchant media upload function')
main = replace_once(
    main,
    "    register_rest_route('shishalove/v1', '/merchant/product', array('methods' => 'POST', 'permission_callback' => 'slb_merchant_permission', 'callback' => function($r){ return slb_save_product($r, 0); }));\n    register_rest_route('shishalove/v1', '/merchant/orders'",
    "    register_rest_route('shishalove/v1', '/merchant/product', array('methods' => 'POST', 'permission_callback' => 'slb_merchant_permission', 'callback' => function($r){ return slb_save_product($r, 0); }));\n    register_rest_route('shishalove/v1', '/merchant/media', array('methods' => 'POST', 'permission_callback' => 'slb_merchant_permission', 'callback' => 'slb_upload_merchant_media'));\n    register_rest_route('shishalove/v1', '/merchant/orders'",
    'php merchant media route'
)
main_path.write_text(main, encoding='utf-8')

# Gallery-only styles. Existing editor/footer/header/nav rules are untouched.
css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')
css += r'''

/* ShishaLove 1.1.24 Merchant product-media restoration only */
.slm-media-editor{display:grid;gap:10px;margin:4px 0 20px;min-width:0}
.slm-main-media{width:100%;min-height:150px;border:1px solid #e2e2e5;border-radius:18px;background:#f7f7f8;display:flex;align-items:center;justify-content:center;overflow:hidden}
.slm-main-media img{display:block;width:100%;height:210px;object-fit:contain;background:#fff}
.slm-media-pick{display:inline-flex;align-items:center;justify-content:center;min-height:44px;width:max-content;max-width:100%;padding:0 16px;border:1px solid #d72a40;border-radius:12px;color:#d72a40;font-weight:800;background:#fff;cursor:pointer}
.slm-media-pick.disabled{opacity:.45;pointer-events:none}
.slm-gallery-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:8px}
.slm-gallery-head>label:first-child{margin:0}
.slm-gallery-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;min-width:0}
.slm-gallery-item{position:relative;aspect-ratio:1/1;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;background:#f7f7f8}
.slm-gallery-item img{width:100%;height:100%;object-fit:cover;display:block}
.slm-gallery-item button{position:absolute;top:5px;right:5px;width:28px;height:28px;border:0;border-radius:50%;background:rgba(0,0,0,.72);color:#fff;font-size:20px;line-height:1}
.slm-media-empty{grid-column:1/-1;color:#888;font-size:14px;padding:18px;text-align:center}
.slm-media-status{font-size:13px;color:#666;font-weight:700}
'''
css_path.write_text(css, encoding='utf-8')

print('ShishaLove 1.1.24: only Customer first-category loading, Merchant stale refresh and product media/gallery restored')
