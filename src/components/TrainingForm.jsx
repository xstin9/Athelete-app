import { useState } from "react";

function TrainingForm({ onAddSession }) {
  const [event, setEvent] = useState("");
  const [type, setType] = useState("");
  const [time, setTime] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pain, setPain] = useState(0);

  function handleSubmit(e) {
    e.preventDefault();

    onAddSession({
      event,
      type,
      time: parseFloat(time),
      feedback,
      pain,
      date: new Date().toLocaleDateString(),
    });

    setEvent("");
    setType("");
    setTime("");
    setFeedback("");
    setPain(0);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add Training Session</h3>

      <input placeholder="Event (200m)" value={event}
        onChange={(e) => setEvent(e.target.value)} />

      <input placeholder="Session Type" value={type}
        onChange={(e) => setType(e.target.value)} />

      <input placeholder="Time (21.50)" value={time}
        onChange={(e) => setTime(e.target.value)} />

      <input placeholder="Feedback (felt strong)"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)} />

      <input type="number" placeholder="Pain (0–10)"
        value={pain}
        onChange={(e) => setPain(e.target.value)} />

      <button>Add</button>
    </form>
  );
}

export default TrainingForm;
