import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { clearFiles } from '../store/slices/fileSlice';

/**
 * Компонент навигационной панели.
 * Отображается на всех страницах приложения.
 * 
 * Особенности:
 * - Если пользователь не авторизован: показывает кнопки "Вход" и "Регистрация"
 * - Если пользователь авторизован: показывает имя пользователя и кнопки "Мои файлы", "Выйти"
 * - Если пользователь администратор: дополнительно показывает кнопку "Администрирование"
 */


function Navigation() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearFiles());
    navigate('/');
  };

  // Если пользователь не авторизован - показываем кнопки входа и регистрации
  if (!user) {
    return (
      <nav className="navbar navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand fw-light" to="/" style={{ fontSize: '1.25rem' }}>My Cloud</Link>
          <div>
            <Link className="btn btn-sm btn-outline-light m-1" to="/login">Вход</Link>
            <Link className="btn btn-sm btn-outline-light m-1" to="/register">Регистрация</Link>
          </div>
        </div>
      </nav>
    );
  }
  
  // Авторизованный пользователь - показываем полное меню
  return (
    <nav className="navbar navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand fw-light" to="/" style={{ fontSize: '1.25rem' }}>My Cloud</Link>
        <div className="d-flex align-items-center flex-wrap">
          <span className="text-light me-3 small">Привет, {user.full_name || user.username}</span>
          {user.is_admin && <Link className="btn btn-sm btn-outline-light m-1" to="/admin">Администрирование</Link>}
          <Link className="btn btn-sm btn-outline-light m-1" to="/files">Мои файлы</Link>
          <button className="btn btn-sm btn-outline-light m-1" onClick={handleLogout}>Выйти</button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;