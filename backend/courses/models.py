from django.db import models
from users.models import User


class Course(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()

    teacher = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'teacher'}
    )

    created_at = models.DateTimeField(auto_now_add=True)


class Enrollment(models.Model):
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'}
    )

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="enrollments"
    )

    enrolled_at = models.DateTimeField(auto_now_add=True)