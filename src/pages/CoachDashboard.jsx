// This file has been removed as per user request.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Brand from "../components/Brand";
import Sparkline from "../components/Sparkline";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

function CoachDashboard() {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState([]);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [linkedAthlete, setLinkedAthlete] = useState(null);

  // coach modal & goal state
  const [showCoachProgressModal, setShowCoachProgressModal] = useState(false);
  const [coachGoalEvent, setCoachGoalEvent] = useState(null);
  const [coachGoalInput, setCoachGoalInput] = useState("");

  // load athlete personal bests (from localStorage for now)
  const coachPersonalBests = JSON.parse(localStorage.getItem('personalBests') || '{}');

  function getCoachGoal(ev) { return localStorage.getItem(`goal:${ev}`) || ""; }
  function setCoachGoal(ev, val) { localStorage.setItem(`goal:${ev}`, String(val)); }
  function computeCoachGoalProgress(eventId) {
    const goalVal = parseFloat(getCoachGoal(eventId));
    const currentPB = coachPersonalBests[eventId];
    if (!goalVal || !currentPB) return { pct: 0, achieved: false, currentPB, goalVal, delta: null };
    const ev = { type: (eventId.toLowerCase().includes('jump') ? 'distance' : 'time') };
    if (ev.type === 'time') {
      const pct = Math.min(100, Math.round((goalVal / currentPB) * 100));
      const achieved = currentPB <= goalVal;
      const delta = currentPB - goalVal;
      return { pct, achieved, currentPB, goalVal, delta };
    }
    const pct = Math.min(100, Math.round((currentPB / goalVal) * 100));
    const achieved = currentPB >= goalVal;
    const delta = goalVal - currentPB;
    return { pct, achieved, currentPB, goalVal, delta };
  }

  // Load athlete data from localStorage
  useEffect(() => {
    const savedSessions = JSON.parse(localStorage.getItem("sessions")) || [];
    setSessions(savedSessions);
    const linked = JSON.parse(localStorage.getItem("linkedAthlete"));
    if (linked) setLinkedAthlete(linked);
    
    // Mock data for now - in a real app, this would come from Firestore
    const mockAthletes = [
      {
        id: "athlete1",
        name: linked?.name || "Sample Athlete",
        type: localStorage.getItem("athleteType") || "sprint",
        sessionsCount: savedSessions.length,
        lastSession: savedSessions[0]?.date || "No sessions yet",
        avgPain: savedSessions.length > 0 ? Math.round(savedSessions.reduce((sum, s) => sum + (s.pain || 0), 0) / savedSessions.length) : 0
      }
    ];
    setAthletes(mockAthletes);
    if (mockAthletes.length > 0) {
      setSelectedAthlete(mockAthletes[0]);
    }
  }, []);

  // helper: compute consecutive-day streak ending today
  function computeStreakFromSessions(sessionsList) {
    const dateSet = new Set(sessionsList.map(s => {
      try { return new Date(s.date).toLocaleDateString(); } catch (e) { return s.date; }
    }));
    let count = 0;
    let d = new Date();
    while (dateSet.has(d.toLocaleDateString())) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }

  const LEVELS = [
    { days: 10, label: "Noah Lyles" },
    { days: 50, label: "Powerl" },
    { days: 100, label: "Justin Gatlin" },
    { days: 200, label: "Usain Bolt" },
  ];

  function computeRaceReadinessForCoach(sessionsList, streakCount) {
    const streakScore = Math.min(1, streakCount / 10);
    const uniqueEvents = new Set(sessionsList.map(s => s.eventId || s.event).filter(Boolean));
    const eventScore = Math.min(1, uniqueEvents.size / 5);
    return Math.round((streakScore * 0.5 + eventScore * 0.5) * 100);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return;
      // auto-link: if coach clicks link, this will capture the athlete info
    });
    return () => unsub();
  }, []);

  function linkCurrentAuthUser() {
    onAuthStateChanged(auth, (u) => {
      if (!u || !u.email) {
        alert('No signed-in athlete to link.');
        return;
      }
      const raw = u.email.split('@')[0];
      const neat = raw.replace(/[._-]/g, ' ').split(' ').filter(Boolean).map((w)=> w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
      const obj = { name: neat, email: u.email };
      localStorage.setItem('linkedAthlete', JSON.stringify(obj));
      setLinkedAthlete(obj);
      alert('Linked to ' + obj.name);
    });
  }

  function unlinkAthlete() {
    localStorage.removeItem('linkedAthlete');
    setLinkedAthlete(null);
  }

  const calculateInjuryRisk = () => {
    if (sessions.length === 0) return { level: "Low", color: "green", emoji: "🟢", percentage: 5 };
    
    const recentSessions = sessions.slice(0, 7);
    const highPainSessions = recentSessions.filter(s => s.pain >= 4).length;
    const percentage = Math.round((highPainSessions / Math.max(1, recentSessions.length)) * 100);
    
    if (percentage > 40) {
      return { level: "High", color: "red", emoji: "🔴", percentage };
    } else if (percentage > 20) {
      return { level: "Medium", color: "yellow", emoji: "🟡", percentage };
    }
    return { level: "Low", color: "green", emoji: "🟢", percentage };
  };

  const calculateTrend = () => {
    if (sessions.length < 2) return { trend: "Neutral", arrow: "→", change: "0%" };
    
    const recent = sessions.slice(0, 3).reduce((sum, s) => sum + (s.pain || 0), 0) / 3;
    const older = sessions.slice(3, 6).reduce((sum, s) => sum + (s.pain || 0), 0) / Math.max(1, Math.min(3, sessions.slice(3).length));
    
    if (recent > older) {
      return { trend: "Worsening", arrow: "📈", change: "+5%" };
    } else if (recent < older) {
      return { trend: "Improving", arrow: "📉", change: "-5%" };
    }
    return { trend: "Stable", arrow: "→", change: "0%" };
  };

  const getPerformanceMetrics = () => {
    if (sessions.length === 0) return { totalSessions: 0, avgPain: 0, maxPain: 0, lowPainDays: 0, competitionDate: localStorage.getItem("competitionDate") || "Not set", eventOptions: [] };
    
    return {
      totalSessions: sessions.length,
      avgPain: (sessions.reduce((sum, s) => sum + (s.pain || 0), 0) / sessions.length).toFixed(1),
      maxPain: Math.max(...sessions.map(s => s.pain || 0)),
      lowPainDays: sessions.filter(s => s.pain <= 2).length,
      competitionDate: localStorage.getItem("competitionDate") || "Not set",
      eventOptions: Array.from(new Set(sessions.map(s => s.eventId || s.event).filter(Boolean)))
    };
  };

  const injuryRisk = calculateInjuryRisk();
  const trend = calculateTrend();
  const metrics = getPerformanceMetrics();

  const [coachChartEvent, setCoachChartEvent] = useState(metrics.eventOptions?.[0] || "100m");

  useEffect(() => {
    if (metrics.eventOptions && metrics.eventOptions.length && !metrics.eventOptions.includes(coachChartEvent)) {
      setCoachChartEvent(metrics.eventOptions[0]);
    }
  }, [metrics.eventOptions]);

  function getCoachChartSeries(eventId, lookback = 12) {
    const filtered = sessions
      .filter(s => (s.eventId === eventId) || (s.event && s.event.toLowerCase().includes((eventId||"").toLowerCase())))
      .map(s => ({ date: new Date(s.date), value: parseFloat(s.time) || null }))
      .filter(s => s.value != null)
      .sort((a,b) => a.date - b.date)
      .slice(-lookback);
    return filtered.map(x => x.value);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-gray-900 dark:text-white">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Brand />
          <div>
            <h1 className="text-4xl font-bold">Coach Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Monitor athlete performance, injury risks & training trends</p>
            {linkedAthlete ? <div className="text-sm text-gray-500 mt-1">Connected to <strong>{linkedAthlete.name}</strong></div> : <div className="text-sm text-gray-500 mt-1">No athlete linked</div>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={linkCurrentAuthUser} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">{linkedAthlete ? 'Relink Athlete' : 'Link Athlete'}</button>
          {linkedAthlete && <button onClick={unlinkAthlete} className="px-3 py-1 rounded bg-red-600 text-white text-sm">Unlink</button>}
          <button onClick={() => setShowCoachProgressModal(true)} className="px-3 py-1 rounded bg-indigo-600 text-white text-sm">View Athlete Progress</button>
          <button 
            onClick={() => navigate(-1)} 
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {/* Athlete Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <div className="text-sm text-gray-500 dark:text-gray-400">Athlete</div>
          <div className="text-2xl font-bold mt-1">{selectedAthlete?.name || "N/A"}</div>
          <div className="text-sm text-blue-600 dark:text-blue-400 mt-2">
            {selectedAthlete?.type === "sprint" ? "💨 Sprinter" : "🦘 Jumper"}
          </div>
        </div>

        {/* Injury Risk Card */}
        <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow border-l-4 border-${injuryRisk.color}-500`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Injury Risk</div>
              <div className="text-2xl font-bold mt-1">{injuryRisk.emoji} {injuryRisk.level}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{injuryRisk.percentage}% high pain sessions</div>
            </div>
          </div>
        </div>

        {/* Performance Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <div className="text-sm text-gray-500 dark:text-gray-400">Trend</div>
          <div className="text-2xl font-bold mt-1">{trend.arrow} {trend.trend}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{trend.change} vs last week</div>
        </div>

        {/* Sessions Count */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Sessions</div>
          <div className="text-3xl font-bold mt-1">{metrics.totalSessions}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">tracked & logged</div>
        </div>
      </div>

      {/* Coach: Athlete competition & progress */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow mb-6">
        <h3 className="text-lg font-semibold mb-3">Athlete Competition & Title Progress</h3>
        <div className="text-sm text-gray-500 mb-2">Next competition: {metrics.competitionDate}</div>
        <div className="space-y-3">
          {(() => {
            const streakCount = computeStreakFromSessions(sessions);
            return LEVELS.map((lvl) => {
              const pct = Math.min(100, Math.round((streakCount / lvl.days) * 100));
              return (
                <div key={lvl.days}>
                  <div className="flex justify-between mb-1"><div className="text-sm font-medium">{lvl.label} — {lvl.days} days</div><div className="text-sm text-gray-500">{pct}%</div></div>
                  <div className="w-full bg-gray-200 h-3 rounded overflow-hidden">
                    <div style={{ width: `${pct}%` }} className={`h-3 ${pct >= 100 ? 'bg-yellow-400' : 'bg-green-500'}`} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{Math.max(0, lvl.days - streakCount)} more day(s) to reach</div>
                </div>
              );
            });
          })()}

          <div className="mt-3">
            <div className="flex justify-between"><div className="text-sm font-medium">Race Readiness</div><div className="text-sm text-gray-500">{computeRaceReadinessForCoach(sessions, computeStreakFromSessions(sessions))}%</div></div>
            <div className="w-full bg-gray-200 h-3 rounded overflow-hidden mt-1">
              <div style={{ width: `${computeRaceReadinessForCoach(sessions, computeStreakFromSessions(sessions))}%` }} className="h-3 bg-indigo-500" />
            </div>
            <div className="text-xs text-gray-500 mt-1">Readiness blends consistency & event coverage</div>
          </div>

          {/* Coach: event sparkline */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Event Performance</div>
              <select value={coachChartEvent} onChange={(e) => setCoachChartEvent(e.target.value)} className="border px-2 py-1 rounded">
                {(metrics.eventOptions || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <Sparkline data={getCoachChartSeries(coachChartEvent)} width={600} height={80} color="#ef4444" />
            <div className="text-xs text-gray-500 mt-2">Showing last recorded values for selected event</div>
          </div>

        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Avg Pain Level</span>
              <span className="text-2xl font-bold">{metrics.avgPain}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Max Pain</span>
              <span className="text-2xl font-bold text-red-600">{metrics.maxPain}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Low Pain Days</span>
              <span className="text-2xl font-bold text-green-600">{metrics.lowPainDays}</span>
            </div>
          </div>
        </div>

        {/* Training Schedule */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4">Training Status</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900 rounded">
              <span className="text-2xl">✅</span>
              <div>
                <div className="font-semibold">Ready for Training</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Pain levels normal</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900 rounded">
              <span className="text-2xl">📅</span>
              <div>
                <div className="font-semibold">Competition Date</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">{metrics.competitionDate}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition">
              📊 View Detailed Analytics
            </button>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition">
              💪 Set Training Goals
            </button>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition">
              📋 Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Recent Sessions Alert */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Session Alerts</h3>
        {sessions.slice(0, 5).length > 0 ? (
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session, idx) => (
              <div key={idx} className={`flex items-center gap-4 p-3 rounded-lg ${
                session.pain >= 4 
                  ? 'bg-red-50 dark:bg-red-900 border-l-4 border-red-500' 
                  : session.pain >= 3 
                  ? 'bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-500'
                  : 'bg-green-50 dark:bg-green-900 border-l-4 border-green-500'
              }`}>
                <div className="text-2xl">
                  {session.pain >= 4 ? '🔴' : session.pain >= 3 ? '🟡' : '🟢'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{session.event}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">{session.date} • Pain: {session.pain}/5</div>
                </div>
                {session.planned && <span className="text-blue-600 dark:text-blue-400 text-sm">📅 Planned</span>}
                {session.flag && <span className="text-yellow-600 dark:text-yellow-400 text-sm">🏁 Competition</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No sessions recorded yet</p>
        )}
      </div>

      {/* Recommendations Section */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-xl shadow mt-6">
        <h3 className="text-lg font-semibold mb-3">💡 Coach Recommendations</h3>
        <ul className="space-y-2 text-sm">
          {metrics.avgPain > 3.5 && <li>⚠️ Consider increasing recovery time - pain levels are elevated</li>}
          {metrics.totalSessions < 3 && <li>📈 Encourage more consistent training sessions</li>}
          {injuryRisk.level === "High" && <li>🏥 Schedule recovery/assessment session - injury risk is high</li>}
          {injuryRisk.level === "Low" && metrics.totalSessions > 5 && <li>✨ Great progress! Athlete is performing well</li>}
          <li>🎯 Next milestone: {Math.max(0, 10 - metrics.totalSessions)} more sessions to reach 10</li>
        </ul>
      </div>

      {/* COACH PROGRESS MODAL */}
      {showCoachProgressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowCoachProgressModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl mx-4 shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Athlete Progress & Goals</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">View title progress and athlete goals. You can also set target goals on behalf of the athlete.</p>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="font-semibold">Event</div>
                <select value={coachGoalEvent || metrics.eventOptions?.[0]} onChange={(e) => { setCoachGoalEvent(e.target.value); setCoachGoalInput(getCoachGoal(e.target.value)); }} className="border px-2 py-1 rounded">
                  {(metrics.eventOptions || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="mb-2">Current PB: {coachPersonalBests[coachGoalEvent] != null ? `${coachPersonalBests[coachGoalEvent]}` : '—'}</div>

              <div className="flex gap-2 items-center">
                <input placeholder={coachGoalEvent && coachGoalEvent.toLowerCase().includes('jump') ? 'Target distance (m)' : 'Target time (s)'} value={coachGoalInput} onChange={(e) => setCoachGoalInput(e.target.value)} className="border px-2 py-1 rounded" />
                <button onClick={() => { setCoachGoal(coachGoalEvent || metrics.eventOptions?.[0], coachGoalInput); alert('Goal saved'); }} className="px-3 py-1 bg-green-600 text-white rounded">Save Goal</button>
                <button onClick={() => { localStorage.removeItem(`goal:${coachGoalEvent}`); setCoachGoalInput(''); }} className="px-3 py-1 rounded border">Remove Goal</button>
              </div>

              {(() => {
                const g = computeCoachGoalProgress(coachGoalEvent || metrics.eventOptions?.[0]);
                if (!g || g.goalVal == null) return null;
                return (
                  <div className="mt-3">
                    <div className="flex justify-between"><div className="text-sm font-medium">Goal Progress</div><div className="text-sm text-gray-500">{g.pct}%</div></div>
                    <div className="w-full bg-gray-200 h-3 rounded overflow-hidden mt-1">
                      <div style={{ width: `${g.pct}%` }} className={`h-3 ${g.pct >= 100 ? 'bg-yellow-400' : 'bg-green-500'}`} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{g.currentPB == null ? 'Set a PB to start tracking progress' : (g.achieved ? 'Goal achieved! 🎉' : `Need ${Math.abs(g.delta).toFixed(2)} ${coachGoalEvent && coachGoalEvent.toLowerCase().includes('jump') ? 'm more' : 's faster'}`)}</div>
                  </div>
                )
              })()}
            </div>

            <div className="flex justify-end">
              <button onClick={() => setShowCoachProgressModal(false)} className="px-4 py-2 rounded border">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoachDashboard;
