<?php

namespace Database\Seeders;

use App\Enums\RoleSlug;
use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (RoleSlug::cases() as $slug) {
            Role::updateOrCreate(
                ['slug' => $slug->value],
                [
                    'name' => $slug->label(),
                    'permissions' => $slug->defaultPermissions(),
                    'is_active' => true,
                ],
            );
        }
    }
}
