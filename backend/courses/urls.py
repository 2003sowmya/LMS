from rest_framework.routers import DefaultRouter
from django.urls import path, include

from .views import (
    CourseViewSet,
    EnrollmentViewSet,
    AssignmentViewSet,
    SubmissionViewSet,
    LectureViewSet,
    NoteViewSet,
    LiveSessionViewSet,
    NotificationViewSet,
    QuizViewSet,
    QuestionViewSet,
    QuizAttemptViewSet,
    MarkViewSet,
    admin_dashboard,
    teacher_dashboard,
    teacher_students,
    students_by_course,   # ✅ NEW (SMART FILTER)
    download_marksheet,
    serve_note_file,
)

# ===================== ROUTER =====================
router = DefaultRouter()

router.register(r'courses', CourseViewSet, basename='course')
router.register(r'enrollments', EnrollmentViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'submissions', SubmissionViewSet)
router.register(r'lectures', LectureViewSet)
router.register(r'notes', NoteViewSet)
router.register(r'live-sessions', LiveSessionViewSet)
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'quizzes', QuizViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'quiz-attempts', QuizAttemptViewSet)
router.register(r'marks', MarkViewSet)

# ===================== URL PATTERNS =====================
urlpatterns = [
    # ===== DASHBOARDS =====
    path('admin-dashboard/', admin_dashboard),
    path('teacher-dashboard/', teacher_dashboard),

    # ===== STUDENTS =====
    path('teacher/students/', teacher_students),
    path('students-by-course/', students_by_course),  # ✅ NEW API

    # ===== OTHER APIs =====
    path('download-marksheet/', download_marksheet),

    # ===== FILE SERVING =====
    path('notes/file/<int:pk>/', serve_note_file),

    # ===== ROUTER =====
    path('', include(router.urls)),
]