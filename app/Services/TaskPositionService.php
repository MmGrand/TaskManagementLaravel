<?php

namespace App\Services;

use App\Models\Task;
use App\Repositories\Contracts\TaskRepository;

class TaskPositionService
{
    public const STEP = 1000;

    public function __construct(private readonly TaskRepository $tasks) {}

    public function next(): int
    {
        return $this->tasks->maxPosition() + self::STEP;
    }

    public function between(?Task $after, ?Task $before): int
    {
        if ($before === null) {
            return ($after?->position ?? $this->tasks->maxPosition()) + self::STEP;
        }

        if ($after === null) {
            return $before->position - self::STEP;
        }

        $candidate = intdiv($after->position + $before->position, 2);

        if ($candidate > $after->position && $candidate < $before->position) {
            return $candidate;
        }

        $this->tasks->shiftPositionsFrom($before->position, self::STEP);

        return $after->position + intdiv(self::STEP, 2);
    }
}
