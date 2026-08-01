<?php

namespace App\Http\Requests\Task;

use App\Http\Requests\Concerns\AuthorizesTaskProject;
use App\Http\Requests\Concerns\ProvidesTaskRules;
use App\Models\Task;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreRequest extends FormRequest
{
    use AuthorizesTaskProject, ProvidesTaskRules;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', Task::class)
            && $this->mayUseSubmittedProject();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->manageableTaskRules();
    }
}
