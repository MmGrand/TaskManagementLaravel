<?php

namespace App\Enums;

enum RoleSlug: string
{
    case Admin = 'admin';
    case Manager = 'manager';
    case User = 'user';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Администратор',
            self::Manager => 'Менеджер',
            self::User => 'Пользователь',
        };
    }

    public function defaultPermissions(): array
    {
        $toValues = fn (array $permissions): array => array_map(
            fn (Permission $permission): string => $permission->value,
            $permissions,
        );

        return match ($this) {
            self::Admin => ['*'],
            self::Manager => $toValues([
                Permission::ProjectsViewAny,
                Permission::ProjectsView,
                Permission::ProjectsCreate,
                Permission::ProjectsUpdate,
                Permission::ProjectsDelete,
                Permission::TasksViewAny,
                Permission::TasksView,
                Permission::TasksCreate,
                Permission::TasksUpdate,
                Permission::TasksDelete,
                Permission::UsersViewAssignable,
                Permission::StatisticsView,
            ]),
            self::User => $toValues([
                Permission::ProjectsViewAny,
                Permission::ProjectsView,
                Permission::TasksViewAny,
                Permission::TasksView,
                Permission::TasksUpdate,
            ]),
        };
    }
}
