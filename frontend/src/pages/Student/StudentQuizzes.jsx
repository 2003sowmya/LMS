import Sidebar from "../../components/Sidebar";   // ✅ FIXED
import Navbar from "../../components/Navbar";  

function StudentQuizzes() {
  return (
    <div className="main">
      <Sidebar />

      <div className="content">
        <Navbar />

        <div className="page-header">
          <h2>Quizzes</h2>
          <p>Take your quizzes and tests</p>
        </div>

        {/* EMPTY STATE */}
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <h3>No quizzes available 📝</h3>
        </div>

      </div>
    </div>
  );
}

export default StudentQuizzes;