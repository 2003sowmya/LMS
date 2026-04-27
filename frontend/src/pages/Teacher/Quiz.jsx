import React, { useEffect, useState } from "react";
import API from "../../api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

const S = {
  pageHeader: {},
  pageTitle: {},
  pageSub: {},
  card: {},
  cardTitle: {},
  formRow: {},
  formGroup: {},
  label: {},
  input: {},
  select: {},
  btnPrimary: {},
  th: {},
  td: {},
  tableWrap: {},
};

function QuizPage({ courses }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    course_id: "",
    time_limit: 30,
    available_from: "",
    available_until: "",
    total_marks: 50,
  });

  const [questions, setQuestions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [editingQuizId, setEditingQuizId] = useState(null);

  const [toast, setToast] = useState(null);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchQuizzes = async () => {
    try {
      const res = await API.get("/quizzes/");
      setQuizzes(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const addQuestion = () =>
    setQuestions([
      ...questions,
      {
        question_text: "",
        question_type: "mcq",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_answer: "",
        marks: 5,
      },
    ]);

  const updateQuestion = (i, field, value) => {
    const u = [...questions];
    u[i][field] = value;
    setQuestions(u);
  };

  const removeQuestion = (i) =>
    setQuestions(questions.filter((_, idx) => idx !== i));

  const handleEdit = (quiz) => {
    setForm({
      title: quiz.title,
      course_id: quiz.course ? String(quiz.course) : "",
      time_limit: quiz.time_limit,
      available_from: quiz.available_from || "",
      available_until: quiz.available_until || "",
      total_marks: quiz.total_marks,
    });
    setEditingQuizId(quiz.id);
    setShowForm(true);
    setQuestions([]);
  };

  const handlePublish = async () => {
    if (!form.title) {
      notify("Quiz title required", "error");
      return;
    }

    const payload = {
      title: form.title,
      course: form.course_id || null,
      time_limit: form.time_limit,
      available_from: form.available_from || null,
      available_until: form.available_until || null,
      total_marks: form.total_marks,
    };

    try {
      if (editingQuizId) {
        await API.put(`/quizzes/${editingQuizId}/`, payload);
        notify("Quiz updated");
      } else {
        if (questions.length === 0) {
          notify("Add questions", "error");
          return;
        }

        const quizRes = await API.post("/quizzes/", payload);
        const quizId = quizRes.data.id;

        for (const q of questions) {
          await API.post("/questions/", { ...q, quiz: quizId });
        }

        notify("Quiz created");
      }

      fetchQuizzes();
      setShowForm(false);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>

      {toast && <div>{toast.msg}</div>}

      <h2>{editingQuizId ? "Edit Quiz" : "Create Quiz"}</h2>

      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "Create Quiz"}
      </button>

      {showForm && (
        <div>
          <input
            placeholder="Title"
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

          <button onClick={addQuestion}>Add Question</button>

          {questions.map((q, i) => (
            <div key={i}>
              <input
                placeholder="Question"
                value={q.question_text}
                onChange={(e) =>
                  updateQuestion(i, "question_text", e.target.value)
                }
              />
              <button onClick={() => removeQuestion(i)}>Remove</button>
            </div>
          ))}

          <button onClick={handlePublish}>
            {editingQuizId ? "Update" : "Publish"}
          </button>
        </div>
      )}

      <h3>Quizzes</h3>

      {quizzes.map((q) => (
        <div key={q.id}>
          {q.title}
          <button onClick={() => handleEdit(q)}>Edit</button>
        </div>
      ))}
    </div>
  );
}

// ✅ FIXED WRAPPER WITH LAYOUT
function Quiz() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    API.get("/courses/")
      .then((res) => setCourses(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="main">
      <Sidebar />

      <div className="content">
        <Navbar />
        <QuizPage courses={courses} />
      </div>
    </div>
  );
}

export default Quiz;