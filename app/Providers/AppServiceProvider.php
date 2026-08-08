<?php

namespace App\Providers;

use App\Enums\Permission;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Abilities the administrator bypass does not cover: they belong to the account owner alone.
     *
     * @var array<int, string>
     */
    private const PERSONAL_ABILITIES = ['updatePassword'];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::before(fn (User $user, string $ability) => $user->isAdmin()
            && ! in_array($ability, self::PERSONAL_ABILITIES, true) ? true : null);

        Gate::define('viewStatistics', fn (User $user) => $user->hasPermission(Permission::StatisticsView));

        Password::defaults(fn () => $this->app->isProduction()
            ? Password::min(8)->letters()->numbers()
            : Password::min(8));

        RateLimiter::for('auth', fn (Request $request) => [
            Limit::perMinute(5)->by($request->ip().'|'.$request->string('email')),
            Limit::perMinute(20)->by($request->ip()),
        ]);

        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(60)->by($request->user()?->id ?: $request->ip()));
    }
}
