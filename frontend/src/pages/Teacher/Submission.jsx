import React, { useEffect, useState } from "react";
import API from "../../api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "../../App.css";

function Submissions() {
  const [submissions, setSubmissions] = useState([]);

  // ===== FETCH =====
  const fetchSubmissions = async () => {
    try {
      const res = await API.get("/submissions/");
      const data = res.data?.results || res.data;
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        <Navbar />

        <div className="content">

          {/* ===== HEADER ===== */}
          <div className="header-box">
            <h2>Submissions</h2>
            <p>{submissions.length} total submissions</p>
          </div>

          {/* ===== TABLE ===== */}
          <div className="card">
            <h3 style={{ marginBottom: 15 }}>All Submissions</h3>

            {submissions.length === 0 ? (
              <p style={{ textAlign: "center" }}>
                No submissions found
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Student</th>
                    <th>Submitted At</th>
                    <th>File</th>
                  </tr>
                </thead>

                <tbody>
                  {submissions.map((s) => (
                    <tr key={s.id}>
                      <td>{s.assignment}</td>
                      <td>{s.student_name || s.student}</td>

                      <td>
                        {new Date(s.submitted_at).toLocaleString()}
                      </td>

                      <td>
                        {s.file ? (
                          <a
                            href={s.file}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-primary"
                            style={{
                              padding: "6px 10px",
                              fontSize: "12px",
                              textDecoration: "none",
                            }}
                          >
                            Download
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default Submissions;