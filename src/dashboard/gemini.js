import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("YOUR_API_KEY");

export async function sendGeminiMessage(messages, sessions = []) {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // ✅ fast + works
  });

  // Get last user message
  const lastMessage = messages[messages.length - 1]?.content || "";

  // Format sessions into context
  const sessionSummary = sessions.slice(0, 5).map(s =>
    `${s.date} - ${s.event} (${s.time || "no time"}) pain:${s.pain}`
  ).join("\n");

  const prompt = `
You are an elite sprint coach.

Rules:
- Be direct
- No long explanations
- Give actionable advice
- Sound confident

Athlete recent sessions:
${sessionSummary || "No sessions yet"}

User question:
${lastMessage}
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;

  return response.text();
}