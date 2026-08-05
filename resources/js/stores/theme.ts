import { computed, ref, watchEffect } from 'vue';
import { defineStore } from 'pinia';
import {
    applyTheme,
    detectTheme,
    prefersDark,
    THEME_MODES,
    type ThemeMode,
    watchSystemTheme,
    writeStoredTheme,
} from '@/utils/theme';

export const useThemeStore = defineStore('theme', () => {
    const mode = ref<ThemeMode>(detectTheme());
    const systemDark = ref(prefersDark());
    const available = THEME_MODES;

    const isDark = computed(() => mode.value === 'dark' || (mode.value === 'system' && systemDark.value));

    watchSystemTheme((dark) => {
        systemDark.value = dark;
    });

    // Первый кадр уже покрыт скриптом из app.blade.php, здесь только синхронизация после старта.
    watchEffect(() => {
        applyTheme(isDark.value);
    });

    function set(next: ThemeMode): void {
        mode.value = next;
        writeStoredTheme(next);
    }

    return { mode, isDark, available, set };
});
