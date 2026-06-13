"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const CLASSICAL_LOCALES = new Set([
  "vi", "zh", "ko", "ja", "th", "km", "lo", "my", "mn",
]);

const STORAGE_KEY = "gpv-theme";

const detectAutoTheme = () => {
  if (typeof navigator === "undefined") return "classical";
  const lang = (navigator.language || "vi").split("-")[0].toLowerCase();
  return CLASSICAL_LOCALES.has(lang) ? "classical" : "modern";
};

const applyTheme = (themeName) => {
  if (themeName === "modern") {
    document.documentElement.setAttribute("data-theme", "modern");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
};

const ThemeContext = createContext({
  name: "classical",
  isClassical: true,
  setTheme: () => {},
  toggleTheme: () => {},
  isManual: false,
  resetToAuto: () => {},
});

export function ThemeProvider({ children }) {
  const [name, setName] = useState("classical");
  const [isManual, setIsManual] = useState(false);

  useEffect(() => {
    const saved = typeof localStorage !== "undefined"
      ? localStorage.getItem(STORAGE_KEY)
      : null;

    if (saved === "classical" || saved === "modern") {
      setName(saved);
      setIsManual(true);
      applyTheme(saved);
    } else {
      const auto = detectAutoTheme();
      setName(auto);
      setIsManual(false);
      applyTheme(auto);
    }
  }, []);

  const setTheme = useCallback((themeName) => {
    setName(themeName);
    setIsManual(true);
    applyTheme(themeName);
    localStorage.setItem(STORAGE_KEY, themeName);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(name === "classical" ? "modern" : "classical");
  }, [name, setTheme]);

  const resetToAuto = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    const auto = detectAutoTheme();
    setName(auto);
    setIsManual(false);
    applyTheme(auto);
  }, []);

  return (
    <ThemeContext.Provider value={{ name, isClassical: name === "classical", setTheme, toggleTheme, isManual, resetToAuto }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
