<?php

namespace App\Repositories\Eloquent;

use App\Enums\RoleSlug;
use App\Models\Role;
use App\Repositories\Contracts\RoleRepository as RoleRepositoryContract;
use Illuminate\Database\Eloquent\Collection;

class RoleRepository implements RoleRepositoryContract
{
    /**
     * Not paginated: the table holds one row per role slug.
     *
     * @return Collection<int, Role>
     */
    public function activeRoles(): Collection
    {
        return Role::query()
            ->where('is_active', true)
            ->orderBy('id')
            ->get();
    }

    public function findBySlug(RoleSlug $slug): ?Role
    {
        return Role::query()->where('slug', $slug->value)->first();
    }
}
