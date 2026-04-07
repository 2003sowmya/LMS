from rest_framework import viewsets
from .models import Lecture, Assignment, Submission
from .serializers import LectureSerializer, AssignmentSerializer, SubmissionSerializer


class LectureViewSet(viewsets.ModelViewSet):
    queryset = Lecture.objects.all()
    serializer_class = LectureSerializer

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)