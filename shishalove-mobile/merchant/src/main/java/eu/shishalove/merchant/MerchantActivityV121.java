package eu.shishalove.merchant;

import android.os.Build;
import android.os.Bundle;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

/**
 * Merchant Android shell behavior.
 *
 * 1.1.70 safe-area ownership:
 *  - MainActivity applies real Android systemBars insets to the native root
 *    before the WebView becomes visible.
 *  - Bridge CSS owns the fixed Merchant bottom-navigation height and content
 *    clearance inside that already-safe WebView viewport.
 *  - No delayed JavaScript writes bottom/height/padding/safe-area variables.
 */
public class MerchantActivityV121 extends MainActivity {
    private WebView merchantWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        installWebViewScrollBehavior();
    }

    private void installWebViewScrollBehavior() {
        View content = findViewById(android.R.id.content);
        View appRoot;
        if (content instanceof ViewGroup && ((ViewGroup) content).getChildCount() > 0) {
            appRoot = ((ViewGroup) content).getChildAt(0);
        } else {
            appRoot = content;
        }

        merchantWebView = findWebView(appRoot);
        if (merchantWebView == null) return;

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
}
