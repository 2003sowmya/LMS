import React from "react";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "??";

  const roleColors = {
    admin:   { bg: "#dbeafe", color: "#1d4ed8" },
    teacher: { bg: "#ede9fe", color: "#5b21b6" },
    student: { bg: "#dcfce7", color: "#166534" },
  };

  const rc = roleColors[user?.role] || { bg: "#f1f5f9", color: "#475569" };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div style={styles.navbar}>

      {/* Left — brand */}
      <div style={styles.brand} onClick={() => navigate("/dashboard")}>
        <div style={styles.brandIcon}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect width="18" height="18" rx="5" fill="#1d4ed8" />
            <path
              d="M4 9h10M9 4v10"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span style={styles.brandName}>Learning Management System</span>
      </div>

      {/* Right — user info + logout */}
      <div style={styles.right}>

        {/* User pill */}
        <div style={styles.userPill}>
          <div
            style={{
              ...styles.avatar,
              background: rc.bg,
              color: rc.color,
            }}
          >
            {initials}
          </div>
          <div style={styles.userInfo}>
            <span style={styles.username}>{user?.username}</span>
            <span
              style={{
                ...styles.roleBadge,
                background: rc.bg,
                color: rc.color,
              }}
            >
              {user?.role}
            </span>
          </div>
        </div>

        <div style={styles.divider} />

        {/* Logout */}
        <button style={styles.logoutBtn} onClick={handleLogout}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M5 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2M9.5 9.5 12 7l-2.5-2.5M12 7H5.5"
              stroke="#64748b"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Log out
        </button>

      </div>
    </div>
  );
}

const styles = {
  navbar: {
    width: "100%",
    height: 56,
    padding: "0 24px",
    background: "#ffffff",
    borderBottom: "0.5px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 1000,
    boxSizing: "border-box",
  },

  // Brand
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    textDecoration: "none",
  },
  brandIcon: {
    display: "flex",
    alignItems: "center",
  },
  brandName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: "-0.01em",
    fontFamily: '"Segoe UI", system-ui, sans-serif',
  },

  // Right side
  right: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  userPill: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
    fontFamily: '"Segoe UI", system-ui, sans-serif',
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  username: {
    fontSize: 13,
    fontWeight: 600,
    color: "#0f172a",
    lineHeight: 1,
    fontFamily: '"Segoe UI", system-ui, sans-serif',
  },
  roleBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: "1px 7px",
    borderRadius: 99,
    lineHeight: 1.6,
    textTransform: "capitalize",
    fontFamily: '"Segoe UI", system-ui, sans-serif',
  },

  // Divider
  divider: {
    width: "0.5px",
    height: 28,
    background: "#e2e8f0",
  },

  // Logout
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 14px",
    fontSize: 13,
    fontWeight: 500,
    color: "#64748b",
    background: "transparent",
    border: "0.5px solid #e2e8f0",
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: '"Segoe UI", system-ui, sans-serif',
    transition: "background 0.15s",
    width: "auto",
  },
};

export default Navbar;