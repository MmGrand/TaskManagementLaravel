<?php

use App\Enums\ProjectStatus;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\UserStatus;

test('every status case carries a label', function (BackedEnum $case) {
    expect($case->label())->toBeString()->not->toBeEmpty();
})->with([
    ...ProjectStatus::cases(),
    ...TaskStatus::cases(),
    ...TaskPriority::cases(),
    ...UserStatus::cases(),
]);

test('values mirror the cases of the enum', function (string $enum) {
    expect($enum::values())->toBe(array_map(
        fn (BackedEnum $case): string => $case->value,
        $enum::cases(),
    ));
})->with([
    ProjectStatus::class,
    TaskStatus::class,
    TaskPriority::class,
    UserStatus::class,
]);

test('the columns of the database accept every case', function () {
    expect(ProjectStatus::values())->toBe(['active', 'completed', 'archived'])
        ->and(TaskStatus::values())->toBe(['pending', 'in_progress', 'completed'])
        ->and(TaskPriority::values())->toBe(['low', 'medium', 'high'])
        ->and(UserStatus::values())->toBe(['active', 'inactive', 'blocked']);
});
