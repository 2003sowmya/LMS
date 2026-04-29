import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import API from "../../api";
import "../../App.css";

function Marks() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [marksList, setMarksList] = useState([]);

  const [form, setForm] = useState({
    student: "",
    course: "",
    assessment_type: "",
    marks_obtained: "",
    max_marks: "",
  });

  // ================= FETCH =================
  useEffect(() => {
    fetchStudents();
    fetchCourses();
    fetchMarks();
  }, []);

  // ================= STUDENTS =================
  const fetchStudents = async () => {
    try {
      const res = await API.get("/users/?role=student");
      setStudents(res.data);
    } catch (err) {
      console.log("Error fetching students", err);
    }
  };

  // ================= COURSES =================
  const fetchCourses = async () => {
    try {
      const res = await API.get("/courses/");
      setCourses(res.data);
    } catch {
      console.log("Error fetching courses");
    }
  };

  // ================= MARKS =================
  const fetchMarks = async () => {
    try {
      const res = await API.get("/marks/");
      setMarksList(res.data);
    } catch {
      console.log("Error fetching marks");
    }
  };

  // ================= ADD =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.student || !form.course) {
      alert("Select student and course");
      return;
    }

    try {
      await API.post("/marks/", form);

      setForm({
        student: "",
        course: "",
        assessment_type: "",
        marks_obtained: "",
        max_marks: "",
      });

      fetchMarks();
    } catch {
      alert("Error saving marks");
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;

    try {
      await API.delete(`/marks/${id}/`);
      fetchMarks();
    } catch {
      alert("Error deleting");
    }
  };

  // ================= FILTER =================
  const filteredMarks = marksList.filter((m) => {
    return (
      (!form.student || m.student == form.student) &&
      (!form.course || m.course == form.course)
    );
  });

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        <Navbar />

        <div className="content">

          {/* HEADER */}
          <div className="header-box">
            <h2>Marks</h2>
            <p>Manage student assessments</p>
          </div>

          {/* FORM */}
          <div className="card">
            <h3>Add / Update Marks</h3>

            <form onSubmit={handleSubmit} className="form-grid">

              {/* STUDENT */}
              <select
                value={form.student}
                onChange={(e) =>
                  setForm({ ...form, student: e.target.value })
                }
              >
                <option value="">Select Student</option>

                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.username} ({s.roll_number || "No ID"})
                  </option>
                ))}
              </select>

              {/* COURSE */}
              <select
                value={form.course}
                onChange={(e) =>
                  setForm({ ...form, course: e.target.value })
                }
              >
                <option value="">Select Course</option>

                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>

              {/* TYPE */}
              <input
                placeholder="Assessment Type"
                value={form.assessment_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    assessment_type: e.target.value,
                  })
                }
              />

              {/* MARKS */}
              <input
                type="number"
                placeholder="Marks"
                value={form.marks_obtained}
                onChange={(e) =>
                  setForm({ ...form, marks_obtained: e.target.value })
                }
              />

              {/* MAX */}
              <input
                type="number"
                placeholder="Max Marks"
                value={form.max_marks}
                onChange={(e) =>
                  setForm({ ...form, max_marks: e.target.value })
                }
              />

              <button className="btn-primary" type="submit">
                Save Marks
              </button>
            </form>
          </div>

          {/* LIST */}
          <div className="card">
            <h3>Marks List</h3>

            {filteredMarks.length === 0 ? (
              <p>No marks for selected filter</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Type</th>
                    <th>Marks</th>
                    <th>Max</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMarks.map((m) => (
                    <tr key={m.id}>
                      <td>{m.student_name || m.student}</td>
                      <td>{m.course_title || m.course}</td>
                      <td>{m.assessment_type}</td>
                      <td>{m.marks_obtained}</td>
                      <td>{m.max_marks}</td>

                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(m.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default Marks;