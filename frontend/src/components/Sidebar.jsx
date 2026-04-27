import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  let menu = [];

  // ✅ ADMIN
  if (user.role === "admin") {
    menu = [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Users", path: "/users" },
      { name: "Courses", path: "/courses" },
      { name: "Enrollments", path: "/enrollments" },
    ];
  }

  // ✅ STUDENT
  else if (user.role === "student") {
    menu = [
      { name: "Dashboard", path: "/student-home" },
      { name: "My Courses", path: "/student/courses" },
      { name: "Assignments", path: "/student/assignments" },
      { name: "Lectures", path: "/student/lectures" },
      { name: "Quizzes", path: "/student/quizzes" },
      { name: "Grades", path: "/student/grades" },
    ];
  }

  // ✅ TEACHER (FIXED)
  else if (user.role === "teacher") {
  menu = [
    { name: "Dashboard", path: "/teacher" }, // ✅ FIXED
    { name: "My Courses", path: "/teacher/courses" },
    { name: "Students", path: "/teacher/students" },
    { name: "Assignments", path: "/teacher/assignments" },
    { name: "Submissions", path: "/teacher/submissions" },
    { name: "Lectures", path: "/teacher/lectures" },
    { name: "Notes", path: "/teacher/notes" },
    { name: "Live Class", path: "/teacher/live" },
    { name: "Quiz", path: "/teacher/quiz" },
    { name: "Marks", path: "/teacher/marks" },
  ];
}

  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar">
      <h2 className="logo">LMS</h2>

      {/* USER */}
      <div className="user-info">
        <div className="avatar">
          {user?.username?.slice(0, 2).toUpperCase() || "US"}
        </div>
        <div>
          <p>{user?.username}</p>
          <span>{user?.role}</span>
        </div>
      </div>

      {/* MENU */}
      <div className="menu">
        {menu.map((item) => (
          <p
            key={item.name}
            onClick={() => navigate(item.path)}
            className={isActive(item.path) ? "active" : ""}
          >
            {item.name}
          </p>
        ))}
      </div>
    </div>
  );
}