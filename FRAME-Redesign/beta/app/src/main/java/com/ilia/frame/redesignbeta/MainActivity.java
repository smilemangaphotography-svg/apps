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
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 7001;
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
        webView.addJavascriptInterface(new SmartMlBridge(this, webView), "FrameAI");
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

        webView.loadUrl("file:///android_asset/index09.html");
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
            } else if (data.getData() != null) uris.add(data.getData());
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
        if (webView == null) { exitApp(); return; }
        String js = "(function(){var a=document.querySelector('.screen.active');" +
                "if(a&&a.id==='editor'){document.getElementById('backBtn').click();return 'handled';}" +
                "if(a&&a.id==='admin'){document.getElementById('adminBack').click();return 'handled';}" +
                "if(a&&a.id==='settings'){document.getElementById('settingsBack').click();return 'handled';}" +
                "if(a&&a.id==='library'){return 'exit';}" +
                "if(a&&a.id==='splash'){return 'exit';}" +
                "return 'exit';})()";
        webView.evaluateJavascript(js, value -> {
            if (value == null || value.contains("exit")) exitApp();
        });
    }

    public static class AndroidBridge {
        private final Context context;
        AndroidBridge(Context context) { this.context = context; }

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
                    stream.write(bytes); stream.flush();
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues done = new ContentValues(); done.put(MediaStore.Images.Media.IS_PENDING, 0);
                    context.getContentResolver().update(uri, done, null, null);
                }
                ((Activity) context).runOnUiThread(() -> Toast.makeText(context, "Saved to Pictures / FRAME Beta", Toast.LENGTH_LONG).show());
                return true;
            } catch (Exception e) {
                ((Activity) context).runOnUiThread(() -> Toast.makeText(context, "Export failed: " + e.getMessage(), Toast.LENGTH_LONG).show());
                return false;
            }
        }

        @JavascriptInterface
        public boolean saveXmp(String xmpText, String requestedName) {
            try {
                if (xmpText == null || xmpText.trim().isEmpty()) return false;
                String fileName = (requestedName == null || requestedName.trim().isEmpty())
                        ? "FRAME_Preset_" + System.currentTimeMillis() + ".xmp"
                        : requestedName.replaceAll("[^a-zA-Z0-9._-]", "_");
                if (!fileName.toLowerCase().endsWith(".xmp")) fileName += ".xmp";
                byte[] bytes = xmpText.getBytes(StandardCharsets.UTF_8);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                    values.put(MediaStore.Downloads.MIME_TYPE, "application/rdf+xml");
                    values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/FRAME Presets");
                    values.put(MediaStore.Downloads.IS_PENDING, 1);
                    Uri uri = context.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (uri == null) return false;
                    try (OutputStream stream = context.getContentResolver().openOutputStream(uri)) {
                        if (stream == null) return false;
                        stream.write(bytes); stream.flush();
                    }
                    ContentValues done = new ContentValues(); done.put(MediaStore.Downloads.IS_PENDING, 0);
                    context.getContentResolver().update(uri, done, null, null);
                } else {
                    File base = context.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS);
                    if (base == null) return false;
                    File dir = new File(base, "FRAME Presets");
                    if (!dir.exists() && !dir.mkdirs()) return false;
                    try (FileOutputStream stream = new FileOutputStream(new File(dir, fileName))) {
                        stream.write(bytes); stream.flush();
                    }
                }
                ((Activity) context).runOnUiThread(() -> Toast.makeText(context, "Lightroom preset saved to Downloads / FRAME Presets", Toast.LENGTH_LONG).show());
                return true;
            } catch (Exception e) {
                ((Activity) context).runOnUiThread(() -> Toast.makeText(context, "XMP export failed: " + e.getMessage(), Toast.LENGTH_LONG).show());
                return false;
            }
        }
    }
}
