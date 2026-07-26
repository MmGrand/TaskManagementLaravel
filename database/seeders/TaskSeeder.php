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
        $assignees = User::whereHas('role', fn ($query) => $query->where('slug', 'user'))->get();

        Task::factory()
            ->count(20)
            ->state(function () use ($projects, $assignees): array {
                $project = $projects->random();

                return [
                    'project_id' => $project->id,
                    'assigned_to' => $assignees->random()->id,
                    'created_by' => $project->created_by,
                ];
            })
            ->create();
    }
}
