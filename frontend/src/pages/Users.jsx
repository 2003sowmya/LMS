import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../api"; // ✅ use axios API
import "../App.css";

function Users() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "student" });
  const [editingUser, setEditingUser] = useState(null);
  const [editPassword, setEditPassword] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user"));

  // 🔐 Role check
  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      alert("Access denied");
      navigate("/dashboard");
    }
  }, []);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  // ✅ FETCH USERS
  const fetchUsers = async () => {
    try {
      const res = await API.get("users/");
      setUsers(res.data);
    } catch (err) {
      showMessage("Failed to load users", "error");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ CREATE USER
  const createUser = async () => {
    if (!newUser.username.trim() || !newUser.password.trim()) {
      showMessage("Username and password are required", "error");
      return;
    }

    setLoading(true);
    try {
      await API.post("users/", newUser);

      setNewUser({ username: "", password: "", role: "student" });
      setShowAddForm(false);
      showMessage("User created successfully");
      fetchUsers();
    } catch (err) {
      showMessage("Failed to create user", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATE USER
  const updateUser = async () => {
    if (!editingUser.username.trim()) {
      showMessage("Username cannot be empty", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: editingUser.username,
        role: editingUser.role,
      };

      if (editPassword.trim()) {
        payload.password = editPassword;
      }

      await API.put(`users/${editingUser.id}/`, payload);

      setEditingUser(null);
      setEditPassword("");
      showMessage("User updated successfully");
      fetchUsers();
    } catch (err) {
      showMessage("Update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ DELETE USER
  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    setLoading(true);
    try {
      await API.delete(`users/${id}/`);
      showMessage("User deleted successfully");
      fetchUsers();
    } catch (err) {
      showMessage("Delete failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const roleBadgeClass = (role) => {
    if (role === "admin") return "badge badge-admin";
    if (role === "teacher") return "badge badge-teacher";
    return "badge badge-student";
  };

  return (
    <>
      <Navbar />

      <div
        className="page"
        style={{
          marginTop: "56px",
          width: "100%",
          maxWidth: "100%",
          padding: "32px 48px",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div className="page-header" style={{ marginBottom: "24px" }}>
          <div>
            <div className="page-title">User management</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
              {users.length} total user{users.length !== 1 ? "s" : ""}
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingUser(null);
              setEditPassword("");
            }}
          >
            {showAddForm ? "Cancel" : "+ Add user"}
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 14,
              fontWeight: 500,
              background: message.type === "error" ? "#fee2e2" : "#dcfce7",
              color: message.type === "error" ? "#b91c1c" : "#166534",
            }}
          >
            {message.text}
          </div>
        )}

        {/* Add Form */}
        {showAddForm && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">New user</div>

            <input
              placeholder="Username"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            />

            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />

            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>

            <button onClick={createUser} disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        )}

        {/* Users List */}
        <table className="table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Username</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user, index) => (
              <tr key={user.id}>
                <td>{index + 1}</td>
                <td>{user.username}</td>
                <td>{user.role}</td>

                <td>
                  <button
                    onClick={() => {
                      setEditingUser(user);
                      setEditPassword("");
                    }}
                  >
                    Edit
                  </button>

                  <button onClick={() => deleteUser(user.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Users;