import { createRouter, createWebHistory } from 'vue-router';
import { registerGuards } from '@/router/guards';
import { routes } from '@/router/routes';

const router = createRouter({
    history: createWebHistory(),
    routes,
});

registerGuards(router);

export { routes };
export default router;
