<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Разреженный глобальный ранг карточки на доске: одно число упорядочивает
     * задачу внутри любой колонки, в какой бы группировке доска ни находилась.
     *
     * Столбец знаковый: перенос карточки в самый верх считает `position - STEP`
     * и должен уметь уходить в минус неограниченно.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->bigInteger('position')->default(0)->after('due_date');

            $table->index('position');
        });

        DB::table('tasks')->update(['position' => DB::raw('id * 1000')]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropIndex(['position']);
            $table->dropColumn('position');
        });
    }
};
