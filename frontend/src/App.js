import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from './store/slices/authSlice';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Files from './pages/Files';
import Admin from './pages/Admin';  
import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * Компонент для защиты маршрутов, требующих авторизации.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Компонент, который нужно защитить
 * @param {boolean} props.adminOnly - Если true, доступ только для администраторов
 * 
 * Логика работы:
 * 1. Если пользователь не авторизован → редирект на главную страницу
 * 2. Если нужны права админа, но пользователь не админ → редирект на страницу файлов
 * 3. Иначе показываем запрошенный компонент
 */


function PrivateRoute({ children, adminOnly = false }) {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/" />; // Не авторизован → на главную
  if (adminOnly && !user.is_admin) return <Navigate to="/files" />; // Админ-контент, но пользователь не админ → в файлы
  return children; // Всё хорошо, показываем страницу
}

/**
 * Главный компонент приложения.
 * Настраивает маршрутизацию (React Router) и глобальную навигацию.
 * 
 * Маршруты:
 * /                     - Главная страница
 * /login                - Вход
 * /register             - Регистрация
 * /files                - Список файлов текущего пользователя
 * /files/:userId        - Список файлов пользователя (только для админа)
 * /admin                - Административная панель (только для админа)
 */

function App() {
  const dispatch = useDispatch();
  // При загрузке приложения проверяем, есть ли уже авторизованный пользователь
  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  return (
    <BrowserRouter>
      {/* Навигационная панель (отображается на всех страницах) */}
      <Navigation />
      <Routes>
        {/* Публичные маршруты (доступны всем) */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Файлы другого пользователя (только для админа) */}
        <Route path="/files/:userId" element={<PrivateRoute adminOnly><Files /></PrivateRoute>} />        
        {/* Свои файлы */}
        <Route path="/files" element={<PrivateRoute><Files /></PrivateRoute>} />
        {/* Админ-панель (только для админа) */}        
        <Route path="/admin" element={<PrivateRoute adminOnly><Admin /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;