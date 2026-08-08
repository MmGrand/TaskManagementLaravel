<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;

class StatisticsCache
{
    private const VERSION_KEY = 'statistics.version';

    /**
     * @var array{0: int, 1: int}
     */
    private const FRESH_AND_STALE_SECONDS = [50, 60];

    /**
     * @param  callable(): array<string, mixed>  $summary
     * @return array<string, mixed>
     */
    public function remember(User $viewer, callable $summary): array
    {
        return Cache::flexible($this->key($viewer), self::FRESH_AND_STALE_SECONDS, $summary);
    }

    public function flush(): void
    {
        Cache::forever(self::VERSION_KEY, $this->version() + 1);
    }

    private function key(User $viewer): string
    {
        $scope = $viewer->isAdmin() ? 'global' : "user.{$viewer->id}";

        return "statistics.{$this->version()}.summary.{$scope}";
    }

    private function version(): int
    {
        return (int) Cache::get(self::VERSION_KEY, 1);
    }
}
