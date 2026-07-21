<?php

namespace App\Providers;

use App\Repositories\Contracts\ProjectRepository;
use App\Repositories\Contracts\TaskRepository;
use App\Repositories\Contracts\UserRepository;
use App\Repositories\Eloquent\ProjectRepository as EloquentProjectRepository;
use App\Repositories\Eloquent\TaskRepository as EloquentTaskRepository;
use App\Repositories\Eloquent\UserRepository as EloquentUserRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(ProjectRepository::class, EloquentProjectRepository::class);
        $this->app->bind(TaskRepository::class, EloquentTaskRepository::class);
        $this->app->bind(UserRepository::class, EloquentUserRepository::class);
    }
}
