import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import i18n from "./i18n";
import { changeLanguageAndDirection } from "./i18n";

type Language = "en" | "fa";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  dir: "ltr" | "rtl";
}

// Create context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  dir: "ltr",
});

// Props for LanguageProvider
interface LanguageProviderProps {
  children: ReactNode;
}

// LanguageProvider component
export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return saved === "en" || saved === "fa" ? (saved as Language) : "en";
  });

  const [dir, setDir] = useState<"ltr" | "rtl">(() => {
    const saved = localStorage.getItem("language");
    return saved === "fa" ? "rtl" : "ltr";
  });

  useEffect(() => {
    // Use the safe change function from i18n.ts
    changeLanguageAndDirection(language);

    // Update direction state
    const newDir = language === "fa" ? "rtl" : "ltr";
    setDir(newDir);

    // Store language preference
    localStorage.setItem("language", language);
  }, [language]);

  // Language change handler
  const handleLanguageChange = (newLanguage: Language) => {
    // Only update if the language has actually changed
    if (newLanguage !== language) {
      setLanguage(newLanguage);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleLanguageChange,
        dir,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

// Utility hook that combines useLanguage and useTranslation
export function useI18n() {
  const { t } = useTranslation();
  const languageContext = useLanguage();

  return {
    ...languageContext,
    t,
  };
}
