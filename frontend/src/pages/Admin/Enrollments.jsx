import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import API from "../../api";
import "../../App.css";

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);

  const [form, setForm] = useState({
    student: "",
    course: ""
  });

  useEffect(() => {
    fetchEnrollments();
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const res = await API.get("/enrollments/");
      const data = res.data?.results || res.data;
      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Enrollment fetch error:", err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await API.get("/users/");
      const data = res.data?.results || res.data;
      const list = Array.isArray(data) ? data : [];
      setStudents(list.filter(u => u.role === "student"));
    } catch (err) {
      console.error("Student fetch error:", err);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await API.get("/courses/");
      const data = res.data?.results || res.data;
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Course fetch error:", err);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.student || !form.course) {
      alert("Please select both student and course");
      return;
    }

    try {
      await API.post("/enrollments/", {
        student: Number(form.student),
        course: Number(form.course)
      });

      setForm({ student: "", course: "" });
      fetchEnrollments();

      alert("✅ Enrollment successful");
    } catch (err) {
      console.error(err);

      if (err.response?.data) {
        alert("⚠️ Student already enrolled in this course");
      } else {
        alert("❌ Server error");
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure to delete this enrollment?")) return;

    try {
      await API.delete(`/enrollments/${id}/`);
      fetchEnrollments();
    } catch (err) {
      console.error(err);
    }
  };

  const selectedStudent = students.find(
    s => s.id === Number(form.student)
  );

  const selectedCourse = courses.find(
    c => c.id === Number(form.course)
  );

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        <Navbar />

        <div className="content">

          <div className="header-box">
            <h2>Enrollment Management</h2>
            <p>Enroll students into courses</p>
          </div>

          {/* FORM */}
          <div className="card">
            <form onSubmit={handleSubmit} className="form-grid">

              {/* STUDENT */}
              <select
                name="student"
                value={form.student}
                onChange={handleChange}
                required
              >
                <option value="">Select Student</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.username} ({s.roll_number})
                  </option>
                ))}
              </select>

              {/* COURSE */}
              <select
                name="course"
                value={form.course}
                onChange={handleChange}
                required
              >
                <option value="">Select Course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.course_code})
                  </option>
                ))}
              </select>

              <button type="submit" className="btn-primary">
                Enroll
              </button>
            </form>

            <div style={{ marginTop: "15px" }}>
              {selectedStudent && (
                <p>
                  Dept: <strong>{selectedStudent.department}</strong>
                </p>
              )}

              {selectedCourse && (
                <p>
                  Teacher: <strong>{selectedCourse.teacher_name}</strong>
                </p>
              )}
            </div>
          </div>

          {/* TABLE */}
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student</th>
                  <th>Subject Code</th> {/* ✅ FIXED */}
                  <th>Course</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {enrollments.length === 0 ? (
                  <tr>
                    <td colSpan="5">No enrollments</td>
                  </tr>
                ) : (
                  enrollments.map(e => (
                    <tr key={e.id}>
                      <td>{e.student_id}</td>
                      <td>{e.student_name}</td>
                      <td>{e.course_id}</td> {/* now shows CS001 */}
                      <td>{e.course_title}</td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(e.id)}
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
    </div>
  );
}