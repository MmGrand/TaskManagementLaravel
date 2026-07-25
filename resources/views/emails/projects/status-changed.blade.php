<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8">
</head>
<body style="font-family: sans-serif; color: #1f2937;">
    <p>Здравствуйте!</p>

    <p>Статус вашего проекта изменился:</p>

    <table cellpadding="4" style="border-collapse: collapse;">
        <tr>
            <td><strong>Проект:</strong></td>
            <td>{{ $project->name }}</td>
        </tr>
        <tr>
            <td><strong>Было:</strong></td>
            <td>{{ $previousStatus }}</td>
        </tr>
        <tr>
            <td><strong>Стало:</strong></td>
            <td>{{ $project->status }}</td>
        </tr>
    </table>
</body>
</html>
