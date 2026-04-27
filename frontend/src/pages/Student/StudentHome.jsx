import React, { useEffect, useState } from "react";
import API from "../../api";                    // ✅ FIXED
import Sidebar from "../../components/Sidebar"; // ✅ FIXED
import Navbar from "../../components/Navbar";   // ✅ FIXED

function StudentHome() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [lectures, setLectures] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [enrollRes, assignRes, lectureRes] = await Promise.all([
        API.get("enrollments/"),
        API.get("assignments/"),
        API.get("lectures/"),
      ]);

      const myEnrollments = enrollRes.data.filter(
        (e) => (e.student?.id || e.student) === user.id
      );

      const courseIds = myEnrollments.map(
        (e) => e.course?.id || e.course
      );

      setCourses(myEnrollments);

      setAssignments(
        assignRes.data.filter((a) =>
          courseIds.includes(a.course?.id || a.course)
        )
      );

      setLectures(
        lectureRes.data.filter((l) =>
          courseIds.includes(l.course?.id || l.course)
        )
      );

    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="main">
      <Sidebar />

      <div className="content">
        <Navbar />

        <div className="header-box">
          <h2>Welcome, {user?.username}</h2>
          <p>Student Dashboard</p>
        </div>

        <div className="cards">
          <div className="dashboard-card blue">
            <h4>Courses</h4>
            <h2>{courses.length}</h2>
          </div>

          <div className="dashboard-card green">
            <h4>Assignments</h4>
            <h2>{assignments.length}</h2>
          </div>

          <div className="dashboard-card purple">
            <h4>Lectures</h4>
            <h2>{lectures.length}</h2>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentHome;