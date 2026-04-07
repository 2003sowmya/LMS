import React, { useEffect, useState } from "react";
import API from "../api";

function TeacherHome() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [courseRes, assignRes] = await Promise.all([
        API.get("courses/courses/"),
        API.get("learning/assignments/"),
      ]);

      const myCourses = courseRes.data.filter(
        (c) => c.teacher === user.id
      );

      const myAssignments = assignRes.data.filter(
        (a) => a.created_by === user.id
      );

      setCourses(myCourses);
      setAssignments(myAssignments);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      <h2>Welcome, {user?.username}</h2>

      <div>
        <p>Courses: {courses.length}</p>
        <p>Assignments: {assignments.length}</p>
      </div>
    </div>
  );
}

export default TeacherHome;