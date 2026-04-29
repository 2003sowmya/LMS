import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";   // ✅ FIXED
import Navbar from "../../components/Navbar";     // ✅ FIXED
import API from "../../api";                      // ✅ FIXED
import "../../App.css";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const [filter, setFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "student",
    department: "CS",
  });

  const departments = ["CS", "IT", "ECE", "EEE"];

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ TOAST FUNCTION
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ✅ FETCH USERS
  const fetchUsers = async () => {
  try {
    const res = await API.get("users/");

    const data = res.data?.results || res.data;

    setUsers(Array.isArray(data) ? data : []);
  } catch {
    showToast("❌ Failed to load users");
  }
};
  // ✅ DELETE USER
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await API.delete(`users/${id}/`);
      setUsers(users.filter((u) => u.id !== id));
      showToast("🗑️ User deleted successfully");
    } catch {
      showToast("❌ Failed to delete user");
    }
  };

  // ✅ EDIT USER
  const handleEdit = (u) => {
    setEditingUser(u);
    setNewUser({
      username: u.username,
      password: "",
      role: u.role,
      department: u.department,
    });
  };

  // ✅ ADD USER
  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      return showToast("⚠️ Please fill all required fields");
    }

    try {
      const res = await API.post("users/", newUser);
      setUsers([...users, res.data]);

      setNewUser({
        username: "",
        password: "",
        role: "student",
        department: "CS",
      });

      showToast("✅ User added successfully");
    } catch {
      showToast("❌ Error adding user");
    }
  };

  // ✅ UPDATE USER
  const handleUpdateUser = async () => {
    try {
      await API.put(`users/${editingUser.id}/`, newUser);

      setEditingUser(null);
      fetchUsers();

      setNewUser({
        username: "",
        password: "",
        role: "student",
        department: "CS",
      });

      showToast("✏️ User updated successfully");
    } catch {
      showToast("❌ Failed to update user");
    }
  };

  // ✅ FILTER LOGIC
  const filteredUsers = users.filter((u) => {
    const roleMatch = filter === "all" || u.role === filter;
    const deptMatch =
      departmentFilter === "all" || u.department === departmentFilter;
    const searchMatch = u.username
      .toLowerCase()
      .includes(search.toLowerCase());

    return roleMatch && deptMatch && searchMatch;
  });

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        <Navbar />

        <div className="content">
          <h2>User Management</h2>

          {/* FILTERS */}
          <div className="top-filters">
            <input
              className="search-box"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>

            <select onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* ADD / EDIT USER */}
          <div className="card">
            <h3>{editingUser ? "Edit User" : "Add User"}</h3>

            <div className="form-grid">
              <input
                placeholder="Username"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
              />

              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
              />

              <select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>

              <select
                value={newUser.department}
                onChange={(e) =>
                  setNewUser({ ...newUser, department: e.target.value })
                }
              >
                {departments.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>

              <button
                className="btn-primary"
                onClick={
                  editingUser ? handleUpdateUser : handleAddUser
                }
              >
                {editingUser ? "Update User" : "Create User"}
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>ID</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>{u.username}</td>

                      <td>
                        {u.role === "student"
                          ? u.roll_number
                          : u.role === "teacher"
                          ? u.employee_id
                          : "-"}
                      </td>

                      <td>{u.department}</td>
                      <td>{u.role}</td>

                      <td>
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(u)}
                        >
                          Edit
                        </button>

                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(u.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ TOAST MESSAGE */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}