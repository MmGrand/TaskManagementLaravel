<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\JsonResponse;
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

        if ($user instanceof User && ($reason = $this->lockoutReason($user)) !== null) {
            return $this->deny($reason);
        }

        return $next($request);
    }

    /**
     * Anything that leaves the account unusable, so the client hears why instead of
     * collecting a 403 on every request it tries.
     */
    private function lockoutReason(User $user): ?string
    {
        return match (true) {
            ! $user->status->allowsAccess() => $user->status->label(),
            $user->role === null => 'роль не назначена',
            ! $user->role->is_active => 'роль отключена',
            default => null,
        };
    }

    private function deny(string $reason): JsonResponse
    {
        return response()->json(['message' => "Аккаунт недоступен: {$reason}."], 403);
    }
}
