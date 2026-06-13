import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { uploadFile, deleteFile, renameFile, updateComment } from '../store/slices/fileSlice';
import api from '../api/axios';

/**
 * Компонент для работы с файлами.
 * 
 * Особенности:
 * - Обычный пользователь видит и управляет только своими файлами
 * - Администратор может просматривать и управлять файлами любого пользователя (через параметр userId в URL)
 * - Редактирование имени и комментария происходит по клику на текст
 */

function Files() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState(null);
  const { user: currentUser } = useSelector((state) => state.auth);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [comment, setComment] = useState('');

  const [editingFile, setEditingFile] = useState(null);
  const [newName, setNewName] = useState('');

  const [editingComment, setEditingComment] = useState(null);
  const [newComment, setNewComment] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isAdminView = userId && currentUser?.is_admin;
  
  // Загружает список файлов (и данные пользователя для админа)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isAdminView) {
        const usersRes = await api.get('/auth/users/');
        const user = usersRes.data.find(u => u.id === parseInt(userId));
        setTargetUser(user);
      }
      
      const url = isAdminView 
        ? `/files/?user_id=${userId}&page=${currentPage}` 
        : `/files/?page=${currentPage}`;
      const filesRes = await api.get(url);
      setFiles(filesRes.data.results);
      setTotalPages(Math.ceil(filesRes.data.count / 10));
    } catch (err) {
      console.error('Ошибка загрузки:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, isAdminView, currentPage]);
  
  // Загружаем данные при монтировании или изменении userId
  useEffect(() => {
    if (isAdminView && !currentUser?.is_admin) {
      navigate('/files');
      return;
    }
    loadData();
  }, [userId, isAdminView, currentUser?.is_admin, loadData, navigate]);
  
  // Загрузка нового файла
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('comment', comment);
    
    await dispatch(uploadFile(formData));
    setSelectedFile(null);
    setComment('');
    document.getElementById('fileInput').value = '';
    loadData();
  };
  
  // Удаление файла
  const handleDelete = async (fileId, fileName) => {
    if (window.confirm(`Удалить файл "${fileName}"?`)) {
      await dispatch(deleteFile(fileId));
      loadData();
    }
  };

  // Скачивание файла
  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await api.get(`/files/${fileId}/download/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Ошибка при скачивании');
    }
  };

  // Просмотр файла в браузере 
  const handleView = async (fileId, fileName) => {
    try {
      const response = await api.get(`/files/${fileId}/download/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(response.data);
      const fileType = fileName.split('.').pop().toLowerCase();
      const viewableTypes = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt', 'md', 'html', 'css', 'js', 'svg', 'webp'];
      
      if (viewableTypes.includes(fileType)) {
        window.open(url, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        alert('Файл не поддерживает просмотр в браузере. Скачивание начато.');
      }
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Ошибка при просмотре файла');
    }
  };

  // Переименование файла
  const handleRename = async (fileId) => {
    if (newName.trim()) {
      await dispatch(renameFile({ fileId, newName }));
      setEditingFile(null);
      setNewName('');
      loadData();
    }
  };

  // Редактирование комментария
  const handleUpdateComment = async (fileId) => {
    await dispatch(updateComment({ fileId, comment: newComment }));
    setEditingComment(null);
    setNewComment('');
    loadData();
  };

  // Создание специальной ссылки для доступа к файлу
  const handleShare = async (fileId) => {
    try {
      const response = await api.get(`/files/${fileId}/share/`);
      const fullLink = `${window.location.origin}${response.data.share_url}`;
      
      // Альтернативный способ копирования (работает и на HTTP)
      const textarea = document.createElement('textarea');
      textarea.value = fullLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      
      alert(`Ссылка скопирована: ${fullLink}`);
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при создании ссылки');
    }
  };
  
  // Форматирует размер файла (B, KB, MB, GB)
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Форматирует дату в локальный формат
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleString('ru-RU');
    } catch {
      return '—';
    }
  };
  
  if (loading) return <div className="text-center mt-5">Загрузка...</div>;
  
  return (
    <div className="container mt-4">
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-0 pt-4">
          {isAdminView && targetUser ? (
            <>
              <h3 className="fw-light">Файлы пользователя: {targetUser.username}</h3>
              <p className="text-muted small">{targetUser.email} • {targetUser.full_name || 'Нет полного имени'}</p>
              <button className="btn btn-sm btn-outline-secondary mt-2" onClick={() => navigate('/admin')}>
                ← Назад к пользователям
              </button>
            </>
          ) : (
            <h3 className="fw-light">Добро пожаловать, {currentUser?.full_name || currentUser?.username}!</h3>
          )}
        </div>
        
        {/* Форма загрузки файла (скрыта для админа) */}
        {!isAdminView && (
          <div className="card-body">
            <h5 className="fw-light mb-3">Загрузить новый файл</h5>
            <form onSubmit={handleUpload}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="small text-muted">Выберите файл</label>
                  <input type="file" className="form-control" id="fileInput" onChange={(e) => setSelectedFile(e.target.files[0])} required />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="small text-muted">Комментарий</label>
                  <input type="text" className="form-control" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Описание" />
                </div>
                <div className="col-md-2 mb-3">
                  <label className="small text-muted">&nbsp;</label>
                  <button type="submit" className="btn btn-outline-secondary w-100" disabled={!selectedFile}>
                    ☁️ Загрузить
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
      
      {/* Таблица с файлами */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 pt-4">
          <h5 className="fw-light">Файлы ({files.length})</h5>
        </div>
        <div className="card-body">
          {files.length === 0 ? (
            <p className="text-center text-muted py-5">Нет файлов</p>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-sm table-hover">
                  <thead>
                    <tr className="small text-muted">
                      <th>Имя файла</th>
                      <th>Комментарий</th>
                      <th>Размер</th>
                      <th>Дата загрузки</th>
                      <th>Последнее скачивание</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map(file => (
                      <tr key={file.id}>
                        <td style={{ maxWidth: '200px' }}>
                          {editingFile === file.id ? (
                            <div className="input-group input-group-sm">
                              <input type="text" className="form-control" value={newName} onChange={e => setNewName(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleRename(file.id)} autoFocus />
                              <button className="btn btn-outline-success btn-sm" onClick={() => handleRename(file.id)}>✓</button>
                              <button className="btn btn-outline-secondary btn-sm" onClick={() => { setEditingFile(null); setNewName(''); }}>✗</button>
                            </div>
                          ) : (
                            <span 
                              className="small d-inline-block" 
                              style={{ cursor: 'pointer', maxWidth: '100%' }}
                              onClick={() => { setEditingFile(file.id); setNewName(file.original_name); }}
                              title="Кликните для переименования"
                            >
                              {file.original_name}
                            </span>
                          )}
                        </td>
                        <td>
                          {editingComment === file.id ? (
                            <div className="input-group input-group-sm">
                              <input type="text" className="form-control" value={newComment} onChange={e => setNewComment(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleUpdateComment(file.id)} autoFocus />
                              <button className="btn btn-outline-success btn-sm" onClick={() => handleUpdateComment(file.id)}>✓</button>
                              <button className="btn btn-outline-secondary btn-sm" onClick={() => { setEditingComment(null); setNewComment(''); }}>✗</button>
                            </div>
                          ) : (
                            <span 
                              className="small text-muted d-inline-block" 
                              style={{ cursor: 'pointer' }}
                              onClick={() => { setEditingComment(file.id); setNewComment(file.comment || ''); }}
                              title="Кликните для редактирования комментария"
                            >
                              {file.comment || '—'}
                            </span>
                          )}
                        </td>
                        <td className="text-nowrap small">{formatBytes(file.size)}</td>
                        <td className="text-nowrap small">{formatDate(file.upload_date)}</td>
                        <td className="text-nowrap small">{file.last_download_date ? formatDate(file.last_download_date) : '—'}</td>
                        <td className="text-nowrap">
                          <div className="btn-group btn-group-sm" role="group">
                            <button className="btn btn-outline-secondary" title="Просмотреть" onClick={() => handleView(file.id, file.original_name)}>👁️</button>
                            <button className="btn btn-outline-secondary" title="Скачать" onClick={() => handleDownload(file.id, file.original_name)}>💾</button>
                            <button className="btn btn-outline-secondary" title="Поделиться" onClick={() => handleShare(file.id)}>🔗</button>
                            <button className="btn btn-outline-secondary" title="Удалить" onClick={() => handleDelete(file.id, file.original_name)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Пагинация */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center gap-2 mt-4">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    ← Назад
                  </button>
                  <span className="px-3 py-1 text-muted small">
                    Страница {currentPage} из {totalPages}
                  </span>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Вперёд →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Files;