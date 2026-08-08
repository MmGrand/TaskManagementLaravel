<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\IndexRequest;
use App\Http\Requests\User\UpdateRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;

class UserController extends Controller
{
    public function __construct(private readonly UserService $users) {}

    public function index(IndexRequest $request)
    {
        $this->authorize('viewAny', User::class);

        return UserResource::collection($this->users->list($request->integer('per_page') ?: null));
    }

    public function show(User $user)
    {
        $this->authorize('view', $user);

        return UserResource::make($user->load('role'));
    }

    public function update(UpdateRequest $request, User $user)
    {
        $user = $this->users->update($user, $request->validated(), $request->file('avatar'));

        return UserResource::make($user->load('role'));
    }
}
