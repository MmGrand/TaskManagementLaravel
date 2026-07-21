<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\UserRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;

class UserService
{
    public function __construct(private readonly UserRepository $users) {}

    public function list(): LengthAwarePaginator
    {
        return $this->users->paginate();
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(User $user, array $attributes, ?UploadedFile $avatar = null): User
    {
        if ($avatar) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }

            $attributes['avatar'] = $avatar->store('avatars', 'public');
        }

        return $this->users->update($user, $attributes);
    }
}
