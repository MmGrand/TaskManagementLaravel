<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/users', [\App\Http\Controllers\api\UserController::class, 'index']);
Route::get('/users/{user}', [\App\Http\Controllers\api\UserController::class, 'show']);
Route::put('/users/{user}', [\App\Http\Controllers\api\UserController::class, 'update']);

Route::get('/projects', [\App\Http\Controllers\api\ProjectController::class, 'index']);
Route::post('/projects', [\App\Http\Controllers\api\ProjectController::class, 'create']);
Route::get('/projects/{project}', [\App\Http\Controllers\api\ProjectController::class, 'show']);
Route::put('/projects/{project}', [\App\Http\Controllers\api\ProjectController::class, 'update']);
Route::delete('/projects/{project}', [\App\Http\Controllers\api\ProjectController::class, 'destroy']);
