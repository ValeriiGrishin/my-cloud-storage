from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('me/', views.get_current_user, name='me'),
    path('users/', views.get_users, name='users'),
    path('users/<int:user_id>/delete/', views.delete_user, name='delete_user'),
    path('users/<int:user_id>/toggle-admin/', views.toggle_admin, name='toggle_admin'),
    path('csrf/', views.get_csrf_token, name='csrf'),
]