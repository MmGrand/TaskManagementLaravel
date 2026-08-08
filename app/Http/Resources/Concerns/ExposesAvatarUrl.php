<?php

namespace App\Http\Resources\Concerns;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

trait ExposesAvatarUrl
{
    /**
     * Expose the avatar as a URL, whichever way it was stored.
     */
    protected function avatarUrl(): ?string
    {
        if (blank($this->avatar)) {
            return null;
        }

        return Str::isUrl($this->avatar)
            ? $this->avatar
            : Storage::disk('public')->url($this->avatar);
    }
}
