import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Courses from "./pages/Courses";
import Enrollments from "./pages/Enrollments";
import Lectures from "./pages/Lectures";
import Assignments from "./pages/Assignments";
import StudentHome from "./pages/StudentHome";
import StudentCourses from "./pages/StudentCourses"; // ✅ NEW
import TeacherHome from "./pages/TeacherHome";


// ===================== SAFE USER PARSER =====================
const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};


// ===================== PROTECTED ROUTE =====================
function ProtectedRoute({ children, adminOnly = false }) {
  const user = getUser();

  // ❌ Not logged in
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // ❌ Not admin (for admin routes)
  if (adminOnly && user.role?.toLowerCase() !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}


// ===================== ROLE BASED REDIRECT =====================
function RoleRedirect() {
  const user = getUser();

  if (!user) return <Navigate to="/" replace />;

  const role = user.role?.toLowerCase();

  if (role === "admin") return <Navigate to="/dashboard" replace />;
  if (role === "teacher") return <Navigate to="/teacher" replace />;
  if (role === "student") return <Navigate to="/student" replace />;

  return <Navigate to="/" replace />;
}


// ===================== APP =====================
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<Login />} />

        {/* AUTO REDIRECT AFTER LOGIN */}
        <Route path="/home" element={<RoleRedirect />} />

        {/* ================= ADMIN ROUTES ================= */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute adminOnly={true}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute adminOnly={true}>
              <Users />
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses"
          element={
            <ProtectedRoute adminOnly={true}>
              <Courses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/enrollments"
          element={
            <ProtectedRoute adminOnly={true}>
              <Enrollments />
            </ProtectedRoute>
          }
        />

        {/* ================= TEACHER ROUTE ================= */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute>
              <TeacherHome />
            </ProtectedRoute>
          }
        />

        {/* ================= STUDENT ROUTES ================= */}
        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <StudentHome />
            </ProtectedRoute>
          }
        />

        {/* ✅ NEW: STUDENT COURSES PAGE */}
        <Route
          path="/student/courses"
          element={
            <ProtectedRoute>
              <StudentCourses />
            </ProtectedRoute>
          }
        />

        {/* ================= COMMON ROUTES ================= */}
        <Route
          path="/lectures"
          element={
            <ProtectedRoute>
              <Lectures />
            </ProtectedRoute>
          }
        />

        <Route
          path="/assignments"
          element={
            <ProtectedRoute>
              <Assignments />
            </ProtectedRoute>
          }
        />

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;