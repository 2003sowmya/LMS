import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../api";

function Lectures() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [lectures, setLectures] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const [form, setForm] = useState({
    title: "",
    description: "",
    lecture_type: "recorded",
    video_file: null,
    meeting_link: "",
    scheduled_at: "",
  });

  useEffect(() => {
    if (!user) navigate("/");
  }, []);

  const fetchLectures = async () => {
    try {
      const res = await API.get("learning/lectures/");
      setLectures(res.data);
    } catch {
      console.log("Error loading lectures");
    }
  };

  useEffect(() => {
    fetchLectures();
  }, []);

  const handleSubmit = async () => {
    if (!form.title) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("lecture_type", form.lecture_type);

    if (form.lecture_type === "recorded" && form.video_file) {
      formData.append("video_file", form.video_file);
    }

    if (form.lecture_type === "live") {
      formData.append("meeting_link", form.meeting_link);
      formData.append("scheduled_at", form.scheduled_at);
    }

    try {
      await API.post("learning/lectures/", formData);
      setShowForm(false);
      fetchLectures();
    } catch {
      console.log("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const deleteLecture = async (id) => {
    if (!window.confirm("Delete this lecture?")) return;
    await API.delete(`learning/lectures/${id}/`);
    fetchLectures();
  };

  const filtered = lectures.filter((l) =>
    activeTab === "all" ? true : l.lecture_type === activeTab
  );

  const canUpload = user?.role === "admin" || user?.role === "teacher";

  return (
    <>
      <Navbar />

      <div style={styles.page}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h2>Lectures</h2>
            <p>{lectures.length} total lectures</p>
          </div>

          {canUpload && (
            <button style={styles.primaryBtn} onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "+ Add Lecture"}
            </button>
          )}
        </div>

        {/* FORM */}
        {showForm && (
          <div style={styles.formCard}>
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <select
              value={form.lecture_type}
              onChange={(e) =>
                setForm({ ...form, lecture_type: e.target.value })
              }
            >
              <option value="recorded">Recorded</option>
              <option value="live">Live</option>
            </select>

            {form.lecture_type === "recorded" && (
              <input type="file"
                onChange={(e) =>
                  setForm({ ...form, video_file: e.target.files[0] })
                }
              />
            )}

            {form.lecture_type === "live" && (
              <>
                <input
                  placeholder="Meeting link"
                  onChange={(e) =>
                    setForm({ ...form, meeting_link: e.target.value })
                  }
                />
                <input
                  type="datetime-local"
                  onChange={(e) =>
                    setForm({ ...form, scheduled_at: e.target.value })
                  }
                />
              </>
            )}

            <button onClick={handleSubmit}>
              {uploading ? "Uploading..." : "Save"}
            </button>
          </div>
        )}

        {/* TABS */}
        <div style={styles.tabs}>
          {["all", "recorded", "live"].map((tab) => (
            <button
              key={tab}
              style={activeTab === tab ? styles.activeTab : styles.tab}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* EMPTY STATE */}
        {filtered.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: 50 }}>📚</div>
            <h3>No lectures yet</h3>
            <p>Add lectures to see them here</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map((l) => (
              <div key={l.id} style={styles.card}>
                <h3>{l.title}</h3>

                {l.lecture_type === "recorded" && (
                  <a href={`http://127.0.0.1:8000${l.video_file}`} target="_blank">
                    ▶ Watch
                  </a>
                )}

                {l.lecture_type === "live" && (
                  <a href={l.meeting_link} target="_blank">
                    Join Live
                  </a>
                )}

                {canUpload && (
                  <button onClick={() => deleteLecture(l.id)}>Delete</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  page: {
    marginTop: "70px",
    padding: "30px",
    background: "#f1f5f9",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  primaryBtn: {
    background: "#2563eb",
    color: "#fff",
    padding: "10px 16px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  formCard: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "20px",
  },
  tabs: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },
  tab: {
    padding: "6px 12px",
    background: "#e2e8f0",
    border: "none",
  },
  activeTab: {
    padding: "6px 12px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
  },
  empty: {
    textAlign: "center",
    marginTop: "80px",
    color: "#64748b",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))",
    gap: "20px",
  },
  card: {
    background: "#fff",
    padding: "16px",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },
};

export default Lectures;