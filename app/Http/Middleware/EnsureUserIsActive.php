<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->status->allowsAccess()) {
            return response()->json([
                'message' => "Аккаунт недоступен: {$user->status->label()}.",
            ], 403);
        }

        return $next($request);
    }
}
