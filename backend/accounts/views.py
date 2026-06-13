import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from .models import User
from .serializers import UserSerializer, RegisterSerializer
from django.db.models import Count, Sum

# Настройка логирования для отслеживания событий
logger = logging.getLogger(__name__)


# РЕГИСТРАЦИЯ И АВТОРИЗАЦИЯ
@api_view(['POST'])
@permission_classes([AllowAny])  # Доступно всем, даже неавторизованным
def register(request):
    """
    Регистрация нового пользователя.
    Принимает: username, full_name, email, password, password2
    Возвращает: данные созданного пользователя
    """
    # Валидируем данные через сериализатор
    serializer = RegisterSerializer(data=request.data)
    
    if serializer.is_valid():
        # Если данные правильные - сохраняем пользователя
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
    
    # Если ошибка - возвращаем текст ошибки
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def user_login(request):
    """
    Вход пользователя в систему.
    Принимает: username, password
    Возвращает: данные пользователя (включая права is_admin)
    """
    # Получаем данные из запроса
    username = request.data.get('username')
    password = request.data.get('password')
    
    # Проверяем логин и пароль
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        # Вход выполнен успешно - создаём сессию
        login(request, user)
        serializer = UserSerializer(user)
        logger.info(f"Пользователь вошёл: {username}, права админа: {user.is_admin}")
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    # Неверные данные
    logger.warning(f"Неудачная попытка входа: {username}")
    return Response({'error': 'Неверный логин или пароль'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
def user_logout(request):
    """Выход из системы - завершаем сессию"""
    logout(request)
    logger.info('Пользователь вышел из системы')
    return Response(status=status.HTTP_200_OK)


@api_view(['GET'])
def get_current_user(request):
    """
    Получение данных текущего авторизованного пользователя.
    Используется для проверки, кто залогинен (особенно после перезагрузки страницы)
    """
    return Response(UserSerializer(request.user).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    """
    Выдаёт CSRF-токен для защиты от подделки запросов.
    Нужен для POST, PUT, DELETE запросов с фронтенда
    """
    return Response({'csrfToken': get_token(request)})


# АДМИНИСТРАТИВНЫЕ ФУНКЦИИ (только для админа)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users(request):
    """
    Возвращает список всех пользователей со статистикой их файлов.
    Доступно ТОЛЬКО администраторам!
    """
    if not request.user.is_admin:
        return Response({'error': 'Доступ запрещен'}, status=status.HTTP_403_FORBIDDEN)
    
    # Получаем пользователей со статистикой
    users = User.objects.annotate(
        file_count=Count('files'),
        total_size=Sum('files__size')
    ).all()
    
    # Сериализуем
    serializer = UserSerializer(users, many=True)
    response_data = []
    
    for user, data in zip(users, serializer.data):
        # Добавляем поля с именами, которые ожидает фронт
        data['fileCount'] = user.file_count or 0      
        data['totalSize'] = user.total_size or 0     
        response_data.append(data)
    
    return Response(response_data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request, user_id):
    """
    Удаляет пользователя по ID.
    Доступно ТОЛЬКО администраторам!
    Нельзя удалить самого себя и главного админа (admin)
    """
    # Проверка прав
    if not request.user.is_admin:
        return Response({'error': 'Доступ запрещен'}, status=status.HTTP_403_FORBIDDEN)
    
    # Защита от удаления самого себя
    if request.user.id == int(user_id):
        return Response({'error': 'Нельзя удалить самого себя'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        
        # Защита главного администратора (username='admin' или id=1)
        if user.username == 'admin' or user.id == 1:
            return Response({'error': 'Невозможно удалить главного администратора'}, status=status.HTTP_403_FORBIDDEN)
        
        # Удаляем пользователя
        user.delete()
        logger.info(f"Пользователь {user.username} удалён администратором {request.user.username}")
        return Response(status=status.HTTP_204_NO_CONTENT)
        
    except User.DoesNotExist:
        return Response({'error': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def toggle_admin(request, user_id):
    """
    Назначает или снимает права администратора у пользователя.
    Доступно ТОЛЬКО администраторам!
    """
    # Проверка прав
    if not request.user.is_admin:
        return Response({'error': 'Доступ запрещен'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        target_user = User.objects.get(id=user_id)
        
        # Главный админ (admin) защищён от изменения прав
        if target_user.username == 'admin' or target_user.id == 1:
            return Response({'error': 'Нельзя изменить права главного администратора'}, status=status.HTTP_403_FORBIDDEN)
        
        # Супер-админ тоже защищён
        if target_user.username == 'superadmin':
            return Response({'error': 'Нельзя изменить права супер-админа'}, status=status.HTTP_403_FORBIDDEN)
        
        # Переключаем роль: был админом -> снимаем, не был -> назначаем
        target_user.is_admin = not target_user.is_admin
        target_user.save()
        
        logger.info(f"Права админа для {target_user.username} изменены на {target_user.is_admin} (действие: {request.user.username})")
        serializer = UserSerializer(target_user)
        return Response(serializer.data)
        
    except User.DoesNotExist:
        return Response({'error': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)