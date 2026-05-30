from django.contrib import admin
from .models import Case

@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ['case_name', 'lawyer', 'next_date', 'payment_status', 'created_at']
    list_filter = ['payment_status']
    search_fields = ['case_name', 'case_number', 'lawyer__username']
