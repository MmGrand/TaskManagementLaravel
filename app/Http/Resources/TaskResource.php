<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
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
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'project_id' => $this->project_id,
            'assigned_to' => $this->assigned_to,
            'created_by' => $this->created_by,
            'due_date' => $this->due_date?->toDateString(),
            'position' => $this->position,
            'project' => ProjectResource::make($this->whenLoaded('project')),
            'assigned_user' => UserSummaryResource::make($this->whenLoaded('assignedUser')),
            'created_by_user' => UserSummaryResource::make($this->whenLoaded('createdBy')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
