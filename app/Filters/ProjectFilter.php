<?php

namespace App\Filters;

class ProjectFilter extends QueryFilter
{
    /**
     * @var array<int, string>
     */
    protected array $allowed = ['status'];

    public function status(string $value): void
    {
        $this->builder->where('status', $value);
    }
}
