<?php

namespace Database\Seeders;

use App\Enums\RoleSlug;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Eloquent\Builder;
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
        $assignees = User::whereHas('role', fn (Builder $role) => $role->where('slug', RoleSlug::User->value))->get();

        $placement = function () use ($projects, $assignees): array {
            $project = $projects->random();

            return [
                'project_id' => $project->id,
                'assigned_to' => $assignees->random()->id,
                'created_by' => $project->created_by,
            ];
        };

        Task::factory()->count(16)->state($placement)->create();

        /** A handful of overdue tasks so the dashboard has something to report. */
        Task::factory()->count(4)->overdue()->state($placement)->create();
    }
}
