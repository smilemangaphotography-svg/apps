#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.25.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.24-fast.py'), str(root)])


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
# CUSTOMER — exact scoped corrections only:
# 1) Bottom navigation labels must remain readable.
# 2) Real product imagery is always scale-down/contained with internal breathing
#    room so the full 1:1 product art and its baked ShishaLove mark remain visible.
# 3) WooCommerce placeholder artwork is explicitly excluded from the new inset.
# 4) Reserve real clearance above the fixed bottom navigation so product content
#    never disappears underneath it.
# -----------------------------------------------------------------------------
css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')
css += r'''

/* ShishaLove 1.1.25 — Customer nav readability + safe full-product image fit ONLY */
body.slb-customer .slb-bottom button{
  color:#4f4f52!important;
  opacity:1!important;
  -webkit-text-fill-color:currentColor!important;
}
body.slb-customer .slb-bottom button.active{
  color:var(--sl-red)!important;
  -webkit-text-fill-color:var(--sl-red)!important;
}
body.slb-customer .slb-product-image img{
  width:100%!important;
  height:100%!important;
  max-width:100%!important;
  max-height:100%!important;
  object-fit:scale-down!important;
  object-position:center center!important;
  transform:none!important;
  padding:10px!important;
}
/* User lock: Hose Gasket/placeholder source is not changed or visually inset. */
body.slb-customer .slb-product-image img[src*="placeholder"],
body.slb-customer .slb-product-image img[src*="woocommerce-placeholder"]{
  padding:0!important;
}
body.slb-customer .slb-page{
  padding-bottom:calc(104px + var(--safe-bottom))!important;
}
'''

# -----------------------------------------------------------------------------
# MERCHANT — replace device picker UI with WordPress Media Library browser.
# Existing WooCommerce attachment IDs remain the source of truth.
# No automatic watermark is added: existing 600x600 / 1:1 ShishaLove-marked
# assets are used exactly as stored, preventing duplicate/overlapping logos.
# -----------------------------------------------------------------------------
merchant_path = root / 'assets' / 'merchant.js'
merchant = merchant_path.read_text(encoding='utf-8')

media_block = r'''
var mediaPicker={open:false,mode:'main',page:1,pages:1,search:'',items:[],selected:{},loading:false};
function editorMedia(p){
  var gallery=Array.isArray(p.gallery)?p.gallery:[],main=p.image||'';
  return '<section class="slm-media-editor"><label>Product image</label><div class="slm-main-media">'+(main?'<img src="'+esc(main)+'" alt="Product image">':'<div class="slm-media-empty">No product image</div>')+'</div><div class="slm-media-actions"><button type="button" class="slm-media-pick" data-media-open="main">'+(main?'CHOOSE FROM MEDIA LIBRARY':'CHOOSE FROM MEDIA LIBRARY')+'</button>'+(main?'<button type="button" class="slm-media-remove" data-media-remove-main>REMOVE</button>':'')+'</div><div class="slm-media-spec">1:1 square product artwork · target 600 × 600 · existing ShishaLove watermark is preserved exactly as stored in WordPress.</div><div class="slm-gallery-head"><label>Product gallery</label><button type="button" class="slm-media-pick" data-media-open="gallery">MEDIA LIBRARY</button></div><div class="slm-gallery-grid">'+(gallery.length?gallery.map(function(src,i){return '<div class="slm-gallery-item"><img src="'+esc(src)+'" alt="Gallery image"><button type="button" data-gallery-remove="'+i+'" aria-label="Remove from product gallery">×</button></div>';}).join(''):'<div class="slm-media-empty">No gallery images</div>')+'</div></section>'+mediaLibraryModal();
}
function mediaLibraryModal(){
  if(!mediaPicker.open)return '';
  var items=mediaPicker.items||[];
  var grid=mediaPicker.loading?'<div class="slm-media-library-loading">Loading WordPress Media Library…</div>':items.length?items.map(function(m){
    var sel=!!mediaPicker.selected[m.id],dim=(m.width&&m.height)?(m.width+' × '+m.height):'',ideal=(Number(m.width)===600&&Number(m.height)===600);
    return '<div class="slm-library-tile '+(sel?'selected ':'')+(ideal?'ideal':'')+'"><button type="button" class="slm-library-select" data-media-select="'+m.id+'"><img src="'+esc(m.thumb_url||m.source_url||'')+'" alt="'+esc(m.title||'Media')+'"><span>'+esc(m.title||('Media #'+m.id))+'</span><small>'+esc(dim)+(ideal?' · 1:1':'')+'</small></button><button type="button" class="slm-library-delete" data-media-delete="'+m.id+'">Delete</button></div>';
  }).join(''):'<div class="slm-media-library-loading">No media found.</div>';
  return '<div class="slm-media-library-modal"><div class="slm-media-library-card"><div class="slm-media-library-head"><div><h2>WordPress Media Library</h2><p>'+(mediaPicker.mode==='main'?'Choose featured product image':'Choose product gallery images')+'</p></div><button type="button" data-media-close>×</button></div><div class="slm-media-library-search"><input id="slm-media-search" value="'+esc(mediaPicker.search)+'" placeholder="Search Media Library"><button type="button" data-media-search>Search</button></div><div class="slm-media-library-grid">'+grid+'</div><div class="slm-media-library-footer"><button type="button" data-media-prev '+(mediaPicker.page<=1?'disabled':'')+'>← Previous</button><strong>Page '+mediaPicker.page+' / '+mediaPicker.pages+'</strong><button type="button" data-media-next '+(mediaPicker.page>=mediaPicker.pages?'disabled':'')+'>Next →</button></div>'+(mediaPicker.mode==='gallery'?'<button type="button" class="slm-media-library-add" data-media-confirm>ADD SELECTED TO GALLERY</button>':'')+'</div></div>';
}
function mediaItemById(id){id=Number(id);for(var i=0;i<mediaPicker.items.length;i++)if(Number(mediaPicker.items[i].id)===id)return mediaPicker.items[i];return null;}
function openMediaLibrary(mode){
  mediaPicker.open=true;mediaPicker.mode=mode==='gallery'?'gallery':'main';mediaPicker.page=1;mediaPicker.pages=1;mediaPicker.search='';mediaPicker.items=[];mediaPicker.selected={};mediaPicker.loading=true;renderEditorOnly();loadMediaLibrary();
}
function closeMediaLibrary(){mediaPicker.open=false;mediaPicker.loading=false;mediaPicker.selected={};renderEditorOnly();}
function loadMediaLibrary(){
  if(!mediaPicker.open)return;mediaPicker.loading=true;renderEditorOnly();
  api('merchant/media?page='+mediaPicker.page+'&per_page=24&search='+encodeURIComponent(mediaPicker.search||'')).then(function(d){
    if(!mediaPicker.open)return;mediaPicker.items=d.items||[];mediaPicker.pages=Math.max(1,Number(d.pages||1));if(mediaPicker.page>mediaPicker.pages)mediaPicker.page=mediaPicker.pages;mediaPicker.loading=false;renderEditorOnly();
  }).catch(function(){mediaPicker.loading=false;mediaPicker.items=[];renderEditorOnly();});
}
function chooseLibraryMedia(id){
  if(!state.editor)return;var item=mediaItemById(id);if(!item)return;
  if(mediaPicker.mode==='main'){
    state.editor.image=item.source_url||item.thumb_url||'';state.editor.image_id=Number(item.id)||0;mediaPicker.open=false;mediaPicker.selected={};renderEditorOnly();return;
  }
  id=Number(id);if(mediaPicker.selected[id])delete mediaPicker.selected[id];else mediaPicker.selected[id]=item;renderEditorOnly();
}
function confirmGalleryMedia(){
  if(!state.editor)return;if(!Array.isArray(state.editor.gallery))state.editor.gallery=[];if(!Array.isArray(state.editor.gallery_ids))state.editor.gallery_ids=[];
  var existing={};state.editor.gallery_ids.forEach(function(id){existing[Number(id)]=true;});
  Object.keys(mediaPicker.selected).forEach(function(k){var m=mediaPicker.selected[k],id=Number(m.id)||0;if(!id||existing[id])return;existing[id]=true;state.editor.gallery_ids.push(id);state.editor.gallery.push(m.source_url||m.thumb_url||'');});
  mediaPicker.open=false;mediaPicker.selected={};renderEditorOnly();
}
function removeGalleryImage(index){
  if(!state.editor)return;index=Number(index);if(!Array.isArray(state.editor.gallery))state.editor.gallery=[];if(!Array.isArray(state.editor.gallery_ids))state.editor.gallery_ids=[];state.editor.gallery.splice(index,1);state.editor.gallery_ids.splice(index,1);renderEditorOnly();
}
function removeMainImage(){if(!state.editor)return;state.editor.image='';state.editor.image_id=0;renderEditorOnly();}
function deleteLibraryMedia(id){
  id=Number(id);var item=mediaItemById(id);if(!id)return;
  if(!window.confirm('Delete '+((item&&item.title)||('media #'+id))+' permanently from the WordPress Media Library? This cannot be undone.'))return;
  api('merchant/media/'+id,{method:'DELETE'}).then(function(){
    delete mediaPicker.selected[id];
    if(state.editor){if(Number(state.editor.image_id)===id){state.editor.image='';state.editor.image_id=0;}if(Array.isArray(state.editor.gallery_ids)){for(var i=state.editor.gallery_ids.length-1;i>=0;i--){if(Number(state.editor.gallery_ids[i])===id){state.editor.gallery_ids.splice(i,1);state.editor.gallery.splice(i,1);}}}}
    loadMediaLibrary();
  }).catch(function(){alert('Could not delete this Media Library item.');});
}
function bindMediaControls(){
  root.querySelectorAll('[data-media-open]').forEach(function(e){e.onclick=function(){openMediaLibrary(this.dataset.mediaOpen);};});
  root.querySelectorAll('[data-media-close]').forEach(function(e){e.onclick=closeMediaLibrary;});
  root.querySelectorAll('[data-media-select]').forEach(function(e){e.onclick=function(){chooseLibraryMedia(this.dataset.mediaSelect);};});
  root.querySelectorAll('[data-media-delete]').forEach(function(e){e.onclick=function(ev){ev.stopPropagation();deleteLibraryMedia(this.dataset.mediaDelete);};});
  root.querySelectorAll('[data-gallery-remove]').forEach(function(e){e.onclick=function(){removeGalleryImage(this.dataset.galleryRemove);};});
  root.querySelectorAll('[data-media-remove-main]').forEach(function(e){e.onclick=removeMainImage;});
  root.querySelectorAll('[data-media-confirm]').forEach(function(e){e.onclick=confirmGalleryMedia;});
  root.querySelectorAll('[data-media-prev]').forEach(function(e){e.onclick=function(){if(mediaPicker.page>1){mediaPicker.page--;loadMediaLibrary();}};});
  root.querySelectorAll('[data-media-next]').forEach(function(e){e.onclick=function(){if(mediaPicker.page<mediaPicker.pages){mediaPicker.page++;loadMediaLibrary();}};});
  root.querySelectorAll('[data-media-search]').forEach(function(e){e.onclick=function(){var s=document.getElementById('slm-media-search');mediaPicker.search=(s&&s.value||'').trim();mediaPicker.page=1;loadMediaLibrary();};});
  var search=document.getElementById('slm-media-search');if(search)search.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();var b=document.querySelector('[data-media-search]');if(b)b.click();}};
}
'''
merchant = replace_between(merchant, 'function editorMedia(p){', 'function editorPanel(){', media_block, 'merchant media library block')
merchant_path.write_text(merchant, encoding='utf-8')

# -----------------------------------------------------------------------------
# PHP — add authenticated WordPress Media Library listing and permanent deletion.
# Existing POST upload endpoint stays for backwards compatibility, but the 1.1.25
# Merchant UI no longer exposes the phone/device file picker.
# -----------------------------------------------------------------------------
main_path = root / 'shishalove-app-bridge.php'
main = main_path.read_text(encoding='utf-8')

media_api = r'''
function slb_merchant_media_payload($id) {
    $id = absint($id);
    if (!$id || get_post_type($id) !== 'attachment' || strpos((string) get_post_mime_type($id), 'image/') !== 0) { return null; }
    $meta = wp_get_attachment_metadata($id);
    $source = wp_get_attachment_image_url($id, 'full');
    $thumb = wp_get_attachment_image_url($id, 'medium');
    return array(
        'id' => $id,
        'title' => html_entity_decode(get_the_title($id), ENT_QUOTES, 'UTF-8'),
        'source_url' => $source ?: wp_get_attachment_url($id),
        'thumb_url' => $thumb ?: $source,
        'width' => isset($meta['width']) ? (int) $meta['width'] : 0,
        'height' => isset($meta['height']) ? (int) $meta['height'] : 0,
    );
}

function slb_list_merchant_media($request) {
    $page = max(1, (int) $request->get_param('page'));
    $per = min(60, max(1, (int) ($request->get_param('per_page') ?: 24)));
    $search = sanitize_text_field((string) $request->get_param('search'));
    $args = array(
        'post_type' => 'attachment',
        'post_status' => 'inherit',
        'post_mime_type' => 'image',
        'posts_per_page' => $per,
        'paged' => $page,
        'orderby' => 'date',
        'order' => 'DESC',
        'fields' => 'ids',
        'no_found_rows' => false,
    );
    if ($search !== '') { $args['s'] = $search; }
    $q = new WP_Query($args);
    $items = array();
    foreach ((array) $q->posts as $id) { $row = slb_merchant_media_payload($id); if ($row) { $items[] = $row; } }
    return array('items' => $items, 'page' => $page, 'per_page' => $per, 'total' => (int) $q->found_posts, 'pages' => max(1, (int) $q->max_num_pages));
}

function slb_delete_merchant_media($request) {
    $id = absint($request['id']);
    if (!$id || get_post_type($id) !== 'attachment') { return new WP_Error('not_found', 'Media item not found', array('status' => 404)); }
    if (!current_user_can('delete_post', $id) && !current_user_can('manage_woocommerce')) { return new WP_Error('forbidden', 'You cannot delete this media item', array('status' => 403)); }
    $deleted = wp_delete_attachment($id, true);
    if (!$deleted) { return new WP_Error('delete_failed', 'Media item could not be deleted', array('status' => 500)); }
    return array('deleted' => true, 'id' => $id);
}

'''
main = replace_once(main, 'function slb_upload_merchant_media($request) {', media_api + 'function slb_upload_merchant_media($request) {', 'merchant media library PHP helpers')
old_route = "    register_rest_route('shishalove/v1', '/merchant/media', array('methods' => 'POST', 'permission_callback' => 'slb_merchant_permission', 'callback' => 'slb_upload_merchant_media'));"
new_route = "    register_rest_route('shishalove/v1', '/merchant/media', array(\n        array('methods' => 'GET', 'permission_callback' => 'slb_merchant_permission', 'callback' => 'slb_list_merchant_media'),\n        array('methods' => 'POST', 'permission_callback' => 'slb_merchant_permission', 'callback' => 'slb_upload_merchant_media'),\n    ));\n    register_rest_route('shishalove/v1', '/merchant/media/(?P<id>\\d+)', array('methods' => 'DELETE', 'permission_callback' => 'slb_merchant_permission', 'callback' => 'slb_delete_merchant_media'));"
main = replace_once(main, old_route, new_route, 'merchant media routes')
main_path.write_text(main, encoding='utf-8')

css += r'''

/* ShishaLove 1.1.25 — Merchant WordPress Media Library browser ONLY */
.slm-media-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.slm-media-remove{min-height:44px;padding:0 15px;border:1px solid #bbb;border-radius:12px;background:#fff;color:#555;font-weight:800}
.slm-media-spec{font-size:12px;line-height:1.4;color:#777;margin-top:-2px}
.slm-media-library-modal{position:fixed;z-index:260;inset:0;background:rgba(0,0,0,.52);display:flex;align-items:flex-end;justify-content:center;padding:calc(var(--safe-top) + 12px) 0 0}
.slm-media-library-card{width:100%;max-width:720px;height:min(88dvh,860px);background:#fff;border-radius:22px 22px 0 0;display:flex;flex-direction:column;overflow:hidden}
.slm-media-library-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:18px 18px 10px;border-bottom:1px solid #eee}
.slm-media-library-head h2{margin:0;font-size:23px}.slm-media-library-head p{margin:4px 0 0;color:#777;font-size:13px}.slm-media-library-head button{width:42px;height:42px;border:0;border-radius:50%;background:#f1f1f2;font-size:28px;line-height:1}
.slm-media-library-search{display:grid;grid-template-columns:1fr 92px;gap:8px;padding:12px 18px}.slm-media-library-search input{min-width:0;height:46px;border:1px solid #ddd;border-radius:12px;padding:0 13px}.slm-media-library-search button{border:0;border-radius:12px;background:#111;color:#fff;font-weight:900}
.slm-media-library-grid{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:8px 18px 16px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-content:start}
.slm-library-tile{position:relative;min-width:0;border:2px solid transparent;border-radius:13px;background:#f6f6f7;overflow:hidden}.slm-library-tile.selected{border-color:var(--sl-red)}.slm-library-tile.ideal:after{content:'600×600';position:absolute;left:5px;top:5px;background:rgba(0,0,0,.7);color:#fff;border-radius:999px;padding:3px 6px;font-size:9px;font-weight:800;pointer-events:none}
.slm-library-select{width:100%;border:0;background:#fff;padding:0;text-align:left;color:#111}.slm-library-select img{display:block;width:100%;aspect-ratio:1/1;object-fit:contain;background:#fff}.slm-library-select span{display:block;padding:7px 7px 2px;font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.slm-library-select small{display:block;padding:0 7px 8px;color:#777;font-size:10px}
.slm-library-delete{width:100%;min-height:34px;border:0;border-top:1px solid #eee;background:#fff;color:#b3263e;font-size:11px;font-weight:900}
.slm-media-library-loading{grid-column:1/-1;text-align:center;padding:54px 12px;color:#777}
.slm-media-library-footer{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;padding:10px 18px;border-top:1px solid #eee}.slm-media-library-footer button{min-height:40px;border:1px solid #ddd;border-radius:10px;background:#fff;font-weight:800}.slm-media-library-footer button:last-child{justify-self:stretch}.slm-media-library-footer strong{font-size:12px;white-space:nowrap}.slm-media-library-add{margin:0 18px calc(12px + var(--safe-bottom));min-height:48px;border:0;border-radius:12px;background:var(--sl-red);color:#fff;font-weight:900}
@media(max-width:390px){.slm-media-library-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
'''
css_path.write_text(css, encoding='utf-8')

print('ShishaLove 1.1.25: customer nav/image fit fixed; Merchant uses WordPress Media Library with selection/removal/permanent deletion')
