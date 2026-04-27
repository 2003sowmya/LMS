from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


# ================= SUBMISSION =================
class Submission(models.Model):
    assignment = models.ForeignKey(
        "courses.Assignment",   # ✅ FIXED
        on_delete=models.CASCADE
    )

    student = models.ForeignKey(User, on_delete=models.CASCADE)

    file = models.FileField(upload_to="submissions/")
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student} - {self.assignment}"