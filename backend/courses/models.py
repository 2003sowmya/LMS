from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


# ===================== COURSE MODEL =====================
class Course(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()

    # Each course is assigned to a teacher
    teacher = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'teacher'},   # Only users with role=teacher
        related_name='teaching_courses'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.teacher.username}"


# ===================== ENROLLMENT MODEL =====================
class Enrollment(models.Model):
    # Student enrolling
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'},   # Only users with role=student
        related_name='enrollments'
    )

    # Course being enrolled
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )

    enrolled_at = models.DateTimeField(auto_now_add=True)

    # Prevent duplicate enrollment
    class Meta:
        unique_together = ['student', 'course']
        ordering = ['-enrolled_at']   # Latest first

    def __str__(self):
        return f"{self.student.username} enrolled in {self.course.title}"