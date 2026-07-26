<?php

namespace App\Models;

use App\Models\Concerns\Filterable;
use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'description', 'status', 'created_by'])]
class Project extends Model
{
    /** @use HasFactory<ProjectFactory> */
    use Filterable, HasFactory;

    #[Scope]
    protected function visibleTo(Builder $query, User $user): Builder
    {
        if ($user->isAdmin()) {
            return $query;
        }

        if ($user->isManager()) {
            return $query->where('created_by', $user->id);
        }

        return $query->whereHas('tasks', fn (Builder $tasks) => $tasks
            ->where('assigned_to', $user->id)
            ->orWhere('created_by', $user->id));
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
