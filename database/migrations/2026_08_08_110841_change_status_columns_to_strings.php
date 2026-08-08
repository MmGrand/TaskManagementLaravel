<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Набор значений задают PHP-энамы и валидация, поэтому колонке достаточно быть
     * строкой: новый статус не должен требовать смены типа колонки.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('status')->default('active')->change();
        });

        Schema::table('projects', function (Blueprint $table): void {
            $table->string('status')->default('active')->change();
        });

        Schema::table('tasks', function (Blueprint $table): void {
            $table->string('status')->default('pending')->change();
            $table->string('priority')->default('medium')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->enum('status', ['active', 'inactive', 'blocked'])->default('active')->change();
        });

        Schema::table('projects', function (Blueprint $table): void {
            $table->enum('status', ['active', 'completed', 'archived'])->default('active')->change();
        });

        Schema::table('tasks', function (Blueprint $table): void {
            $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending')->change();
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium')->change();
        });
    }
};
