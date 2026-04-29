import React, { useState, useEffect } from "react";
import API from "../../api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "../../App.css";

function AssignmentsPage({ courses }) {
  const [assignments, setAssignments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    course_id: "",
    max_marks: 100,
    reference_file: null,
  });

  const [toast, setToast] = useState(null);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ===== FORMAT FOR INPUT =====
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toISOString().slice(0, 16);
  };

  // ===== FETCH =====
  const fetchAssignments = async () => {
    try {
      const res = await API.get("/assignments/");
      const data = res.data?.results || res.data;
      setAssignments(Array.isArray(data) ? data : []);
    } catch {
      notify("Failed to load assignments", "error");
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // ===== CREATE / UPDATE =====
  const handleSubmit = async () => {
    if (!form.title || !form.course_id) {
      notify("Title & Course required", "error");
      return;
    }

    try {
      const payload = new FormData();

      payload.append("title", form.title);
      payload.append("description", form.description);
      payload.append(
        "due_date",
        form.due_date ? new Date(form.due_date).toISOString() : ""
      );
      payload.append("course", Number(form.course_id));
      payload.append("max_marks", form.max_marks);

      if (form.reference_file) {
        payload.append("reference_file", form.reference_file);
      }

      if (editingId) {
        await API.put(`/assignments/${editingId}/`, payload);
        notify("Updated successfully ✅");
      } else {
        await API.post("/assignments/", payload);
        notify("Created successfully ✅");
      }

      resetForm();
      fetchAssignments();
    } catch {
      notify("Operation failed ❌", "error");
    }
  };

  // ===== EDIT =====
  const handleEdit = (a) => {
    setShowForm(true);
    setEditingId(a.id);

    setForm({
      title: a.title,
      description: a.description || "",
      due_date: formatDateForInput(a.due_date),
      course_id: a.course,
      max_marks: a.max_marks,
      reference_file: null,
    });
  };

  // ===== DELETE =====
  const deleteAssignment = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;

    try {
      await API.delete(`/assignments/${id}/`);
      notify("Deleted");
      fetchAssignments();
    } catch {
      notify("Delete failed", "error");
    }
  };

  // ===== RESET =====
  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      due_date: "",
      course_id: "",
      max_marks: 100,
      reference_file: null,
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div>

      {/* ===== TOAST ===== */}
      {toast && <div className="toast">{toast.msg}</div>}

      {/* ===== HEADER ===== */}
      <div className="header-box">
        <h2>Assignments</h2>
        <p>{assignments.length} total assignments</p>
      </div>

      {/* ===== BUTTON ===== */}
      <div style={{ textAlign: "center", marginBottom: 15 }}>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New Assignment"}
        </button>
      </div>

      {/* ===== FORM ===== */}
      {showForm && (
        <div className="card">
          <h3>{editingId ? "Edit Assignment" : "Create Assignment"}</h3>

          <div className="form-grid">

            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />

            <input
              type="datetime-local"
              value={form.due_date}
              onChange={(e) =>
                setForm({ ...form, due_date: e.target.value })
              }
            />

            <select
              value={form.course_id}
              onChange={(e) =>
                setForm({ ...form, course_id: e.target.value })
              }
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Max Marks"
              value={form.max_marks}
              onChange={(e) =>
                setForm({ ...form, max_marks: e.target.value })
              }
            />

            <input
              type="file"
              onChange={(e) =>
                setForm({
                  ...form,
                  reference_file: e.target.files[0],
                })
              }
            />

          </div>

          <div style={{ marginTop: 15 }}>
            <button className="btn-primary" onClick={handleSubmit}>
              {editingId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* ===== TABLE ===== */}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {assignments.map((a) => {
              const overdue =
                a.due_date && new Date(a.due_date) < new Date();

              return (
                <tr key={a.id}>
                  <td>{a.title}</td>

                  <td>
                    {a.due_date
                      ? new Date(a.due_date).toLocaleString()
                      : "---"}
                  </td>

                  <td style={{ color: overdue ? "red" : "green" }}>
                    {overdue ? "Overdue" : "Active"}
                  </td>

                  <td>
                    <button
                      className="btn-primary"
                      onClick={() => handleEdit(a)}
                      style={{ marginRight: 8 }}
                    >
                      Edit
                    </button>

                    <button
                      className="btn-delete"
                      onClick={() => deleteAssignment(a.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

        </table>
      </div>
    </div>
  );
}

// ===== MAIN =====
export default function Assignment() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    API.get("/courses/")
      .then((res) => {
        const data = res.data?.results || res.data;
        setCourses(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <Navbar />
        <div className="content">
          <AssignmentsPage courses={courses} />
        </div>
      </div>
    </div>
  );
}