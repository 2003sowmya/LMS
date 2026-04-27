import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import API from "../../api";
import "../../App.css";

function MyCoursesPage({ courses }) {
  return (
    <div>

      {/* HEADER */}
      <div className="page-header">
        <h1 className="page-title">My Courses</h1>
        <p className="page-sub">Courses assigned to you</p>
      </div>

      {/* CARD */}
      <div className="card">
        <div className="card-title">All Courses</div>

        <div className="table-wrap">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Subject</th>
                <th>Enrolled Students</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20 }}>
                    No courses assigned
                  </td>
                </tr>
              ) : (
                courses.map((c) => (
                  <tr key={c.id}>
                    <td>{c.title || c.name}</td>
                    <td>{c.department || "General"}</td>
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
  );
}

function MyCourse() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    API.get("/courses/")
      .then((res) => setCourses(res.data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        <Navbar />

        <div className="content">
          <MyCoursesPage courses={courses} />
        </div>
      </div>
    </div>
  );
}

export default MyCourse;