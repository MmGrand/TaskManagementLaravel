<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index() {
        $users = User::with('role')->get();

        return response()->json($users);
    }

    public function show(User $user) {
        return response()->json($user);
    }

    public function update(Request $request, User $user) {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'avatar' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|max:20',
            'role_id' => 'required|exists:roles,id',
        ]);

        $user->update($validated);

        return response()->json($user);
    }
}
