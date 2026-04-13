from rest_framework import serializers
from .models import Course, Enrollment, Assignment, Lecture


# ===================== COURSE SERIALIZER =====================
class CourseSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.username', read_only=True)
    teacher_dept = serializers.CharField(source='teacher.department', read_only=True)

    class Meta:
        model = Course
        fields = [
            'id',
            'title',
            'description',
            'teacher',
            'teacher_name',
            'teacher_dept',
            'created_at'
        ]


# ===================== ENROLLMENT SERIALIZER =====================
class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    student_dept = serializers.CharField(source='student.department', read_only=True)
    student_roll = serializers.CharField(source='student.roll_number', read_only=True)

    course_title = serializers.CharField(source='course.title', read_only=True)
    course_teacher = serializers.CharField(source='course.teacher.username', read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id',
            'student',
            'student_name',
            'student_dept',
            'student_roll',
            'course',
            'course_title',
            'course_teacher',
            'enrolled_at'
        ]


# ===================== ASSIGNMENT SERIALIZER =====================
class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = '__all__'


# ===================== LECTURE SERIALIZER =====================
class LectureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lecture
        fields = '__all__'