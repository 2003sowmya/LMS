from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import CourseViewSet, EnrollmentViewSet, admin_dashboard

router = DefaultRouter()

# ================= ROUTES =================
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')

# ================= URLPATTERNS =================
urlpatterns = [
    path('admin-dashboard/', admin_dashboard, name='admin-dashboard'),
]

urlpatterns += router.urls