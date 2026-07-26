FROM php:8.4-cli

RUN apt-get update && apt-get install -y \
        git \
        unzip \
        libonig-dev \
        libzip-dev \
        libsqlite3-dev \
    && docker-php-ext-install pdo_sqlite pcntl mbstring zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-interaction --optimize-autoloader

COPY . .
RUN composer dump-autoload --optimize

EXPOSE 8000

CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]
