<?php

namespace App\Services;

use App\Models\Task;

class TaskPositionService
{
    public const STEP = 1000;

    public function next(): int
    {
        return $this->maxPosition() + self::STEP;
    }

    public function between(?Task $after, ?Task $before): int
    {
        if ($before === null) {
            return ($after?->position ?? $this->maxPosition()) + self::STEP;
        }

        if ($after === null) {
            return $before->position - self::STEP;
        }

        $candidate = intdiv($after->position + $before->position, 2);

        if ($candidate > $after->position && $candidate < $before->position) {
            return $candidate;
        }

        $this->shiftPositionsFrom($before->position, self::STEP);

        return $after->position + intdiv(self::STEP, 2);
    }

    private function maxPosition(): int
    {
        return (int) Task::query()->max('position');
    }

    private function shiftPositionsFrom(int $position, int $step): void
    {
        Task::withoutTimestamps(fn () => Task::query()
            ->where('position', '>=', $position)
            ->increment('position', $step));
    }
}
