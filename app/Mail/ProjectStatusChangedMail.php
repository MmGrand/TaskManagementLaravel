<?php

namespace App\Mail;

use App\Models\Project;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProjectStatusChangedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Project $project,
        public string $previousStatus,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Изменён статус проекта: {$this->project->name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.projects.status-changed',
        );
    }
}
