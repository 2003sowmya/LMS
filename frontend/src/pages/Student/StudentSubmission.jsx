import React, { useEffect, useState } from "react";
import API from "../../api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";


function StudentSubmission() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role?.toLowerCase();

  const [submissions, setSubmissions] = useState([]);

  const fetchSubmissions = async () => {
    try {
      const res = await API.get("learning/submissions/");
      setSubmissions(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  return (
    <div className="main">
      <Sidebar />

      <div className="content">
        <Navbar />

        <div className="page-header">
          <h2>Submissions</h2>
        </div>

        <div className="assignment-grid">
          {submissions.length === 0 ? (
            <p>No submissions found</p>
          ) : (
            submissions.map((s) => (
              <div key={s.id} className="assignment-card">

                <h3>Assignment ID: {s.assignment}</h3>

                <p>Student: {s.student_name || s.student}</p>

                <p>
                  Submitted at:{" "}
                  {new Date(s.submitted_at).toLocaleString()}
                </p>

                {/* FILE DOWNLOAD */}
                {s.file && (
                  <a
                    href={s.file}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download File
                  </a>
                )}

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentSubmission;