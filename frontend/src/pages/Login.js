import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../store/slices/authSlice';

/**
 * Страница входа в систему.
 * 
 * После успешного входа:
 * - Администратор перенаправляется в админ-панель (/admin)
 * - Обычный пользователь перенаправляется к своим файлам (/files)
 */

function Login() {
   // Состояния для полей формы
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch(); // Для отправки действий в Redux
  const navigate = useNavigate(); // Для программного редиректа
  const { loading, error } = useSelector((state) => state.auth); // Получаем состояние авторизации из Redux store

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);
  
  //Обработчик отправки формы входа
  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(login({ username, password }));
    
    if (result.payload && !result.error) {
      navigate(result.payload.is_admin ? '/admin' : '/files');
    }
  };

  return (
    <div className="container" style={{ marginTop: '20px' }}>
      <div className="row justify-content-center">
        <div className="col-md-5">
          {/* Заголовок страницы */}
          <div className="text-center mb-4">
            <h1 className="fw-light mb-2" style={{ fontSize: '2rem' }}>My Cloud</h1>
            <p className="text-muted small">Войдите в аккаунт</p>
          </div>
          
          {error && <div className="alert alert-danger text-center small py-2">{error}</div>}
          {/* Форма входа */}
          <form onSubmit={handleSubmit}>
            <input 
              type="text"
              name="username"
              className="form-control form-control-sm mb-2"
              placeholder="Логин"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              required
            />
             {/* Поле для пароля */}
            <input 
              type="password"
              name="password"
              className="form-control form-control-sm mb-3"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {/* Кнопка отправки */}
            <button 
              type="submit"
              className="btn btn-outline-secondary btn-sm w-100 py-1"
              disabled={loading}
            >
              {loading ? '...' : 'Войти'}
            </button>
          </form>
          {/* Ссылка на страницу регистрации для новых пользователей */}
          <p className="text-center text-muted small mt-3">
            Нет аккаунта? <Link to="/register" className="text-decoration-none">Создать</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;