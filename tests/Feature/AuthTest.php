<?php

use App\Models\User;

test('a user can register', function () {
    $response = $this->postJson('/api/register', [
        'first_name' => 'Ivan',
        'last_name' => 'Petrov',
        'email' => 'ivan@example.com',
        'phone_number' => '+79991234567',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertCreated()
        ->assertJsonPath('user.email', 'ivan@example.com')
        ->assertJsonStructure(['user', 'token']);

    $this->assertDatabaseHas('users', ['email' => 'ivan@example.com']);
});

test('registration fails validation with missing fields', function () {
    $response = $this->postJson('/api/register', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['first_name', 'last_name', 'email', 'phone_number', 'password']);
});

test('a user can login with correct credentials', function () {
    $user = User::factory()->user()->create();

    $response = $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertOk()->assertJsonStructure(['user', 'token']);
});

test('login fails with incorrect credentials', function () {
    $user = User::factory()->user()->create();

    $response = $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertUnprocessable();
});

test('a user can logout', function () {
    $user = User::factory()->user()->create();
    $token = $user->createToken('api')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")->postJson('/api/logout');

    $response->assertNoContent();
});
