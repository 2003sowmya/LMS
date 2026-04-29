import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import API from "../../api";
import "../../App.css";

export default function MyCourse() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await API.get("/courses/");
      const data = res.data?.results || res.data;
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching courses:", err);
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
            <h2>My Courses</h2>
            <p>Courses assigned to you</p>
          </div>

          {/* CARD */}
          <div className="card">

            <h3 style={{ marginBottom: "15px" }}>All Courses</h3>

            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Subject</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      No courses assigned
                    </td>
                  </tr>
                ) : (
                  courses.map((c) => (
                    <tr key={c.id}>

                      {/* ✅ CORRECT DATA */}
                      <td>{c.title}</td>         {/* ECE 1st Year */}
                      <td>{c.department}</td>    {/* ML / AI */}

                      <td>{c.student_count || 0}</td>

                      <td>
                        <span className="badge badge-success">
                          Active
                        </span>
                      </td>

                      <td>
                        <button className="btn-primary btn-sm">
                          View
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