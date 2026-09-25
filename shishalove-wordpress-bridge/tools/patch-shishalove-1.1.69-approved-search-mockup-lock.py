#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-shishalove-1.1.69-approved-search-mockup-lock.py <plugin-dir>')

root=Path(sys.argv[1])
php=root/'shishalove-app-bridge.php'
js=root/'assets'/'merchant.js'
css=root/'assets'/'bridge.css'
customer=root/'assets'/'customer.js'
for f in (php,js,css,customer):
    if not f.exists():
        raise SystemExit(f'missing {f}')

p=php.read_text(encoding='utf-8')
m=js.read_text(encoding='utf-8')
c=css.read_text(encoding='utf-8')
customer_before=customer.read_bytes()

def one(text, old, new, label):
    n=text.count(old)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 occurrence, found {n}')
    return text.replace(old,new,1)

if p.count('Version: 1.1.68') != 1 or p.count("define('SLB_VERSION', '1.1.68');") != 1:
    raise SystemExit('expected exact Bridge 1.1.68 baseline')

# Version only. Backend behavior/configuration stays untouched.
p=one(p,'Version: 1.1.68','Version: 1.1.69','plugin version')
p=one(p,"define('SLB_VERSION', '1.1.68');","define('SLB_VERSION', '1.1.69');",'version constant')

old_search='''<div class="slm-search"><div class="slm-search-input-wrap"><input id="slm-product-search" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" placeholder="Search product name or SKU" value="'+esc(state.queryDraft||state.query)+'"><button type="button" class="slm-visual-trigger" data-act="visual-search-pick" aria-label="Visual Search" title="Visual Search"><svg class="slm-lens-icon" viewBox="0 0 28 28" aria-hidden="true" focusable="false"><path d="M8.1 4.5H6.4a1.9 1.9 0 0 0-1.9 1.9v1.7M19.9 4.5h1.7a1.9 1.9 0 0 1 1.9 1.9v1.7M23.5 19.9v1.7a1.9 1.9 0 0 1-1.9 1.9h-1.7M8.1 23.5H6.4a1.9 1.9 0 0 1-1.9-1.9v-1.7"/><circle cx="14" cy="14" r="4.4"/><circle class="slm-lens-dot" cx="21.1" cy="7" r="1.45"/></svg></button><input id="slm-visual-camera" class="slm-visual-file" type="file" accept="image/*" capture="environment" aria-hidden="true" tabindex="-1"><input id="slm-visual-gallery" class="slm-visual-file" type="file" accept="image/*" aria-hidden="true" tabindex="-1"></div></div>'''
new_search='''<div class="slm-search"><div class="slm-search-input-wrap"><span class="slm-text-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.5 15.5 4.2 4.2"/></svg></span><input id="slm-product-search" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" placeholder="Search product name or SKU" value="'+esc(state.queryDraft||state.query)+'"><button type="button" class="slm-visual-trigger" data-act="visual-search-pick" aria-label="Visual Search" title="Visual Search"><svg class="slm-lens-icon" viewBox="0 0 28 28" aria-hidden="true" focusable="false"><path d="M8.1 4.5H6.4a1.9 1.9 0 0 0-1.9 1.9v1.7M19.9 4.5h1.7a1.9 1.9 0 0 1 1.9 1.9v1.7M23.5 19.9v1.7a1.9 1.9 0 0 1-1.9 1.9h-1.7M8.1 23.5H6.4a1.9 1.9 0 0 1-1.9-1.9v-1.7"/><circle cx="14" cy="14" r="4.4"/><circle class="slm-lens-dot" cx="21.1" cy="7" r="1.45"/></svg></button><input id="slm-visual-camera" class="slm-visual-file" type="file" accept="image/*" capture="environment" aria-hidden="true" tabindex="-1"><input id="slm-visual-gallery" class="slm-visual-file" type="file" accept="image/*" aria-hidden="true" tabindex="-1"></div></div>'''
m=one(m,old_search,new_search,'approved search markup')

old_rows="""function productRows(items){if(!items.length)return '<div class=\"slm-empty\">No matching products.</div>';return items.map(function(p){var stockClass=p.stock_status==='instock'?'slm-green':'';var stockLabel=p.stock_status==='instock'?'In stock':p.stock_status==='outofstock'?'Out of stock':p.stock_status==='onbackorder'?'On backorder':p.stock_status;return '<article class=\"slm-product-row\" data-edit=\"'+p.id+'\">'+productImageMarkup(p)+'<div><h3>'+esc(decodeEntities(p.name))+'</h3><p>'+esc(decodeEntities(p.price_html||p.regular_price||''))+'</p><p class=\"'+stockClass+'\">● '+esc(stockLabel||'')+'</p></div><button class=\"slm-more\" data-quick-edit=\"'+p.id+'\" aria-label=\"Quick Edit\">⋮</button></article>';}).join('');}"""
new_rows="""function productRows(items){if(!items.length)return '<div class=\"slm-empty\">No matching products.</div>';return items.map(function(p){var stockClass=p.stock_status==='instock'?'slm-stock-in':p.stock_status==='outofstock'?'slm-stock-out':'slm-stock-neutral';var stockLabel=p.stock_status==='instock'?'In stock':p.stock_status==='outofstock'?'Out of stock':p.stock_status==='onbackorder'?'On backorder':p.stock_status;return '<article class=\"slm-product-row\" data-edit=\"'+p.id+'\">'+productImageMarkup(p)+'<div><h3>'+esc(decodeEntities(p.name))+'</h3><p>'+esc(decodeEntities(p.price_html||p.regular_price||''))+'</p><p class=\"slm-stock-status '+stockClass+'\">● '+esc(stockLabel||'')+'</p></div><button class=\"slm-more\" data-quick-edit=\"'+p.id+'\" aria-label=\"Quick Edit\">⋮</button></article>';}).join('');}"""
m=one(m,old_rows,new_rows,'product stock status colors')

old_sheet='''wrap.innerHTML='<section class="slm-photo-sheet" role="dialog" aria-modal="true" aria-label="Visual Search"><div class="slm-photo-title">VISUAL SEARCH</div><button type="button" data-act="photo-search-camera">'+visualChooserCameraIcon()+'<strong>Take Photo</strong></button><button type="button" data-act="photo-search-gallery">'+visualChooserGalleryIcon()+'<strong>Choose Photo</strong></button><button type="button" class="slm-photo-cancel">Cancel</button></section>';'''
new_sheet='''wrap.innerHTML='<section class="slm-photo-sheet" role="dialog" aria-modal="true" aria-label="Visual Search"><div class="slm-photo-handle" aria-hidden="true"></div><div class="slm-photo-title">VISUAL SEARCH</div><button type="button" data-act="photo-search-camera">'+visualChooserCameraIcon()+'<strong>Take Photo</strong></button><button type="button" data-act="photo-search-gallery">'+visualChooserGalleryIcon()+'<strong>Choose Photo</strong></button><button type="button" class="slm-photo-cancel">Cancel</button></section>';'''
m=one(m,old_sheet,new_sheet,'bottom sheet drag handle')

old_visual="""'<p class=\"'+(stock==='instock'?'slm-green':'')+'\">● '+esc(stockLabel||'Stock status unavailable')+'</p>"""
new_visual="""'<p class=\"slm-stock-status '+(stock==='instock'?'slm-stock-in':stock==='outofstock'?'slm-stock-out':'slm-stock-neutral')+'\">● '+esc(stockLabel||'Stock status unavailable')+'</p>"""
m=one(m,old_visual,new_visual,'visual matches stock colors')

c += r'''
/* 1.1.69 — approved Search + Visual Search mockup lock. */
body.slb-merchant .slm-page .slm-search-input-wrap>input[type="search"]{padding-left:52px!important;padding-right:66px!important}
body.slb-merchant .slm-text-search-icon{position:absolute!important;z-index:2!important;left:16px!important;top:50%!important;transform:translateY(-50%)!important;width:22px!important;height:22px!important;display:grid!important;place-items:center!important;color:#6f6f73!important;pointer-events:none!important}
body.slb-merchant .slm-text-search-icon svg{width:22px!important;height:22px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.9!important;stroke-linecap:round!important;stroke-linejoin:round!important}
body.slb-merchant .slm-authoritative-filters{grid-template-columns:.95fr 1.28fr .86fr!important;gap:8px!important}
body.slb-merchant .slm-filter-control select{font-size:11.5px!important;padding-left:8px!important;padding-right:18px!important;appearance:none!important;-webkit-appearance:none!important}
body.slb-merchant .slm-filter-control:after{content:'⌄';position:absolute;right:7px;top:50%;transform:translateY(-52%);font-size:12px;line-height:1;color:#2f2f32;pointer-events:none}
body.slb-merchant .slm-stock-status{font-weight:700!important}
body.slb-merchant .slm-stock-in{color:var(--sl-green)!important}
body.slb-merchant .slm-stock-out{color:var(--sl-red)!important}
body.slb-merchant .slm-stock-neutral{color:#68686d!important}
body.slb-merchant .slm-photo-backdrop{padding-bottom:calc(14px + var(--safe-bottom) + 72px)!important;background:rgba(15,15,17,.38)!important}
body.slb-merchant .slm-photo-sheet{border-radius:22px 22px 18px 18px!important;padding:9px 12px 12px!important;gap:6px!important}
body.slb-merchant .slm-photo-handle{width:38px;height:4px;border-radius:999px;background:#d6d6da;margin:1px auto 5px}
body.slb-merchant .slm-photo-title{padding:4px 9px 6px!important}
body.slb-merchant .slm-photo-sheet button{min-height:52px!important}
body.slb-merchant .slm-photo-sheet .slm-photo-cancel{min-height:48px!important}
body.slb-merchant .slm-head{min-width:0!important;gap:12px!important}
body.slb-merchant .slm-head>div{min-width:0!important}
body.slb-merchant .slm-head .add{flex:0 0 auto!important;white-space:nowrap!important;color:var(--sl-red)!important;background:#fff5f6!important;border:1px solid rgba(179,17,39,.16)!important}
@media(min-width:700px){body.slb-merchant .slm-photo-backdrop{padding-bottom:14px!important}}
'''

php.write_text(p,encoding='utf-8')
js.write_text(m,encoding='utf-8')
css.write_text(c,encoding='utf-8')

if customer.read_bytes()!=customer_before:
    raise SystemExit('customer.js unexpectedly changed')

required=(
    'Version: 1.1.69',
    "define('SLB_VERSION', '1.1.69');",
    'class="slm-text-search-icon"',
    'class="slm-lens-icon"',
    'class="slm-photo-handle"',
    'capture="environment"',
    'id="slm-visual-gallery"',
    'slm-stock-out',
    "apiForm('merchant/visual-search'",
    'slm-authoritative-filters',
    'category_exact=1',
)
for token in required:
    if token not in p+m+c:
        raise SystemExit(f'missing required token: {token}')

for forbidden in ('>📷<','>🖼<','data-act="search-products">Search</button>','PHOTO SEARCH'):
    if forbidden in m:
        raise SystemExit(f'obsolete search UI remains: {forbidden}')

if m.count('class="slm-authoritative-filters"') != 1:
    raise SystemExit('authoritative filter renderer must exist exactly once')

print('Bridge 1.1.69 approved Search + Visual Search mockup patch applied')
