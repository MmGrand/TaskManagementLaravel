<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Permission::TasksViewAny);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Task $task): bool
    {
        return $user->hasPermission(Permission::TasksView)
            && $this->isRelatedTo($user, $task);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission(Permission::TasksCreate);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Task $task): bool
    {
        return $user->hasPermission(Permission::TasksUpdate)
            && $this->isRelatedTo($user, $task);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Task $task): bool
    {
        return $user->hasPermission(Permission::TasksDelete)
            && $task->isManageableBy($user);
    }

    private function isRelatedTo(User $user, Task $task): bool
    {
        return $task->assigned_to === $user->id || $task->isManageableBy($user);
    }
}
