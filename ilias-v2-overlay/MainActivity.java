package com.iliaperformance.iliacoach2026;

import android.app.*;
import android.os.*;
import android.content.*;
import android.net.Uri;
import android.webkit.*;
import android.view.*;
import android.graphics.Color;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.widget.Toast;

public class MainActivity extends Activity {
  private WebView web;
  private ValueCallback<Uri[]> chooser;
  private static final int PICK=5001;

  @Override public void onCreate(Bundle b){
    super.onCreate(b);
    getWindow().setStatusBarColor(0xff020609);
    getWindow().setNavigationBarColor(Color.BLACK);
    web=new WebView(this);
    web.setBackgroundColor(0xff020609);
    setContentView(web);
    applySystemBarInsets(web);

    WebSettings s=web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setAllowFileAccess(true);
    s.setAllowContentAccess(true);
    s.setAllowUniversalAccessFromFileURLs(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setLoadsImagesAutomatically(true);
    s.setSupportZoom(false);
    s.setUseWideViewPort(true);
    s.setLoadWithOverviewMode(false);

    CookieManager cm=CookieManager.getInstance();
    cm.setAcceptCookie(true);
    try{cm.setAcceptThirdPartyCookies(web,true);}catch(Exception ignored){}

    web.addJavascriptInterface(new AndroidBridge(),"AndroidBridge");
    web.setWebChromeClient(new WebChromeClient(){
      @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> cb,FileChooserParams p){
        if(chooser!=null)chooser.onReceiveValue(null); chooser=cb; Intent i;
        try{i=p.createIntent();}catch(Exception e){i=new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*").addCategory(Intent.CATEGORY_OPENABLE);}
        startActivityForResult(i,PICK); return true;
      }
    });

    web.setWebViewClient(new WebViewClient(){
      @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){
        Uri u=r.getUrl();
        if("file".equals(u.getScheme()))return false;
        if("iliascoach".equals(u.getScheme())){deliverSpotifyCallback(u.toString());return true;}
        if(!r.isForMainFrame())return false;
        if("http".equals(u.getScheme())||"https".equals(u.getScheme())){
          try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception ignored){}
          return true;
        }
        return false;
      }
      @Override public boolean shouldOverrideUrlLoading(WebView v,String url){
        if(url==null)return false;
        Uri u=Uri.parse(url);
        if("file".equals(u.getScheme()))return false;
        if("iliascoach".equals(u.getScheme())){deliverSpotifyCallback(url);return true;}
        if("http".equals(u.getScheme())||"https".equals(u.getScheme())){
          try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception ignored){}
          return true;
        }
        return false;
      }
    });

    web.loadUrl("file:///android_asset/index.html");
    handleIntent(getIntent());
  }

  private void handleIntent(Intent intent){
    if(intent!=null && intent.getData()!=null && "iliascoach".equals(intent.getData().getScheme())){
      deliverSpotifyCallback(intent.getData().toString());
    }
  }

  @Override protected void onNewIntent(Intent intent){
    super.onNewIntent(intent); setIntent(intent); handleIntent(intent);
  }

  private void deliverSpotifyCallback(String url){
    if(web==null)return;
    String safe=url.replace("\\","\\\\").replace("'","\\'");
    web.postDelayed(()->web.evaluateJavascript("window.handleSpotifyCallback&&window.handleSpotifyCallback('"+safe+"')",null),350);
  }

  @Override protected void onActivityResult(int req,int res,Intent data){
    super.onActivityResult(req,res,data);
    if(req==PICK&&chooser!=null){
      Uri[] out=null;
      if(res==RESULT_OK&&data!=null){
        if(data.getClipData()!=null){int n=data.getClipData().getItemCount();out=new Uri[n];for(int i=0;i<n;i++)out[i]=data.getClipData().getItemAt(i).getUri();}
        else if(data.getData()!=null)out=new Uri[]{data.getData()};
      }
      chooser.onReceiveValue(out);chooser=null;
    }
  }

  private void applySystemBarInsets(View target){
    target.setOnApplyWindowInsetsListener((v,insets)->{
      int l=0,t=0,r=0,b=0;
      if(Build.VERSION.SDK_INT>=30){android.graphics.Insets sys=insets.getInsets(WindowInsets.Type.systemBars());l=sys.left;t=sys.top;r=sys.right;b=sys.bottom;}
      else{l=insets.getSystemWindowInsetLeft();t=insets.getSystemWindowInsetTop();r=insets.getSystemWindowInsetRight();b=insets.getSystemWindowInsetBottom();}
      v.setPadding(l,t,r,b);return insets;
    });
    target.requestApplyInsets();
  }

  @Override public void onBackPressed(){
    web.evaluateJavascript("window.iliasBack?window.iliasBack():false",value->{
      if("false".equals(value)||"null".equals(value)) MainActivity.super.onBackPressed();
    });
  }

  public class AndroidBridge {
    @JavascriptInterface public void openExternal(String url){
      runOnUiThread(()->{try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)));}catch(Exception e){Toast.makeText(MainActivity.this,"Unable to open link",Toast.LENGTH_SHORT).show();}});
    }
    @JavascriptInterface public void haptic(int millis){
      Vibrator v=(Vibrator)getSystemService(VIBRATOR_SERVICE);if(v==null)return;
      int ms=Math.max(8,Math.min(80,millis));
      if(Build.VERSION.SDK_INT>=26)v.vibrate(VibrationEffect.createOneShot(ms,VibrationEffect.DEFAULT_AMPLITUDE));else v.vibrate(ms);
    }
    @JavascriptInterface public void shareText(String title,String text){
      runOnUiThread(()->{Intent send=new Intent(Intent.ACTION_SEND);send.setType("text/plain");send.putExtra(Intent.EXTRA_SUBJECT,title);send.putExtra(Intent.EXTRA_TEXT,text);startActivity(Intent.createChooser(send,title));});
    }
  }
}
