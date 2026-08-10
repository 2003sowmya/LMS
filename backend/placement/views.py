from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from exams.services import get_academic_standing

from users.models import User, Department, PriorAcademics

from .eligibility import check_eligibility
from .models import (
    PlacementCoordinator,
    Company,
    Drive,
    JobRole,
    DriveRound,
    EligibilityRule,
)

from .serializers import (
    CompanySerializer,
    DepartmentLiteSerializer,
    DriveRoundSerializer,
    DriveSerializer,
    EligibilityRuleSerializer,
    JobRoleSerializer,
    MyAcademicsSerializer,
    PlacementCoordinatorSerializer,
    StudentAcademicsSerializer,
    StudentDriveSerializer,
    StudentJobRoleSerializer,
    TeacherLiteSerializer,
)
from .permissions import (
    can_manage_placement,
    can_view_placement_staff,
    coordinator_department,
    is_placement_coordinator,
    is_placement_officer,
    is_placement_student,
    is_super_admin,
    scope_students_for,
)

# ===================== WHO AM I (placement context) =====================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def placement_me(request):
    """
    What this user is allowed to do in placement, and which department they
    are scoped to.

    The frontend calls this once on load to decide which portal to show, so
    the sidebar and route guards read from the SAME rules the API enforces.
    A frontend that decides for itself will eventually disagree with the
    backend, and the user sees a screen they cannot actually use.
    """
    user = request.user
    department = coordinator_department(user)

    return Response({
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
        "sub_role": user.sub_role,
        "is_placement_officer": is_placement_officer(user),
        "is_placement_coordinator": is_placement_coordinator(user),
        "is_super_admin": is_super_admin(user),
        "can_manage_placement": can_manage_placement(user),
        "can_view_placement_staff": can_view_placement_staff(user),
        "department_id": department.id if department else None,
        "department_name": department.name if department else None,
        "department_code": department.code if department else None,
    })


# ===================== COORDINATOR LIST / CREATE =====================
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def coordinator_list(request):
    """
    GET  -> list coordinator assignments
    POST -> assign a teacher as coordinator for a department

    Only the placement officer assigns coordinators. A coordinator can see
    the list (so they know who their counterparts are) but cannot change it.
    """
    user = request.user

    # ---------------- LIST ----------------
    if request.method == "GET":

        if not can_view_placement_staff(user):
            return Response(
                {"detail": "Not allowed."},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = (
            PlacementCoordinator.objects
            .select_related("teacher", "department", "assigned_by")
        )

        # `?active=true` / `?active=false`, default all
        active = request.query_params.get("active")
        if active == "true":
            queryset = queryset.filter(is_active=True)
        elif active == "false":
            queryset = queryset.filter(is_active=False)

        serializer = PlacementCoordinatorSerializer(queryset, many=True)
        return Response(serializer.data)

    # ---------------- CREATE ----------------
    if not can_manage_placement(user):
        return Response(
            {"detail": "Only the placement officer can assign coordinators."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = PlacementCoordinatorSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # assigned_by comes from the request, never from the payload
    serializer.save(assigned_by=user)

    return Response(serializer.data, status=status.HTTP_201_CREATED)


# ===================== COORDINATOR DETAIL =====================
@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def coordinator_detail(request, pk):
    """
    PATCH  -> update an assignment (usually is_active = false to end it)
    DELETE -> deactivate, NOT remove

    Delete is a soft delete on purpose: once drives and applications reference
    a coordinator's actions, removing the row would orphan that history.
    """
    user = request.user

    if not can_manage_placement(user):
        return Response(
            {"detail": "Only the placement officer can change coordinators."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        assignment = PlacementCoordinator.objects.get(pk=pk)
    except PlacementCoordinator.DoesNotExist:
        return Response(
            {"detail": "Assignment not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # ---------------- SOFT DELETE ----------------
    if request.method == "DELETE":
        assignment.is_active = False
        assignment.save(update_fields=["is_active"])
        return Response(
            {"detail": "Coordinator assignment deactivated."},
            status=status.HTTP_200_OK,
        )

    # ---------------- UPDATE ----------------
    serializer = PlacementCoordinatorSerializer(
        assignment,
        data=request.data,
        partial=True,
    )
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer.save()
    return Response(serializer.data)


# ===================== TEACHER PICKER =====================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def assignable_teachers(request):
    """
    Teachers who can be made coordinators, for the assign dropdown.
    Optional `?department=<id>` to narrow to one department.
    """
    user = request.user

    if not can_manage_placement(user):
        return Response(
            {"detail": "Not allowed."},
            status=status.HTTP_403_FORBIDDEN,
        )

    queryset = (
        User.objects
        .filter(role="teacher")
        .select_related("department")
        .order_by("username")
    )

    department_id = request.query_params.get("department")
    if department_id:
        queryset = queryset.filter(department_id=department_id)

    return Response(TeacherLiteSerializer(queryset, many=True).data)


# ===================== PLACEMENT DEPARTMENTS =====================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def placement_departments(request):
    """
    Departments that actually admit students.

    Service departments (Mathematics, Physics, Tamil...) own subjects but have
    no students of their own, so they must never appear as a placement branch.
    Tested by whether any student belongs to them -- no extra flag to maintain,
    nothing to keep in sync.
    """
    user = request.user

    if not can_view_placement_staff(user):
        return Response(
            {"detail": "Not allowed."},
            status=status.HTTP_403_FORBIDDEN,
        )

    queryset = (
        Department.objects
        .filter(user__role="student")
        .distinct()
        .order_by("name")
    )

    return Response(DepartmentLiteSerializer(queryset, many=True).data)


# ===================== MY ACADEMICS (STUDENT) =====================
@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def my_academics(request):
    """
    GET -> the student's own 10th / 12th / diploma record
    PUT -> create or update it

    The record is looked up from request.user, never from an id in the
    payload. Accepting a student id here would let any student read or
    overwrite another student's marks by changing one number.

    Editing an already-verified record CLEARS the verification. A student who
    could edit after approval could pass verification with real marks and then
    change them -- the coordinator's tick has to mean "these exact values were
    checked", not "this student was checked once".
    """
    user = request.user

    if not is_placement_student(user):
        return Response(
            {"detail": "Only students have a placement profile."},
            status=status.HTTP_403_FORBIDDEN,
        )

    record = PriorAcademics.objects.filter(student=user).first()

    # ---------------- READ ----------------
    if request.method == "GET":
        if not record:
            # No row yet. Return an empty shape rather than a 404 so the form
            # can render blank fields instead of handling an error path.
            return Response({
                "exists": False,
                "verified": False,
                "is_lateral_entry": False,
            })

        data = MyAcademicsSerializer(record).data
        data["exists"] = True
        return Response(data)

    # ---------------- WRITE ----------------
    was_verified = bool(record and record.verified)

    serializer = MyAcademicsSerializer(record, data=request.data, partial=bool(record))
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    saved = serializer.save(student=user)

    # any edit after verification sends it back for re-checking
    if was_verified:
        saved.verified = False
        saved.verified_by = None
        saved.verified_at = None
        saved.save(update_fields=["verified", "verified_by", "verified_at"])

    data = MyAcademicsSerializer(saved).data
    data["exists"] = True
    data["verification_reset"] = was_verified

    return Response(data, status=status.HTTP_200_OK)


# ===================== VERIFICATION LIST (COORDINATOR) =====================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def academics_verification_list(request):
    """
    Students the caller may verify, with whatever each has entered.

    Students are scoped through scope_students_for() -- the same function
    every other coordinator screen uses -- so a coordinator sees only their
    own department and the officer sees everyone.

    Students with NO record are included, marked has_record=False. Leaving
    them out would hide exactly the students who need chasing.

    Optional filters:
        ?status=pending    entered something, not yet verified
        ?status=verified   verified
        ?status=missing    no record at all
    """
    user = request.user

    if not can_view_placement_staff(user):
        return Response(
            {"detail": "Not allowed."},
            status=status.HTTP_403_FORBIDDEN,
        )

    students = scope_students_for(
        user,
        User.objects.filter(role="student"),
    ).select_related("department").order_by("roll_number")

    records = {
        r.student_id: r
        for r in PriorAcademics.objects.filter(student__in=students)
        .select_related("student", "student__department", "verified_by")
    }

    wanted = request.query_params.get("status")

    rows = []
    counts = {"verified": 0, "pending": 0, "missing": 0}

    for student in students:
        record = records.get(student.id)

        if record is None:
            state = "missing"
        elif record.verified:
            state = "verified"
        else:
            state = "pending"

        counts[state] += 1

        if wanted and wanted != state:
            continue

        if record is None:
            rows.append({
                "id": None,
                "student": student.id,
                "student_name": student.username,
                "roll_number": student.roll_number,
                "department_name": (
                    student.department.name if student.department else None
                ),
                "has_record": False,
                "state": "missing",
                "verified": False,
            })
        else:
            row = StudentAcademicsSerializer(record).data
            row["has_record"] = True
            row["state"] = state
            rows.append(row)

    return Response({
        "counts": counts,
        "total": students.count(),
        "results": rows,
    })


# ===================== VERIFY ONE STUDENT (COORDINATOR) =====================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_academics(request, student_id):
    """
    Mark one student's record verified, or send it back.

    Body: {"verified": true}  or  {"verified": false}

    The student is re-checked through scope_students_for() rather than
    trusted from the URL -- otherwise a coordinator could verify any student
    in the college by typing a different id.
    """
    user = request.user

    if not can_view_placement_staff(user):
        return Response(
            {"detail": "Not allowed."},
            status=status.HTTP_403_FORBIDDEN,
        )

    allowed = scope_students_for(user, User.objects.filter(role="student"))

    student = allowed.filter(pk=student_id).first()
    if not student:
        # same message whether the student does not exist or is out of scope,
        # so this cannot be used to discover who is in another department
        return Response(
            {"detail": "Student not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    record = PriorAcademics.objects.filter(student=student).first()
    if not record:
        return Response(
            {"detail": "This student has not entered their academic details yet."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    verified = request.data.get("verified", True)

    if verified:
        # nothing verifiable without a 10th mark and the qualifying mark
        if record.tenth_percent is None or record.qualifying_percent is None:
            return Response(
                {"detail": "Record is incomplete -- ask the student to finish it first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        record.verified = True
        record.verified_by = user
        record.verified_at = timezone.now()
    else:
        record.verified = False
        record.verified_by = None
        record.verified_at = None

    record.save(update_fields=["verified", "verified_by", "verified_at"])

    return Response(StudentAcademicsSerializer(record).data)

# ===================== COMPANY LIST / CREATE =====================
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def company_list(request):
    """
    GET  -> list companies
    POST -> add a company

    Coordinators can READ the list (they need to know who is visiting their
    department) but only the officer can add or change one. Companies are
    college-wide, so there is no department scoping here.

    Filters:
        ?active=true / false
        ?category=product|service|core|startup|other
        ?q=<text>     matches name
    """
    user = request.user

    # ---------------- LIST ----------------
    if request.method == "GET":

        if not can_view_placement_staff(user):
            return Response(
                {"detail": "Not allowed."},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = Company.objects.select_related("created_by")

        active = request.query_params.get("active")
        if active == "true":
            queryset = queryset.filter(is_active=True)
        elif active == "false":
            queryset = queryset.filter(is_active=False)

        category = request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)

        search = request.query_params.get("q")
        if search:
            queryset = queryset.filter(name__icontains=search.strip())

        return Response(CompanySerializer(queryset, many=True).data)

    # ---------------- CREATE ----------------
    if not can_manage_placement(user):
        return Response(
            {"detail": "Only the placement officer can add companies."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = CompanySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer.save(created_by=user)

    return Response(serializer.data, status=status.HTTP_201_CREATED)


# ===================== COMPANY DETAIL =====================
@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def company_detail(request, pk):
    """
    GET    -> one company
    PATCH  -> edit it
    DELETE -> deactivate, NOT remove

    Delete is soft on purpose. Once drives, applications and offers reference
    a company, removing the row would orphan a student's placement record --
    the one piece of data they will still care about years later.
    """
    user = request.user

    if not can_view_placement_staff(user):
        return Response(
            {"detail": "Not allowed."},
            status=status.HTTP_403_FORBIDDEN,
        )

    company = Company.objects.filter(pk=pk).select_related("created_by").first()
    if not company:
        return Response(
            {"detail": "Company not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # ---------------- READ ----------------
    if request.method == "GET":
        return Response(CompanySerializer(company).data)

    # anything past here changes data
    if not can_manage_placement(user):
        return Response(
            {"detail": "Only the placement officer can change companies."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # ---------------- SOFT DELETE ----------------
    if request.method == "DELETE":
        company.is_active = False
        company.save(update_fields=["is_active"])
        return Response(
            {"detail": f"{company.name} marked inactive."},
            status=status.HTTP_200_OK,
        )

    # ---------------- UPDATE ----------------
    serializer = CompanySerializer(company, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer.save()
    return Response(serializer.data)


# ===================== COMPANY CATEGORIES =====================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def company_categories(request):
    """
    The category options, read from the model.

    Sent to the frontend rather than hardcoded in the dropdown, so adding a
    category means editing CATEGORY_CHOICES in one place instead of the model
    AND every form that offers it.
    """
    if not can_view_placement_staff(request.user):
        return Response(
            {"detail": "Not allowed."},
            status=status.HTTP_403_FORBIDDEN,
        )

    return Response([
        {"value": value, "label": label}
        for value, label in Company.CATEGORY_CHOICES
    ])

# ===================== DRIVE LIST / CREATE =====================
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def drive_list(request):
    """
    GET  -> drives with their roles, for staff
    POST -> create a drive (the visit only -- roles are added after)

    Coordinators read; only the officer creates. Drives are college-wide, so
    there is no department scoping on the drive itself -- who may APPLY is
    decided per student per ROLE by the eligibility rule.

    Filters: ?status=  ?company=  ?open=true
    """
    user = request.user

    if request.method == "GET":

        if not can_view_placement_staff(user):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        queryset = (
            Drive.objects
            .select_related("company", "created_by")
            .prefetch_related(
                "rounds",
                "job_roles__eligibility__allowed_departments",
            )
        )

        drive_status = request.query_params.get("status")
        if drive_status:
            queryset = queryset.filter(status=drive_status)

        company = request.query_params.get("company")
        if company:
            queryset = queryset.filter(company_id=company)

        # is_open is a PROPERTY, not a column, so it cannot be filtered in SQL.
        # Filtering in Python is fine -- a college runs tens of drives a year.
        drives = list(queryset)

        if request.query_params.get("open") == "true":
            drives = [d for d in drives if d.is_open]

        return Response(DriveSerializer(drives, many=True).data)

    # ---------------- CREATE ----------------
    if not can_manage_placement(user):
        return Response(
            {"detail": "Only the placement officer can create drives."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = DriveSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    drive = serializer.save(created_by=user)

    return Response(
        DriveSerializer(drive).data,
        status=status.HTTP_201_CREATED,
    )


# ===================== DRIVE DETAIL =====================
@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def drive_detail(request, pk):
    """
    GET    -> one drive with its rounds and roles
    PATCH  -> edit it
    DELETE -> cancel, NOT remove

    Cancelling rather than deleting keeps applications and round results
    pointing at a real drive. A student who sat three rounds should still be
    able to see that they did.
    """
    user = request.user

    if not can_view_placement_staff(user):
        return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

    drive = (
        Drive.objects
        .select_related("company", "created_by")
        .prefetch_related("rounds", "job_roles__eligibility__allowed_departments")
        .filter(pk=pk)
        .first()
    )
    if not drive:
        return Response({"detail": "Drive not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(DriveSerializer(drive).data)

    if not can_manage_placement(user):
        return Response(
            {"detail": "Only the placement officer can change drives."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "DELETE":
        drive.status = "cancelled"
        drive.save(update_fields=["status"])
        return Response({"detail": f"{drive} cancelled."})

    serializer = DriveSerializer(drive, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer.save()
    return Response(DriveSerializer(drive).data)


# ===================== JOB ROLES =====================
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def drive_job_roles(request, pk):
    """
    GET  -> the roles on offer in a drive
    POST -> add a role

    Every new role gets an eligibility row immediately, with everything null
    (= no limit). Without it the officer has to remember a second step, and a
    role with no rule row becomes a special case every screen must handle.
    """
    user = request.user

    if not can_view_placement_staff(user):
        return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

    drive = Drive.objects.filter(pk=pk).first()
    if not drive:
        return Response({"detail": "Drive not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        roles = drive.job_roles.select_related("drive__company").prefetch_related(
            "eligibility__allowed_departments"
        )
        return Response(JobRoleSerializer(roles, many=True).data)

    if not can_manage_placement(user):
        return Response(
            {"detail": "Only the placement officer can add roles."},
            status=status.HTTP_403_FORBIDDEN,
        )

    data = dict(request.data)
    data["drive"] = drive.id

    serializer = JobRoleSerializer(data=data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    role = serializer.save()
    EligibilityRule.objects.get_or_create(job_role=role)

    return Response(
        JobRoleSerializer(role).data,
        status=status.HTTP_201_CREATED,
    )


# ===================== JOB ROLE DETAIL =====================
@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def job_role_detail(request, role_id):
    """
    GET    -> one role with its eligibility
    PATCH  -> edit it
    DELETE -> deactivate, NOT remove

    Soft delete again: applications point at a role, and removing it would
    orphan them.
    """
    user = request.user

    if not can_view_placement_staff(user):
        return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

    role = (
        JobRole.objects
        .select_related("drive__company")
        .prefetch_related("eligibility__allowed_departments")
        .filter(pk=role_id)
        .first()
    )
    if not role:
        return Response({"detail": "Role not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(JobRoleSerializer(role).data)

    if not can_manage_placement(user):
        return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "DELETE":
        role.is_active = False
        role.save(update_fields=["is_active"])
        return Response({"detail": f"{role.title} deactivated."})

    serializer = JobRoleSerializer(role, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer.save()
    return Response(JobRoleSerializer(role).data)


# ===================== ELIGIBILITY RULE =====================
@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def role_eligibility(request, role_id):
    """
    GET   -> the rule for one ROLE
    PATCH -> edit the cutoffs

    allowed_departments is a M2M and must be sent as a list of ids.
    Sending [] means every branch -- the "no limit" case, not an error.
    """
    user = request.user

    if not can_view_placement_staff(user):
        return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

    role = JobRole.objects.filter(pk=role_id).first()
    if not role:
        return Response({"detail": "Role not found."}, status=status.HTTP_404_NOT_FOUND)

    rule, _ = EligibilityRule.objects.get_or_create(job_role=role)

    if request.method == "GET":
        return Response(EligibilityRuleSerializer(rule).data)

    if not can_manage_placement(user):
        return Response(
            {"detail": "Only the placement officer can change eligibility."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = EligibilityRuleSerializer(rule, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer.save()
    return Response(EligibilityRuleSerializer(rule).data)


# ===================== WHO MATCHES (LIVE COUNT) =====================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def role_matches(request, role_id):
    """
    How many students meet this ROLE's rules right now, and why the rest fail.

    Computed live on every call -- never stored. A stored count would be wrong
    the moment a result is published, a mark is verified, or a cutoff changes.

    Coordinators see only their own department's students; the officer sees
    the college. Same scope_students_for() every other screen uses.

    ?detail=true returns the per-student breakdown as well as the count.
    """
    user = request.user

    if not can_view_placement_staff(user):
        return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

    role = (
        JobRole.objects
        .select_related("drive")
        .prefetch_related("eligibility__allowed_departments")
        .filter(pk=role_id)
        .first()
    )
    if not role:
        return Response({"detail": "Role not found."}, status=status.HTTP_404_NOT_FOUND)

    students = scope_students_for(
        user,
        User.objects.filter(role="student"),
    ).select_related("department", "prior_academics", "course")

    want_detail = request.query_params.get("detail") == "true"

    eligible = 0
    rows = []
    # Why students fail, aggregated. An officer setting a cutoff wants to know
    # "40 fail on CGPA, 12 have not verified" -- a bare count of 3 eligible
    # tells them nothing about which rule to relax.
    reasons = {}

    for student in students:
        result = check_eligibility(student, role)

        if result["eligible"]:
            eligible += 1
        else:
            for blocker in result["blockers"]:
                reasons[blocker] = reasons.get(blocker, 0) + 1

        if want_detail:
            rows.append({
                "student": student.id,
                "student_name": student.username,
                "roll_number": student.roll_number,
                "department_name": (
                    student.department.name if student.department else None
                ),
                "eligible": result["eligible"],
                "blockers": result["blockers"],
            })

    total = students.count()

    payload = {
        "job_role": role.id,
        "role_title": role.title,
        "total_students": total,
        "eligible": eligible,
        "not_eligible": total - eligible,
        "reasons": [
            {"reason": r, "count": c}
            for r, c in sorted(reasons.items(), key=lambda x: -x[1])
        ],
    }

    if want_detail:
        payload["results"] = rows

    return Response(payload)


# ===================== DRIVE ROUNDS =====================
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def drive_rounds(request, pk):
    """
    GET  -> the round sequence for a drive
    POST -> add a round

    Rounds belong to the DRIVE, not a role -- every candidate goes through the
    same sequence whichever role they applied for.

    `order` is assigned server-side as the next number, never taken from the
    client: a client-supplied order collides with the unique constraint the
    moment two people add a round at once.
    """
    user = request.user

    if not can_view_placement_staff(user):
        return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

    drive = Drive.objects.filter(pk=pk).first()
    if not drive:
        return Response({"detail": "Drive not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(DriveRoundSerializer(drive.rounds.all(), many=True).data)

    if not can_manage_placement(user):
        return Response(
            {"detail": "Only the placement officer can add rounds."},
            status=status.HTTP_403_FORBIDDEN,
        )

    last = drive.rounds.order_by("-order").first()
    next_order = (last.order + 1) if last else 1

    data = dict(request.data)
    data["drive"] = drive.id
    data["order"] = next_order

    serializer = DriveRoundSerializer(data=data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


# ===================== DRIVE ROUND DETAIL =====================
@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def drive_round_detail(request, round_id):
    """
    PATCH  -> rename a round or set its date
    DELETE -> remove it, then renumber the rest

    Renumbering matters: deleting round 2 of four would otherwise leave
    1, 3, 4, and the gap looks like a missing round on every screen.
    """
    user = request.user

    if not can_manage_placement(user):
        return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

    round_obj = DriveRound.objects.filter(pk=round_id).select_related("drive").first()
    if not round_obj:
        return Response({"detail": "Round not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        drive = round_obj.drive
        round_obj.delete()

        for index, r in enumerate(drive.rounds.order_by("order"), start=1):
            if r.order != index:
                r.order = index
                r.save(update_fields=["order"])

        return Response({"detail": "Round removed."})

    serializer = DriveRoundSerializer(round_obj, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer.save()
    return Response(serializer.data)


# ===================== MY DRIVES (STUDENT) =====================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_drives(request):
    """
    Drives a student can see, each ROLE carrying their own eligibility result.

    Eligibility is per role, so a student may qualify for one position in a
    drive and not another. The drive is listed once with its roles beneath.

    Ineligible roles are still shown, with reasons. Hiding them would leave a
    student wondering why a friend can apply and they cannot, and the reasons
    are exactly what tells them whether it is worth fixing.

    Academic standing is fetched ONCE and reused across every role rather than
    recomputing CGPA per role.
    """
    user = request.user

    if not is_placement_student(user):
        return Response(
            {"detail": "Only students have a drive list."},
            status=status.HTTP_403_FORBIDDEN,
        )

    drives = (
        Drive.objects
        .filter(status__in=["published", "closed"])
        .select_related("company")
        .prefetch_related(
            "rounds",
            "job_roles__eligibility__allowed_departments",
        )
        .order_by("-created_at")
    )

    standing = get_academic_standing(user)

    rows = []
    eligible_roles = 0

    for drive in drives:
        drive_row = StudentDriveSerializer(drive).data

        roles = []
        for role in drive.job_roles.all():
            if not role.is_active:
                continue

            result = check_eligibility(user, role, standing=standing)

            role_row = StudentJobRoleSerializer(role).data
            role_row["eligible"] = result["eligible"]
            role_row["blockers"] = result["blockers"]
            role_row["checks"] = result["checks"]
            role_row["is_open"] = role.is_open
            roles.append(role_row)

            if result["eligible"]:
                eligible_roles += 1

        # A drive with no roles yet is not worth showing -- there is nothing
        # to apply for.
        if not roles:
            continue

        drive_row["job_roles"] = roles
        drive_row["any_eligible"] = any(r["eligible"] for r in roles)
        rows.append(drive_row)

    return Response({
        "standing": standing,
        "eligible_count": eligible_roles,
        "results": rows,
    })