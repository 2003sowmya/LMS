from rest_framework import viewsets
from rest_framework.permissions import BasePermission
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model

# ✅ Import all models
from .models import Course, Enrollment, Assignment, Lecture

# ✅ Import all serializers
from .serializers import (
    CourseSerializer,
    EnrollmentSerializer,
    AssignmentSerializer,
    LectureSerializer
)

User = get_user_model()


# ===================== CUSTOM PERMISSION =====================
class IsAdminOnly(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'admin'


# ===================== COURSE VIEWSET =====================
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().order_by('-created_at')
    serializer_class = CourseSerializer
    permission_classes = []


# ===================== ENROLLMENT VIEWSET =====================
class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all().order_by('-enrolled_at')
    serializer_class = EnrollmentSerializer
    permission_classes = []


# ===================== ASSIGNMENT VIEWSET =====================
class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all().order_by('-created_at')
    serializer_class = AssignmentSerializer
    permission_classes = []


# ===================== LECTURE VIEWSET =====================
class LectureViewSet(viewsets.ModelViewSet):
    queryset = Lecture.objects.all().order_by('-created_at')
    serializer_class = LectureSerializer
    permission_classes = []


# ===================== ADMIN DASHBOARD API =====================
@api_view(['GET'])
@permission_classes([])
def admin_dashboard(request):
    total_users = User.objects.count()
    total_students = User.objects.filter(role='student').count()
    total_teachers = User.objects.filter(role='teacher').count()

    total_courses = Course.objects.count()
    total_enrollments = Enrollment.objects.count()

    data = {
        "total_users": total_users,
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_courses": total_courses,
        "total_enrollments": total_enrollments,
    }

    return Response(data)