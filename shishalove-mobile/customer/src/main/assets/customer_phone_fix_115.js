(function(){
'use strict';
var BASE='https://shishalove.eu';
var HOME=BASE+'/shishalove-app/?app=android&build=115';
var ROUTES={
  'Hookah':'/product-category/hookah/',
  'Bowls':'/product-category/bowls/',
  'Hoses':'/product-category/hose/',
  'Accessories':'/product-category/accessories/',
  'Charcoal':'/product-category/charcoal/',
  'Flavors':'/product-category/flavors/',
  'Merchandise':'/product-category/merchandise/',
  'Wookah':'/product-category/wookah/hookah-wookah/',
  'Alpha':'/product-category/alpha/',
  'Steamulation':'/product-category/steamulation/',
  'Union':'/product-category/union/',
  'MIG':'/product-category/mig/',
  'El-Badia':'/product-category/el-badia/hookah-el-badia/',
  'Moze':'/product-category/moze/hookah-moze/',
  'Anima':'/product-category/anima/',
  'Gold Miner':'/product-category/goldminer/',
  'YKAP':'/product-category/ykap/',
  'Mexanika':'/product-category/mexanika/',
  'DIAVLA':'/product-category/diavla/'
};
var BRAND_PATHS=[
  [/\/product-category\/wookah\/hookah-wookah\/?$/i,'Wookah'],
  [/\/product-category\/alpha\/?$/i,'Alpha'],
  [/\/product-category\/steamulation\/?$/i,'Steamulation'],
  [/\/product-category\/union\/?$/i,'Union'],
  [/\/product-category\/mig\/?$/i,'MIG'],
  [/\/product-category\/el-badia\/hookah-el-badia\/?$/i,'El-Badia'],
  [/\/product-category\/moze\/hookah-moze\/?$/i,'Moze'],
  [/\/product-category\/anima\/?$/i,'Anima'],
  [/\/product-category\/goldminer\/?$/i,'Gold Miner'],
  [/\/product-category\/ykap\/?$/i,'YKAP'],
  [/\/product-category\/mexanika\/?$/i,'Mexanika'],
  [/\/product-category\/diavla\/?$/i,'DIAVLA']
];
function all(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
function text(e){return (e&&(e.innerText||e.textContent)||'').replace(/\s+/g,' ').trim();}
function abs(path){try{return new URL(path,BASE).href;}catch(e){return path;}}
function visible(e){if(!e||!e.getBoundingClientRect)return false;var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>1&&r.height>1&&s.display!=='none'&&s.visibility!=='hidden';}
function routeUrl(path){var join=path.indexOf('?')>=0?'&':'?';return abs(path)+join+'app=android&build=115';}
function currentCategoryName(){var p=location.pathname;for(var i=0;i<BRAND_PATHS.length;i++)if(BRAND_PATHS[i][0].test(p))return BRAND_PATHS[i][1];var m=p.toLowerCase();if(/^\/product-category\/flavors\/?$/.test(m))return'Flavors';if(/^\/product-category\/charcoal\/?$/.test(m))return'Charcoal';if(/^\/product-category\/hose\/?$/.test(m))return'Hoses';if(/^\/product-category\/merchandise\/?$/.test(m))return'Merchandise';var seg=m.split('/').filter(Boolean);if(seg.length>2){var last=seg[seg.length-1].replace(/-/g,' ');return last.replace(/\b\w/g,function(c){return c.toUpperCase();});}return'';}
function isProductCategory(){return location.pathname.toLowerCase().indexOf('/product-category/')===0;}
function isParentGrid(){var p=location.pathname.toLowerCase();return /^\/product-category\/(hookah|bowls|accessories)\/?$/.test(p);}
function style(){if(document.getElementById('sl115-fix-style'))return;var s=document.createElement('style');s.id='sl115-fix-style';s.textContent='\
#sl114-drawer,.sl114-lower,#sl114-drawer .sl114-lower{background:#080808!important;color:#fff!important}#sl114-drawer .sl114-lower a,#sl114-drawer .sl114-lower button{display:flex!important;visibility:visible!important;opacity:1!important;background:#080808!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border:0!important;border-bottom:1px solid #171717!important;min-height:52px!important;height:auto!important;padding:0 6px!important;margin:0!important;box-shadow:none!important}#sl114-drawer .sl114-lower i{color:#fff!important;-webkit-text-fill-color:#fff!important}#sl114-drawer .sl114-sec{background:#080808!important}\
body.sl115-category{background:#fff!important;padding-bottom:82px!important}body.sl115-category header:not(#sl114-appbar):not(#sl115-category-head),body.sl115-category .site-header,body.sl115-category #masthead,body.sl115-category footer,body.sl115-category .site-footer{display:none!important}#sl115-category-head{display:flex;align-items:center;gap:16px;min-height:92px;padding:18px 24px 14px;background:#fff;border-bottom:1px solid #eee;box-sizing:border-box;position:relative;z-index:80}#sl115-category-head .back{border:0;background:transparent;font-size:31px;line-height:1;padding:0;width:42px;color:#111}#sl115-category-head h1{font:800 32px/1.05 Arial;margin:0;flex:1;color:#111;text-align:left}#sl115-category-head .all{font:800 14px Arial;color:#111;text-decoration:none;white-space:nowrap}body.sl115-category .woocommerce-products-header,body.sl115-category .shop_header,body.sl115-category .shop-header,body.sl115-category .page-header{display:none!important}body.sl115-category main,body.sl115-category .site-content,body.sl115-category .content-area,body.sl115-category #primary{margin-top:0!important;padding-top:0!important}body.sl115-category .woocommerce-result-count{margin:14px 24px!important;color:#777!important;font-size:15px!important}body.sl115-category .woocommerce-ordering{margin:10px 24px 16px!important;float:none!important;text-align:right!important}body.sl115-category .woocommerce-ordering select{min-height:44px!important;border:1px solid #ddd!important;background:#fff!important;padding:0 12px!important;font-size:16px!important}body.sl115-category ul.products{margin-top:8px!important;padding-left:18px!important;padding-right:18px!important;box-sizing:border-box!important}body.sl115-category .products .product{margin-bottom:28px!important}body.sl115-category .shop-sidebar,body.sl115-category .widget-area,body.sl115-category .shopkeeper-woocommerce-sidebar{display:none!important}\
body.sl114-drawer-open .mobile-menu,body.sl114-drawer-open .mobile-navigation,body.sl114-drawer-open .offcanvas-menu,body.sl114-drawer-open .off-canvas,body.sl114-drawer-open .site-header-offcanvas,body.sl114-drawer-open .shopkeeper-menu,body.sl114-drawer-open .st-menu{display:none!important}\
';document.head.appendChild(s);}
function exactLeaf(label){var want=String(label).toLowerCase();var nodes=all('a,button,span,strong,h1,h2,h3,h4,div');for(var i=0;i<nodes.length;i++){var e=nodes[i];if(!visible(e))continue;if(text(e).toLowerCase()===want)return e;}return null;}
function forceRoutes(){Object.keys(ROUTES).forEach(function(label){var nodes=all('a,button,[role="button"],.sl114-card');for(var i=0;i<nodes.length;i++){var n=nodes[i],t=text(n).toLowerCase();if(t!==label.toLowerCase())continue;var a=n.tagName==='A'?n:(n.closest?n.closest('a'):null);if(a){a.href=routeUrl(ROUTES[label]);a.dataset.sl115Route=label;}else if(!n.dataset.sl115Route){n.dataset.sl115Route=label;n.addEventListener('click',function(ev){var name=this.dataset.sl115Route;if(!name||!ROUTES[name])return;ev.preventDefault();ev.stopPropagation();location.assign(routeUrl(ROUTES[name]));},true);}}});}
function interceptRoutes(){if(window.__sl115RouteCapture)return;window.__sl115RouteCapture=1;document.addEventListener('click',function(e){var n=e.target&&e.target.closest?e.target.closest('[data-sl115-route]'):null;if(!n)return;var name=n.dataset.sl115Route;if(!ROUTES[name])return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();location.assign(routeUrl(ROUTES[name]));},true);}
function suppressNativeAge(){all('body *').forEach(function(e){if(e.id==='sl114-age'||(e.closest&&e.closest('#sl114-age')))return;var t=text(e).toLowerCase();var hit=t.indexOf('this storefront may contain age-restricted products')>=0||t.indexOf('are you over 18 years of age')>=0||(t.indexOf('remember me')>=0&&t.indexOf('yes')>=0&&t.indexOf('no')>=0);if(!hit)return;var n=e,best=e;for(var i=0;i<7&&n&&n!==document.body;i++,n=n.parentElement){var r=n.getBoundingClientRect?n.getBoundingClientRect():{width:0,height:0};if(r.width>250&&r.height>180)best=n;var pos=getComputedStyle(n).position;if((pos==='fixed'||pos==='absolute')&&r.width>innerWidth*.55&&r.height>innerHeight*.35){best=n;break;}}best.style.setProperty('display','none','important');});}
function cleanOwnAge(){var g=document.getElementById('sl114-age');if(!g)return;all('div,span,p,strong,i,em',g).forEach(function(e){var t=text(e).toLowerCase();if(t==='shishalove'&&!e.querySelector('h1,h2,h3'))e.style.setProperty('display','none','important');});}
function ensureShell(){if(location.pathname.toLowerCase().indexOf('/shishalove-app')===0)return;document.body.classList.add('sl114-appshell');if(!document.getElementById('sl114-appbar')){var bar=document.createElement('header');bar.id='sl114-appbar';bar.innerHTML='<button class="m" aria-label="menu">☰</button><a class="brand" href="'+HOME+'">shishalove</a><div class="right"><span>EN <b class="sl114-caret">⌄</b></span><a href="'+BASE+'/cart/" aria-label="Cart">🛒</a></div>';document.body.insertBefore(bar,document.body.firstChild);}if(!document.getElementById('sl114-bottom')){var b=document.createElement('nav');b.id='sl114-bottom';b.innerHTML='<a class="home" href="'+HOME+'"><i>⌂</i>Home</a><a href="'+BASE+'/?s=&post_type=product"><i>⌕</i>Search</a><a href="'+BASE+'/wishlist/"><i>♡</i>Favorites</a><a href="'+BASE+'/my-account/"><i>♙</i>Account</a>';document.body.appendChild(b);}}
function hideNativeTitle(name){if(!name)return;all('h1,h2,.page-title,.woocommerce-products-header__title').forEach(function(h){if(!visible(h)||text(h).toLowerCase()!==name.toLowerCase())return;if(h.closest&&h.closest('#sl115-category-head'))return;var n=h,best=h;for(var i=0;i<3&&n&&n.parentElement;i++,n=n.parentElement){var p=n.parentElement,r=p.getBoundingClientRect();if(r.width>innerWidth*.75&&r.height<280&&r.height>40)best=p;else break;}best.style.setProperty('display','none','important');});}
function ensureCategoryHead(){if(!isProductCategory()||isParentGrid())return;document.body.classList.add('sl115-category');var name=currentCategoryName();if(!name)return;var head=document.getElementById('sl115-category-head');if(!head){head=document.createElement('section');head.id='sl115-category-head';head.innerHTML='<button class="back" aria-label="Back">←</button><h1></h1><a class="all" href="'+HOME+'">See all</a>';var bar=document.getElementById('sl114-appbar');if(bar&&bar.parentNode)bar.parentNode.insertBefore(head,bar.nextSibling);else document.body.insertBefore(head,document.body.firstChild);head.querySelector('.back').onclick=function(){var p=location.pathname.toLowerCase();if(BRAND_PATHS.some(function(x){return x[0].test(location.pathname);}))location.assign(routeUrl('/product-category/hookah/'));else if(p.indexOf('/product-category/bowls/')===0)location.assign(routeUrl('/product-category/bowls/'));else if(p.indexOf('/product-category/accessories/')===0)location.assign(routeUrl('/product-category/accessories/'));else location.assign(HOME);};}head.querySelector('h1').textContent=name;document.title=name+' – ShishaLove';hideNativeTitle(name);}
function fixCategoryTruth(){var name=currentCategoryName();if(!name)return;all('h1,h2,.page-title,.category-title').forEach(function(h){if(!visible(h)||h.closest&&h.closest('#sl115-category-head'))return;var t=text(h).toLowerCase();if(t==='hookah'||t==='wookah'||t==='alpha'||t==='steamulation'||t==='union'||t==='mig'||t==='el-badia'||t==='moze'||t==='anima'||t==='gold miner'||t==='ykap'||t==='mexanika'||t==='diavla')h.textContent=name;});}
function hardenDrawer(){var d=document.getElementById('sl114-drawer');if(!d)return;var lower=d.querySelector('.sl114-lower');if(lower){lower.style.setProperty('background','#080808','important');all('a,button',lower).forEach(function(e){e.style.setProperty('background','#080808','important');e.style.setProperty('color','#fff','important');e.style.setProperty('-webkit-text-fill-color','#fff','important');});}}
function fix(){style();suppressNativeAge();cleanOwnAge();ensureShell();forceRoutes();interceptRoutes();fixCategoryTruth();ensureCategoryHead();hardenDrawer();}
fix();setTimeout(fix,80);setTimeout(fix,260);setTimeout(fix,900);if(!window.__sl115Obs){var queued=false;window.__sl115Obs=new MutationObserver(function(){if(queued)return;queued=true;setTimeout(function(){queued=false;fix();},80);});window.__sl115Obs.observe(document.documentElement,{childList:true,subtree:true});}
})();
