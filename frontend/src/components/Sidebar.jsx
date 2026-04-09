import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const menu = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Users", path: "/users" },
    { name: "Courses", path: "/courses" },
    { name: "Enrollments", path: "/enrollments" },
  ];

  return (
    <div className="sidebar">

      {/* LOGO */}
      <h2 className="logo">LMS</h2>

      {/* USER */}
      <div className="user-info">
        <div className="avatar">
          {user?.username?.slice(0, 2).toUpperCase()}
        </div>

        <div>
          <p>{user.username}</p>
          <span>{user.role}</span>
        </div>
      </div>

      {/* MENU */}
      <div className="menu">
        {menu.map((item) => (
          <p
            key={item.name}
            onClick={() => navigate(item.path)}
            className={
              location.pathname === item.path ? "active" : ""
            }
          >
            {item.name}
          </p>
        ))}
      </div>

    </div>
  );
}