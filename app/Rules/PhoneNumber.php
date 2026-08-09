<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

/**
 * Телефон в формате E.164: код страны не начинается с нуля, всего 8–15 цифр.
 * Клиент приводит номер к этому виду сам.
 *
 * @see resources/js/utils/phone.ts
 */
class PhoneNumber implements ValidationRule
{
    private const PATTERN = '/^\+[1-9]\d{7,14}$/';

    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || preg_match(self::PATTERN, $value) !== 1) {
            $fail('The :attribute field must be in international format, for example +79991234567.');
        }
    }
}
