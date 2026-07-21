<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $projects = Project::all();
        $assignees = User::all();
        $creators = User::whereHas('role', fn ($query) => $query->whereIn('slug', ['admin', 'manager']))->get();

        Task::factory()
            ->count(20)
            ->state(fn () => [
                'project_id' => $projects->random()->id,
                'assigned_to' => $assignees->random()->id,
                'created_by' => $creators->random()->id,
            ])
            ->create();
    }
}
