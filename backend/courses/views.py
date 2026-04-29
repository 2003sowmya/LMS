# ===================== IMPORTS =====================
from django.contrib.auth import get_user_model
from django.http import FileResponse

from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

# ===================== MODELS =====================
from .models import (
    Course, Enrollment, Assignment, Submission, Lecture,
    Note, LiveSession, Notification, Quiz, Question,
    QuizAttempt, Mark
)

# ===================== SERIALIZERS =====================
from .serializers import (
    CourseSerializer, EnrollmentSerializer, AssignmentSerializer,
    SubmissionSerializer, LectureSerializer, NoteSerializer,
    LiveSessionSerializer, NotificationSerializer, QuizSerializer,
    QuestionSerializer, QuizAttemptSerializer, MarkSerializer
)

User = get_user_model()


# ===================== DASHBOARD APIs =====================

# ✅ ADMIN DASHBOARD
@api_view(['GET'])
@permission_classes([AllowAny])
def admin_dashboard(request):
    return Response({
        "total_users": User.objects.count(),
        "total_students": User.objects.filter(role='student').count(),
        "total_teachers": User.objects.filter(role='teacher').count(),
        "total_courses": Course.objects.count(),
        "total_enrollments": Enrollment.objects.count(),
    })


# ✅ TEACHER DASHBOARD
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_dashboard(request):
    teacher = request.user

    my_courses = Course.objects.filter(teacher=teacher)
    course_ids = my_courses.values_list('id', flat=True)

    return Response({
        "courses": my_courses.count(),
        "students": Enrollment.objects.filter(course_id__in=course_ids)
                        .values('student').distinct().count(),
        "enrollments": Enrollment.objects.filter(course_id__in=course_ids).count(),
        "assignments": Assignment.objects.filter(course__in=my_courses).count(),
    })


# ===================== 🔥 FIXED FUNCTION =====================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_students(request):
    teacher = request.user

    my_courses = Course.objects.filter(teacher=teacher)

    enrollments = Enrollment.objects.filter(
        course__in=my_courses
    ).select_related('student', 'course')

    data = [
        {
            "id": e.student.id,
            "student_name": e.student.username,   # ✅ matches frontend
            "email": e.student.email,             # ✅ matches frontend
            "course": e.course.title,
            "course_code": e.course.course_code,  # ✅ optional (future use)
            "roll_number": e.student.roll_number  # ✅ optional
        }
        for e in enrollments
    ]

    return Response(data)


# ===================== VIEWSETS =====================

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [AllowAny]


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [AllowAny]


class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [AllowAny]


class LectureViewSet(viewsets.ModelViewSet):
    queryset = Lecture.objects.all()
    serializer_class = LectureSerializer
    permission_classes = [AllowAny]


class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


def serve_note_file(request, pk):
    note = Note.objects.get(pk=pk)
    return FileResponse(note.file.open('rb'))


class LiveSessionViewSet(viewsets.ModelViewSet):
    queryset = LiveSession.objects.all()
    serializer_class = LiveSessionSerializer
    permission_classes = [AllowAny]


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [AllowAny]


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [AllowAny]


class QuizAttemptViewSet(viewsets.ModelViewSet):
    queryset = QuizAttempt.objects.all()
    serializer_class = QuizAttemptSerializer
    permission_classes = [AllowAny]


class MarkViewSet(viewsets.ModelViewSet):
    queryset = Mark.objects.all()
    serializer_class = MarkSerializer
    permission_classes = [AllowAny]


# ===================== DOWNLOAD =====================
@api_view(['GET'])
@permission_classes([AllowAny])
def download_marksheet(request):
    return Response({"message": "Download working"})

# ===================== SMART STUDENT FILTER =====================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def students_by_course(request):
    course_id = request.GET.get('course_id')

    if not course_id:
        return Response([])

    try:
        enrollments = Enrollment.objects.filter(
            course_id=course_id
        ).select_related('student')
    except Exception:
        return Response([])

    data = []

    for e in enrollments:
        student = e.student

        # 🔥 ONLY STUDENTS (skip admin & teacher safely)
        if getattr(student, "role", None) != "student":
            continue

        data.append({
            "id": student.id,
            "name": student.username,
            "student_id": getattr(student, "roll_number", "")
        })

    return Response(data)