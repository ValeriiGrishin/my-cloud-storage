import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useSelector } from 'react-redux';

/**
 * Компонент Административной панели.
 * Доступен только пользователям с правами администратора (is_admin = true).
 * 
 * Возможности:
 * - Просмотр списка всех пользователей
 * - Просмотр файлов любого пользователя
 * - Назначение/снятие прав администратора
 * - Удаление пользователей (кроме защищённых)
 */

function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * Загружает список пользователей со статистикой файлов.
   * Бэкенд возвращает fileCount и totalSize через annotate (один запрос).
   */
  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users/');
      setUsers(res.data);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Удаляет пользователя по ID.
   * Доступно только для обычных пользователей (не защищённых)
   */
  const deleteUser = async (userId, username) => {
    if (!window.confirm(`Удалить пользователя "${username}"?`)) return;
    try {
      await api.delete(`/auth/users/${userId}/delete/`);
      await fetchUsers();
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Не удалось удалить пользователя');
    }
  };

  /**
   * Назначает или снимает права администратора.
   */
  const toggleAdmin = async (userId) => {
    try {
      await api.put(`/auth/users/${userId}/toggle-admin/`);
      await fetchUsers();
    } catch (err) {
      console.error('Ошибка изменения прав:', err);
      alert('Не удалось изменить права');
    }
  };

  /**
   * Форматирует размер файла в человекочитаемый вид.
   */
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  /**
   * Проверяет, является ли пользователь защищённым.
   * Защищённого пользователя нельзя удалить или изменить его права.
   */
  const isProtectedUser = (user) => {
    return user.id === 1;  // Главный администратор (первый созданный пользователь)
  };

  if (loading) return <div className="text-center mt-5">Загрузка...</div>;

  return (
    <div className="container mt-4">
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 pt-4">
          <h3 className="fw-light">Административная панель</h3>
          <p className="text-muted small">Управление пользователями и их файлами</p>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr className="small text-muted border-bottom">
                  <th>Пользователь</th>
                  <th>Роль</th>
                  <th>Файловое хранилище</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-bottom">
                    {/* Колонка с информацией о пользователе */}
                    <td className="py-3">
                      <div className="fw-semibold">{user.username}</div>
                      <div className="small text-muted">{user.full_name || '—'} • ID: {user.id}</div>
                      <div className="small text-muted">{user.email}</div>
                      <div className="small text-muted">Регистрация: {new Date(user.date_joined).toLocaleDateString('ru-RU')}</div>
                    </td>
                    
                    {/* Колонка с ролью */}
                    <td className="align-middle">
                      <span className={`badge ${user.is_admin ? 'bg-success' : 'bg-secondary'}`}>
                        {user.is_admin ? 'Администратор' : 'Пользователь'}
                      </span>
                      <div className="small mt-1 text-muted">
                        {user.is_admin ? 'Полный доступ' : 'Только свои файлы'}
                      </div>
                    </td>
                    
                    {/* Колонка с информацией о файловом хранилище */}
                    <td className="align-middle">
                      <div className="small">
                        <span className="fw-semibold">📁 {user.fileCount || 0}</span> файлов
                      </div>
                      <div className="small text-muted">
                        💾 {formatBytes(user.totalSize || 0)}
                      </div>
                    </td>
                    
                    {/* Колонка с действиями */}
                    <td className="align-middle text-nowrap">
                      <div className="d-flex gap-2 flex-wrap">
                        <Link to={`/files/${user.id}`} className="btn btn-sm btn-outline-secondary" title="Управлять файлами">
                          Посмотреть файлы
                        </Link>
                        
                        {/* Кнопки управления (только для обычных пользователей, не защищённых) */}
                        {currentUser?.id !== user.id && !isProtectedUser(user) && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => toggleAdmin(user.id)}
                              title={user.is_admin ? 'Снять права администратора' : 'Назначить администратором'}
                            >
                              {user.is_admin ? 'Снять админа' : 'Назначить админом'}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => deleteUser(user.id, user.username)}
                              title="Удалить пользователя"
                            >
                              Удалить
                            </button>
                          </>
                        )}
                        
                        {/* Защищённый пользователь (нельзя удалить или изменить права) */}
                        {isProtectedUser(user) && currentUser?.id !== user.id && (
                          <span className="badge bg-secondary px-2 py-2" title="Защищённый пользователь (нельзя удалить или изменить права)">
                            Защищён
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;