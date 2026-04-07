from django.db import models
from users.models import User
from courses.models import Course


class Lecture(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="lectures")
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    video_file = models.FileField(upload_to='lectures/videos/', blank=True, null=True)
    meeting_link = models.URLField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)


class Assignment(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    due_date = models.DateTimeField()

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="assignments")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)


class Submission(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE)

    file = models.FileField(upload_to="submissions/")
    submitted_at = models.DateTimeField(auto_now_add=True)
    grade = models.FloatField(null=True, blank=True)