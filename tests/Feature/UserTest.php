<?php

use App\Enums\UserStatus;
use App\Models\User;

test('an admin can block a user', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->user()->create();

    $response = $this->actingAs($admin)->putJson("/api/users/{$user->id}", [
        'first_name' => $user->first_name,
        'last_name' => $user->last_name,
        'email' => $user->email,
        'phone' => $user->phone,
        'status' => UserStatus::Blocked->value,
    ]);

    $response->assertOk()->assertJsonPath('data.status', UserStatus::Blocked->value);

    expect($user->fresh()->status)->toBe(UserStatus::Blocked);
});

test('a plain user cannot change their own status', function () {
    $user = User::factory()->user()->create();

    $response = $this->actingAs($user)->putJson("/api/users/{$user->id}", [
        'first_name' => $user->first_name,
        'last_name' => $user->last_name,
        'email' => $user->email,
        'phone' => $user->phone,
        'status' => UserStatus::Active->value,
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors(['status']);
});

test('a manager can list users', function () {
    $manager = User::factory()->manager()->create();
    User::factory()->user()->create();

    $response = $this->actingAs($manager)->getJson('/api/users');

    $response->assertOk()->assertJsonStructure(['data']);
});

test('a plain user cannot list users', function () {
    $user = User::factory()->user()->create();

    $response = $this->actingAs($user)->getJson('/api/users');

    $response->assertForbidden();
});

test('a user can update their own profile', function () {
    $user = User::factory()->user()->create();

    $response = $this->actingAs($user)->putJson("/api/users/{$user->id}", [
        'first_name' => 'Updated',
        'last_name' => $user->last_name,
        'email' => $user->email,
        'phone' => $user->phone,
    ]);

    $response->assertOk()->assertJsonPath('data.first_name', 'Updated');
});

test('a plain user cannot update someone else\'s profile', function () {
    $user = User::factory()->user()->create();
    $other = User::factory()->user()->create();

    $response = $this->actingAs($user)->putJson("/api/users/{$other->id}", [
        'first_name' => 'Hacked',
        'last_name' => $other->last_name,
        'email' => $other->email,
        'phone' => $other->phone,
    ]);

    $response->assertForbidden();
});

test('updating a profile fails validation with an invalid email', function () {
    $user = User::factory()->user()->create();

    $response = $this->actingAs($user)->putJson("/api/users/{$user->id}", [
        'first_name' => $user->first_name,
        'last_name' => $user->last_name,
        'email' => 'not-an-email',
        'phone' => $user->phone,
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors(['email']);
});
