<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\IndexRequest;
use App\Http\Requests\User\UpdatePasswordRequest;
use App\Http\Requests\User\UpdateRequest;
use App\Http\Resources\AssignableUserResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Laravel\Sanctum\PersonalAccessToken;

class UserController extends Controller
{
    public function __construct(private readonly UserService $users) {}

    public function index(IndexRequest $request)
    {
        $this->authorize('viewAny', User::class);

        return UserResource::collection($this->users->list($request->integer('per_page') ?: null));
    }

    public function assignable(IndexRequest $request)
    {
        $this->authorize('viewAssignable', User::class);

        return AssignableUserResource::collection($this->users->assignable($request->integer('per_page') ?: null));
    }

    public function show(User $user)
    {
        $this->authorize('view', $user);

        return UserResource::make($user->load('role'));
    }

    public function update(UpdateRequest $request, User $user)
    {
        $user = $this->users->update($user, $request->safe()->except('current_password'), $request->file('avatar'));

        return UserResource::make($user->load('role'));
    }

    public function updatePassword(UpdatePasswordRequest $request, User $user): JsonResponse
    {
        $token = $request->user()->currentAccessToken();

        $this->users->updatePassword(
            $user,
            $request->string('password')->value(),
            $token instanceof PersonalAccessToken ? $token->getKey() : null,
        );

        return response()->json(null, 204);
    }
}
