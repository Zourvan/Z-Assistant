import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en/translation.json';
import faTranslation from './locales/fa/translation.json';

// Keep track of language to prevent infinite recursion
let currentlyChangingLanguage = false;

// Helper function to set the language and direction
export const changeLanguageAndDirection = (language: string) => {
    // Skip if we're already in the middle of changing the language
    if (currentlyChangingLanguage || i18n.language === language) {
        return;
    }

    try {
        currentlyChangingLanguage = true;
        const dir = language === 'fa' ? 'rtl' : 'ltr';
        document.documentElement.dir = dir;
        document.body.dir = dir;

        // Change the language without triggering the event handler again
        i18n.changeLanguage(language);

        // Force reflow to apply direction changes
        document.body.style.display = 'none';
        setTimeout(() => {
            document.body.style.display = '';
        }, 10);
    } finally {
        currentlyChangingLanguage = false;
    }
};

i18n
    // detect user language
    .use(LanguageDetector)
    // pass the i18n instance to react-i18next
    .use(initReactI18next)
    // init i18next
    .init({
        debug: process.env.NODE_ENV === 'development',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
        resources: {
            en: {
                translation: enTranslation
            },
            fa: {
                translation: faTranslation
            }
        },
        react: {
            useSuspense: false,
        },
    });

// Initialize direction based on current language
const initialLanguage = localStorage.getItem('language') || i18n.language || window.localStorage.getItem('i18nextLng') || 'en';
setTimeout(() => {
    // Defer execution to avoid initialization issues
    const dir = initialLanguage === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.body.dir = dir;
}, 0);

// Only update direction on language change, not re-trigger language change
i18n.on('languageChanged', (lng) => {
    if (!currentlyChangingLanguage) {
        const dir = lng === 'fa' ? 'rtl' : 'ltr';
        document.documentElement.dir = dir;
        document.body.dir = dir;
    }
});

export default i18n; 