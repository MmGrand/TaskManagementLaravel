<?php

namespace App\Enums;

enum UserStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Blocked = 'blocked';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Активен',
            self::Inactive => 'Неактивен',
            self::Blocked => 'Заблокирован',
        };
    }

    public function allowsAccess(): bool
    {
        return $this === self::Active;
    }
}
