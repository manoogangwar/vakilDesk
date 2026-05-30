from django.conf import settings
from django.db import models


class Case(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partial', 'Partial'),
        ('paid', 'Paid'),
    ]

    lawyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cases',
    )
    case_name = models.CharField(max_length=255)
    case_number = models.CharField(max_length=100, blank=True)
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
