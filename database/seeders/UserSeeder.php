<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::factory()->admin()->create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@example.com',
        ]);

        foreach ([1, 2] as $number) {
            User::factory()->manager()->create([
                'first_name' => 'Manager',
                'last_name' => (string) $number,
                'email' => "manager{$number}@example.com",
            ]);
        }

        foreach (range(1, 5) as $number) {
            User::factory()->user()->create([
                'first_name' => 'User',
                'last_name' => (string) $number,
                'email' => "user{$number}@example.com",
            ]);
        }
    }
}
