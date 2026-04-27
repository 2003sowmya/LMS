import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import API from "../../api";
import "../../App.css";

// pages
import MyCourse from "./MyCourse";
import Assignment from "./Assignment";
import Lectures from "./Lectures";
import Notes from "./Notes";
import LiveClass from "./LiveClass";
import Quiz from "./Quiz";
import TeacherStudents from "./TeacherStudents"; // ✅ ADDED

function TeacherHome() {
  const [activePage, setActivePage] = useState("dashboard");

  const [stats, setStats] = useState({
    courses: 0,
    students: 0,
    enrollments: 0,
    assignments: 0,
  });

  // ✅ Dynamic Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // ✅ Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const res = await API.get("/teacher-dashboard/");
      setStats(res.data);
    } catch (err) {
      console.log("Error fetching dashboard:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // ================= DASHBOARD =================
  const renderDashboard = () => (
    <>
      <div className="header-box">
        <h2>{getGreeting()} 👋</h2>
        <p>Welcome to your Teacher Dashboard</p>
      </div>

      <div className="cards">
        <div className="dashboard-card blue">
          <h4>My Courses</h4>
          <h2>{stats.courses}</h2>
        </div>

        <div className="dashboard-card green">
          <h4>My Students</h4>
          <h2>{stats.students}</h2>
        </div>

        <div className="dashboard-card purple">
          <h4>Enrollments</h4>
          <h2>{stats.enrollments}</h2>
        </div>

        <div className="dashboard-card orange">
          <h4>Assignments</h4>
          <h2>{stats.assignments}</h2>
        </div>
      </div>
    </>
  );

  // ================= ROUTING =================
  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return renderDashboard();
      case "courses":
        return <MyCourse />;
      case "students":
        return <TeacherStudents />; // ✅ ADDED
      case "assignments":
        return <Assignment />;
      case "lectures":
        return <Lectures />;
      case "notes":
        return <Notes />;
      case "live-class":
        return <LiveClass />;
      case "quiz":
        return <Quiz />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <Sidebar setActivePage={setActivePage} activePage={activePage} />

      <div className="main">
        <Navbar />

        <div className="content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export default TeacherHome;