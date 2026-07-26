<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('name', 'first_name');

            $table->string('last_name')->after('first_name');
            $table->enum('status', ['active', 'inactive', 'blocked'])->default('active')->after('email');
            $table->string('avatar')->nullable()->after('status');
            $table->string('phone')->after('avatar');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('first_name', 'name');
            $table->dropColumn(['last_name', 'status', 'avatar', 'phone']);
        });
    }
};
