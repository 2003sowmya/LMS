from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # ✅ Users (login, register)
    path('api/users/', include('users.urls')),

    # ✅ Courses module (enrollments, courses, assignments, lectures)
    path('api/', include('courses.urls')),

    # ✅ OPTIONAL: Only if you actually have a learning app
    # path('api/learning/', include('learning.urls')),

    # ✅ DRF login (optional)
    path('api-auth/', include('rest_framework.urls')),
]