(function(){
'use strict';
var CFG=window.SHISHALOVE_BRIDGE||{};
var root=document.getElementById('slb-root');
if(!root)return;

var state={
  view:'orders',
  bootstrap:null,
  query:'',
  categoryId:0,
  stockStatus:'all',
  page:1,
  per:20,
  products:null,
  orders:null,
  loading:false,
  orderBusy:false,
  orderTimer:null,
  searchTimer:null,
  lastSeen:Number(localStorage.getItem('slsl-beta-last-order-v1')||0)||0
};

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
function api(path){
  var h={};
  if(CFG.restNonce)h['X-WP-Nonce']=CFG.restNonce;
  return fetch(CFG.rest+path+(path.indexOf('?')>=0?'&':'?')+'_='+Date.now(),{
    credentials:'same-origin',
    cache:'no-store',
    headers:h
  }).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();});
}
function logo(){
  return CFG.logo?'<img src="'+esc(CFG.logo)+'" alt="ShishaLove">':'<strong>ShishaLove</strong>';
}
function top(){
  return '<header class="slsl-top"><button type="button" data-act="menu">☰</button><div class="slsl-brand">'+logo()+'<span>MERCHANT BETA</span></div><button type="button" data-act="refresh">↻</button></header>';
}
function bottom(){
  var items=[['dashboard','⌂','Dashboard'],['orders','▣','Orders'],['products','◇','Products'],['stock','▤','Stock'],['more','☰','More']];
  return '<nav class="slsl-bottom">'+items.map(function(x){return '<button type="button" data-view="'+x[0]+'" class="'+(state.view===x[0]?'active':'')+'"><i>'+x[1]+'</i><span>'+x[2]+'</span></button>';}).join('')+'</nav>';
}
function shell(body){return '<div class="slsl-app">'+top()+body+bottom()+'<div id="slsl-toast" class="slsl-toast" aria-live="assertive"></div></div>';}
function login(){
  root.innerHTML='<main class="slsl-login"><div class="slsl-login-card">'+logo()+'<h1>Merchant Beta</h1><p>Sign in with your authorized WordPress account to test live WooCommerce data.</p><a href="'+esc(CFG.loginUrl)+'">SIGN IN</a></div></main>';
}
function toast(msg){
  var t=document.getElementById('slsl-toast');if(!t)return;
  t.textContent=msg;t.classList.add('show');
  clearTimeout(t._timer);t._timer=setTimeout(function(){t.classList.remove('show');},3200);
}
function statusPill(text,kind){return '<span class="slsl-pill '+(kind||'')+'">'+esc(text)+'</span>';}
function ordersBody(){
  var items=state.orders&&state.orders.items||[];
  return '<main class="slsl-page"><div class="slsl-head"><div><h1>Orders</h1><div class="slsl-muted">Live WooCommerce orders · checks every 10 sec</div></div>'+statusPill('LIVE','live')+'</div>'+
    '<section class="slsl-orders">'+(state.orders?orderRows(items):skeleton(5))+'</section></main>';
}
function orderRows(items){
  if(!items.length)return '<div class="slsl-empty">No orders found.</div>';
  return items.map(function(o){
    return '<article class="slsl-order"><div class="slsl-order-top"><strong>#'+esc(o.number)+' · '+esc(o.customer||'Customer')+'</strong>'+statusPill(o.status||'','')+'</div><div class="slsl-muted">'+esc(o.date)+' · '+esc(o.total)+'</div></article>';
  }).join('');
}
function categoryOptions(){
  var cats=state.bootstrap&&state.bootstrap.categories||[];
  return '<option value="0">All categories</option>'+cats.map(function(c){return '<option value="'+c.id+'"'+(Number(state.categoryId)===Number(c.id)?' selected':'')+'>'+esc(c.name)+'</option>';}).join('');
}
function productsBody(stock){
  var data=state.products,items=data&&data.items||[];
  return '<main class="slsl-page"><div class="slsl-head"><div><h1>'+(stock?'Stock':'Products')+'</h1><div class="slsl-muted">'+(data?Number(data.total||0)+' matching products':'Live catalogue')+'</div></div></div>'+
    '<div class="slsl-search-wrap"><input id="slsl-search" autocomplete="off" placeholder="Search product name, SKU or brand" value="'+esc(state.query)+'"></div>'+
    '<div class="slsl-filters"><select id="slsl-category">'+categoryOptions()+'</select>'+
      '<select id="slsl-stock"><option value="all"'+(state.stockStatus==='all'?' selected':'')+'>Filter · All</option><option value="instock"'+(state.stockStatus==='instock'?' selected':'')+'>Filter · In stock</option><option value="outofstock"'+(state.stockStatus==='outofstock'?' selected':'')+'>Filter · Out of stock</option></select></div>'+
    '<div class="slsl-search-hint">'+(state.query?'Showing live partial matches for “'+esc(state.query)+'”':'Start typing — results update automatically')+'</div>'+
    '<section class="slsl-products">'+(data?productRows(items):skeleton(6))+'</section></main>';
}
function productRows(items){
  if(!items.length)return '<div class="slsl-empty">No matching products.</div>';
  return items.map(function(p){
    var stock=p.stock_status==='instock'?'In stock':p.stock_status==='outofstock'?'Out of stock':p.stock_status||'';
    return '<article class="slsl-product"><img src="'+esc(p.image||'')+'" alt=""><div class="slsl-product-copy"><strong>'+esc(p.name)+'</strong><span>'+esc(p.sku?('SKU '+p.sku):'')+'</span><span>'+esc(p.price_html||p.regular_price||'')+'</span></div><span class="slsl-stock '+(p.stock_status==='instock'?'ok':'')+'">'+esc(stock)+'</span></article>';
  }).join('');
}
function dashboardBody(){
  var oc=state.orders&&state.orders.total,pc=state.products&&state.products.total;
  return '<main class="slsl-page"><div class="slsl-head"><div><h1>Dashboard</h1><div class="slsl-muted">Merchant beta status</div></div></div><div class="slsl-cards"><div><b>'+(oc==null?'—':oc)+'</b><span>Orders</span></div><div><b>'+(pc==null?'—':pc)+'</b><span>Products</span></div></div><div class="slsl-beta-note">This preview reads fresh WooCommerce data without changing the production Merchant app.</div></main>';
}
function moreBody(){
  var u=state.bootstrap&&state.bootstrap.user||{};
  return '<main class="slsl-page"><div class="slsl-head"><div><h1>More</h1><div class="slsl-muted">Signed in as '+esc(u.name||'WordPress user')+'</div></div></div><div class="slsl-beta-note"><strong>Beta only</strong><br>Production Merchant and live Bridge are unchanged.</div></main>';
}
function skeleton(n){var a=[];for(var i=0;i<n;i++)a.push('<div class="slsl-skeleton"></div>');return a.join('');}
function render(){
  if(!CFG.merchantAllowed){login();return;}
  var body=state.view==='orders'?ordersBody():state.view==='products'?productsBody(false):state.view==='stock'?productsBody(true):state.view==='dashboard'?dashboardBody():moreBody();
  root.innerHTML=shell(body);bind();
}
function bind(){
  root.querySelectorAll('[data-view]').forEach(function(b){b.onclick=function(){navigate(this.dataset.view);};});
  var refresh=root.querySelector('[data-act="refresh"]');if(refresh)refresh.onclick=function(){refreshCurrent(true);};
  var q=document.getElementById('slsl-search');
  if(q){
    q.oninput=function(){
      var val=this.value;
      clearTimeout(state.searchTimer);
      state.searchTimer=setTimeout(function(){state.query=String(val||'').trim();state.page=1;loadProducts();},220);
    };
  }
  var c=document.getElementById('slsl-category');if(c)c.onchange=function(){state.categoryId=Number(this.value)||0;state.page=1;loadProducts();};
  var s=document.getElementById('slsl-stock');if(s)s.onchange=function(){state.stockStatus=this.value||'all';state.page=1;loadProducts();};
}
function navigate(view){
  state.view=view;state.page=1;render();
  if(view==='orders')loadOrders(false);
  if(view==='products'||view==='stock')loadProducts();
}
function loadBootstrap(){
  return api('merchant/bootstrap').then(function(d){state.bootstrap=d;render();}).catch(function(){render();});
}
function productUrl(){
  var url='merchant/products?page=1&per_page=20&search='+encodeURIComponent(state.query);
  if(state.categoryId)url+='&category_id='+state.categoryId;
  if(state.stockStatus!=='all')url+='&stock_status='+encodeURIComponent(state.stockStatus);
  return url;
}
var productSeq=0;
function loadProducts(){
  var seq=++productSeq,input=document.getElementById('slsl-search'),focused=!!(input&&document.activeElement===input),caret=focused&&input.selectionStart!=null?input.selectionStart:null;
  api(productUrl()).then(function(d){
    if(seq!==productSeq)return;
    state.products=d;render();
    if(focused){
      var next=document.getElementById('slsl-search');
      if(next){try{next.focus({preventScroll:true});}catch(e){next.focus();}if(caret!=null&&next.setSelectionRange){try{next.setSelectionRange(caret,caret);}catch(e){}}}
    }
  }).catch(function(){if(seq===productSeq){state.products={items:[],total:0};render();}});
}
function loadOrders(notify){
  if(state.orderBusy)return;
  state.orderBusy=true;
  api('merchant/orders?page=1&per_page=20').then(function(d){
    var items=d&&d.items||[],latest=0;
    items.forEach(function(o){latest=Math.max(latest,Number(o.id)||0);});
    if(!state.lastSeen&&latest){state.lastSeen=latest;localStorage.setItem('slsl-beta-last-order-v1',String(latest));}
    else if(notify&&latest>state.lastSeen){
      var fresh=items.filter(function(o){return Number(o.id)>state.lastSeen;}).sort(function(a,b){return Number(a.id)-Number(b.id);});
      fresh.forEach(function(o){toast('New order #'+(o.number||o.id)+' · '+(o.customer||'Customer'));});
      state.lastSeen=latest;localStorage.setItem('slsl-beta-last-order-v1',String(latest));
    }
    state.orders=d;if(state.view==='orders'||state.view==='dashboard')render();
  }).catch(function(){}).finally(function(){state.orderBusy=false;});
}
function startOrderPolling(){
  loadOrders(false);
  if(state.orderTimer)clearInterval(state.orderTimer);
  state.orderTimer=setInterval(function(){if(!document.hidden)loadOrders(true);},10000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)loadOrders(true);});
  window.addEventListener('focus',function(){loadOrders(true);});
}
function refreshCurrent(notify){
  if(state.view==='orders'||state.view==='dashboard')loadOrders(!!notify);
  if(state.view==='products'||state.view==='stock')loadProducts();
}
if(!CFG.merchantAllowed){render();return;}
render();
loadBootstrap().then(function(){if(state.view==='products'||state.view==='stock')loadProducts();});
startOrderPolling();
})();