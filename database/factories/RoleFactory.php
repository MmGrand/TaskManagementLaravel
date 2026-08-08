<?php

namespace Database\Factories;

use App\Enums\RoleSlug;
use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Role>
 */
class RoleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->word();

        return [
            'slug' => Str::slug($name),
            'name' => $name,
            'is_active' => fake()->boolean(),
        ];
    }

    /**
     * Configure the role for one of the application's predefined slugs.
     */
    public function forSlug(RoleSlug $slug): static
    {
        return $this->state(fn (array $attributes): array => [
            'slug' => $slug->value,
            'name' => $slug->label(),
            'permissions' => $slug->defaultPermissions(),
            'is_active' => true,
        ]);
    }

    public function admin(): static
    {
        return $this->forSlug(RoleSlug::Admin);
    }

    public function manager(): static
    {
        return $this->forSlug(RoleSlug::Manager);
    }

    public function user(): static
    {
        return $this->forSlug(RoleSlug::User);
    }
}
