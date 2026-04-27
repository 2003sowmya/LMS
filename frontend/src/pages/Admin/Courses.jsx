import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import API from "../../api";
import "../../App.css";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    teacher: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [assignMode, setAssignMode] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ================= FETCH =================
  const fetchCourses = async () => {
    try {
      const res = await API.get("/courses/");
      const data = res.data?.results || res.data;
      setCourses(Array.isArray(data) ? data : []);
    } catch {
      showToast("❌ Failed to load courses");
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await API.get("/users/");
      const data = res.data?.results || res.data;
      const list = Array.isArray(data) ? data : [];
      setTeachers(list.filter((u) => u.role === "teacher"));
    } catch {
      showToast("❌ Failed to load teachers");
    }
  };

  // ================= INPUT =================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ================= ADD COURSE =================
  const handleAddCourse = async () => {
    if (!form.title || !form.description) {
      return showToast("⚠️ Enter title & description");
    }

    try {
      await API.post("/courses/", {
        title: form.title,
        description: form.description
        // ✅ NO teacher here
      });

      showToast("✅ Course created");
      resetForm();
      fetchCourses();
    } catch (err) {
      console.log(err.response?.data);
      showToast("❌ Failed to create course");
    }
  };

  // ================= ASSIGN TEACHER =================
  const handleAssignTeacher = async () => {
    if (!form.teacher) return showToast("⚠️ Select teacher");

    try {
      await API.patch(`/courses/${editingId}/`, {
        teacher: Number(form.teacher)
      });

      showToast("👨‍🏫 Teacher assigned");
      resetForm();
      fetchCourses();
    } catch (err) {
      console.log(err.response?.data);
      showToast("❌ Failed to assign teacher");
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete course?")) return;

    try {
      await API.delete(`/courses/${id}/`);
      fetchCourses();
      showToast("🗑️ Deleted");
    } catch {
      showToast("❌ Delete failed");
    }
  };

  // ================= MODE =================
  const handleAssignClick = (course) => {
    setEditingId(course.id);
    setAssignMode(true);
    setForm({ title: "", description: "", teacher: "" });
  };

  const resetForm = () => {
    setForm({ title: "", description: "", teacher: "" });
    setEditingId(null);
    setAssignMode(false);
  };

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        <Navbar />

        <div className="content">
          <h1>Course Management</h1>

          {/* FORM */}
          <div className="card">
            <div className="form-grid">

              {!assignMode && (
                <>
                  <input
                    name="title"
                    placeholder="Course Title"
                    value={form.title}
                    onChange={handleChange}
                  />

                  <input
                    name="description"
                    placeholder="Description"
                    value={form.description}
                    onChange={handleChange}
                  />

                  <button onClick={handleAddCourse}>
                    Add Course
                  </button>
                </>
              )}

              {assignMode && (
                <>
                  <select
                    name="teacher"
                    value={form.teacher}
                    onChange={handleChange}
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.username}
                      </option>
                    ))}
                  </select>

                  <button onClick={handleAssignTeacher}>
                    Assign Teacher
                  </button>
                </>
              )}

              {editingId && (
                <button onClick={resetForm}>Cancel</button>
              )}
            </div>
          </div>

          {/* TABLE */}
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Description</th>
                  <th>Teacher</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan="4">No courses</td>
                  </tr>
                ) : (
                  courses.map((c) => (
                    <tr key={c.id}>
                      <td>{c.title}</td>
                      <td>{c.description}</td>
                      <td>{c.teacher_name || "Not Assigned"}</td>

                      <td>
                        <button onClick={() => handleAssignClick(c)}>
                          Assign Teacher
                        </button>

                        <button onClick={() => handleDelete(c.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}