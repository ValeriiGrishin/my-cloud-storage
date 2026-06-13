from rest_framework import serializers
from .models import File


class FileSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели File.
    Преобразует объекты File в JSON и обратно.
    
    Добавляет дополнительное поле size_display - размер файла.
    """
    
    # Добавляем виртуальное поле 
    size_display = serializers.SerializerMethodField()
    
    class Meta:
        model = File
        fields = [
            'id',                     # ID файла в БД
            'original_name',          # Оригинальное имя файла
            'size',                   # Размер в байтах
            'size_display',           # Размер в удобном формате (KB, MB, GB) - вычисляемое поле
            'comment',                # Комментарий пользователя
            'upload_date',            # Дата загрузки
            'last_download_date',     # Дата последнего скачивания
            'share_link'              # UUID для специальной ссылки
        ]
    
    def get_size_display(self, obj):
        """
        Преобразует размер файла из байтов в удобный для чтения формат.
        Пример: 1024 байта → "1.00 KB", 1048576 байт → "1.00 MB"
        """
        if obj.size is None:
            return "0 B"
        
        size = obj.size
        units = ['B', 'KB', 'MB', 'GB']
        
        # Проходим по единицам, пока не найдём подходящую
        for unit in units:
            if size < 1024.0:  # Если размер меньше 1024, выводим в текущих единицах
                return f"{size:.2f} {unit}"
            size /= 1024.0  # Иначе переводим в следующую единицу
        
        # Если файл очень большой (больше GB) - выводим в TB
        return f"{size:.2f} TB"