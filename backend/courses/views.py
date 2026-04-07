from rest_framework import viewsets
from .models import Course, Enrollment
from .serializers import CourseSerializer, EnrollmentSerializer


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)