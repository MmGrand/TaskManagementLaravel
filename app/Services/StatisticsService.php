<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\ProjectRepository;
use App\Repositories\Contracts\TaskRepository;
use App\Repositories\Contracts\UserRepository;

class StatisticsService
{
    public function __construct(
        private readonly ProjectRepository $projects,
        private readonly TaskRepository $tasks,
        private readonly UserRepository $users,
        private readonly StatisticsCache $cache,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function summary(User $viewer): array
    {
        return $this->cache->remember($viewer, function () use ($viewer): array {
            return [
                'projects_count' => $this->projects->countVisibleTo($viewer),
                'tasks_count' => $this->tasks->countVisibleTo($viewer),
                'tasks_by_status' => $this->tasks->countByStatusVisibleTo($viewer),
                'overdue_tasks_count' => $this->tasks->countOverdueVisibleTo($viewer),
                'top_active_users' => $this->users->topActiveCreators($viewer)
                    ->map(fn (User $user): array => [
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
