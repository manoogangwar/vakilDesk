import datetime

from django.conf import settings
from django.db import models


def _next_invoice_number():
    year = datetime.date.today().year
    prefix = f'INV-{year}-'
    last = Invoice.objects.filter(invoice_number__startswith=prefix).order_by('-invoice_number').first()
    seq = (int(last.invoice_number.split('-')[-1]) + 1) if last else 1
    return f'{prefix}{seq:04d}'


class Invoice(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('partial', 'Partial'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]

    lawyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='invoices',
    )
    case = models.ForeignKey(
        'cases.Case',
        on_delete=models.CASCADE,
        related_name='invoices',
    )
    invoice_number = models.CharField(max_length=50, unique=True, blank=True)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    issue_date = models.DateField(default=datetime.date.today)
    due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = _next_invoice_number()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.invoice_number} — {self.case.case_name}'

    @property
    def paid_amount(self):
        return sum(p.amount for p in self.payments.all())

    @property
    def balance(self):
        return self.amount - self.paid_amount


class Payment(models.Model):
    METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('upi', 'UPI'),
        ('cheque', 'Cheque'),
        ('other', 'Other'),
    ]

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(default=datetime.date.today)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='cash')
    reference = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f'₹{self.amount} on {self.payment_date} ({self.invoice.invoice_number})'
