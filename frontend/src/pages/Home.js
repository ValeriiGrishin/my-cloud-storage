import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Главная страница приложения.
 * 
 * Особенности:
 * - Если пользователь уже авторизован → автоматически перенаправляется:
 *   * Администратор → на страницу админ-панели (/admin)
 *   * Обычный пользователь → на страницу с файлами (/files)
 * - Если пользователь не авторизован → показывает приветственный экран с кнопками входа и регистрации
 */

function Home() {
  const { user } = useSelector((state) => state.auth);
  
  // Редирект для авторизованных
  if (user) {
    // Администратор → в админ-панель
    // Обычный пользователь → в файловое хранилище
    return <Navigate to={user.is_admin ? '/admin' : '/files'} replace />;
  }
  
  // Главная для неавторизованных
  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
      <div className="text-center">
        <div className="mb-4">
          <span style={{ fontSize: '80px' }}>☁️</span>
        </div>
        
        <h1 className="display-3 fw-light mb-3">My Cloud</h1>
        <p className="lead text-muted mb-4">
          Простое и безопасное облачное хранилище
        </p>
        
        <p className="text-muted mb-5">
          Храните файлы, делитесь ссылками, управляйте доступом
        </p>
        
        <div className="d-flex justify-content-center gap-3">
          <Link to="/register">
            <button className="btn btn-outline-secondary btn-lg px-4 py-2">
              Создать аккаунт
            </button>
          </Link>
          <Link to="/login">
            <button className="btn btn-outline-secondary btn-lg px-4 py-2">
              Войти
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;