import React, { useState, useEffect } from "react";
import API from "../../api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

const S = {
  pageHeader: {},
  pageTitle: {},
  card: {},
  cardTitle: {},
  formRow: {},
  formGroup: {},
  label: {},
  input: {},
  select: {},
  textarea: {},
  btnPrimary: {},
};

function LiveClassPage({ courses }) {
  const [form, setForm] = useState({
    title: "",
    course_id: "",
    date: "",
    time: "",
    duration: 60,
    meeting_link: "",
    agenda: "",
  });

  const [sessions, setSessions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [reminder, setReminder] = useState(true);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSessions = async () => {
    try {
      const res = await API.get("/live-sessions/");
      setSessions(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSchedule = async () => {
    if (!form.title || !form.date || !form.meeting_link) {
      notify("Title, date and meeting link are required", "error");
      return;
    }

    setUploading(true);

    try {
      await API.post("/live-sessions/", {
        title: form.title,
        course: form.course_id || null,
        date: form.date,
        time: form.time,
        duration: form.duration,
        meeting_link: form.meeting_link,
        agenda: form.agenda,
        send_reminder: reminder,
      });

      notify("Session scheduled!");
      setShowForm(false);

      setForm({
        title: "",
        course_id: "",
        date: "",
        time: "",
        duration: 60,
        meeting_link: "",
        agenda: "",
      });

      fetchSessions();
    } catch {
      notify("Failed to schedule", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {toast && <div>{toast.msg}</div>}

      <h2>Live Classes</h2>

      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "Schedule"}
      </button>

      {showForm && (
        <div>
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          <input
            placeholder="Meeting Link"
            value={form.meeting_link}
            onChange={(e) =>
              setForm({ ...form, meeting_link: e.target.value })
            }
          />

          <button onClick={handleSchedule}>
            {uploading ? "Scheduling..." : "Schedule"}
          </button>
        </div>
      )}

      <h3>Sessions</h3>

      {sessions.map((s) => (
        <div key={s.id}>
          {s.title} - {s.date}
        </div>
      ))}
    </div>
  );
}

// ✅ FIXED WRAPPER WITH LAYOUT
function LiveClass() {
  return (
    <div className="main">
      <Sidebar />

      <div className="content">
        <Navbar />
        <LiveClassPage courses={[]} />
      </div>
    </div>
  );
}

export default LiveClass;