import React, { useEffect, useState } from "react";
import API from "../api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

/* helpers */
function formatDate(raw) {
  if (!raw) return "—";
  return new Date(raw).toLocaleString();
}

function isOverdue(due_date) {
  return due_date && new Date(due_date) < new Date();
}

function Assignments() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [assignments, setAssignments] = useState([]);
  const [file, setFile] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    course: ""   // ✅ IMPORTANT (backend needs course)
  });

  // ================= FETCH =================
  const fetchAssignments = async () => {
    try {
      const res = await API.get("assignments/"); // ✅ FIXED
      setAssignments(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // ================= CREATE =================
  const createAssignment = async () => {
    try {
      await API.post("assignments/", form); // ✅ FIXED
      setForm({ title: "", description: "", due_date: "", course: "" });
      setShowForm(false);
      fetchAssignments();
    } catch (err) {
      console.log(err);
    }
  };

  // ================= SUBMIT =================
  const submitAssignment = async (assignmentId) => {
    if (!file) return alert("Upload file first");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("assignment", assignmentId);

    try {
      await API.post("submissions/", formData); // ✅ FIXED (if exists)
      alert("Submitted!");
      setFile(null);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="main">
      <Sidebar />

      <div className="content">
        <Navbar />

        <h2>Assignments</h2>

        {/* CREATE BUTTON */}
        {user.role === "teacher" && (
          <button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "New Assignment"}
          </button>
        )}

        {/* FORM */}
        {showForm && (
          <div>
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <input
              placeholder="Course ID"
              value={form.course}
              onChange={(e) =>
                setForm({ ...form, course: e.target.value })
              }
            />

            <input
              type="datetime-local"
              value={form.due_date}
              onChange={(e) =>
                setForm({ ...form, due_date: e.target.value })
              }
            />

            <button onClick={createAssignment}>Create</button>
          </div>
        )}

        {/* LIST */}
        <div style={{ marginTop: "20px" }}>
          {assignments.map((a) => (
            <div key={a.id} className="dashboard-card">
              <h3>{a.title}</h3>
              <p>{formatDate(a.due_date)}</p>

              {user.role === "student" && (
                <>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  <button onClick={() => submitAssignment(a.id)}>
                    Submit
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default Assignments;