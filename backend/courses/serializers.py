from rest_framework import serializers
from .models import Course, Enrollment


class CourseSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.username', read_only=True)

    class Meta:
        model = Course
        fields = '__all__'


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)

    class Meta:
        model = Enrollment
        fields = '__all__'