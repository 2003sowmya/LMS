import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import API from "../../api";

function StudentGrades() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [grades, setGrades] = useState([]);

  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      const res = await API.get("learning/submissions/");

      // Filter only this student's grades
      const myGrades = res.data.filter(
        (g) =>
          g.student === user.id ||
          g.student?.id === user.id ||
          g.student_name === user.username
      );

      setGrades(myGrades);
    } catch (err) {
      console.log("Error loading grades:", err);
    }
  };

  return (
    <div className="layout">
      {/* ✅ FIXED PATH */}
      <Sidebar />

      <div className="main">
        <Navbar />

        <div className="content">
          <h2>My Grades</h2>

          {grades.length === 0 ? (
            <p>No grades available</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Course</th>
                  <th>Marks</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g) => (
                  <tr key={g.id}>
                    <td>{g.assignment_title || "N/A"}</td>
                    <td>{g.course_title || "N/A"}</td>
                    <td>{g.marks ?? "Not graded"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentGrades;