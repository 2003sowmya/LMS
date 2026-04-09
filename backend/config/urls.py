from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/users/', include('users.urls')),
    path('api/', include('courses.urls')),
    #path('api/learning/', include('learning.urls')),

    path('api-auth/', include('rest_framework.urls')),
]