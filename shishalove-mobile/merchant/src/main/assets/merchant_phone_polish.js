(function(){
'use strict';
var VERSION='1.1.5', BASE='https://shishalove.eu';
var QUICK=['Hookah','Accessories','Bowls','Charcoal','Hoses','Flavors'];
var seed={Hookah:30,Accessories:24,Bowls:22,Charcoal:10,Hoses:8,Flavors:7};
function all(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
function tx(e){return (e&&(e.innerText||e.textContent)||'').replace(/\s+/g,' ').trim();}
function vis(e){if(!e||!e.getBoundingClientRect)return false;var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>1&&r.height>1&&s.display!=='none'&&s.visibility!=='hidden';}
function norm(u){if(!u)return'';u=String(u).trim().split(/\s+/)[0];if(u.indexOf('//')===0)u='https:'+u;u=u.replace(/^http:\/\/(www\.)?shishalove\.eu/i,BASE);try{return new URL(u,location.href).href;}catch(e){return u;}}
function imageCandidate(img){if(!img)return'';var a=['data-src','data-lazy-src','data-original','data-lazyload','data-lazy','data-image','data-orig-file'];for(var i=0;i<a.length;i++){var v=img.getAttribute(a[i]);if(v)return norm(v);}var set=img.getAttribute('data-srcset')||img.getAttribute('srcset');if(set)return norm(set.split(',').pop().trim().split(/\s+/)[0]);return norm(img.getAttribute('src')||'');}
function style(){if(document.getElementById('slm115-style'))return;var s=document.createElement('style');s.id='slm115-style';s.textContent='\
:root{--mr:#d9253f}.slm114-hidden-loading{display:none!important}.slm114-quick{margin:10px 0 18px;padding:0 2px}.slm114-quick h3{margin:0 0 8px;font:800 14px Arial;color:#111}.slm114-quick-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.slm114-q{position:relative;height:96px;border:1px solid #e5e5e5;border-radius:13px;background:#fff;padding:7px 5px 8px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;font:800 12px Arial;color:#111;overflow:hidden}.slm114-q img{position:absolute;top:6px;left:8px;right:8px;width:calc(100% - 16px);height:58px;object-fit:contain}.slm114-q.sel{border:2px solid var(--mr);background:#fff7f8;color:#111}.slm114-q.sel:after{content:"✓";position:absolute;right:5px;top:5px;width:20px;height:20px;border-radius:50%;background:var(--mr);color:#fff;display:flex;align-items:center;justify-content:center;font:800 12px Arial}.slm114-q .ph{position:absolute;top:22px;color:#aaa;font:700 11px Arial}.slm114-cache{position:absolute;left:0;right:0;top:0;bottom:0;background:#fff;z-index:40;overflow:hidden;pointer-events:none}.slm114-cache .fakehead{padding:24px 24px 12px;font:800 26px Arial}.slm114-cache .fakesearch{height:44px;margin:0 24px 14px;border-radius:13px;background:#f3f3f5}.slm114-cache .fakerow{height:72px;margin:0 24px;border-top:1px solid #eee;display:flex;align-items:center;gap:14px}.slm114-cache .thumb{width:48px;height:48px;border-radius:8px;background:#f1f1f1}.slm114-cache .lines{flex:1}.slm114-cache .line{height:10px;background:#ededed;border-radius:7px;margin:7px 0}.slm114-cache .line.s{width:48%}.slm114-cache .line.m{width:72%}body{overscroll-behavior-y:none}@media(max-width:600px){input,select,button,textarea{font-size:16px!important}.slm115-page-title{margin-left:24px!important;margin-right:24px!important}}';document.head.appendChild(s);}
function repair(){all('img').forEach(function(img){var src=imageCandidate(img),cur=img.getAttribute('src')||'';if(src&&(!cur||/placeholder|data:image\/gif/i.test(cur)))img.src=src;img.style.setProperty('visibility','visible','important');img.style.setProperty('opacity','1','important');img.setAttribute('decoding','async');});all('body *').forEach(function(e){if(!e.children.length&&/^RELEASE\s+1\.1\.\d+$/i.test(tx(e)))e.style.setProperty('display','none','important');});}
function isLoading(){var found=false;all('body *').forEach(function(e){if(e.children.length)return;var t=tx(e).toLowerCase();if(t==='loading...'||t==='loading…'||t==='loading'){e.classList.add('slm114-hidden-loading');found=true;}});return found;}
function stableMain(){var choices=['main','[role="main"]','#app main','.app-content','.content-area','.merchant-content'];for(var i=0;i<choices.length;i++){var e=document.querySelector(choices[i]);if(e&&vis(e)&&tx(e).length>80)return e;}return null;}
function cacheStable(){if(isLoading())return;var m=stableMain();if(!m)return;try{var clone=m.cloneNode(true);all('script,style,iframe',clone).forEach(function(e){e.remove();});var html=clone.innerHTML;if(html&&html.length<650000)localStorage.setItem('slm114-main-cache',html);}catch(e){}}
function fakeCache(){var host=stableMain()||document.querySelector('main')||document.body;if(!host||host.querySelector('.slm114-cache'))return;var c=document.createElement('div');c.className='slm114-cache';var html='';try{html=localStorage.getItem('slm114-main-cache')||'';}catch(e){}if(html&&html.length>100){c.innerHTML=html;all('input,button,a,select,textarea',c).forEach(function(e){e.setAttribute('tabindex','-1');});}else{c.innerHTML='<div class="fakehead">Products</div><div class="fakesearch"></div>'+Array(6).fill('<div class="fakerow"><div class="thumb"></div><div class="lines"><div class="line m"></div><div class="line s"></div></div></div>').join('');}var cs=getComputedStyle(host);if(cs.position==='static')host.style.position='relative';host.appendChild(c);}
function removeCacheWhenReady(){var loading=isLoading(),c=document.querySelector('.slm114-cache');if(!loading&&c){setTimeout(function(){if(c&&c.parentNode)c.remove();cacheStable();},30);}else if(loading&&!c)fakeCache();}
var catMap=null;
function warmCats(){if(catMap)return;try{var o=JSON.parse(localStorage.getItem('slm114-catmap')||'null');if(o&&o.time>Date.now()-86400000){catMap=o.map||{};return;}}catch(e){}fetch(BASE+'/wp-json/wc/store/v1/products/categories?per_page=100',{credentials:'include',cache:'force-cache'}).then(function(r){return r.ok?r.json():[];}).then(function(rows){var m={};(rows||[]).forEach(function(x){var im=x.image&&(x.image.src||x.image.thumbnail)||'';if(im)m[String(x.name||'').toLowerCase()]=im;});catMap=m;try{localStorage.setItem('slm114-catmap',JSON.stringify({time:Date.now(),map:m}));}catch(e){}updateQuickImages();}).catch(function(){catMap={};});}
function usage(){var u={};try{u=JSON.parse(localStorage.getItem('slm114-usage')||'{}')||{};}catch(e){}Object.keys(seed).forEach(function(k){if(typeof u[k]!=='number')u[k]=seed[k];});return u;}
function bump(name){var u=usage();u[name]=(u[name]||0)+1;try{localStorage.setItem('slm114-usage',JSON.stringify(u));}catch(e){}}
function labelForCheckbox(cb){if(!cb)return'';var id=cb.id,l=id?document.querySelector('label[for="'+CSS.escape(id)+'"]'):null;if(l)return tx(l);var p=cb.parentElement;for(var i=0;i<3&&p;i++,p=p.parentElement){var t=tx(p).replace(/\s+/g,' ').trim();if(t&&t.length<80)return t.replace(/^\s*✓?\s*/,'');}return'';}
function categoryCheckbox(name){var want=name.toLowerCase(),boxes=all('input[type="checkbox"]');for(var i=0;i<boxes.length;i++){var t=labelForCheckbox(boxes[i]).toLowerCase();if(t===want)return boxes[i];}return null;}
function editVisible(){var es=all('h1,h2,h3,div');for(var i=0;i<es.length;i++)if(vis(es[i])&&tx(es[i]).toLowerCase()==='edit product')return true;return false;}
function categorySearchInput(){var inputs=all('input');for(var i=0;i<inputs.length;i++){var p=(inputs[i].getAttribute('placeholder')||'').toLowerCase();if(p.indexOf('search categories')>=0)return inputs[i];}return null;}
function quickAnchor(){var input=categorySearchInput();if(!input)return null;var a=input;for(var i=0;i<3&&a.parentElement;i++){var p=a.parentElement,r=p.getBoundingClientRect();if(r.width>innerWidth*.72&&r.height<150){a=p;continue;}break;}return a;}
function createQuick(){var u=usage(),ordered=QUICK.slice().sort(function(a,b){return (u[b]||0)-(u[a]||0);});var q=document.createElement('section');q.className='slm114-quick';q.id='slm114-quick';q.innerHTML='<h3>Quick Select (Most Used)</h3><div class="slm114-quick-grid"></div>';var grid=q.querySelector('.slm114-quick-grid');ordered.forEach(function(name){var b=document.createElement('button');b.type='button';b.className='slm114-q';b.dataset.cat=name;b.innerHTML='<span class="ph">'+name+'</span><span>'+name+'</span>';grid.appendChild(b);var cb=categoryCheckbox(name);if(cb&&cb.checked)b.classList.add('sel');b.onclick=function(){var x=categoryCheckbox(name);if(!x)return;x.checked=!x.checked;x.dispatchEvent(new Event('input',{bubbles:true}));x.dispatchEvent(new Event('change',{bubbles:true}));b.classList.toggle('sel',x.checked);if(x.checked)bump(name);};});return q;}
function ensureQuick(){if(!editVisible())return;var anchor=quickAnchor();if(!anchor)return;var q=document.getElementById('slm114-quick');if(!q)q=createQuick();if(anchor.parentNode&&q.previousElementSibling!==anchor)anchor.parentNode.insertBefore(q,anchor.nextSibling);updateQuickImages();}
function updateQuickImages(){if(!catMap)return;all('.slm114-q').forEach(function(b){if(b.querySelector('img'))return;var src=catMap[String(b.dataset.cat||'').toLowerCase()];if(!src)return;var im=document.createElement('img');im.src=norm(src);im.alt=b.dataset.cat||'';var ph=b.querySelector('.ph');if(ph)ph.style.display='none';b.insertBefore(im,b.firstChild);});}
function syncQuick(){all('.slm114-q').forEach(function(b){var cb=categoryCheckbox(b.dataset.cat||'');if(cb)b.classList.toggle('sel',cb.checked);});}
function currentPage(){var names=['Dashboard','Orders','Products','Stock','More'];var hs=all('h1,h2,h3');for(var i=0;i<hs.length;i++){if(!vis(hs[i]))continue;var t=tx(hs[i]);if(names.indexOf(t)>=0){var r=hs[i].getBoundingClientRect();if(r.top<350)return t;}}return'';}
function fixPagePadding(){var page=currentPage();if(!page)return;all('h1,h2,h3').forEach(function(h){if(vis(h)&&tx(h)===page){var r=h.getBoundingClientRect();if(r.left<16)h.classList.add('slm115-page-title');}});}
function fixBottomNav(){var page=currentPage();if(!page)return;var names=['Dashboard','Orders','Products','Stock','More'];names.forEach(function(name){var els=all('a,button,div,span');for(var i=0;i<els.length;i++){var e=els[i];if(!vis(e)||tx(e)!==name)continue;var r=e.getBoundingClientRect();if(r.top<innerHeight*.70)continue;var click=e.closest?e.closest('a,button,[role="button"]'):null;if(!click)click=e;var active=name===page;click.style.setProperty('color',active?'#d9253f':'#555','important');click.style.setProperty('-webkit-text-fill-color',active?'#d9253f':'#555','important');all('*',click).forEach(function(ch){ch.style.setProperty('color',active?'#d9253f':'#555','important');ch.style.setProperty('-webkit-text-fill-color',active?'#d9253f':'#555','important');});}});}
function fix(){style();repair();warmCats();var loading=isLoading();if(loading)fakeCache();else removeCacheWhenReady();ensureQuick();syncQuick();fixPagePadding();fixBottomNav();if(!loading)cacheStable();}
fix();setTimeout(fix,80);setTimeout(fix,260);if(!window.__slm115obs){var q=false;window.__slm115obs=new MutationObserver(function(){if(q)return;q=true;setTimeout(function(){q=false;fix();},45);});window.__slm115obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['checked','class','style']});}
})();

;(function(){
'use strict';
if(window.__SLM3_FILTER_UI_INSTALLED)return;
window.__SLM3_FILTER_UI_INSTALLED=true;

var STORAGE='slm3-shared-filter-v1';
var STYLE_ID='slm3-filter-style';
var ROW_ID='slm3-filter-row';
var openKey='';
var taxonomy=null;
var taxonomyMap={};
var taxonomyPromise=null;
var taxonomyRetryAfter=0;
var lastProductView='';
var restoreRunning=false;
var initialStateHandled=false;
var savedExists=false;
var nativeFetch=window.fetch.bind(window);
var productBatch=null;

function slm3All(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
function slm3Text(e){return (e&&(e.textContent||e.innerText)||'').replace(/\s+/g,' ').trim();}
function slm3Esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
function slm3Norm(v){return String(v==null?'':v).trim().toLowerCase();}
function slm3PageName(){var hs=slm3All('h1');for(var i=0;i<hs.length;i++){var t=slm3Text(hs[i]);if(t==='Products'||t==='Stock')return t;}return '';}
function slm3SessionGet(){try{var raw=sessionStorage.getItem(STORAGE);if(!raw)return null;var o=JSON.parse(raw);return o&&typeof o==='object'?o:null;}catch(e){return null;}}
function slm3SessionSet(o){savedExists=true;try{sessionStorage.setItem(STORAGE,JSON.stringify(o));}catch(e){}}
var ui=slm3SessionGet()||{mainId:0,subId:0,mode:'all',search:''};
savedExists=!!slm3SessionGet();

function slm3InstallStyle(){
  if(document.getElementById(STYLE_ID)||!document.head)return;
  var s=document.createElement('style');s.id=STYLE_ID;s.textContent='\
body.slb-merchant .slm3-native-hidden{display:none!important}\
body.slb-merchant #slm3-filter-row{display:grid;grid-template-columns:.88fr 1.08fr 1fr;gap:8px;margin:12px 0 14px;position:relative;z-index:70}\
body.slb-merchant .slm3-control{position:relative;min-width:0}\
body.slb-merchant .slm3-button{width:100%;height:48px;min-height:48px;border:1px solid #d8d8dc;border-radius:14px;background:#fff;color:#111;padding:0 11px;display:flex;align-items:center;justify-content:space-between;gap:7px;font:700 14px/1.1 Arial,sans-serif;text-align:left;box-sizing:border-box;box-shadow:none}\
body.slb-merchant .slm3-button:disabled{color:#8b8b8f;background:#fafafa}\
body.slb-merchant .slm3-label{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\
body.slb-merchant .slm3-chevron{flex:0 0 auto;font-size:15px;line-height:1;transform:translateY(-1px)}\
body.slb-merchant .slm3-menu{position:fixed;display:block;min-width:154px;max-width:calc(100vw - 24px);max-height:min(360px,calc(100vh - 120px));overflow-y:auto;overscroll-behavior:contain;background:#fff;border:1px solid #dddde1;border-radius:13px;box-shadow:0 10px 28px rgba(0,0,0,.16);padding:5px;z-index:2147483000;box-sizing:border-box}\
body.slb-merchant .slm3-option{width:100%;min-height:43px;border:0;border-radius:9px;background:#fff;color:#111;padding:0 10px;display:grid;grid-template-columns:minmax(0,1fr) 20px;align-items:center;gap:8px;font:500 14px/1.2 Arial,sans-serif;text-align:left;box-sizing:border-box}\
body.slb-merchant .slm3-option span:first-child{white-space:normal;overflow-wrap:anywhere}\
body.slb-merchant .slm3-option.selected{background:#fff0f2;color:#d9253f;font-weight:800}\
body.slb-merchant .slm3-check{color:#d9253f;font-size:17px;font-weight:900;text-align:center}\
body.slb-merchant .slm3-option.note{color:#777;cursor:default}\
body.slb-merchant .slm3-old-tabs-hidden{display:none!important}\
@media(max-width:430px){body.slb-merchant .slm-search{grid-template-columns:minmax(0,1fr) 92px!important;gap:8px!important}body.slb-merchant .slm-search input{min-width:0!important;padding-left:12px!important;padding-right:8px!important;font-size:14px!important}body.slb-merchant .slm-search button{min-width:0!important;padding-left:8px!important;padding-right:8px!important}body.slb-merchant #slm3-filter-row{grid-template-columns:.86fr 1.06fr 1.02fr;gap:7px}body.slb-merchant .slm3-button{padding:0 9px;font-size:13px!important}}\
';document.head.appendChild(s);
}

function slm3ReadTaxonomyCache(){
  var best=null,bestTime=0;
  try{
    for(var i=0;i<localStorage.length;i++){
      var k=localStorage.key(i);if(!k||k.indexOf('slm-bootstrap-')!==0)continue;
      try{var o=JSON.parse(localStorage.getItem(k)||'null'),d=o&&o.data;if(d&&d.categories&&Array.isArray(d.categories.all)&&Number(o.time||0)>=bestTime){best=d.categories.all;bestTime=Number(o.time||0);}}catch(e){}
    }
  }catch(e){}
  return best&&best.length?best:null;
}
function slm3SetTaxonomy(rows){
  taxonomy=(rows||[]).map(function(x){return{id:Number(x.id)||0,name:String(x.name||''),slug:String(x.slug||''),count:Number(x.count||0),parent:Number(x.parent)||0,image:String(x.image||'')};}).filter(function(x){return x.id>0;});
  taxonomyMap={};taxonomy.forEach(function(x){taxonomyMap[x.id]=x;});
  slm3ValidateState();
  return taxonomy;
}
function slm3ScheduleTaxonomyRetry(){
  var wait=Math.max(250,taxonomyRetryAfter-Date.now()+40);
  clearTimeout(slm3ScheduleTaxonomyRetry._t);
  slm3ScheduleTaxonomyRetry._t=setTimeout(function(){taxonomyPromise=null;slm3Mount();},wait);
}
function slm3FetchTaxonomy(){
  var cfg=window.SHISHALOVE_BRIDGE||{},base=String(cfg.rest||location.origin+'/wp-json/shishalove/v1/');
  var headers={'Cache-Control':'no-cache','Pragma':'no-cache'};
  if(cfg.restNonce)headers['X-WP-Nonce']=cfg.restNonce;
  return nativeFetch(base+'merchant/bootstrap?_slm_ui='+Date.now(),{
    method:'GET',credentials:'same-origin',cache:'no-store',headers:headers
  }).then(function(r){
    if(!r.ok)throw new Error('HTTP '+r.status);
    return r.json();
  }).then(function(d){
    var rows=d&&d.categories&&Array.isArray(d.categories.all)?d.categories.all:[];
    if(!rows.length)throw new Error('Merchant taxonomy unavailable');
    return rows;
  });
}
function slm3EnsureTaxonomy(){
  if(taxonomy&&taxonomy.length)return Promise.resolve(taxonomy);
  var cached=slm3ReadTaxonomyCache();
  if(cached)return Promise.resolve(slm3SetTaxonomy(cached));
  if(taxonomyPromise)return taxonomyPromise;
  if(Date.now()<taxonomyRetryAfter){slm3ScheduleTaxonomyRetry();return Promise.resolve([]);}
  taxonomyPromise=slm3FetchTaxonomy().then(function(rows){
    taxonomyPromise=null;taxonomyRetryAfter=0;return slm3SetTaxonomy(rows);
  },function(){
    taxonomyPromise=null;taxonomyRetryAfter=Date.now()+650;slm3ScheduleTaxonomyRetry();return [];
  });
  return taxonomyPromise;
}
function slm3TermAvailable(id){
  id=Number(id)||0;var t=taxonomyMap[id];if(!t)return false;if(Number(t.count||0)>0)return true;
  return (taxonomy||[]).some(function(x){return Number(x.parent)===id&&slm3TermAvailable(x.id);});
}
function slm3Roots(){return (taxonomy||[]).filter(function(x){return x.parent===0&&slm3Norm(x.name)!=='uncategorized'&&slm3TermAvailable(x.id);});}
function slm3RootFor(id){
  id=Number(id)||0;var seen={};
  while(id&&taxonomyMap[id]&&!seen[id]){seen[id]=1;var t=taxonomyMap[id];if(!t.parent)return t;id=Number(t.parent)||0;}
  return null;
}
function slm3IsDescendant(id,ancestor){
  id=Number(id)||0;ancestor=Number(ancestor)||0;if(!id||!ancestor)return false;
  var seen={};while(id&&taxonomyMap[id]&&!seen[id]){if(id===ancestor)return true;seen[id]=1;id=Number(taxonomyMap[id].parent)||0;}return false;
}
function slm3Descendants(parentId){
  parentId=Number(parentId)||0;if(!parentId)return[];
  var out=[];
  function walk(pid,depth){
    (taxonomy||[]).filter(function(x){return Number(x.parent)===Number(pid)&&slm3TermAvailable(x.id);}).forEach(function(x){out.push({term:x,depth:depth});walk(x.id,depth+1);});
  }
  walk(parentId,1);return out;
}
function slm3ValidateState(){
  ui.mainId=Number(ui.mainId)||0;ui.subId=Number(ui.subId)||0;ui.mode=String(ui.mode||'all');ui.search=String(ui.search||'');
  if(['all','instock','outofstock','newest','oldest'].indexOf(ui.mode)<0)ui.mode='all';
  if(ui.mainId&&!taxonomyMap[ui.mainId])ui.mainId=0;
  if(ui.mainId&&taxonomyMap[ui.mainId]&&taxonomyMap[ui.mainId].parent!==0){var r=slm3RootFor(ui.mainId);ui.mainId=r?r.id:0;}
  if(ui.subId&&(!taxonomyMap[ui.subId]||!ui.mainId||!slm3IsDescendant(ui.subId,ui.mainId)||ui.subId===ui.mainId))ui.subId=0;
}
function slm3EffectiveCategory(){return Number(ui.subId||ui.mainId||0);}
function slm3ModeStock(){return ui.mode==='instock'?'instock':ui.mode==='outofstock'?'outofstock':'all';}
function slm3SortOrder(){return ui.mode==='oldest'?'ASC':'DESC';}

function slm3RewriteProductUrl(input){
  try{
    var u=typeof input==='string'?new URL(input,location.href):(input instanceof URL?new URL(input.href):null);
    if(!u||u.pathname.indexOf('/wp-json/shishalove/v1/merchant/products')<0)return input;
    u.searchParams.set('orderby','date');u.searchParams.set('order',slm3SortOrder());
    return u.toString();
  }catch(e){return input;}
}
function slm3IsProductRequest(input){try{var s=typeof input==='string'?input:(input&&input.url)||String(input||'');return s.indexOf('/wp-json/shishalove/v1/merchant/products')>=0;}catch(e){return false;}}
function slm3FlushProductBatch(){
  var b=productBatch;if(!b)return;productBatch=null;
  nativeFetch(slm3RewriteProductUrl(b.input),b.init).then(function(resp){
    var n=b.waiters.length;b.waiters.forEach(function(w,i){try{w.resolve(i===n-1?resp:resp.clone());}catch(e){w.reject(e);}});
  }).catch(function(err){b.waiters.forEach(function(w){w.reject(err);});});
}
window.fetch=function(input,init){
  var rewritten=slm3RewriteProductUrl(input);
  if(productBatch&&slm3IsProductRequest(rewritten)){
    return new Promise(function(resolve,reject){productBatch.input=rewritten;productBatch.init=init;productBatch.waiters.push({resolve:resolve,reject:reject});clearTimeout(productBatch.timer);productBatch.timer=setTimeout(slm3FlushProductBatch,36);});
  }
  return nativeFetch(rewritten,init);
};
function slm3BeginProductBatch(){if(productBatch)return;productBatch={input:null,init:null,waiters:[],timer:null};}

function slm3DeriveFromNative(){
  var cat=document.getElementById('slm-category-filter'),stock=document.getElementById('slm-stock-filter'),search=document.getElementById('slm-product-search');
  var id=cat?Number(cat.value)||0:0,r=slm3RootFor(id);
  ui.mainId=r?r.id:0;ui.subId=(r&&id&&id!==r.id)?id:0;
  var sv=stock?String(stock.value||'all'):'all';ui.mode=(sv==='instock'||sv==='outofstock')?sv:'all';
  ui.search=search?String(search.value||''):'';slm3ValidateState();
}
function slm3NativeControls(){
  var cat=document.getElementById('slm-category-filter'),stock=document.getElementById('slm-stock-filter'),search=document.getElementById('slm-product-search');
  var button=document.querySelector('[data-act="search-products"]');
  return{cat:cat,stock:stock,search:search,button:button};
}
function slm3ApplyCategory(){
  var n=slm3NativeControls();if(!n.cat)return;
  n.cat.value=String(slm3EffectiveCategory());n.cat.dispatchEvent(new Event('change',{bubbles:true}));
}
function slm3ApplyMode(){
  var n=slm3NativeControls();if(!n.stock)return;
  n.stock.value=slm3ModeStock();n.stock.dispatchEvent(new Event('change',{bubbles:true}));
}
function slm3RestoreSharedState(){
  if(restoreRunning)return;var n=slm3NativeControls();if(!n.cat||!n.stock||!n.search||!n.button)return;
  restoreRunning=true;slm3ValidateState();slm3BeginProductBatch();
  n.search.value=ui.search;n.cat.value=String(slm3EffectiveCategory());n.stock.value=slm3ModeStock();
  try{n.button.click();n.cat.dispatchEvent(new Event('change',{bubbles:true}));n.stock.dispatchEvent(new Event('change',{bubbles:true}));}catch(e){}
  setTimeout(function(){restoreRunning=false;},120);
}

function slm3MainLabel(){var t=taxonomyMap[ui.mainId];return t?t.name:'Main Category';}
function slm3SubLabel(){var t=taxonomyMap[ui.subId];return t?t.name:'Category / Brand';}
function slm3FilterLabel(){return ui.mode==='instock'?'Filter · In stock':ui.mode==='outofstock'?'Filter · Out of stock':ui.mode==='newest'?'Newest first':ui.mode==='oldest'?'Oldest first':'Filter · All';}
function slm3Option(value,label,selected,key){return '<button type="button" class="slm3-option '+(selected?'selected':'')+'" data-slm3-kind="'+key+'" data-slm3-value="'+slm3Esc(value)+'"><span>'+slm3Esc(label)+'</span><span class="slm3-check">'+(selected?'✓':'')+'</span></button>';}
function slm3Control(key,label,menu,disabled){return '<div class="slm3-control" data-slm3-control="'+key+'"><button type="button" class="slm3-button" data-slm3-toggle="'+key+'" '+(disabled?'disabled':'')+' aria-expanded="'+(openKey===key?'true':'false')+'"><span class="slm3-label">'+slm3Esc(label)+'</span><span class="slm3-chevron">'+(openKey===key?'⌃':'⌄')+'</span></button>'+(openKey===key?'<div class="slm3-menu" data-slm3-menu="'+key+'">'+menu+'</div>':'')+'</div>';}
function slm3MainMenu(){var html=slm3Option(0,'All',!ui.mainId,'main');slm3Roots().forEach(function(t){html+=slm3Option(t.id,t.name,Number(ui.mainId)===t.id,'main');});return html;}
function slm3SubMenu(){
  if(!ui.mainId)return '<button type="button" class="slm3-option note"><span>Select a main category</span><span></span></button>';
  var main=taxonomyMap[ui.mainId],html=slm3Option(0,'All '+(main?main.name:'categories'),!ui.subId,'sub');
  slm3Descendants(ui.mainId).forEach(function(x){html+=slm3Option(x.term.id,x.term.name,Number(ui.subId)===x.term.id,'sub');});return html;
}
function slm3FilterMenu(){
  var rows=[['all','All'],['instock','In stock'],['outofstock','Out of stock'],['newest','Newest first'],['oldest','Oldest first']],html='';
  rows.forEach(function(x){html+=slm3Option(x[0],x[1],ui.mode===x[0],'filter');});return html;
}
function slm3PositionOpenMenu(){
  if(!openKey)return;var menu=document.querySelector('[data-slm3-menu="'+openKey+'"]'),btn=document.querySelector('[data-slm3-toggle="'+openKey+'"]');if(!menu||!btn)return;
  menu.style.visibility='hidden';menu.style.left='12px';menu.style.top='0px';
  requestAnimationFrame(function(){if(!menu||!btn)return;var r=btn.getBoundingClientRect(),mw=menu.offsetWidth||170,left=Math.max(12,Math.min(r.left,window.innerWidth-mw-12)),top=r.bottom+6;menu.style.left=Math.round(left)+'px';menu.style.top=Math.round(top)+'px';menu.style.maxHeight=Math.max(120,window.innerHeight-top-84)+'px';menu.style.visibility='visible';});
}
function slm3HideNativeAndTabs(){
  var cat=document.getElementById('slm-category-filter'),stock=document.getElementById('slm-stock-filter');
  if(cat&&stock&&cat.parentElement===stock.parentElement)cat.parentElement.classList.add('slm3-native-hidden');
  slm3All('.slm-filter-tabs').forEach(function(e){e.classList.add('slm3-old-tabs-hidden');});
}
function slm3RenderControls(){
  var page=slm3PageName();if(!page)return;var search=document.querySelector('.slm-search');if(!search)return;
  var old=document.getElementById(ROW_ID);if(old)old.remove();
  var row=document.createElement('div');row.id=ROW_ID;
  row.innerHTML=slm3Control('main',slm3MainLabel(),slm3MainMenu(),false)+slm3Control('sub',slm3SubLabel(),slm3SubMenu(),!ui.mainId)+slm3Control('filter',slm3FilterLabel(),slm3FilterMenu(),false);
  search.insertAdjacentElement('afterend',row);slm3HideNativeAndTabs();slm3BindRow(row);slm3PositionOpenMenu();
}
function slm3BindRow(row){
  row.addEventListener('click',function(ev){
    var tog=ev.target.closest&&ev.target.closest('[data-slm3-toggle]');if(tog){ev.preventDefault();ev.stopPropagation();var k=tog.getAttribute('data-slm3-toggle');openKey=openKey===k?'':k;slm3RenderControls();return;}
    var item=ev.target.closest&&ev.target.closest('[data-slm3-kind]');if(!item)return;ev.preventDefault();ev.stopPropagation();
    var kind=item.getAttribute('data-slm3-kind'),value=item.getAttribute('data-slm3-value');openKey='';
    if(kind==='main'){ui.mainId=Number(value)||0;if(ui.subId&&!slm3IsDescendant(ui.subId,ui.mainId))ui.subId=0;slm3SessionSet(ui);slm3ApplyCategory();return;}
    if(kind==='sub'){ui.subId=Number(value)||0;slm3SessionSet(ui);slm3ApplyCategory();return;}
    if(kind==='filter'){ui.mode=String(value||'all');slm3SessionSet(ui);slm3ApplyMode();return;}
  });
}
function slm3AttachSearchState(){
  var s=document.getElementById('slm-product-search');if(!s||s.dataset.slm3Watch)return;s.dataset.slm3Watch='1';
  s.addEventListener('input',function(){ui.search=String(this.value||'');slm3SessionSet(ui);});
}
function slm3NeedsNativeRestore(){
  if(restoreRunning||!savedExists)return false;
  var n=slm3NativeControls();if(!n.cat||!n.stock||!n.search)return false;
  return Number(n.cat.value||0)!==slm3EffectiveCategory()||
    String(n.stock.value||'all')!==slm3ModeStock()||
    String(n.search.value||'')!==String(ui.search||'');
}
function slm3Mount(){
  slm3InstallStyle();var page=slm3PageName();
  if(!page){openKey='';lastProductView='';return;}
  slm3EnsureTaxonomy().then(function(rows){
    if(!rows.length)return;
    if(!initialStateHandled){initialStateHandled=true;if(!savedExists)slm3DeriveFromNative();else slm3RestoreSharedState();}
    else if((lastProductView&&lastProductView!==page&&savedExists)||slm3NeedsNativeRestore())slm3RestoreSharedState();
    lastProductView=page;
    if(document.getElementById(ROW_ID)){slm3HideNativeAndTabs();slm3AttachSearchState();return;}
    slm3RenderControls();slm3AttachSearchState();
  });
}
function slm3CloseOpen(){if(!openKey)return false;openKey='';slm3RenderControls();return true;}
window.__SLM_FILTER_CLOSE_OPEN=slm3CloseOpen;

document.addEventListener('click',function(ev){if(openKey&&!(ev.target.closest&&ev.target.closest('[data-slm3-control]')))slm3CloseOpen();},true);
window.addEventListener('resize',function(){if(openKey)slm3CloseOpen();});
window.addEventListener('scroll',function(){if(openKey)slm3CloseOpen();},{passive:true});


var slmQState={open:false,row:null,parent:null,parentId:0,target:null,targetId:0,variations:[],busy:false,error:'',statusTouched:false,loadFailed:false};

function slmQInstallStyle(){
  if(document.getElementById('slm-quick-edit-style')||!document.head)return;
  var st=document.createElement('style');st.id='slm-quick-edit-style';st.textContent='\
body.slb-merchant .slmq-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.26);z-index:2147483200;display:flex;align-items:flex-end;justify-content:center;padding:14px;box-sizing:border-box}\
body.slb-merchant .slmq-panel{width:min(100%,430px);max-height:78vh;overflow-y:auto;background:#fff;border-radius:18px 18px 14px 14px;box-shadow:0 16px 44px rgba(0,0,0,.25);padding:18px 18px 16px;box-sizing:border-box;color:#111;font-family:Arial,sans-serif}\
body.slb-merchant .slmq-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:13px}\
body.slb-merchant .slmq-head h2{font-size:21px;line-height:1.15;margin:0;font-weight:800}\
body.slb-merchant .slmq-close{width:36px;height:36px;border:0;border-radius:50%;background:#f3f3f4;color:#111;font-size:24px;line-height:1}\
body.slb-merchant .slmq-context{border:1px solid #ececee;background:#fafafa;border-radius:12px;padding:10px 12px;margin-bottom:12px}\
body.slb-merchant .slmq-context strong{display:block;font-size:15px;line-height:1.25}\
body.slb-merchant .slmq-context small{display:block;color:#777;margin-top:4px;font-size:12px}\
body.slb-merchant .slmq-label{display:block;font-size:12px;font-weight:800;color:#444;margin:10px 0 5px}\
body.slb-merchant .slmq-input,body.slb-merchant .slmq-select{width:100%;height:46px;border:1px solid #d8d8dc;border-radius:12px;background:#fff;color:#111;padding:0 12px;font:600 16px Arial,sans-serif;box-sizing:border-box}\
body.slb-merchant .slmq-input:disabled{background:#f6f6f7;color:#888}\
body.slb-merchant .slmq-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}\
body.slb-merchant .slmq-note{font-size:12px;line-height:1.35;color:#777;margin:5px 0 0}\
body.slb-merchant .slmq-error{display:none;background:#fff0f2;border:1px solid #f0b9c2;color:#b51e34;border-radius:10px;padding:9px 10px;margin-top:10px;font-size:12px;line-height:1.35}\
body.slb-merchant .slmq-error.show{display:block}\
body.slb-merchant .slmq-actions{display:grid;grid-template-columns:.78fr 1.22fr;gap:9px;margin-top:15px}\
body.slb-merchant .slmq-actions button{height:48px;border-radius:12px;font:800 14px Arial,sans-serif}\
body.slb-merchant .slmq-full{border:1px solid #d8d8dc;background:#fff;color:#111}\
body.slb-merchant .slmq-update{border:0;background:#d9253f;color:#fff}\
body.slb-merchant .slmq-update:disabled{opacity:.55}\
body.slb-merchant .slmq-loading{padding:28px 4px;text-align:center;color:#777;font-size:14px}\
@media(min-width:700px){body.slb-merchant .slmq-backdrop{align-items:center}}\
';document.head.appendChild(st);
}
function slmQRestBase(){var cfg=window.SHISHALOVE_BRIDGE||{};return String(cfg.rest||location.origin+'/wp-json/shishalove/v1/');}
function slmQApi(id,method,body){
  var cfg=window.SHISHALOVE_BRIDGE||{},headers={};
  if(cfg.restNonce)headers['X-WP-Nonce']=cfg.restNonce;
  if(body!=null)headers['Content-Type']='application/json';
  return nativeFetch(slmQRestBase()+'merchant/product/'+encodeURIComponent(id),{
    method:method||'GET',credentials:'same-origin',cache:'no-store',headers:headers,body:body==null?undefined:JSON.stringify(body)
  }).then(function(r){
    return r.text().then(function(raw){
      var data={};try{data=raw?JSON.parse(raw):{};}catch(e){}
      if(!r.ok){var er=new Error(data&&data.message?String(data.message):'HTTP '+r.status);er.status=r.status;throw er;}
      return data;
    });
  });
}
function slmQFindParentWithVariations(parent){
  var needle=String(parent.sku||parent.name||'').trim();
  if(!needle)return Promise.resolve(parent);
  var url=slmQRestBase()+'merchant/products?page=1&per_page=50&search='+encodeURIComponent(needle)+'&orderby=date&order=DESC&include_variations=1&_slmq='+Date.now();
  var cfg=window.SHISHALOVE_BRIDGE||{},headers={};if(cfg.restNonce)headers['X-WP-Nonce']=cfg.restNonce;
  return nativeFetch(url,{credentials:'same-origin',cache:'no-store',headers:headers}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(function(d){
    var item=(d&&d.items||[]).find(function(x){return Number(x.id)===Number(parent.id);});
    if(item){Object.keys(parent).forEach(function(k){if(item[k]===undefined)item[k]=parent[k];});return item;}
    return parent;
  }).catch(function(){return parent;});
}
function slmQTargetLabel(v){
  if(!v)return '';
  var parts=[],attrs=v.attributes||{};Object.keys(attrs).forEach(function(k){if(attrs[k])parts.push(String(attrs[k]));});
  var sku=String(v.sku||'').trim();return (sku?'SKU '+sku:'Variation #'+v.id)+(parts.length?' · '+parts.join(' / '):'');
}
function slmQPriceValue(p){
  if(!p)return '';var sale=String(p.sale_price==null?'':p.sale_price).trim();
  if(sale!=='')return sale;
  var reg=String(p.regular_price==null?'':p.regular_price).trim();return reg!==''?reg:String(p.price==null?'':p.price);
}
function slmQStatusLabel(v){return v==='instock'?'In stock':v==='outofstock'?'Out of stock':v==='onbackorder'?'On backorder':v||'';}
function slmQCurrentTarget(){
  if(!slmQState.parent)return null;
  if(slmQState.targetId===Number(slmQState.parent.id))return slmQState.parent;
  return slmQState.variations.find(function(v){return Number(v.id)===Number(slmQState.targetId);})||null;
}
function slmQSetTarget(id){
  slmQState.targetId=Number(id)||0;slmQState.target=slmQCurrentTarget();slmQState.statusTouched=false;slmQState.error='';slmQRender();
}
function slmQPanelMarkup(){
  if(!slmQState.parent)return '<div class="slmq-loading">Loading product…</div>';
  var p=slmQState.parent,t=slmQState.target||slmQCurrentTarget(),isVariable=String(p.type||'')==='variable',vars=slmQState.variations||[];
  if(slmQState.loadFailed){
    return '<div class="slmq-context"><strong>'+slm3Esc(p.name||('Product #'+slmQState.parentId))+'</strong><small>Quick Edit unavailable</small></div>'+
      '<div class="slmq-error show">'+slm3Esc(slmQState.error||'Could not load current WooCommerce values.')+'</div>'+
      '<div class="slmq-actions"><button type="button" class="slmq-full" data-slmq="full">FULL EDIT</button><button type="button" class="slmq-update" disabled>UPDATE</button></div>';
  }
  var selector='';
  if(isVariable){
    var opts='<option value="">Select variation</option>';
    if(p.manage_stock)opts+='<option value="'+p.id+'"'+(Number(slmQState.targetId)===Number(p.id)?' selected':'')+'>Parent inventory</option>';
    vars.forEach(function(v){opts+='<option value="'+v.id+'"'+(Number(slmQState.targetId)===Number(v.id)?' selected':'')+'>'+slm3Esc(slmQTargetLabel(v))+'</option>';});
    selector='<label class="slmq-label">VARIATION</label><select class="slmq-select" id="slmq-variant">'+opts+'</select>';
  }
  if(isVariable&&!t){
    return '<div class="slmq-context"><strong>'+slm3Esc(p.name)+'</strong><small>'+slm3Esc(p.sku?'SKU '+p.sku:'Variable product')+'</small></div>'+selector+
      '<p class="slmq-note">Select the exact variation before changing price or stock. This prevents updating the wrong SKU.</p>'+
      '<div class="slmq-error '+(slmQState.error?'show':'')+'" id="slmq-error">'+slm3Esc(slmQState.error)+'</div>'+
      '<div class="slmq-actions"><button type="button" class="slmq-full" data-slmq="full">FULL EDIT</button><button type="button" class="slmq-update" disabled>UPDATE</button></div>';
  }
  t=t||p;
  var targetIsParent=Number(t.id)===Number(p.id),variableParent=isVariable&&targetIsParent;
  var manage=!!t.manage_stock,qty=t.stock_quantity==null?'':String(t.stock_quantity),price=slmQPriceValue(t);
  var priceDisabled=variableParent?' disabled':'';
  var qtyDisabled=manage?'':' disabled';
  var note=variableParent?'Variable-product price is controlled by its variations. ':'';
  if(!manage)note+='Stock quantity is not managed for this item; stock status can still be updated.';
  return '<div class="slmq-context"><strong>'+slm3Esc(p.name)+'</strong><small>'+slm3Esc(targetIsParent?(p.sku?'SKU '+p.sku:'Product #'+p.id):slmQTargetLabel(t))+'</small></div>'+
    selector+
    '<div class="slmq-grid"><div><label class="slmq-label">PRICE</label><input class="slmq-input" id="slmq-price" type="number" min="0" step="0.01" inputmode="decimal" value="'+slm3Esc(price)+'"'+priceDisabled+'></div>'+
    '<div><label class="slmq-label">STOCK QUANTITY</label><input class="slmq-input" id="slmq-qty" type="number" min="0" step="1" inputmode="numeric" value="'+slm3Esc(qty)+'"'+qtyDisabled+'></div></div>'+
    '<label class="slmq-label">STOCK STATUS</label><select class="slmq-select" id="slmq-status"><option value="instock"'+(t.stock_status==='instock'?' selected':'')+'>In stock</option><option value="outofstock"'+(t.stock_status==='outofstock'?' selected':'')+'>Out of stock</option><option value="onbackorder"'+(t.stock_status==='onbackorder'?' selected':'')+'>On backorder</option></select>'+
    (note?'<p class="slmq-note">'+slm3Esc(note)+'</p>':'')+
    '<div class="slmq-error '+(slmQState.error?'show':'')+'" id="slmq-error">'+slm3Esc(slmQState.error)+'</div>'+
    '<div class="slmq-actions"><button type="button" class="slmq-full" data-slmq="full">FULL EDIT</button><button type="button" class="slmq-update" data-slmq="update" '+(slmQState.busy?'disabled':'')+'>'+(slmQState.busy?'UPDATING…':'UPDATE')+'</button></div>';
}
function slmQRender(){
  slmQInstallStyle();var old=document.getElementById('slmq-root');if(old)old.remove();if(!slmQState.open)return;
  var root=document.createElement('div');root.id='slmq-root';root.className='slmq-backdrop';
  root.innerHTML='<section class="slmq-panel" role="dialog" aria-modal="true" aria-label="Quick Edit"><div class="slmq-head"><h2>Quick Edit</h2><button class="slmq-close" type="button" data-slmq="close" aria-label="Close">×</button></div>'+slmQPanelMarkup()+'</section>';
  document.body.appendChild(root);
  var variant=root.querySelector('#slmq-variant');if(variant)variant.onchange=function(){slmQSetTarget(this.value);};
  var status=root.querySelector('#slmq-status');if(status)status.onchange=function(){slmQState.statusTouched=true;};
  var qty=root.querySelector('#slmq-qty');if(qty)qty.oninput=function(){
    if(slmQState.statusTouched)return;var st=document.getElementById('slmq-status');if(!st)return;var n=Number(this.value);
    if(Number.isFinite(n)&&n>0&&st.value==='outofstock')st.value='instock';
    else if(Number.isFinite(n)&&n<=0&&st.value==='instock')st.value='outofstock';
  };
}
function slmQClose(){slmQState.open=false;slmQState.busy=false;slmQState.error='';slmQRender();}
function slmQOpen(row,id){
  openKey='';slm3RenderControls();slmQState={open:true,row:row,parent:null,parentId:Number(id)||0,target:null,targetId:0,variations:[],busy:false,error:'',statusTouched:false,loadFailed:false};slmQRender();
  slmQApi(id,'GET').then(function(parent){
    if(!slmQState.open||Number(slmQState.parentId)!==Number(id))return;
    slmQState.parent=parent;slmQState.parentId=Number(parent.id)||Number(id);
    if(String(parent.type||'')==='variable'){
      return slmQFindParentWithVariations(parent).then(function(full){
        if(!slmQState.open)return;slmQState.parent=full;slmQState.variations=Array.isArray(full.variations)?full.variations:[];
        if(full.manage_stock)slmQState.targetId=Number(full.id);else slmQState.targetId=0;
        slmQState.target=slmQCurrentTarget();slmQRender();
      });
    }
    slmQState.targetId=Number(parent.id);slmQState.target=parent;slmQRender();
  }).catch(function(err){
    if(!slmQState.open)return;
    slmQState.error='Could not load current WooCommerce values: '+String(err&&err.message||err||'Unknown error');
    slmQState.parent={id:Number(id),name:'Product #'+id,type:'unknown'};
    slmQState.targetId=0;slmQState.target=null;slmQState.loadFailed=true;slmQRender();
  });
}
function slmQUpdateCache(parentId,saved){
  if(!saved||Number(saved.id)!==Number(parentId))return;
  try{
    for(var i=0;i<localStorage.length;i++){
      var k=localStorage.key(i);if(!k||k.indexOf('slm-products-')!==0)continue;
      try{
        var wrap=JSON.parse(localStorage.getItem(k)||'null'),items=wrap&&wrap.data&&wrap.data.items;if(!Array.isArray(items))continue;
        var changed=false;items.forEach(function(x,idx){if(Number(x.id)===Number(parentId)){items[idx]=Object.assign({},x,saved);changed=true;}});
        if(changed)localStorage.setItem(k,JSON.stringify(wrap));
      }catch(e){}
    }
  }catch(e){}
}
function slmQPatchRow(item,parentId){
  var row=document.querySelector('.slm-product-row[data-edit="'+Number(parentId)+'"]');if(!row||!item)return;
  var h=row.querySelector('h3'),price=h&&h.nextElementSibling,stock=price&&price.nextElementSibling;
  if(price){var pv=String(item.price_html||item.price||item.regular_price||'');if(pv)price.textContent=pv;}
  if(stock&&item.stock_status){
    stock.textContent='● '+slmQStatusLabel(item.stock_status);
    if(item.stock_status==='instock')stock.classList.add('slm-green');else stock.classList.remove('slm-green');
  }
  var keep=true;if(ui.mode==='instock'&&item.stock_status!=='instock')keep=false;if(ui.mode==='outofstock'&&item.stock_status!=='outofstock')keep=false;
  if(!keep){
    row.remove();var count=document.querySelector('.slm-head .slm-muted');if(count){var m=String(count.textContent||'').match(/(\d+)\s+matching products/i);if(m)count.textContent=Math.max(0,Number(m[1])-1)+' matching products';}
  }
}
function slmQFetchFreshParent(parent){
  return slmQFindParentWithVariations(parent).then(function(fresh){return fresh||parent;});
}
function slmQShowError(message){
  slmQState.error=String(message||'');
  var er=document.getElementById('slmq-error');if(er){er.textContent=slmQState.error;er.classList.add('show');}
}
function slmQSetBusy(busy){
  slmQState.busy=!!busy;var btn=document.querySelector('[data-slmq="update"]');if(btn){btn.disabled=!!busy;btn.textContent=busy?'UPDATING…':'UPDATE';}
}
function slmQSubmit(){
  var p=slmQState.parent,t=slmQCurrentTarget();if(!p||!t||slmQState.busy||slmQState.loadFailed)return;
  var price=document.getElementById('slmq-price'),qty=document.getElementById('slmq-qty'),status=document.getElementById('slmq-status'),body={};
  var variableParent=String(p.type||'')==='variable'&&Number(t.id)===Number(p.id);
  if(price&&!price.disabled&&!variableParent){
    var v=String(price.value||'').trim();if(v===''){slmQShowError('Enter a valid price.');return;}
    var n=Number(v);if(!Number.isFinite(n)||n<0){slmQShowError('Enter a valid price.');return;}
    var originalPrice=Number(slmQPriceValue(t));
    if(!Number.isFinite(originalPrice)||n!==originalPrice){
      if(String(t.sale_price==null?'':t.sale_price).trim()!=='')body.sale_price=String(n);else body.regular_price=String(n);
    }
  }
  if(qty&&!qty.disabled&&t.manage_stock){
    var q=Number(qty.value);if(!Number.isFinite(q)||q<0||Math.floor(q)!==q){slmQShowError('Enter a whole stock quantity.');return;}
    var originalQty=t.stock_quantity==null?null:Number(t.stock_quantity);
    if(originalQty===null||q!==originalQty)body.stock_quantity=String(q);
  }
  if(status){
    var nextStatus=String(status.value||t.stock_status||'instock');
    if(nextStatus!==String(t.stock_status||''))body.stock_status=nextStatus;
  }
  if(!Object.keys(body).length){slmQShowError('No changes to update.');return;}
  slmQState.error='';var er=document.getElementById('slmq-error');if(er){er.textContent='';er.classList.remove('show');}slmQSetBusy(true);
  slmQApi(t.id,'POST',body).then(function(saved){
    if(!slmQState.open)return;
    var isParent=Number(t.id)===Number(p.id);
    if(isParent){
      slmQUpdateCache(p.id,saved);slmQPatchRow(saved,p.id);slmQClose();
    }else{
      slmQFetchFreshParent(p).then(function(fresh){slmQUpdateCache(p.id,fresh);slmQPatchRow(fresh,p.id);slmQClose();});
    }
  }).catch(function(err){
    slmQSetBusy(false);slmQShowError('Update failed: '+String(err&&err.message||err||'Unknown error'));
  });
}
function slmQFullEdit(){
  var id=Number(slmQState.parentId)||0,row=slmQState.row;slmQClose();
  setTimeout(function(){if(!row||!document.documentElement.contains(row))row=document.querySelector('.slm-product-row[data-edit="'+id+'"]');if(row)row.click();},0);
}
document.addEventListener('click',function(ev){
  var more=ev.target.closest&&ev.target.closest('.slm-product-row .slm-more');
  if(more){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();var row=more.closest('.slm-product-row'),id=row&&Number(row.getAttribute('data-edit'));if(row&&id)slmQOpen(row,id);return;}
  var act=ev.target.closest&&ev.target.closest('[data-slmq]');if(!act)return;
  ev.preventDefault();ev.stopPropagation();var a=act.getAttribute('data-slmq');
  if(a==='close')slmQClose();else if(a==='update')slmQSubmit();else if(a==='full')slmQFullEdit();
},true);
document.addEventListener('click',function(ev){if(slmQState.open&&ev.target&&ev.target.id==='slmq-root')slmQClose();},false);

var slm3CloseOpenBase=slm3CloseOpen;
window.__SLM_FILTER_CLOSE_OPEN=function(){if(slmQState.open){slmQClose();return true;}return slm3CloseOpenBase();};

var slm3Queued=false;
function slm3Schedule(){if(slm3Queued)return;slm3Queued=true;setTimeout(function(){slm3Queued=false;slm3Mount();},45);}
slm3Mount();setTimeout(slm3Mount,120);setTimeout(slm3Mount,360);
if(document.documentElement){new MutationObserver(slm3Schedule).observe(document.documentElement,{childList:true,subtree:true});}
})();