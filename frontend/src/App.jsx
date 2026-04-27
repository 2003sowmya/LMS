import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";

// ================= ADMIN =================
import Dashboard from "./pages/Admin/Dashboard";
import Users from "./pages/Admin/Users";
import Courses from "./pages/Admin/Courses";
import Enrollments from "./pages/Admin/Enrollments";

// ================= TEACHER =================
import TeacherHome from "./pages/Teacher/TeacherHome";
import Assignment from "./pages/Teacher/Assignment";
import Lectures from "./pages/Teacher/Lectures";
import LiveClass from "./pages/Teacher/LiveClass";
import Quiz from "./pages/Teacher/Quiz";
import Notes from "./pages/Teacher/Notes";
import MyCourse from "./pages/Teacher/MyCourse";
import Submissions from "./pages/Teacher/Submission";
import Marks from "./pages/Teacher/Marks";
import TeacherStudents from "./pages/Teacher/TeacherStudents"; // ✅ ADDED

// ================= STUDENT =================
import StudentHome from "./pages/Student/StudentHome";
import StudentCourses from "./pages/Student/StudentCourses";
import StudentAssignments from "./pages/Student/StudentAssignments";
import StudentQuizzes from "./pages/Student/StudentQuizzes";
import StudentGrades from "./pages/Student/StudentGrades";


// ================= SAFE USER =================
const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};


// ================= PROTECTED ROUTE =================
function ProtectedRoute({ children, role, adminOnly = false }) {
  const user = getUser();

  if (!user) return <Navigate to="/" replace />;

  if (adminOnly && user.role?.toLowerCase() !== "admin") {
    return <Navigate to="/" replace />;
  }

  if (role && user.role?.toLowerCase() !== role.toLowerCase()) {
    return <Navigate to="/" replace />;
  }

  return children;
}


// ================= ROLE REDIRECT =================
function RoleRedirect() {
  const user = getUser();

  if (!user) return <Navigate to="/" replace />;

  const role = user.role?.toLowerCase();

  if (role === "admin") return <Navigate to="/dashboard" replace />;
  if (role === "teacher") return <Navigate to="/teacher" replace />;
  if (role === "student") return <Navigate to="/student" replace />;

  return <Navigate to="/" replace />;
}


// ================= APP =================
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ===== PUBLIC ===== */}
        <Route path="/" element={<Login />} />

        {/* ===== REDIRECT AFTER LOGIN ===== */}
        <Route path="/home" element={<RoleRedirect />} />


        {/* ================= ADMIN ================= */}
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


        {/* ================= TEACHER ================= */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute role="teacher">
              <TeacherHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/courses"
          element={
            <ProtectedRoute role="teacher">
              <MyCourse />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/students"   // ✅ FIXED
          element={
            <ProtectedRoute role="teacher">
              <TeacherStudents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/assignments"
          element={
            <ProtectedRoute role="teacher">
              <Assignment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/submissions"
          element={
            <ProtectedRoute role="teacher">
              <Submissions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/marks"
          element={
            <ProtectedRoute role="teacher">
              <Marks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/lectures"
          element={
            <ProtectedRoute role="teacher">
              <Lectures />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/notes"
          element={
            <ProtectedRoute role="teacher">
              <Notes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/live"
          element={
            <ProtectedRoute role="teacher">
              <LiveClass />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/quiz"
          element={
            <ProtectedRoute role="teacher">
              <Quiz />
            </ProtectedRoute>
          }
        />


        {/* ================= STUDENT ================= */}
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/courses"
          element={
            <ProtectedRoute role="student">
              <StudentCourses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/assignments"
          element={
            <ProtectedRoute role="student">
              <StudentAssignments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/quizzes"
          element={
            <ProtectedRoute role="student">
              <StudentQuizzes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/grades"
          element={
            <ProtectedRoute role="student">
              <StudentGrades />
            </ProtectedRoute>
          }
        />


        {/* ===== FALLBACK ===== */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;