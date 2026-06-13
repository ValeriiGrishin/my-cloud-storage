import React from 'react';

/**
 * Компонент для отлова ошибок в React-компонентах.
 * 
 * - Если любой дочерний компонент выбрасывает ошибку,
 *   показывается fallback-интерфейс вместо белого экрана.
 * - Ошибка логируется в консоль.
 * 
 * Использование:
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Обновляем состояние, чтобы при следующем рендере показать fallback
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Логируем ошибку в консоль
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    // Сбрасываем состояние и перезагружаем страницу
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI — показываем вместо сломанного приложения
      return (
        <div className="container text-center mt-5 pt-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-5">
              <span style={{ fontSize: '64px' }}>⚠️</span>
              <h1 className="fw-light mt-3 mb-3">Что-то пошло не так</h1>
              <p className="text-muted mb-4">
                Произошла ошибка в приложении. Попробуйте перезагрузить страницу.
              </p>
              <button 
                className="btn btn-outline-secondary" 
                onClick={this.handleReset}
              >
                Перезагрузить
              </button>
              {process.env.NODE_ENV === 'development' && (
                <pre className="text-start mt-4 p-3 bg-light rounded small">
                  {this.state.error?.toString()}
                </pre>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;