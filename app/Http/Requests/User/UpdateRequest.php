<?php

namespace App\Http\Requests\User;

use App\Enums\Permission;
use App\Enums\UserStatus;
use App\Rules\PhoneNumber;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
                ? ['sometimes', Rule::enum(UserStatus::class)]
                : ['prohibited'],
            'role_id' => $managesUsers
                ? ['sometimes', 'integer', 'exists:roles,id']
                : ['prohibited'],
        ];
    }

    private function changesEmail(): bool
    {
        $email = $this->input('email');

        return is_string($email) && $email !== $this->route('user')->email;
    }
}
