<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Rules\PhoneNumber;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $auth) {}

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'phone' => ['required', 'string', 'max:20', new PhoneNumber],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ]);

        ['user' => $user, 'token' => $token] = $this->auth->register($validated);

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

        ['user' => $user, 'token' => $token] = $this->auth->login($credentials);

        return response()->json([
            'user' => UserResource::make($user->load('role')),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->auth->logout($request->user());

        return response()->json(null, 204);
    }
}
