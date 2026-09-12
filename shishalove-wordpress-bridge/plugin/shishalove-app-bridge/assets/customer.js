(function(){
'use strict';

var BUILD='1.1.7-rc.1';
var CFG=window.SHISHALOVE_BRIDGE||{};
var root=document.getElementById('slb-root');
if(!root){return;}

var state={
  view:'home',
  bootstrap:null,
  category:null,
  product:null,
  search:'',
  searchPage:1,
  searchPages:1,
  page:1,
  pages:1,
  sort:'date-desc',
  per:30,
  cart:null,
  homeFilter:'recommended',
  feedPage:1,
  feedPages:1,
  restoring:false
};

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
function decodeEntities(v){var t=document.createElement('textarea');t.innerHTML=String(v==null?'':v);return t.value;}
function stripHtml(v){var t=document.createElement('div');t.innerHTML=String(v==null?'':v);return (t.textContent||t.innerText||'').trim();}
function vkey(base){return base+'-'+BUILD;}
function api(path,opts){
  opts=opts||{};
  var headers=opts.headers||{};
  if(CFG.restNonce)headers['X-WP-Nonce']=CFG.restNonce;
  opts.headers=headers;
  opts.credentials='same-origin';
  return fetch(CFG.rest+path,opts).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();});
}
function storeApi(params){
  var u=new URL('/wp-json/wc/store/v1/products',location.origin);
  Object.keys(params||{}).forEach(function(k){
    var v=params[k];
    if(v===undefined||v===null||v==='')return;
    if(Array.isArray(v)){v.forEach(function(x){u.searchParams.append(k+'[]',String(x));});}
    else u.searchParams.set(k,String(v));
  });
  return fetch(u.toString(),{credentials:'same-origin'}).then(function(r){
    if(!r.ok)throw new Error('Store API '+r.status);
    return r.json().then(function(items){
      return {
        items:(items||[]).map(storeProduct),
        total:Number(r.headers.get('X-WP-Total')||items.length||0),
        pages:Math.max(1,Number(r.headers.get('X-WP-TotalPages')||1)),
        page:Number(params.page||1),
        per_page:Number(params.per_page||30)
      };
    });
  });
}
function storeMoney(prices){
  prices=prices||{};
  var minor=Number(prices.currency_minor_unit==null?2:prices.currency_minor_unit);
  var raw=Number(prices.price||0)/Math.pow(10,minor);
  var dec=prices.currency_decimal_separator||'.';
  var num=raw.toFixed(minor).replace('.',dec);
  return String(prices.currency_prefix||prices.currency_symbol||'€')+num+String(prices.currency_suffix||'');
}
function storeProduct(p){
  var img=(p.images&&p.images[0]&&p.images[0].src)||'';
  return {
    id:Number(p.id),
    name:stripHtml(p.name),
    image:img,
    price:storeMoney(p.prices),
    price_html:storeMoney(p.prices),
    stock_status:p.is_in_stock===false?'outofstock':'instock',
    short_description:stripHtml(p.short_description||''),
    description:stripHtml(p.description||'')
  };
}
function logo(){
  var mark=CFG.logo?'<img class="slb-brand-mark" src="'+esc(CFG.logo)+'" alt="ShishaLove">':'';
  return '<span class="slb-brand-lockup">'+mark+'<span class="slb-brand-word">shishalove</span></span>';
}
function normalizeBrandLockups(){
  document.querySelectorAll('.slb-brand-lockup').forEach(function(lock){
    var img=lock.querySelector('img');if(!img)return;
    var apply=function(){if(img.naturalWidth&&img.naturalHeight&&img.naturalWidth/img.naturalHeight>=2.1)lock.classList.add('wide-logo');else lock.classList.remove('wide-logo');};
    if(img.complete)apply();else img.addEventListener('load',apply,{once:true});
  });
}
function toast(msg){
  var t=document.querySelector('.slb-toast');
  if(!t){t=document.createElement('div');t.className='slb-toast';document.body.appendChild(t);}
  t.textContent=msg;t.classList.add('show');clearTimeout(t._tm);
  t._tm=setTimeout(function(){t.classList.remove('show');},1800);
}
function cacheGet(key,maxAge){try{var o=JSON.parse(localStorage.getItem(key)||'null');if(o&&o.data&&(!maxAge||Date.now()-o.time<maxAge))return o.data;}catch(e){}return null;}
function cacheSet(key,data){try{localStorage.setItem(key,JSON.stringify({time:Date.now(),data:data}));}catch(e){}}
function favorites(){try{return JSON.parse(localStorage.getItem('slb-favorites')||'[]')||[];}catch(e){return[];}}
function setFavorites(list){try{localStorage.setItem('slb-favorites',JSON.stringify(list));}catch(e){}}
function isFav(id){return favorites().indexOf(Number(id))>=0;}
function toggleFav(id){id=Number(id);var f=favorites(),i=f.indexOf(id);if(i>=0)f.splice(i,1);else f.push(id);setFavorites(f);render();}

function allCategories(){
  var out=[],seen={};
  function add(c){if(!c||seen[c.id])return;seen[c.id]=1;out.push(c);}
  ((state.bootstrap&&state.bootstrap.categories)||[]).forEach(add);
  Object.keys((state.bootstrap&&state.bootstrap.collections)||{}).forEach(function(k){((state.bootstrap.collections||{})[k]||[]).forEach(add);});
  return out;
}
function categoryById(id){var cats=allCategories();for(var i=0;i<cats.length;i++)if(Number(cats[i].id)===Number(id))return cats[i];return null;}
function categoryMatch(q){
  q=String(q||'').trim().toLowerCase();if(!q)return null;
  var cats=allCategories(),exact=null,partial=null;
  for(var i=0;i<cats.length;i++){
    var n=String(cats[i].name||'').toLowerCase();
    if(n===q){exact=cats[i];break;}
    if(!partial&&n.indexOf(q)>=0)partial=cats[i];
  }
  return exact||partial;
}
function topCategory(name){var cats=(state.bootstrap&&state.bootstrap.categories)||[];name=String(name||'').toLowerCase();for(var i=0;i<cats.length;i++)if(String(cats[i].name).toLowerCase()===name)return cats[i];return null;}
function isTopCategory(cat){var cats=(state.bootstrap&&state.bootstrap.categories)||[];for(var i=0;i<cats.length;i++)if(Number(cats[i].id)===Number(cat&&cat.id))return true;return false;}
function collectionFor(cat){
  if(!cat||!state.bootstrap)return[];
  var n=String(cat.name||'').toLowerCase();
  if(n.indexOf('hookah')>=0)return state.bootstrap.collections.hookah||[];
  if(n.indexOf('bowl')>=0)return state.bootstrap.collections.bowls||[];
  if(n.indexOf('access')>=0)return state.bootstrap.collections.accessories||[];
  return [];
}

function appShell(content,active){return '<div class="slb-app">'+header()+content+bottom(active||state.view)+drawer()+'</div><div class="slb-backdrop"></div>';}
function header(){
  var count=state.cart&&state.cart.count||0;
  return '<header class="slb-top"><button class="slb-menu" data-act="drawer" aria-label="Menu">☰</button><a class="slb-top-logo" href="#" data-nav="home">'+logo()+'</a><div class="slb-top-actions"><button class="slb-lang" data-act="language">EN <span style="color:#d72a40">⌄</span></button><button class="slb-cart" data-nav="cart" aria-label="Cart">🛒'+(count?'<span class="slb-cart-count">'+count+'</span>':'')+'</button></div></header>';
}
function bottom(active){
  var items=[['home','⌂','Home'],['search','⌕','Search'],['favorites','♡','Favorites'],['account','♙','Account']];
  return '<nav class="slb-bottom">'+items.map(function(x){return '<button data-nav="'+x[0]+'" class="'+(active===x[0]?'active':'')+'"><i>'+x[1]+'</i>'+x[2]+'</button>';}).join('')+'</nav>';
}
function drawer(){
  var top=(state.bootstrap&&state.bootstrap.categories)||[];
  var links=state.bootstrap&&state.bootstrap.links||{};
  return '<aside class="slb-drawer"><div class="slb-drawer-head"><div class="slb-drawer-logo">'+logo()+'</div><button class="slb-drawer-close" data-act="drawer-close">×</button></div>'+ 
    '<button class="slb-drawer-link" data-nav="home"><span>HOME</span><span>›</span></button>'+top.map(function(c){return '<button class="slb-drawer-link" data-cat="'+c.id+'"><span>'+esc(c.name).toUpperCase()+'</span><span>›</span></button>';}).join('')+
    '<div class="slb-drawer-label">SHISHALOVE</div><div class="slb-drawer-lower">'+
    '<button data-nav="account">♙ <span>My Account</span></button><a href="'+esc(links.contact||'#')+'">◉ <span>Customer Support</span></a><button data-act="language">◎ <span>Language</span></button><a href="'+esc(links.about||'#')+'">ⓘ <span>About ShishaLove</span></a><a href="'+esc(links.stores||'#')+'">⌖ <span>Find Stores</span></a><a href="'+esc(links.contact||'#')+'">✉ <span>Contact Us</span></a></div></aside>';
}
function openDrawer(open){
  var d=document.querySelector('.slb-drawer'),b=document.querySelector('.slb-backdrop');
  if(d)d.classList.toggle('open',open);if(b)b.classList.toggle('open',open);document.body.style.overflow=open?'hidden':'';
}

function feedTabs(){
  var tabs=[['recommended','Recommended'],['recent','Recent Arrivals'],['7d','Last 7 days'],['30d','Last 30 days'],['older30','Before 30 days']];
  return '<div class="slb-feed-tabs">'+tabs.map(function(x){return '<button data-feed="'+x[0]+'" class="slb-feed-tab '+(state.homeFilter===x[0]?'active':'')+'">'+x[1]+'</button>';}).join('')+'</div>';
}
function home(){
  var key=vkey('slb-feed-'+state.homeFilter+'-'+state.feedPage),cached=cacheGet(key,10*60*1000),items=cached&&cached.items||[];
  state.feedPages=Math.max(1,Number(cached&&cached.pages||1));
  var title=state.homeFilter==='recommended'?'Recommended':'Recent Arrivals';
  var html='<main class="slb-page slb-home-feed"><section class="slb-section"><div class="slb-section-head"><h2 style="color:#d72a40">'+title+'</h2></div>'+feedTabs()+'<div id="slb-feed-note" class="slb-feed-note"></div><div id="slb-home-feed">'+productsMarkup(items,true)+'</div><div id="slb-home-pager">'+pagerMarkup(state.feedPage,state.feedPages)+'</div></section></main>';
  setTimeout(function(){loadHomeFeed(state.homeFilter);},0);
  return appShell(html,'home');
}
function loadHomeFeed(filter){
  var key=vkey('slb-feed-'+filter+'-'+state.feedPage);
  var p={per_page:12,page:state.feedPage,stock_status:['instock']};
  if(filter==='recommended'){p.orderby='popularity';p.order='desc';}
  else{p.orderby='date';p.order='desc';}
  var now=Date.now();
  if(filter==='7d')p.after=new Date(now-7*86400000).toISOString();
  if(filter==='30d')p.after=new Date(now-30*86400000).toISOString();
  if(filter==='older30')p.before=new Date(now-30*86400000).toISOString();
  storeApi(p).catch(function(){
    var orderby=filter==='recommended'?'menu_order':'date';
    var order=filter==='recommended'?'ASC':'DESC';
    return api('customer/products?per_page=12&page='+state.feedPage+'&stock_status=instock&orderby='+orderby+'&order='+order);
  }).then(function(data){
    if(state.view!=='home'||state.homeFilter!==filter)return;
    var items=(data.items||[]).filter(function(x){return x.stock_status==='instock';});
    var note='';
    if(!items.length&&filter!=='recommended'){
      note='No products were added in this period — showing recommended products.';
      state.feedPage=1;routeWrite(true);
      return storeApi({per_page:12,page:1,stock_status:['instock'],orderby:'popularity',order:'desc'}).catch(function(){return api('customer/products?per_page=12&page=1&stock_status=instock&orderby=menu_order&order=ASC');}).then(function(fallback){
        fallback.items=(fallback.items||[]).filter(function(x){return x.stock_status==='instock';});
        state.feedPages=Math.max(1,Number(fallback.pages||1));cacheSet(vkey('slb-feed-'+filter+'-1'),fallback);updateHomeFeed(fallback.items,note,fallback);
      });
    }
    data.items=items;state.feedPages=Math.max(1,Number(data.pages||1));cacheSet(key,data);updateHomeFeed(items,note,data);
  }).catch(function(){
    var e=document.getElementById('slb-feed-note');if(e)e.textContent='Unable to refresh products. Pull to refresh and try again.';
  });
}
function updateHomeFeed(items,note,data){
  var e=document.getElementById('slb-home-feed'),n=document.getElementById('slb-feed-note'),p=document.getElementById('slb-home-pager');
  if(data)state.feedPages=Math.max(1,Number(data.pages||1));
  if(e)e.innerHTML=productsMarkup(items||[],true);if(n)n.textContent=note||'';if(p)p.innerHTML=pagerMarkup(state.feedPage,state.feedPages);bind();
}

function categoryCard(c){var has=c.image?'':' no-image';return '<button class="slb-category-card'+has+'" data-cat="'+c.id+'">'+(c.image?'<img src="'+esc(c.image)+'" alt="'+esc(c.name)+'">':'')+'<span>'+esc(c.name)+'</span></button>';}
function sortOption(value,label){return '<option value="'+value+'"'+(state.sort===value?' selected':'')+'>'+label+'</option>';}
function pagerMarkup(page,pages){
  page=Math.max(1,Number(page||1));pages=Math.max(1,Number(pages||1));
  if(pages<=1)return '';
  return '<div class="slb-pager"><button data-page="'+(page-1)+'"'+(page<=1?' disabled':'')+'>← Previous</button><strong>Page '+page+' / '+pages+'</strong><button data-page="'+(page+1)+'"'+(page>=pages?' disabled':'')+'>Next →</button></div>';
}
function productKey(cat,page,sort,per,search){return vkey('slb-products-'+(cat?cat.id:'all')+'-'+page+'-'+sort+'-'+per+'-'+(search||''));}
function categoryView(){
  var cat=state.category;if(!cat)return home();
  var top=isTopCategory(cat),subs=top?collectionFor(cat):[];
  var key=productKey(cat,state.page,state.sort,state.per,''),cached=cacheGet(key,10*60*1000);
  var data=cached||{items:[],total:0,pages:1,page:state.page};
  state.pages=Math.max(1,Number(data.pages||1));
  var headAction=top&&subs.length?'<button class="see-all" data-act="see-all-brands">See all</button>':'<span></span>';
  var html='<main class="slb-page"><div class="slb-page-head"><button class="back" data-act="back">←</button><h1>'+esc(cat.name)+'</h1>'+headAction+'</div>'+ 
    (subs.length?'<div class="slb-subgrid" id="slb-subgrid">'+subs.map(categoryCard).join('')+'</div>':'')+
    '<div class="slb-toolbar"><div class="count" id="slb-count">'+Number(data.total||0)+' products</div><select id="slb-sort">'+sortOption('date-desc','Newest')+sortOption('price-asc','Price: Low to High')+sortOption('price-desc','Price: High to Low')+sortOption('title-asc','A–Z')+'</select></div>'+ 
    '<div class="slb-toolbar secondary"><div class="filter">☰ &nbsp; FILTER</div><select id="slb-per"><option value="20"'+(state.per===20?' selected':'')+'>Show 20</option><option value="30"'+(state.per===30?' selected':'')+'>Show 30</option><option value="50"'+(state.per===50?' selected':'')+'>Show 50</option></select></div>'+ 
    '<div class="slb-product-area" id="slb-product-area">'+productsMarkup(data.items||[])+'</div><div id="slb-pager-wrap">'+pagerMarkup(state.page,state.pages)+'</div></main>';
  setTimeout(loadCategory,0);
  return appShell(html,'home');
}
function categoryRequest(cat){
  if(state.sort==='price-asc'||state.sort==='price-desc'){
    return storeApi({category:cat.id,page:state.page,per_page:state.per,stock_status:['instock'],orderby:'price',order:state.sort==='price-asc'?'asc':'desc'});
  }
  var orderby=state.sort==='title-asc'?'title':'date';
  var order=state.sort==='title-asc'?'ASC':'DESC';
  return api('customer/products?category_id='+encodeURIComponent(cat.id)+'&page='+state.page+'&per_page='+state.per+'&stock_status=instock&orderby='+orderby+'&order='+order);
}
function loadCategory(){
  if(!state.category)return;
  var cat=state.category,key=productKey(cat,state.page,state.sort,state.per,'');
  categoryRequest(cat).then(function(data){
    if(state.view!=='category'||!state.category||Number(state.category.id)!==Number(cat.id))return;
    data.items=(data.items||[]).filter(function(x){return x.stock_status==='instock';});
    state.pages=Math.max(1,Number(data.pages||1));cacheSet(key,data);
    var area=document.getElementById('slb-product-area'),count=document.getElementById('slb-count'),pager=document.getElementById('slb-pager-wrap');
    if(area)area.innerHTML=productsMarkup(data.items||[]);
    if(count)count.textContent=Number(data.total||0)+' products';
    if(pager)pager.innerHTML=pagerMarkup(state.page,state.pages);
    bind();
  }).catch(function(){var area=document.getElementById('slb-product-area');if(area&&!area.children.length)area.innerHTML='<div class="slb-empty">Unable to refresh this category.</div>';});
}

function productsMarkup(items,compact){
  items=(items||[]).filter(function(p){return p&&p.stock_status!=='outofstock';});
  if(!items.length)return '<div class="slb-empty" style="grid-column:1/-1">'+(compact?'':'No in-stock products found.')+'</div>';
  return '<div class="slb-products-grid">'+items.map(function(p){
    return '<article class="slb-product"><div class="slb-product-image"><button class="slb-heart '+(isFav(p.id)?'active':'')+'" data-fav="'+p.id+'">♡</button><img data-product="'+p.id+'" src="'+esc(p.image)+'" alt="'+esc(p.name)+'"></div><div class="slb-product-name" data-product="'+p.id+'">'+esc(p.name)+'</div><div class="slb-price">'+esc(decodeEntities(p.price_html||p.price))+'</div><div class="slb-stock">● In stock</div><button class="slb-add" data-add="'+p.id+'">ADD TO CART</button></article>';
  }).join('')+'</div>';
}
function productView(){
  var p=state.product;if(!p)return home();
  var canAdd=p.stock_status==='instock';
  return appShell('<main class="slb-page"><div class="slb-page-head"><button class="back" data-act="back">←</button><h1>Product</h1><span></span></div><section class="slb-product-detail"><div class="slb-product-detail-image"><img src="'+esc(p.image)+'" alt="'+esc(p.name)+'"></div><h1>'+esc(p.name)+'</h1><div class="slb-detail-price">'+esc(decodeEntities(p.price_html||p.price))+'</div><div class="slb-detail-stock">'+(canAdd?'● In stock':'Out of stock')+'</div><p class="slb-detail-copy">'+esc(p.short_description||p.description||'')+'</p>'+(canAdd?'<div class="slb-qtyrow"><input id="slb-qty" type="number" min="1" value="1"><button class="slb-primary" data-add="'+p.id+'">ADD TO CART</button></div>':'')+'</section></main>','home');
}
function openProduct(id,replace){
  id=Number(id);var key=vkey('slb-product-'+id),c=cacheGet(key,30*60*1000),navigated=false;
  if(c){state.product=c;state.view='product';routeWrite(!!replace);render();navigated=true;}
  api('customer/product/'+id).then(function(p){cacheSet(key,p);state.product=p;state.view='product';routeWrite(navigated?true:!!replace);render();}).catch(function(){toast('Product unavailable');});
}

function searchView(){
  return appShell('<main class="slb-page slb-search-page"><h1 style="font-size:32px;margin:0 0 18px">Search</h1><div class="slb-search-box"><input id="slb-search" placeholder="Search by product or category…" value="'+esc(state.search)+'"><button data-act="search-go">Search</button></div><div id="slb-search-results" class="slb-search-results"></div><div id="slb-search-pager"></div></main>','search');
}
function searchRequest(q){
  var cat=categoryMatch(q);
  if(cat)return api('customer/products?category_id='+encodeURIComponent(cat.id)+'&page='+state.searchPage+'&per_page=30&stock_status=instock&orderby=date&order=DESC');
  return api('customer/products?search='+encodeURIComponent(q)+'&page='+state.searchPage+'&per_page=30&stock_status=instock&orderby=date&order=DESC');
}
function doSearch(reuse){
  var input=document.getElementById('slb-search');
  var q=reuse?state.search:((input&&input.value)||'');
  state.search=String(q||'').trim();if(!reuse)state.searchPage=1;
  var area=document.getElementById('slb-search-results'),pager=document.getElementById('slb-search-pager');
  if(!state.search){if(area)area.innerHTML='';if(pager)pager.innerHTML='';return;}
  routeWrite(true);
  var key=productKey(null,state.searchPage,'date',30,state.search),cached=cacheGet(key,10*60*1000);
  if(cached){if(area)area.innerHTML=productsMarkup(cached.items||[]);state.searchPages=Math.max(1,Number(cached.pages||1));if(pager)pager.innerHTML=pagerMarkup(state.searchPage,state.searchPages);bind();}
  searchRequest(state.search).then(function(d){
    d.items=(d.items||[]).filter(function(x){return x.stock_status==='instock';});cacheSet(key,d);state.searchPages=Math.max(1,Number(d.pages||1));
    if(area)area.innerHTML=productsMarkup(d.items||[]);if(pager)pager.innerHTML=pagerMarkup(state.searchPage,state.searchPages);bind();
  }).catch(function(){if(area)area.innerHTML='<div class="slb-empty">Search unavailable.</div>';});
}

function favoritesView(){
  var ids=favorites(),items=[];
  ids.forEach(function(id){var p=cacheGet(vkey('slb-product-'+id),0);if(p&&p.stock_status==='instock')items.push(p);});
  var html='<main class="slb-page"><div class="slb-page-head"><span></span><h1>Favorites</h1><button class="see-all" data-act="clear-favs">Clear all</button></div><div class="slb-product-area" id="slb-fav-area">'+productsMarkup(items)+'</div></main>';
  setTimeout(function(){ids.forEach(function(id){api('customer/product/'+id).then(function(p){cacheSet(vkey('slb-product-'+id),p);if(state.view==='favorites')render();}).catch(function(){});});},0);
  return appShell(html,'favorites');
}

function cartRequest(op,data){
  var fd=new FormData();fd.append('action','slb_cart');fd.append('nonce',CFG.cartNonce);fd.append('op',op);
  Object.keys(data||{}).forEach(function(k){fd.append(k,data[k]);});
  return fetch(CFG.ajax,{method:'POST',credentials:'same-origin',body:fd}).then(function(r){return r.json();}).then(function(j){if(!j.success)throw new Error((j.data&&j.data.message)||'cart');state.cart=j.data;return j.data;});
}
function addToCart(id,qty,button){
  if(button){button.disabled=true;button.textContent='ADDING…';}
  cartRequest('add',{product_id:id,qty:qty||1}).then(function(){toast('Added to cart');renderHeaderOnly();if(button){button.disabled=false;button.textContent='ADD TO CART';}}).catch(function(){toast('Could not add to cart');if(button){button.disabled=false;button.textContent='ADD TO CART';}});
}
function renderHeaderOnly(){var old=document.querySelector('.slb-top');if(old){var tmp=document.createElement('div');tmp.innerHTML=header();old.replaceWith(tmp.firstChild);bind();}}
function cartView(){
  var cart=state.cart||{items:[],count:0,subtotal:'',total:''};
  var lines=(cart.items||[]).map(function(x){return '<div class="slb-cart-line"><img src="'+esc(x.image||'')+'"><div><h3>'+esc(x.name)+'</h3><input type="number" min="0" value="'+x.qty+'" data-cart-qty="'+esc(x.key)+'"></div><button class="slb-cart-remove" data-cart-remove="'+esc(x.key)+'">×</button></div>';}).join('');
  return appShell('<main class="slb-page"><div class="slb-page-head"><button class="back" data-act="back">←</button><h1>Cart</h1><span></span></div><section class="slb-cart-page" id="slb-cart-body">'+(lines||'<div class="slb-empty">Your cart is empty.</div>')+(cart.items&&cart.items.length?'<div class="slb-cart-totals"><div><span>Subtotal</span><b>'+esc(decodeEntities(cart.subtotal))+'</b></div><div class="total"><span>Total</span><b>'+esc(decodeEntities(cart.total))+'</b></div><a class="slb-primary" style="display:flex;align-items:center;justify-content:center;text-decoration:none;margin-top:14px" href="'+esc(CFG.checkoutUrl)+'">CHECKOUT</a></div>':'')+'</section></main>','home');
}
function loadCart(){cartRequest('get',{}).then(function(){if(state.view==='cart')render();else renderHeaderOnly();}).catch(function(){});}

function accountView(){
  return appShell('<main class="slb-page slb-account"><h1 style="font-size:32px;margin:0 0 20px">Account</h1><a class="slb-account-card" href="'+esc(CFG.accountUrl)+'">Orders</a><a class="slb-account-card" href="'+esc(CFG.accountUrl)+'edit-address/">Addresses</a><button class="slb-account-card" style="width:100%;text-align:left;background:#fff" data-nav="favorites">Favorites</button><a class="slb-account-card" href="'+esc((state.bootstrap&&state.bootstrap.links&&state.bootstrap.links.loyalty)||'#')+'">Loyalty</a></main>','account');
}

function render(){
  if(!state.bootstrap){root.innerHTML='<div class="slb-app"><div class="slb-page"></div></div>';return;}
  if(state.view==='home')root.innerHTML=home();
  else if(state.view==='category')root.innerHTML=categoryView();
  else if(state.view==='product')root.innerHTML=productView();
  else if(state.view==='search')root.innerHTML=searchView();
  else if(state.view==='favorites')root.innerHTML=favoritesView();
  else if(state.view==='cart')root.innerHTML=cartView();
  else if(state.view==='account')root.innerHTML=accountView();
  else root.innerHTML=home();
  bind();
  if(state.view==='search'&&state.search)setTimeout(function(){doSearch(true);},0);
}

function routeUrl(){
  var u=new URL(location.pathname,location.origin);
  if(state.view!=='home')u.searchParams.set('view',state.view);
  if(state.view==='category'&&state.category){u.searchParams.set('cat',state.category.id);u.searchParams.set('page',state.page);u.searchParams.set('sort',state.sort);u.searchParams.set('per',state.per);}
  if(state.view==='product'&&state.product)u.searchParams.set('product',state.product.id);
  if(state.view==='search'&&state.search){u.searchParams.set('q',state.search);u.searchParams.set('page',state.searchPage);}
  if(state.view==='home'){if(state.homeFilter!=='recommended')u.searchParams.set('feed',state.homeFilter);if(state.feedPage>1)u.searchParams.set('page',state.feedPage);}
  return u.pathname+(u.searchParams.toString()?'?'+u.searchParams.toString():'');
}
function routeState(){return {view:state.view,cat:state.category&&state.category.id||0,product:state.product&&state.product.id||0,page:state.page,sort:state.sort,per:state.per,q:state.search,searchPage:state.searchPage,feed:state.homeFilter,feedPage:state.feedPage};}
function routeWrite(replace){if(state.restoring)return;var fn=replace?'replaceState':'pushState';history[fn](routeState(),'',routeUrl());}
function nav(view,replace){
  state.view=view;
  if(view==='home'){state.category=null;state.product=null;state.homeFilter='recommended';state.feedPage=1;}
  if(view==='search'){state.searchPage=1;}
  routeWrite(!!replace);render();if(view==='cart')loadCart();
}
function openCategory(id,replace){
  var cat=categoryById(id);if(!cat)return;
  state.category=cat;state.product=null;state.view='category';state.page=1;state.pages=1;state.sort='date-desc';state.per=30;
  routeWrite(!!replace);render();
}
function goBack(){if(history.length>1)history.back();else nav('home',true);}
function restoreRoute(){
  var p=new URLSearchParams(location.search),view=p.get('view')||'home';
  state.restoring=true;
  state.view=view;
  state.homeFilter=p.get('feed')||'recommended';
  state.feedPage=Math.max(1,Number(p.get('page')||1));
  if(view==='category'){
    state.category=categoryById(p.get('cat'));
    state.page=Math.max(1,Number(p.get('page')||1));
    state.sort=p.get('sort')||'date-desc';
    state.per=[20,30,50].indexOf(Number(p.get('per')))>=0?Number(p.get('per')):30;
    if(!state.category){state.view='home';state.homeFilter='recommended';}
  }else if(view==='search'){
    state.search=p.get('q')||'';state.searchPage=Math.max(1,Number(p.get('page')||1));
  }else if(view==='product'){
    var id=Number(p.get('product')||0);state.view='home';state.restoring=false;render();if(id)openProduct(id,true);return;
  }
  state.restoring=false;render();routeWrite(true);
}

function bind(){
  root.querySelectorAll('[data-nav]').forEach(function(e){e.onclick=function(ev){ev.preventDefault();openDrawer(false);nav(this.dataset.nav,false);};});
  root.querySelectorAll('[data-cat]').forEach(function(e){e.onclick=function(){openDrawer(false);openCategory(this.dataset.cat,false);};});
  root.querySelectorAll('[data-product]').forEach(function(e){e.onclick=function(){openProduct(this.dataset.product,false);};});
  root.querySelectorAll('[data-fav]').forEach(function(e){e.onclick=function(ev){ev.stopPropagation();toggleFav(this.dataset.fav);};});
  root.querySelectorAll('[data-add]').forEach(function(e){e.onclick=function(){var q=document.getElementById('slb-qty');addToCart(this.dataset.add,q?Math.max(1,Number(q.value)||1):1,this);};});
  root.querySelectorAll('[data-feed]').forEach(function(e){e.onclick=function(){state.homeFilter=this.dataset.feed;state.feedPage=1;routeWrite(true);render();};});
  root.querySelectorAll('[data-page]').forEach(function(e){e.onclick=function(){if(this.disabled)return;var p=Math.max(1,Number(this.dataset.page||1));if(state.view==='search'){state.searchPage=p;routeWrite(true);doSearch(true);}else if(state.view==='category'){state.page=p;routeWrite(true);render();}else if(state.view==='home'){state.feedPage=p;routeWrite(true);render();}window.scrollTo({top:0,behavior:'smooth'});};});
  root.querySelectorAll('[data-act="drawer"]').forEach(function(e){e.onclick=function(){openDrawer(true);};});
  root.querySelectorAll('[data-act="drawer-close"]').forEach(function(e){e.onclick=function(){openDrawer(false);};});
  var bd=document.querySelector('.slb-backdrop');if(bd)bd.onclick=function(){openDrawer(false);};
  root.querySelectorAll('[data-act="back"]').forEach(function(e){e.onclick=goBack;});
  root.querySelectorAll('[data-act="search-go"]').forEach(function(e){e.onclick=function(){doSearch(false);};});
  root.querySelectorAll('[data-act="clear-favs"]').forEach(function(e){e.onclick=function(){setFavorites([]);render();};});
  root.querySelectorAll('[data-act="see-all-brands"]').forEach(function(e){e.onclick=function(){var g=document.getElementById('slb-subgrid');if(g)g.scrollIntoView({behavior:'smooth',block:'start'});};});
  var sort=document.getElementById('slb-sort');if(sort)sort.onchange=function(){state.sort=this.value;state.page=1;routeWrite(true);render();};
  var per=document.getElementById('slb-per');if(per)per.onchange=function(){state.per=Number(this.value)||30;state.page=1;routeWrite(true);render();};
  var si=document.getElementById('slb-search');if(si)si.onkeydown=function(e){if(e.key==='Enter')doSearch(false);};
  root.querySelectorAll('[data-cart-remove]').forEach(function(e){e.onclick=function(){cartRequest('remove',{key:this.dataset.cartRemove}).then(render);};});
  root.querySelectorAll('[data-cart-qty]').forEach(function(e){e.onchange=function(){cartRequest('update',{key:this.dataset.cartQty,qty:this.value}).then(render);};});
  normalizeBrandLockups();
}

function ageGate(){
  var ok=false;try{ok=localStorage.getItem('slb-age-ok')==='1'||localStorage.getItem('slb-age-ok-v116')==='1';}catch(e){}
  if(ok)return;
  var a=document.createElement('div');a.className='slb-age';
  a.innerHTML='<div class="slb-age-card"><h2>Welcome to<br>ShishaLove</h2><p>This storefront may contain age-restricted products. Confirm that you meet the legal age requirement in your location.</p><button class="slb-primary">I confirm I am of legal age</button><a class="slb-age-leave" href="https://www.google.com/">Leave</a></div>';
  document.body.appendChild(a);
  a.querySelector('button').onclick=function(){try{localStorage.setItem('slb-age-ok','1');}catch(e){}a.remove();};
}

function ensureRuntimeStyles(){
  if(document.getElementById('slb-117-style'))return;
  var s=document.createElement('style');s.id='slb-117-style';s.textContent='\
.slb-home-feed .slb-section{padding-top:28px}.slb-feed-tabs{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;padding:0 0 14px}.slb-feed-tabs::-webkit-scrollbar{display:none}.slb-feed-tab{white-space:nowrap;border:1px solid #e1e1e3;background:#fff;border-radius:999px;padding:11px 16px;font-weight:800;color:#666}.slb-feed-tab.active{background:#111;color:#fff;border-color:#111}.slb-feed-note{font-size:13px;color:#777;min-height:0;margin:0 0 10px}.slb-pager{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;padding:8px 24px 30px}.slb-pager button{min-height:48px;border:1px solid #ddd;background:#fff;font-weight:800}.slb-pager button:last-child{justify-self:stretch}.slb-pager button:disabled{opacity:.35}.slb-pager strong{text-align:center;font-size:14px;white-space:nowrap}.slb-add:disabled{opacity:.6}@media(max-width:380px){.slb-pager{grid-template-columns:1fr 1fr}.slb-pager strong{grid-column:1/-1;grid-row:1}.slb-pager button{grid-row:2}}';
  document.head.appendChild(s);
}

window.addEventListener('popstate',function(){if(!state.bootstrap)return;restoreRoute();});

function start(){
  ensureRuntimeStyles();
  var bootstrapKey=vkey('slb-bootstrap'),cached=cacheGet(bootstrapKey,30*60*1000),started=false;
  function boot(data){
    if(!data)return;state.bootstrap=data;
    if(!started){started=true;restoreRoute();ageGate();loadCart();}
    else{render();}
  }
  if(cached)boot(cached);
  api('customer/bootstrap').then(function(data){cacheSet(bootstrapKey,data);boot(data);}).catch(function(){if(!state.bootstrap)root.innerHTML='<div class="slb-empty">Unable to connect to ShishaLove.</div>';});
}

start();
})();
