import uuid
from django.db import models
from accounts.models import User

class File(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='files')
    original_name = models.CharField('Оригинальное имя', max_length=255)
    unique_name = models.CharField('Уникальное имя', max_length=500, unique=True)
    size = models.BigIntegerField('Размер в байтах')
    comment = models.TextField('Комментарий', blank=True)
    upload_date = models.DateTimeField('Дата загрузки', auto_now_add=True)
    last_download_date = models.DateTimeField('Дата последнего скачивания', null=True, blank=True)
    file_path = models.CharField('Путь к файлу', max_length=500)
    share_link = models.CharField('Специальная ссылка', max_length=255, unique=True, default=uuid.uuid4)
    
    class Meta:
        db_table = 'files'
        verbose_name = 'Файл'
        verbose_name_plural = 'Файлы'
    
    def __str__(self):
        return self.original_name