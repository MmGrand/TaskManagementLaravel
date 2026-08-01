<?php

namespace App\Http\Requests\Task;

use App\Http\Requests\Concerns\AuthorizesTaskProject;
use App\Http\Requests\Concerns\ProvidesTaskRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateRequest extends FormRequest
{
    use AuthorizesTaskProject, ProvidesTaskRules;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        if (! $this->user()->can('update', $this->route('task'))) {
            return false;
        }

        return ! $this->route('task')->isManageableBy($this->user())
            || $this->mayUseSubmittedProject();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->route('task')->isManageableBy($this->user())
            ? $this->manageableTaskRules()
            : $this->assigneeTaskRules();
    }
}
