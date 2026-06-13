import axios from 'axios';

// Определяем базовый URL в зависимости от окружения
const getBaseUrl = () => {
  // Для продакшена — относительный путь (единый сервер)
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }
  // Для разработки — локальный сервер Django
  return 'http://localhost:8000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});

// Автоматический CSRF токен для всех не-GET запросов
api.interceptors.request.use(async (config) => {
  if (config.method !== 'get') {
    try {
      // Для CSRF используем относительный путь
      const csrfUrl = process.env.NODE_ENV === 'production' 
        ? '/api/auth/csrf/' 
        : 'http://localhost:8000/api/auth/csrf/';
      const response = await axios.get(csrfUrl, { withCredentials: true });
      config.headers['X-CSRFToken'] = response.data.csrfToken;
    } catch (e) {
      console.error('CSRF error:', e);
    }
  }
  return config;
});

/**
 * Интерцептор для обработки ошибок авторизации (401)
 * 
 * Если сервер возвращает 401 Unauthorized:
 * - Очищаем localStorage (чтобы Redux сбросил состояние)
 * - Перенаправляем пользователя на страницу входа
 * - Избегаем бесконечного редиректа (не редиректим, если уже на /login или /register)
 */
api.interceptors.response.use(
  (response) => {
    // Успешный ответ — просто возвращаем его
    return response;
  },
  (error) => {
    // Проверяем, является ли ошибка 401 (Unauthorized)
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      
      // Избегаем бесконечного редиректа (не редиректим, если уже на странице входа/регистрации)
      if (currentPath !== '/login' && currentPath !== '/register') {
        console.log('401 Unauthorized — перенаправление на страницу входа');
        
        // Очищаем localStorage (если используется persist)
        localStorage.removeItem('persist:root');
        
        // Перенаправляем на страницу входа
        window.location.href = '/login';
      }
    }
    
    // Пробрасываем ошибку дальше, чтобы её мог обработать компонент
    return Promise.reject(error);
  }
);

export default api;