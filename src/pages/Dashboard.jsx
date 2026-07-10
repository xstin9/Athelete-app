import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Brand from "../components/Brand";
import GeminiChatBox from "../dashboard/GeminiChatBox";
import PerformanceChart from "../components/PerformanceChart";
import ThemeToggle from "../components/ThemeToggle";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { playSound } from "../utils/soundEffects";
import { motion, AnimatePresence } from "framer-motion";
import { FaTrophy, FaBullseye, FaPlus, FaTimes } from "react-icons/fa";

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

function PBCard({ ev, value, goal, justPB }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: justPB ? "linear-gradient(135deg, rgba(234,88,12,0.18), rgba(249,115,22,0.08))" : "#111827",
        border: justPB ? "1.5px solid #ea580c" : "1px solid #1f2937",
        borderRadius: 16, padding: "20px 24px", position: "relative", overflow: "hidden",
      }}>
      {justPB && (
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          style={{ position: "absolute", top: 10, right: 12, background: "#ea580c", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 8px" }}>
          NEW PB 🏆
        </motion.div>
      )}
      <div style={{ fontSize: 22, marginBottom: 6 }}>{ev.icon}</div>
      <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{ev.label}</div>
      <div style={{ color: "#fff", fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>
        {value != null ? `${value.toFixed(2)}${ev.type === "time" ? "s" : "m"}` : <span style={{ color: "#374151" }}>—</span>}
      </div>
      <div style={{ color: "#4b5563", fontSize: 11, marginTop: 6 }}>
        Goal: <span style={{ color: "#f97316" }}>{goal || "—"}</span>
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
  const [sessions, setSessions] = useState([]);
  const [date, setDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState("100m");
  const [newTime, setNewTime] = useState("");
  const [newPain, setNewPain] = useState(1);
  const [personalBests, setPersonalBests] = useState({});
  const [streak] = useState(0);
  const [justPBEvent, setJustPBEvent] = useState(null);
  const [athleteType, setAthleteType] = useState(() => {
    const saved = localStorage.getItem("athleteType");
    return saved ? JSON.parse(saved) : null;
  });
  const [showAthleteTypeModal, setShowAthleteTypeModal] = useState(false);
  const [chartEvent, setChartEvent] = useState("100m");

  useEffect(() => { if (!athleteType) setShowAthleteTypeModal(true); }, [athleteType]);
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("sessions"));
    if (saved) setSessions(saved);
    const savedPBs = JSON.parse(localStorage.getItem("personalBests"));
    if (savedPBs) setPersonalBests(savedPBs);
  }, []);
  useEffect(() => { localStorage.setItem("sessions", JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem("personalBests", JSON.stringify(personalBests)); }, [personalBests]);

  const availableEvents = athleteType === "jumper"
    ? EVENTS.filter((ev) => ev.type === "distance")
    : EVENTS.filter((ev) => ev.type === "time");

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
    <div style={{ minHeight: "100vh", background: "#030712", paddingBottom: 60, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ATHLETE TYPE MODAL */}
      <AnimatePresence>
        {showAthleteTypeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              style={{ background: "#0d1117", border: "1px solid #1f2937", borderRadius: 20, padding: 40, maxWidth: 360, width: "90%" }}>
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
      <div style={{ borderBottom: "1px solid #0f172a", background: "#030712", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40 }}>
        <Brand />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "#374151", fontSize: 13 }}>Dashboard</span>
          <ThemeToggle />
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* TOP ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div style={{ background: "#0d1117", border: "1px solid #1f2937", borderRadius: 20, padding: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <StreakBadge count={streak} />
          </div>
          <div style={{ background: "#0d1117", border: "1px solid #1f2937", borderRadius: 20, padding: 28 }}>
            <div style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Injury Risk</div>
            <RiskScore sessions={sessions} type="injury" />
            <div style={{ color: "#374151", fontSize: 11, marginTop: 8 }}>Based on last 7 sessions</div>
          </div>
          <div style={{ background: "#0d1117", border: "1px solid #1f2937", borderRadius: 20, padding: 28 }}>
            <div style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Session Quality</div>
            <RiskScore sessions={sessions} type="session" />
            <div style={{ color: "#374151", fontSize: 11, marginTop: 8 }}>Based on last 7 sessions</div>
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
              <PBCard key={ev.id} ev={ev} value={personalBests[ev.id]} goal={personalBests[ev.id + "_goal"]} justPB={justPBEvent === ev.id} />
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
                <div style={{ background: "#0d1117", border: "1px solid #1f2937", borderRadius: 20, padding: 28, marginTop: 12 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: "#fff" }}>New Session</h3>
                  <form onSubmit={handleAddSession} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Event</label>
                      <select value={newEvent} onChange={(e) => setNewEvent(e.target.value)}
                        style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, cursor: "pointer" }}>
                        {availableEvents.map((ev) => <option key={ev.id} value={ev.id}>{ev.label}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Time / Distance</label>
                      <input value={newTime} onChange={(e) => setNewTime(e.target.value)} placeholder="e.g. 10.85"
                        style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, width: 140, outline: "none" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pain (1–5)</label>
                      <input type="number" min={1} max={5} value={newPain} onChange={(e) => setNewPain(e.target.value)}
                        style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, width: 80, outline: "none" }} />
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

        {/* CALENDAR + GOALS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div style={{ background: "#0d1117", border: "1px solid #1f2937", borderRadius: 20, padding: 24 }}>
            <div style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Training Calendar</div>
            <Calendar value={date} onChange={setDate} className="sac-calendar" />
          </div>
          <div style={{ background: "#0d1117", border: "1px solid #1f2937", borderRadius: 20, padding: 24 }}>
            <div style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              <FaBullseye style={{ color: "#f97316" }} /> Goals
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {availableEvents.map(ev => (
                <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#f97316", fontWeight: 700, fontSize: 13, width: 60 }}>{ev.label}</span>
                  <input placeholder={`Target ${ev.type === "time" ? "time (s)" : "distance (m)"}`}
                    value={personalBests[ev.id + "_goal"] || ""}
                    onChange={e => setPersonalBests(pb => ({ ...pb, [ev.id + "_goal"]: e.target.value }))}
                    style={{ flex: 1, background: "#111827", border: "1px solid #1f2937", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PERFORMANCE CHART */}
        <div style={{ background: "#0d1117", border: "1px solid #1f2937", borderRadius: 20, padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Performance Trend</div>
            <div style={{ display: "flex", gap: 8 }}>
              {availableEvents.map(ev => (
                <button key={ev.id} onClick={() => setChartEvent(ev.id)}
                  style={{ background: chartEvent === ev.id ? "#ea580c" : "#111827", border: "1px solid " + (chartEvent === ev.id ? "#ea580c" : "#1f2937"), borderRadius: 8, padding: "4px 12px", color: "#fff", fontSize: 12, cursor: "pointer" }}>
                  {ev.label}
                </button>
              ))}
            </div>
          </div>
          <PerformanceChart sessions={sessions.filter(s => s.eventId === chartEvent).map(s => ({ date: s.date, value: s.time }))} />
        </div>

        {/* AI COACH */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <GeminiChatBox sessions={sessions} />
        </div>

      </div>

      <style>{`
        .sac-calendar { background: transparent !important; border: none !important; color: #fff !important; width: 100% !important; }
        .sac-calendar .react-calendar__tile { background: transparent !important; color: #9ca3af !important; border-radius: 8px !important; }
        .sac-calendar .react-calendar__tile:hover { background: #1f2937 !important; color: #fff !important; }
        .sac-calendar .react-calendar__tile--active { background: #ea580c !important; color: #fff !important; }
        .sac-calendar .react-calendar__tile--now { border: 1px solid #ea580c !important; color: #f97316 !important; }
        .sac-calendar .react-calendar__navigation button { background: transparent !important; color: #fff !important; }
        .sac-calendar .react-calendar__month-view__weekdays { color: #4b5563 !important; font-size: 11px !important; }
      `}</style>
    </div>
  );
}