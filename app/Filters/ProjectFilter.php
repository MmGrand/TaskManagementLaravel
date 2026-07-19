<?php

namespace App\Filters;

class ProjectFilter extends QueryFilter
{
    public function status(string $value): void
    {
        $this->builder->where('status', $value);
    }
}
