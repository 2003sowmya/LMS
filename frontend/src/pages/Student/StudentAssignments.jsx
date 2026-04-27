import React, { useEffect, useState } from "react";
import API from "../../api";              // ✅ FIXED
import Sidebar from "../../components/Sidebar";   // ✅ FIXED
import Navbar from "../../components/Navbar";     // ✅ FIXED

/* ===== HELPERS ===== */
function formatDate(raw) {
  if (!raw) return "—";
  return new Date(raw).toLocaleString();
}

function isOverdue(due_date) {
  return due_date && new Date(due_date) < new Date();
}

function StudentAssignments() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role?.toLowerCase();

  const [assignments, setAssignments] = useState([]);
  const [files, setFiles] = useState({});

  // 👉 Teacher form
  const [showForm, setShowForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    due_date: ""
  });

  /* ===== FETCH ===== */
  const fetchAssignments = async () => {
    try {
      const res = await API.get("learning/assignments/");
      setAssignments(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  /* ===== STUDENT SUBMIT ===== */
  const submitAssignment = async (assignmentId) => {
    const file = files[assignmentId];

    if (!file) {
      alert("Please upload file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("assignment", assignmentId);

    try {
      await API.post("learning/submissions/", formData);
      alert("Assignment Submitted ✅");

      setFiles((prev) => ({ ...prev, [assignmentId]: null }));
    } catch (err) {
      console.log(err);
    }
  };

  /* ===== TEACHER CREATE ===== */
  const createAssignment = async () => {
    try {
      await API.post("learning/assignments/", newAssignment);
      alert("Assignment Created ✅");

      setNewAssignment({ title: "", description: "", due_date: "" });
      setShowForm(false);
      fetchAssignments();
    } catch (err) {
      console.log(err);
    }
  };

  /* ===== TEACHER DELETE ===== */
  const deleteAssignment = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;

    try {
      await API.delete(`learning/assignments/${id}/`);
      fetchAssignments();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="main">
      <Sidebar />

      <div className="content">
        <Navbar />

        {/* HEADER */}
        <div className="page-header">
          <h2>Assignments</h2>

          {role === "teacher" ? (
            <button onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "+ Create Assignment"}
            </button>
          ) : (
            <p>View and submit your assignments</p>
          )}
        </div>

        {/* ===== TEACHER FORM ===== */}
        {role === "teacher" && showForm && (
          <div className="assignment-card">
            <input
              placeholder="Title"
              value={newAssignment.title}
              onChange={(e) =>
                setNewAssignment({ ...newAssignment, title: e.target.value })
              }
            />

            <textarea
              placeholder="Description"
              value={newAssignment.description}
              onChange={(e) =>
                setNewAssignment({
                  ...newAssignment,
                  description: e.target.value,
                })
              }
            />

            <input
              type="date"
              value={newAssignment.due_date}
              onChange={(e) =>
                setNewAssignment({
                  ...newAssignment,
                  due_date: e.target.value,
                })
              }
            />

            <button onClick={createAssignment}>Create</button>
          </div>
        )}

        {/* GRID */}
        <div className="assignment-grid">
          {assignments.length === 0 ? (
            <p>No assignments available</p>
          ) : (
            assignments.map((a) => (
              <div key={a.id} className="assignment-card">

                {/* TOP */}
                <div className="assignment-top">
                  <h3>{a.title}</h3>

                  <span
                    className={
                      isOverdue(a.due_date)
                        ? "status overdue"
                        : "status"
                    }
                  >
                    {isOverdue(a.due_date) ? "Overdue" : "Active"}
                  </span>
                </div>

                {/* DESCRIPTION */}
                <p className="desc">
                  {a.description || "No description"}
                </p>

                {/* DATE */}
                <p className="date">
                  Due: {formatDate(a.due_date)}
                </p>

                {/* ===== STUDENT VIEW ===== */}
                {role === "student" && (
                  <div className="submit-box">
                    <input
                      type="file"
                      onChange={(e) =>
                        setFiles({
                          ...files,
                          [a.id]: e.target.files[0],
                        })
                      }
                    />

                    <button onClick={() => submitAssignment(a.id)}>
                      Submit
                    </button>
                  </div>
                )}

                {/* ===== TEACHER VIEW ===== */}
                {role === "teacher" && (
                  <button onClick={() => deleteAssignment(a.id)}>
                    Delete
                  </button>
                )}

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentAssignments;