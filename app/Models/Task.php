<?php

namespace App\Models;

use App\Models\Concerns\Filterable;
use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
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
            || $user->isManager()
            || $this->created_by === $user->id;
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
