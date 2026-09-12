(function(){
'use strict';

var CFG=window.SHISHALOVE_BRIDGE||{};
if(!CFG.merchantAllowed||!CFG.rest)return;
if(window.__SLM_ORDER_WATCH_INSTALLED)return;
window.__SLM_ORDER_WATCH_INSTALLED=true;

var KEY='slm-last-order-id-v1';
var busy=false;

function lastSeen(){
  try{return Number(localStorage.getItem(KEY)||0)||0;}catch(e){return 0;}
}
function remember(id){
  try{localStorage.setItem(KEY,String(Number(id)||0));}catch(e){}
}
function notifyOrder(o){
  if(!o)return;
  var number=String(o.number||o.id||'');
  var customer=String(o.customer||'Customer');
  var total=String(o.total||'');
  try{
    if(window.ShishaLoveNative&&typeof window.ShishaLoveNative.notifyOrder==='function'){
      window.ShishaLoveNative.notifyOrder(number,customer,total);
    }
  }catch(e){}
}
function check(seedOnly){
  if(busy)return;
  busy=true;
  var headers={};
  if(CFG.restNonce)headers['X-WP-Nonce']=CFG.restNonce;
  fetch(CFG.rest+'merchant/orders?page=1&per_page=5',{
    credentials:'same-origin',
    headers:headers,
    cache:'no-store'
  }).then(function(r){
    if(!r.ok)throw new Error('HTTP '+r.status);
    return r.json();
  }).then(function(data){
    var items=(data&&data.items)||[];
    if(!items.length)return;
    var latest=0;
    items.forEach(function(o){latest=Math.max(latest,Number(o.id)||0);});
    var previous=lastSeen();
    if(!previous||seedOnly){
      remember(latest);
      return;
    }
    var fresh=items.filter(function(o){return (Number(o.id)||0)>previous;}).sort(function(a,b){return Number(a.id)-Number(b.id);});
    fresh.forEach(notifyOrder);
    if(latest>previous)remember(latest);
  }).catch(function(){
    // Keep silent: the merchant screen remains usable even if one poll fails.
  }).finally(function(){
    busy=false;
  });
}

window.SLM_CHECK_ORDERS=function(){check(false);};
check(true);
window.setInterval(function(){check(false);},15000);
document.addEventListener('visibilitychange',function(){if(!document.hidden)check(false);});
})();