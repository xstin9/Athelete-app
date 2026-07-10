import { GOOGLE_GEMINI_API_KEY } from "../ai/googleGeminiKey";

export async function sendGeminiMessage(messages, sessions = []) {
  const recentSessions = sessions.slice(0, 8);
  const sessionSummary = recentSessions.length
    ? recentSessions
        .map((session) => `${session.date}: ${session.event || session.eventId} - ${session.time || "n/a"} ${session.metricType === "time" ? "s" : "m"}; pain ${session.pain || 1}`)
        .join("\n")
    : "No recent session data.";

  const lastUserMessage = messages[messages.length - 1]?.content || "";
  const contextPrompt = `You are Ascendex AI Coach, a concise performance coach for an athlete. Use the recent training context below to give specific, actionable advice.\n\nRecent sessions:\n${sessionSummary}\n\nUser message: ${lastUserMessage}`;

  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GOOGLE_GEMINI_API_KEY;
  const body = {
    contents: [{ role: "user", parts: [{ text: contextPrompt }] }],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error("Gemini API error: Invalid JSON response");
  }

  if (!res.ok) {
    const errMsg = data?.error?.message || JSON.stringify(data);
    throw new Error("Gemini API error: " + errMsg);
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || "[No response]";
}
