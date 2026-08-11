<?php

namespace App\Services;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;

class UserService
{
    public function list(?int $perPage = null): LengthAwarePaginator
    {
        return User::with('role')->orderBy('id')->paginate($perPage ?? 15);
    }

    public function assignable(?int $perPage = null): LengthAwarePaginator
    {
        return User::query()
            ->where('status', UserStatus::Active)
            ->orderBy('id')
            ->paginate($perPage ?? 15);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(User $user, array $attributes, ?UploadedFile $avatar = null): User
    {
        if ($avatar) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }

            $attributes['avatar'] = $avatar->store('avatars', 'public');
        }

        $user->update($attributes);

        if ($user->wasChanged('status') && ! $user->status->allowsAccess()) {
            $user->tokens()->delete();
        }

        return $user;
    }

    public function updatePassword(User $user, string $password, ?int $keptTokenId = null): void
    {
        $user->update(['password' => $password]);

        $user->tokens()
            ->when($keptTokenId !== null, fn (Builder $tokens) => $tokens->whereKeyNot($keptTokenId))
            ->delete();
    }
}
