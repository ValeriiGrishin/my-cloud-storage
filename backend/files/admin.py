from django.contrib import admin
from .models import File

@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ('id', 'original_name', 'user', 'size', 'upload_date')
    list_filter = ('user', 'upload_date')
    search_fields = ('original_name', 'comment')
    readonly_fields = ('share_link', 'unique_name')