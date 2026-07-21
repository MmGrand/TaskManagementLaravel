<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Contracts\UserRepository as UserRepositoryContract;
use Illuminate\Pagination\LengthAwarePaginator;

class UserRepository implements UserRepositoryContract
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return User::with('role')->paginate($perPage);
    }

    public function create(array $attributes): User
    {
        return User::create($attributes);
    }

    public function update(User $user, array $attributes): User
    {
        $user->update($attributes);

        return $user;
    }
}
