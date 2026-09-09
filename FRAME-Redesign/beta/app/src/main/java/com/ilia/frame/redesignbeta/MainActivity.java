package com.ilia.frame.redesignbeta;

import android.app.Activity;
import android.content.ClipData;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.OutputStream;
import java.util.ArrayList;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 6001;
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.BLACK);
        getWindow().setNavigationBarColor(Color.BLACK);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.BLACK);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(true);

        WebView.setWebContentsDebuggingEnabled(true);
        webView.addJavascriptInterface(new AndroidBridge(this), "FrameAndroid");
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    Intent intent = params.createIntent();
                    intent.setType("image/*");
                    intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                    return true;
                } catch (Exception e) {
                    fileCallback = null;
                    Toast.makeText(MainActivity.this, "Unable to open photo picker", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });

        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST || fileCallback == null) return;

        Uri[] results = null;
        if (resultCode == RESULT_OK && data != null) {
            ArrayList<Uri> uris = new ArrayList<>();
            ClipData clipData = data.getClipData();
            if (clipData != null) {
                for (int i = 0; i < clipData.getItemCount(); i++) {
                    Uri uri = clipData.getItemAt(i).getUri();
                    if (uri != null) uris.add(uri);
                }
            } else if (data.getData() != null) {
                uris.add(data.getData());
            }
            if (!uris.isEmpty()) results = uris.toArray(new Uri[0]);
        }
        fileCallback.onReceiveValue(results);
        fileCallback = null;
    }

    private void exitApp() {
        super.onBackPressed();
    }

    @Override
    public void onBackPressed() {
        if (webView == null) {
            exitApp();
            return;
        }
        String js = "(function(){var a=document.querySelector('.screen.active');" +
                "if(a&&a.id==='editor'){document.getElementById('editorBack').click();return 'handled';}" +
                "if(a&&a.id==='admin'){document.querySelector('#admin [data-go=\"settings\"]').click();return 'handled';}" +
                "if(a&&a.id==='settings'){document.querySelector('#settings [data-go=\"library\"]').click();return 'handled';}" +
                "if(a&&a.id==='onboarding'){document.querySelector('#onboarding [data-go=\"library\"]').click();return 'handled';}" +
                "return 'exit';})()";
        webView.evaluateJavascript(js, value -> {
            if (value == null || value.contains("exit")) exitApp();
        });
    }

    public static class AndroidBridge {
        private final Context context;

        AndroidBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void toast(String message) {
            ((Activity) context).runOnUiThread(() -> Toast.makeText(context, message, Toast.LENGTH_SHORT).show());
        }

        @JavascriptInterface
        public boolean saveJpeg(String dataUrl, String requestedName) {
            try {
                String base64 = dataUrl.substring(dataUrl.indexOf(',') + 1);
                byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
                String fileName = (requestedName == null || requestedName.trim().isEmpty())
                        ? "FRAME_Edit_" + System.currentTimeMillis() + ".jpg"
                        : requestedName.replaceAll("[^a-zA-Z0-9._-]", "_");
                if (!fileName.toLowerCase().endsWith(".jpg") && !fileName.toLowerCase().endsWith(".jpeg")) fileName += ".jpg";

                ContentValues values = new ContentValues();
                values.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
                values.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    values.put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/FRAME Beta");
                    values.put(MediaStore.Images.Media.IS_PENDING, 1);
                }

                Uri uri = context.getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                if (uri == null) return false;
                try (OutputStream stream = context.getContentResolver().openOutputStream(uri)) {
                    if (stream == null) return false;
                    stream.write(bytes);
                    stream.flush();
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues done = new ContentValues();
                    done.put(MediaStore.Images.Media.IS_PENDING, 0);
                    context.getContentResolver().update(uri, done, null, null);
                }
                ((Activity) context).runOnUiThread(() -> Toast.makeText(context, "Saved to Pictures / FRAME Beta", Toast.LENGTH_LONG).show());
                return true;
            } catch (Exception e) {
                ((Activity) context).runOnUiThread(() -> Toast.makeText(context, "Export failed: " + e.getMessage(), Toast.LENGTH_LONG).show());
                return false;
            }
        }
    }
}
