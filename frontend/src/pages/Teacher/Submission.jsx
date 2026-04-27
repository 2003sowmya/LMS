import React, { useEffect, useState } from "react";
import API from "../../api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

function Submissions() {
  const [submissions, setSubmissions] = useState([]);

  const fetchSubmissions = async () => {
    try {
      const res = await API.get("/submissions/");
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

        <h2>Submissions</h2>

        {submissions.length === 0 ? (
          <p>No submissions found</p>
        ) : (
          submissions.map((s) => (
            <div key={s.id} style={{ marginBottom: 15 }}>
              <p><b>Assignment:</b> {s.assignment}</p>
              <p><b>Student:</b> {s.student_name || s.student}</p>
              <p>
                <b>Submitted:</b>{" "}
                {new Date(s.submitted_at).toLocaleString()}
              </p>

              {s.file && (
                <a href={s.file} target="_blank" rel="noreferrer">
                  Download File
                </a>
              )}

              <hr />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Submissions;