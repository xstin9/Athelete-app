import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Brand from "../components/Brand";
import ConsistencyLoop from "../components/ConsistencyLoop";
import PerformanceChart from "../components/PerformanceChart";
import ThemeToggle from "../components/ThemeToggle";
import GeminiChatBox from "../dashboard/GeminiChatBox";
import { playSound } from "../utils/soundEffects";
import { motion, AnimatePresence } from "framer-motion";
import { FaTrophy, FaBullseye, FaPlus, FaTimes, FaArrowLeft, FaCheck, FaSpinner } from "react-icons/fa";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const EVENTS = [
  { id: "100m", label: "100m", type: "time", icon: "⚡" },
  { id: "200m", label: "200m", type: "time", icon: "🏃" },
  { id: "300m", label: "300m", type: "time", icon: "💨" },
  { id: "400m", label: "400m", type: "time", icon: "🔥" },
  { id: "longJump", label: "Long Jump", type: "distance", icon: "🦘" },
  { id: "highJump", label: "High Jump", type: "distance", icon: "🎯" },
];

function StreakBadge({ count }) {
  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: 80, height: 80, borderRadius: "50%",
          background: count > 0 ? "radial-gradient(circle, #f97316 0%, #ea580c 60%, #c2410c 100%)" : "radial-gradient(circle, #374151 0%, #1f2937 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: count > 0 ? "0 0 30px rgba(249,115,22,0.5)" : "none", fontSize: 28,
        }}>🔥</motion.div>
      <div style={{ color: "#f97316", fontWeight: 800, fontSize: 22 }}>{count}</div>
      <div style={{ color: "#6b7280", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>Day Streak</div>
    </motion.div>
  );
}

function PBCard({ ev, value, goal, justPB, isDark }) {
  const hasValue = value != null && value !== "";
  const hasGoal = goal != null && String(goal).trim() !== "";
  const displayValue = hasValue
    ? `${value.toFixed(2)}${ev.type === "time" ? "s" : "m"}`
    : `No ${ev.type === "time" ? "time" : "distance"} logged yet`;
  const cardBg = justPB
    ? "linear-gradient(135deg, rgba(234,88,12,0.18), rgba(249,115,22,0.08))"
    : isDark ? "#111827" : "#ffffff";
  const cardBorder = justPB ? "1.5px solid #ea580c" : isDark ? "1px solid #1f2937" : "1px solid #e2e8f0";
  const cardText = isDark ? "#fff" : "#111827";
  const mutedText = isDark ? "#6b7280" : "#64748b";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: cardBg,
        border: cardBorder,
        borderRadius: 16, padding: "20px 24px", position: "relative", overflow: "hidden",
      }}>
      {justPB && (
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          style={{ position: "absolute", top: 10, right: 12, background: "#ea580c", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 8px" }}>
          NEW PB 🏆
        </motion.div>
      )}
      <div style={{ fontSize: 22, marginBottom: 6 }}>{ev.icon}</div>
      <div style={{ color: mutedText, fontSize: 12, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{ev.label}</div>
      <div style={{ color: cardText, fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", minHeight: 46 }}>
        {hasValue ? (
          <span>{displayValue}</span>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span>{displayValue}</span>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 28 }}>
              {[18, 22, 16, 11].map((height, index) => (
                <div key={index} style={{ height, width: 8, borderRadius: 999, background: index === 2 ? "rgba(249,115,22,0.65)" : "rgba(255,255,255,0.12)" }} />
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ color: mutedText, fontSize: 11, marginTop: 6 }}>
        Goal: <span style={{ color: "#f97316", fontStyle: hasGoal ? "normal" : "italic", opacity: hasGoal ? 1 : 0.75 }}>{hasGoal ? goal : "Not set"}</span>
      </div>
    </motion.div>
  );
}

function RiskScore({ sessions, type }) {
  if (!sessions || sessions.length === 0) return <div style={{ color: "#4b5563", fontSize: 13 }}>No data yet.</div>;
  if (type === "injury") {
    const last = sessions.slice(0, 7);
    const avgPain = last.reduce((sum, s) => sum + (s.pain || 1), 0) / last.length;
    let risk = "Low"; let color = "#22c55e";
    if (avgPain >= 4) { risk = "High"; color = "#ef4444"; }
    else if (avgPain >= 2.5) { risk = "Medium"; color = "#f59e0b"; }
    return <div style={{ color, fontSize: 20, fontWeight: 800 }}>{risk}</div>;
  }
  if (type === "session") {
    const last = sessions.slice(0, 7);
    const goodSessions = last.filter((s) => (s.pain || 1) <= 2).length;
    let score = Math.round((goodSessions / 7) * 100);
    let label = "Poor"; let color = "#ef4444";
    if (score >= 70) { label = "Great"; color = "#22c55e"; }
    else if (score >= 40) { label = "Okay"; color = "#f59e0b"; }
    return <div style={{ color, fontSize: 20, fontWeight: 800 }}>{label} <span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}>({score}%)</span></div>;
  }
  return null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [date, setDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState("100m");
  const [newTime, setNewTime] = useState("");
  const [newPain, setNewPain] = useState(1);
  const [personalBests, setPersonalBests] = useState({});
  const [streak] = useState(0);
  const [justPBEvent, setJustPBEvent] = useState(null);
  const [goalInputs, setGoalInputs] = useState({});
  const [isSavingGoals, setIsSavingGoals] = useState(false);
  const [goalsStatus, setGoalsStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [athleteType, setAthleteType] = useState(() => {
    const saved = localStorage.getItem("athleteType");
    return saved ? JSON.parse(saved) : null;
  });
  const [showAthleteTypeModal, setShowAthleteTypeModal] = useState(false);
  const [chartEvent, setChartEvent] = useState("100m");
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.style.colorScheme = isDark ? "dark" : "light";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.classList.contains("dark"));
    syncTheme();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => {
      if (!localStorage.getItem("theme")) setIsDark(event.matches);
    };
    media.addEventListener?.("change", handleChange);
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => {
      media.removeEventListener?.("change", handleChange);
      observer.disconnect();
    };
  }, []);

  useEffect(() => { if (!athleteType) setShowAthleteTypeModal(true); }, [athleteType]);
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("sessions"));
    if (saved) setSessions(saved);
    const savedPBs = JSON.parse(localStorage.getItem("personalBests"));
    if (savedPBs) setPersonalBests(savedPBs);
  }, []);
  useEffect(() => { localStorage.setItem("sessions", JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem("personalBests", JSON.stringify(personalBests)); }, [personalBests]);

  useEffect(() => {
    let unsubscribeGoals = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (unsubscribeGoals) {
        unsubscribeGoals();
        unsubscribeGoals = null;
      }

      if (!user) {
        setGoalInputs({});
        setGoalsStatus({ type: "info", message: "Sign in to sync goals online." });
        return;
      }

      const goalsRef = doc(db, "users", user.uid, "goals", "profile");
      unsubscribeGoals = onSnapshot(goalsRef, (snapshot) => {
        if (snapshot.exists()) {
          setGoalInputs(snapshot.data());
        } else {
          setGoalInputs({});
        }
      });
    });

    return () => {
      if (unsubscribeGoals) unsubscribeGoals();
      unsubscribeAuth();
    };
  }, []);

  const availableEvents = athleteType === "jumper"
    ? EVENTS.filter((ev) => ev.type === "distance")
    : EVENTS.filter((ev) => ev.type === "time");

  const palette = isDark ? {
    background: "#030712",
    surface: "#0d1117",
    surfaceAlt: "#111827",
    border: "#1f2937",
    text: "#ffffff",
    muted: "#6b7280",
    mutedStrong: "#9ca3af",
    panelGlow: "rgba(0,0,0,0.2)",
    inputBg: "#111827",
    inputBorder: "#1f2937",
  } : {
    background: "#f8fafc",
    surface: "#ffffff",
    surfaceAlt: "#f8fafc",
    border: "#e2e8f0",
    text: "#111827",
    muted: "#64748b",
    mutedStrong: "#475569",
    panelGlow: "rgba(15,23,42,0.06)",
    inputBg: "#ffffff",
    inputBorder: "#cbd5e1",
  };

  async function handleSaveGoals() {
    if (!currentUser) {
      setGoalsStatus({ type: "error", message: "Sign in to sync goals online." });
      return;
    }

    const normalizedGoals = {};
    availableEvents.forEach((ev) => {
      normalizedGoals[`${ev.id}_goal`] = String(goalInputs[`${ev.id}_goal`] || "").trim();
    });

    setIsSavingGoals(true);
    setGoalsStatus(null);

    try {
      await setDoc(doc(db, "users", currentUser.uid, "goals", "profile"), normalizedGoals, { merge: true });
      setGoalsStatus({ type: "success", message: "Saved to your account" });
    } catch (error) {
      setGoalsStatus({ type: "error", message: error.message || "Could not save goals" });
    } finally {
      setIsSavingGoals(false);
      window.setTimeout(() => setGoalsStatus(null), 2200);
    }
  }

  function handleAddSession(e) {
    e.preventDefault();
    const metricNum = parseFloat(newTime);
    const evDef = EVENTS.find((ev) => ev.id === newEvent) || EVENTS[0];
    const session = { date: new Date(date).toLocaleDateString(), eventId: evDef.id, event: evDef.label, time: newTime, metricType: evDef.type, pain: Number(newPain) };
    setSessions((prev) => [session, ...prev]);
    playSound.click?.();
    if (!isNaN(metricNum)) {
      const currentPB = personalBests[evDef.id];
      const isPB = evDef.type === "time" ? currentPB == null || metricNum < currentPB : currentPB == null || metricNum > currentPB;
      if (isPB) {
        setPersonalBests((prev) => ({ ...prev, [evDef.id]: metricNum }));
        setJustPBEvent(evDef.id);
        playSound.achievement?.();
        setTimeout(() => setJustPBEvent(null), 4000);
      }
    }
    setNewTime(""); setNewPain(1); setShowForm(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: palette.background, paddingBottom: 60, color: palette.text, fontFamily: "'DM Sans', sans-serif" }}>

      {/* ATHLETE TYPE MODAL */}
      <AnimatePresence>
        {showAthleteTypeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 20, padding: 40, maxWidth: 360, width: "90%" }}>
              <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>🏃</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: "center", marginBottom: 8, color: "#fff" }}>What type of athlete are you?</h2>
              <p style={{ color: "#6b7280", textAlign: "center", fontSize: 13, marginBottom: 28 }}>This helps us show the right events for you</p>
              <div style={{ display: "flex", gap: 12 }}>
                {[["sprinter", "⚡ Sprinter", "#ea580c"], ["jumper", "🦘 Jumper", "#7c3aed"]].map(([type, label, color]) => (
                  <button key={type} onClick={() => { setAthleteType(type); localStorage.setItem("athleteType", JSON.stringify(type)); setShowAthleteTypeModal(false); }}
                    style={{ flex: 1, background: color, border: "none", borderRadius: 12, padding: "14px 0", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="sticky top-0 z-40 border-b border-slate-900/80 bg-slate-950/80 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Brand />
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              <FaArrowLeft size={12} />
              Back
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* TOP ROW */}
        <div className="mb-6 grid items-start gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="self-start rounded-3xl border p-6 shadow-2xl sm:p-8" style={{ background: palette.surface, borderColor: palette.border, boxShadow: `0 18px 50px ${palette.panelGlow}` }}>
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xs">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: palette.muted }}>Consistency</div>
                <h2 className="text-xl font-semibold" style={{ color: palette.text }}>Keep the streak alive</h2>
                <p className="mt-2 text-sm" style={{ color: palette.muted }}>Small, repeatable sessions build the momentum behind every PB.</p>
              </div>
              <div className="rounded-2xl border p-5" style={{ background: palette.surfaceAlt, borderColor: palette.border }}>
                <ConsistencyLoop current={Math.max(0, Math.min(24, sessions.length))} target={24} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border p-5 sm:p-6" style={{ background: palette.surface, borderColor: palette.border }}>
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: palette.muted }}>Training Calendar</div>
              <Calendar value={date} onChange={setDate} className="ascendex-calendar" />
            </div>
            <div className="rounded-2xl border p-5 sm:p-6" style={{ background: palette.surface, borderColor: palette.border }}>
              <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: palette.muted }}>
                <FaBullseye className="text-orange-500" /> Goals
              </div>
              <div className="flex flex-col gap-3">
                {availableEvents.map(ev => (
                  <div key={ev.id} className="flex items-center gap-3">
                    <span className="w-16 text-sm font-semibold text-orange-500">{ev.label}</span>
                    <input placeholder={`Target ${ev.type === "time" ? "time (s)" : "distance (m)"}`}
                      value={goalInputs[`${ev.id}_goal`] || ""}
                      onChange={e => setGoalInputs((prev) => ({ ...prev, [`${ev.id}_goal`]: e.target.value }))}
                      className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none ring-0" style={{ background: palette.inputBg, borderColor: palette.inputBorder, color: palette.text }} />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-slate-500 dark:text-slate-400">Goals sync online to your account for cross-device access.</div>
                <button
                  type="button"
                  onClick={handleSaveGoals}
                  disabled={isSavingGoals}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingGoals ? <><FaSpinner className="animate-spin" /> Saving...</> : <><FaCheck /> Save Goals</>}
                </button>
              </div>
              {goalsStatus && (
                <div className={`mt-2 text-sm ${goalsStatus.type === "success" ? "text-emerald-500" : goalsStatus.type === "error" ? "text-red-500" : "text-slate-500 dark:text-slate-400"}`}>
                  {goalsStatus.message}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PB CARDS */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Personal Bests</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#f97316", fontSize: 12 }}>
              <FaTrophy size={11} /> <span>Your records</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {availableEvents.map((ev) => (
              <PBCard key={ev.id} ev={ev} value={personalBests[ev.id]} goal={goalInputs[`${ev.id}_goal`] || personalBests[`${ev.id}_goal`]} justPB={justPBEvent === ev.id} isDark={isDark} />
            ))}
          </div>
        </div>

        {/* LOG SESSION */}
        <div style={{ marginBottom: 24 }}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowForm(s => !s)}
            style={{
              background: showForm ? "#1f2937" : "linear-gradient(135deg, #ea580c, #f97316)",
              border: "none", borderRadius: 14, padding: "14px 28px", color: "#fff", fontWeight: 700,
              fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              boxShadow: showForm ? "none" : "0 0 24px rgba(234,88,12,0.3)",
            }}>
            {showForm ? <><FaTimes /> Cancel</> : <><FaPlus /> Log Session</>}
          </motion.button>
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 20, padding: 28, marginTop: 12 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: "#fff" }}>New Session</h3>
                  <form onSubmit={handleAddSession} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Event</label>
                      <select value={newEvent} onChange={(e) => setNewEvent(e.target.value)}
                        style={{ background: palette.inputBg, border: `1px solid ${palette.inputBorder}`, borderRadius: 10, padding: "10px 14px", color: palette.text, fontSize: 14, cursor: "pointer" }}>
                        {availableEvents.map((ev) => <option key={ev.id} value={ev.id}>{ev.label}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Time / Distance</label>
                      <input value={newTime} onChange={(e) => setNewTime(e.target.value)} placeholder="e.g. 10.85"
                        style={{ background: palette.inputBg, border: `1px solid ${palette.inputBorder}`, borderRadius: 10, padding: "10px 14px", color: palette.text, fontSize: 14, width: 140, outline: "none" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pain (1–5)</label>
                      <input type="number" min={1} max={5} value={newPain} onChange={(e) => setNewPain(e.target.value)}
                        style={{ background: palette.inputBg, border: `1px solid ${palette.inputBorder}`, borderRadius: 10, padding: "10px 14px", color: palette.text, fontSize: 14, width: 80, outline: "none" }} />
                    </div>
                    <button type="submit"
                      style={{ background: "linear-gradient(135deg, #ea580c, #f97316)", border: "none", borderRadius: 10, padding: "10px 24px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                      Save Session
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PERFORMANCE CHART */}
        <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 20, padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ color: palette.text, fontWeight: 700, fontSize: 15 }}>Performance Trend</div>
            <div style={{ display: "flex", gap: 8 }}>
              {availableEvents.map(ev => (
                <button key={ev.id} onClick={() => setChartEvent(ev.id)}
                  style={{ background: chartEvent === ev.id ? "#ea580c" : palette.surfaceAlt, border: "1px solid " + (chartEvent === ev.id ? "#ea580c" : palette.border), borderRadius: 8, padding: "4px 12px", color: chartEvent === ev.id ? "#fff" : palette.text, fontSize: 12, cursor: "pointer" }}>
                  {ev.label}
                </button>
              ))}
            </div>
          </div>
          <PerformanceChart sessions={sessions.filter(s => s.eventId === chartEvent).map(s => ({ date: s.date, value: s.time }))} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <GeminiChatBox sessions={sessions} />
        </div>

      </div>

      <style>{`
        .ascendex-calendar { background: transparent !important; border: none !important; color: ${palette.text} !important; width: 100% !important; }
        .ascendex-calendar .react-calendar__tile { background: transparent !important; color: ${palette.muted} !important; border-radius: 8px !important; }
        .ascendex-calendar .react-calendar__tile:hover { background: ${palette.surfaceAlt} !important; color: ${palette.text} !important; }
        .ascendex-calendar .react-calendar__tile--active { background: #ea580c !important; color: #fff !important; }
        .ascendex-calendar .react-calendar__tile--now { border: 1px solid #ea580c !important; color: #f97316 !important; }
        .ascendex-calendar .react-calendar__navigation button { background: transparent !important; color: ${palette.text} !important; }
        .ascendex-calendar .react-calendar__month-view__weekdays { color: ${palette.muted} !important; font-size: 11px !important; }
      `}</style>
    </div>
  );
}