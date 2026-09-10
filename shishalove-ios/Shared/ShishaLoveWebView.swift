import SwiftUI
import WebKit

struct ShishaLoveWebView: UIViewRepresentable {
    let startURL: URL
    let appUserAgent: String

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false

        let phonePolish = #"""
        (function(){
          function fix(){
            document.querySelectorAll('input[autofocus],textarea[autofocus]').forEach(function(el){el.removeAttribute('autofocus');});
            var a=document.activeElement;
            if(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA')){a.blur();}

            document.querySelectorAll('img').forEach(function(img){
              if(!img.dataset.slRepairBound){
                img.dataset.slRepairBound='1';
                img.addEventListener('error',function(){
                  var c=img.getAttribute('data-src')||img.getAttribute('data-lazy-src')||img.getAttribute('data-original')||img.getAttribute('data-lazyload');
                  if(c&&img.src!==c){img.src=c;}
                },{once:true});
              }
              if(!img.getAttribute('src')){
                var c=img.getAttribute('data-src')||img.getAttribute('data-lazy-src')||img.getAttribute('data-original')||img.getAttribute('data-lazyload');
                if(c){img.src=c;}
              }
            });

            document.querySelectorAll('body *').forEach(function(el){
              if(el.children.length===0&&/^RELEASE\s+1\.1\.\d+$/i.test((el.textContent||'').trim())){
                var p=getComputedStyle(el).position;
                if(p==='fixed'||p==='absolute'){el.style.setProperty('display','none','important');}
              }
            });
          }

          if(!document.getElementById('sl-native-phone-polish')){
            var s=document.createElement('style');
            s.id='sl-native-phone-polish';
            s.textContent='@media(max-width:600px){header img{max-height:68px!important;width:auto!important}.site-header img,.header-logo img{max-width:190px!important;height:auto!important}input,select,button{font-size:16px}.sl-bottom-nav,.bottom-navigation,.bottom-nav{padding-bottom:max(8px,env(safe-area-inset-bottom))!important}img{max-width:100%}}';
            document.head.appendChild(s);
          }

          fix();
          if(!window.__slNativeObserver){
            window.__slNativeObserver=new MutationObserver(function(){fix();});
            window.__slNativeObserver.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src','data-src','class','style']});
          }
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
        webView.load(URLRequest(url: startURL, cachePolicy: .reloadRevalidatingCacheData))
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

            if UIApplication.shared.canOpenURL(url) {
                UIApplication.shared.open(url)
            }
            decisionHandler(.cancel)
        }

        func webView(_ webView: WKWebView,
                     createWebViewWith configuration: WKWebViewConfiguration,
                     for navigationAction: WKNavigationAction,
                     windowFeatures: WKWindowFeatures) -> WKWebView? {
            if navigationAction.targetFrame == nil,
               let url = navigationAction.request.url {
                webView.load(URLRequest(url: url))
            }
            return nil
        }
    }
}
