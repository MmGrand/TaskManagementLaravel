<?php

namespace App\Services;

use App\Models\Role;
use App\Repositories\Contracts\RoleRepository;
use Illuminate\Database\Eloquent\Collection;

class RoleService
{
    public function __construct(private readonly RoleRepository $roles) {}

    /**
     * @return Collection<int, Role>
     */
    public function list(): Collection
    {
        return $this->roles->activeRoles();
    }
}
