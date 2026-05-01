import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useState, useEffect } from "react";
import Brand from "./Brand";

function Sidebar({ open, setOpen }) {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

 function logout() {
  signOut(auth);
  navigate("/");
}

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  function toggleDark() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("darkMode", next ? "true" : "false");
    setIsDark(next);
  }

  return (
    open && (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={() => setOpen(false)} />
        <div className="fixed top-0 right-0 w-64 h-full bg-white dark:bg-gray-900 p-6 shadow-lg z-50">
          <button aria-label="Close" onClick={() => setOpen(false)}>✖</button>

          <div className="mt-6 space-y-4">
            <div className="mb-3"><Brand /></div>

            <div className="border p-3 rounded">
              <div className="text-sm text-gray-600 mb-2">Athlete Type</div>
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

            <button onClick={() => navigate("/dashboard")}>Athlete Dashboard</button>
            <button onClick={() => navigate("/coach")}>Coach Dashboard</button>
            <button onClick={toggleDark}>{isDark ? "Switch to Light" : "Switch to Dark"}</button>
            <button onClick={logout} className="text-red-500">
              
              Log out
            </button>
          </div>
        </div>
      </>
    )
  );
}

export default Sidebar;
