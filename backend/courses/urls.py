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
    download_marksheet,
    serve_note_file,
)

router = DefaultRouter()

# ✅ FIXED: courses should NOT be root
router.register(r'courses', CourseViewSet, basename='course')

# ✅ Other routes (these will now work correctly)
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

urlpatterns = [
    # ✅ Dashboard APIs
    path('admin-dashboard/', admin_dashboard),
    path('teacher-dashboard/', teacher_dashboard),
    path('teacher-students/', teacher_students),
    path('download-marksheet/', download_marksheet),

    # ✅ File serving
    path('notes/file/<int:pk>/', serve_note_file),

    # ✅ Include router URLs
    path('', include(router.urls)),
]