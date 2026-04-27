from rest_framework import serializers
from .models import (
    Course,
    Enrollment,
    Assignment,
    Submission,
    Lecture,
    Note,
    LiveSession,
    Notification,
    Quiz,
    Question,
    QuizAttempt,
    Mark
)


# ===================== COURSE =====================
class CourseSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.username', read_only=True)
    teacher_dept = serializers.CharField(source='teacher.department', read_only=True)

    # ✅ ADDED: student count
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id',
            'title',
            'description',
            'teacher',
            'teacher_name',
            'teacher_dept',
            'created_at',
            'student_count'   # ✅ included
        ]

    def get_student_count(self, obj):
        return Enrollment.objects.filter(course=obj).count()


# ===================== ENROLLMENT =====================
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


# ===================== ASSIGNMENT =====================
class AssignmentSerializer(serializers.ModelSerializer):
    course_title = serializers.SerializerMethodField()

    def get_course_title(self, obj):
        return obj.course.title if obj.course else None

    class Meta:
        model = Assignment
        fields = '__all__'


# ===================== SUBMISSION =====================
class SubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    student_roll = serializers.CharField(source='student.roll_number', read_only=True)
    student_class = serializers.CharField(source='student.department', read_only=True)

    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    course_title = serializers.CharField(source='assignment.course.title', read_only=True)
    max_marks = serializers.IntegerField(source='assignment.max_marks', read_only=True)
    due_date = serializers.DateTimeField(source='assignment.due_date', read_only=True)

    class Meta:
        model = Submission
        fields = [
            'id',
            'assignment',
            'assignment_title',
            'course_title',
            'student',
            'student_name',
            'student_roll',
            'student_class',
            'file',
            'text_entry',
            'url_entry',
            'submitted_at',
            'status',
            'marks',
            'max_marks',
            'due_date',
            'feedback',
        ]
        read_only_fields = [
            'submitted_at',
            'student_name',
            'student_roll',
            'student_class',
            'assignment_title',
            'course_title',
            'max_marks',
            'due_date',
        ]

    def validate(self, data):
        if not (data.get('file') or data.get('text_entry') or data.get('url_entry')):
            raise serializers.ValidationError(
                "Provide at least file, text, or URL."
            )
        return data


# ===================== LECTURE =====================
class LectureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lecture
        fields = '__all__'


# ===================== NOTES =====================
class NoteSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = Note
        fields = '__all__'

    def get_file(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


# ===================== LIVE SESSION =====================
class LiveSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiveSession
        fields = '__all__'


# ===================== NOTIFICATION =====================
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


# ===================== QUESTION =====================
class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = '__all__'


# ===================== QUIZ =====================
class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Quiz
        fields = '__all__'


# ===================== QUIZ ATTEMPT =====================
class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = '__all__'
        read_only_fields = ['student', 'score', 'submitted_at']


# ===================== MARK =====================
class MarkSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Mark
        fields = '__all__'