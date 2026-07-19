<?php

namespace App\Models\Concerns;

use App\Filters\QueryFilter;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;

trait Filterable
{
    #[Scope]
    protected function filter(Builder $query, QueryFilter $filter): Builder
    {
        return $filter->apply($query);
    }
}
