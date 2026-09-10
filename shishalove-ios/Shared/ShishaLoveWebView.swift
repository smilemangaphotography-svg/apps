import SwiftUI
import WebKit

struct ShishaLoveWebView: UIViewRepresentable {
    let startURL: URL
    let appUserAgent: String

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false

        let phonePolish = #"""
        (function(){
          'use strict';
          var isMerchant=(navigator.userAgent||'').indexOf('ShishaLoveMerchant')>=0;
          var home='https://shishalove.eu/shishalove-app/?app=ios&build=111';
          var top=['HOOKAH','BOWLS','HOSES','ACCESSORIES','CHARCOAL','FLAVORS','MERCHANDISE'];
          var photoPages={
            'HOOKAH':'/product-category/hookah/','BOWLS':'/product-category/bowls/','HOSES':'/product-category/hose/',
            'ACCESSORIES':'/product-category/accessories/','CHARCOAL':'/product-category/charcoal/','FLAVORS':'/product-category/flavors/',
            'MERCHANDISE':'/product-category/merchandise/','WOOKAH':'/product-category/wookah/hookah-wookah/',
            'ALPHA':'/product-category/alpha/','STEAMULATION':'/product-category/steamulation/','UNION':'/product-category/union/',
            'MIG':'/product-category/mig/','EL-BADIA':'/product-category/el-badia/hookah-el-badia/','MOZE':'/product-category/moze/hookah-moze/',
            'ANIMA':'/product-category/anima/','GOLD MINER':'/product-category/gold-miner/','YKAP':'/product-category/ykap/',
            'MEXANIKA':'/product-category/mexanika/','DIAVLA':'/product-category/diavla/'
          };
          function vis(e){if(!e||!e.getBoundingClientRect)return false;var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>1&&r.height>1&&s.display!='none'&&s.visibility!='hidden';}
          function norm(v){if(!v)return '';v=String(v).trim().split(/\s+/)[0];if(v.indexOf('//')===0)v='https:'+v;v=v.replace(/^http:\/\/(www\.)?shishalove\.eu/i,'https://shishalove.eu');try{return new URL(v,location.href).href}catch(e){return v}}
          function candidate(img){var a=['data-src','data-lazy-src','data-original','data-lazyload','data-lazy','data-image','data-orig-file'];for(var i=0;i<a.length;i++){var v=img.getAttribute(a[i]);if(v)return norm(v)}var ss=img.getAttribute('data-srcset')||img.getAttribute('srcset');if(ss)return norm(ss.split(',').pop().trim().split(/\s+/)[0]);return norm(img.getAttribute('src')||'')}
          function repairImages(){document.querySelectorAll('img').forEach(function(img){var c=candidate(img),cur=img.getAttribute('src')||'';if(c&&(!cur||cur.indexOf('placeholder')>=0||cur.indexOf('data:image/gif')===0))img.src=c;img.style.setProperty('visibility','visible','important');img.style.setProperty('opacity','1','important');if(!img.dataset.sl112){img.dataset.sl112='1';img.addEventListener('error',function(){var n=candidate(img);if(n&&n!=img.src)img.src=n})}})}
          function drawer(){var sels=['aside','nav','.drawer','.side-menu','.mobile-menu','.offcanvas','.off-canvas','.sl-drawer','.menu-drawer','.mobile-nav'],best=null,score=-1,nodes=[];sels.forEach(function(s){try{document.querySelectorAll(s).forEach(function(e){if(nodes.indexOf(e)<0)nodes.push(e)})}catch(e){}});nodes.forEach(function(e){if(!vis(e))return;var t=(e.innerText||'').toUpperCase();if(t.indexOf('FLAVORS')<0||t.indexOf('MERCHANDISE')<0)return;var r=e.getBoundingClientRect(),n=0;if(r.width>innerWidth*.6&&r.width<innerWidth*.98)n+=4;if(r.height>innerHeight*.6)n+=4;if(t.indexOf('MY ACCOUNT')>=0)n+=2;if(t.indexOf('CUSTOMER SUPPORT')>=0)n+=2;if(n>score){score=n;best=e}});return best}
          function fixDrawer(){if(isMerchant)return;var d=drawer();if(!d)return;d.style.setProperty('background','#080808','important');d.style.setProperty('color','#fff','important');var dr=d.getBoundingClientRect();d.querySelectorAll('*').forEach(function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e),m=String(s.backgroundColor).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);if(m&&+m[1]>225&&+m[2]>225&&+m[3]>225&&r.width>dr.width*.55&&r.height>55){e.style.setProperty('background','#080808','important')}if((e.innerText||'').trim()){e.style.setProperty('color','#fff','important');e.style.setProperty('-webkit-text-fill-color','#fff','important');e.style.setProperty('opacity','1','important')}})}
          function pageTitle(){var h=document.querySelectorAll('h1,h2,[data-page-title],.page-title,.category-title');for(var i=0;i<h.length;i++){if(vis(h[i])){var t=(h[i].innerText||'').replace(/\s+/g,' ').trim().toUpperCase();if(t)return t}}return ''}
          if(!isMerchant&&!window.__sl112Back){window.__sl112Back=true;document.addEventListener('click',function(ev){var c=ev.target&&ev.target.closest?ev.target.closest('a,button,[role="button"]'):null;if(!c)return;var tx=(c.innerText||c.textContent||'').replace(/\s+/g,'').trim(),ar=(c.getAttribute('aria-label')||c.getAttribute('title')||'').toLowerCase(),cl=String(c.className||'').toLowerCase();var back=tx==='←'||tx==='‹'||ar.indexOf('back')>=0||cl.indexOf('back')>=0;if(back&&top.indexOf(pageTitle())>=0){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();location.assign(home)}},true)}
          function card(label){var w=label.toUpperCase(),els=document.querySelectorAll('a,button,div,span,strong,p,h2,h3,h4'),best=null,area=Infinity;for(var x=0;x<els.length;x++){var e=els[x];if(!vis(e)||((e.innerText||'').replace(/\s+/g,' ').trim().toUpperCase()!=w))continue;var n=e;for(var i=0;i<5&&n;i++,n=n.parentElement){var r=n.getBoundingClientRect();if(r.width>=115&&r.height>=95&&r.width<=innerWidth*.62&&r.height<=360&&r.width*r.height<area){area=r.width*r.height;best={card:n,label:e}}}}return best}
          function install(hit,src){if(!hit||!src||hit.card.querySelector('.sl-native-category-photo'))return;var c=hit.card,l=hit.label;c.style.setProperty('position','relative','important');c.style.setProperty('overflow','hidden','important');var img=document.createElement('img');img.className='sl-native-category-photo';img.src=norm(src);img.alt=l.innerText||'';img.style.cssText='position:absolute!important;left:0!important;top:0!important;width:100%!important;height:72%!important;object-fit:contain!important;background:#fff!important;padding:8px!important;box-sizing:border-box!important;z-index:1!important;';c.insertBefore(img,c.firstChild);c.querySelectorAll('svg').forEach(function(s){s.style.setProperty('display','none','important')});l.style.cssText+=';position:absolute!important;left:8px!important;right:8px!important;bottom:14px!important;z-index:2!important;text-align:center!important;color:#111!important;-webkit-text-fill-color:#111!important;background:rgba(255,255,255,.94)!important;'}
          function hydrate(label,path){if(isMerchant)return;var h=card(label);if(!h||h.card.querySelector('img:not(.sl-native-category-photo)'))return;var key='sl112-photo:'+label,cache='';try{cache=localStorage.getItem(key)||''}catch(e){}if(cache){install(h,cache);return}window.__sl112Fetch=window.__sl112Fetch||{};if(window.__sl112Fetch[label])return;window.__sl112Fetch[label]=1;fetch(path,{credentials:'include',cache:'force-cache'}).then(function(r){return r.ok?r.text():''}).then(function(html){var d=new DOMParser().parseFromString(html,'text/html'),im=d.querySelector('ul.products li.product img,.products .product img,li.product img,img.wp-post-image');if(!im)return;var src=candidate(im);if(src){try{localStorage.setItem(key,src)}catch(e){}install(card(label),src)}}).catch(function(){}).then(function(){window.__sl112Fetch[label]=0})}
          function hideBadge(){document.querySelectorAll('body *').forEach(function(e){if(!e.children.length&&/^RELEASE\s+1\.1\.\d+$/i.test((e.textContent||'').trim())){var p=getComputedStyle(e).position;if(p==='fixed'||p==='absolute')e.style.setProperty('display','none','important')}})}
          function fix(){document.querySelectorAll('input[autofocus],textarea[autofocus]').forEach(function(e){e.removeAttribute('autofocus')});repairImages();fixDrawer();hideBadge()}
          function photos(){if(isMerchant)return;Object.keys(photoPages).forEach(function(k,i){setTimeout(function(){hydrate(k,photoPages[k])},i*55)})}
          if(!document.getElementById('sl-native-112-style')){var s=document.createElement('style');s.id='sl-native-112-style';s.textContent='@media(max-width:600px){header img{max-height:68px!important;width:auto!important}.site-header img,.header-logo img{max-width:190px!important;height:auto!important}input,select,button,textarea{font-size:16px}.sl-bottom-nav,.bottom-navigation,.bottom-nav{padding-bottom:max(8px,env(safe-area-inset-bottom))!important}.sl-native-category-photo{pointer-events:none!important}}';document.head.appendChild(s)}
          fix();setTimeout(photos,120);
          if(!window.__sl112Observer){var pending=false;window.__sl112Observer=new MutationObserver(function(){if(pending)return;pending=true;setTimeout(function(){pending=false;fix();photos()},180)});window.__sl112Observer.observe(document.documentElement,{childList:true,subtree:true})}
        })();
        """#
        configuration.userContentController.addUserScript(
            WKUserScript(source: phonePolish, injectionTime: .atDocumentEnd, forMainFrameOnly: true)
        )

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic
        webView.customUserAgent = appUserAgent
        webView.load(URLRequest(url: startURL, cachePolicy: .useProtocolCachePolicy, timeoutInterval: 30))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        private let allowedHosts = Set(["shishalove.eu", "www.shishalove.eu"])

        func webView(_ webView: WKWebView,
                     decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }
            let scheme = url.scheme?.lowercased() ?? ""
            if scheme == "http" || scheme == "https" {
                if let host = url.host?.lowercased(), allowedHosts.contains(host) {
                    decisionHandler(.allow)
                } else {
                    UIApplication.shared.open(url)
                    decisionHandler(.cancel)
                }
                return
            }
            if UIApplication.shared.canOpenURL(url) { UIApplication.shared.open(url) }
            decisionHandler(.cancel)
        }

        func webView(_ webView: WKWebView,
                     createWebViewWith configuration: WKWebViewConfiguration,
                     for navigationAction: WKNavigationAction,
                     windowFeatures: WKWindowFeatures) -> WKWebView? {
            if navigationAction.targetFrame == nil, let url = navigationAction.request.url {
                webView.load(URLRequest(url: url, cachePolicy: .useProtocolCachePolicy))
            }
            return nil
        }
    }
}
