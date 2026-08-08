<?php

namespace App\Jobs\Notifications;

use App\Enums\TaskStatus;
use App\Mail\TaskStatusChangedMail;
use App\Models\Task;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Attributes\DeleteWhenMissingModels;
use Illuminate\Support\Facades\Mail;

#[DeleteWhenMissingModels]
class TaskStatusChanged implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Task $task,
        public TaskStatus $previousStatus,
    ) {}

    public function handle(): void
    {
        $recipients = collect([$this->task->createdBy, $this->task->assignedUser])
            ->unique('email');

        foreach ($recipients as $recipient) {
            Mail::to($recipient->email)->send(new TaskStatusChangedMail($this->task, $this->previousStatus));
        }
    }
}
