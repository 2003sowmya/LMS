import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import API from "../../api";
import "../../App.css"; // ✅ keep global layout styles

export default function Lectures() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [lectures, setLectures] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!user) navigate("/");
    fetchLectures();
  }, []);

  const fetchLectures = async () => {
    try {
      const res = await API.get("/lectures/");
      const data = res.data?.results || res.data;
      setLectures(Array.isArray(data) ? data : []);
    } catch {
      console.log("Error loading lectures");
    }
  };

  const deleteLecture = async (id) => {
    if (!window.confirm("Delete this lecture?")) return;
    await API.delete(`/lectures/${id}/`);
    fetchLectures();
  };

  const getVideoUrl = (url) => {
    if (!url) return null;
    return url.startsWith("http")
      ? url
      : `http://127.0.0.1:8000${url}`;
  };

  const filtered = lectures.filter((l) =>
    activeTab === "all" ? true : l.lecture_type === activeTab
  );

  return (
    <div className="layout">

      {/* ✅ INTERNAL CSS (only lecture UI) */}
      <style>{`
        .lectureCard {
          background: #ffffff;
          padding: 18px;
          border-radius: 14px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.08);
          margin-top: 20px;
        }

        .lectureRow {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .lectureTitle {
          flex: 1;
          font-size: 18px;
          font-weight: 600;
        }

        .lectureBadge {
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: bold;
          text-transform: capitalize;
        }

        .lectureBadge.recorded {
          background: #e0f2fe;
          color: #0284c7;
        }

        .lectureBadge.live {
          background: #fee2e2;
          color: #dc2626;
        }

        .watchBtn {
          background: #4f46e5;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
        }

        .watchBtn:hover {
          opacity: 0.9;
        }

        .deleteBtn {
          background: #ef4444;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
        }

        .deleteBtn:hover {
          opacity: 0.9;
        }

        .lectureTabs {
          text-align: center;
          margin: 20px 0;
        }

        .tabBtn {
          margin: 5px;
          padding: 6px 12px;
          background: #ddd;
          border-radius: 6px;
          border: none;
          cursor: pointer;
        }

        .tabActive {
          background: #4f46e5;
          color: white;
        }

        .lectureEmpty {
          text-align: center;
          margin-top: 30px;
        }
      `}</style>

      <Sidebar />

      <div className="main">
        <Navbar />

        <div className="content">

          {/* HEADER */}
          <div className="header-box">
            <h2>Lectures</h2>
            <p>{lectures.length} total lectures</p>
          </div>

          {/* FILTER */}
          <div className="lectureTabs">
            {["all", "recorded", "live"].map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? "tabActive" : "tabBtn"}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* LIST */}
          {filtered.length === 0 ? (
            <div className="lectureEmpty">
              <h3>No lectures yet</h3>
            </div>
          ) : (
            filtered.map((l) => (
              <div key={l.id} className="lectureCard">

                <div className="lectureRow">

                  <div className="lectureTitle">{l.title}</div>

                  <span className={`lectureBadge ${l.lecture_type}`}>
                    {l.lecture_type}
                  </span>

                  {l.lecture_type === "recorded" && l.video_file && (
                    <button
                      className="watchBtn"
                      onClick={() =>
                        window.open(getVideoUrl(l.video_file), "_blank")
                      }
                    >
                      ▶ Watch
                    </button>
                  )}

                  {l.lecture_type === "live" && (
                    <a
                      href={l.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="watchBtn"
                    >
                      🔴 Join
                    </a>
                  )}

                  <button
                    className="deleteBtn"
                    onClick={() => deleteLecture(l.id)}
                  >
                    Delete
                  </button>

                </div>

              </div>
            ))
          )}

        </div>
      </div>
    </div>
  );
}