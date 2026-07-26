<?php

namespace App\Services;

use App\Repositories\Contracts\ProjectRepository;
use App\Repositories\Contracts\TaskRepository;
use App\Repositories\Contracts\UserRepository;
use Illuminate\Support\Facades\Cache;

class StatisticsService
{
    public function __construct(
        private readonly ProjectRepository $projects,
        private readonly TaskRepository $tasks,
        private readonly UserRepository $users,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function summary(): array
    {
        return Cache::flexible('statistics.summary', [50, 60], function () {
            return [
                'projects_count' => $this->projects->count(),
                'tasks_count' => $this->tasks->count(),
                'tasks_by_status' => $this->tasks->countByStatus(),
                'overdue_tasks_count' => $this->tasks->countOverdue(),
                'top_active_users' => $this->users->topActiveCreators()
                    ->map(fn ($user) => [
                        'id' => $user->id,
                        'first_name' => $user->first_name,
                        'last_name' => $user->last_name,
                        'email' => $user->email,
                        'tasks_created_count' => $user->created_tasks_count,
                    ])
                    ->values()
                    ->all(),
            ];
        });
    }
}
