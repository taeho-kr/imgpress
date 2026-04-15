import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { type Locale, type Messages, messages, detectLocale, LOCALES } from './messages';

interface I18nContext {
  locale: Locale;
  t: Messages;
  setLocale: (locale: Locale) => void;
}

const Ctx = createContext<I18nContext>(null!);

// Module-level snapshot for use outside React (e.g., event-driven toasts
// fired from hooks that can't consume context during callbacks).
let currentMessages: Messages = messages[detectLocale()];

export function getI18nMessages(): Messages {
  return currentMessages;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('imgpress-locale') as Locale | null;
    return saved && messages[saved] ? saved : detectLocale();
  });

  // Keep the module-level snapshot in sync with React state.
  currentMessages = messages[locale];

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('imgpress-locale', l);
    document.documentElement.lang = l;
  }, []);

  return (
    <Ctx.Provider value={{ locale, t: messages[locale], setLocale }}>
      {children}
    </Ctx.Provider>
  );
}

export function useI18n() {
  return useContext(Ctx);
}

export { LOCALES };
export type { Locale };
