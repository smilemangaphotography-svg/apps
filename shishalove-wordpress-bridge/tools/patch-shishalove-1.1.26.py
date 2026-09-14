#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.26.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.25.py'), str(root)])


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'{label}: expected anchor not found')
    if text.count(old) != 1:
        raise SystemExit(f'{label}: expected exactly one anchor, found {text.count(old)}')
    return text.replace(old, new, 1)


def replace_between(text, start, end, replacement, label):
    s = text.find(start)
    if s < 0:
        raise SystemExit(f'{label}: start marker missing')
    e = text.find(end, s)
    if e < 0:
        raise SystemExit(f'{label}: end marker missing')
    return text[:s] + replacement.rstrip() + '\n' + text[e:]

# -----------------------------------------------------------------------------
# CUSTOMER — only two corrections:
# 1) Give nav labels an explicit element so Android/WebView theme rules cannot fade
#    the raw button text independently from the icon.
# 2) Give real product artwork a stronger safe inset at the card/container level.
#    WooCommerce placeholder/Hose Gasket remains explicitly exempt.
# -----------------------------------------------------------------------------
customer_path = root / 'assets' / 'customer.js'
customer = customer_path.read_text(encoding='utf-8')
customer = replace_once(
    customer,
    "return '<nav class=\"slb-bottom\">'+items.map(function(x){return '<button data-nav=\"'+x[0]+'\" class=\"'+(active===x[0]?'active':'')+'\"><i>'+x[1]+'</i>'+x[2]+'</button>';}).join('')+'</nav>';",
    "return '<nav class=\"slb-bottom\">'+items.map(function(x){return '<button data-nav=\"'+x[0]+'\" class=\"'+(active===x[0]?'active':'')+'\"><i>'+x[1]+'</i><span class=\"slb-bottom-label\">'+x[2]+'</span></button>';}).join('')+'</nav>';",
    'customer bottom label wrapper'
)
customer = replace_once(
    customer,
    "'<article class=\"slb-product\"><div class=\"slb-product-image\"><button class=\"slb-heart '",
    "'<article class=\"slb-product\"><div class=\"slb-product-image'+((/placeholder|woocommerce-placeholder/i.test(String(p.image||'')))?' slb-product-placeholder':'')+'\"><button class=\"slb-heart '",
    'customer placeholder class'
)
customer_path.write_text(customer, encoding='utf-8')

# -----------------------------------------------------------------------------
# MERCHANT — restore device/phone upload ALONGSIDE WordPress Media Library, make
# Media Library imagery genuinely readable, and add a permanent standalone Media
# Library manager under More. Existing WooCommerce attachment IDs remain canonical.
# -----------------------------------------------------------------------------
merchant_path = root / 'assets' / 'merchant.js'
merchant = merchant_path.read_text(encoding='utf-8')

media_block = r'''
var mediaPicker={open:false,mode:'main',page:1,pages:1,search:'',items:[],selected:{},loading:false};
var mediaManager={page:1,pages:1,search:'',items:[],loading:false};
function editorMedia(p){
  var gallery=Array.isArray(p.gallery)?p.gallery:[],main=p.image||'',busy=!!p._mediaBusy,status=p._mediaStatus||'';
  return '<section class="slm-media-editor"><label>Product image</label><div class="slm-main-media">'+(main?'<img src="'+esc(main)+'" alt="Product image">':'<div class="slm-media-empty">No product image</div>')+'</div><div class="slm-media-actions"><label class="slm-media-pick '+(busy?'disabled':'')+'" for="slm-main-image-input">'+(main?'CHANGE IMAGE':'ADD IMAGE')+'</label><input id="slm-main-image-input" type="file" accept="image/*" '+(busy?'disabled':'')+' hidden><button type="button" class="slm-media-pick" data-media-open="main">MEDIA LIBRARY</button>'+(main?'<button type="button" class="slm-media-remove" data-media-remove-main>REMOVE</button>':'')+'</div><div class="slm-media-spec">Phone upload and WordPress Media Library are both available. Existing 1:1 ShishaLove artwork is preserved exactly as stored.</div><div class="slm-gallery-head"><label>Product gallery</label><div class="slm-media-actions"><label class="slm-media-pick '+(busy?'disabled':'')+'" for="slm-gallery-input">+ ADD PHOTOS</label><input id="slm-gallery-input" type="file" accept="image/*" multiple '+(busy?'disabled':'')+' hidden><button type="button" class="slm-media-pick" data-media-open="gallery">MEDIA LIBRARY</button></div></div><div class="slm-gallery-grid">'+(gallery.length?gallery.map(function(src,i){return '<div class="slm-gallery-item"><img src="'+esc(src)+'" alt="Gallery image"><button type="button" data-gallery-remove="'+i+'" aria-label="Remove from product gallery">×</button></div>';}).join(''):'<div class="slm-media-empty">No gallery images</div>')+'</div>'+(status?'<div class="slm-media-status">'+esc(status)+'</div>':'')+'</section>'+mediaLibraryModal();
}
function libraryTile(m,selectable,selected){
  var dim=(m.width&&m.height)?(m.width+' × '+m.height):'',ideal=(Number(m.width)===600&&Number(m.height)===600),id=Number(m.id)||0;
  var action=selectable?' data-media-select="'+id+'"':' data-media-preview="'+id+'"';
  return '<article class="slm-library-tile '+(selected?'selected ':'')+(ideal?'ideal':'')+'"><button type="button" class="slm-library-select"'+action+'><span class="slm-library-thumb"><img src="'+esc(m.thumb_url||m.source_url||'')+'" alt="'+esc(m.title||'Media')+'"></span><span class="slm-library-title">'+esc(m.title||('Media #'+id))+'</span><small>'+esc(dim)+(ideal?' · 1:1':'')+'</small></button><button type="button" class="slm-library-delete" data-media-delete="'+id+'">DELETE PERMANENTLY</button></article>';
}
function mediaLibraryModal(){
  if(!mediaPicker.open)return '';
  var items=mediaPicker.items||[];
  var grid=mediaPicker.loading?'<div class="slm-media-library-loading">Loading WordPress Media Library…</div>':items.length?items.map(function(m){return libraryTile(m,true,!!mediaPicker.selected[m.id]);}).join(''):'<div class="slm-media-library-loading">No media found.</div>';
  return '<div class="slm-media-library-modal"><div class="slm-media-library-card"><div class="slm-media-library-head"><div><h2>WordPress Media Library</h2><p>'+(mediaPicker.mode==='main'?'Choose featured product image':'Choose product gallery images')+'</p></div><button type="button" data-media-close>×</button></div><div class="slm-media-library-search"><input id="slm-media-search" value="'+esc(mediaPicker.search)+'" placeholder="Search Media Library"><button type="button" data-media-search>Search</button></div><div class="slm-media-library-grid">'+grid+'</div><div class="slm-media-library-footer"><button type="button" data-media-prev '+(mediaPicker.page<=1?'disabled':'')+'>← Previous</button><strong>Page '+mediaPicker.page+' / '+mediaPicker.pages+'</strong><button type="button" data-media-next '+(mediaPicker.page>=mediaPicker.pages?'disabled':'')+'>Next →</button></div>'+(mediaPicker.mode==='gallery'?'<button type="button" class="slm-media-library-add" data-media-confirm>ADD SELECTED TO GALLERY</button>':'')+'</div></div>';
}
function mediaItemById(id){id=Number(id);for(var i=0;i<mediaPicker.items.length;i++)if(Number(mediaPicker.items[i].id)===id)return mediaPicker.items[i];return null;}
function openMediaLibrary(mode){mediaPicker.open=true;mediaPicker.mode=mode==='gallery'?'gallery':'main';mediaPicker.page=1;mediaPicker.pages=1;mediaPicker.search='';mediaPicker.items=[];mediaPicker.selected={};mediaPicker.loading=true;renderEditorOnly();loadMediaLibrary();}
function closeMediaLibrary(){mediaPicker.open=false;mediaPicker.loading=false;mediaPicker.selected={};renderEditorOnly();}
function loadMediaLibrary(){if(!mediaPicker.open)return;mediaPicker.loading=true;renderEditorOnly();api('merchant/media?page='+mediaPicker.page+'&per_page=20&search='+encodeURIComponent(mediaPicker.search||'')).then(function(d){if(!mediaPicker.open)return;mediaPicker.items=d.items||[];mediaPicker.pages=Math.max(1,Number(d.pages||1));if(mediaPicker.page>mediaPicker.pages)mediaPicker.page=mediaPicker.pages;mediaPicker.loading=false;renderEditorOnly();}).catch(function(){mediaPicker.loading=false;mediaPicker.items=[];renderEditorOnly();});}
function chooseLibraryMedia(id){if(!state.editor)return;var item=mediaItemById(id);if(!item)return;if(mediaPicker.mode==='main'){state.editor.image=item.source_url||item.thumb_url||'';state.editor.image_id=Number(item.id)||0;mediaPicker.open=false;mediaPicker.selected={};renderEditorOnly();return;}id=Number(id);if(mediaPicker.selected[id])delete mediaPicker.selected[id];else mediaPicker.selected[id]=item;renderEditorOnly();}
function confirmGalleryMedia(){if(!state.editor)return;if(!Array.isArray(state.editor.gallery))state.editor.gallery=[];if(!Array.isArray(state.editor.gallery_ids))state.editor.gallery_ids=[];var existing={};state.editor.gallery_ids.forEach(function(id){existing[Number(id)]=true;});Object.keys(mediaPicker.selected).forEach(function(k){var m=mediaPicker.selected[k],id=Number(m.id)||0;if(!id||existing[id])return;existing[id]=true;state.editor.gallery_ids.push(id);state.editor.gallery.push(m.source_url||m.thumb_url||'');});mediaPicker.open=false;mediaPicker.selected={};renderEditorOnly();}
function removeGalleryImage(index){if(!state.editor)return;index=Number(index);if(!Array.isArray(state.editor.gallery))state.editor.gallery=[];if(!Array.isArray(state.editor.gallery_ids))state.editor.gallery_ids=[];state.editor.gallery.splice(index,1);state.editor.gallery_ids.splice(index,1);renderEditorOnly();}
function removeMainImage(){if(!state.editor)return;state.editor.image='';state.editor.image_id=0;renderEditorOnly();}
function uploadMerchantMedia(file){var fd=new FormData();fd.append('file',file,file.name||'product-image.jpg');var h={};if(CFG.restNonce)h['X-WP-Nonce']=CFG.restNonce;return fetch(CFG.rest+'merchant/media',{method:'POST',credentials:'same-origin',headers:h,body:fd}).then(function(r){if(!r.ok)throw new Error('Media HTTP '+r.status);return r.json();});}
function uploadMerchantMediaList(files,index,out){if(index>=files.length)return Promise.resolve(out);return uploadMerchantMedia(files[index]).then(function(row){out.push(row);return uploadMerchantMediaList(files,index+1,out);});}
function chooseEditorFiles(files,isGallery){
  if(!state.editor||!files||!files.length)return;var list=Array.prototype.slice.call(files);if(!isGallery)list=list.slice(0,1);state.editor._mediaBusy=true;state.editor._mediaStatus='Uploading image'+(list.length>1?'s':'')+'…';renderEditorOnly();
  uploadMerchantMediaList(list,0,[]).then(function(rows){if(!state.editor)return;if(isGallery){if(!Array.isArray(state.editor.gallery))state.editor.gallery=[];if(!Array.isArray(state.editor.gallery_ids))state.editor.gallery_ids=[];rows.forEach(function(row){state.editor.gallery.push(row.source_url||'');state.editor.gallery_ids.push(Number(row.id)||0);});}else if(rows[0]){state.editor.image=rows[0].source_url||state.editor.image||'';state.editor.image_id=Number(rows[0].id)||0;}state.editor._mediaBusy=false;state.editor._mediaStatus='';renderEditorOnly();}).catch(function(){if(state.editor){state.editor._mediaBusy=false;state.editor._mediaStatus='Image upload failed. Try again.';renderEditorOnly();}});
}
function deleteLibraryMedia(id,fromManager){
  id=Number(id);var item=mediaItemById(id);if(fromManager){for(var j=0;j<mediaManager.items.length;j++)if(Number(mediaManager.items[j].id)===id){item=mediaManager.items[j];break;}}
  if(!id)return;if(!window.confirm('Delete '+((item&&item.title)||('media #'+id))+' permanently from the WordPress Media Library? This cannot be undone and may affect products using this image.'))return;
  api('merchant/media/'+id,{method:'DELETE'}).then(function(){delete mediaPicker.selected[id];if(state.editor){if(Number(state.editor.image_id)===id){state.editor.image='';state.editor.image_id=0;}if(Array.isArray(state.editor.gallery_ids)){for(var i=state.editor.gallery_ids.length-1;i>=0;i--){if(Number(state.editor.gallery_ids[i])===id){state.editor.gallery_ids.splice(i,1);state.editor.gallery.splice(i,1);}}}}if(fromManager)loadMediaManager(true);else loadMediaLibrary();}).catch(function(){alert('Could not delete this Media Library item.');});
}
function mediaManagerGrid(){var items=mediaManager.items||[];if(mediaManager.loading)return '<div class="slm-media-library-loading">Loading WordPress Media Library…</div>';if(!items.length)return '<div class="slm-media-library-loading">No media found.</div>';return items.map(function(m){return libraryTile(m,false,false);}).join('');}
function merchantMediaLibraryBody(){return '<main class="slm-page slm-media-manager-page"><div class="slm-head"><div><button class="slm-inline-back" data-view="more">←</button><h1>Media Library</h1><div class="slm-muted">Manage WordPress product images</div></div></div><div class="slm-media-library-search slm-manager-search"><input id="slm-manager-search" value="'+esc(mediaManager.search)+'" placeholder="Search Media Library"><button type="button" data-media-manager-search>Search</button></div><div class="slm-manager-grid">'+mediaManagerGrid()+'</div><div class="slm-media-library-footer slm-manager-footer"><button type="button" data-media-manager-prev '+(mediaManager.page<=1?'disabled':'')+'>← Previous</button><strong>Page '+mediaManager.page+' / '+mediaManager.pages+'</strong><button type="button" data-media-manager-next '+(mediaManager.page>=mediaManager.pages?'disabled':'')+'>Next →</button></div></main>';}
function loadMediaManager(force){if(state.view!=='media-library')return;if(mediaManager.loading&&!force)return;mediaManager.loading=true;render();api('merchant/media?page='+mediaManager.page+'&per_page=20&search='+encodeURIComponent(mediaManager.search||'')).then(function(d){if(state.view!=='media-library')return;mediaManager.items=d.items||[];mediaManager.pages=Math.max(1,Number(d.pages||1));if(mediaManager.page>mediaManager.pages)mediaManager.page=mediaManager.pages;mediaManager.loading=false;render();}).catch(function(){mediaManager.loading=false;mediaManager.items=[];render();});}
function bindMediaControls(){
  var main=document.getElementById('slm-main-image-input');if(main)main.onchange=function(){chooseEditorFiles(this.files,false);};
  var gallery=document.getElementById('slm-gallery-input');if(gallery)gallery.onchange=function(){chooseEditorFiles(this.files,true);};
  root.querySelectorAll('[data-media-open]').forEach(function(e){e.onclick=function(){openMediaLibrary(this.dataset.mediaOpen);};});
  root.querySelectorAll('[data-media-close]').forEach(function(e){e.onclick=closeMediaLibrary;});
  root.querySelectorAll('[data-media-select]').forEach(function(e){e.onclick=function(){chooseLibraryMedia(this.dataset.mediaSelect);};});
  root.querySelectorAll('[data-media-delete]').forEach(function(e){e.onclick=function(ev){ev.stopPropagation();deleteLibraryMedia(this.dataset.mediaDelete,state.view==='media-library');};});
  root.querySelectorAll('[data-gallery-remove]').forEach(function(e){e.onclick=function(){removeGalleryImage(this.dataset.galleryRemove);};});
  root.querySelectorAll('[data-media-remove-main]').forEach(function(e){e.onclick=removeMainImage;});
  root.querySelectorAll('[data-media-confirm]').forEach(function(e){e.onclick=confirmGalleryMedia;});
  root.querySelectorAll('[data-media-prev]').forEach(function(e){e.onclick=function(){if(mediaPicker.page>1){mediaPicker.page--;loadMediaLibrary();}};});
  root.querySelectorAll('[data-media-next]').forEach(function(e){e.onclick=function(){if(mediaPicker.page<mediaPicker.pages){mediaPicker.page++;loadMediaLibrary();}};});
  root.querySelectorAll('[data-media-search]').forEach(function(e){e.onclick=function(){var s=document.getElementById('slm-media-search');mediaPicker.search=(s&&s.value||'').trim();mediaPicker.page=1;loadMediaLibrary();};});
  var search=document.getElementById('slm-media-search');if(search)search.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();var b=document.querySelector('[data-media-search]');if(b)b.click();}};
  root.querySelectorAll('[data-media-manager-search]').forEach(function(e){e.onclick=function(){var s=document.getElementById('slm-manager-search');mediaManager.search=(s&&s.value||'').trim();mediaManager.page=1;loadMediaManager(true);};});
  root.querySelectorAll('[data-media-manager-prev]').forEach(function(e){e.onclick=function(){if(mediaManager.page>1){mediaManager.page--;loadMediaManager(true);}};});
  root.querySelectorAll('[data-media-manager-next]').forEach(function(e){e.onclick=function(){if(mediaManager.page<mediaManager.pages){mediaManager.page++;loadMediaManager(true);}};});
  var managerSearch=document.getElementById('slm-manager-search');if(managerSearch)managerSearch.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();var b=document.querySelector('[data-media-manager-search]');if(b)b.click();}};
}
'''
merchant = replace_between(merchant, 'var mediaPicker=', 'function editorPanel(){', media_block, 'merchant media block')

more_body = r'''function moreBody(){var u=state.bootstrap&&state.bootstrap.user||{};return '<main class="slm-page"><div class="slm-head"><div><h1>More</h1><div class="slm-muted">Signed in as '+esc(u.name||'WordPress user')+'</div></div></div><div class="slb-account-card">Bridge '+esc(CFG.version)+'</div><button class="slb-account-card slm-account-button" data-view="media-library">Media Library</button><a class="slb-account-card" href="'+esc(CFG.site)+'wp-admin/">Open WordPress Admin</a><a class="slb-account-card" href="'+esc(CFG.site)+'wp-admin/admin.php?page=wc-admin">WooCommerce Admin</a></main>';}
'''
merchant = replace_between(merchant, 'function moreBody(){', 'function categoryData(){', more_body, 'merchant More body')
merchant = replace_once(
    merchant,
    "var body=state.view==='dashboard'?dashboardBody():state.view==='orders'?ordersBody():state.view==='stock'?productsBody(true):state.view==='more'?moreBody():productsBody(false);",
    "var body=state.view==='dashboard'?dashboardBody():state.view==='orders'?ordersBody():state.view==='stock'?productsBody(true):state.view==='more'?moreBody():state.view==='media-library'?merchantMediaLibraryBody():productsBody(false);",
    'merchant render media library view'
)
merchant = replace_once(
    merchant,
    "function navigate(view){var changed=view!==state.view;if(changed&&(view==='products'||view==='stock')){state.query='';state.categoryId=0;state.stockStatus='all';state.searchPools[view]=null;}state.view=view;state.page=1;hydrateViewFromCache(view);render();if(view==='products')loadProducts(false,false);if(view==='stock')loadProducts(true,false);if(view==='orders')loadOrders(false);}",
    "function navigate(view){var changed=view!==state.view;if(changed&&(view==='products'||view==='stock')){state.query='';state.categoryId=0;state.stockStatus='all';state.searchPools[view]=null;}state.view=view;state.page=1;hydrateViewFromCache(view);render();if(view==='products')loadProducts(false,false);if(view==='stock')loadProducts(true,false);if(view==='orders')loadOrders(false);if(view==='media-library')loadMediaManager(false);}",
    'merchant navigate media library view'
)
merchant = replace_once(
    merchant,
    "function refresh(){if(state.view==='products')loadProducts(false,true);else if(state.view==='stock')loadProducts(true,true);else if(state.view==='orders')loadOrders(true);else bootstrap(true);}",
    "function refresh(){if(state.view==='products')loadProducts(false,true);else if(state.view==='stock')loadProducts(true,true);else if(state.view==='orders')loadOrders(true);else if(state.view==='media-library')loadMediaManager(true);else bootstrap(true);}",
    'merchant refresh media library view'
)
merchant_path.write_text(merchant, encoding='utf-8')

# -----------------------------------------------------------------------------
# CSS — final visual corrections only. Stronger Customer card inset, explicit nav
# label paint, clear square WordPress media thumbnails, standalone manager page.
# -----------------------------------------------------------------------------
css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')
css += r'''

/* ShishaLove 1.1.26 — final scoped product-edge + media access corrections */
body.slb-customer .slb-bottom{opacity:1!important;filter:none!important}
body.slb-customer .slb-bottom button{opacity:1!important;filter:none!important;color:#4a4a4d!important;font-weight:900!important}
body.slb-customer .slb-bottom .slb-bottom-label{display:block!important;color:#4a4a4d!important;-webkit-text-fill-color:#4a4a4d!important;opacity:1!important;filter:none!important;font-size:12px!important;font-weight:900!important;line-height:1.05!important}
body.slb-customer .slb-bottom button.active .slb-bottom-label{color:var(--sl-red)!important;-webkit-text-fill-color:var(--sl-red)!important}
body.slb-customer .slb-product{min-width:0!important;max-width:100%!important;overflow:hidden!important}
body.slb-customer .slb-product-image{box-sizing:border-box!important;overflow:hidden!important;padding:20px!important;background:#fff!important}
body.slb-customer .slb-product-image img{width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;object-position:center!important;padding:0!important;margin:0!important;transform:none!important}
body.slb-customer .slb-product-image.slb-product-placeholder{padding:0!important}
body.slb-customer .slb-products-grid{min-width:0!important;max-width:100%!important;overflow:hidden!important}

.slm-media-actions{display:flex!important;flex-wrap:wrap!important;gap:9px!important;align-items:center!important}
.slm-media-actions .slm-media-pick{margin:0!important}
.slm-main-media{aspect-ratio:1/1!important;min-height:0!important;height:auto!important;background:#f7f7f8!important}
.slm-main-media img{width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;background:#fff!important}
.slm-gallery-head{align-items:flex-start!important}
.slm-gallery-head>.slm-media-actions{justify-content:flex-end!important}

.slm-media-library-grid,.slm-manager-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;align-content:start!important}
.slm-media-library-grid{flex:1!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;padding:10px 16px 18px!important}
.slm-manager-grid{padding:8px 0 18px!important}
.slm-library-tile{display:flex!important;flex-direction:column!important;min-width:0!important;border:2px solid #ececef!important;border-radius:14px!important;background:#fff!important;overflow:hidden!important;box-shadow:0 1px 2px rgba(0,0,0,.04)!important}
.slm-library-tile.selected{border-color:var(--sl-red)!important}
.slm-library-select{display:block!important;width:100%!important;min-width:0!important;border:0!important;background:#fff!important;padding:0!important;text-align:left!important;color:#111!important}
.slm-library-thumb{display:block!important;width:100%!important;aspect-ratio:1/1!important;height:auto!important;min-height:132px!important;background:#f5f5f6!important;overflow:hidden!important}
.slm-library-thumb img{display:block!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;object-position:center!important;background:#fff!important;margin:0!important;padding:6px!important}
.slm-library-title{display:block!important;padding:8px 8px 2px!important;font-size:12px!important;font-weight:900!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;color:#111!important}
.slm-library-select small{display:block!important;padding:0 8px 8px!important;color:#6f6f72!important;font-size:10px!important;line-height:1.2!important}
.slm-library-delete{width:100%!important;min-height:38px!important;border:0!important;border-top:1px solid #eee!important;background:#fff!important;color:#b3263e!important;font-size:10px!important;font-weight:900!important;padding:5px 6px!important}
.slm-library-tile.ideal:after{font-size:9px!important;left:6px!important;top:6px!important}
.slm-media-library-card{height:min(90dvh,900px)!important}
.slm-media-library-footer,.slm-manager-footer{position:relative!important;z-index:2!important;background:#fff!important}
.slm-media-manager-page{padding-bottom:calc(100px + var(--safe-bottom))!important}
.slm-manager-search{padding-left:0!important;padding-right:0!important}
.slm-inline-back{border:0!important;background:transparent!important;font-size:25px!important;line-height:1!important;padding:0 10px 0 0!important;vertical-align:middle!important}
.slm-account-button{width:100%!important;text-align:left!important;background:#fff!important;font:inherit!important;cursor:pointer!important}
@media(max-width:360px){.slm-media-library-grid,.slm-manager-grid{grid-template-columns:1fr!important}.slm-library-thumb{min-height:220px!important}}
'''
css_path.write_text(css, encoding='utf-8')

print('ShishaLove 1.1.26: phone media upload restored, clear WP library + More manager added, Customer product edges/nav labels hardened')
