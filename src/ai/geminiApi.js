import { GOOGLE_GEMINI_API_KEY } from "../ai/googleGeminiKey";

export async function sendGeminiMessage(messages) {
  // messages: [{role: "user"|"model", content: "..."}]
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + GOOGLE_GEMINI_API_KEY;
  const body = {
    contents: messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }))
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
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
