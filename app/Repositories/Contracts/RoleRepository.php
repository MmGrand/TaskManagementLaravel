<?php

namespace App\Repositories\Contracts;

use App\Enums\RoleSlug;
use App\Models\Role;
use Illuminate\Database\Eloquent\Collection;

interface RoleRepository
{
    /**
     * @return Collection<int, Role>
     */
    public function activeRoles(): Collection;

    public function findBySlug(RoleSlug $slug): ?Role;
}
