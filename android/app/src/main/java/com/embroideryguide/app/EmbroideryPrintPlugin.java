package com.embroideryguide.app;

import android.content.Context;
import android.os.CancellationSignal;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Android's real print framework, including the system Save as PDF destination. */
@CapacitorPlugin(name = "EmbroideryPrint")
public class EmbroideryPrintPlugin extends Plugin {
    private WebView printView;

    @PluginMethod
    public void print(PluginCall call) {
        final String html = call.getString("html", "");
        final String name = call.getString("name", "EmbroideryGuide setup");
        if (!PrintInput.validDocument(html)) {
            call.reject("The print document is empty or too large.");
            return;
        }
        getActivity().runOnUiThread(() -> {
            if (printView != null) {
                call.reject("Close the current print job before opening another.");
                return;
            }
            final PrintManager manager = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
            if (manager == null) {
                call.reject("Android printing is not available on this device.");
                return;
            }
            final WebView view = new WebView(getContext());
            printView = view;
            view.getSettings().setJavaScriptEnabled(false);
            view.getSettings().setBlockNetworkLoads(true);
            final boolean[] settled = { false };
            final Handler handler = new Handler(Looper.getMainLooper());
            final Runnable timeout = () -> {
                if (!settled[0]) {
                    settled[0] = true;
                    release(view);
                    call.reject("Preparing the print sheet timed out. Please try again.");
                }
            };
            handler.postDelayed(timeout, 20000);
            view.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView finished, String url) {
                    if (settled[0]) return;
                    settled[0] = true;
                    handler.removeCallbacks(timeout);
                    try {
                        final String title = PrintInput.jobTitle(name);
                        final PrintDocumentAdapter delegate = view.createPrintDocumentAdapter(title);
                        final PrintDocumentAdapter adapter = new PrintDocumentAdapter() {
                            @Override public void onStart() { delegate.onStart(); }
                            @Override public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes,
                                    CancellationSignal cancellation, LayoutResultCallback callback, Bundle extras) {
                                delegate.onLayout(oldAttributes, newAttributes, cancellation, callback, extras);
                            }
                            @Override public void onWrite(PageRange[] pages, ParcelFileDescriptor destination,
                                    CancellationSignal cancellation, WriteResultCallback callback) {
                                delegate.onWrite(pages, destination, cancellation, callback);
                            }
                            @Override public void onFinish() {
                                delegate.onFinish();
                                release(view);
                            }
                        };
                        manager.print(title, adapter, new PrintAttributes.Builder()
                                .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                                .setColorMode(PrintAttributes.COLOR_MODE_COLOR).build());
                        call.resolve(new JSObject().put("opened", true));
                    } catch (Exception error) {
                        release(view);
                        call.reject("Could not open Android printing.", error);
                    }
                }
            });
            view.loadDataWithBaseURL("https://localhost/", html, "text/html", "UTF-8", null);
        });
    }

    private void release(WebView view) {
        if (printView == view) {
            printView = null;
            view.destroy();
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (printView != null) release(printView);
    }
}
