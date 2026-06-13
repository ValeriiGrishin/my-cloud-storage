#  My Cloud Storage

Облачное хранилище файлов. Дипломный проект по профессии «Fullstack-разработчик на Python».

## Описание проекта

Веб-приложение, позволяющее пользователям загружать, скачивать, удалять и переименовывать файлы, а также управлять доступом к ним через специальные ссылки. Администратор имеет возможность управлять пользователями и их файловыми хранилищами.

## Функционал

- Регистрация и аутентификация пользователей
- Загрузка, скачивание, удаление файлов
- Переименование файлов и изменение комментариев к ним
- Просмотр файлов в браузере 
- Создание специальных ссылок для доступа к файлам
- Административная панель (управление пользователями и их файлами)

## Технологии

- **Backend**: Python, Django, Django REST Framework, PostgreSQL
- **Frontend**: React, Redux Toolkit, React Router, Bootstrap, Axios
- **Деплой**: reg.ru (Gunicorn + Nginx)

## Установка и запуск

### Требования

- Python (рекомендуется 3.10 - 3.12)
- Node.js 18+
- PostgreSQL

### 1. Клонирование репозитория

`git clone https://github.com/ValeriiGrishin/my-cloud-storage.git`

`cd my-cloud-storage`

### 2. Настройка бэкенда

`cd backend`

`python -m venv venv`

`source venv/Scripts/activate` (Windows: `venv\Scripts\activate`)

`pip install -r requirements.txt`


Создайте файл `.env` (скопируйте из `.env.example`):

`SECRET_KEY=your-secret-key`

`DEBUG=True`

`DB_NAME=cloud_storage`

`DB_USER=postgres`

`DB_PASSWORD=your_password`

`ADMIN_PASSWORD=change_me`


Выполните миграции:

`python manage.py makemigrations`

`python manage.py migrate`

`python manage.py runserver`


### 3. Настройка фронтенда

`cd ../frontend`

`npm install`

`npm start`

### 4. Доступ к приложению

- Фронтенд: http://localhost:3000
- API: http://localhost:8000/api
- Админка Django: http://localhost:8000/admin

## 5. Структура проекта

- my-cloud-storage/
  - backend/
    - accounts/        # Приложение пользователей и админка
    - core/            # Настройки Django
    - files/           # Приложение работа с файлами
    - manage.py        # Управляющий скрипт Django
    - requirements.txt # Зависимости Python
    - .env.example     # Пример переменных
  - frontend/
    - src/
      - api/           # Axios настройки
      - components/    # React компоненты
      - pages/         # Страницы приложения
      - store/         # Redux store
    - package.json     # Зависимости Node.js
  - README.md          # Документация

## Деплой на reg.ru

Приложение может быть развёрнуто на reg.ru в течение 1 рабочего дня. Инструкция по деплою предоставляется по запросу.
 
## Автор
 
Валерий Гришин, дипломный проект 2026
