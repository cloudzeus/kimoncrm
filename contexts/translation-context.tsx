"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface Language {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

interface TranslationContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  languages: Language[];
}

// Fallback languages used only until the active list loads from the API
const fallbackLanguages: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸", nativeName: "English" },
];

// Mock translations - in a real app, these would be loaded from an API or JSON files
const translations: Record<string, Record<string, string>> = {
  en: {
    "header.search": "Search...",
    "header.notifications": "Notifications",
    "header.profile": "Profile",
    "header.settings": "Settings",
    "header.logout": "Log out",
    "sidebar.dashboard": "Dashboard",
    "sidebar.companies": "Companies",
    "sidebar.contacts": "Contacts",
    "sidebar.leads": "Leads",
    "sidebar.opportunities": "Opportunities",
    "sidebar.products": "Products",
    "sidebar.orders": "Orders",
    "sidebar.quotes": "Quotes",
    "sidebar.tickets": "Tickets",
    "sidebar.projects": "Projects",
    "sidebar.email": "Email",
    "sidebar.calendar": "Calendar",
    "sidebar.surveys": "Surveys",
    "sidebar.settings": "Settings",
    "sidebar.administration": "Administration",
  },
  es: {
    "header.search": "Buscar...",
    "header.notifications": "Notificaciones",
    "header.profile": "Perfil",
    "header.settings": "Configuración",
    "header.logout": "Cerrar sesión",
    "sidebar.dashboard": "Panel",
    "sidebar.companies": "Empresas",
    "sidebar.contacts": "Contactos",
    "sidebar.leads": "Prospectos",
    "sidebar.opportunities": "Oportunidades",
    "sidebar.products": "Productos",
    "sidebar.orders": "Pedidos",
    "sidebar.quotes": "Cotizaciones",
    "sidebar.tickets": "Tickets",
    "sidebar.projects": "Proyectos",
    "sidebar.email": "Correo",
    "sidebar.calendar": "Calendario",
    "sidebar.surveys": "Encuestas",
    "sidebar.settings": "Configuración",
    "sidebar.administration": "Administración",
  },
  fr: {
    "header.search": "Rechercher...",
    "header.notifications": "Notifications",
    "header.profile": "Profil",
    "header.settings": "Paramètres",
    "header.logout": "Se déconnecter",
    "sidebar.dashboard": "Tableau de bord",
    "sidebar.companies": "Entreprises",
    "sidebar.contacts": "Contacts",
    "sidebar.leads": "Prospects",
    "sidebar.opportunities": "Opportunités",
    "sidebar.products": "Produits",
    "sidebar.orders": "Commandes",
    "sidebar.quotes": "Devis",
    "sidebar.tickets": "Tickets",
    "sidebar.projects": "Projets",
    "sidebar.email": "Email",
    "sidebar.calendar": "Calendrier",
    "sidebar.surveys": "Enquêtes",
    "sidebar.settings": "Paramètres",
    "sidebar.administration": "Administration",
  },
  // Add more languages as needed...
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [languagesState, setLanguagesState] = useState<Language[]>(fallbackLanguages);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(fallbackLanguages[0]);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side before accessing localStorage
  useEffect(() => {
    setIsClient(true);

    const init = async () => {
      try {
        const res = await fetch("/api/languages", { cache: "no-store" });
        if (res.ok) {
          const data: { languages: (Language & { isDefault?: boolean })[] } = await res.json();
          const activeLanguages = data.languages as Language[];
          if (activeLanguages && activeLanguages.length > 0) {
            setLanguagesState(activeLanguages);

            const savedLanguage = localStorage.getItem("selectedLanguage");
            const fromSaved = savedLanguage
              ? activeLanguages.find(l => l.code === savedLanguage)
              : undefined;

            // Prefer saved language if still active, otherwise pick first or default
            const defaultLang = (data.languages as (Language & { isDefault?: boolean })[])
              .find(l => (l as any).isDefault) as Language | undefined;

            setCurrentLanguage(
              fromSaved || defaultLang || activeLanguages[0]
            );
          }
        }
      } catch (e) {
        // swallow; keep fallback
      }
    };

    init();
  }, []);

  // Save language to localStorage when changed
  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    if (isClient) {
      localStorage.setItem("selectedLanguage", language.code);
    }
  };

  // Translation function
  const t = (key: string): string => {
    const translation = translations[currentLanguage.code]?.[key];
    return translation || key; // Fallback to key if translation not found
  };

  return (
    <TranslationContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        languages: languagesState,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}
