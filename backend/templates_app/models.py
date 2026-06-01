import re

from django.conf import settings
from django.db import models


def _extract_variables(content: str) -> list:
    """Extract all {{variable_name}} placeholders from template content."""
    return sorted(set(re.findall(r'\{\{(\w+)\}\}', content)))


class DocumentTemplate(models.Model):
    CATEGORY_CHOICES = [
        ('affidavit', 'Affidavit'),
        ('income_certificate', 'Income Certificate'),
        ('domicile_certificate', 'Domicile Certificate'),
        ('caste_certificate', 'Caste Certificate'),
        ('legal_notice', 'Legal Notice'),
        ('rent_agreement', 'Rent Agreement'),
        ('noc', 'NOC'),
        ('rti', 'RTI'),
        ('power_of_attorney', 'Power of Attorney'),
        ('other', 'Other'),
    ]

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='document_templates',
    )
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='other')
    content = models.TextField()
    variables = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def save(self, *args, **kwargs):
        self.variables = _extract_variables(self.content)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.name} ({self.get_category_display()})'
