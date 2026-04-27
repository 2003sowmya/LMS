import React, { useState, useEffect } from "react";
import API from "../../api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

function AssignmentsPage({ courses }) {
  const [assignments, setAssignments] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    course_id: "",
    target_group: "All Students",
    max_marks: 100,
    allowed_types: ["PDF", "DOCX"],
    reference_file: null,
  });

  const [toast, setToast] = useState(null);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ================= FETCH =================
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

  // ================= CREATE =================
  const createAssignment = async () => {
    if (!form.title || !form.course_id) {
      notify("Title and Course required", "error");
      return;
    }

    try {
      const payload = new FormData();

      payload.append("title", form.title);
      payload.append("description", form.description);
      payload.append("due_date", form.due_date || "");
      payload.append("course", Number(form.course_id));
      payload.append("max_marks", form.max_marks);
      payload.append("target_group", form.target_group);
      payload.append("allowed_types", form.allowed_types.join(","));

      if (form.reference_file) {
        payload.append("reference_file", form.reference_file);
      }

      await API.post("/assignments/", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      notify("Assignment created successfully!");
      setShowForm(false);

      setForm({
        title: "",
        description: "",
        due_date: "",
        course_id: "",
        target_group: "All Students",
        max_marks: 100,
        allowed_types: ["PDF", "DOCX"],
        reference_file: null,
      });

      fetchAssignments();
    } catch {
      notify("Create failed", "error");
    }
  };

  // ================= DELETE =================
  const deleteAssignment = async (id) => {
    try {
      await API.delete(`/assignments/${id}/`);
      notify("Deleted");
      fetchAssignments();
    } catch {
      notify("Delete failed", "error");
    }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            padding: "10px 16px",
            borderRadius: 10,
            background: toast.type === "error" ? "#ffe5e5" : "#e6ffed",
            color: toast.type === "error" ? "red" : "green",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="header-box">
        <h2>Assignments</h2>
        <p>{assignments.length} total assignments</p>
      </div>

      {/* Toggle */}
      <div style={{ marginBottom: 15 }}>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New Assignment"}
        </button>
      </div>

      {/* ================= FORM ================= */}
      {showForm && (
        <div className="card">
          <h3>Create Assignment</h3>

          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
          />

          <textarea
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

          <button onClick={createAssignment}>Create</button>
        </div>
      )}

      {/* ================= TABLE ================= */}
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
            {assignments.length === 0 ? (
              <tr>
                <td colSpan="4">No assignments</td>
              </tr>
            ) : (
              assignments.map((a) => {
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

                    <td>{overdue ? "Overdue" : "Active"}</td>

                    <td>
                      <button onClick={() => deleteAssignment(a.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ================= MAIN =================
function Assignment() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    API.get("/courses/")
      .then((res) => setCourses(res.data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="main">
      <Sidebar />
      <div className="content">
        <Navbar />
        <AssignmentsPage courses={courses} />
      </div>
    </div>
  );
}

export default Assignment;