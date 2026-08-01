<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Services\StatisticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatisticsController extends Controller
{
    public function __construct(private readonly StatisticsService $statistics) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewStatistics');

        return response()->json($this->statistics->summary($request->user()));
    }
}
