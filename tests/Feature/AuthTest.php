<?php

use App\Enums\RoleSlug;
use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;

test('a user can register and receives the user role', function () {
    $this->seed(RoleSeeder::class);

    $response = $this->postJson('/api/register', [
        'first_name' => 'Ivan',
        'last_name' => 'Petrov',
        'email' => 'ivan@example.com',
        'phone' => '+79991234567',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertCreated()
        ->assertJsonPath('user.email', 'ivan@example.com')
        ->assertJsonPath('user.role.slug', RoleSlug::User->value)
        ->assertJsonPath('user.status', UserStatus::Active->value)
        ->assertJsonStructure(['user', 'token']);

    $this->assertDatabaseHas('users', ['email' => 'ivan@example.com']);
});

test('registration fails validation with missing fields', function () {
    $response = $this->postJson('/api/register', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['first_name', 'last_name', 'email', 'phone', 'password']);
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

test('a blocked user cannot login', function () {
    $user = User::factory()->user()->blocked()->create();

    $response = $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors(['email']);
});

test('an inactive user cannot login', function () {
    $user = User::factory()->user()->inactive()->create();

    $response = $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors(['email']);
});

test('blocking a user invalidates their existing token', function () {
    $user = User::factory()->user()->create();
    $token = $user->createToken('api')->plainTextToken;

    $user->update(['status' => UserStatus::Blocked]);

    $response = $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/tasks');

    $response->assertForbidden();
});

test('a user can logout', function () {
    $user = User::factory()->user()->create();
    $token = $user->createToken('api')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")->postJson('/api/logout');

    $response->assertNoContent();
});

test('the current user endpoint returns the enveloped user with their role', function () {
    $user = User::factory()->manager()->create();

    $this->actingAs($user)->getJson('/api/user')
        ->assertOk()
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('data.role.slug', 'manager')
        ->assertJsonMissingPath('data.password');
});

test('a user without a role is told why the account is unusable', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->getJson('/api/user')
        ->assertForbidden()
        ->assertJsonPath('message', 'Аккаунт недоступен: роль не назначена.');
});

test('a user whose role was switched off is told why', function () {
    $role = Role::factory()->create(['is_active' => false]);
    $user = User::factory()->create(['role_id' => $role->id]);

    $this->actingAs($user)->getJson('/api/user')
        ->assertForbidden()
        ->assertJsonPath('message', 'Аккаунт недоступен: роль отключена.');
});
