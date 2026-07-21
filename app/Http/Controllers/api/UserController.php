<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdateRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', User::class);

        $users = User::with('role')->paginate(15);

        return UserResource::collection($users);
    }

    public function show(User $user)
    {
        $this->authorize('view', $user);

        return UserResource::make($user->load('role'));
    }

    public function update(UpdateRequest $request, User $user)
    {
        $validated = $request->validated();

        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }

            $validated['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $user->update($validated);

        return UserResource::make($user->load('role'));
    }
}
