package com.embroideryguide.app;

/** Pure-Java input limits shared by the Android print plugin and its unit tests. */
final class PrintInput {
    static final int MAX_DOCUMENT_CHARS = 8 * 1024 * 1024;
    static final int MAX_TITLE_CHARS = 120;
    private static final String DEFAULT_TITLE = "EmbroideryGuide setup";

    private PrintInput() {}

    static boolean validDocument(String html) {
        return html != null && html.length() <= MAX_DOCUMENT_CHARS && !html.trim().isEmpty();
    }

    static String jobTitle(String name) {
        String title = name == null ? "" : name.replace('\r', ' ').replace('\n', ' ').trim();
        if (title.isEmpty()) return DEFAULT_TITLE;
        if (title.length() <= MAX_TITLE_CHARS) return title;
        int end = MAX_TITLE_CHARS;
        if (Character.isHighSurrogate(title.charAt(end - 1))) end--;
        return title.substring(0, end);
    }
}
