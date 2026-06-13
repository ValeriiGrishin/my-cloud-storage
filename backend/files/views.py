import os
import uuid
import logging
from django.utils import timezone
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.http import FileResponse
from .models import File
from .serializers import FileSerializer
from accounts.models import User
from rest_framework.pagination import PageNumberPagination


logger = logging.getLogger(__name__)


class FilePagination(PageNumberPagination):
    page_size = 10                    # 10 файлов на страницу
    page_size_query_param = 'page_size'
    max_page_size = 100


# ПОЛУЧЕНИЕ СПИСКА ФАЙЛОВ (С ПАГИНАЦИЕЙ)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_files(request):
    """
    Возвращает список файлов.
    - Обычный пользователь видит только свои файлы
    - Администратор может видеть файлы любого пользователя (параметр ?user_id=)
    """
    # Администратор может запросить файлы другого пользователя
    target_user_id = request.query_params.get('user_id')
    
    if target_user_id and request.user.is_admin:
        # Админ смотрит чужие файлы
        user = User.objects.get(id=target_user_id)
    else:
        # Обычный пользователь смотрит свои файлы
        user = request.user
    
    # Сортируем по дате загрузки (новые сверху)
    files = File.objects.filter(user=user).order_by('-upload_date')
    paginator = FilePagination()
    result_page = paginator.paginate_queryset(files, request)
    serializer = FileSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


# ЗАГРУЗКА ФАЙЛА

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_file(request):
    """
    Загружает новый файл на сервер.
    Принимает: file (бинарные данные), comment (текст, опционально)
    Сохраняет файл в папку storage/user_id/ под уникальным именем
    """
    # Проверяем, что файл передан
    if 'file' not in request.FILES:
        return Response({'error': 'Файл не предоставлен'}, status=400)
    
    uploaded_file = request.FILES['file']
    comment = request.data.get('comment', '')
    
    # Генерируем уникальное имя файла (чтобы не было конфликтов)
    unique_name = f"{uuid.uuid4().hex}_{uploaded_file.name}"
    
    # Папка пользователя (по ID)
    user_folder = str(request.user.id)
    
    # Путь для сохранения (используем STORAGE_ROOT из настроек)
    user_storage_path = os.path.join(settings.STORAGE_ROOT, user_folder)
    os.makedirs(user_storage_path, exist_ok=True)  # Создаём папку, если нет
    
    # Относительный путь для БД (чтобы при переезде сервера ссылки не ломались)
    relative_path = os.path.join(user_folder, unique_name)
    
    # Абсолютный путь для фактического сохранения файла на диске
    absolute_path = os.path.join(settings.STORAGE_ROOT, relative_path)
    
    # Сохраняем файл на диск
    with open(absolute_path, 'wb') as f:
        for chunk in uploaded_file.chunks():
            f.write(chunk)
    
    # Создаём запись в базе данных
    file_obj = File.objects.create(
        user=request.user,
        original_name=uploaded_file.name,
        unique_name=unique_name,
        size=uploaded_file.size,
        comment=comment,
        file_path=relative_path  # Сохраняем относительный путь
    )
    
    logger.info(f"Файл загружен: {uploaded_file.name} (пользователь: {request.user.username})")
    return Response(FileSerializer(file_obj).data, status=201)


# УДАЛЕНИЕ ФАЙЛА

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_file(request, file_id):
    """
    Удаляет файл.
    - Пользователь может удалить только свои файлы
    - Администратор может удалить любой файл
    """
    file_obj = File.objects.get(id=file_id)
    
    # Проверка прав: если не админ и файл не принадлежит пользователю
    if not request.user.is_admin and file_obj.user != request.user:
        return Response({'error': 'Доступ запрещен'}, status=403)
    
    # Удаляем файл с диска
    absolute_path = os.path.join(settings.STORAGE_ROOT, file_obj.file_path)
    if os.path.exists(absolute_path):
        os.remove(absolute_path)
    
    # Удаляем запись из БД
    file_obj.delete()
    logger.info(f"Файл удалён: {file_obj.original_name} (пользователь: {request.user.username})")
    return Response(status=204)


# ПЕРЕИМЕНОВАНИЕ ФАЙЛА

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def rename_file(request, file_id):
    """
    Переименовывает файл.
    - Пользователь может переименовать только свои файлы
    - Администратор может переименовать любой файл
    """
    file_obj = File.objects.get(id=file_id)
    
    # Проверка прав
    if not request.user.is_admin and file_obj.user != request.user:
        return Response({'error': 'Доступ запрещен'}, status=403)
    
    # Получаем новое имя
    new_name = request.data.get('new_name')
    
    # Защита от недопустимых символов
    if not new_name or '/' in new_name or '\\' in new_name:
        return Response({'error': 'Недопустимое имя файла'}, status=400)
    
    # Сохраняем новое имя
    file_obj.original_name = new_name
    file_obj.save()
    return Response(FileSerializer(file_obj).data)


# РЕДАКТИРОВАНИЕ КОММЕНТАРИЯ 

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_comment(request, file_id):
    """
    Изменяет комментарий к файлу.
    - Пользователь может редактировать только свои файлы
    - Администратор может редактировать любой файл
    """
    file_obj = File.objects.get(id=file_id)
    
    # Проверка прав
    if not request.user.is_admin and file_obj.user != request.user:
        return Response({'error': 'Доступ запрещен'}, status=403)
    
    # Обновляем комментарий
    file_obj.comment = request.data.get('comment', '')
    file_obj.save()
    return Response(FileSerializer(file_obj).data)


# СКАЧИВАНИЕ ФАЙЛА 

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_file(request, file_id):
    """
    Скачивает файл на компьютер пользователя.
    Обновляет дату последнего скачивания в БД.
    """
    file_obj = File.objects.get(id=file_id)
    
    # Проверка прав
    if not request.user.is_admin and file_obj.user != request.user:
        return Response({'error': 'Доступ запрещен'}, status=403)
    
    # Обновляем дату последнего скачивания
    file_obj.last_download_date = timezone.now()
    file_obj.save()
    
    # Отдаём файл для скачивания
    absolute_path = os.path.join(settings.STORAGE_ROOT, file_obj.file_path)
    return FileResponse(
        open(absolute_path, 'rb'),
        as_attachment=True,
        filename=file_obj.original_name
    )


# СПЕЦИАЛЬНАЯ ССЫЛКА (ПОДЕЛИТЬСЯ)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def share_file(request, file_id):
    """
    Создаёт специальную ссылку для доступа к файлу.
    Ссылка обезличена (не содержит имени пользователя и оригинального имени файла).
    """
    file_obj = File.objects.get(id=file_id)
    
    # Проверка прав
    if not request.user.is_admin and file_obj.user != request.user:
        return Response({'error': 'Доступ запрещен'}, status=403)
    
    # Возвращаем ссылку (она хранится в БД в поле share_link)
    return Response({'share_url': f"/api/files/shared/{file_obj.share_link}/"})


# СКАЧИВАНИЕ ПО СПЕЦИАЛЬНОЙ ССЫЛКЕ 

@api_view(['GET'])
@permission_classes([AllowAny])  # Доступно всем, даже без авторизации!
def download_shared(request, share_link):
    """
    Скачивает файл по специальной ссылке.
    Доступно всем пользователям (даже неавторизованным).
    Файл скачивается с оригинальным именем.
    """
    file_obj = File.objects.get(share_link=share_link)
    
    # Обновляем дату последнего скачивания
    file_obj.last_download_date = timezone.now()
    file_obj.save()
    
    # Отдаём файл
    absolute_path = os.path.join(settings.STORAGE_ROOT, file_obj.file_path)
    return FileResponse(
        open(absolute_path, 'rb'),
        as_attachment=True,
        filename=file_obj.original_name
    )
