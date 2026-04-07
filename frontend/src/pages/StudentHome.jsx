import React, { useEffect, useState } from "react";
import API from "../api";

function StudentHome() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [lectures, setLectures] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [enrollRes, assignRes, lectureRes] = await Promise.all([
        API.get("courses/enrollments/"),
        API.get("learning/assignments/"),
        API.get("learning/lectures/"),
      ]);

      const myEnrollments = enrollRes.data.filter(
        (e) => e.student === user.id
      );

      setCourses(myEnrollments);
      setAssignments(assignRes.data);
      setLectures(lectureRes.data);
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
        <p>Lectures: {lectures.length}</p>
      </div>
    </div>
  );
}

export default StudentHome;