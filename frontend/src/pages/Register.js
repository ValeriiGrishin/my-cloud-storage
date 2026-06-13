import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../store/slices/authSlice'; 

/**
 * Страница регистрации нового пользователя.
 * 
 * Валидация полей:
 * - Логин: только латиница, первый символ буква, длина 4-20 символов
 * - Email: корректный формат
 * - Пароль: минимум 6 символов, заглавная буква, цифра, спецсимвол
 * - Подтверждение пароля: должно совпадать с паролем
 * 
 * После успешной регистрации пользователь перенаправляется на страницу входа (/login)
 */

function Register() {
  const [formData, setFormData] = useState({ username: '', full_name: '', email: '', password: '', password2: '' });
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Очищаем ошибку для этого поля при вводе
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  /**
   * Валидация данных формы перед отправкой.
   * Возвращает true, если все поля заполнены корректно.
   */
  const validate = () => {
    const newErrors = {};
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9]{3,19}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!usernameRegex.test(formData.username)) newErrors.username = 'Логин: 4-20 символов, латиница, начинается с буквы';
    if (!emailRegex.test(formData.email)) newErrors.email = 'Неверный формат email';
    if (formData.password.length < 6) newErrors.password = 'Пароль: минимум 6 символов';
    else if (!/[A-Z]/.test(formData.password)) newErrors.password = 'Пароль: нужна заглавная буква';
    else if (!/[0-9]/.test(formData.password)) newErrors.password = 'Пароль: нужна цифра';
    else if (!/[!@#$%^&*]/.test(formData.password)) newErrors.password = 'Пароль: нужен спецсимвол';
    if (formData.password !== formData.password2) newErrors.password2 = 'Пароли не совпадают';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Обработчик отправки формы регистрации
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      const result = await dispatch(register(formData));
      // Редирект только при успешной регистрации
      if (result.payload && !result.error) {
        navigate('/login');
      }
    }
  };

  return (
    <div className="container" style={{ marginTop: '20px' }}>
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="text-center mb-4">
            <h1 className="fw-light mb-2" style={{ fontSize: '2rem' }}>My Cloud</h1>
            <p className="text-muted small">Создайте аккаунт</p>
          </div>
          
          {error && <div className="alert alert-danger text-center small py-2">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <input 
              type="text"
              name="username"
              className="form-control form-control-sm mb-2"
              placeholder="Логин"
              value={formData.username}
              onChange={handleChange}
              autoFocus
              required
            />
            {errors.username && <div className="text-danger small mb-2">{errors.username}</div>}
            
            <input 
              type="text"
              name="full_name"
              className="form-control form-control-sm mb-2"
              placeholder="Полное имя"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
            
            <input 
              type="email"
              name="email"
              className="form-control form-control-sm mb-2"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && <div className="text-danger small mb-2">{errors.email}</div>}
            
            <input 
              type="password"
              name="password"
              className="form-control form-control-sm mb-2"
              placeholder="Пароль"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {errors.password && <div className="text-danger small mb-2">{errors.password}</div>}
            
            <input 
              type="password"
              name="password2"
              className="form-control form-control-sm mb-3"
              placeholder="Подтверждение пароля"
              value={formData.password2}
              onChange={handleChange}
              required
            />
            {errors.password2 && <div className="text-danger small mb-2">{errors.password2}</div>}
            
            <button 
              type="submit"
              className="btn btn-outline-secondary btn-sm w-100 py-1"
              disabled={loading}
            >
              {loading ? '...' : 'Создать'}
            </button>
          </form>
          
          <p className="text-center text-muted small mt-3">
            Уже есть аккаунт? <Link to="/login" className="text-decoration-none">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;