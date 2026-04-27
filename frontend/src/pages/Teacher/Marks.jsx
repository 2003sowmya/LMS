import React, { useEffect, useState } from "react";
import API from "../../api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

function Marks() {
  const [marks, setMarks] = useState([]);

  const [form, setForm] = useState({
    student: "",
    course: "",
    assessment_type: "",
    marks_obtained: "",
    max_marks: "",
  });

  const fetchMarks = async () => {
    try {
      const res = await API.get("/marks/");
      setMarks(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchMarks();
  }, []);

  const handleSubmit = async () => {
    try {
      await API.post("/marks/", form);
      fetchMarks();

      setForm({
        student: "",
        course: "",
        assessment_type: "",
        marks_obtained: "",
        max_marks: "",
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="main">
      <Sidebar />

      <div className="content">
        <Navbar />

        <h2>Marks</h2>

        {/* ADD MARK */}
        <div style={{ marginBottom: 20 }}>
          <input
            placeholder="Student ID"
            value={form.student}
            onChange={(e) =>
              setForm({ ...form, student: e.target.value })
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
            placeholder="Assessment Type (Exam/Test)"
            value={form.assessment_type}
            onChange={(e) =>
              setForm({ ...form, assessment_type: e.target.value })
            }
          />

          <input
            placeholder="Marks Obtained"
            value={form.marks_obtained}
            onChange={(e) =>
              setForm({ ...form, marks_obtained: e.target.value })
            }
          />

          <input
            placeholder="Max Marks"
            value={form.max_marks}
            onChange={(e) =>
              setForm({ ...form, max_marks: e.target.value })
            }
          />

          <button onClick={handleSubmit}>Add</button>
        </div>

        {/* LIST */}
        {marks.length === 0 ? (
          <p>No marks available</p>
        ) : (
          marks.map((m) => (
            <div key={m.id}>
              Student: {m.student} | Course: {m.course} | 
              Type: {m.assessment_type} | 
              Score: {m.marks_obtained}/{m.max_marks}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Marks;