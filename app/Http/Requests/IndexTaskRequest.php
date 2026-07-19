<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class IndexTaskRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => 'nullable|in:pending,in_progress,completed',
            'priority' => 'nullable|in:low,medium,high',
            'project_id' => 'nullable|integer|exists:projects,id',
            'assigned_to' => 'nullable|integer|exists:users,id',
            'sort_by' => 'nullable|in:created_at,due_date',
            'sort_direction' => 'nullable|in:asc,desc',
        ];
    }
}
