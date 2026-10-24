package com.embroideryguide.app;

import static org.junit.Assert.*;
import android.content.Context;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Optional connected-device checks. CI browser contracts are supplemented by these on a phone. */
@RunWith(AndroidJUnit4.class)
public class EmbroideryAppTest {
    @Test public void packageIdentityMatchesThePublishedApp() {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals("com.embroideryguide.app", context.getPackageName());
        assertEquals("EmbroideryGuide", context.getApplicationInfo().loadLabel(context.getPackageManager()).toString());
    }

    @Test public void theCompleteSharedAppIsBundledNotFetchedFromAWebsite() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (InputStream input = context.getAssets().open("public/index.html")) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
        }
        String html = new String(output.toByteArray(), StandardCharsets.UTF_8);
        assertTrue(html.contains("\"kind\":\"android\""));
        assertTrue(html.contains("embroidery_designs"));
        assertTrue(html.contains("embroidery_colors"));
        assertTrue(html.contains("embroidery_settings"));
        assertTrue(html.contains("data:image/jpeg;base64,"));
        assertFalse(html.contains("<script src=\"https://"));
    }
}
