import React, { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";
import { applyTheme, getTheme } from "../theme";

function ThemeToggle() {
  const [theme, setTheme] = useState(getTheme);

  useEffect(() => {
    const syncTheme = () => setTheme(document.documentElement.dataset.theme || getTheme());
    window.addEventListener("ascendex:theme-change", syncTheme);
    return () => window.removeEventListener("ascendex:theme-change", syncTheme);
  }, []);

  return (
    <button
      type="button"
      onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
      className="theme-toggle"
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? <FaSun aria-hidden="true" /> : <FaMoon aria-hidden="true" />}
    </button>
  );
}

export default ThemeToggle;
