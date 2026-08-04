<?php

namespace Database\Factories;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Services\TaskPositionService;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    private static int $nextPosition = 0;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'status' => fake()->randomElement(TaskStatus::cases()),
            'priority' => fake()->randomElement(TaskPriority::cases()),
            'project_id' => Project::factory(),
            'assigned_to' => User::factory(),
            'created_by' => User::factory(),
            'due_date' => fake()->dateTimeBetween('now', '+1 year'),
            'position' => self::$nextPosition += TaskPositionService::STEP,
        ];
    }

    public function withStatus(TaskStatus $status): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => $status,
        ]);
    }

    /**
     * A task whose deadline has already passed and that is still not finished.
     */
    public function overdue(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => fake()->randomElement([TaskStatus::Pending, TaskStatus::InProgress]),
            'due_date' => fake()->dateTimeBetween('-1 year', '-1 day'),
        ]);
    }
}
