from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'phone', 'is_active', 'is_staff', 'date_joined']
    list_filter = ['role', 'is_active', 'is_staff', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone']
    ordering = ['-date_joined']
    list_per_page = 25
    list_display_links = ['username', 'email']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('VakilDesk Profile', {'fields': ('role', 'phone')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'first_name', 'last_name', 'role', 'phone', 'password1', 'password2'),
        }),
    )

    actions = ['activate_users', 'deactivate_users', 'make_admin', 'make_lawyer']

    @admin.action(description='Activate selected users')
    def activate_users(self, request, queryset):
        queryset.update(is_active=True)

    @admin.action(description='Deactivate selected users')
    def deactivate_users(self, request, queryset):
        queryset.update(is_active=False)

    @admin.action(description='Set role to Admin')
    def make_admin(self, request, queryset):
        queryset.update(role='admin')

    @admin.action(description='Set role to Lawyer')
    def make_lawyer(self, request, queryset):
        queryset.update(role='lawyer')


admin.site.site_header = 'VakilDesk Administration'
admin.site.site_title = 'VakilDesk Admin'
admin.site.index_title = 'Welcome to VakilDesk Admin Panel'
