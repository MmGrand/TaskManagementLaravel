<?php

namespace App\Http\Controllers\api;

use App\Enums\RoleSlug;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'phone_number' => 'required|string|max:20',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $validated['role_id'] = Role::where('slug', RoleSlug::User->value)->value('id');

        $user = User::create($validated);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => UserResource::make($user->load('role')),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if (! Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['Email or password is incorrect.'],
            ]);
        }

        $user = $request->user();

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => UserResource::make($user->load('role')),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(null, 204);
    }
}
