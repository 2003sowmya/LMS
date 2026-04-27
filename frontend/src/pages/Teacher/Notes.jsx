import React, { useState, useEffect } from "react";
import API from "../../api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

function NotesPage({ courses }) {
  const [notes, setNotes] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    course_id: "",
    chapter: "",
    description: "",
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
      setNotes(res.data);
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
      notify("Uploaded!");
      setShowForm(false);
      fetchNotes();

      // reset form
      setForm({
        title: "",
        course_id: "",
        chapter: "",
        description: "",
        file: null,
      });

    } catch (err) {
      console.log(err);
      notify("Upload failed", "error");
    }
  };

  return (
    <div>

      {/* Toast */}
      {toast && <div>{toast.msg}</div>}

      <h2>Notes</h2>

      {/* Toggle */}
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "Upload Notes"}
      </button>

      {/* ================= FORM ================= */}
      {showForm && (
        <div>
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <input
            type="file"
            onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
          />

          <button onClick={handleUpload}>Upload</button>
        </div>
      )}

      {/* ================= LIST ================= */}
      <h3>All Notes</h3>

      {notes.length === 0 ? (
        <p>No notes available</p>
      ) : (
        notes.map((n) => (
          <div key={n.id} style={{ marginBottom: 10 }}>
            
            <strong>{n.title}</strong>

            {/* ✅ THIS IS THE IMPORTANT FIX */}
            {n.file && (
              <div>
                <a
                  href= {n.file}
                  target="_blank"
                  rel="noreferrer"
                >
                  📄 View File
                </a>
              </div>
            )}

          </div>
        ))
      )}
    </div>
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
    <div className="main">
      <Sidebar />
      <div className="content">
        <Navbar />
        <NotesPage courses={courses} />
      </div>
    </div>
  );
}

export default Notes;