#!/usr/bin/env python3
from pathlib import Path
import re
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: patch-customer-1.1.7-rc2.py <plugin-dir>')

root = Path(sys.argv[1])
js_path = root / 'assets' / 'customer.js'
css_path = root / 'assets' / 'bridge.css'
php_path = root / 'shishalove-app-bridge.php'

js = js_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')
php = php_path.read_text(encoding='utf-8')


def must_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f'patch failed: {label}')
    return text.replace(old, new, 1)


def must_sub(text, pattern, repl, label):
    out, count = re.subn(pattern, repl, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'patch failed: {label} ({count})')
    return out

# Runtime/build version and Home sorting state.
js = must_replace(js, "var BUILD='1.1.7-rc.1';", "var BUILD='1.1.7-rc.3';", 'build version')
js = must_replace(
    js,
    "  homeFilter:'recommended',\n  feedPage:1,",
    "  homeFilter:'recommended',\n  homeSort:'popularity-desc',\n  feedPage:1,",
    'home sort state'
)

# Replace the old date-window Home feed with Recommended + Recent Arrivals and a real sort selector.
feed_block = r'''function feedTabs(){.*?\n}\nfunction updateHomeFeed'''
feed_repl = r'''function feedTabs(){
  var tabs=[['recommended','Recommended'],['recent','Recent Arrivals']];
  return '<div class="slb-feed-tabs">'+tabs.map(function(x){return '<button data-feed="'+x[0]+'" class="slb-feed-tab '+(state.homeFilter===x[0]?'active':'')+'">'+x[1]+'</button>';}).join('')+'</div>';
}
function homeSortOptions(){
  var opts=[['popularity-desc','Recommended order'],['date-desc','Newest'],['price-asc','Price: Low to High'],['price-desc','Price: High to Low'],['title-asc','A–Z']];
  return '<select id="slb-feed-sort">'+opts.map(function(x){return '<option value="'+x[0]+'"'+(state.homeSort===x[0]?' selected':'')+'>'+x[1]+'</option>';}).join('')+'</select>';
}
function home(){
  var key=vkey('slb-feed-'+state.homeFilter+'-'+state.homeSort+'-'+state.feedPage),cached=cacheGet(key,10*60*1000),items=cached&&cached.items||[];
  state.feedPages=Math.max(1,Number(cached&&cached.pages||1));
  var title=state.homeFilter==='recommended'?'Recommended':'Recent Arrivals';
  var html='<main class="slb-page slb-home-feed"><section class="slb-section"><div class="slb-section-head"><h2 style="color:#d72a40">'+title+'</h2></div>'+feedTabs()+'<div class="slb-feed-tools"><span>Sort products</span>'+homeSortOptions()+'</div><div id="slb-feed-note" class="slb-feed-note"></div><div id="slb-home-feed">'+productsMarkup(items,true)+'</div><div id="slb-home-pager">'+pagerMarkup(state.feedPage,state.feedPages)+'</div></section></main>';
  setTimeout(function(){loadHomeFeed(state.homeFilter);},0);
  return appShell(html,'home');
}
function feedOrder(){
  if(state.homeSort==='price-asc')return ['price','ASC'];
  if(state.homeSort==='price-desc')return ['price','DESC'];
  if(state.homeSort==='title-asc')return ['title','ASC'];
  if(state.homeSort==='date-desc')return ['date','DESC'];
  return ['popularity','DESC'];
}
function loadHomeFeed(filter){
  var key=vkey('slb-feed-'+filter+'-'+state.homeSort+'-'+state.feedPage);
  var o=feedOrder();
  var url='customer/products?per_page=12&page='+state.feedPage+'&stock_status=instock&orderby='+encodeURIComponent(o[0])+'&order='+encodeURIComponent(o[1]);
  api(url).then(function(data){
    if(state.view!=='home'||state.homeFilter!==filter)return;
    var items=(data.items||[]).filter(function(x){return x.stock_status==='instock';});
    data.items=items;
    state.feedPages=Math.max(1,Number(data.pages||1));
    cacheSet(key,data);
    updateHomeFeed(items,'',data);
  }).catch(function(){
    var e=document.getElementById('slb-feed-note');if(e)e.textContent='Unable to refresh products. Pull to refresh and try again.';
  });
}
function updateHomeFeed'''
js = must_sub(js, feed_block, feed_repl, 'home feed replacement')

# Always use the canonical ShishaLove endpoint for category sorting, including numeric price ordering.
category_pattern = r'''function categoryRequest\(cat\)\{.*?\n}\nfunction loadCategory'''
category_repl = r'''function categoryRequest(cat){
  var orderby='date',order='DESC';
  if(state.sort==='price-asc'){orderby='price';order='ASC';}
  else if(state.sort==='price-desc'){orderby='price';order='DESC';}
  else if(state.sort==='title-asc'){orderby='title';order='ASC';}
  return api('customer/products?category_id='+encodeURIComponent(cat.id)+'&page='+state.page+'&per_page='+state.per+'&stock_status=instock&orderby='+orderby+'&order='+order);
}
function loadCategory'''
js = must_sub(js, category_pattern, category_repl, 'category sorting')

# Product detail: category shortcuts and full square/contain image presentation.
product_pattern = r'''function productView\(\)\{.*?\n}\nfunction openProduct'''
product_repl = r'''function productCategoryShortcuts(p){
  var seen={},cats=(p.categories||[]).filter(function(c){
    if(!c||!c.id)return false;
    var n=String(c.name||'').trim();
    if(!n||n.toLowerCase()==='uncategorized'||seen[c.id])return false;
    seen[c.id]=1;return true;
  });
  if(!cats.length)return '';
  return '<div class="slb-product-cats"><span class="slb-product-cats-label">Categories</span><div class="slb-product-cat-scroll">'+cats.map(function(c){return '<button data-product-cat="'+c.id+'" data-product-cat-name="'+esc(c.name)+'">'+(c.image?'<img src="'+esc(c.image)+'" alt="">':'')+'<span>'+esc(c.name)+'</span></button>';}).join('')+'</div></div>';
}
function openProductCategory(id,name){
  var cat=categoryById(id)||{id:Number(id),name:name||'Products',image:'',parent:0};
  state.category=cat;state.product=null;state.view='category';state.page=1;state.pages=1;state.sort='date-desc';state.per=30;
  routeWrite(false);render();
}
function productView(){
  var p=state.product;if(!p)return home();
  var canAdd=p.stock_status==='instock';
  return appShell('<main class="slb-page"><div class="slb-page-head"><button class="back" data-act="back">←</button><h1>Product</h1><span></span></div><section class="slb-product-detail">'+productCategoryShortcuts(p)+'<div class="slb-product-detail-image"><img src="'+esc(p.image)+'" alt="'+esc(p.name)+'"></div><h1>'+esc(p.name)+'</h1><div class="slb-detail-price">'+esc(decodeEntities(p.price_html||p.price))+'</div><div class="slb-detail-stock">'+(canAdd?'● In stock':'Out of stock')+'</div><p class="slb-detail-copy">'+esc(p.short_description||p.description||'')+'</p>'+(canAdd?'<div class="slb-qtyrow"><input id="slb-qty" type="number" min="1" value="1"><button class="slb-primary" data-add="'+p.id+'">ADD TO CART</button></div>':'')+'</section></main>','home');
}
function openProduct'''
js = must_sub(js, product_pattern, product_repl, 'product detail categories')

# Preserve Home feed sort in routes/refreshes.
js = must_replace(
    js,
    "if(state.view==='home'){if(state.homeFilter!=='recommended')u.searchParams.set('feed',state.homeFilter);if(state.feedPage>1)u.searchParams.set('page',state.feedPage);}",
    "if(state.view==='home'){if(state.homeFilter!=='recommended')u.searchParams.set('feed',state.homeFilter);if(state.homeSort!=='popularity-desc')u.searchParams.set('feedSort',state.homeSort);if(state.feedPage>1)u.searchParams.set('page',state.feedPage);}",
    'home route url'
)
js = must_replace(
    js,
    "feed:state.homeFilter,feedPage:state.feedPage};}",
    "feed:state.homeFilter,feedSort:state.homeSort,feedPage:state.feedPage};}",
    'route state'
)
js = must_replace(
    js,
    "if(view==='home'){state.category=null;state.product=null;state.homeFilter='recommended';state.feedPage=1;}",
    "if(view==='home'){state.category=null;state.product=null;state.homeFilter='recommended';state.homeSort='popularity-desc';state.feedPage=1;}",
    'home nav reset'
)
js = must_replace(
    js,
    "  state.homeFilter=p.get('feed')||'recommended';\n  state.feedPage=Math.max(1,Number(p.get('page')||1));",
    "  state.homeFilter=p.get('feed')||'recommended';\n  state.homeSort=p.get('feedSort')||(state.homeFilter==='recent'?'date-desc':'popularity-desc');\n  state.feedPage=Math.max(1,Number(p.get('page')||1));",
    'home route restore'
)

# Wire Home sort and category shortcut buttons.
js = must_replace(
    js,
    "root.querySelectorAll('[data-feed]').forEach(function(e){e.onclick=function(){state.homeFilter=this.dataset.feed;state.feedPage=1;routeWrite(true);render();};});",
    "root.querySelectorAll('[data-feed]').forEach(function(e){e.onclick=function(){state.homeFilter=this.dataset.feed;state.homeSort=state.homeFilter==='recent'?'date-desc':'popularity-desc';state.feedPage=1;routeWrite(true);render();};});",
    'feed click handler'
)
js = must_replace(
    js,
    "  var sort=document.getElementById('slb-sort');if(sort)sort.onchange=function(){state.sort=this.value;state.page=1;routeWrite(true);render();};",
    "  root.querySelectorAll('[data-product-cat]').forEach(function(e){e.onclick=function(){openProductCategory(this.dataset.productCat,this.dataset.productCatName);};});\n  var feedSort=document.getElementById('slb-feed-sort');if(feedSort)feedSort.onchange=function(){state.homeSort=this.value;state.feedPage=1;routeWrite(true);render();};\n  var sort=document.getElementById('slb-sort');if(sort)sort.onchange=function(){state.sort=this.value;state.page=1;routeWrite(true);render();};",
    'sort/category shortcut handlers'
)

# PHP: use uncropped large product imagery, and add true numeric price/popularity ordering.
php = must_replace(
    php,
    "$image = $image_id ? wp_get_attachment_image_url($image_id, 'woocommerce_thumbnail') : '';",
    "$image = $image_id ? wp_get_attachment_image_url($image_id, 'large') : '';",
    'large product image'
)
php = must_replace(
    php,
    "$allowed_orderby = array('date','title','menu_order','modified');\n    if (!in_array($orderby, $allowed_orderby, true)) { $orderby = 'date'; }",
    "$allowed_orderby = array('date','title','menu_order','modified','price','popularity');\n    if (!in_array($orderby, $allowed_orderby, true)) { $orderby = 'date'; }\n    $query_orderby = $orderby;\n    $meta_key = '';\n    if ($orderby === 'price') { $query_orderby = 'meta_value_num'; $meta_key = '_price'; }\n    elseif ($orderby === 'popularity') { $query_orderby = 'meta_value_num'; $meta_key = 'total_sales'; }",
    'php orderby allowlist'
)
php = must_replace(php, "'orderby' => $orderby,", "'orderby' => $query_orderby,", 'php query orderby')
php = must_replace(
    php,
    "    );\n    if ($search !== '') { $args['s'] = $search; }",
    "    );\n    if ($meta_key !== '') { $args['meta_key'] = $meta_key; }\n    if ($search !== '') { $args['s'] = $search; }",
    'php meta sort key'
)

# CSS overrides for legible sort labels, 1:1 product detail images and category chips.
css += r'''

/* ShishaLove Customer 1.1.7 RC3 precision fixes */
.slb-toolbar{grid-template-columns:minmax(0,1fr) minmax(184px,48%)}
.slb-toolbar.secondary{grid-template-columns:minmax(0,1fr) minmax(184px,48%)}
.slb-toolbar select{font-size:15px;white-space:nowrap;text-overflow:clip}
.slb-feed-tools{display:grid;grid-template-columns:1fr minmax(184px,52%);gap:12px;align-items:center;margin:0 0 16px}
.slb-feed-tools span{font-size:14px;color:#777;font-weight:700}
.slb-feed-tools select{height:46px;border:1px solid #ddd;background:#fff;padding:0 12px;min-width:0}
.slb-product-detail-image{width:100%;aspect-ratio:1/1;overflow:hidden;background:#fff;padding:10px}
.slb-product-detail-image img{display:block;width:100%;height:100%;max-width:none;max-height:none;object-fit:contain;object-position:center}
.slb-product-cats{margin:0 0 14px}
.slb-product-cats-label{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#777;font-weight:800;margin:0 0 8px}
.slb-product-cat-scroll{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}
.slb-product-cat-scroll::-webkit-scrollbar{display:none}
.slb-product-cat-scroll button{display:inline-flex;align-items:center;gap:7px;white-space:nowrap;border:1px solid #ddd;background:#fff;border-radius:999px;padding:7px 12px;font-weight:800;font-size:13px}
.slb-product-cat-scroll button img{width:28px;height:28px;border-radius:8px;object-fit:contain;background:#fff}
.slb-product-cat-scroll button span{display:inline-block}
@media(max-width:390px){.slb-toolbar,.slb-toolbar.secondary{grid-template-columns:minmax(0,1fr) minmax(174px,50%)}.slb-feed-tools{grid-template-columns:1fr minmax(174px,55%)}}
'''

js_path.write_text(js, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
php_path.write_text(php, encoding='utf-8')
print('ShishaLove customer RC3 precision patch applied')