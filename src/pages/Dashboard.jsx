import { useState, useEffect, useMemo } from "react";
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
import { predictRaceTime } from "../utils/predictRaceTime";

const EVENTS = [
  { id: "100m", label: "100m", type: "time", icon: "⚡" },
  { id: "200m", label: "200m", type: "time", icon: "🏃" },
  { id: "300m", label: "300m", type: "time", icon: "💨" },
  { id: "400m", label: "400m", type: "time", icon: "🔥" },
  { id: "longJump", label: "Long Jump", type: "distance", icon: "🦘" },
  { id: "highJump", label: "High Jump", type: "distance", icon: "🎯" },
];
const RACE_EVENTS = EVENTS.filter((event) => event.type === "time");
const RACE_STAGES = ["base", "build", "peak", "taper", "off-season"];
const EMPTY_RACE_PLAN = { raceDate: "", event: "100m", stage: "base", goalTime: "" };

function getWeeksToRace(raceDate) {
  if (!raceDate) return null;
  const raceDay = new Date(`${raceDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilRace = Math.ceil((raceDay - today) / 86400000);
  return daysUntilRace > 0 ? Math.ceil(daysUntilRace / 7) : null;
}

function StreakBadge({ count }) {
  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: 80, height: 80, borderRadius: "50%",
          background: count > 0 ? "radial-gradient(circle, var(--accent) 0%, var(--accent-hover) 100%)" : "radial-gradient(circle, var(--color-muted-strong) 0%, var(--color-border) 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: count > 0 ? "0 0 30px rgba(249,115,22,0.5)" : "none", fontSize: 28,
        }}>🔥</motion.div>
      <div style={{ color: "var(--accent)", fontWeight: 800, fontSize: 22 }}>{count}</div>
      <div style={{ color: "var(--color-muted)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>Day Streak</div>
    </motion.div>
  );
}

function PBCard({ ev, value, goal, justPB }) {
  const hasValue = value != null && value !== "";
  const hasGoal = goal != null && String(goal).trim() !== "";
  const displayValue = hasValue
    ? `${value.toFixed(2)}${ev.type === "time" ? "s" : "m"}`
    : `No ${ev.type === "time" ? "time" : "distance"} logged yet`;
  const cardBg = justPB
    ? "linear-gradient(135deg, rgba(234,88,12,0.18), rgba(249,115,22,0.08))"
    : "var(--color-card)";
  const cardBorder = justPB ? "1.5px solid var(--accent)" : "1px solid var(--color-border)";
  const cardText = "var(--color-text)";
  const mutedText = "var(--color-muted)";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: cardBg,
        border: cardBorder,
        borderRadius: 16, padding: "20px 24px", position: "relative", overflow: "hidden",
      }}>
      {justPB && (
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          style={{ position: "absolute", top: 10, right: 12, background: "var(--accent)", color: "var(--accent-foreground)", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 8px" }}>
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
        Goal: <span style={{ color: "var(--accent)", fontStyle: hasGoal ? "normal" : "italic", opacity: hasGoal ? 1 : 0.75 }}>{hasGoal ? goal : "Not set"}</span>
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
    return <div style={{ color, fontSize: 20, fontWeight: 800 }}>{label} <span style={{ fontSize: 13, fontWeight: 400, color: "var(--color-muted)" }}>({score}%)</span></div>;
  }
  return null;
}

function PredictionCard({ sessions, racePlan, palette, raceProjection }) {
  const selectedEventResults = sessions.filter((session) => {
    const matchId = session.eventId === racePlan.event || session.event === racePlan.event;
    const metric = Number(session.time ?? session.value ?? session.metric ?? 0);
    return matchId && Number.isFinite(metric) && metric > 0;
  }).sort((a, b) => new Date(a.date || a.day || a.timestamp) - new Date(b.date || b.day || b.timestamp));

  if (!raceProjection.hasPrediction) {
    return (
      <div className="rounded-2xl border p-5 sm:p-6" style={{ background: palette.surface, borderColor: palette.border }}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: palette.muted }}>Predicted time</div>
          <span className="rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ borderColor: palette.border, background: palette.surfaceAlt, color: palette.text }}>
            Not enough data
          </span>
        </div>
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-4 py-6 text-center" style={{ borderColor: palette.border, background: palette.surfaceAlt }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: palette.text }}>—</div>
          <div style={{ fontSize: 14, color: palette.muted, maxWidth: 260 }}>{raceProjection.message}</div>
        </div>
      </div>
    );
  }

  const chartWidth = 640;
  const chartHeight = 220;
  const padding = 24;
  const allValues = [
    ...selectedEventResults.map((session) => Number(session.time || session.value)),
    raceProjection.likelyRange.low,
    raceProjection.predictedTime,
    raceProjection.likelyRange.high,
  ].filter((value) => Number.isFinite(value));
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const span = maxValue - minValue || 1;
  const startDate = selectedEventResults.length ? new Date(selectedEventResults[0].date || selectedEventResults[0].day || selectedEventResults[0].timestamp) : new Date();
  const endDate = racePlan.raceDate ? new Date(`${racePlan.raceDate}T00:00:00`) : new Date();
  const xScale = (date) => {
    const total = Math.max(1, endDate.getTime() - startDate.getTime());
    const ratio = (new Date(date).getTime() - startDate.getTime()) / total;
    return padding + ratio * (chartWidth - padding * 2);
  };
  const yScale = (value) => chartHeight - padding - ((value - minValue) / span) * (chartHeight - padding * 2);

  const pastPath = selectedEventResults.map((session, index) => {
    const value = Number(session.time || session.value);
    const x = xScale(new Date(session.date || session.day || session.timestamp));
    const y = yScale(value);
    return `${index === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");

  const lastPast = selectedEventResults[selectedEventResults.length - 1];
  const lastTime = Number(lastPast.time || lastPast.value);
  const forecastX = xScale(endDate);
  const forecastY = yScale(raceProjection.predictedTime);
  const forecastLowY = yScale(raceProjection.likelyRange.low);
  const forecastHighY = yScale(raceProjection.likelyRange.high);
  const lastX = xScale(new Date(lastPast.date || lastPast.day || lastPast.timestamp));
  const lastY = yScale(lastTime);

  const bandPath = [
    `M ${lastX} ${forecastHighY}`,
    `L ${forecastX} ${forecastHighY}`,
    `L ${forecastX} ${forecastLowY}`,
    `L ${lastX} ${forecastLowY}`,
    "Z",
  ].join(" ");

  const confidenceStyle =
    raceProjection.confidence === "high"
      ? { background: "rgba(34,197,94,0.14)", borderColor: "rgba(34,197,94,0.5)", color: "#22c55e" }
      : raceProjection.confidence === "medium"
        ? { background: "rgba(245,158,11,0.14)", borderColor: "rgba(245,158,11,0.5)", color: "#f59e0b" }
        : { background: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.42)", color: "#ef4444" };

  const confidenceText = raceProjection.confidence === "high" ? "High confidence" : raceProjection.confidence === "medium" ? "Moderate confidence" : "Low confidence";

  return (
    <div className="rounded-2xl border p-5 sm:p-6" style={{ background: palette.surface, borderColor: palette.border }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: palette.muted }}>Predicted time</div>
        <span className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ ...confidenceStyle, borderColor: confidenceStyle.borderColor || palette.border }}>
          {confidenceText}
        </span>
      </div>

      <div className="mb-3 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-4xl font-black tracking-tight sm:text-5xl" style={{ color: palette.text }}>
            {raceProjection.predictedTime.toFixed(2)}s
          </div>
          <div className="mt-2 text-sm" style={{ color: palette.muted }}>
            Likely range: {raceProjection.likelyRange.low.toFixed(2)}s to {raceProjection.likelyRange.high.toFixed(2)}s
          </div>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border" style={{ background: palette.surfaceAlt, borderColor: palette.border }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="block h-[190px] w-full" preserveAspectRatio="none" aria-label="Race prediction chart">
          <defs>
            <linearGradient id="rangeBand" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(249,115,22,0.28)" />
              <stop offset="100%" stopColor="rgba(249,115,22,0.08)" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map((step) => {
            const y = padding + (step / 3) * (chartHeight - padding * 2);
            return <line key={step} x1={padding} x2={chartWidth - padding} y1={y} y2={y} stroke={palette.border} strokeDasharray="4 6" strokeOpacity="0.8" />;
          })}

          <path d={bandPath} fill="url(#rangeBand)" opacity="0.9" />

          {selectedEventResults.length > 1 && (
            <path d={pastPath} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {selectedEventResults.map((session) => {
            const value = Number(session.time || session.value);
            const x = xScale(new Date(session.date || session.day || session.timestamp));
            const y = yScale(value);
            return <circle key={`${session.date}-${value}`} cx={x} cy={y} r="4" fill="var(--accent)" />;
          })}

          <line x1={lastX} x2={forecastX} y1={lastY} y2={forecastY} stroke="var(--accent)" strokeDasharray="8 8" strokeWidth="2.2" />

          <line x1={forecastX} x2={forecastX} y1={padding} y2={chartHeight - padding} stroke={palette.muted} strokeDasharray="5 7" strokeOpacity="0.8" />
          <circle cx={forecastX} cy={forecastY} r="6" fill="var(--accent-hover)" stroke="var(--accent)" strokeWidth="2" />
          <text x={forecastX + 10} y={forecastY - 8} fontSize="11" fill={palette.text} fontWeight="700">Race day</text>
        </svg>
      </div>

      <div className="mt-4 space-y-2 text-sm" style={{ color: palette.text }}>
        <div><span style={{ fontWeight: 700, color: palette.muted }}>Trend</span>: {raceProjection.explanation.trend}</div>
        <div><span style={{ fontWeight: 700, color: palette.muted }}>Stage</span>: {raceProjection.explanation.stage}</div>
        <div><span style={{ fontWeight: 700, color: palette.muted }}>Watch</span>: {raceProjection.explanation.watch}</div>
      </div>

      <div className="mt-4 rounded-xl px-3 py-2 text-xs font-medium" style={{ background: palette.surfaceAlt, border: `1px solid ${palette.border}`, color: palette.muted }}>
        An estimate from your own results and training stage, not a promise.
      </div>

      {raceProjection.warning && (
        <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-200">
          {raceProjection.warning}
        </div>
      )}
    </div>
  );
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
  const [racePlan, setRacePlan] = useState(EMPTY_RACE_PLAN);
  const [raceStatus, setRaceStatus] = useState(null);
  const [isSavingRace, setIsSavingRace] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
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

  useEffect(() => {
    let unsubscribeRace = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeRace) {
        unsubscribeRace();
        unsubscribeRace = null;
      }

      if (!user) {
        setRacePlan(EMPTY_RACE_PLAN);
        setRaceStatus({ type: "info", message: "Sign in to sync your race plan." });
        return;
      }

      const raceRef = doc(db, "users", user.uid, "race", "profile");
      unsubscribeRace = onSnapshot(raceRef, (snapshot) => {
        if (snapshot.exists()) {
          const savedRace = snapshot.data();
          setRacePlan({
            raceDate: savedRace.raceDate || "",
            event: savedRace.event || "100m",
            stage: RACE_STAGES.includes(savedRace.stage) ? savedRace.stage : "base",
            goalTime: savedRace.goalTime ?? "",
          });
        } else {
          setRacePlan(EMPTY_RACE_PLAN);
        }
      }, (error) => {
        setRaceStatus({ type: "error", message: error.message || "Could not load race plan." });
      });
    });

    return () => {
      if (unsubscribeRace) unsubscribeRace();
      unsubscribeAuth();
    };
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

  const palette = {
    background: "var(--color-bg)",
    surface: "var(--color-card)",
    surfaceAlt: "var(--color-card-alt)",
    border: "var(--color-border)",
    text: "var(--color-text)",
    muted: "var(--color-muted)",
    mutedStrong: "var(--color-muted-strong)",
    panelGlow: "var(--panel-glow)",
    inputBg: "var(--color-input-bg)",
    inputBorder: "var(--color-input-border)",
  };
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minRaceDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  const weeksToRace = getWeeksToRace(racePlan.raceDate);
  const raceProjection = useMemo(
    () => predictRaceTime(sessions, racePlan, sessions),
    [sessions, racePlan]
  );

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

  async function handleSaveRace(event) {
    event.preventDefault();
    if (!currentUser) {
      setRaceStatus({ type: "error", message: "Sign in to sync your race plan." });
      return;
    }

    const raceDay = new Date(`${racePlan.raceDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!racePlan.raceDate || Number.isNaN(raceDay.getTime()) || raceDay <= today) {
      setRaceStatus({ type: "error", message: "Choose a race date in the future." });
      return;
    }

    setIsSavingRace(true);
    setRaceStatus(null);
    const raceData = {
      raceDate: racePlan.raceDate,
      event: racePlan.event,
      stage: racePlan.stage,
    };
    if (String(racePlan.goalTime).trim()) raceData.goalTime = String(racePlan.goalTime).trim();

    try {
      await setDoc(doc(db, "users", currentUser.uid, "race", "profile"), raceData);
      setRaceStatus({ type: "success", message: "Race plan saved" });
    } catch (error) {
      setRaceStatus({ type: "error", message: error.message || "Could not save race plan." });
    } finally {
      setIsSavingRace(false);
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
    <div style={{ minHeight: "100vh", background: palette.background, paddingBottom: 60, color: palette.text, fontFamily: "Inter, sans-serif" }}>

      {/* ATHLETE TYPE MODAL */}
      <AnimatePresence>
        {showAthleteTypeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 20, padding: 40, maxWidth: 360, width: "90%" }}>
              <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>🏃</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: "center", marginBottom: 8, color: palette.text }}>What type of athlete are you?</h2>
              <p style={{ color: palette.muted, textAlign: "center", fontSize: 13, marginBottom: 28 }}>This helps us show the right events for you</p>
              <div style={{ display: "flex", gap: 12 }}>
                  {[["sprinter", "⚡ Sprinter", "var(--accent)"], ["jumper", "🦘 Jumper", "#7c3aed"]].map(([type, label, color]) => (
                  <button key={type} onClick={() => { setAthleteType(type); localStorage.setItem("athleteType", JSON.stringify(type)); setShowAthleteTypeModal(false); }}
                    style={{ flex: 1, background: color, border: "none", borderRadius: 12, padding: "14px 0", color: type === "sprinter" ? "var(--accent-foreground)" : "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="dashboard-header sticky top-0 z-40 border-b px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Brand />
            <span className="text-sm font-medium" style={{ color: palette.muted }}>Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition"
              style={{ borderColor: palette.border, background: palette.surfaceAlt, color: palette.text }}
            >
              <FaArrowLeft size={12} />
              Back
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 lg:px-6" style={{ maxWidth: "100%" }}>

        <div className="mb-4 grid items-start gap-4">
          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="self-start border shadow-2xl" style={{ background: palette.surface, borderColor: palette.border, boxShadow: `0 18px 50px ${palette.panelGlow}`, borderRadius: 16, padding: 24 }}>
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xs">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: palette.muted }}>Today</div>
                  <h2 className="text-xl font-semibold" style={{ color: palette.text }}>Keep the streak alive</h2>
                  <p className="mt-2 text-sm" style={{ color: palette.muted }}>Small, repeatable sessions build the momentum behind every PB.</p>
                </div>
                <div className="border" style={{ background: palette.surfaceAlt, borderColor: palette.border, borderRadius: 16, padding: 20 }}>
                  <ConsistencyLoop current={Math.max(0, Math.min(24, sessions.length))} target={24} />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="border" style={{ background: palette.surface, borderColor: palette.border, borderRadius: 16, padding: 20 }}>
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: palette.muted }}>Readiness</div>
                <div style={{ color: palette.text, fontWeight: 700, fontSize: 18 }}>Strong</div>
                <div style={{ color: palette.muted, fontSize: 13, marginTop: 6 }}>Recovery trend is stable and session quality is up.</div>
              </div>
              <div className="border" style={{ background: palette.surface, borderColor: palette.border, borderRadius: 16, padding: 20 }}>
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: palette.muted }}>Injury signals</div>
                <RiskScore sessions={sessions} type="injury" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className="border" style={{ background: palette.surface, borderColor: palette.border, borderRadius: 16, padding: 24 }}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: palette.muted }}>Race day</div>
                <span className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: palette.border, background: palette.surfaceAlt, color: palette.text }}>
                  {weeksToRace === null
                    ? racePlan.raceDate ? "Date must be in the future" : "Set a race date"
                    : `${weeksToRace} ${weeksToRace === 1 ? "week" : "weeks"} to race`}
                </span>
              </div>
              <form onSubmit={handleSaveRace} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-medium" style={{ color: palette.muted }}>
                  Race date
                  <input
                    type="date"
                    min={minRaceDate}
                    required
                    value={racePlan.raceDate}
                    onChange={(event) => setRacePlan((plan) => ({ ...plan, raceDate: event.target.value }))}
                    className="rounded-lg border px-3 py-2 text-sm"
                    style={{ background: palette.inputBg, borderColor: palette.inputBorder, color: palette.text, colorScheme: "inherit" }}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium" style={{ color: palette.muted }}>
                  Event
                  <select
                    value={racePlan.event}
                    onChange={(event) => setRacePlan((plan) => ({ ...plan, event: event.target.value }))}
                    className="rounded-lg border px-3 py-2 text-sm"
                    style={{ background: palette.inputBg, borderColor: palette.inputBorder, color: palette.text }}
                  >
                    {RACE_EVENTS.map((event) => <option key={event.id} value={event.id}>{event.label}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium" style={{ color: palette.muted }}>
                  Training stage
                  <select
                    value={racePlan.stage}
                    onChange={(event) => setRacePlan((plan) => ({ ...plan, stage: event.target.value }))}
                    className="rounded-lg border px-3 py-2 text-sm capitalize"
                    style={{ background: palette.inputBg, borderColor: palette.inputBorder, color: palette.text }}
                  >
                    {RACE_STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium" style={{ color: palette.muted }}>
                  Goal time (optional)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 11.20"
                    value={racePlan.goalTime}
                    onChange={(event) => setRacePlan((plan) => ({ ...plan, goalTime: event.target.value }))}
                    className="rounded-lg border px-3 py-2 text-sm"
                    style={{ background: palette.inputBg, borderColor: palette.inputBorder, color: palette.text }}
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSavingRace}
                  className="mt-1 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ background: "var(--accent)", color: "var(--accent-foreground)", minHeight: 44 }}
                >
                  {isSavingRace ? <><FaSpinner className="animate-spin" /> Saving...</> : <><FaCheck /> Save Race Plan</>}
                </button>
                {raceStatus && (
                  <div className={`text-sm ${raceStatus.type === "success" ? "text-emerald-500" : raceStatus.type === "error" ? "text-red-500" : ""}`} style={raceStatus.type === "info" ? { color: palette.muted } : undefined} role="status">
                    {raceStatus.message}
                  </div>
                )}
              </form>
            </div>

            <PredictionCard sessions={sessions} racePlan={racePlan} palette={palette} raceProjection={raceProjection} />
          </div>
        </div>

        {/* PB CARDS */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: palette.text }}>Personal Bests</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--accent)", fontSize: 12 }}>
              <FaTrophy size={11} /> <span>Your records</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {availableEvents.map((ev) => (
              <PBCard key={ev.id} ev={ev} value={personalBests[ev.id]} goal={goalInputs[`${ev.id}_goal`] || personalBests[`${ev.id}_goal`]} justPB={justPBEvent === ev.id} />
            ))}
          </div>
        </div>

        {/* LOG SESSION */}
        <div style={{ marginBottom: 24 }}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowForm(s => !s)}
            style={{
              background: showForm ? "var(--color-card-alt)" : "var(--accent)",
              border: showForm ? "1px solid var(--color-border)" : "none", borderRadius: 14, padding: "14px 28px", color: showForm ? "var(--color-text)" : "var(--accent-foreground)", fontWeight: 700,
              fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              boxShadow: showForm ? "none" : "0 0 24px rgba(234,88,12,0.3)",
            }}>
            {showForm ? <><FaTimes /> Cancel</> : <><FaPlus /> Log Session</>}
          </motion.button>
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 20, padding: 28, marginTop: 12 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: palette.text }}>New Session</h3>
                  <form onSubmit={handleAddSession} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ color: palette.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Event</label>
                      <select value={newEvent} onChange={(e) => setNewEvent(e.target.value)}
                        style={{ background: palette.inputBg, border: `1px solid ${palette.inputBorder}`, borderRadius: 10, padding: "10px 14px", color: palette.text, fontSize: 14, cursor: "pointer" }}>
                        {availableEvents.map((ev) => <option key={ev.id} value={ev.id}>{ev.label}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ color: palette.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Time / Distance</label>
                      <input value={newTime} onChange={(e) => setNewTime(e.target.value)} placeholder="e.g. 10.85"
                        style={{ background: palette.inputBg, border: `1px solid ${palette.inputBorder}`, borderRadius: 10, padding: "10px 14px", color: palette.text, fontSize: 14, width: 140, outline: "none" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ color: palette.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pain (1–5)</label>
                      <input type="number" min={1} max={5} value={newPain} onChange={(e) => setNewPain(e.target.value)}
                        style={{ background: palette.inputBg, border: `1px solid ${palette.inputBorder}`, borderRadius: 10, padding: "10px 14px", color: palette.text, fontSize: 14, width: 80, outline: "none" }} />
                    </div>
                    <button type="submit"
                      style={{ background: "var(--accent)", border: "none", borderRadius: 10, padding: "10px 24px", color: "var(--accent-foreground)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
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
                  style={{ background: chartEvent === ev.id ? "var(--accent)" : palette.surfaceAlt, border: "1px solid " + (chartEvent === ev.id ? "var(--accent)" : palette.border), borderRadius: 8, padding: "4px 12px", color: chartEvent === ev.id ? "var(--accent-foreground)" : palette.text, fontSize: 12, cursor: "pointer" }}>
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
        .ascendex-calendar .react-calendar__tile--active { background: var(--accent) !important; color: var(--accent-foreground) !important; }
        .ascendex-calendar .react-calendar__tile--now { border: 1px solid var(--accent) !important; color: var(--accent) !important; }
        .ascendex-calendar .react-calendar__navigation button { background: transparent !important; color: ${palette.text} !important; }
        .ascendex-calendar .react-calendar__month-view__weekdays { color: ${palette.muted} !important; font-size: 11px !important; }
      `}</style>
    </div>
  );
}