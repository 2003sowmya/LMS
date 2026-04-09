from rest_framework import serializers
from .models import Course, Enrollment


# ===================== COURSE SERIALIZER =====================
class CourseSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.username', read_only=True)

    class Meta:
        model = Course
        fields = '__all__'


# ===================== ENROLLMENT SERIALIZER =====================
class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Enrollment
        fields = '__all__'