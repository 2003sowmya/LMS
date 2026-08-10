from django.db import models
from django.utils import timezone


# ===================== PLACEMENT COORDINATOR =====================
class PlacementCoordinator(models.Model):
    """
    A faculty member who also handles placement work for their department.

    Modelled as an ASSIGNMENT ROW, not a role -- exactly like YearTutor.
    The teacher keeps role='teacher', so every existing permission check that
    asks "is this a teacher?" keeps working. Making coordinator a role value
    would silently strip their subject access the moment they were assigned.
    """

    teacher = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'teacher'},
        related_name='placement_coordinator_roles',
    )

    department = models.ForeignKey(
        'users.Department',
        on_delete=models.CASCADE,
        related_name='placement_coordinators',
    )

    # Assignments are ended by clearing this flag, never by deleting the row --
    # so "who coordinated last year" stays answerable.
    is_active = models.BooleanField(default=True)

    assigned_at = models.DateTimeField(default=timezone.now)

    assigned_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='placement_coordinators_assigned',
    )

    class Meta:
        ordering = ['department__name', '-assigned_at']
        constraints = [
            # One ACTIVE coordinator per department. Past assignments are
            # exempt because is_active is False, which is what lets history
            # accumulate without blocking a new assignment.
            models.UniqueConstraint(
                fields=['department'],
                condition=models.Q(is_active=True),
                name='unique_active_coordinator_per_department',
            ),
        ]

    def __str__(self):
        state = "active" if self.is_active else "past"
        return f"{self.teacher.username} -> {self.department.name} ({state})"


# ===================== COMPANY =====================
class Company(models.Model):
    """
    A recruiting company.

    Kept deliberately thin. Everything about a specific visit belongs on
    Drive, and everything about a specific position on JobRole. A company
    that recruits three years running is ONE row with three drives.
    """

    CATEGORY_CHOICES = [
        ('product', 'Product'),
        ('service', 'Service'),
        ('core', 'Core'),
        ('startup', 'Startup'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=200, unique=True)

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='other',
    )

    website = models.URLField(blank=True)
    about = models.TextField(blank=True)

    contact_person = models.CharField(max_length=150, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)

    # Deactivated, never deleted -- past drives and offers point at it, and
    # removing the row would orphan a student's placement record.
    is_active = models.BooleanField(default=True)

    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='companies_created',
    )

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['name']
        verbose_name_plural = "Companies"

    def save(self, *args, **kwargs):
        # Stripped so " Zoho" and "Zoho " cannot both exist and defeat the
        # unique constraint.
        if self.name:
            self.name = self.name.strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


# ===================== DRIVE =====================
class Drive(models.Model):
    """
    One company's recruitment visit.

    The VISIT only -- dates, status, and the round sequence. The positions on
    offer live on JobRole, because one visit can open several roles at
    different packages with different cutoffs.
    """

    STATUS_CHOICES = [
        ('draft', 'Draft'),            # being set up, students cannot see it
        ('published', 'Published'),    # open for applications
        ('closed', 'Closed'),          # deadline passed, rounds under way
        ('completed', 'Completed'),    # offers released
        ('cancelled', 'Cancelled'),    # company withdrew
    ]

    company = models.ForeignKey(
        'placement.Company',
        on_delete=models.PROTECT,
        related_name='drives',
    )

    # A label for the visit, e.g. "2026 Campus Drive". Optional -- falls back
    # to the company name in __str__.
    title = models.CharField(max_length=200, blank=True)

    description = models.TextField(blank=True)

    # DateTime, not Date: "closes on the 14th" is ambiguous about whether the
    # 14th counts, and students will apply at 11pm.
    application_deadline = models.DateTimeField(null=True, blank=True)

    drive_date = models.DateField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
    )

    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='drives_created',
    )

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    @property
    def is_open(self):
        """
        Whether a student may apply right now.

        Computed from status and deadline together -- never stored. A stored
        flag would need a scheduled job to flip it at the deadline, and would
        be wrong in the window before that job ran.
        """
        if self.status != 'published':
            return False
        if self.application_deadline and timezone.now() > self.application_deadline:
            return False
        return True

    def __str__(self):
        return self.title or f"{self.company.name} drive"


# ===================== JOB ROLE =====================
class JobRole(models.Model):
    """
    One position within a drive.

    Split out of Drive because a single visit can open several roles at
    different packages -- "Software Engineer at 7 LPA" and "Support Engineer
    at 4 LPA" from the same company on the same day.

    ELIGIBILITY ATTACHES HERE, NOT TO THE DRIVE. That is the point of the
    split: those two roles will usually have different CGPA cutoffs, and a
    rule on the drive would force them to share one.
    """

    drive = models.ForeignKey(
        Drive,
        on_delete=models.CASCADE,
        related_name='job_roles',
    )

    title = models.CharField(max_length=200)

    # Decimal, not Float -- packages are summed and averaged for reports, and
    # float drift would show up in numbers a college publishes.
    package_lpa = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
    )

    job_location = models.CharField(max_length=200, blank=True)
    bond_details = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)

    # How many the company intends to hire. Null = not stated.
    openings = models.PositiveIntegerField(null=True, blank=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['drive', '-package_lpa', 'title']
        constraints = [
            models.UniqueConstraint(
                fields=['drive', 'title'],
                name='unique_role_title_per_drive',
            ),
        ]

    @property
    def is_open(self):
        """A role is open only if its drive is open AND the role is active."""
        return self.is_active and self.drive.is_open

    def __str__(self):
        return f"{self.drive.company.name} - {self.title}"


# ===================== DRIVE ROUND =====================
class DriveRound(models.Model):
    """
    One round in a drive's selection process.

    Rounds sit on the DRIVE, not the role: a company running aptitude ->
    technical -> HR puts every candidate through the same rounds whatever
    role they applied for. If per-role rounds are ever needed, that is a
    nullable job_role FK added here -- not a copy of this table.

    Rounds are ROWS, not columns. Fixed columns would force every drive into
    the same shape and leave blanks meaning two different things (not held /
    not reached).
    """

    ROUND_TYPE_CHOICES = [
        ('screening', 'Screening'),        # the college's own shortlisting
        ('aptitude', 'Aptitude Test'),
        ('technical_test', 'Technical Test'),
        ('coding', 'Coding Round'),
        ('gd', 'Group Discussion'),
        ('technical', 'Technical Interview'),
        ('hr', 'HR Interview'),
        ('other', 'Other'),
    ]

    drive = models.ForeignKey(
        Drive,
        on_delete=models.CASCADE,
        related_name='rounds',
    )

    order = models.PositiveIntegerField()

    name = models.CharField(max_length=150)

    round_type = models.CharField(
        max_length=30,
        choices=ROUND_TYPE_CHOICES,
        default='other',
    )

    round_date = models.DateField(null=True, blank=True)

    description = models.TextField(blank=True)

    class Meta:
        ordering = ['drive', 'order']
        constraints = [
            models.UniqueConstraint(
                fields=['drive', 'order'],
                name='unique_round_order_per_drive',
            ),
        ]

    def __str__(self):
        return f"{self.drive} - {self.order}. {self.name}"


# ===================== ELIGIBILITY RULE =====================
class EligibilityRule(models.Model):
    """
    What a student must meet to apply for one JOB ROLE.

    OneToOne with JobRole, not Drive. Two roles in the same visit routinely
    have different cutoffs, and a rule on the drive would collapse them into
    one -- silently letting a 6.0 student into a 7.0 role.

    NOTHING here is a copy of student data. CGPA, arrears and passing year are
    read live from exams/services.py at check time; 10th and 12th come from
    PriorAcademics.

    Every field is nullable, and null means "no limit on this" -- a min_cgpa
    of 0 and an unset min_cgpa are different rules.
    """

    job_role = models.OneToOneField(
        JobRole,
        on_delete=models.CASCADE,
        related_name='eligibility',
    )

    min_cgpa = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
    )

    # 0 means "no standing arrears allowed". null means the company does not
    # care. Different rules, so this must stay nullable.
    max_arrears = models.PositiveIntegerField(null=True, blank=True)

    min_tenth_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )

    # Compared against PriorAcademics.qualifying_percent -- 12th for a regular
    # student, diploma for a lateral entry one. That rule lives in the
    # property alone, so it cannot drift.
    min_twelfth_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )

    # Empty means every department. A M2M rather than a list of codes, so a
    # renamed department cannot break an existing rule.
    allowed_departments = models.ManyToManyField(
        'users.Department',
        blank=True,
        related_name='eligible_job_roles',
    )

    passing_year = models.IntegerField(null=True, blank=True)

    allow_lateral_entry = models.BooleanField(default=True)

    # Most colleges stop a placed student applying again. Some allow it above
    # a package threshold ("dream offer"), hence a flag not an assumption.
    allow_already_placed = models.BooleanField(default=False)

    notes = models.TextField(blank=True)

    # Used by placement/eligibility.py. Here rather than in the service so
    # "empty means all branches" has one definition.

    def allowed_department_ids(self):
        return list(self.allowed_departments.values_list("id", flat=True))

    def allowed_department_names(self):
        names = list(self.allowed_departments.values_list("name", flat=True))
        return ", ".join(names) if names else "All branches"

    def __str__(self):
        return f"Eligibility for {self.job_role}"