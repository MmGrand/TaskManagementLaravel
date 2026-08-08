<?php

namespace App\Jobs\Notifications;

use App\Enums\ProjectStatus;
use App\Mail\ProjectStatusChangedMail;
use App\Models\Project;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Attributes\DeleteWhenMissingModels;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Mail;

#[DeleteWhenMissingModels]
class ProjectStatusChanged implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Project $project,
        public ProjectStatus $previousStatus,
    ) {}

    public function handle(): void
    {
        foreach ($this->recipients() as $recipient) {
            Mail::to($recipient->email)->send(new ProjectStatusChangedMail($this->project, $this->previousStatus));
        }
    }

    /**
     * @return Collection<int, User>
     */
    private function recipients(): Collection
    {
        $assignees = User::query()
            ->whereHas('assignedTasks', fn ($tasks) => $tasks->where('project_id', $this->project->id))
            ->get();

        return $assignees
            ->push($this->project->creator)
            ->filter()
            ->unique('email')
            ->values();
    }
}
