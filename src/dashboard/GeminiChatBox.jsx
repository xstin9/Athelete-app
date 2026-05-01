import { useState, useRef, useEffect } from "react";
import { sendGeminiMessage } from "../ai/geminiApi";
import { motion } from "framer-motion";
import { FaBrain, FaPaperPlane } from "react-icons/fa";

export default function GeminiChatBox({ sessions = [] }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatMessages");
    return saved
      ? JSON.parse(saved)
      : [
          {
            role: "model",
            content: "What event are you training for today?"
          }
        ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // save chat to localStorage
  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };

    setMessages((prev) => [
      ...prev,
      userMsg,
      { role: "model", content: "Thinking..." }
    ]);

    setInput("");
    setLoading(true);

    try {
      const reply = await sendGeminiMessage(
        [...messages, userMsg],
        sessions // ✅ MEMORY HERE
      );

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "model",
          content: reply
        };
        return updated;
      });
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "model",
          content: "Something went wrong. Try again."
        };
        return updated;
      });
    }

    setLoading(false);

    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black text-white rounded-2xl p-4 border border-gray-800 max-w-xl mx-auto mb-8"
    >
      <div className="flex items-center gap-2 mb-2">
        <FaBrain className="text-orange-500" />
        <h3 className="font-semibold">AI Coach Chat</h3>
      </div>

      <div className="overflow-y-auto max-h-60 mb-3 pr-2">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <span
              className={
                m.role === "user"
                  ? "inline-block bg-indigo-600 text-white rounded-lg px-3 py-2 my-1 max-w-[80%]"
                  : "inline-block bg-gray-800 text-gray-100 rounded-lg px-3 py-2 my-1 max-w-[80%]"
              }
            >
              {m.content}
            </span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2 mt-2">
        <input
          className="flex-1 rounded-lg px-3 py-2 bg-gray-900 text-white border border-gray-700"
          placeholder="Ask your AI coach..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(e);
            }
          }}
        />

        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          disabled={loading || !input.trim()}
        >
          <FaPaperPlane />
          {loading ? "..." : "Send"}
        </button>
      </form>
    </motion.div>
  );
}