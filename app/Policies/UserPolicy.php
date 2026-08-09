<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\User;

class UserPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Permission::UsersViewAny);
    }

    public function viewAssignable(User $user): bool
    {
        return $user->hasPermission(Permission::UsersViewAssignable)
            || $user->hasPermission(Permission::UsersViewAny);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, User $model): bool
    {
        return $user->id === $model->id || $user->hasPermission(Permission::UsersView);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, User $model): bool
    {
        return $user->id === $model->id || $user->hasPermission(Permission::UsersUpdate);
    }

    /**
     * Determine whether the user can change the password of the model.
     */
    public function updatePassword(User $user, User $model): bool
    {
        return $user->id === $model->id;
    }
}
