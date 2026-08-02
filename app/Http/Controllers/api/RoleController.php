<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RoleResource;
use App\Models\Role;
use App\Services\RoleService;

class RoleController extends Controller
{
    public function __construct(private readonly RoleService $roles) {}

    public function index()
    {
        $this->authorize('viewAny', Role::class);

        return RoleResource::collection($this->roles->list());
    }
}
