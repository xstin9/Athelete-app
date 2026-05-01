import React, { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";

function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    // Default to dark for this app; clicking will switch to white (light)
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {}
  }, [theme]);

  return (
    <button
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      className="p-2 rounded-md border border-white/10 text-gray-200 hover:bg-white/5 transition flex items-center justify-center"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? <FaSun className="text-yellow-300" /> : <FaMoon />}
    </button>
  );
}

export default ThemeToggle;
