import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import API from "../../api";
import "../../App.css";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_users: 0,
    total_students: 0,
    total_teachers: 0,
    total_courses: 0,
    total_enrollments: 0
  });

  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get("admin-dashboard/");
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
    } finally {
      setLoading(false);
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
            <h2>
              {getGreeting()}, {user?.username || "User"} 👋
            </h2>
            <p>Welcome to your LMS dashboard</p>
          </div>

          {/* DASHBOARD CARDS */}
          <div className="cards">

            <div className="dashboard-card blue">
              <h4>Total Users</h4>
              <h2>{loading ? "..." : stats.total_users}</h2>
            </div>

            <div className="dashboard-card green">
              <h4>Students</h4>
              <h2>{loading ? "..." : stats.total_students}</h2>
            </div>

            <div className="dashboard-card purple">
              <h4>Teachers</h4>
              <h2>{loading ? "..." : stats.total_teachers}</h2>
            </div>

            <div className="dashboard-card orange">
              <h4>Courses</h4>
              <h2>{loading ? "..." : stats.total_courses}</h2>
            </div>

            <div className="dashboard-card red">
              <h4>Enrollments</h4>
              <h2>{loading ? "..." : stats.total_enrollments}</h2>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}