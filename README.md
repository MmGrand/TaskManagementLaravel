# Task Management API

RESTful API для системы управления задачами: пользователи с ролями, проекты, задачи, аналитика и email-уведомления через очередь.

## Стек технологий

- PHP 8.4, Laravel 13
- Laravel Sanctum (токен-аутентификация)
- SQLite (по умолчанию), легко переключается на MySQL/PostgreSQL
- Redis (кеш статистики), очереди на драйвере `database`
- Pest 4 (тесты)
- Docker / Docker Compose (опционально)

## Установка и настройка

### Без Docker

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Приложение будет доступно на `http://localhost:8000`.

Для реальной отправки очередей (email-уведомления) в отдельном терминале:

```bash
php artisan queue:work
```

Без запущенного воркера задачи очереди просто копятся в таблице `jobs` и не отправляются.

### С Docker

```bash
docker compose build
docker compose up -d
docker compose exec app php artisan migrate --seed
```

API будет доступно на `http://localhost:8000`. Стек поднимает три сервиса:

- `app` — веб-сервер (`php -S`, порт 8000)
- `queue` — воркер очередей (`php artisan queue:work`), уведомления обрабатываются автоматически
- `redis` — используется для кеширования дашборда статистики

## Тестовые данные (сидер)

После `php artisan migrate --seed` создаются:

| Роль | Email | Пароль |
|---|---|---|
| admin | `admin@example.com` | `password` |
| manager | `manager1@example.com` | `password` |
| manager | `manager2@example.com` | `password` |
| user | `user1@example.com` … `user5@example.com` | `password` |

Плюс 3 проекта и 20 задач, распределённых между ними.

## Тесты

```bash
php artisan test --compact
```

Или через Docker:

```bash
docker compose exec app php artisan test --compact
```

Тесты используют `RefreshDatabase` и не требуют предварительного запуска сидеров — фабрики создают роли/пользователей по требованию.
