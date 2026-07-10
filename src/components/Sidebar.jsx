import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useState, useEffect } from "react";
import Brand from "./Brand";

function Sidebar({ open, setOpen }) {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  function logout() {
    signOut(auth);
    navigate("/");
  }

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.style.colorScheme = isDark ? "dark" : "light";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const root = document.documentElement;
    setIsDark(root.classList.contains("dark"));
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => {
      if (!localStorage.getItem("theme")) setIsDark(event.matches);
    };
    media.addEventListener?.("change", handleChange);
    return () => media.removeEventListener?.("change", handleChange);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  function toggleDark() {
    setIsDark((value) => !value);
  }

  return (
    open && (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={() => setOpen(false)} />
        <div className="fixed top-0 right-0 w-64 h-full bg-white dark:bg-slate-900 p-6 shadow-lg z-50 text-slate-900 dark:text-slate-100">
          <button aria-label="Close" onClick={() => setOpen(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">✖</button>

          <div className="mt-6 space-y-4">
            <div className="mb-3"><Brand /></div>

            <div className="rounded border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="mb-2 text-sm text-slate-600 dark:text-slate-300">Athlete Type</div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                  onClick={() => { localStorage.setItem('athleteType', JSON.stringify('sprint')); window.dispatchEvent(new Event('athleteTypeChanged')); alert('Set to Sprinter'); }}
                >Sprinter</button>

                <button
                  className="px-3 py-1 bg-purple-600 text-white rounded"
                  onClick={() => { localStorage.setItem('athleteType', JSON.stringify('jumper')); window.dispatchEvent(new Event('athleteTypeChanged')); alert('Set to Jumper'); }}
                >Jumper</button>
              </div>
            </div>

            <button onClick={() => navigate("/dashboard")} className="w-full rounded-md px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800">Athlete Dashboard</button>
            <button onClick={() => navigate("/coach")} className="w-full rounded-md px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800">Coach Dashboard</button>
            <button onClick={toggleDark} className="w-full rounded-md px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800">{isDark ? "Switch to Light" : "Switch to Dark"}</button>
            <button onClick={logout} className="w-full rounded-md px-3 py-2 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40">
              
              Log out
            </button>
          </div>
        </div>
      </>
    )
  );
}

export default Sidebar;
