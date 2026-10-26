<?php

namespace App\Http\Requests\User;

use App\Enums\Permission;
use App\Enums\RoleSlug;
use App\Enums\UserStatus;
use App\Rules\PhoneNumber;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class UpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('user'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $managesUsers = $this->user()->hasPermission(Permission::UsersUpdate);
        $editedUser = $this->route('user');

        return [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($this->route('user')->id)],
            'current_password' => $this->changesEmail()
                ? ['required', 'current_password:sanctum']
                : ['nullable'],
            'avatar' => 'nullable|image|max:2048',
            'phone' => ['required', 'string', 'max:20', new PhoneNumber],
            'status' => $managesUsers
                ? ['sometimes', Rule::enum(UserStatus::class), ...$this->keepsOwnValue($editedUser->status->value)]
                : ['prohibited'],
            'role_id' => $managesUsers
                ? ['sometimes', 'integer', $this->grantableRoleRule(), ...$this->keepsOwnValue($editedUser->role_id)]
                : ['prohibited'],
        ];
    }

    /**
     * Nobody may change their own status or role, so an account cannot lock itself out.
     *
     * @return array<int, ValidationRule|string>
     */
    private function keepsOwnValue(int|string|null $current): array
    {
        return $this->user()->is($this->route('user')) ? [Rule::in([$current])] : [];
    }

    private function grantableRoleRule(): Exists
    {
        return Rule::exists('roles', 'id')->when(
            ! $this->user()->isAdmin(),
            fn (Exists $rule) => $rule->whereNot('slug', RoleSlug::Admin->value),
        );
    }

    private function changesEmail(): bool
    {
        $email = $this->input('email');

        return is_string($email) && $email !== $this->route('user')->email;
    }
}
