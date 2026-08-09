<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface UserRepository
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;

    /**
     * Users who may be picked as a task assignee.
     */
    public function paginateAssignable(int $perPage = 15): LengthAwarePaginator;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): User;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(User $user, array $attributes): User;

    /**
     * @return Collection<int, User>
     */
    public function topActiveCreators(User $viewer, int $limit = 5): Collection;
}
