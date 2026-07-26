<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class ProjectPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Permission::ProjectsViewAny);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Project $project): bool
    {
        if (! $user->hasPermission(Permission::ProjectsView)) {
            return false;
        }

        if ($user->isManager()) {
            return $project->created_by === $user->id;
        }

        return $project->tasks()
            ->where(fn (Builder $tasks) => $tasks
                ->where('assigned_to', $user->id)
                ->orWhere('created_by', $user->id))
            ->exists();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission(Permission::ProjectsCreate);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Project $project): bool
    {
        return $user->hasPermission(Permission::ProjectsUpdate)
            && $project->created_by === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Project $project): bool
    {
        return $user->hasPermission(Permission::ProjectsDelete)
            && $project->created_by === $user->id;
    }

    public function addTask(User $user, Project $project): bool
    {
        return $user->hasPermission(Permission::TasksCreate)
            && $project->created_by === $user->id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Project $project): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Project $project): bool
    {
        return false;
    }
}
