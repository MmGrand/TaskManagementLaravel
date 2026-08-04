<?php

namespace App\Http\Requests\Task;

use App\Http\Requests\Concerns\ProvidesTaskRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class MoveRequest extends FormRequest
{
    use ProvidesTaskRules;

    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('task'));
    }

    protected function prepareForValidation(): void
    {
        $this->replace(array_filter(
            $this->all(),
            fn (mixed $value, string $key): bool => ! (
                in_array($key, ['after_task_id', 'before_task_id'], true) && $value === null
            ),
            ARRAY_FILTER_USE_BOTH,
        ));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $task = $this->route('task');

        return $this->moveTaskRules($task->isManageableBy($this->user()), $task->getKey());
    }
}
