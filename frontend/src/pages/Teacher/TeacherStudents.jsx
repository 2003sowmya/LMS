import React, { useEffect, useState } from "react";
import API from "../../api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "../../App.css";

export default function TeacherStudents() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      // ✅ FIXED URL
      const res = await API.get("/teacher/students/");

      const data = res.data?.results || res.data;

      setStudents(Array.isArray(data) ? data : []);
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

          {/* ===== HEADER ===== */}
          <div className="header-box">
            <h2>My Students</h2>
            <p>Students enrolled in your courses</p>
          </div>

          {/* ===== CARD ===== */}
          <div className="card">
            <h3 style={{ marginBottom: 15 }}>Student List</h3>

            {students.length === 0 ? (
              <p style={{ textAlign: "center" }}>
                No students found
              </p>
            ) : (
              <div className="table-container">
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
                        {/* ✅ FIXED FIELD NAMES */}
                        <td>{s.student_name}</td>
                        <td>{s.email}</td>
                        <td>{s.course}</td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}