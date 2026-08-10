from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


# ================= YEAR CHOICES =================
YEAR_CHOICES = (
    (1, "1st Year"),
    (2, "2nd Year"),
    (3, "3rd Year"),
    (4, "4th Year"),
)


# ================= SEMESTER CHOICES =================
SEMESTER_CHOICES = (
    (1, "Semester 1"),
    (2, "Semester 2"),
    (3, "Semester 3"),
    (4, "Semester 4"),
    (5, "Semester 5"),
    (6, "Semester 6"),
    (7, "Semester 7"),
    (8, "Semester 8"),
)


# ================= DEPARTMENT =================
class Department(models.Model):

    name = models.CharField(
        max_length=100,
        unique=True
    )

    # ================= SHORT CODE =================
    # Single source of truth for the department's short code (CS, IT, ECE...).
    # Used in roll numbers and, later, in placement branch eligibility.
    # This used to be a dict hardcoded inside User.save() where nothing else
    # could read or validate against it -- which is how EC and EEE ended up
    # inconsistent in live roll numbers.
    # unique + null (not blank-only) so two departments can never share a code,
    # while departments that have not been given one yet stay NULL.
    code = models.CharField(
        max_length=10,
        unique=True,
        null=True,
        blank=True,
    )

    hod = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hod_of',
        limit_choices_to={'role': 'teacher'},
    )

    class Meta:
        ordering = ['name']

    def save(self, *args, **kwargs):
        # Codes are always stored uppercase so lookups never depend on casing.
        if self.code:
            self.code = self.code.strip().upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


# ================= USER =================
class User(AbstractUser):

    # ================= MAIN ROLE =================
    # Top-level category only. The specific level lives in sub_role.
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
        ('non_teaching', 'Non-teaching staff'),
        ('parent', 'Parent'),
    )

    # ================= SUB ROLE =================
    # Blank for students and parents.
    SUB_ROLE_CHOICES = (
        # teacher
        ('assistant_professor', 'Assistant Professor'),
        ('associate_professor', 'Associate Professor'),
        ('professor', 'Professor'),
        # admin
        ('academic_admin', 'Academic Admin'),
        ('exam_admin', 'Examination Admin'),
        ('accounts_admin', 'Accounts Admin'),
        ('iqac_admin', 'IQAC Admin'),
        ('placement_officer', 'Placement Officer'),
        ('super_admin', 'Super Admin'),
        # non-teaching
        ('office_assistant', 'Office Assistant'),
        ('lab_technician', 'Lab Technician'),
        ('librarian', 'Librarian'),
        ('clerk', 'Clerk'),
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='student'
    )

    sub_role = models.CharField(
        max_length=40,
        choices=SUB_ROLE_CHOICES,
        blank=True,
        null=True
    )
    # ================= FORCE PASSWORD CHANGE ON FIRST LOGIN =================
    # Set to True for auto-created parents so they must set a new password.
    must_change_password = models.BooleanField(default=False)

    # ================= DEPARTMENT =================
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    # ================= COURSE =================
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    # ================= STUDENT ROLL NUMBER =================
    roll_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        unique=True
    )

    # ================= STAFF EMPLOYEE ID =================
    employee_id = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        unique=True
    )

    # ================= STUDENT YEAR =================
    year = models.IntegerField(
        choices=YEAR_CHOICES,
        null=True,
        blank=True
    )

    # ================= STUDENT SEMESTER =================
    semester = models.IntegerField(
        choices=SEMESTER_CHOICES,
        null=True,
        blank=True
    )

    # ================= STUDENT BATCH / ADMISSION YEAR =================
    batch_year = models.IntegerField(
        null=True,
        blank=True
    )

    # ================= EMPLOYEE ID PREFIXES (Option A) =================
    EMP_PREFIXES = {
        'teacher': 'TCH',
        'admin': 'ADM',
        'non_teaching': 'STF',
    }

    # ================= SAVE =================
    def save(self, *args, **kwargs):

        # ================= SUPERUSER =================
        if self.is_superuser:
            self.role = "admin"

        # ================= STUDENT ROLL NUMBER =================
        if (
            self.role == "student"
            and not self.roll_number
        ):

            # ================= DEPARTMENT CODE =================
            # Read from Department.code -- one definition, editable in admin.
            # "GN" only when the department is missing or has no code set.
            if self.department and self.department.code:
                dept_code = self.department.code
            else:
                dept_code = "GN"

            # ================= YEAR PREFIX (from batch year) =================
            # batch_year 2021 -> "21". Falls back to current year if not set.
            import datetime
            batch = self.batch_year or datetime.date.today().year
            year_prefix = str(batch)[-2:]

            # ================= FIND LAST STUDENT IN SAME BATCH + DEPT =================
            # counter restarts per (department, batch year)
            last_student = User.objects.filter(
                role="student",
                department=self.department,
                roll_number__startswith=f"{year_prefix}{dept_code}",
            ).order_by('-roll_number').first()

            # ================= COMPUTE NEXT NUMBER =================
            new_number = 1
            if last_student and last_student.roll_number:
                try:
                    new_number = int(last_student.roll_number[-3:]) + 1
                except (ValueError, TypeError):
                    pass

            # ================= FINAL ROLL NUMBER =================
            self.roll_number = f"{year_prefix}{dept_code}{new_number:03d}"

        # ================= STAFF EMPLOYEE ID (TCH / ADM / STF) =================
        prefix = self.EMP_PREFIXES.get(self.role)
        if prefix and not self.employee_id:

            # count only within the same prefix so the series don't collide
            last_staff = User.objects.filter(
                role=self.role,
                employee_id__startswith=prefix,
            ).order_by('-employee_id').first()

            new_number = 1
            if last_staff and last_staff.employee_id:
                try:
                    new_number = int(last_staff.employee_id[-3:]) + 1
                except (ValueError, TypeError):
                    pass

            self.employee_id = f"{prefix}{new_number:03d}"

        super().save(*args, **kwargs)

    # ================= STRING =================
    def __str__(self):
        return self.username


# ================= STUDENT PROFILE =================
class StudentProfile(models.Model):

    user = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='student_profile',
        limit_choices_to={'role': 'student'},
    )

    # personal
    gender = models.CharField(max_length=10, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    blood_group = models.CharField(max_length=5, blank=True)
    photo = models.ImageField(upload_to='student_photos/', null=True, blank=True)

    # address
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)

    # admission
    admission_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"Profile of {self.user.username}"


# ================= PRIOR ACADEMICS (SCHOOL / DIPLOMA) =================
class PriorAcademics(models.Model):
    """
    A student's education BEFORE joining the college -- 10th, 12th, diploma.

    Lives in `users`, not `placement`, on purpose: these are permanent facts
    about the student. They were true before admission and stay true after
    graduation. Placement is simply the first module to need them; admissions,
    IQAC and transcripts will want them too. If the placement app were ever
    removed, this data should survive.

    Percentages are Decimal, never Float. These get compared against company
    cutoffs (>= 60), and float arithmetic can turn 60.0 into 59.999999 and
    silently reject an eligible student.

    Marksheet uploads are deliberately NOT here yet. Add them as nullable
    FileFields if a college asks -- that needs a migration but no backfill.
    """

    PERCENT_VALIDATORS = [
        MinValueValidator(0),
        MaxValueValidator(100),
    ]

    student = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='prior_academics',
        limit_choices_to={'role': 'student'},
    )

    # ---------------- 10th ----------------
    # Every student has a 10th, lateral entry or not.
    tenth_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=PERCENT_VALIDATORS,
    )
    tenth_board = models.CharField(max_length=100, blank=True)   # State Board / CBSE / ICSE
    tenth_year = models.IntegerField(null=True, blank=True)      # year of passing

    # ---------------- LATERAL ENTRY ----------------
    # A lateral entry student joins in 2nd year with a diploma instead of a 12th.
    # This flag decides WHICH qualification the eligibility check reads, so it
    # must never be guessed from whichever field happens to be filled in.
    is_lateral_entry = models.BooleanField(default=False)

    # ---------------- 12th ----------------
    # Blank for lateral entry students.
    twelfth_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=PERCENT_VALIDATORS,
    )
    twelfth_board = models.CharField(max_length=100, blank=True)
    twelfth_year = models.IntegerField(null=True, blank=True)

    # ---------------- DIPLOMA ----------------
    # Blank for regular students.
    diploma_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=PERCENT_VALIDATORS,
    )
    diploma_branch = models.CharField(max_length=150, blank=True)
    diploma_year = models.IntegerField(null=True, blank=True)

    # ---------------- VERIFICATION ----------------
    # Students enter their own marks, so anyone could type 95%. Eligibility
    # treats UNVERIFIED marks as not-yet-eligible -- nobody types their way
    # into a drive. The coordinator's Profile Verification screen sets this.
    verified = models.BooleanField(default=False)

    verified_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='prior_academics_verified',
        limit_choices_to={'role': 'teacher'},
    )

    verified_at = models.DateTimeField(null=True, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Prior academics"
        verbose_name_plural = "Prior academics"

    # ---------------- VALIDATION ----------------
    def clean(self):
        errors = {}

        if self.is_lateral_entry:
            if self.diploma_percent is None:
                errors['diploma_percent'] = (
                    "Diploma percentage is required for a lateral entry student."
                )
        else:
            if self.twelfth_percent is None:
                errors['twelfth_percent'] = (
                    "12th percentage is required for a regular student."
                )

        if errors:
            raise ValidationError(errors)

    # ---------------- QUALIFYING MARK ----------------
    @property
    def qualifying_percent(self):

        if self.is_lateral_entry:
            return self.diploma_percent
        return self.twelfth_percent

    def __str__(self):
        return f"Prior academics of {self.student.username}"


# ================= FACULTY / STAFF PROFILE =================
# Used for both teachers AND non-teaching staff (both are employees).
class FacultyProfile(models.Model):

    user = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='faculty_profile',
    )

    # personal
    gender = models.CharField(max_length=10, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    blood_group = models.CharField(max_length=5, blank=True)
    photo = models.ImageField(upload_to='staff_photos/', null=True, blank=True)

    # address
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)

    # employment
    qualification = models.CharField(max_length=255, blank=True)     # M.E., Ph.D.
    specialization = models.CharField(max_length=255, blank=True)    # for teachers
    date_of_joining = models.DateField(null=True, blank=True)
    experience_years = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        return f"Profile of {self.user.username}"


# ================= PARENT PROFILE =================
class ParentProfile(models.Model):

    user = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='parent_profile',
        limit_choices_to={'role': 'parent'},
    )

    children = models.ManyToManyField(
        'users.User',
        related_name='parents',
        limit_choices_to={'role': 'student'},
        blank=True,
    )

    # contact details (useful when a parent is auto-created from a student)
    phone = models.CharField(max_length=15, blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    relation = models.CharField(max_length=20, blank=True)   # Father / Mother / Guardian

    def __str__(self):
        return self.user.username


# ================= FACULTY PARTICIPATION (IQAC) =================

class FacultyParticipation(models.Model):

    # what kind of activity it was
    CATEGORY_CHOICES = (
        ('fdp', 'FDP / Training Attended'),
        ('workshop_attended', 'Workshop / Seminar Attended'),
        ('workshop_conducted', 'Workshop / Seminar Conducted'),
        ('conference', 'Conference Paper Presented'),
        ('journal', 'Journal Publication'),
        ('certification', 'Certification / MOOC (NPTEL etc.)'),
        ('guest_lecture', 'Guest Lecture Delivered'),
        ('committee', 'Committee / Cell Membership'),
        ('project', 'Project / Grant / Consultancy'),
        ('other', 'Other'),
    )

    # the teacher's part in it
    ROLE_CHOICES = (
        ('attended', 'Attended'),
        ('conducted', 'Conducted / Organized'),
        ('presented', 'Presented'),
        ('published', 'Published'),
        ('member', 'Member'),
        ('other', 'Other'),
    )

    faculty = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='participations',
        limit_choices_to={'role': 'teacher'},
    )

    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=255)            # e.g. "AI Workshop at IIT Madras"
    organizer = models.CharField(max_length=255, blank=True)   # where / who ran it
    activity_role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='attended')

    date = models.DateField()
    academic_year = models.CharField(max_length=9, blank=True)  # e.g. "2025-26"

    # the uploaded proof (certificate / PDF / image)
    proof = models.FileField(upload_to='faculty_proofs/', null=True, blank=True)

    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.faculty.username} — {self.get_category_display()} — {self.title}"