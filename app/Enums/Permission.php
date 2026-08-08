<?php

namespace App\Enums;

enum Permission: string
{
    case ProjectsViewAny = 'projects.viewAny';
    case ProjectsView = 'projects.view';
    case ProjectsCreate = 'projects.create';
    case ProjectsUpdate = 'projects.update';
    case ProjectsDelete = 'projects.delete';

    case TasksViewAny = 'tasks.viewAny';
    case TasksView = 'tasks.view';
    case TasksCreate = 'tasks.create';
    case TasksUpdate = 'tasks.update';
    case TasksDelete = 'tasks.delete';

    case UsersViewAny = 'users.viewAny';
    case UsersView = 'users.view';
    case UsersUpdate = 'users.update';

    case RolesViewAny = 'roles.viewAny';

    case StatisticsView = 'statistics.view';
}
