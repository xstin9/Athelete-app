import React, { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";

function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme === "dark" ? "dark" : "light";
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {}
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => {
      if (!localStorage.getItem("theme")) {
        setTheme(media.matches ? "dark" : "light");
      }
    };
    syncTheme();
    media.addEventListener?.("change", syncTheme);
    return () => media.removeEventListener?.("change", syncTheme);
  }, []);

  return (
    <button
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      className="flex items-center justify-center rounded-md border border-slate-300 bg-white/80 p-2 text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-white/10"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? <FaSun className="text-yellow-300" /> : <FaMoon />}
    </button>
  );
}

export default ThemeToggle;
