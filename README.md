# Task Management

Система управления задачами: RESTful API на Laravel и Vue 3 SPA поверх него. Пользователи с ролями, проекты, задачи, доска задач, аналитика и email-уведомления через очередь.

## Стек технологий

### Бэкенд

- PHP 8.4, Laravel 13
- Laravel Sanctum (токен-аутентификация)
- MySQL 8 (в Docker), PostgreSQL и SQLite поддерживаются — драйверы `pdo_mysql`, `pdo_pgsql`, `pdo_sqlite` собраны в образе
- Redis (кеш статистики), очереди на драйвере `database`
- Pest 4 (тесты)
- Docker / Docker Compose

### Фронтенд

- Vue 3 (Composition API) + TypeScript
- Vue Router 4, Pinia 4, vue-i18n 11 (русский и английский)
- Axios, vue-draggable-plus (drag & drop на доске)
- Tailwind CSS 4, Vite 8
- Vitest 4 + Vue Test Utils (jsdom)

## Установка и настройка

### С Docker (MySQL + Redis)

```bash
cp .env.example .env
docker compose build
docker compose up -d
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --seed
docker compose exec app php artisan storage:link
```

Приложение будет доступно на `http://localhost:8000`. Стек поднимает пять сервисов:

- `app` — веб-сервер (`php -S`, порт 8000)
- `assets` — разовая сборка фронтенда (`npm ci && npm run build` в `node:22-alpine`); контейнер отрабатывает и завершается, `app` стартует только после его успешного завершения
- `queue` — воркер очередей (`php artisan queue:work`), email-уведомления обрабатываются автоматически
- `mysql` — MySQL 8, база `task_management` (порт 3306)
- `redis` — кеш дашборда статистики (порт 6379)

Compose сам передаёт сервисам `DB_CONNECTION=mysql`, `DB_HOST=mysql`, `CACHE_STORE=redis`, `REDIS_HOST=redis`, поэтому править `.env` под Docker не нужно.

Пересобрать фронтенд после правок, не перезапуская остальной стек:

```bash
docker compose up assets
```

### Без Docker

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
npm run build      # или npm run dev для hot reload
php artisan serve
```

Одной командой сервер, воркер очередей и Vite поднимаются через `composer run dev`.

По умолчанию `.env.example` использует SQLite — так проект поднимается одной командой без внешних сервисов. Для MySQL или PostgreSQL раскомментируйте блок `DB_*` в `.env`:

```dotenv
DB_CONNECTION=mysql        # или pgsql
DB_HOST=127.0.0.1
DB_PORT=3306               # 5432 для PostgreSQL
DB_DATABASE=task_management
DB_USERNAME=task_management
DB_PASSWORD=secret
```

Статистика кешируется в сторе из `CACHE_STORE` (по умолчанию `database`). Если локально запущен Redis — поставьте `CACHE_STORE=redis`.

Для отправки email-уведомлений нужен воркер очередей в отдельном терминале:

```bash
php artisan queue:work
```

Без запущенного воркера задачи очереди копятся в таблице `jobs` и не отправляются. `MAIL_MAILER=log` по умолчанию — письма пишутся в `storage/logs/laravel.log`.

## Миграции и тестовые данные

```bash
php artisan migrate --seed
php artisan migrate:fresh --seed
php artisan db:seed
```

Сидеры создают 1 admin, 2 manager, 5 user, 3 проекта и 20 задач. У всех пользователей пароль `password`:

| Роль | Email | Пароль |
|---|---|---|
| admin | `admin@example.com` | `password` |
| manager | `manager1@example.com` | `password` |
| manager | `manager2@example.com` | `password` |
| user | `user1@example.com` … `user5@example.com` | `password` |

## Фронтенд (SPA)

Vue 3 SPA живёт в [resources/js/](resources/js/) и работает поверх того же API, что и внешние клиенты. Все не-API маршруты Laravel отдают единственный шаблон [app.blade.php](resources/views/app.blade.php) ([routes/web.php](routes/web.php#L6-L10)), дальше маршрутизацией занимается Vue Router.

## Тесты

### Бэкенд

```bash
php artisan test --compact
# конкретный файл или тест
php artisan test --filter=TaskScopeTest
# в Docker
docker compose exec app php artisan test --compact
```

Тесты идут на SQLite в памяти с `RefreshDatabase` и не требуют предварительного сида — фабрики создают роли и пользователей по требованию.

### Фронтенд

```bash
npm test              # vitest run
npm run test:watch
npm run typecheck     # vue-tsc --noEmit
# в Docker
docker compose run --rm assets npm test
```

Тесты лежат рядом с кодом в каталогах `__tests__` и запускаются в jsdom ([vitest.config.ts](vitest.config.ts)). Покрыты обёртки API, composables, утилиты, guard'ы роутера, UI-компоненты и представления.
