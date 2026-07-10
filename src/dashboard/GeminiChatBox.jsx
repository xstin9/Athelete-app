import { useMemo, useState } from "react";
import { sendGeminiMessage } from "../ai/geminiApi";

export default function GeminiChatBox({ sessions = [] }) {
  const [messages, setMessages] = useState([
    {
      role: "model",
      content: "I can review your recent sessions and turn them into a focused training plan. Ask me for recovery guidance, race strategy, or a next-step adjustment.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const quickPrompts = useMemo(
    () => [
      "Give me a recovery plan for this week",
      "What should I focus on before my next event?",
      "How do my recent sessions compare?",
    ],
    []
  );

  async function handleSend(promptOverride) {
    const message = (promptOverride ?? draft).trim();
    if (!message) return;

    const nextMessages = [...messages, { role: "user", content: message }];
    setMessages(nextMessages);
    setDraft("");
    setIsThinking(true);

    try {
      const reply = await sendGeminiMessage(nextMessages, sessions);
      setMessages([...nextMessages, { role: "model", content: reply }]);
    } catch (error) {
      setMessages([...nextMessages, { role: "model", content: error.message || "The coach could not respond right now." }]);
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <div style={{ border: "1px solid rgba(234, 88, 12, 0.24)", borderRadius: 20, padding: 20, background: "linear-gradient(135deg, rgba(234, 88, 12, 0.13), rgba(15, 23, 42, 0.85))", boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Ascendex AI Coach</div>
          <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 2 }}>Actionable insights based on your recent sessions</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#fdba74" }}>Live</div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSend(prompt)}
            style={{ border: "1px solid rgba(255,255,255,0.16)", background: "rgba(15,23,42,0.8)", color: "#f8fafc", padding: "6px 10px", borderRadius: 999, cursor: "pointer", fontSize: 12 }}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
        {messages.map((message, idx) => (
          <div key={`${message.role}-${idx}`} style={{ alignSelf: message.role === "user" ? "flex-end" : "flex-start", maxWidth: "90%" }}>
            <div style={{ fontSize: 11, color: message.role === "user" ? "#fdba74" : "#94a3b8", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {message.role === "user" ? "You" : "Coach"}
            </div>
            <div style={{ background: message.role === "user" ? "rgba(234, 88, 12, 0.85)" : "rgba(15, 23, 42, 0.9)", color: "#fff", padding: "10px 12px", borderRadius: 14, whiteSpace: "pre-wrap" }}>
              {message.content}
            </div>
          </div>
        ))}
        {isThinking && (
          <div style={{ alignSelf: "flex-start" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Coach</div>
            <div style={{ background: "rgba(15, 23, 42, 0.9)", color: "#fff", padding: "10px 12px", borderRadius: 14 }}>
              Thinking through your recent training data…
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && handleSend()}
          placeholder="Ask for guidance, recovery, or race strategy"
          style={{ flex: 1, border: "1px solid rgba(255,255,255,0.16)", background: "rgba(2, 6, 23, 0.75)", color: "#f8fafc", borderRadius: 999, padding: "10px 14px", outline: "none" }}
        />
        <button
          onClick={() => handleSend()}
          style={{ border: "none", background: "#ea580c", color: "#fff", padding: "10px 14px", borderRadius: 999, cursor: "pointer", fontWeight: 700 }}
        >
          Ask
        </button>
      </div>
    </div>
  );
}
