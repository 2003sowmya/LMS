from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import CourseViewSet, EnrollmentViewSet, admin_dashboard

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='courses')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollments')  # ✅ NEW

urlpatterns = router.urls + [
    path('admin-dashboard/', admin_dashboard),  # ✅ NEW
]