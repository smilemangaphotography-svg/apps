#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.30.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.29.py'), str(root)])


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
# CUSTOMER — release identity only. No Customer layout/business logic changes.
# -----------------------------------------------------------------------------
customer_path = root / 'assets' / 'customer.js'
customer = customer_path.read_text(encoding='utf-8')
customer = customer.replace("var BUILD='1.1.29';", "var BUILD='1.1.30';", 1)
customer = customer.replace("CFG.version='1.1.29';", "CFG.version='1.1.30';", 1)
customer = customer.replace("slbfix','1.1.29'", "slbfix','1.1.30'", 1)
customer_path.write_text(customer, encoding='utf-8')

# -----------------------------------------------------------------------------
# MERCHANT — keep core editor + Publish/Product Brands only from the 1.1.29
# additions, add safe WordPress Trash action, preserve all image/gallery tools.
# -----------------------------------------------------------------------------
merchant_path = root / 'assets' / 'merchant.js'
merchant = merchant_path.read_text(encoding='utf-8')
merchant = merchant.replace("CFG.version='1.1.29';", "CFG.version='1.1.30';", 1)
merchant = merchant.replace("slbfix','1.1.29'", "slbfix','1.1.30'", 1)
merchant = merchant.replace('Bridge 1.1.29', 'Bridge 1.1.30', 1)

merchant = replace_func(merchant, 'advancedProductFields', r'''function advancedProductFields(p){
  var visibility=p.visibility||((p.status==='private')?'private':'public'),catalog=p.catalog_visibility||'visible';
  return '<section class="slm-advanced-card"><h3>Publish</h3><div class="slm-two-col"><label>Status<select id="slm-status"><option value="publish"'+(p.status==='publish'?' selected':'')+'>Published</option><option value="draft"'+(p.status==='draft'?' selected':'')+'>Draft</option><option value="pending"'+(p.status==='pending'?' selected':'')+'>Pending review</option><option value="private"'+(p.status==='private'?' selected':'')+'>Private</option></select></label><label>Visibility<select id="slm-visibility"><option value="public"'+(visibility==='public'?' selected':'')+'>Public</option><option value="private"'+(visibility==='private'?' selected':'')+'>Private</option></select></label></div><label>Catalog visibility<select id="slm-catalog"><option value="visible"'+(catalog==='visible'?' selected':'')+'>Shop and search results</option><option value="catalog"'+(catalog==='catalog'?' selected':'')+'>Shop only</option><option value="search"'+(catalog==='search'?' selected':'')+'>Search results only</option><option value="hidden"'+(catalog==='hidden'?' selected':'')+'>Hidden</option></select></label></section>'+brandPicker(p);
}''')

merchant = replace_func(merchant, 'editorPanel', r'''function editorPanel(){
  if(!state.editor)return '<section class="slm-panel" id="slm-panel"></section>';
  var p=state.editor,creating=!p.id,busy=!!p._mediaBusy;
  return '<section class="slm-panel open" id="slm-panel">'+
    '<div class="slm-panel-head"><button data-act="close-editor" aria-label="Back">←</button><h1>'+(creating?'New Product':'Edit Product')+'</h1><button data-act="close-editor" aria-label="Close">×</button></div>'+
    '<div class="slm-form"><label>Name</label><input id="slm-name" value="'+esc(p.name||'')+'">'+productLinkField(p,creating)+editorMedia(p)+
    '<label>SKU</label><input id="slm-sku" value="'+esc(p.sku||'')+'">'+
    '<div class="slm-two-col"><label>Regular price<input id="slm-price" inputmode="decimal" value="'+esc(p.regular_price||'')+'"></label><label>Sale price<input id="slm-sale" inputmode="decimal" value="'+esc(p.sale_price||'')+'"></label></div>'+
    '<label>Stock status</label><select id="slm-stock"><option value="instock"'+(p.stock_status==='instock'?' selected':'')+'>In stock</option><option value="outofstock"'+(p.stock_status==='outofstock'?' selected':'')+'>Out of stock</option><option value="onbackorder"'+(p.stock_status==='onbackorder'?' selected':'')+'>On backorder</option></select>'+
    advancedProductFields(p)+categoryPicker()+
    '<label>Short description</label><textarea id="slm-desc">'+esc(p.short_description||'')+'</textarea>'+
    '<div class="slm-form-actions"><button class="slm-cancel" data-act="close-editor" '+(busy?'disabled':'')+'>CANCEL</button><button class="slm-save" data-act="save-product" '+(busy?'disabled':'')+'>'+(busy?'UPLOADING…':(creating?'CREATE':'UPDATE'))+'</button></div>'+
    (!creating?'<button type="button" class="slm-trash-product" data-act="trash-product" '+(busy?'disabled':'')+'>TRASH PRODUCT</button>':'')+
    '</div></section>';
}''')

merchant = replace_func(merchant, 'saveProduct', r'''function saveProduct(){
  if(!state.editor||state.editor._mediaBusy)return;
  var brandIds=[];root.querySelectorAll('[data-brand-check]:checked').forEach(function(e){brandIds.push(Number(e.dataset.brandCheck));});
  var body={name:val('slm-name'),sku:val('slm-sku'),status:val('slm-status'),visibility:val('slm-visibility'),catalog_visibility:val('slm-catalog'),regular_price:val('slm-price'),sale_price:val('slm-sale'),stock_status:val('slm-stock'),short_description:val('slm-desc'),category_ids:state.selectedCats.slice(),brand_ids:brandIds,ensure_artwork:true,image_id:Number(state.editor.image_id)||0,gallery_ids:Array.isArray(state.editor.gallery_ids)?state.editor.gallery_ids.map(Number).filter(function(id){return id>0;}):[]};
  var btn=document.querySelector('[data-act="save-product"]');if(btn){btn.disabled=true;btn.textContent='SAVING…';}
  var path=state.editor.id?'merchant/product/'+state.editor.id:'merchant/product';
  api(path,{method:'POST',body:JSON.stringify(body)}).then(function(saved){cdelPrefix('slm-products-');state.searchPools={products:null,stock:null};state.productsByView={products:null,stock:null};state.editor=null;state.query='';state.categoryId=0;state.stockStatus='all';state.page=1;state.view='products';render();loadProducts(false,true);if(saved&&saved.permalink){try{navigator.clipboard&&navigator.clipboard.writeText(saved.permalink);}catch(e){}}}).catch(function(){if(btn){btn.disabled=false;btn.textContent=state.editor&&state.editor.id?'UPDATE':'CREATE';}alert('Could not save product.');});
}''')

# Add the reversible WordPress Trash action without disturbing existing media bindings.
trash_fn = r'''function trashProduct(){
  if(!state.editor||!state.editor.id||state.editor._mediaBusy)return;
  var id=Number(state.editor.id)||0,name=state.editor.name||'this product';
  if(!id||!window.confirm('Move "'+name+'" to Trash? You can restore it later from WordPress Trash.'))return;
  var btn=document.querySelector('[data-act="trash-product"]');if(btn){btn.disabled=true;btn.textContent='MOVING TO TRASH…';}
  api('merchant/product/'+id,{method:'DELETE'}).then(function(){cdelPrefix('slm-products-');state.searchPools={products:null,stock:null};state.productsByView={products:null,stock:null};state.editor=null;state.query='';state.categoryId=0;state.stockStatus='all';state.page=1;state.view='products';render();loadProducts(false,true);}).catch(function(){if(btn){btn.disabled=false;btn.textContent='TRASH PRODUCT';}alert('Could not move product to Trash.');});
}
'''
anchor = 'function val(id){'
pos = merchant.find(anchor)
if pos < 0:
    raise SystemExit('merchant val anchor missing')
merchant = merchant[:pos] + trash_fn + merchant[pos:]

bind_anchor = "root.querySelectorAll('[data-act=\"save-product\"]').forEach(function(e){e.onclick=saveProduct;});"
merchant = replace_once(merchant, bind_anchor, bind_anchor + "root.querySelectorAll('[data-act=\"trash-product\"]').forEach(function(e){e.onclick=trashProduct;});", 'merchant trash binding')
merchant_path.write_text(merchant, encoding='utf-8')

# -----------------------------------------------------------------------------
# PHP — reversible product trash endpoint + harden permanent phone-upload
# watermarking so success is only returned after the exact bottom-right watermark
# is actually baked into the 600x600 file.
# -----------------------------------------------------------------------------
main_path = root / 'shishalove-app-bridge.php'
main = main_path.read_text(encoding='utf-8')

trash_php = r'''function slb_trash_product($request) {
    $id = absint($request['id']);
    if (!$id || get_post_type($id) !== 'product') { return new WP_Error('not_found', 'Product not found', array('status' => 404)); }
    if (!current_user_can('delete_post', $id) && !current_user_can('manage_woocommerce')) { return new WP_Error('forbidden', 'You cannot trash this product', array('status' => 403)); }
    $trashed = wp_trash_post($id);
    if (!$trashed) { return new WP_Error('trash_failed', 'Product could not be moved to Trash', array('status' => 500)); }
    clean_post_cache($id);
    if (function_exists('wc_delete_product_transients')) { wc_delete_product_transients($id); }
    return array('id' => $id, 'trashed' => true);
}

'''
anchor = 'function slb_orders($request) {'
pos = main.find(anchor)
if pos < 0:
    raise SystemExit('PHP orders anchor missing')
main = main[:pos] + trash_php + main[pos:]

route_anchor = "        array('methods' => 'POST', 'permission_callback' => 'slb_merchant_permission', 'callback' => function($r){ return slb_save_product($r, absint($r['id'])); }),\n    ));"
route_replacement = "        array('methods' => 'POST', 'permission_callback' => 'slb_merchant_permission', 'callback' => function($r){ return slb_save_product($r, absint($r['id'])); }),\n        array('methods' => 'DELETE', 'permission_callback' => 'slb_merchant_permission', 'callback' => 'slb_trash_product'),\n    ));"
main = replace_once(main, route_anchor, route_replacement, 'merchant trash route')

# Never report a successful upload unless the 600x600 file was actually watermarked.
upload_anchor = "    $id = media_handle_upload('file', 0, array(), array('test_form' => false));\n    if (is_wp_error($id)) { return $id; }\n    slb_prepare_product_artwork($id);\n    $url = wp_get_attachment_image_url($id, 'full');"
upload_replacement = "    $id = media_handle_upload('file', 0, array(), array('test_form' => false));\n    if (is_wp_error($id)) { return $id; }\n    if (!slb_prepare_product_artwork($id)) { wp_delete_attachment($id, true); return new WP_Error('watermark_failed', 'The ShishaLove watermark could not be applied', array('status' => 500)); }\n    $url = wp_get_attachment_image_url($id, 'full');"
main = replace_once(main, upload_anchor, upload_replacement, 'guaranteed phone upload watermark')

# Keep the customer-visible watermark geometry locked at the website position.
main = replace_once(main, "            $lw = 118;", "            $lw = 118; // locked website watermark width", 'watermark width lock')
main = replace_once(main, "            $lx = 600 - $lw - 16;\n            $ly = 600 - $lh - 14;", "            $lx = 600 - $lw - 16; // right edge matches website product artwork\n            $ly = 600 - $lh - 14; // bottom edge matches website product artwork", 'watermark position lock')
main_path.write_text(main, encoding='utf-8')

# -----------------------------------------------------------------------------
# CSS — only the new Trash control styling. No other approved layout changes.
# -----------------------------------------------------------------------------
css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')
css += r'''

/* ShishaLove 1.1.30 — scoped final cleanup: reversible product Trash only */
body.slb-merchant .slm-trash-product{
  display:block!important;width:100%!important;min-height:50px!important;margin:10px 0 18px!important;
  border:1.5px solid #a52a3a!important;border-radius:12px!important;background:#fff!important;
  color:#9d2637!important;-webkit-text-fill-color:#9d2637!important;font-weight:900!important;font-size:15px!important;
}
body.slb-merchant .slm-trash-product:disabled{opacity:.5!important}
'''
css_path.write_text(css, encoding='utf-8')

print('ShishaLove 1.1.30: Trash added, watermark success guaranteed, 1.1.29 extra layout groups removed')
