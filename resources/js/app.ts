import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '@/App.vue';
import router from '@/router';
import { bootstrapLocale, i18n } from '@/i18n';

// Язык выбирается до монтирования, чтобы первый кадр не был на чужой локали.
void bootstrapLocale().then(() => {
    createApp(App).use(createPinia()).use(i18n).use(router).mount('#app');
});
