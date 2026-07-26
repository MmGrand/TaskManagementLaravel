<?php

namespace App\Models;

use App\Models\Concerns\Filterable;
use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['title', 'description', 'status', 'priority', 'project_id', 'assigned_to', 'created_by', 'due_date'])]
class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use Filterable, HasFactory;

    public function isManageableBy(User $user): bool
    {
        return $user->isAdmin()
            || $this->created_by === $user->id
            || ($user->isManager() && $this->project->created_by === $user->id);
    }

    #[Scope]
    protected function visibleTo(Builder $query, User $user): Builder
    {
        if ($user->isAdmin()) {
            return $query;
        }

        return $query->where(function (Builder $query) use ($user): void {
            $query->where('assigned_to', $user->id)
                ->orWhere('created_by', $user->id);

            if ($user->isManager()) {
                $query->orWhereHas(
                    'project',
                    fn (Builder $project) => $project->where('created_by', $user->id),
                );
            }
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
