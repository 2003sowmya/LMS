import React, { useEffect, useState } from "react";
import API from "../../api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

export default function TeacherStudents() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await API.get("/teacher-students/");
      setStudents(res.data);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        <Navbar />

        <div className="content">
          {/* HEADER */}
          <div className="header-box">
            <h2>My Students</h2>
            <p>Students enrolled in your courses</p>
          </div>

          {/* TABLE */}
          <div className="card">
            {students.length === 0 ? (
              <p>No students found</p>
            ) : (
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Course</th>
                  </tr>
                </thead>

                <tbody>
                  {students.map((s, index) => (
                    <tr key={index}>
                      <td>{s.student_name}</td>
                      <td>{s.student_email}</td>
                      <td>{s.course_title}</td>
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