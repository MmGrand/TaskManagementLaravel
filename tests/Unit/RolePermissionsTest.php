<?php

use App\Enums\Permission;
use App\Enums\RoleSlug;
use App\Enums\UserStatus;

test('an admin role is granted the wildcard permission', function () {
    expect(RoleSlug::Admin->defaultPermissions())->toBe(['*']);
});

test('a manager may create projects and tasks', function () {
    expect(RoleSlug::Manager->defaultPermissions())
        ->toContain(Permission::ProjectsCreate->value)
        ->toContain(Permission::TasksCreate->value)
        ->toContain(Permission::StatisticsView->value);
});

test('a plain user may not create or delete anything', function () {
    expect(RoleSlug::User->defaultPermissions())
        ->not->toContain(Permission::ProjectsCreate->value)
        ->not->toContain(Permission::TasksCreate->value)
        ->not->toContain(Permission::TasksDelete->value)
        ->not->toContain(Permission::StatisticsView->value)
        ->toContain(Permission::TasksUpdate->value);
});

test('every role slug has a label and permissions', function (RoleSlug $slug) {
    expect($slug->label())->not->toBeEmpty()
        ->and($slug->defaultPermissions())->not->toBeEmpty();
})->with(RoleSlug::cases());

test('only the active status grants access', function () {
    expect(UserStatus::Active->allowsAccess())->toBeTrue()
        ->and(UserStatus::Inactive->allowsAccess())->toBeFalse()
        ->and(UserStatus::Blocked->allowsAccess())->toBeFalse();
});

test('listing roles is an administrator only permission', function () {
    expect(RoleSlug::Manager->defaultPermissions())
        ->not->toContain(Permission::RolesViewAny->value)
        ->and(RoleSlug::User->defaultPermissions())
        ->not->toContain(Permission::RolesViewAny->value)
        ->and(RoleSlug::Admin->defaultPermissions())
        ->toBe(['*']);
});
