<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $creators = User::whereHas('role', fn ($query) => $query->whereIn('slug', ['admin', 'manager']))->get();

        Project::factory()
            ->count(3)
            ->state(fn () => ['created_by' => $creators->random()->id])
            ->create();
    }
}
