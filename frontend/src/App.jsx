import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Lectures from "./pages/Lectures";
import Assignments from "./pages/Assignments"; // ✅ ADD THIS

function ProtectedRoute({ children, adminOnly = false }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!user) return <Navigate to="/" replace />;
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path="/" element={<Login />} />

        {/* Protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
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
          path="/lectures"
          element={
            <ProtectedRoute>
              <Lectures />
            </ProtectedRoute>
          }
        />

        {/* ✅ NEW ROUTE */}
        <Route
          path="/assignments"
          element={
            <ProtectedRoute>
              <Assignments />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;