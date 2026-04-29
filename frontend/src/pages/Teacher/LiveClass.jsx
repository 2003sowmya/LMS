import React, { useState, useEffect } from "react";
import API from "../../api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "../../App.css";

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

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ===== FETCH =====
  const fetchSessions = async () => {
    try {
      const res = await API.get("/live-sessions/");
      const data = res.data?.results || res.data;
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      notify("Failed to load sessions");
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // ===== SCHEDULE =====
  const handleSchedule = async () => {
    if (!form.title || !form.date || !form.meeting_link) {
      notify("Title, date & meeting link required");
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
      notify("Failed to schedule");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* ===== HEADER ===== */}
      <div className="header-box">
        <h2>Live Classes</h2>
        <p>{sessions.length} sessions scheduled</p>
      </div>

      {/* ===== BUTTON ===== */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Schedule Class"}
        </button>
      </div>

      {/* ===== FORM ===== */}
      {showForm && (
        <div className="card">
          <div className="form-grid">

            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
            />

            <input
              type="time"
              value={form.time}
              onChange={(e) =>
                setForm({ ...form, time: e.target.value })
              }
            />

            <input
              placeholder="Meeting Link"
              value={form.meeting_link}
              onChange={(e) =>
                setForm({ ...form, meeting_link: e.target.value })
              }
            />

          </div>

          <div style={{ marginTop: 15 }}>
            <button className="btn-primary" onClick={handleSchedule}>
              {uploading ? "Scheduling..." : "Schedule"}
            </button>
          </div>
        </div>
      )}

      {/* ===== SESSIONS LIST ===== */}
      <div className="card">
        <h3 style={{ marginBottom: 15 }}>All Sessions</h3>

        {sessions.length === 0 ? (
          <p style={{ textAlign: "center" }}>No sessions available</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Time</th>
                <th>Join</th>
              </tr>
            </thead>

            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>{s.title}</td>
                  <td>{s.date}</td>
                  <td>{s.time || "-"}</td>

                  <td>
                    <a
                      href={s.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary"
                      style={{
                        padding: "6px 10px",
                        fontSize: "12px",
                        textDecoration: "none",
                      }}
                    >
                      Join
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== TOAST ===== */}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

// ===== WRAPPER =====
function LiveClass() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    API.get("/courses/")
      .then((res) => setCourses(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        <Navbar />

        <div className="content">
          <LiveClassPage courses={courses} />
        </div>
      </div>
    </div>
  );
}

export default LiveClass;