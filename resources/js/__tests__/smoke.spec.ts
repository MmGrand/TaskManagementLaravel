import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { createMemoryHistory, createRouter } from 'vue-router';
import App from '@/App.vue';
import { routes } from '@/router/routes';
import { makeUser } from '@/tests/fixtures';

vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));

describe('application shell', () => {
    it('renders the routed view through the alias and the SFC compiler', async () => {
        const router = createRouter({ history: createMemoryHistory(), routes });

        await router.push('/');
        await router.isReady();

        const wrapper = mount(App, {
            global: {
                plugins: [
                    createTestingPinia({
                        createSpy: vi.fn,
                        initialState: { auth: { token: 'tok', user: makeUser(), bootstrapped: true } },
                    }),
                    router,
                ],
            },
        });
        await flushPromises();

        expect(wrapper.text()).toContain('Task Management');
    });
});
