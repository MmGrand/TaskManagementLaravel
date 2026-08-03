<?php

use Illuminate\Support\Facades\Route;

/**
 * Обработка всех маршрутов, кроме api, up и storage, для SPA приложения
 */
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api|up|storage).*$');
