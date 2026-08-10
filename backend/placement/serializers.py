from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from users.models import User, Department, PriorAcademics
from .models import (
    PlacementCoordinator,
    Company,
    Drive,
    JobRole,
    DriveRound,
    EligibilityRule,
)

# ===================== PLACEMENT COORDINATOR =====================
class PlacementCoordinatorSerializer(serializers.ModelSerializer):

    teacher_name = serializers.CharField(
        source="teacher.username",
        read_only=True,
    )

    teacher_employee_id = serializers.CharField(
        source="teacher.employee_id",
        read_only=True,
    )

    department_name = serializers.CharField(
        source="department.name",
        read_only=True,
    )

    department_code = serializers.CharField(
        source="department.code",
        read_only=True,
    )

    assigned_by_name = serializers.CharField(
        source="assigned_by.username",
        read_only=True,
    )

    class Meta:
        model = PlacementCoordinator
        fields = [
            "id",
            "teacher",
            "teacher_name",
            "teacher_employee_id",
            "department",
            "department_name",
            "department_code",
            "is_active",
            "assigned_at",
            "assigned_by",
            "assigned_by_name",
        ]
        # assigned_by is set server-side from request.user -- never accepted
        # from the client, same rule as class_section on teaching plans.
        read_only_fields = ["assigned_at", "assigned_by"]

    def validate(self, attrs):
        """
        Reject a second active coordinator for a department with a readable
        message, instead of letting the DB constraint raise a 500.
        """
        teacher = attrs.get("teacher") or getattr(self.instance, "teacher", None)
        department = attrs.get("department") or getattr(
            self.instance, "department", None
        )
        is_active = attrs.get(
            "is_active",
            getattr(self.instance, "is_active", True),
        )

        if teacher and teacher.role != "teacher":
            raise serializers.ValidationError(
                {"teacher": "Only a teacher can be a placement coordinator."}
            )

        if is_active and department:
            clash = PlacementCoordinator.objects.filter(
                department=department,
                is_active=True,
            )
            if self.instance:
                clash = clash.exclude(pk=self.instance.pk)

            existing = clash.first()
            if existing:
                raise serializers.ValidationError({
                    "department": (
                        f"{department.name} already has an active coordinator "
                        f"({existing.teacher.username}). Deactivate that "
                        f"assignment first."
                    )
                })

        return attrs


# ===================== TEACHER PICKER (for the assign dropdown) =====================
class TeacherLiteSerializer(serializers.ModelSerializer):

    department_name = serializers.CharField(
        source="department.name",
        read_only=True,
    )

    class Meta:
        model = User
        fields = ["id", "username", "employee_id", "department", "department_name"]
        read_only_fields = fields


# ===================== DEPARTMENT PICKER =====================
class DepartmentLiteSerializer(serializers.ModelSerializer):

    class Meta:
        model = Department
        fields = ["id", "name", "code"]
        read_only_fields = fields


# ===================== PRIOR ACADEMICS (STUDENT — OWN RECORD) =====================
class MyAcademicsSerializer(serializers.ModelSerializer):
    """
    The student's own 10th / 12th / diploma record.

    `verified`, `verified_by` and `verified_at` are READ ONLY here. If a
    student could set verified=True on their own record, the coordinator's
    verification step would be decoration -- anyone could type 95% and tick
    their own box.
    """

    qualifying_percent = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True,
    )

    verified_by_name = serializers.CharField(
        source="verified_by.username",
        read_only=True,
    )

    class Meta:
        model = PriorAcademics
        fields = [
            "id",
            # 10th
            "tenth_percent",
            "tenth_board",
            "tenth_year",
            # lateral entry
            "is_lateral_entry",
            # 12th
            "twelfth_percent",
            "twelfth_board",
            "twelfth_year",
            # diploma
            "diploma_percent",
            "diploma_branch",
            "diploma_year",
            # derived
            "qualifying_percent",
            # verification (read only for the student)
            "verified",
            "verified_by",
            "verified_by_name",
            "verified_at",
            "updated_at",
        ]
        read_only_fields = [
            "verified",
            "verified_by",
            "verified_at",
            "updated_at",
        ]

    def validate(self, attrs):
        """
        Run the model's own rule rather than repeating it here.

        PriorAcademics.clean() decides which qualification is required based
        on is_lateral_entry. Re-implementing that check in the serializer
        would give two versions of the same rule, and they would drift.
        """
        instance = self.instance or PriorAcademics()

        for field, value in attrs.items():
            setattr(instance, field, value)

        # editing an existing record: fields not sent keep their stored values,
        # which setattr above has already preserved
        try:
            instance.clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict)

        return attrs

    def validate_tenth_percent(self, value):
        if value is None:
            raise serializers.ValidationError("10th percentage is required.")
        return value


# ===================== PRIOR ACADEMICS (COORDINATOR — VERIFY) =====================
class StudentAcademicsSerializer(serializers.ModelSerializer):
    """
    One student's record as the coordinator sees it on the verification list.

    Read only. Verification is done through a dedicated endpoint rather than
    a PATCH on this serializer, so `verified` can never be set by accident
    alongside an unrelated field update.
    """

    student_name = serializers.CharField(
        source="student.username",
        read_only=True,
    )

    roll_number = serializers.CharField(
        source="student.roll_number",
        read_only=True,
    )

    department_name = serializers.CharField(
        source="student.department.name",
        read_only=True,
    )

    qualifying_percent = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True,
    )

    verified_by_name = serializers.CharField(
        source="verified_by.username",
        read_only=True,
    )

    class Meta:
        model = PriorAcademics
        fields = [
            "id",
            "student",
            "student_name",
            "roll_number",
            "department_name",
            "tenth_percent",
            "tenth_board",
            "tenth_year",
            "is_lateral_entry",
            "twelfth_percent",
            "twelfth_board",
            "twelfth_year",
            "diploma_percent",
            "diploma_branch",
            "diploma_year",
            "qualifying_percent",
            "verified",
            "verified_by",
            "verified_by_name",
            "verified_at",
            "updated_at",
        ]
        read_only_fields = fields

# ===================== COMPANY =====================
class CompanySerializer(serializers.ModelSerializer):

    category_display = serializers.CharField(
        source="get_category_display",
        read_only=True,
    )

    created_by_name = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )

    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "category",
            "category_display",
            "website",
            "about",
            "contact_person",
            "contact_email",
            "contact_phone",
            "is_active",
            "created_by",
            "created_by_name",
            "created_at",
        ]
        # created_by is taken from request.user in the view -- never accepted
        # from the payload, same rule as assigned_by on coordinators.
        read_only_fields = ["created_by", "created_at"]

    def validate_name(self, value):
        """
        Names are compared case-insensitively so "Zoho" and "zoho" cannot both
        be created. The DB unique constraint is case-SENSITIVE on PostgreSQL,
        so without this check both would save and the drive list would show
        what looks like two companies.
        """
        name = (value or "").strip()

        if not name:
            raise serializers.ValidationError("Company name is required.")

        clash = Company.objects.filter(name__iexact=name)
        if self.instance:
            clash = clash.exclude(pk=self.instance.pk)

        existing = clash.first()
        if existing:
            raise serializers.ValidationError(
                f"{existing.name} is already on the list."
            )

        return name

# ===================== DRIVE ROUND =====================
class DriveRoundSerializer(serializers.ModelSerializer):

    round_type_display = serializers.CharField(
        source="get_round_type_display",
        read_only=True,
    )

    class Meta:
        model = DriveRound
        fields = [
            "id",
            "drive",
            "order",
            "name",
            "round_type",
            "round_type_display",
            "round_date",
            "description",
        ]


# ===================== ELIGIBILITY RULE =====================
class EligibilityRuleSerializer(serializers.ModelSerializer):

    allowed_department_names = serializers.SerializerMethodField()

    class Meta:
        model = EligibilityRule
        fields = [
            "id",
            "drive",
            "min_cgpa",
            "max_arrears",
            "min_tenth_percent",
            "min_twelfth_percent",
            "allowed_departments",
            "allowed_department_names",
            "passing_year",
            "allow_lateral_entry",
            "allow_already_placed",
            "notes",
        ]
        read_only_fields = ["drive"]

    def get_allowed_department_names(self, obj):
        # reads the model's own helper, so "empty means all branches" is
        # defined once and the API, the form and the service all agree
        return obj.allowed_department_names()


# ===================== DRIVE =====================
class DriveSerializer(serializers.ModelSerializer):

    company_name = serializers.CharField(
        source="company.name",
        read_only=True,
    )

    company_category = serializers.CharField(
        source="company.get_category_display",
        read_only=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    # is_open is a model PROPERTY computed from status + deadline. Exposed
    # read-only so the frontend never has to re-derive "can I apply now",
    # which is exactly the kind of rule that drifts between screens.
    is_open = serializers.BooleanField(read_only=True)

    rounds = DriveRoundSerializer(many=True, read_only=True)

    eligibility = EligibilityRuleSerializer(read_only=True)

    created_by_name = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )

    class Meta:
        model = Drive
        fields = [
            "id",
            "company",
            "company_name",
            "company_category",
            "job_role",
            "package_lpa",
            "job_location",
            "bond_details",
            "description",
            "application_deadline",
            "drive_date",
            "status",
            "status_display",
            "is_open",
            "rounds",
            "eligibility",
            "created_by",
            "created_by_name",
            "created_at",
        ]
        read_only_fields = ["created_by", "created_at"]

    def validate_company(self, value):
        """
        An inactive company has stopped recruiting -- creating a new drive for
        one is almost always a mistake made by picking the wrong row from a
        long dropdown.
        """
        if not value.is_active:
            raise serializers.ValidationError(
                f"{value.name} is marked inactive. Reactivate it first."
            )
        return value

    def validate(self, attrs):
        """
        The deadline must fall on or before the drive date. A deadline AFTER
        the drive would let a student apply to something already held, and the
        error would only surface as an empty applicant list on the day.
        """
        deadline = attrs.get(
            "application_deadline",
            getattr(self.instance, "application_deadline", None),
        )
        drive_date = attrs.get(
            "drive_date",
            getattr(self.instance, "drive_date", None),
        )

        if deadline and drive_date and deadline.date() > drive_date:
            raise serializers.ValidationError({
                "application_deadline": (
                    "Applications must close on or before the drive date."
                )
            })

        return attrs


# ===================== DRIVE (STUDENT VIEW) =====================
class StudentDriveSerializer(serializers.ModelSerializer):
    """
    A drive as a student sees it.

    Deliberately NARROWER than DriveSerializer: no created_by, no draft
    fields, and eligibility appears as the student's own result rather than
    the raw rule. Reusing the full serializer here would leak who set the
    drive up and let a student read cutoffs for drives they cannot see.
    """

    company_name = serializers.CharField(source="company.name", read_only=True)
    company_category = serializers.CharField(
        source="company.get_category_display",
        read_only=True,
    )
    company_website = serializers.CharField(source="company.website", read_only=True)

    is_open = serializers.BooleanField(read_only=True)

    rounds = DriveRoundSerializer(many=True, read_only=True)

    class Meta:
        model = Drive
        fields = [
            "id",
            "company_name",
            "company_category",
            "company_website",
            "job_role",
            "package_lpa",
            "job_location",
            "bond_details",
            "description",
            "application_deadline",
            "drive_date",
            "is_open",
            "rounds",
        ]
        read_only_fields = fields

# ===================== DRIVE ROUND =====================
class DriveRoundSerializer(serializers.ModelSerializer):

    round_type_display = serializers.CharField(
        source="get_round_type_display",
        read_only=True,
    )

    class Meta:
        model = DriveRound
        fields = [
            "id",
            "drive",
            "order",
            "name",
            "round_type",
            "round_type_display",
            "round_date",
            "description",
        ]


# ===================== ELIGIBILITY RULE =====================
class EligibilityRuleSerializer(serializers.ModelSerializer):

    allowed_department_names = serializers.SerializerMethodField()

    class Meta:
        model = EligibilityRule
        fields = [
            "id",
            "job_role",
            "min_cgpa",
            "max_arrears",
            "min_tenth_percent",
            "min_twelfth_percent",
            "allowed_departments",
            "allowed_department_names",
            "passing_year",
            "allow_lateral_entry",
            "allow_already_placed",
            "notes",
        ]
        read_only_fields = ["job_role"]

    def get_allowed_department_names(self, obj):
        # reads the model's own helper, so "empty means all branches" is
        # defined once and the API, the form and the service all agree
        return obj.allowed_department_names()


# ===================== JOB ROLE =====================
class JobRoleSerializer(serializers.ModelSerializer):

    eligibility = EligibilityRuleSerializer(read_only=True)

    # is_open is a model PROPERTY: the role is active AND its drive is open.
    # Exposed read-only so no screen re-derives "can I apply now" for itself.
    is_open = serializers.BooleanField(read_only=True)

    company_name = serializers.CharField(
        source="drive.company.name",
        read_only=True,
    )

    class Meta:
        model = JobRole
        fields = [
            "id",
            "drive",
            "company_name",
            "title",
            "package_lpa",
            "job_location",
            "bond_details",
            "description",
            "openings",
            "is_active",
            "is_open",
            "eligibility",
            "created_at",
        ]
        read_only_fields = ["created_at"]


# ===================== DRIVE =====================
class DriveSerializer(serializers.ModelSerializer):

    company_name = serializers.CharField(
        source="company.name",
        read_only=True,
    )

    company_category = serializers.CharField(
        source="company.get_category_display",
        read_only=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    is_open = serializers.BooleanField(read_only=True)

    rounds = DriveRoundSerializer(many=True, read_only=True)

    # The positions on offer. A drive with one role is just a list of one --
    # no special case anywhere.
    job_roles = JobRoleSerializer(many=True, read_only=True)

    created_by_name = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )

    class Meta:
        model = Drive
        fields = [
            "id",
            "company",
            "company_name",
            "company_category",
            "title",
            "description",
            "application_deadline",
            "drive_date",
            "status",
            "status_display",
            "is_open",
            "rounds",
            "job_roles",
            "created_by",
            "created_by_name",
            "created_at",
        ]
        read_only_fields = ["created_by", "created_at"]

    def validate_company(self, value):
        """
        An inactive company has stopped recruiting -- creating a new drive for
        one is almost always a mistake made by picking the wrong row from a
        long dropdown.
        """
        if not value.is_active:
            raise serializers.ValidationError(
                f"{value.name} is marked inactive. Reactivate it first."
            )
        return value

    def validate(self, attrs):
        """
        The deadline must fall on or before the drive date. A deadline AFTER
        the drive would let a student apply to something already held, and the
        error would only surface as an empty applicant list on the day.
        """
        deadline = attrs.get(
            "application_deadline",
            getattr(self.instance, "application_deadline", None),
        )
        drive_date = attrs.get(
            "drive_date",
            getattr(self.instance, "drive_date", None),
        )

        if deadline and drive_date and deadline.date() > drive_date:
            raise serializers.ValidationError({
                "application_deadline": (
                    "Applications must close on or before the drive date."
                )
            })

        return attrs


# ===================== JOB ROLE (STUDENT VIEW) =====================
class StudentJobRoleSerializer(serializers.ModelSerializer):
    """
    A role as a student sees it.

    NARROWER than JobRoleSerializer on purpose: no eligibility rule. Students
    receive their own computed RESULT (eligible + reasons), never the raw
    cutoffs -- otherwise the whole batch could read every company's bar.
    """

    class Meta:
        model = JobRole
        fields = [
            "id",
            "title",
            "package_lpa",
            "job_location",
            "bond_details",
            "description",
            "openings",
        ]
        read_only_fields = fields


# ===================== DRIVE (STUDENT VIEW) =====================
class StudentDriveSerializer(serializers.ModelSerializer):
    """
    A drive as a student sees it.

    No created_by, no status, no eligibility rules. Reusing DriveSerializer
    here would leak who set the drive up and let a student read cutoffs for
    roles they cannot see.
    """

    company_name = serializers.CharField(source="company.name", read_only=True)
    company_category = serializers.CharField(
        source="company.get_category_display",
        read_only=True,
    )
    company_website = serializers.CharField(source="company.website", read_only=True)

    is_open = serializers.BooleanField(read_only=True)

    rounds = DriveRoundSerializer(many=True, read_only=True)

    class Meta:
        model = Drive
        fields = [
            "id",
            "company_name",
            "company_category",
            "company_website",
            "title",
            "description",
            "application_deadline",
            "drive_date",
            "is_open",
            "rounds",
        ]
        read_only_fields = fields