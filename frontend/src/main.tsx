import { StrictMode, useEffect, useState } from "react";
import { useTranslation, I18nextProvider, initReactI18next } from "react-i18next";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase, useAuthStore } from "./stores/authStore";
import "./index.css";
import { App } from "./App";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import es from "./i18n/locales/es.json";
import en from "./i18n/locales/en.json";

void i18n.use(LanguageDetector).use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  fallbackLng: "es",
  debug: false,
  detection: {
    order: ["localStorage", "navigator", "htmlTag"],
    lookupLocalStorage: "i18nextLng",
    caches: ["localStorage"],
  },
  interpolation: { escapeValue: false },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Root() {
  const [ready, setReady] = useState(false);
  const { t } = useTranslation();
  const { setToken, fetchProfile } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        setToken(session.access_token);
        fetchProfile();
      }
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setToken(session.access_token);
        fetchProfile();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#EBF0F6] dark:bg-[#080616]">
        <div className="neo-card p-8 flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <span className="font-semibold text-sm">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </I18nextProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Root />
    </QueryClientProvider>
  </StrictMode>,
);
