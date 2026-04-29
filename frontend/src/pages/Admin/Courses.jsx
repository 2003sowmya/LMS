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
    course_code: "",   // ✅ ADDED
    teacher: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [assignMode, setAssignMode] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
  }, []);

  // ===== TOAST =====
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ===== FETCH =====
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

  // ===== INPUT =====
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ===== ADD COURSE =====
  const handleAddCourse = async () => {
    if (!form.title || !form.description || !form.course_code) {
      return showToast("⚠️ Enter all fields");
    }

    try {
      await API.post("/courses/", {
        title: form.title,
        description: form.description,
        course_code: form.course_code   // ✅ ADDED
      });

      showToast("✅ Course created");
      resetForm();
      fetchCourses();
    } catch (err) {
      console.log(err.response?.data);
      showToast("❌ Failed to create course");
    }
  };

  // ===== EDIT COURSE =====
  const handleEditCourse = (course) => {
    setForm({
      title: course.title,
      description: course.description,
      course_code: course.course_code || "", // ✅ ADDED
      teacher: ""
    });

    setEditingId(course.id);
    setAssignMode(false);
  };

  // ===== UPDATE COURSE =====
  const handleUpdateCourse = async () => {
    if (!form.title || !form.description || !form.course_code) {
      return showToast("⚠️ Enter all fields");
    }

    try {
      await API.put(`/courses/${editingId}/`, {
        title: form.title,
        description: form.description,
        course_code: form.course_code   // ✅ ADDED
      });

      showToast("✅ Course updated");
      resetForm();
      fetchCourses();
    } catch (err) {
      console.log(err.response?.data);
      showToast("❌ Failed to update");
    }
  };

  // ===== ASSIGN TEACHER =====
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

  // ===== DELETE =====
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

  // ===== MODE SWITCH =====
  const handleAssignClick = (course) => {
    setEditingId(course.id);
    setAssignMode(true);
    setForm({ title: "", description: "", course_code: "", teacher: "" });
  };

  const resetForm = () => {
    setForm({ title: "", description: "", course_code: "", teacher: "" });
    setEditingId(null);
    setAssignMode(false);
  };

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        <Navbar />

        <div className="content">

          {/* HEADER */}
          <div className="header-box">
            <h2>Course Management</h2>
          </div>

          {/* FORM */}
          <div className="card">
            <div className="form-grid">

              {!assignMode && (
                <>
                  {/* ✅ SUBJECT CODE */}
                  <input
                    name="course_code"
                    placeholder="Subject Code (e.g CS201)"
                    value={form.course_code}
                    onChange={handleChange}
                  />

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

                  <button
                    className="btn-primary"
                    onClick={editingId ? handleUpdateCourse : handleAddCourse}
                  >
                    {editingId ? "Update Course" : "Add Course"}
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

                  <button
                    className="btn-edit"
                    onClick={handleAssignTeacher}
                  >
                    Assign Teacher
                  </button>
                </>
              )}

              {editingId && (
                <button
                  className="btn-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}

            </div>
          </div>

          {/* TABLE */}
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Code</th> {/* ✅ ADDED */}
                  <th>Course</th>
                  <th>Description</th>
                  <th>Teacher</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan="5">No courses available</td>
                  </tr>
                ) : (
                  courses.map((c) => (
                    <tr key={c.id}>
                      <td>{c.course_code}</td> {/* ✅ ADDED */}
                      <td>{c.title}</td>
                      <td>{c.description}</td>
                      <td>{c.teacher_name || "Not Assigned"}</td>

                      <td>
                        <button
                          className="btn-edit"
                          onClick={() => handleEditCourse(c)}
                        >
                          Edit
                        </button>

                        <button
                          className="btn-edit"
                          onClick={() => handleAssignClick(c)}
                        >
                          Assign Teacher
                        </button>

                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(c.id)}
                        >
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

      {/* TOAST */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}