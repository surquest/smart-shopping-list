"use client";

import { useEffect } from 'react';
import { useTranslation } from '@/i18n/useTranslation';

/**
 * Client component that updates the HTML lang attribute dynamically
 * based on the current language selection.
 * 
 * This runs only on the client side to avoid hydration mismatches.
 */
export default function HtmlLangUpdater() {
    const { language } = useTranslation();

    useEffect(() => {
        // Update the HTML lang attribute when language changes
        document.documentElement.lang = language;
    }, [language]);

    // This component doesn't render anything
    return null;
}
