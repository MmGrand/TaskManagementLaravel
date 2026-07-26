<?php

namespace Database\Factories;

use App\Enums\RoleSlug;
use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'avatar' => fake()->imageUrl(640, 480, 'people'),
            'status' => UserStatus::Active,
            'phone' => fake()->phoneNumber(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function withStatus(UserStatus $status): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => $status,
        ]);
    }

    public function inactive(): static
    {
        return $this->withStatus(UserStatus::Inactive);
    }

    public function blocked(): static
    {
        return $this->withStatus(UserStatus::Blocked);
    }

    /**
     * Assign one of the application's predefined roles to the user,
     * reusing an existing role with that slug when available.
     */
    public function withRole(RoleSlug $slug): static
    {
        return $this->state(fn (array $attributes): array => [
            'role_id' => Role::where('slug', $slug->value)->first()
                ?? Role::factory()->forSlug($slug),
        ]);
    }

    public function admin(): static
    {
        return $this->withRole(RoleSlug::Admin);
    }

    public function manager(): static
    {
        return $this->withRole(RoleSlug::Manager);
    }

    public function user(): static
    {
        return $this->withRole(RoleSlug::User);
    }
}
