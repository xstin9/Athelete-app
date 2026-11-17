export function getTheme() {
  try {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
  } catch {
    // Fall back to the system preference when storage is unavailable.
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme, persist = true) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;

  if (persist) {
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // The active theme still applies for this session.
    }
  }

  window.dispatchEvent(new Event("ascendex:theme-change"));
}

export function initializeTheme() {
  applyTheme(getTheme(), false);

  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!media) return;

  const syncSystemTheme = (event) => {
    try {
      if (localStorage.getItem("theme")) return;
    } catch {
      // Keep following the system preference when storage is unavailable.
    }
    applyTheme(event.matches ? "dark" : "light", false);
  };

  media.addEventListener?.("change", syncSystemTheme);
}