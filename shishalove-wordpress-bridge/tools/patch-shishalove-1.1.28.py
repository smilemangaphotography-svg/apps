#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.28.py <plugin-dir>')

root = Path(sys.argv[1])
tools = Path(__file__).resolve().parent
subprocess.check_call([sys.executable, str(tools / 'patch-shishalove-1.1.27-r2.py'), str(root)])


def replace_between(text, start, end, replacement, label):
    s = text.find(start)
    if s < 0:
        raise SystemExit(f'{label}: start marker missing')
    e = text.find(end, s)
    if e < 0:
        raise SystemExit(f'{label}: end marker missing')
    return text[:s] + replacement.rstrip() + '\n' + text[e:]

# CUSTOMER — version + full uncropped product artwork.
customer_path = root / 'assets' / 'customer.js'
customer = customer_path.read_text(encoding='utf-8')
customer = customer.replace("var BUILD='1.1.27';", "var BUILD='1.1.28';", 1)
customer = customer.replace("CFG.version='1.1.27';", "CFG.version='1.1.28';", 1)
customer = customer.replace("slbfix','1.1.27'", "slbfix','1.1.28'", 1)
customer_path.write_text(customer, encoding='utf-8')

# MERCHANT — version + durable media/editor markup.
merchant_path = root / 'assets' / 'merchant.js'
merchant = merchant_path.read_text(encoding='utf-8')
merchant = merchant.replace("CFG.version='1.1.27';", "CFG.version='1.1.28';", 1)
merchant = merchant.replace("slbfix','1.1.27'", "slbfix','1.1.28'", 1)
merchant = merchant.replace('Bridge 1.1.27', 'Bridge 1.1.28', 1)

editor_media = r'''function editorMedia(p){
  var gallery=Array.isArray(p.gallery)?p.gallery:[],main=p.image||'',busy=!!p._mediaBusy,status=p._mediaStatus||'';
  return '<section class="slm-media-editor">'+
    '<label>Product image</label>'+
    '<div class="slm-main-media">'+(main?'<img src="'+esc(main)+'" alt="Product image">':'<div class="slm-media-empty">No product image</div>')+'</div>'+
    '<div class="slm-main-media-actions">'+
      '<label class="slm-media-pick '+(busy?'disabled':'')+'" for="slm-main-image-input">'+(main?'CHANGE IMAGE':'ADD IMAGE')+'</label>'+
      '<input id="slm-main-image-input" type="file" accept="image/*" '+(busy?'disabled':'')+' hidden>'+
      '<button type="button" class="slm-media-pick" data-media-open="main">MEDIA LIBRARY</button>'+
    '</div>'+
    (main?'<button type="button" class="slm-media-remove slm-remove-main" data-media-remove-main>REMOVE IMAGE</button>':'')+
    '<div class="slm-media-spec">Phone uploads are permanently saved as 600 × 600 with one ShishaLove watermark at bottom-right. Existing WordPress Media Library images are preserved exactly as stored.</div>'+
    '<div class="slm-gallery-head"><label>Product gallery</label><div class="slm-gallery-media-actions">'+
      '<label class="slm-media-pick '+(busy?'disabled':'')+'" for="slm-gallery-input">+ ADD PHOTOS</label>'+
      '<input id="slm-gallery-input" type="file" accept="image/*" multiple '+(busy?'disabled':'')+' hidden>'+
      '<button type="button" class="slm-media-pick" data-media-open="gallery">MEDIA LIBRARY</button>'+
    '</div></div>'+
    '<div class="slm-gallery-grid">'+(gallery.length?gallery.map(function(src,i){return '<div class="slm-gallery-item"><img src="'+esc(src)+'" alt="Gallery image"><button type="button" data-gallery-remove="'+i+'" aria-label="Remove from product gallery">×</button></div>';}).join(''):'<div class="slm-media-empty">No gallery images</div>')+'</div>'+
    (status?'<div class="slm-media-status">'+esc(status)+'</div>':'')+
  '</section>'+mediaLibraryModal();
}
'''
merchant = replace_between(merchant, 'function editorMedia(p){', 'function libraryTile(', editor_media, 'merchant editor media actions')

library_tile = r'''function libraryTile(m,selectable,selected){
  var dim=(m.width&&m.height)?(m.width+' × '+m.height):'',id=Number(m.id)||0;
  var action=selectable?' data-media-select="'+id+'"':' data-media-preview="'+id+'"';
  var src=m.source_url||m.thumb_url||'';
  return '<article class="slm-library-tile '+(selected?'selected':'')+'">'+
    '<button type="button" class="slm-library-select"'+action+'>'+
      '<span class="slm-library-thumb"><img src="'+esc(src)+'" alt="'+esc(m.title||'Media')+'"></span>'+
      '<span class="slm-library-title">'+esc(m.title||('Media #'+id))+'</span>'+
      '<small>'+esc(dim)+'</small>'+
    '</button>'+
    '<button type="button" class="slm-library-delete" data-media-delete="'+id+'">DELETE PERMANENTLY</button>'+
  '</article>';
}
'''
merchant = replace_between(merchant, 'function libraryTile(', 'function mediaLibraryModal(){', library_tile, 'merchant full square media cards')
merchant_path.write_text(merchant, encoding='utf-8')

# CSS — explicit final geometry. These rules are intentionally last and scoped.
css_path = root / 'assets' / 'bridge.css'
css = css_path.read_text(encoding='utf-8')
css += r'''

/* ShishaLove 1.1.28 — exact remaining live-screen fixes only */
/* Customer: show the complete original product artwork with breathing room. */
body.slb-customer .slb-product-image:not(.slb-product-placeholder){
  padding:8px!important;
  overflow:hidden!important;
}
body.slb-customer .slb-product-image:not(.slb-product-placeholder) img{
  display:block!important;
  width:100%!important;
  height:100%!important;
  max-width:100%!important;
  max-height:100%!important;
  object-fit:contain!important;
  object-position:center!important;
  padding:0!important;
  margin:0!important;
  transform:scale(.90)!important;
  transform-origin:center center!important;
}
body.slb-customer .slb-product-image.slb-product-placeholder img{
  transform:none!important;
  padding:0!important;
}

/* Merchant editor: strong visible top navigation controls. */
body.slb-merchant .slm-panel-head button{
  display:grid!important;
  place-items:center!important;
  width:44px!important;
  height:44px!important;
  min-width:44px!important;
  padding:0!important;
  margin:0!important;
  border:0!important;
  background:#fff!important;
  color:#111!important;
  -webkit-text-fill-color:#111!important;
  opacity:1!important;
  font-size:31px!important;
  font-weight:900!important;
  line-height:1!important;
}

/* Merchant editor: phone and Media Library are separate equal buttons. */
body.slb-merchant .slm-main-media-actions,
body.slb-merchant .slm-gallery-media-actions{
  display:grid!important;
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
  gap:12px!important;
  width:100%!important;
  margin:12px 0 0!important;
  align-items:stretch!important;
}
body.slb-merchant .slm-main-media-actions .slm-media-pick,
body.slb-merchant .slm-gallery-media-actions .slm-media-pick{
  box-sizing:border-box!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  width:100%!important;
  min-width:0!important;
  min-height:52px!important;
  margin:0!important;
  padding:10px 8px!important;
  border:1.5px solid var(--sl-red)!important;
  border-radius:12px!important;
  background:#fff!important;
  color:var(--sl-red)!important;
  -webkit-text-fill-color:var(--sl-red)!important;
  font-size:14px!important;
  font-weight:900!important;
  line-height:1.15!important;
  text-align:center!important;
  white-space:normal!important;
}
body.slb-merchant .slm-remove-main{
  display:block!important;
  width:auto!important;
  margin:10px 0 0!important;
  padding:8px 4px!important;
  border:0!important;
  background:transparent!important;
  color:#8a2737!important;
  font-weight:800!important;
}
body.slb-merchant .slm-gallery-head{
  display:block!important;
  margin-top:22px!important;
}
body.slb-merchant .slm-gallery-head>label{margin-bottom:8px!important}

/* The form actions are part of document flow; they never cover image/gallery controls. */
body.slb-merchant .slm-panel.open .slm-form-actions{
  position:static!important;
  bottom:auto!important;
  margin:22px 0 8px!important;
  padding:0!important;
  background:#fff!important;
}
body.slb-merchant .slm-panel.open .slm-form{
  padding-bottom:calc(120px + var(--slb-native-bottom))!important;
}

/* WordPress Media Library: true full square preview cards, metadata and delete below. */
body.slb-merchant .slm-media-library-grid,
body.slb-merchant .slm-manager-grid{
  display:grid!important;
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
  gap:14px!important;
  align-items:start!important;
  align-content:start!important;
}
body.slb-merchant .slm-library-tile{
  display:flex!important;
  flex-direction:column!important;
  width:100%!important;
  min-width:0!important;
  height:auto!important;
  min-height:0!important;
  overflow:hidden!important;
  border:1px solid #e3e3e6!important;
  border-radius:14px!important;
  background:#fff!important;
  box-shadow:none!important;
}
body.slb-merchant .slm-library-select{
  display:flex!important;
  flex-direction:column!important;
  width:100%!important;
  height:auto!important;
  min-height:0!important;
  padding:0!important;
  margin:0!important;
  border:0!important;
  background:#fff!important;
  color:#111!important;
  text-align:left!important;
  overflow:visible!important;
}
body.slb-merchant .slm-library-thumb{
  display:block!important;
  width:100%!important;
  height:auto!important;
  min-height:0!important;
  aspect-ratio:1/1!important;
  overflow:hidden!important;
  background:#fff!important;
  border-bottom:1px solid #f0f0f1!important;
}
body.slb-merchant .slm-library-thumb img{
  display:block!important;
  width:100%!important;
  height:100%!important;
  max-width:100%!important;
  max-height:100%!important;
  object-fit:contain!important;
  object-position:center!important;
  padding:8px!important;
  margin:0!important;
  transform:none!important;
  background:#fff!important;
}
body.slb-merchant .slm-library-title{
  display:block!important;
  min-height:36px!important;
  padding:8px 9px 2px!important;
  color:#111!important;
  font-size:12px!important;
  font-weight:900!important;
  line-height:1.25!important;
  white-space:normal!important;
  overflow:visible!important;
}
body.slb-merchant .slm-library-select small{
  display:block!important;
  padding:0 9px 8px!important;
  color:#777!important;
  font-size:10px!important;
  line-height:1.2!important;
}
body.slb-merchant .slm-library-delete{
  position:static!important;
  inset:auto!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  width:100%!important;
  min-height:42px!important;
  margin:0!important;
  padding:7px 5px!important;
  border:0!important;
  border-top:1px solid #eee!important;
  background:#fff!important;
  color:#b3263e!important;
  -webkit-text-fill-color:#b3263e!important;
  font-size:10px!important;
  font-weight:900!important;
  line-height:1.15!important;
  white-space:normal!important;
}
body.slb-merchant .slm-library-tile:after{display:none!important}

@media(max-width:390px){
  body.slb-merchant .slm-media-library-grid,
  body.slb-merchant .slm-manager-grid{gap:10px!important}
  body.slb-merchant .slm-main-media-actions,
  body.slb-merchant .slm-gallery-media-actions{gap:10px!important}
}
'''
css_path.write_text(css, encoding='utf-8')

print('ShishaLove 1.1.28: editor controls, full square media previews and complete customer product artwork fixed')
