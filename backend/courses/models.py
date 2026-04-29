from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

User = get_user_model()


# ===================== COURSE MODEL =====================
class Course(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()

    course_code = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True
    )

    teacher = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'teacher'},
        related_name='teaching_courses',
        null=True,
        blank=True
    )

    department = models.CharField(max_length=50, default='General')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.course_code:
            last = Course.objects.order_by('-id').first()
            number = (last.id + 1) if last else 1
            self.course_code = f"CSE{number:03d}"
        super().save(*args, **kwargs)

    def __str__(self):
        teacher_name = self.teacher.username if self.teacher else "No Teacher"
        return f"{self.course_code} - {self.title} ({teacher_name})"


# ===================== ENROLLMENT MODEL =====================
class Enrollment(models.Model):
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'},
        related_name='enrollments'
    )

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )

    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'course'],
                name='unique_student_course'
            )
        ]
        ordering = ['-enrolled_at']

    def __str__(self):
        return f"{self.student.username} enrolled in {self.course.title}"


# ===================== ASSIGNMENT =====================
class Assignment(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    max_marks = models.IntegerField(default=100)
    target_group = models.CharField(max_length=100, default="All Students")
    allowed_types = models.CharField(max_length=200, default="PDF,DOCX")

    reference_file = models.FileField(
        upload_to='assignments/references/',
        null=True,
        blank=True
    )


# ===================== SUBMISSION =====================
class Submission(models.Model):

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('evaluated', 'Evaluated'),
        ('late', 'Late'),
    ]

    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name='submissions'
    )

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'},
        related_name='submissions'
    )

    file = models.FileField(upload_to='submissions/', null=True, blank=True)
    text_entry = models.TextField(blank=True, default='')
    url_entry = models.URLField(blank=True, default='')

    submitted_at = models.DateTimeField(auto_now_add=True)

    marks = models.FloatField(null=True, blank=True)
    feedback = models.TextField(blank=True, default='')

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['assignment', 'student'],
                name='unique_submission'
            )
        ]
        ordering = ['-submitted_at']

    def save(self, *args, **kwargs):
        if self.assignment and self.assignment.due_date and not self.pk:
            from django.utils import timezone
            if timezone.now() > self.assignment.due_date:
                self.status = 'late'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.username} → {self.assignment.title} [{self.status}]"


# ===================== LECTURE =====================
class Lecture(models.Model):
    TYPES = [('recorded', 'Recorded'), ('live', 'Live')]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    lecture_type = models.CharField(max_length=20, choices=TYPES, default='recorded')

    video_file = models.FileField(upload_to='lectures/', null=True, blank=True)
    meeting_link = models.URLField(blank=True)

    scheduled_at = models.DateTimeField(null=True, blank=True)

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


# ===================== NOTES =====================
class Note(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    chapter = models.CharField(max_length=200, blank=True)

    course = models.ForeignKey(Course, on_delete=models.CASCADE, null=True, blank=True)

    file = models.FileField(upload_to='notes/')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True)

    created_at = models.DateTimeField(auto_now_add=True)


# ===================== LIVE SESSION =====================
class LiveSession(models.Model):
    title = models.CharField(max_length=200)

    course = models.ForeignKey(Course, on_delete=models.CASCADE, null=True, blank=True)

    date = models.DateField(null=True, blank=True)
    time = models.TimeField(null=True, blank=True)

    duration = models.IntegerField(default=60)
    meeting_link = models.URLField(blank=True)
    agenda = models.TextField(blank=True)

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


# ===================== NOTIFICATION =====================
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}"


# ===================== QUIZ =====================
class Quiz(models.Model):
    title = models.CharField(max_length=200)

    course = models.ForeignKey(Course, on_delete=models.CASCADE, null=True, blank=True)

    time_limit = models.IntegerField(default=30)
    available_from = models.DateField(null=True, blank=True)
    available_until = models.DateField(null=True, blank=True)

    total_marks = models.IntegerField(default=50)

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


@receiver(post_save, sender=Quiz)
def notify_students_on_quiz_create(sender, instance, created, **kwargs):
    if created and instance.course:
        enrollments = Enrollment.objects.filter(course=instance.course)

        Notification.objects.bulk_create([
            Notification(
                user=e.student,
                message=f"📝 New Quiz: {instance.title} in {instance.course.title}"
            )
            for e in enrollments
        ])


# ===================== QUESTION =====================
class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')

    question_text = models.TextField()

    option_a = models.CharField(max_length=200, blank=True)
    option_b = models.CharField(max_length=200, blank=True)
    option_c = models.CharField(max_length=200, blank=True)
    option_d = models.CharField(max_length=200, blank=True)

    correct_answer = models.CharField(max_length=200, blank=True)
    marks = models.IntegerField(default=5)


# ===================== QUIZ ATTEMPT =====================
class QuizAttempt(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')

    answers = models.JSONField(default=dict)
    score = models.IntegerField(default=0)

    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['quiz', 'student'],
                name='unique_quiz_attempt'
            )
        ]


# ===================== MARK =====================
class Mark(models.Model):
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='marks',
        limit_choices_to={'role': 'student'}
    )

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='marks'
    )

    assessment_type = models.CharField(max_length=50)
    marks_obtained = models.FloatField()
    max_marks = models.FloatField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'course', 'assessment_type'],
                name='unique_student_course_assessment'
            )
        ]

    def __str__(self):
        return f"{self.student.username} - {self.course.title} - {self.assessment_type}"