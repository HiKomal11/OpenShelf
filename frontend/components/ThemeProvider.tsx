
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ThemePreference = "light" | "dark" | "system";

type ThemeContextType = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
};

const STORAGE_KEY = "openshelf_theme";

const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  root.dataset.theme = theme;

  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  const resolvedTheme =
    theme === "system"
      ? systemPrefersDark
        ? "dark"
        : "light"
      : theme;

  root.dataset.colorMode = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setThemeState] =
    useState<ThemePreference>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
  let cancelled = false;

  void Promise.resolve().then(() => {
    if (cancelled) return;

    let initialTheme: ThemePreference = "system";

    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (
        saved === "light" ||
        saved === "dark" ||
        saved === "system"
      ) {
        initialTheme = saved;
      }
    } catch {
      // Keep the system preference if storage is unavailable.
    }

    setThemeState(initialTheme);
    applyTheme(initialTheme);
    setReady(true);
  });

  return () => {
    cancelled = true;
  };
}, []);
  useEffect(() => {
    if (!ready) return;

    applyTheme(theme);

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Theme changes still work for the current session.
    }

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleSystemThemeChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleSystemThemeChange
      );
    };
  }, [theme, ready]);

  const setTheme = useCallback((nextTheme: ThemePreference) => {
    setThemeState(nextTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useThemePreference must be used inside ThemeProvider"
    );
  }

  return context;
}