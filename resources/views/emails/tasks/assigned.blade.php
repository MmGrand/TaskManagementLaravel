<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8">
</head>
<body style="font-family: sans-serif; color: #1f2937;">
    <p>Здравствуйте, {{ $task->assignedUser->first_name }}!</p>

    <p>Вам назначена новая задача:</p>

    <table cellpadding="4" style="border-collapse: collapse;">
        <tr>
            <td><strong>Задача:</strong></td>
            <td>{{ $task->title }}</td>
        </tr>
        <tr>
            <td><strong>Проект:</strong></td>
            <td>{{ $task->project->name }}</td>
        </tr>
        <tr>
            <td><strong>Приоритет:</strong></td>
            <td>{{ $task->priority }}</td>
        </tr>
        @if ($task->due_date)
            <tr>
                <td><strong>Срок:</strong></td>
                <td>{{ \Illuminate\Support\Carbon::parse($task->due_date)->format('d.m.Y') }}</td>
            </tr>
        @endif
    </table>

    <p>Описание: {{ $task->description ?: '—' }}</p>
</body>
</html>
