import React, { useEffect, useState } from "react";
import API from "../../api";                    // ✅ FIXED
import Sidebar from "../../components/Sidebar"; // ✅ FIXED
import Navbar from "../../components/Navbar";   // ✅ FIXED
import { useNavigate } from "react-router-dom";

function StudentCourses() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await API.get("enrollments/");
      const myCourses = res.data.filter(
        (e) => (e.student?.id || e.student) === user.id
      );
      setCourses(myCourses);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="main">
      <Sidebar />

      <div className="content">
        <Navbar />

        <div className="page-header">
          <h2>My Courses</h2>
          <p>Access all your enrolled courses</p>
        </div>

        <div className="course-grid">
          {courses.length === 0 ? (
            <p>No courses enrolled</p>
          ) : (
            courses.map((c, i) => (
              <div key={i} className="course-card">
                <div className="course-top">
                  <h3>{c.course?.title || `Course ${i + 1}`}</h3>
                  <span className="tag">Active</span>
                </div>

                <p className="course-desc">
                  Learn and explore course materials, lectures, and assignments.
                </p>

                <button
                  onClick={() => navigate(`/course/${c.course?.id}`)}
                >
                  Open Course
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentCourses;