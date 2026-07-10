import GeminiChatBox from "./GeminiChatBox";

export default function AICoachPanel({ sessions = [] }) {
  return <GeminiChatBox sessions={sessions} />;
}
