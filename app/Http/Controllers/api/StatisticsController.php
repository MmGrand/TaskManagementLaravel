<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Services\StatisticsService;

class StatisticsController extends Controller
{
    public function __construct(private readonly StatisticsService $statistics) {}

    public function index()
    {
        $this->authorize('viewStatistics');

        return response()->json($this->statistics->summary());
    }
}
