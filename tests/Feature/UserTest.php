<?php

use App\Models\User;

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
        'phone_number' => $user->phone_number,
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
        'phone_number' => $other->phone_number,
    ]);

    $response->assertForbidden();
});

test('updating a profile fails validation with an invalid email', function () {
    $user = User::factory()->user()->create();

    $response = $this->actingAs($user)->putJson("/api/users/{$user->id}", [
        'first_name' => $user->first_name,
        'last_name' => $user->last_name,
        'email' => 'not-an-email',
        'phone_number' => $user->phone_number,
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors(['email']);
});
