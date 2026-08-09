import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import * as usersApi from '@/api/users';
import * as rolesApi from '@/api/roles';
import ProfileView from '@/views/users/ProfileView.vue';
import { useAuthStore } from '@/stores/auth';
import { comboboxes } from '@/tests/ui';
import { makeRole, makeUser } from '@/tests/fixtures';
import type { RoleSlug } from '@/types/enums';

const routeQuery: Record<string, string> = {};
const routerReplace = vi.fn();

vi.mock('vue-router', () => ({
    useRoute: () => ({ query: routeQuery }),
    useRouter: () => ({ push: vi.fn(), replace: routerReplace }),
}));
vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));
vi.mock('@/api/users');
vi.mock('@/api/roles');

async function mountAs(slug: RoleSlug, id = 1) {
    const wrapper = mount(ProfileView, {
        global: {
            plugins: [
                createTestingPinia({
                    createSpy: vi.fn,
                    stubActions: false,
                    initialState: { auth: { token: 'tok', user: makeUser({ id, role: makeRole(slug) }) } },
                }),
            ],
        },
    });

    await flushPromises();

    return { wrapper, auth: useAuthStore() };
}

beforeEach(() => {
    vi.resetAllMocks();
    window.localStorage.clear();
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
    for (const key of Object.keys(routeQuery)) {
        delete routeQuery[key];
    }
    vi.mocked(rolesApi).list.mockResolvedValue([makeRole('admin'), makeRole('manager'), makeRole('user')]);
});

describe('a plain user editing themselves', () => {
    beforeEach(() => {
        vi.mocked(usersApi).show.mockResolvedValue(makeUser({ id: 1, role: makeRole('user') }));
    });

    it('loads their own record without an id in the query', async () => {
        await mountAs('user', 1);

        expect(usersApi.show).toHaveBeenCalledWith(1);
    });

    it('renders no status or role control', async () => {
        const { wrapper } = await mountAs('user', 1);

        expect(wrapper.text()).not.toContain('Статус');
        expect(wrapper.text()).not.toContain('Роль');
        expect(comboboxes(wrapper)).toHaveLength(0);
    });

    it('never requests the roles list', async () => {
        await mountAs('user', 1);

        expect(rolesApi.list).not.toHaveBeenCalled();
    });

    it('submits without the prohibited keys', async () => {
        const { wrapper } = await mountAs('user', 1);
        vi.mocked(usersApi).save.mockResolvedValue(makeUser({ id: 1 }));

        await wrapper.find('form').trigger('submit');
        await flushPromises();

        const payload = vi.mocked(usersApi).save.mock.calls[0]![1];

        expect('status' in payload).toBe(false);
        expect('role_id' in payload).toBe(false);
    });

    it('refreshes the cached session user after saving themselves', async () => {
        const { wrapper, auth } = await mountAs('user', 1);
        vi.mocked(usersApi).save.mockResolvedValue(makeUser({ id: 1, first_name: 'Обновлённое' }));

        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(auth.user?.first_name).toBe('Обновлённое');
    });
});

describe('an admin editing someone else', () => {
    beforeEach(() => {
        routeQuery.id = '9';
        vi.mocked(usersApi).show.mockResolvedValue(makeUser({ id: 9, role: makeRole('user') }));
    });

    it('loads the user named in the query', async () => {
        await mountAs('admin', 1);

        expect(usersApi.show).toHaveBeenCalledWith(9);
    });

    it('offers the status and role controls', async () => {
        const { wrapper } = await mountAs('admin', 1);

        expect(wrapper.text()).toContain('Статус');
        expect(wrapper.text()).toContain('Роль');
        expect(rolesApi.list).toHaveBeenCalled();
    });

    it('submits status and role_id', async () => {
        const { wrapper } = await mountAs('admin', 1);
        vi.mocked(usersApi).save.mockResolvedValue(makeUser({ id: 9 }));

        await wrapper.find('form').trigger('submit');
        await flushPromises();

        const payload = vi.mocked(usersApi).save.mock.calls[0]![1];

        expect(payload.status).toBe('active');
        expect(payload.role_id).toBe(3);
    });

    it('leaves the admin’s own cached session alone', async () => {
        const { wrapper, auth } = await mountAs('admin', 1);
        vi.mocked(usersApi).save.mockResolvedValue(makeUser({ id: 9, first_name: 'Чужое' }));

        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(auth.user?.id).toBe(1);
        expect(auth.user?.first_name).not.toBe('Чужое');
    });

    it('disables the role select when the roles list is unavailable', async () => {
        vi.mocked(rolesApi).list.mockRejectedValue({ status: 403, message: 'Действие запрещено.' });

        const { wrapper } = await mountAs('admin', 1);

        expect(wrapper.text()).toContain('Список ролей недоступен.');
    });
});

describe('someone the viewer may read but not edit', () => {
    it('renders a read-only summary instead of the form', async () => {
        routeQuery.id = '9';
        vi.mocked(usersApi).show.mockResolvedValue(
            makeUser({ id: 9, email: 'other@example.com', role: makeRole('user') }),
        );

        const { wrapper } = await mountAs('manager', 2);

        expect(wrapper.find('form').exists()).toBe(false);
        expect(wrapper.text()).toContain('other@example.com');
    });
});

describe('failures', () => {
    it('sends a forbidden profile to the 403 screen', async () => {
        routeQuery.id = '9';
        vi.mocked(usersApi).show.mockRejectedValue({ message: 'Действие запрещено.', isForbidden: true });

        const { wrapper } = await mountAs('manager', 2);

        expect(routerReplace).toHaveBeenCalledWith({ name: 'forbidden' });
        expect(wrapper.find('form').exists()).toBe(false);
    });

    it('shows a load error instead of an empty form', async () => {
        vi.mocked(usersApi).show.mockRejectedValue({ message: 'Не удалось загрузить.', isForbidden: false });

        const { wrapper } = await mountAs('manager', 2);

        expect(wrapper.text()).toContain('Не удалось загрузить.');
        expect(wrapper.find('form').exists()).toBe(false);
    });
});

describe('changing the password', () => {
    it('sends the typed passwords and reports success', async () => {
        vi.mocked(usersApi).show.mockResolvedValue(makeUser({ id: 1, role: makeRole('user') }));
        const { wrapper } = await mountAs('user', 1);
        vi.mocked(usersApi).changePassword.mockResolvedValue();

        const form = wrapper.findAll('form')[1]!;
        const fields = form.findAll('input[type="password"]');

        await fields[0]!.setValue('old-one');
        await fields[1]!.setValue('new-one');
        await fields[2]!.setValue('new-one');
        await form.trigger('submit');
        await flushPromises();

        expect(usersApi.changePassword).toHaveBeenCalledWith(1, {
            current_password: 'old-one',
            password: 'new-one',
            password_confirmation: 'new-one',
        });
    });

    it('is not offered when an admin edits someone else', async () => {
        routeQuery.id = '9';
        vi.mocked(usersApi).show.mockResolvedValue(makeUser({ id: 9, role: makeRole('user') }));

        const { wrapper } = await mountAs('admin', 1);

        expect(wrapper.findAll('form')).toHaveLength(1);
    });
});

describe('changing the email', () => {
    it('asks for the current password only once the email differs', async () => {
        vi.mocked(usersApi).show.mockResolvedValue(
            makeUser({ id: 1, email: 'old@example.com', role: makeRole('user') }),
        );
        const { wrapper } = await mountAs('user', 1);
        vi.mocked(usersApi).save.mockResolvedValue(makeUser({ id: 1 }));

        const form = wrapper.findAll('form')[0]!;

        expect(form.find('input[type="password"]').exists()).toBe(false);

        await form.find('input[type="email"]').setValue('new@example.com');

        expect(form.find('input[type="password"]').exists()).toBe(true);

        await form.find('input[type="password"]').setValue('my-secret');
        await form.trigger('submit');
        await flushPromises();

        expect(vi.mocked(usersApi).save.mock.calls[0]![1].current_password).toBe('my-secret');
    });
});
