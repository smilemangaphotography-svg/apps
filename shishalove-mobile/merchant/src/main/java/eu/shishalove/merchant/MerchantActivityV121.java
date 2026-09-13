package eu.shishalove.merchant;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.WebView;

/**
 * Permanent Merchant Android shell correction.
 *
 * Keeps the approved WordPress Bridge UI/business logic intact while fixing
 * Android-only viewport behavior:
 *  - status-bar safe area is applied at the top only
 *  - the WebView extends through the navigation-bar area
 *  - the Merchant bottom navigation itself owns the Android bottom inset
 *  - content gets enough bottom clearance to scroll fully above the nav
 *  - vertical touch scrolling stays explicitly enabled
 */
public class MerchantActivityV121 extends MainActivity {
    private WebView merchantWebView;
    private View appRoot;
    private int bottomInsetCssPx = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(false);
            getWindow().setNavigationBarColor(Color.WHITE);
        }
        installPermanentViewportFix();
    }

    @Override
    protected void onResume() {
        super.onResume();
        scheduleWebFixes();
    }

    private void installPermanentViewportFix() {
        View content = findViewById(android.R.id.content);
        if (content instanceof ViewGroup && ((ViewGroup) content).getChildCount() > 0) {
            appRoot = ((ViewGroup) content).getChildAt(0);
        } else {
            appRoot = content;
        }

        merchantWebView = findWebView(appRoot);
        if (merchantWebView != null) {
            merchantWebView.setVerticalScrollBarEnabled(true);
            merchantWebView.setHorizontalScrollBarEnabled(false);
            merchantWebView.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                merchantWebView.setNestedScrollingEnabled(true);
            }
            merchantWebView.setOnTouchListener((v, event) -> {
                if ((event.getActionMasked() == MotionEvent.ACTION_DOWN
                        || event.getActionMasked() == MotionEvent.ACTION_MOVE)
                        && v.getParent() != null) {
                    v.getParent().requestDisallowInterceptTouchEvent(true);
                }
                return false;
            });
        }

        if (Build.VERSION.SDK_INT >= 35 && appRoot != null) {
            appRoot.setOnApplyWindowInsetsListener((v, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                float density = getResources().getDisplayMetrics().density;
                bottomInsetCssPx = Math.max(0, Math.round(bars.bottom / Math.max(1f, density)));

                // Keep only the top safe area at native level. The WebView must reach
                // the bottom edge; the fixed Merchant nav will paint through the
                // system-navigation area itself so no order text or blank gap shows.
                v.setPadding(bars.left, bars.top, bars.right, 0);
                v.setBackgroundColor(Color.WHITE);
                scheduleWebFixes();
                return insets;
            });
            appRoot.requestApplyInsets();
        }

        scheduleWebFixes();
    }

    private WebView findWebView(View view) {
        if (view == null) return null;
        if (view instanceof WebView) return (WebView) view;
        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i = 0; i < group.getChildCount(); i++) {
                WebView found = findWebView(group.getChildAt(i));
                if (found != null) return found;
            }
        }
        return null;
    }

    private void scheduleWebFixes() {
        if (merchantWebView == null) return;
        merchantWebView.postDelayed(this::applyWebFix, 80);
        merchantWebView.postDelayed(this::applyWebFix, 300);
        merchantWebView.postDelayed(this::applyWebFix, 800);
        merchantWebView.postDelayed(this::applyWebFix, 1600);
        merchantWebView.postDelayed(this::applyWebFix, 3000);
    }

    private void applyWebFix() {
        if (merchantWebView == null) return;
        final int inset = Math.max(0, bottomInsetCssPx);
        String js = "(function(){"
                + "var inset='" + inset + "px';"
                + "var d=document.documentElement,b=document.body;"
                + "if(d){d.style.setProperty('--safe-bottom',inset,'important');d.style.setProperty('height','auto','important');d.style.setProperty('min-height','100%','important');d.style.setProperty('overflow-y','auto','important');d.style.setProperty('overflow-x','hidden','important');d.style.setProperty('touch-action','pan-y','important');}"
                + "if(b){b.style.setProperty('height','auto','important');b.style.setProperty('min-height','100%','important');b.style.setProperty('overflow-y','auto','important');b.style.setProperty('overflow-x','hidden','important');b.style.setProperty('touch-action','pan-y','important');b.style.setProperty('-webkit-overflow-scrolling','touch','important');}"
                + "var app=document.querySelector('.slm-app');if(app){app.style.setProperty('height','auto','important');app.style.setProperty('min-height','100dvh','important');app.style.setProperty('overflow','visible','important');app.style.setProperty('padding-bottom','calc(72px + '+inset+')','important');}"
                + "document.querySelectorAll('.slm-page').forEach(function(p){p.style.setProperty('height','auto','important');p.style.setProperty('max-height','none','important');p.style.setProperty('overflow','visible','important');p.style.setProperty('touch-action','pan-y','important');p.style.setProperty('padding-bottom','calc(118px + '+inset+')','important');});"
                + "var nav=document.querySelector('.slm-bottom');if(nav){nav.style.setProperty('bottom','0','important');nav.style.setProperty('height','calc(72px + '+inset+')','important');nav.style.setProperty('padding-bottom',inset,'important');nav.style.setProperty('box-sizing','border-box','important');nav.style.setProperty('background','#fff','important');nav.style.setProperty('z-index','9999','important');}"
                + "if(!window.__slmPermanentScrollGuard){window.__slmPermanentScrollGuard=new MutationObserver(function(){var de=document.documentElement,bo=document.body;if(de){de.style.setProperty('overflow-y','auto','important');de.style.setProperty('height','auto','important');}if(bo){bo.style.setProperty('overflow-y','auto','important');bo.style.setProperty('height','auto','important');}var n=document.querySelector('.slm-bottom');if(n){n.style.setProperty('bottom','0','important');n.style.setProperty('height','calc(72px + '+inset+')','important');n.style.setProperty('padding-bottom',inset,'important');n.style.setProperty('background','#fff','important');}});window.__slmPermanentScrollGuard.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});}"
                + "})();";
        merchantWebView.evaluateJavascript(js, null);
    }
}
