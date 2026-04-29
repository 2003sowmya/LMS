import React, { useEffect, useState } from "react";
import API from "../../api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "../../App.css";

function QuizPage({ courses }) {
  const [showForm, setShowForm] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    course_id: "",
    total_marks: 50,
  });

  const [questions, setQuestions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [toast, setToast] = useState(null);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ================= FETCH =================
  const fetchQuizzes = async () => {
    try {
      const res = await API.get("/quizzes/");
      setQuizzes(res.data);
    } catch {
      notify("Failed to load quizzes");
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // ================= QUESTIONS =================

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: "",
        options: ["", "", "", ""],
        correct: 0,
      },
    ]);
  };

  const updateQuestion = (i, value) => {
    const updated = [...questions];
    updated[i].question_text = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const setCorrect = (qIndex, optionIndex) => {
    const updated = [...questions];
    updated[qIndex].correct = optionIndex;
    setQuestions(updated);
  };

  const removeQuestion = (i) => {
    setQuestions(questions.filter((_, idx) => idx !== i));
  };

  // ================= EDIT =================

  const handleEdit = (quiz) => {
    setForm({
      title: quiz.title,
      course_id: quiz.course || "",
      total_marks: quiz.total_marks,
    });

    setEditingQuizId(quiz.id);
    setShowForm(true);
    setQuestions([]); // advanced edit can load questions later
  };

  // ================= DELETE =================

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this quiz?")) return;

    try {
      await API.delete(`/quizzes/${id}/`);
      fetchQuizzes();
      notify("Quiz deleted");
    } catch {
      notify("Error deleting quiz");
    }
  };

  // ================= SAVE =================

  const handlePublish = async () => {
    try {
      if (!form.title) {
        notify("Enter title");
        return;
      }

      if (editingQuizId) {
        await API.put(`/quizzes/${editingQuizId}/`, {
          title: form.title,
          course: form.course_id,
          total_marks: form.total_marks,
        });

        notify("Quiz updated");
      } else {
        if (questions.length === 0) {
          notify("Add questions");
          return;
        }

        const quizRes = await API.post("/quizzes/", {
          title: form.title,
          course: form.course_id,
          total_marks: form.total_marks,
        });

        const quizId = quizRes.data.id;

        for (const q of questions) {
          await API.post("/questions/", {
            quiz: quizId,
            question_text: q.question_text,
            options: q.options,
            correct_answer: q.correct,
          });
        }

        notify("Quiz created");
      }

      fetchQuizzes();
      setShowForm(false);
      setEditingQuizId(null);
      setQuestions([]);
    } catch {
      notify("Error saving quiz");
    }
  };

  return (
    <>
      {/* INTERNAL CSS (SAFE) */}
      <style>{`
        .question-card {
          background: white;
          border-radius: 12px;
          padding: 15px;
          margin-top: 15px;
          border-left: 5px solid #4f46e5;
        }

        .question-input {
          width: 100%;
          padding: 8px;
          margin-bottom: 10px;
        }

        .option-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 6px 0;
        }

        .option-row input[type="text"] {
          flex: 1;
          padding: 6px;
        }
      `}</style>

      {/* HEADER */}
      <div className="header-box">
        <h2>Quiz Management</h2>
        <p>{quizzes.length} quizzes available</p>
      </div>

      {/* BUTTON */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <button
          className="btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            setEditingQuizId(null);
          }}
        >
          {showForm ? "Cancel" : "+ Create Quiz"}
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="card">

          <div className="form-grid">
            <input
              placeholder="Quiz Title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <select
              value={form.course_id}
              onChange={(e) =>
                setForm({ ...form, course_id: e.target.value })
              }
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* QUESTIONS */}
          {!editingQuizId && (
            <div style={{ marginTop: 20 }}>
              <button className="btn-edit" onClick={addQuestion}>
                + Add Question
              </button>

              {questions.map((q, qIndex) => (
                <div key={qIndex} className="question-card">

                  <input
                    className="question-input"
                    placeholder={`Question ${qIndex + 1}`}
                    value={q.question_text}
                    onChange={(e) =>
                      updateQuestion(qIndex, e.target.value)
                    }
                  />

                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} className="option-row">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={q.correct === oIndex}
                        onChange={() => setCorrect(qIndex, oIndex)}
                      />

                      <input
                        type="text"
                        placeholder={`Option ${oIndex + 1}`}
                        value={opt}
                        onChange={(e) =>
                          updateOption(qIndex, oIndex, e.target.value)
                        }
                      />
                    </div>
                  ))}

                  <button
                    className="btn-delete"
                    onClick={() => removeQuestion(qIndex)}
                  >
                    Remove Question
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <button className="btn-primary" onClick={handlePublish}>
              {editingQuizId ? "Update Quiz" : "Publish Quiz"}
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="card">
        <h3>All Quizzes</h3>

        {quizzes.length === 0 ? (
          <p>No quizzes</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Marks</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {quizzes.map((q) => (
                <tr key={q.id}>
                  <td>{q.title}</td>
                  <td>{q.total_marks}</td>

                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(q)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(q.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

// WRAPPER
function Quiz() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    API.get("/courses/")
      .then((res) => setCourses(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <Navbar />
        <div className="content">
          <QuizPage courses={courses} />
        </div>
      </div>
    </div>
  );
}

export default Quiz;