<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Task Management') }}</title>

    @fonts
    @vite(['resources/css/app.css', 'resources/js/app.ts'])
</head>
<body class="h-full bg-gray-50 font-sans text-gray-900 antialiased">
    <div id="app" class="h-full"></div>
</body>
</html>
