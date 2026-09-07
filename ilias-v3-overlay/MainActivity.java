package com.iliaperformance.iliacoach2026;

import android.app.*;
import android.os.*;
import android.content.*;
import android.net.Uri;
import android.view.*;
import android.webkit.*;

public class MainActivity extends Activity {
  private WebView web;
  private ValueCallback<Uri[]> chooser;
  private static final int PICK=5001;
  private Uri pendingDeepLink;

  @Override public void onCreate(Bundle b){
    super.onCreate(b);
    getWindow().setStatusBarColor(0xff050809);
    getWindow().setNavigationBarColor(0xff050809);
    if(Build.VERSION.SDK_INT>=30){
      getWindow().setDecorFitsSystemWindows(false);
    }
    pendingDeepLink=getIntent()!=null?getIntent().getData():null;
    web=new WebView(this);
    web.setBackgroundColor(0xff050809);
    setContentView(web);
    WebSettings s=web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setAllowFileAccess(true);
    s.setAllowContentAccess(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setLoadsImagesAutomatically(true);
    s.setSupportZoom(false);
    s.setUseWideViewPort(true);
    s.setLoadWithOverviewMode(false);
    CookieManager cm=CookieManager.getInstance();
    cm.setAcceptCookie(true);
    try{cm.setAcceptThirdPartyCookies(web,true);}catch(Exception ignored){}
    web.setWebChromeClient(new WebChromeClient(){
      @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> cb,FileChooserParams p){
        if(chooser!=null)chooser.onReceiveValue(null); chooser=cb; Intent i;
        try{i=p.createIntent();}catch(Exception e){i=new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*").addCategory(Intent.CATEGORY_OPENABLE);}
        startActivityForResult(i,PICK); return true;
      }
    });
    web.setWebViewClient(new WebViewClient(){
      @Override public void onPageFinished(WebView v,String url){ super.onPageFinished(v,url); dispatchInsets(); dispatchDeepLink(); }
      @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){
        Uri u=r.getUrl(); String scheme=u.getScheme()==null?"":u.getScheme().toLowerCase();
        if("file".equals(scheme))return false;
        if("https".equals(scheme) && u.getHost()!=null && (u.getHost().contains("spotify.com")||u.getHost().contains("spotifycdn.com"))) return false;
        try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception ignored){} return true;
      }
      @Override public boolean shouldOverrideUrlLoading(WebView v,String url){
        if(url==null)return false; if(url.startsWith("file://")||url.contains("spotify.com"))return false;
        try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)));}catch(Exception ignored){} return true;
      }
    });
    web.setOnApplyWindowInsetsListener((v,insets)->{ dispatchInsets(insets); return insets; });
    web.loadUrl("file:///android_asset/index.html");
    web.requestApplyInsets();
  }

  private void dispatchInsets(){ if(Build.VERSION.SDK_INT>=23) web.requestApplyInsets(); }
  private void dispatchInsets(WindowInsets insets){
    int l=0,t=0,r=0,b=0;
    if(Build.VERSION.SDK_INT>=30){ android.graphics.Insets x=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout()); l=x.left;t=x.top;r=x.right;b=x.bottom; }
    else { l=insets.getSystemWindowInsetLeft();t=insets.getSystemWindowInsetTop();r=insets.getSystemWindowInsetRight();b=insets.getSystemWindowInsetBottom(); }
    final String js="window.__setInsets&&window.__setInsets("+t+","+b+","+l+","+r+")";
    web.post(()->web.evaluateJavascript(js,null));
  }
  private void dispatchDeepLink(){
    if(pendingDeepLink==null||web==null)return; String u=pendingDeepLink.toString(); pendingDeepLink=null;
    String q=JSONObjectQuote(u); web.evaluateJavascript("window.spotifyCallback&&window.spotifyCallback("+q+")",null);
  }
  private String JSONObjectQuote(String s){ return "\""+s.replace("\\","\\\\").replace("\"","\\\"").replace("\n","\\n").replace("\r","\\r")+"\""; }
  @Override protected void onNewIntent(Intent i){ super.onNewIntent(i); setIntent(i); pendingDeepLink=i.getData(); dispatchDeepLink(); }
  @Override protected void onActivityResult(int req,int res,Intent data){
    super.onActivityResult(req,res,data); if(req==PICK&&chooser!=null){ Uri[] out=null; if(res==RESULT_OK&&data!=null){ if(data.getClipData()!=null){int n=data.getClipData().getItemCount();out=new Uri[n];for(int x=0;x<n;x++)out[x]=data.getClipData().getItemAt(x).getUri();}else if(data.getData()!=null)out=new Uri[]{data.getData()};} chooser.onReceiveValue(out);chooser=null; }
  }
  @Override public void onBackPressed(){
    if(web==null){super.onBackPressed();return;}
    web.evaluateJavascript("(window.appBack?window.appBack():false)",value->{ if(!"true".equals(value)){ if(web.canGoBack())web.goBack(); else MainActivity.super.onBackPressed(); } });
  }
}
