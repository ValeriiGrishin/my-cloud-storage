from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    full_name = models.CharField('Полное имя', max_length=255)
    email = models.EmailField('Email', unique=True)
    is_admin = models.BooleanField('Администратор', default=False)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
    
    def __str__(self):
        return self.username