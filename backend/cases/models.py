from django.conf import settings
from django.db import models


class Case(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partial', 'Partial'),
        ('paid', 'Paid'),
    ]

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('adjourned', 'Adjourned'),
        ('disposed', 'Disposed'),
        ('on_hold', 'On Hold'),
    ]

    COURT_TYPE_CHOICES = [
        ('district', 'District Court'),
        ('high_court', 'High Court'),
        ('supreme_court', 'Supreme Court'),
        ('tribunal', 'Tribunal'),
        ('other', 'Other'),
    ]

    lawyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cases',
    )
    case_name = models.CharField(max_length=255)
    case_number = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    court_name = models.CharField(max_length=255, blank=True)
    court_type = models.CharField(max_length=20, choices=COURT_TYPE_CHOICES, blank=True)
    judge_name = models.CharField(max_length=255, blank=True)
    under_section = models.CharField(max_length=255, blank=True, verbose_name='U/S')
    police_station = models.CharField(max_length=255, blank=True, verbose_name='P/S')
    next_date = models.DateField(null=True, blank=True)
    previous_date = models.DateField(null=True, blank=True)
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='pending',
    )
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.case_name} ({self.lawyer.username})"


class Document(models.Model):
    DOC_TYPE_CHOICES = [
        ('fir', 'FIR'),
        ('chargesheet', 'Charge Sheet'),
        ('bail', 'Bail Papers'),
        ('vakalatnama', 'Vakalatnama'),
        ('affidavit', 'Affidavit'),
        ('judgment', 'Judgment'),
        ('order', 'Court Order'),
        ('evidence', 'Evidence'),
        ('other', 'Other'),
    ]

    SOURCE_CHOICES = [
        ('uploaded', 'Uploaded'),
        ('generated', 'Generated'),
    ]

    # A document belongs to a case (uploaded case file) and/or a client
    # (a generated document such as an Income Certificate saved to a client).
    case = models.ForeignKey(
        Case, on_delete=models.CASCADE, related_name='documents',
        null=True, blank=True,
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='client_documents',
        null=True, blank=True,
        limit_choices_to={'role': 'client'},
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_documents',
    )
    title = models.CharField(max_length=255)
    doc_type = models.CharField(max_length=20, choices=DOC_TYPE_CHOICES, default='other')
    # For generated documents: the standard form key, e.g. 'income_certificate'.
    doc_category = models.CharField(max_length=40, blank=True)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='uploaded')
    file = models.FileField(upload_to='case_documents/%Y/%m/')
    file_name = models.CharField(max_length=255, blank=True)
    file_size = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        owner = self.case.case_name if self.case else (self.client and self.client.username) or '—'
        return f"{self.title} ({owner})"


class HearingRecord(models.Model):
    """One entry per past hearing date — auto-created when next_date changes."""
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='hearing_records')
    date = models.DateField()
    outcome = models.TextField(blank=True)
    adjourned_to = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.case.case_name} — {self.date}"


class CaseClient(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='case_clients')
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='case_memberships',
        limit_choices_to={'role': 'client'},
    )
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('case', 'client')]

    def __str__(self):
        return f"{self.client} on {self.case}"
