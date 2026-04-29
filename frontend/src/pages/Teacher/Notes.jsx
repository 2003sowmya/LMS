import React, { useState, useEffect } from "react";
import API from "../../api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "../../App.css";

function NotesPage({ courses }) {
  const [notes, setNotes] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    file: null,
  });

  const [toast, setToast] = useState(null);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ================= FETCH =================
  const fetchNotes = async () => {
    try {
      const res = await API.get("/notes/");
      const data = res.data?.results || res.data;
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // ================= UPLOAD =================
  const handleUpload = async () => {
    if (!form.title || !form.file) {
      notify("Title and file required", "error");
      return;
    }

    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("file", form.file);

    try {
      await API.post("/notes/", fd);
      notify("Uploaded successfully!");
      setShowForm(false);
      fetchNotes();

      setForm({
        title: "",
        file: null,
      });

    } catch (err) {
      console.log(err);
      notify("Upload failed", "error");
    }
  };

  return (
    <>
      {/* ===== HEADER ===== */}
      <div className="header-box">
        <h2>Notes</h2>
        <p>Manage your study materials</p>
      </div>

      {/* ===== BUTTON ===== */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Upload Notes"}
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
              type="file"
              onChange={(e) =>
                setForm({ ...form, file: e.target.files[0] })
              }
            />

          </div>

          <div style={{ marginTop: 15 }}>
            <button className="btn-primary" onClick={handleUpload}>
              Upload
            </button>
          </div>
        </div>
      )}

      {/* ===== LIST ===== */}
      <div className="card">
        <h3 style={{ marginBottom: 15 }}>All Notes</h3>

        {notes.length === 0 ? (
          <p style={{ textAlign: "center" }}>
            No notes available
          </p>
        ) : (
          <div className="table-container">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>File</th>
                </tr>
              </thead>

              <tbody>
                {notes.map((n) => (
                  <tr key={n.id}>
                    <td>{n.title}</td>

                    <td>
                      {n.file && (
                        <a
                          href={n.file}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary"
                          style={{
                            padding: "6px 10px",
                            fontSize: "12px",
                            textDecoration: "none",
                          }}
                        >
                          View File
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </div>

      {/* ===== TOAST ===== */}
      {toast && (
        <div className="toast">
          {toast.msg}
        </div>
      )}
    </>
  );
}

// ================= WRAPPER =================
function Notes() {
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
          <NotesPage courses={courses} />
        </div>
      </div>
    </div>
  );
}

export default Notes;