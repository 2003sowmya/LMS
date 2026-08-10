from django.urls import path

from . import views

urlpatterns = [

    # ================= CONTEXT =================
    path("me/", views.placement_me, name="placement-me"),

    # ================= COORDINATORS =================
    path("coordinators/", views.coordinator_list, name="placement-coordinator-list"),
    path("coordinators/<int:pk>/", views.coordinator_detail, name="placement-coordinator-detail"),

    # ================= PICKERS =================
    path("assignable-teachers/", views.assignable_teachers, name="placement-assignable-teachers"),
    path("departments/", views.placement_departments, name="placement-departments"),

    # ================= ACADEMICS (PHASE 1) =================
    path("my-academics/", views.my_academics, name="placement-my-academics"),
    path("verify-academics/", views.academics_verification_list, name="placement-verify-academics-list"),
    path("verify-academics/<int:student_id>/", views.verify_academics, name="placement-verify-academics"),

    # ================= COMPANIES (PHASE 2) =================
    # "categories" stays above "<int:pk>" so the literal path matches first.
    path("companies/categories/", views.company_categories, name="placement-company-categories"),
    path("companies/", views.company_list, name="placement-company-list"),
    path("companies/<int:pk>/", views.company_detail, name="placement-company-detail"),

    # ================= DRIVES (PHASE 3) =================
    path("my-drives/", views.my_drives, name="placement-my-drives"),
    path("drives/", views.drive_list, name="placement-drive-list"),
    path("drives/<int:pk>/", views.drive_detail, name="placement-drive-detail"),
    path("drives/<int:pk>/roles/", views.drive_job_roles, name="placement-drive-job-roles"),
    path("drives/<int:pk>/rounds/", views.drive_rounds, name="placement-drive-rounds"),

    # ================= JOB ROLES (PHASE 3b) =================
    # Eligibility and the match count hang off the ROLE, not the drive -- one
    # visit can open several positions with different cutoffs.
    path("roles/<int:role_id>/", views.job_role_detail, name="placement-job-role-detail"),
    path("roles/<int:role_id>/eligibility/", views.role_eligibility, name="placement-role-eligibility"),
    path("roles/<int:role_id>/matches/", views.role_matches, name="placement-role-matches"),

    # Rounds are edited by their OWN id -- a nested path would carry both a
    # drive id and a round id, and the two could disagree.
    path("rounds/<int:round_id>/", views.drive_round_detail, name="placement-drive-round-detail"),
]