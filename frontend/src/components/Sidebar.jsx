import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  let menu = [];

  if (user.role === "admin") {
    menu = [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Users", path: "/users" },
      { name: "Courses", path: "/courses" },
      { name: "Enrollments", path: "/enrollments" },
    ];
  }

  else if (user.role === "student") {
    menu = [
      { name: "Dashboard", path: "/student" },
      { name: "My Courses", path: "/student/courses" },
      { name: "Assignments", path: "/assignments" },
      { name: "Lectures", path: "/lectures" },
    ];
  }

  else if (user.role === "teacher") {
    menu = [
      { name: "Dashboard", path: "/teacher" },
      { name: "My Courses", path: "/courses" },
      { name: "Assignments", path: "/assignments" },
      { name: "Lectures", path: "/lectures" },
    ];
  }

  return (
    <div className="sidebar">
      <h2 className="logo">LMS</h2>

      <div className="user-info">
        <div className="avatar">
          {user?.username?.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p>{user.username}</p>
          <span>{user.role}</span>
        </div>
      </div>

      <div className="menu">
        {menu.map((item) => (
          <p
            key={item.name}
            onClick={() => navigate(item.path)}
            className={
              location.pathname.startsWith(item.path) ? "active" : ""
            }
          >
            {item.name}
          </p>
        ))}
      </div>
    </div>
  );
}