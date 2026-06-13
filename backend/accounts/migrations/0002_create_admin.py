from django.db import migrations
from django.contrib.auth.hashers import make_password
from decouple import config


def create_admin(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    
    # Проверяем, есть ли уже admin
    if not User.objects.filter(username='admin').exists():
        # Берём пароль из .env или используем стандартный
        admin_password = config('ADMIN_PASSWORD', default='Admin123!')
        
        User.objects.create(
            username='admin',
            full_name='Administrator',
            email='admin@example.com',
            password=make_password(admin_password),
            is_admin=True,
            is_superuser=True,
            is_staff=True,
        )
        print("Admin user created automatically")


def delete_admin(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(username='admin').delete()


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_admin, delete_admin),
    ]