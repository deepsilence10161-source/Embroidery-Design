package com.embroideryguide.app;

import static org.junit.Assert.*;
import org.junit.Test;

public class PrintInputTest {
    @Test public void blankOrNullDocumentsAreRejected() {
        assertFalse(PrintInput.validDocument(null));
        assertFalse(PrintInput.validDocument(""));
        assertFalse(PrintInput.validDocument(" \n\t "));
        assertTrue(PrintInput.validDocument("<!doctype html><html><body>Setup</body></html>"));
    }

    @Test public void documentSizeLimitIsExact() {
        assertTrue(PrintInput.validDocument("x".repeat(PrintInput.MAX_DOCUMENT_CHARS)));
        assertFalse(PrintInput.validDocument("x".repeat(PrintInput.MAX_DOCUMENT_CHARS + 1)));
    }

    @Test public void printTitlesAreSingleLineAndHaveAnHonestFallback() {
        assertEquals("EmbroideryGuide setup", PrintInput.jobTitle(null));
        assertEquals("EmbroideryGuide setup", PrintInput.jobTitle("  "));
        assertEquals("D001 · Floral Border", PrintInput.jobTitle("  D001 · Floral\nBorder  "));
        assertEquals(120, PrintInput.jobTitle("a".repeat(200)).length());
    }

    @Test public void truncationNeverSplitsASupplementaryUnicodeCharacter() {
        String name = "a".repeat(119) + "\uD83E\uDEA1" + "Border";
        String title = PrintInput.jobTitle(name);
        assertEquals(119, title.length());
        assertFalse(Character.isHighSurrogate(title.charAt(title.length() - 1)));
        assertEquals("सुई · रंग · कपड़ा", PrintInput.jobTitle("सुई · रंग · कपड़ा"));
    }
}
