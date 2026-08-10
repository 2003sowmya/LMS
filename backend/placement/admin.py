from django.contrib import admin

from .models import PlacementCoordinator


@admin.register(PlacementCoordinator)
class PlacementCoordinatorAdmin(admin.ModelAdmin):
    list_display = ("teacher", "department", "is_active", "assigned_at")
    list_filter = ("is_active", "department")
    search_fields = ("teacher__username", "teacher__employee_id", "department__name")
    ordering = ("department__name", "-assigned_at")