<?php

namespace App\Jobs\Notifications;

use App\Mail\TaskAssignedMail;
use App\Models\Task;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Attributes\DeleteWhenMissingModels;
use Illuminate\Support\Facades\Mail;

#[DeleteWhenMissingModels]
class TaskAssigned implements ShouldQueue
{
    use Queueable;

    public function __construct(public Task $task) {}

    public function handle(): void
    {
        Mail::to($this->task->assignedUser->email)->send(new TaskAssignedMail($this->task));
    }
}
