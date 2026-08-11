<?php

namespace App\Services;

use App\Enums\RoleSlug;
use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class AuthService
{
    /**
     * @param  array<string, mixed>  $attributes
     * @return array{user: User, token: string}
     */
    public function register(array $attributes): array
    {
        $role = Role::query()->where('slug', RoleSlug::User->value)->first()
            ?? throw new RuntimeException('Роль не найдена. Пожалуйста, создайте роль с slug "user".');

        $user = User::create([
            ...$attributes,
            'role_id' => $role->id,
            'status' => UserStatus::Active,
        ]);

        return [
            'user' => $user,
            'token' => $user->createToken('api')->plainTextToken,
        ];
    }

    /**
     * @param  array{email: string, password: string}  $credentials
     * @return array{user: User, token: string}
     */
    public function login(array $credentials): array
    {
        if (! Auth::validate($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['Email or password is incorrect.'],
            ]);
        }

        $user = Auth::getLastAttempted();

        if (! $user->status->allowsAccess()) {
            throw ValidationException::withMessages([
                'email' => ["Аккаунт недоступен: {$user->status->label()}."],
            ]);
        }

        return [
            'user' => $user,
            'token' => $user->createToken('api')->plainTextToken,
        ];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }
}
