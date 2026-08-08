<?php

use App\Enums\RoleSlug;
use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

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

test('a user can upload an avatar over a multipart post', function () {
    Storage::fake('public');

    $user = User::factory()->user()->create(['avatar' => null]);

    $response = $this->actingAs($user)->post("/api/users/{$user->id}", [
        '_method' => 'PUT',
        'first_name' => $user->first_name,
        'last_name' => $user->last_name,
        'email' => $user->email,
        'phone' => $user->phone,
        'avatar' => UploadedFile::fake()->image('avatar.jpg'),
    ]);

    $response->assertOk();

    $storedPath = $user->fresh()->avatar;

    expect($storedPath)->toStartWith('avatars/');
    Storage::disk('public')->assertExists($storedPath);

    $response->assertJsonPath('data.avatar', Storage::disk('public')->url($storedPath));
});

test('uploading a new avatar removes the previous file', function () {
    Storage::fake('public');

    $user = User::factory()->user()->create([
        'avatar' => UploadedFile::fake()->image('old.jpg')->store('avatars', 'public'),
    ]);
    $oldPath = $user->avatar;

    $this->actingAs($user)->post("/api/users/{$user->id}", [
        '_method' => 'PUT',
        'first_name' => $user->first_name,
        'last_name' => $user->last_name,
        'email' => $user->email,
        'phone' => $user->phone,
        'avatar' => UploadedFile::fake()->image('new.jpg'),
    ])->assertOk();

    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists($user->fresh()->avatar);
});

test('a non-image avatar is rejected', function () {
    Storage::fake('public');

    $user = User::factory()->user()->create();

    $this->actingAs($user)->post("/api/users/{$user->id}", [
        '_method' => 'PUT',
        'first_name' => $user->first_name,
        'last_name' => $user->last_name,
        'email' => $user->email,
        'phone' => $user->phone,
        'avatar' => UploadedFile::fake()->create('resume.pdf', 100, 'application/pdf'),
    ])->assertUnprocessable()->assertJsonValidationErrors(['avatar']);
});

test('an admin can change the role of a user', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->user()->create();
    $managerRole = Role::where('slug', RoleSlug::Manager->value)->firstOr(
        fn () => Role::factory()->manager()->create(),
    );

    $this->actingAs($admin)->putJson("/api/users/{$user->id}", [
        'first_name' => $user->first_name,
        'last_name' => $user->last_name,
        'email' => $user->email,
        'phone' => $user->phone,
        'role_id' => $managerRole->id,
    ])->assertOk()->assertJsonPath('data.role_id', $managerRole->id);

    expect($user->fresh()->isManager())->toBeTrue();
});

test('a plain user cannot change their own role', function () {
    $user = User::factory()->user()->create();
    $adminRole = Role::factory()->admin()->create();

    $this->actingAs($user)->putJson("/api/users/{$user->id}", [
        'first_name' => $user->first_name,
        'last_name' => $user->last_name,
        'email' => $user->email,
        'phone' => $user->phone,
        'role_id' => $adminRole->id,
    ])->assertUnprocessable()->assertJsonValidationErrors(['role_id']);
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

test('blocking a user revokes their tokens', function () {
    $admin = User::factory()->admin()->create();
    $victim = User::factory()->user()->create();
    $victim->createToken('api');

    $this->actingAs($admin)->putJson("/api/users/{$victim->id}", [
        'first_name' => $victim->first_name,
        'last_name' => $victim->last_name,
        'email' => $victim->email,
        'phone' => $victim->phone,
        'status' => UserStatus::Blocked->value,
    ])->assertOk();

    expect($victim->tokens()->count())->toBe(0);
});

test('users are paginated with a client supplied size', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->count(3)->user()->create();

    $this->actingAs($admin)->getJson('/api/users?per_page=2')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('meta.per_page', 2);
});

test('an out of range user page size fails validation', function (int $perPage) {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->getJson("/api/users?per_page={$perPage}")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['per_page']);
})->with([0, 101]);

test('a user can change their own password with the current one', function () {
    $user = User::factory()->user()->create(['password' => 'old-password']);

    $this->actingAs($user)->putJson("/api/users/{$user->id}/password", [
        'current_password' => 'old-password',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertNoContent();

    expect(Hash::check('new-password', $user->fresh()->password))->toBeTrue();
});

test('changing a password fails without the correct current one', function () {
    $user = User::factory()->user()->create(['password' => 'old-password']);

    $this->actingAs($user)->putJson("/api/users/{$user->id}/password", [
        'current_password' => 'not-my-password',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertUnprocessable()->assertJsonValidationErrors(['current_password']);

    expect(Hash::check('old-password', $user->fresh()->password))->toBeTrue();
});

test('changing a password fails when the confirmation does not match', function () {
    $user = User::factory()->user()->create(['password' => 'old-password']);

    $this->actingAs($user)->putJson("/api/users/{$user->id}/password", [
        'current_password' => 'old-password',
        'password' => 'new-password',
        'password_confirmation' => 'other-password',
    ])->assertUnprocessable()->assertJsonValidationErrors(['password']);
});

test('changing a password revokes every token but the one in use', function () {
    $user = User::factory()->user()->create(['password' => 'old-password']);
    $current = $user->createToken('api');
    $stale = $user->createToken('api');

    $this->withToken($current->plainTextToken)->putJson("/api/users/{$user->id}/password", [
        'current_password' => 'old-password',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertNoContent();

    $this->assertDatabaseMissing('personal_access_tokens', ['id' => $stale->accessToken->getKey()]);
    $this->assertDatabaseHas('personal_access_tokens', ['id' => $current->accessToken->getKey()]);
});

test('nobody else may change a password, not even an admin', function () {
    $admin = User::factory()->admin()->create();
    $victim = User::factory()->user()->create(['password' => 'old-password']);

    $this->actingAs($admin)->putJson("/api/users/{$victim->id}/password", [
        'current_password' => 'password',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertForbidden();
});

test('changing an email requires the current password', function () {
    $user = User::factory()->user()->create(['password' => 'my-password']);

    $payload = [
        'first_name' => $user->first_name,
        'last_name' => $user->last_name,
        'email' => 'moved@example.com',
        'phone' => $user->phone,
    ];

    $this->actingAs($user)->putJson("/api/users/{$user->id}", $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['current_password']);

    $this->actingAs($user)->putJson("/api/users/{$user->id}", [
        ...$payload,
        'current_password' => 'my-password',
    ])->assertOk()->assertJsonPath('data.email', 'moved@example.com');
});

test('keeping the same email needs no password', function () {
    $user = User::factory()->user()->create();

    $this->actingAs($user)->putJson("/api/users/{$user->id}", [
        'first_name' => 'Обновлённое',
        'last_name' => $user->last_name,
        'email' => $user->email,
        'phone' => $user->phone,
    ])->assertOk()->assertJsonPath('data.first_name', 'Обновлённое');
});
