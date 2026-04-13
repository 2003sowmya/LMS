import React, { useEffect, useState } from "react";
import API from "../api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function StudentCourses() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const res = await API.get("enrollments/");
    const myCourses = res.data.filter(
      (e) => (e.student?.id || e.student) === user.id
    );
    setCourses(myCourses);
  };

  return (
    <div className="main">
      <Sidebar />

      <div className="content">
        <Navbar />

        <h2>My Courses</h2>

        <div className="cards">
          {courses.map((c, i) => (
            <div key={i} className="dashboard-card orange">
              <h4>{c.course?.title || `Course ${c.course}`}</h4>
              <button style={{ marginTop: "10px" }}>Open</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StudentCourses;