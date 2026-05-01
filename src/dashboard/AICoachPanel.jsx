import { motion } from "framer-motion";
import { FaBrain } from "react-icons/fa";

export default function AICoachPanel({ streak, readiness, painRisk }) {
  function insight() {
    if (painRisk) return "⚠️ High pain detected. Prioritize recovery tomorrow.";
    if (readiness > 80) return "🔥 You're primed to push intensity this week.";
    if (streak < 3) return "Consistency is key. Short sessions still count.";
    return "Solid training rhythm. Maintain quality reps.";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-black text-white rounded-2xl p-4 border border-gray-800"
    >
      <div className="flex items-center gap-2 mb-2">
        <FaBrain className="text-orange-500" />
        <h3 className="font-semibold">AI Coach Insight</h3>
      </div>

      <p className="text-gray-300 text-sm">{insight()}</p>
    </motion.div>
  );
}
