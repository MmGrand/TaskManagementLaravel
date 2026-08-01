<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8">
</head>
<body style="font-family: sans-serif; color: #1f2937;">
    <p>Здравствуйте!</p>

    <p>Статус задачи изменился:</p>

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
            <td><strong>Было:</strong></td>
            <td>{{ $previousStatus->label() }}</td>
        </tr>
        <tr>
            <td><strong>Стало:</strong></td>
            <td>{{ $task->status->label() }}</td>
        </tr>
    </table>
</body>
</html>
