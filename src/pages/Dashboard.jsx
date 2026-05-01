import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Sidebar from "../components/Sidebar";
import Brand from "../components/Brand";
import GeminiChatBox from "../dashboard/GeminiChatBox";
import Sparkline from "../components/Sparkline";
import PerformanceChart from "../components/PerformanceChart";
import ThemeToggle from "../components/ThemeToggle";
import ConsistencyLoop from "../components/ConsistencyLoop";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { playSound } from "../utils/soundEffects";
import { FaTrophy, FaFire, FaChartLine, FaBullseye } from "react-icons/fa";
function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [date, setDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);

  const EVENTS = [
    { id: "100m", label: "100m", type: "time" },
    { id: "200m", label: "200m", type: "time" },
    { id: "300m", label: "300m", type: "time" },
    { id: "400m", label: "400m", type: "time" },
    { id: "longJump", label: "Long Jump", type: "distance" },
    { id: "highJump", label: "High Jump", type: "distance" },
  ];

  const [newEvent, setNewEvent] = useState("100m");
  const [newTime, setNewTime] = useState("");
  const [newPain, setNewPain] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [personalBests, setPersonalBests] = useState({});
  const [streak, setStreak] = useState(0);
  const [justPBEvent, setJustPBEvent] = useState(null);

  const [competitionDate, setCompetitionDate] = useState("");
  const [showCompetitionModal, setShowCompetitionModal] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [allPBNotified, setAllPBNotified] = useState(false);

  const [athleteType, setAthleteType] = useState(() => {
    const saved = localStorage.getItem("athleteType");
    return saved ? JSON.parse(saved) : null;
  });
  const [showAthleteTypeModal, setShowAthleteTypeModal] = useState(false);
  useEffect(() => {
    if (!athleteType) setShowAthleteTypeModal(true);
  }, [athleteType]);

  const [userName, setUserName] = useState(null);

  const availableEvents =
    athleteType === "jumper"
      ? EVENTS.filter((ev) => ev.type === "distance")
      : EVENTS.filter((ev) => ev.type === "time");

  const selectedEvent =
    availableEvents.find((e) => e.id === newEvent) ||
    availableEvents[0] ||
    EVENTS[0];

  const [chartEvent, setChartEvent] = useState(
    selectedEvent?.id || EVENTS[0].id
  );

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [goalEvent, setGoalEvent] = useState(
    selectedEvent?.id || EVENTS[0].id
  );
  const [goalInput, setGoalInput] = useState("");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("sessions"));
    if (saved) setSessions(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("sessions", JSON.stringify(sessions));
  }, [sessions]);

  function handleAddSession(e) {
    e.preventDefault();

    const metricNum = parseFloat(newTime);
    const evDef = EVENTS.find((ev) => ev.id === newEvent) || EVENTS[0];

    const session = {
      date: new Date(date).toLocaleDateString(),
      eventId: evDef.id,
      event: evDef.label,
      time: newTime,
      metricType: evDef.type,
      pain: Number(newPain),
    };

    setSessions((prev) => [session, ...prev]);
    playSound.click();

    if (!isNaN(metricNum)) {
      const currentPB = personalBests[evDef.id];
      const isPB =
        evDef.type === "time"
          ? currentPB == null || metricNum < currentPB
          : currentPB == null || metricNum > currentPB;

      if (isPB) {
        setPersonalBests((prev) => ({
          ...prev,
          [evDef.id]: metricNum,
        }));
        setJustPBEvent(evDef.id);
        playSound.achievement();
      }
    }

    setNewEvent(availableEvents?.[0]?.id || EVENTS[0].id);
    setNewTime("");
    setNewPain(1);
    setShowForm(false);
  }

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <Brand className="scale-125" />
        <div className="flex items-center gap-4">
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Athlete Dashboard</div>
          <ThemeToggle />
        </div>
      </div>

      {/* ATHLETE TYPE MODAL */}
      {showAthleteTypeModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Choose your athlete type</h2>
            <div className="flex gap-4">
              <button
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                onClick={() => { setAthleteType("sprinter"); localStorage.setItem("athleteType", JSON.stringify("sprinter")); setShowAthleteTypeModal(false); }}
              >Sprinter</button>
              <button
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700"
                onClick={() => { setAthleteType("jumper"); localStorage.setItem("athleteType", JSON.stringify("jumper")); setShowAthleteTypeModal(false); }}
              >Jumper</button>
            </div>
          </div>
        </div>
      )}

      {/* CONSISTENCY LOOP & CALENDAR & GOALS */}
      <div className="grid md:grid-cols-3 gap-8 mb-8">
        <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border border-gray-200 dark:border-gray-700">
          <ConsistencyLoop current={sessions.length} target={100} />
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border border-gray-200 dark:border-gray-700">
          <div className="font-semibold text-lg mb-2 text-gray-900 dark:text-white flex items-center gap-2">
            <FaChartLine className="text-indigo-500" /> Training Calendar
          </div>
          <Calendar value={date} onChange={setDate} className="rounded-lg border border-gray-300 dark:border-gray-700" />
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border border-gray-200 dark:border-gray-700">
          <div className="font-semibold text-lg mb-2 text-gray-900 dark:text-white flex items-center gap-2">
            <FaBullseye className="text-orange-500" /> Goals
          </div>
          <ul className="space-y-2">
            {availableEvents.map(ev => (
              <li key={ev.id} className="flex items-center gap-2">
                <span className="font-bold text-orange-600 dark:text-orange-400">{ev.label}:</span>
                <input
                  className="flex-1 rounded px-2 py-1 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder={`Goal for ${ev.label}`}
                  value={personalBests[ev.id + "_goal"] || ""}
                  onChange={e => setPersonalBests(pb => ({ ...pb, [ev.id + "_goal"]: e.target.value }))}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* TIMES/EVENTS FIRST */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {availableEvents.map((ev) => (
          <div key={ev.id} className="bg-white p-4 rounded-2xl shadow">
            <p className="text-gray-500 text-sm">{ev.label}</p>
            <h2 className="text-2xl font-bold">
              {personalBests[ev.id] != null
                ? `${personalBests[ev.id].toFixed(2)}${ev.type === "time" ? "s" : "m"}`
                : "—"}
            </h2>
            {justPBEvent === ev.id && (
              <span className="text-sm text-green-500">New PB!</span>
            )}
            <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">Goal: {personalBests[ev.id + "_goal"] || "—"}</div>
          </div>
        ))}
      </div>

      {/* LOG SESSION */}
      <button
        onClick={() => setShowForm((s) => !s)}
        className="bg-green-600 text-white px-4 py-2 rounded-lg"
      >
        {showForm ? "Cancel" : "Log Session"}
      </button>

      {showForm && (
        <form
          onSubmit={handleAddSession}
          className="mt-4 bg-white p-4 rounded-2xl shadow"
        >
          <select
            value={newEvent}
            onChange={(e) => setNewEvent(e.target.value)}
          >
            {availableEvents.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.label}
              </option>
            ))}
          </select>

          <input
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            placeholder="Time/Distance"
          />

          <button type="submit">Save</button>
        </form>
      )}

      {/* RISK SCORES */}
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div className="bg-white p-4 rounded-2xl shadow">
          <h3>Injury Risk</h3>
          <RiskScore sessions={sessions} type="injury" />
        </div>
        <div className="bg-white p-4 rounded-2xl shadow">
          <h3>Session Quality</h3>
          <RiskScore sessions={sessions} type="session" />
        </div>
      </div>

      {/* AI COACH CHAT */}
      <div className="mt-8 flex justify-center">
        <GeminiChatBox sessions={sessions} />
      </div>

      {/* MODERN PERFORMANCE GRAPH AT BOTTOM */}
      <div className="mt-8">
        <PerformanceChart sessions={sessions.map(s => ({ date: s.date, value: s.time }))} />
      </div>
    </div>
  );
}

/* ✅ MOVED OUTSIDE (IMPORTANT FIX) */
function RiskScore({ sessions, type }) {
  if (!sessions || sessions.length === 0) {
    return <div className="text-gray-400">No data yet.</div>;
  }

  if (type === "injury") {
    const last = sessions.slice(0, 7);
    const avgPain =
      last.reduce((sum, s) => sum + (s.pain || 1), 0) / last.length;

    let risk = "Low";
    let color = "text-green-600";

    if (avgPain >= 4) {
      risk = "High";
      color = "text-red-600";
    } else if (avgPain >= 2.5) {
      risk = "Medium";
      color = "text-yellow-600";
    }

    return (
      <div className={`text-lg font-bold ${color}`}>
        {risk} ({avgPain.toFixed(2)})
      </div>
    );
  }

  if (type === "session") {
    const last = sessions.slice(0, 7);
    const goodSessions = last.filter((s) => (s.pain || 1) <= 2).length;

    let score = Math.round((goodSessions / 7) * 100);
    let label = "Poor";
    let color = "text-red-600";

    if (score >= 70) {
      label = "Great";
      color = "text-green-600";
    } else if (score >= 40) {
      label = "Okay";
      color = "text-yellow-600";
    }

    return (
      <div className={`text-lg font-bold ${color}`}>
        {label} ({score}%)
      </div>
    );
  }

  return null;
}

export default Dashboard;
