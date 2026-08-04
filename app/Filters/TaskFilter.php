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

    public function dueDateFrom(string $value): void
    {
        $this->builder->whereDate('due_date', '>=', $value);
    }

    public function dueDateTo(string $value): void
    {
        $this->builder->whereDate('due_date', '<=', $value);
    }

    public function createdFrom(string $value): void
    {
        $this->builder->whereDate('created_at', '>=', $value);
    }

    public function createdTo(string $value): void
    {
        $this->builder->whereDate('created_at', '<=', $value);
    }

    protected function applySorting(): void
    {
        $direction = $this->request->query('sort_direction', 'desc');

        $this->builder
            ->orderBy($this->request->query('sort_by', 'created_at'), $direction)
            ->orderBy('id', $direction);
    }
}
