<?php

namespace App\Services;

use App\Enums\TaskStatus;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class StatisticsService
{
    public function __construct(private readonly StatisticsCache $cache) {}

    /**
     * @return array<string, mixed>
     */
    public function summary(User $viewer): array
    {
        return $this->cache->remember($viewer, function () use ($viewer): array {
            return [
                'projects_count' => Project::query()->visibleTo($viewer)->count(),
                'tasks_count' => Task::query()->visibleTo($viewer)->count(),
                'tasks_by_status' => $this->tasksByStatus($viewer),
                'overdue_tasks_count' => Task::query()->visibleTo($viewer)->overdue()->count(),
                'top_active_users' => $this->topActiveCreators($viewer),
            ];
        });
    }

    /**
     * @return array<string, int>
     */
    private function tasksByStatus(User $viewer): array
    {
        $counts = Task::query()
            ->visibleTo($viewer)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return collect(TaskStatus::cases())
            ->mapWithKeys(fn (TaskStatus $status) => [
                $status->value => (int) ($counts[$status->value] ?? 0),
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function topActiveCreators(User $viewer, int $limit = 5): array
    {
        $visibleTasks = fn (Builder $tasks): Builder => $tasks->visibleTo($viewer);

        return User::query()
            ->withCount(['createdTasks' => $visibleTasks])
            ->whereHas('createdTasks', $visibleTasks)
            ->orderByDesc('created_tasks_count')
            ->orderBy('id')
            ->limit($limit)
            ->get()
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'tasks_created_count' => $user->created_tasks_count,
            ])
            ->values()
            ->all();
    }
}
