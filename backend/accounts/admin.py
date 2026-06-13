from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'full_name', 'is_admin', 'is_staff')
    list_filter = ('is_admin', 'is_staff')
    search_fields = ('username', 'email', 'full_name')
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('full_name', 'is_admin', 'storage_path')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('full_name', 'email')}),
    )

admin.site.register(User, CustomUserAdmin)