<?php

namespace Database\Seeders;

use App\Enums\RoleSlug;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $creators = User::whereHas('role', fn (Builder $role) => $role->whereIn('slug', [
            RoleSlug::Admin->value,
            RoleSlug::Manager->value,
        ]))->get();

        Project::factory()
            ->count(3)
            ->state(fn () => ['created_by' => $creators->random()->id])
            ->create();
    }
}
