<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Task Management') }}</title>

    {{-- Класс темы ставится до загрузки стилей, иначе первый кадр будет светлым. --}}
    <script>
        (function () {
            try {
                var stored = localStorage.getItem('tm.theme');
                var followsSystem = stored !== 'light' && stored !== 'dark';

                if (stored === 'dark' || (followsSystem && matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                }
            } catch (error) {
                // Без доступа к localStorage остаётся светлая тема.
            }
        })();
    </script>

    @fonts
    @vite(['resources/css/app.css', 'resources/js/app.ts'])
</head>
<body class="h-full bg-canvas font-sans text-fg antialiased">
    <div id="app" class="h-full"></div>
</body>
</html>
