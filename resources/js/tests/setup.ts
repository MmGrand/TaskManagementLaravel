import { beforeEach } from 'vitest';
import { config } from '@vue/test-utils';
import { i18n, setLocaleSync } from '@/i18n';

/**
 * Плагин ставится глобально, чтобы каждый спек не перечислял его сам.
 * @vue/test-utils конкатенирует config.global.plugins с global.plugins из
 * mount(), так что createTestingPinia в спеках продолжает работать.
 */
config.global.plugins.push(i18n);

/**
 * Локаль прибита явно: в jsdom navigator.language === 'en-US', и автоопределение
 * выбрало бы английский, уронив все ассерты на русский текст. beforeEach
 * защищает от протечки локали из теста переключения языка.
 */
setLocaleSync('ru');

beforeEach(() => {
    setLocaleSync('ru');
});
