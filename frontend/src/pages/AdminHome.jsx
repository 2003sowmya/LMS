import React, { useEffect, useState } from "react";
import API from "../api";

function AdminHome() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "student",
  });

  useEffect(() => {
    loadData();
  }, []);

  // ✅ LOAD USERS + COURSES
  const loadData = async () => {
    try {
      const [userRes, courseRes] = await Promise.all([
        API.get("users/"),
        API.get("courses/courses/"),
      ]);

      setUsers(userRes.data);
      setCourses(courseRes.data);
    } catch (err) {
      console.log(err);
    }
  };

  // ✅ ADD USER
  const addUser = async () => {
    try {
      await API.post("users/", newUser);

      setNewUser({
        username: "",
        password: "",
        role: "student",
      });

      loadData();
    } catch (err) {
      console.log("Error adding user");
    }
  };

  // ✅ DELETE USER
  const deleteUser = async (id) => {
    try {
      await API.delete(`users/${id}/`);
      loadData();
    } catch (err) {
      console.log("Error deleting user");
    }
  };

  return (
    <div>
      <h2>Welcome, {user?.username} (Admin)</h2>

      {/* STATS */}
      <div>
        <p>Total Users: {users.length}</p>
        <p>Total Courses: {courses.length}</p>
      </div>

      {/* ADD USER */}
      <div style={{ marginTop: 20 }}>
        <h3>Add User</h3>

        <input
          placeholder="Username"
          value={newUser.username}
          onChange={(e) =>
            setNewUser({ ...newUser, username: e.target.value })
          }
        />

        <input
          placeholder="Password"
          type="password"
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

        <button onClick={addUser}>Add User</button>
      </div>

      {/* USERS LIST */}
      <div style={{ marginTop: 20 }}>
        <h3>All Users</h3>

        {users.map((u) => (
          <div
            key={u.id}
            style={{
              border: "1px solid #ccc",
              padding: 10,
              margin: 5,
            }}
          >
            <p>
              {u.username} ({u.role})
            </p>

            <button onClick={() => deleteUser(u.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminHome;