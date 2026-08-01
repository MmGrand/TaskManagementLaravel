<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'status' => $this->status,
            'avatar' => $this->avatarUrl(),
            'phone' => $this->phone,
            'role_id' => $this->role_id,
            'role' => RoleResource::make($this->whenLoaded('role')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /**
     * Expose the avatar as a URL, whichever way it was stored.
     */
    private function avatarUrl(): ?string
    {
        if (blank($this->avatar)) {
            return null;
        }

        return Str::isUrl($this->avatar)
            ? $this->avatar
            : Storage::disk('public')->url($this->avatar);
    }
}
