<?php

namespace App\Filters;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

abstract class QueryFilter
{
    protected Builder $builder;

    /**
     * @var array<int, string>
     */
    protected array $allowed = [];

    public function __construct(protected Request $request) {}

    public function apply(Builder $builder): Builder
    {
        $this->builder = $builder;

        foreach ($this->filters() as $name => $value) {
            $this->{Str::camel($name)}($value);
        }

        return $this->builder;
    }

    /**
     * @return array<string, mixed>
     */
    protected function filters(): array
    {
        return array_filter(
            $this->request->only($this->allowed),
            static fn (mixed $value): bool => filled($value),
        );
    }
}
