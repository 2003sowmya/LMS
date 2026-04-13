from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    CourseViewSet,
    EnrollmentViewSet,
    AssignmentViewSet,
    LectureViewSet,
    admin_dashboard
)

router = DefaultRouter()

# ================= ROUTES =================
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')
router.register(r'assignments', AssignmentViewSet, basename='assignment')  # ✅ added
router.register(r'lectures', LectureViewSet, basename='lecture')           # ✅ added

# ================= URLPATTERNS =================
urlpatterns = [
    path('admin-dashboard/', admin_dashboard, name='admin-dashboard'),
]

urlpatterns += router.urls