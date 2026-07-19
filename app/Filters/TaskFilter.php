<?php

namespace App\Filters;

use Illuminate\Database\Eloquent\Builder;

class TaskFilter extends QueryFilter
{
    public function apply(Builder $builder): Builder
    {
        parent::apply($builder);

        $this->applySorting();

        return $this->builder;
    }

    public function status(string $value): void
    {
        $this->builder->where('status', $value);
    }

    public function priority(string $value): void
    {
        $this->builder->where('priority', $value);
    }

    public function projectId(int $value): void
    {
        $this->builder->where('project_id', $value);
    }

    public function assignedTo(int $value): void
    {
        $this->builder->where('assigned_to', $value);
    }

    protected function applySorting(): void
    {
        $this->builder->orderBy(
            $this->request->query('sort_by', 'created_at'),
            $this->request->query('sort_direction', 'desc'),
        );
    }
}
