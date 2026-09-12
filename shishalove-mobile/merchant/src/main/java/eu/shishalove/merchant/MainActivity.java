package eu.shishalove.merchant;

import android.Manifest;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.Toast;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final String START_URL = "https://shishalove.eu/shishalove-merchant/?app=android&build=116";
    private static final String SHOP_HOST = "shishalove.eu";
    private static final int FILE_CHOOSER_REQUEST = 7201;
    private static final int NOTIFICATION_PERMISSION_REQUEST = 7301;
    private static final String ORDER_CHANNEL_ID = "shishalove_orders";

    private FrameLayout root;
    private WebView webView;
    private ProgressBar progressBar;
    private ImageView snapshotOverlay;
    private Bitmap lastSnapshot;
    private ValueCallback<Uri[]> filePathCallback;
    private String phonePolishJs;
    private String orderWatchJs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window window = getWindow();
        window.setStatusBarColor(Color.WHITE);
        window.setNavigationBarColor(Color.WHITE);
        window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);

        createOrderNotificationChannel();
        requestOrderNotificationPermission();

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.WHITE);
        if (Build.VERSION.SDK_INT >= 35) {
            root.setOnApplyWindowInsetsListener((v, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
        }

        webView = new WebView(this);
        webView.setBackgroundColor(Color.WHITE);
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        root.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        snapshotOverlay = new ImageView(this);
        snapshotOverlay.setScaleType(ImageView.ScaleType.FIT_XY);
        snapshotOverlay.setBackgroundColor(Color.WHITE);
        snapshotOverlay.setVisibility(View.GONE);
        root.addView(snapshotOverlay, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        progressBar.setVisibility(View.GONE);
        root.addView(progressBar, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                3
        ));

        setContentView(root);
        phonePolishJs = readAsset("merchant_phone_polish.js");
        orderWatchJs = readAsset("merchant_order_watch.js");
        configureWebView();

        if (savedInstanceState == null) webView.loadUrl(START_URL);
        else webView.restoreState(savedInstanceState);
    }

    private void createOrderNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        NotificationChannel channel = new NotificationChannel(
                ORDER_CHANNEL_ID,
                "New orders",
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Notifications when a new ShishaLove WooCommerce order arrives");
        manager.createNotificationChannel(channel);
    }

    private void requestOrderNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_PERMISSION_REQUEST);
        }
    }

    private void showOrderNotification(String number, String customer, String total) {
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, openIntent, pendingFlags);

        String safeNumber = number == null || number.trim().isEmpty() ? "" : " #" + number.trim();
        String safeCustomer = customer == null || customer.trim().isEmpty() ? "Customer" : customer.trim();
        String safeTotal = total == null ? "" : total.trim();
        String text = safeCustomer + (safeTotal.isEmpty() ? "" : " · " + safeTotal);

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, ORDER_CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
            builder.setPriority(Notification.PRIORITY_HIGH);
        }
        builder.setSmallIcon(R.drawable.ic_shishalove)
                .setContentTitle("New ShishaLove order" + safeNumber)
                .setContentText(text)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);

        int notificationId = (int) (System.currentTimeMillis() & 0x7fffffff);
        manager.notify(notificationId, builder.build());
    }

    private final class MerchantNativeBridge {
        @JavascriptInterface
        public void notifyOrder(String number, String customer, String total) {
            runOnUiThread(() -> showOrderNotification(number, customer, total));
        }
    }

    private String readAsset(String name) {
        try (InputStream input = getAssets().open(name);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            return new String(output.toByteArray(), StandardCharsets.UTF_8);
        } catch (Exception ignored) {
            return "";
        }
    }

    private void showLastSnapshot() {
        if (lastSnapshot == null || lastSnapshot.isRecycled()) return;
        snapshotOverlay.setImageBitmap(lastSnapshot);
        snapshotOverlay.setAlpha(1f);
        snapshotOverlay.setVisibility(View.VISIBLE);
    }

    private void hideLastSnapshot() {
        if (snapshotOverlay.getVisibility() != View.VISIBLE) return;
        snapshotOverlay.animate().alpha(0f).setDuration(100).withEndAction(() -> {
            snapshotOverlay.setVisibility(View.GONE);
            snapshotOverlay.setAlpha(1f);
        }).start();
    }

    private void captureSnapshot() {
        webView.postDelayed(() -> {
            if (webView.getWidth() <= 0 || webView.getHeight() <= 0) return;
            try {
                Bitmap bitmap = Bitmap.createBitmap(webView.getWidth(), webView.getHeight(), Bitmap.Config.ARGB_8888);
                Canvas canvas = new Canvas(bitmap);
                webView.draw(canvas);
                Bitmap old = lastSnapshot;
                lastSnapshot = bitmap;
                if (old != null && old != bitmap && !old.isRecycled()) old.recycle();
            } catch (Throwable ignored) {
            }
        }, 120);
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setBlockNetworkImage(false);
        settings.setLoadWithOverviewMode(false);
        settings.setUseWideViewPort(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) settings.setOffscreenPreRaster(true);
        settings.setUserAgentString(settings.getUserAgentString() + " ShishaLoveMerchant/1.1.6");

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);
        webView.addJavascriptInterface(new MerchantNativeBridge(), "ShishaLoveNative");
        WebView.setWebContentsDebuggingEnabled(false);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleUri(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUri(Uri.parse(url));
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                showLastSnapshot();
                applyRuntimeJs(view);
            }

            @Override
            public void onPageCommitVisible(WebView view, String url) {
                super.onPageCommitVisible(view, url);
                applyRuntimeJs(view);
                progressBar.setVisibility(View.GONE);
                hideLastSnapshot();
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                applyRuntimeJs(view);
                progressBar.setVisibility(View.GONE);
                hideLastSnapshot();
                captureSnapshot();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame()) {
                    hideLastSnapshot();
                    Toast.makeText(MainActivity.this,
                            "Unable to reach ShishaLove Merchant. Check your internet connection and try again.",
                            Toast.LENGTH_LONG).show();
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setVisibility(View.GONE);
                if (newProgress >= 5) applyRuntimeJs(view);
            }

            @Override
            public boolean onShowFileChooser(WebView webView,
                                             ValueCallback<Uri[]> newCallback,
                                             FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = newCallback;
                Intent intent;
                try {
                    intent = params.createIntent();
                } catch (Exception e) {
                    intent = new Intent(Intent.ACTION_GET_CONTENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType("image/*");
                }
                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                    return true;
                } catch (Exception e) {
                    filePathCallback = null;
                    Toast.makeText(MainActivity.this, "No file picker available", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });
    }

    private void applyRuntimeJs(WebView view) {
        if (phonePolishJs != null && !phonePolishJs.isEmpty()) view.evaluateJavascript(phonePolishJs, null);
        if (orderWatchJs != null && !orderWatchJs.isEmpty()) view.evaluateJavascript(orderWatchJs, null);
    }

    private boolean handleUri(Uri uri) {
        if (uri == null || uri.getScheme() == null) return false;
        String scheme = uri.getScheme().toLowerCase();
        if ("http".equals(scheme) || "https".equals(scheme)) {
            String host = uri.getHost();
            if (host != null && (SHOP_HOST.equalsIgnoreCase(host) || ("www." + SHOP_HOST).equalsIgnoreCase(host))) return false;
        }
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST && filePathCallback != null) {
            Uri[] results = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.postDelayed(() -> webView.evaluateJavascript(
                    "if(window.SLM_CHECK_ORDERS){window.SLM_CHECK_ORDERS();}", null), 1200);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onPause() {
        CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (lastSnapshot != null && !lastSnapshot.isRecycled()) lastSnapshot.recycle();
        if (webView != null) {
            CookieManager.getInstance().flush();
            webView.stopLoading();
            webView.destroy();
        }
        super.onDestroy();
    }
}