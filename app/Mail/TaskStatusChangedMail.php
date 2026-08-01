<?php

namespace App\Mail;

use App\Enums\TaskStatus;
use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TaskStatusChangedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Task $task,
        public TaskStatus $previousStatus,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Изменён статус задачи: {$this->task->title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.tasks.status-changed',
        );
    }
}
