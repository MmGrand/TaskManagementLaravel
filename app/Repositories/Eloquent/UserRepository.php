<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Contracts\UserRepository as UserRepositoryContract;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
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

    public function topActiveCreators(User $viewer, int $limit = 5): Collection
    {
        $visibleTasks = fn (Builder $tasks): Builder => $tasks->visibleTo($viewer);

        return User::query()
            ->withCount(['createdTasks' => $visibleTasks])
            ->whereHas('createdTasks', $visibleTasks)
            ->orderByDesc('created_tasks_count')
            ->limit($limit)
            ->get();
    }
}
