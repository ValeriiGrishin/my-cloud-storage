from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_files, name='get_files'),
    path('upload/', views.upload_file, name='upload'),
    path('<int:file_id>/delete/', views.delete_file, name='delete'),
    path('<int:file_id>/rename/', views.rename_file, name='rename'),
    path('<int:file_id>/comment/', views.update_comment, name='comment'),
    path('<int:file_id>/download/', views.download_file, name='download'),
    path('<int:file_id>/share/', views.share_file, name='share'),
    path('shared/<str:share_link>/', views.download_shared, name='shared'),
]