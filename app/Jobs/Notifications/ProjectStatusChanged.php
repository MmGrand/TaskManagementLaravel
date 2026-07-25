<?php

namespace App\Jobs\Notifications;

use App\Mail\ProjectStatusChangedMail;
use App\Models\Project;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class ProjectStatusChanged implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Project $project,
        public string $previousStatus,
    ) {}

    public function handle(): void
    {
        Mail::to($this->project->creator->email)->send(new ProjectStatusChangedMail($this->project, $this->previousStatus));
    }
}
