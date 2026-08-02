<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\User;

class RolePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Permission::UsersUpdate);
    }
}
