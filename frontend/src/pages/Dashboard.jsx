import React from "react";
import Navbar from "../components/Navbar";
import StudentHome from "./StudentHome";
import TeacherHome from "./TeacherHome";
import AdminHome from "./AdminHome";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <>
      <Navbar />

      <div style={{ marginTop: "70px", padding: "20px" }}>
        {user?.role === "student" && <StudentHome />}
        {user?.role === "teacher" && <TeacherHome />}
        {user?.role === "admin" && <AdminHome />}
      </div>
    </>
  );
}

export default Dashboard;