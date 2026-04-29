from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import UserViewSet, login_view, admin_dashboard

router = DefaultRouter()

# ✅ Better naming (clean API)
router.register(r'', UserViewSet, basename='user')

urlpatterns = [
    path('login/', login_view),
    path('admin-dashboard/', admin_dashboard),   # ✅ IMPORTANT FIX
]

urlpatterns += router.urls