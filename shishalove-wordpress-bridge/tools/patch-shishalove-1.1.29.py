#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.29.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.28.py'), str(root)])


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

# -----------------------------------------------------------------------------
# CUSTOMER — stronger guaranteed full artwork fit. No source image is edited.
# -----------------------------------------------------------------------------
customer_path = root / 'assets' / 'customer.js'
customer = customer_path.read_text(encoding='utf-8')
customer = customer.replace("var BUILD='1.1.28';", "var BUILD='1.1.29';", 1)
customer = customer.replace("CFG.version='1.1.28';", "CFG.version='1.1.29';", 1)
customer = customer.replace("slbfix','1.1.28'", "slbfix','1.1.29'", 1)
customer_path.write_text(customer, encoding='utf-8')

# -----------------------------------------------------------------------------
# MERCHANT — direct full-image Media Library cards + complete practical product
# fields from WordPress/WooCommerce add-product admin references.
# -----------------------------------------------------------------------------
merchant_path = root / 'assets' / 'merchant.js'
merchant = merchant_path.read_text(encoding='utf-8')
merchant = merchant.replace("CFG.version='1.1.28';", "CFG.version='1.1.29';", 1)
merchant = merchant.replace("slbfix','1.1.28'", "slbfix','1.1.29'", 1)
merchant = merchant.replace('Bridge 1.1.28', 'Bridge 1.1.29', 1)

merchant = replace_func(merchant, 'libraryTile', r'''function libraryTile(m,selectable,selected){
  var dim=(m.width&&m.height)?(m.width+' × '+m.height):'',id=Number(m.id)||0;
  var action=selectable?' data-media-select="'+id+'"':' data-media-preview="'+id+'"';
  var src=m.source_url||m.thumb_url||'';
  return '<article class="slm-library-tile '+(selected?'selected':'')+'">'+
    '<button type="button" class="slm-library-select"'+action+'>'+
      '<img class="slm-library-preview" src="'+esc(src)+'" alt="'+esc(m.title||'Media')+'">'+
      '<span class="slm-library-title">'+esc(m.title||('Media #'+id))+'</span>'+
      '<small>'+esc(dim)+'</small>'+
    '</button>'+
    '<button type="button" class="slm-library-delete" data-media-delete="'+id+'">DELETE PERMANENTLY</button>'+
  '</article>';
}''')

advanced_helpers = r'''function brandOptions(){return state.bootstrap&&Array.isArray(state.bootstrap.brands)?state.bootstrap.brands:[];}
function brandPicker(p){
  var selected=(p.brand_ids||[]).map(Number),brands=brandOptions();
  if(!brands.length)return '<section class="slm-advanced-card"><h3>Product brands</h3><div class="slm-muted">No product-brand taxonomy is registered on this store.</div></section>';
  return '<section class="slm-advanced-card"><h3>Product brands</h3><div class="slm-brand-list">'+brands.map(function(b){return '<label class="slm-advanced-check"><input type="checkbox" data-brand-check="'+Number(b.id)+'" '+(selected.indexOf(Number(b.id))>=0?'checked':'')+'><span>'+esc(b.name)+'</span></label>';}).join('')+'</div></section>';
}
function advancedProductFields(p){
  var visibility=p.visibility||((p.status==='private')?'private':'public'),catalog=p.catalog_visibility||'visible',taxStatus=p.tax_status||'taxable',taxClass=p.tax_class||'',manage=!!p.manage_stock;
  return '<section class="slm-advanced-card"><h3>Publish</h3><div class="slm-two-col"><label>Status<select id="slm-status"><option value="publish"'+(p.status==='publish'?' selected':'')+'>Published</option><option value="draft"'+(p.status==='draft'?' selected':'')+'>Draft</option><option value="pending"'+(p.status==='pending'?' selected':'')+'>Pending review</option><option value="private"'+(p.status==='private'?' selected':'')+'>Private</option></select></label><label>Visibility<select id="slm-visibility"><option value="public"'+(visibility==='public'?' selected':'')+'>Public</option><option value="private"'+(visibility==='private'?' selected':'')+'>Private</option></select></label></div><label>Catalog visibility<select id="slm-catalog"><option value="visible"'+(catalog==='visible'?' selected':'')+'>Shop and search results</option><option value="catalog"'+(catalog==='catalog'?' selected':'')+'>Shop only</option><option value="search"'+(catalog==='search'?' selected':'')+'>Search results only</option><option value="hidden"'+(catalog==='hidden'?' selected':'')+'>Hidden</option></select></label></section>'+
  '<section class="slm-advanced-card"><h3>Product data</h3><div class="slm-two-col"><label>Regular price<input id="slm-price" inputmode="decimal" value="'+esc(p.regular_price||'')+'"></label><label>Sale price<input id="slm-sale" inputmode="decimal" value="'+esc(p.sale_price||'')+'"></label></div><div class="slm-two-col"><label>Tax status<select id="slm-tax-status"><option value="taxable"'+(taxStatus==='taxable'?' selected':'')+'>Taxable</option><option value="shipping"'+(taxStatus==='shipping'?' selected':'')+'>Shipping only</option><option value="none"'+(taxStatus==='none'?' selected':'')+'>None</option></select></label><label>Tax class<input id="slm-tax-class" value="'+esc(taxClass)+'" placeholder="Standard"></label></div><div class="slm-two-col"><label>Points Earned<input id="slm-points-earned" value="'+esc(p.points_earned||'')+'"></label><label>Maximum Discount<input id="slm-max-discount" value="'+esc(p.max_points_discount||'')+'"></label></div><label class="slm-advanced-check"><input id="slm-manage-stock" type="checkbox" '+(manage?'checked':'')+'><span>Manage stock</span></label><label>Stock quantity<input id="slm-stock-qty" inputmode="numeric" value="'+esc(p.stock_quantity==null?'':p.stock_quantity)+'"></label><label>Stock status<select id="slm-stock"><option value="instock"'+(p.stock_status==='instock'?' selected':'')+'>In stock</option><option value="outofstock"'+(p.stock_status==='outofstock'?' selected':'')+'>Out of stock</option><option value="onbackorder"'+(p.stock_status==='onbackorder'?' selected':'')+'>On backorder</option></select></label></section>'+
  brandPicker(p)+
  '<section class="slm-advanced-card"><h3>Product tags</h3><input id="slm-tags" value="'+esc((p.tags||[]).join(', '))+'" placeholder="Separate tags with commas"></section>'+
  '<section class="slm-advanced-card"><h3>Age Gate</h3><label class="slm-advanced-check"><input id="slm-age-restricted" type="checkbox" '+(p.age_restricted?'checked':'')+'><span>Restricted to 18</span></label></section>'+
  '<section class="slm-advanced-card"><h3>Product Options</h3><label class="slm-advanced-check"><input id="slm-fullscreen-desc" type="checkbox" '+(p.fullscreen_description?'checked':'')+'><span>Fullscreen Description</span></label><label>Header Transparency<select id="slm-header-transparency"><option value="inherit"'+((p.header_transparency||'inherit')==='inherit'?' selected':'')+'>Inherit Customizer Option</option><option value="on"'+(p.header_transparency==='on'?' selected':'')+'>On</option><option value="off"'+(p.header_transparency==='off'?' selected':'')+'>Off</option></select></label><label>Layout<select id="slm-layout"><option value="inherit"'+((p.product_layout||'inherit')==='inherit'?' selected':'')+'>Inherit</option><option value="default"'+(p.product_layout==='default'?' selected':'')+'>Default</option><option value="fullwidth"'+(p.product_layout==='fullwidth'?' selected':'')+'>Full width</option><option value="sidebar"'+(p.product_layout==='sidebar'?' selected':'')+'>Sidebar</option></select></label><label>YouTube Video<input id="slm-youtube-video" value="'+esc(p.youtube_video||'')+'" placeholder="https://youtube.com/…"></label></section>';
}
'''
anchor = 'function editorPanel(){'
pos = merchant.find(anchor)
if pos < 0:
    raise SystemExit('merchant editorPanel anchor missing')
merchant = merchant[:pos] + advanced_helpers + merchant[pos:]

merchant = replace_func(merchant, 'editorPanel', r'''function editorPanel(){
  if(!state.editor)return '<section class="slm-panel" id="slm-panel"></section>';
  var p=state.editor,creating=!p.id,busy=!!p._mediaBusy;
  return '<section class="slm-panel open" id="slm-panel">'+
    '<div class="slm-panel-head"><button data-act="close-editor" aria-label="Back">←</button><h1>'+(creating?'New Product':'Edit Product')+'</h1><button data-act="close-editor" aria-label="Close">×</button></div>'+
    '<div class="slm-form"><label>Name</label><input id="slm-name" value="'+esc(p.name||'')+'">'+productLinkField(p,creating)+editorMedia(p)+
    '<section class="slm-advanced-card"><h3>Inventory</h3><label>SKU<input id="slm-sku" value="'+esc(p.sku||'')+'"></label></section>'+
    advancedProductFields(p)+categoryPicker()+
    '<section class="slm-advanced-card"><h3>Descriptions</h3><label>Short description<textarea id="slm-desc">'+esc(p.short_description||'')+'</textarea></label><label>Full description<textarea id="slm-description">'+esc(p.description||'')+'</textarea></label></section>'+
    '<div class="slm-form-actions"><button class="slm-cancel" data-act="close-editor" '+(busy?'disabled':'')+'>CANCEL</button><button class="slm-save" data-act="save-product" '+(busy?'disabled':'')+'>'+(busy?'UPLOADING…':(creating?'CREATE':'UPDATE'))+'</button></div></div></section>';
}''')

merchant = replace_func(merchant, 'openEditor', r'''function openEditor(id){
  state.catSearch='';state.selectedCats=[];
  if(!id){state.editor={id:0,name:'',sku:'',status:'publish',visibility:'public',catalog_visibility:'visible',regular_price:'',sale_price:'',tax_status:'taxable',tax_class:'',points_earned:'',max_points_discount:'',manage_stock:false,stock_quantity:'',stock_status:'instock',short_description:'',description:'',categories:[],tags:[],brands:[],brand_ids:[],age_restricted:true,fullscreen_description:false,header_transparency:'inherit',product_layout:'inherit',youtube_video:'',permalink:'',image:'',image_id:0,gallery:[],gallery_ids:[]};render();return;}
  var cached=null,data=state.productsByView.products||state.productsByView.stock;
  if(data&&data.items)data.items.some(function(p){if(Number(p.id)===Number(id)){cached=p;return true;}return false;});
  state.editor=cached||{id:Number(id),name:'',status:'publish',visibility:'public',catalog_visibility:'visible',stock_status:'instock',categories:[],tags:[],brands:[],brand_ids:[],image:'',image_id:0,gallery:[],gallery_ids:[]};
  if(!Array.isArray(state.editor.gallery))state.editor.gallery=[];if(!Array.isArray(state.editor.gallery_ids))state.editor.gallery_ids=[];if(!Array.isArray(state.editor.tags))state.editor.tags=[];if(!Array.isArray(state.editor.brand_ids))state.editor.brand_ids=[];
  state.selectedCats=(state.editor.categories||[]).map(function(c){return Number(c.id);});render();
  api('merchant/product/'+id).then(function(p){state.editor=p;if(!Array.isArray(state.editor.gallery))state.editor.gallery=[];if(!Array.isArray(state.editor.gallery_ids))state.editor.gallery_ids=[];if(!Array.isArray(state.editor.tags))state.editor.tags=[];if(!Array.isArray(state.editor.brand_ids))state.editor.brand_ids=[];state.selectedCats=(p.categories||[]).map(function(c){return Number(c.id);});render();}).catch(function(){});
}''')

merchant = replace_func(merchant, 'saveProduct', r'''function saveProduct(){
  if(!state.editor||state.editor._mediaBusy)return;
  var brandIds=[];root.querySelectorAll('[data-brand-check]:checked').forEach(function(e){brandIds.push(Number(e.dataset.brandCheck));});
  var tags=val('slm-tags').split(',').map(function(x){return x.trim();}).filter(Boolean);
  var body={name:val('slm-name'),sku:val('slm-sku'),status:val('slm-status'),visibility:val('slm-visibility'),catalog_visibility:val('slm-catalog'),regular_price:val('slm-price'),sale_price:val('slm-sale'),tax_status:val('slm-tax-status'),tax_class:val('slm-tax-class'),points_earned:val('slm-points-earned'),max_points_discount:val('slm-max-discount'),manage_stock:!!(document.getElementById('slm-manage-stock')&&document.getElementById('slm-manage-stock').checked),stock_quantity:val('slm-stock-qty'),stock_status:val('slm-stock'),short_description:val('slm-desc'),description:val('slm-description'),category_ids:state.selectedCats.slice(),brand_ids:brandIds,tags:tags,age_restricted:!!(document.getElementById('slm-age-restricted')&&document.getElementById('slm-age-restricted').checked),fullscreen_description:!!(document.getElementById('slm-fullscreen-desc')&&document.getElementById('slm-fullscreen-desc').checked),header_transparency:val('slm-header-transparency'),product_layout:val('slm-layout'),youtube_video:val('slm-youtube-video'),ensure_artwork:true,image_id:Number(state.editor.image_id)||0,gallery_ids:Array.isArray(state.editor.gallery_ids)?state.editor.gallery_ids.map(Number).filter(function(id){return id>0;}):[]};
  var btn=document.querySelector('[data-act="save-product"]');if(btn){btn.disabled=true;btn.textContent='SAVING…';}
  var path=state.editor.id?'merchant/product/'+state.editor.id:'merchant/product';
  api(path,{method:'POST',body:JSON.stringify(body)}).then(function(saved){cdelPrefix('slm-products-');state.searchPools={products:null,stock:null};state.productsByView={products:null,stock:null};state.editor=null;state.query='';state.categoryId=0;state.stockStatus='all';state.page=1;state.view='products';render();loadProducts(false,true);if(saved&&saved.permalink){try{navigator.clipboard&&navigator.clipboard.writeText(saved.permalink);}catch(e){}}}).catch(function(){if(btn){btn.disabled=false;btn.textContent=state.editor&&state.editor.id?'UPDATE':'CREATE';}alert('Could not save product.');});
}''')
merchant_path.write_text(merchant, encoding='utf-8')

# -----------------------------------------------------------------------------
# PHP — product taxonomy/data/meta support and safe artwork preparation.
# -----------------------------------------------------------------------------
main_path = root / 'shishalove-app-bridge.php'
main = main_path.read_text(encoding='utf-8')

helpers = r'''function slb_product_brand_taxonomy() {
    foreach (array('product_brand','pwb-brand','yith_product_brand','product_brands') as $tax) { if (taxonomy_exists($tax)) { return $tax; } }
    return '';
}
function slb_merchant_brands() {
    $tax = slb_product_brand_taxonomy(); if (!$tax) { return array(); }
    $terms = get_terms(array('taxonomy'=>$tax,'hide_empty'=>false,'orderby'=>'name','order'=>'ASC'));
    if (is_wp_error($terms)) { return array(); }
    return array_values(array_map(function($t){ return array('id'=>(int)$t->term_id,'name'=>$t->name,'slug'=>$t->slug); }, $terms));
}
function slb_meta_first($id, $keys, $default='') {
    foreach ((array)$keys as $key) { if (metadata_exists('post',$id,$key)) { return get_post_meta($id,$key,true); } }
    return $default;
}
function slb_meta_write_alias($id, $value, $keys, $fallback) {
    foreach ((array)$keys as $key) { if (metadata_exists('post',$id,$key)) { update_post_meta($id,$key,$value); return; } }
    update_post_meta($id,$fallback,$value);
}
function slb_ensure_product_artwork($id) {
    $id=absint($id); if(!$id) return $id;
    if(get_post_meta($id,'_slb_product_artwork_600_watermark',true)==='1') return $id;
    $meta=wp_get_attachment_metadata($id);
    if(is_array($meta) && (int)($meta['width']??0)===600 && (int)($meta['height']??0)===600) return $id;
    slb_prepare_product_artwork($id); return $id;
}

'''
anchor = 'function slb_merchant_bootstrap() {'
pos = main.find(anchor)
if pos < 0:
    raise SystemExit('merchant bootstrap anchor missing')
main = main[:pos] + helpers + main[pos:]
main = main.replace("        'categories' => slb_merchant_categories(),\n        'nonce' => wp_create_nonce('wp_rest'),", "        'categories' => slb_merchant_categories(),\n        'brands' => slb_merchant_brands(),\n        'nonce' => wp_create_nonce('wp_rest'),", 1)

payload_anchor = "    return array(\n        'id' => (int) $product->get_id(),"
pos = main.find(payload_anchor)
if pos < 0:
    raise SystemExit('product payload anchor missing')
main = main[:pos] + "    $brand_tax = slb_product_brand_taxonomy();\n    $brand_ids = array(); $brands = array();\n    if ($brand_tax) { $bt = get_the_terms($product->get_id(), $brand_tax); if ($bt && !is_wp_error($bt)) { foreach ($bt as $t) { $brand_ids[]=(int)$t->term_id; $brands[]=array('id'=>(int)$t->term_id,'name'=>$t->name,'slug'=>$t->slug); } } }\n    $tags = wp_get_post_terms($product->get_id(), 'product_tag', array('fields'=>'names')); if (is_wp_error($tags)) { $tags=array(); }\n" + main[pos:]

old = "        'stock_quantity' => $product->get_stock_quantity(),\n        'short_description' => wp_strip_all_tags($product->get_short_description()),"
new = "        'stock_quantity' => $product->get_stock_quantity(),\n        'visibility' => $product->get_status()==='private' ? 'private' : 'public',\n        'catalog_visibility' => $product->get_catalog_visibility(),\n        'tax_status' => $product->get_tax_status(),\n        'tax_class' => $product->get_tax_class(),\n        'tags' => array_values($tags),\n        'brand_taxonomy' => $brand_tax,\n        'brands' => $brands,\n        'brand_ids' => $brand_ids,\n        'points_earned' => (string) slb_meta_first($product->get_id(), array('_wc_points_earned','_ywpar_point_earned','point_earned'), ''),\n        'max_points_discount' => (string) slb_meta_first($product->get_id(), array('_wc_points_max_discount','_ywpar_max_point_discount','max_point_discount'), ''),\n        'age_restricted' => (bool) slb_meta_first($product->get_id(), array('_age_gate','age_gate','_age_gate_restricted','_slb_age_restricted'), false),\n        'fullscreen_description' => (bool) slb_meta_first($product->get_id(), array('_product_fullscreen_description','product_fullscreen_description','_fullscreen_description','_slb_fullscreen_description'), false),\n        'header_transparency' => (string) slb_meta_first($product->get_id(), array('_header_transparency','header_transparency','_product_header_transparency','_slb_header_transparency'), 'inherit'),\n        'product_layout' => (string) slb_meta_first($product->get_id(), array('_product_layout','product_layout','_layout','_slb_product_layout'), 'inherit'),\n        'youtube_video' => (string) slb_meta_first($product->get_id(), array('_youtube_video','youtube_video','_product_youtube_video','_slb_youtube_video'), ''),\n        'short_description' => wp_strip_all_tags($product->get_short_description()),"
if old not in main:
    raise SystemExit('product payload field anchor missing')
main = main.replace(old, new, 1)

old = "    if (array_key_exists('stock_status', $body) && in_array($body['stock_status'], array('instock','outofstock','onbackorder'), true)) { $product->set_stock_status($body['stock_status']); }\n    if (array_key_exists('image_id', $body)) { $product->set_image_id(absint($body['image_id'])); }"
new = "    if (array_key_exists('stock_status', $body) && in_array($body['stock_status'], array('instock','outofstock','onbackorder'), true)) { $product->set_stock_status($body['stock_status']); }\n    if (array_key_exists('catalog_visibility',$body) && in_array($body['catalog_visibility'],array('visible','catalog','search','hidden'),true)) { $product->set_catalog_visibility($body['catalog_visibility']); }\n    if (array_key_exists('tax_status',$body) && in_array($body['tax_status'],array('taxable','shipping','none'),true)) { $product->set_tax_status($body['tax_status']); }\n    if (array_key_exists('tax_class',$body)) { $product->set_tax_class(sanitize_title($body['tax_class'])==='standard' ? '' : sanitize_title($body['tax_class'])); }\n    if (!empty($body['visibility']) && $body['visibility']==='private') { $product->set_status('private'); } elseif (($body['visibility']??'public')==='public' && $product->get_status()==='private') { $product->set_status(in_array(($body['status']??'publish'),array('publish','draft','pending'),true)?$body['status']:'publish'); }\n    if (array_key_exists('image_id', $body)) { $img=absint($body['image_id']); if(!empty($body['ensure_artwork']) && $img){ $img=slb_ensure_product_artwork($img); } $product->set_image_id($img); }"
if old not in main:
    raise SystemExit('save product core anchor missing')
main = main.replace(old, new, 1)

old = "    if (array_key_exists('category_ids', $body) && is_array($body['category_ids'])) {\n        $category_ids = array_values(array_unique(array_filter(array_map('absint', $body['category_ids']))));\n        wp_set_object_terms($saved_id, $category_ids, 'product_cat', false);\n    }\n    clean_post_cache($saved_id);"
new = "    if (array_key_exists('category_ids', $body) && is_array($body['category_ids'])) {\n        $category_ids = array_values(array_unique(array_filter(array_map('absint', $body['category_ids']))));\n        wp_set_object_terms($saved_id, $category_ids, 'product_cat', false);\n    }\n    if (array_key_exists('tags',$body) && is_array($body['tags'])) { $tags=array_values(array_filter(array_map('sanitize_text_field',$body['tags']))); wp_set_object_terms($saved_id,$tags,'product_tag',false); }\n    $brand_tax=slb_product_brand_taxonomy(); if($brand_tax && array_key_exists('brand_ids',$body) && is_array($body['brand_ids'])) { wp_set_object_terms($saved_id,array_values(array_unique(array_filter(array_map('absint',$body['brand_ids'])))),$brand_tax,false); }\n    if(array_key_exists('points_earned',$body)) slb_meta_write_alias($saved_id,sanitize_text_field($body['points_earned']),array('_wc_points_earned','_ywpar_point_earned','point_earned'),'_wc_points_earned');\n    if(array_key_exists('max_points_discount',$body)) slb_meta_write_alias($saved_id,sanitize_text_field($body['max_points_discount']),array('_wc_points_max_discount','_ywpar_max_point_discount','max_point_discount'),'_wc_points_max_discount');\n    if(array_key_exists('age_restricted',$body)) slb_meta_write_alias($saved_id,!empty($body['age_restricted'])?'1':'0',array('_age_gate','age_gate','_age_gate_restricted'),'_slb_age_restricted');\n    if(array_key_exists('fullscreen_description',$body)) slb_meta_write_alias($saved_id,!empty($body['fullscreen_description'])?'1':'0',array('_product_fullscreen_description','product_fullscreen_description','_fullscreen_description'),'_slb_fullscreen_description');\n    if(array_key_exists('header_transparency',$body)) slb_meta_write_alias($saved_id,sanitize_text_field($body['header_transparency']),array('_header_transparency','header_transparency','_product_header_transparency'),'_slb_header_transparency');\n    if(array_key_exists('product_layout',$body)) slb_meta_write_alias($saved_id,sanitize_text_field($body['product_layout']),array('_product_layout','product_layout','_layout'),'_slb_product_layout');\n    if(array_key_exists('youtube_video',$body)) slb_meta_write_alias($saved_id,esc_url_raw($body['youtube_video']),array('_youtube_video','youtube_video','_product_youtube_video'),'_slb_youtube_video');\n    clean_post_cache($saved_id);"
if old not in main:
    raise SystemExit('save product taxonomy/meta anchor missing')
main = main.replace(old, new, 1)
main_path.write_text(main, encoding='utf-8')

# -----------------------------------------------------------------------------
# CSS — direct natural media sizing and advanced editor layout.
# -----------------------------------------------------------------------------
css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')
css += r'''

/* ShishaLove 1.1.29 — final product-media and complete merchant product fields */
body.slb-customer .slb-product-image:not(.slb-product-placeholder){padding:0!important;overflow:hidden!important;position:relative!important}
body.slb-customer .slb-product-image:not(.slb-product-placeholder)>img{
  position:absolute!important;inset:10px!important;margin:auto!important;width:auto!important;height:auto!important;
  max-width:calc(100% - 20px)!important;max-height:calc(100% - 20px)!important;object-fit:contain!important;object-position:center!important;
  transform:none!important;padding:0!important;background:#fff!important;
}
body.slb-merchant .slm-media-library-grid,body.slb-merchant .slm-manager-grid{grid-auto-rows:max-content!important;align-items:start!important}
body.slb-merchant .slm-library-tile{display:block!important;height:auto!important;min-height:0!important;overflow:hidden!important}
body.slb-merchant .slm-library-select{display:block!important;height:auto!important;min-height:0!important;overflow:visible!important}
body.slb-merchant .slm-library-preview{
  display:block!important;width:100%!important;height:auto!important;aspect-ratio:1/1!important;max-width:none!important;max-height:none!important;
  object-fit:contain!important;object-position:center!important;padding:8px!important;margin:0!important;background:#fff!important;border-bottom:1px solid #eee!important;
}
body.slb-merchant .slm-library-thumb{display:none!important}
body.slb-merchant .slm-advanced-card{border:1px solid #e5e5e7;border-radius:14px;padding:14px;margin:16px 0;background:#fff}
body.slb-merchant .slm-advanced-card h3{margin:0 0 10px;font-size:17px}
body.slb-merchant .slm-advanced-card label{display:block;margin:10px 0 6px;font-size:13px;font-weight:800}
body.slb-merchant .slm-advanced-card input:not([type=checkbox]),body.slb-merchant .slm-advanced-card select,body.slb-merchant .slm-advanced-card textarea{width:100%;margin-top:6px}
body.slb-merchant .slm-two-col{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
body.slb-merchant .slm-advanced-check{display:flex!important;align-items:center;gap:10px;min-height:38px}
body.slb-merchant .slm-advanced-check input{width:22px!important;height:22px!important;min-width:22px;margin:0!important}
body.slb-merchant .slm-brand-list{max-height:220px;overflow:auto;border:1px solid #eee;border-radius:10px;padding:6px 10px}
@media(max-width:390px){body.slb-merchant .slm-two-col{grid-template-columns:1fr}}
'''
css_path.write_text(css, encoding='utf-8')

print('ShishaLove 1.1.29: full media previews, full customer images and complete Merchant product controls added')
