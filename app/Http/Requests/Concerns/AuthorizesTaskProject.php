<?php

namespace App\Http\Requests\Concerns;

use App\Models\Project;

trait AuthorizesTaskProject
{
    protected function mayUseSubmittedProject(): bool
    {
        $projectId = $this->input('project_id');

        if (blank($projectId)) {
            return true;
        }

        $project = Project::find($projectId);

        return $project === null || $this->user()->can('addTask', $project);
    }
}
