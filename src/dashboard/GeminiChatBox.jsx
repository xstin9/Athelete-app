import { useState, useRef, useEffect } from "react";
import { sendGeminiMessage } from "../ai/geminiApi";
import { motion, AnimatePresence } from "framer-motion";
import { FaPaperPlane } from "react-icons/fa";

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-orange-400"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

export default function GeminiChatBox({ sessions = [] }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatMessages");
    return saved
      ? JSON.parse(saved)
      : [{ role: "model", content: "What event are you training for today?" }];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e) {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg, { role: "model", content: "__typing__" }]);
    setInput("");
    setLoading(true);

    try {
      const reply = await sendGeminiMessage([...messages, userMsg], sessions);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "model", content: reply };
        return updated;
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "model", content: "Something went wrong. Try again." };
        return updated;
      });
    }
    setLoading(false);
    inputRef.current?.focus();
  }

  return (
    <div style={{ background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: "20px", width: "100%", maxWidth: "600px", fontFamily: "'DM Sans', sans-serif", overflow: "hidden", boxShadow: "0 0 40px rgba(234,88,12,0.08)" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: "10px", background: "#0d0d0d" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #ea580c, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>⚡</div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Ascendex AI Coach</div>
          <div style={{ color: "#ea580c", fontSize: 11, fontWeight: 500 }}>● Online</div>
        </div>
        <button onClick={() => { setMessages([{ role: "model", content: "What event are you training for today?" }]); localStorage.removeItem("chatMessages"); }} style={{ marginLeft: "auto", background: "transparent", border: "1px solid #2a2a2a", color: "#555", borderRadius: 8, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>Clear</button>
      </div>

      {/* Messages */}
      <div style={{ height: 320, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10, scrollbarWidth: "thin", scrollbarColor: "#222 transparent" }}>
        <AnimatePresence initial={false}>
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            const isTyping = m.content === "__typing__";
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
                {!isUser && <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #ea580c, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>⚡</div>}
                <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isUser ? "linear-gradient(135deg, #ea580c, #f97316)" : "#161616", color: "#fff", fontSize: 13.5, lineHeight: 1.55, border: isUser ? "none" : "1px solid #222", wordBreak: "break-word" }}>
                  {isTyping ? <TypingDots /> : m.content}
                </div>
                {isUser && <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1e1e1e", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>🏃</div>}
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #1a1a1a", display: "flex", gap: 10, background: "#0d0d0d" }}>
        <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Ask your coach..." disabled={loading} style={{ flex: 1, background: "#161616", border: "1px solid #272727", borderRadius: 12, padding: "10px 14px", color: "#fff", fontSize: 13.5, outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
        <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ background: input.trim() && !loading ? "linear-gradient(135deg, #ea580c, #f97316)" : "#1e1e1e", border: "none", borderRadius: 12, padding: "10px 16px", color: input.trim() && !loading ? "#fff" : "#444", cursor: input.trim() && !loading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", fontSize: 14 }}>
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
}