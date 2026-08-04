import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import * as projectsApi from '@/api/projects';
import * as usersApi from '@/api/users';
import TaskForm from '@/components/domain/tasks/TaskForm.vue';
import TaskStatusOnlyForm from '@/components/domain/tasks/TaskStatusOnlyForm.vue';
import { chooseOption, comboboxes } from '@/tests/ui';
import { makeMeta, makePage, makeProject, makeTask, makeUser } from '@/tests/fixtures';
import type { ApiError } from '@/types/api';

vi.mock('@/api/http', () => ({
    http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    setSessionEndedHandler: vi.fn(),
}));
vi.mock('@/api/projects');
vi.mock('@/api/users');

beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(projectsApi).list.mockResolvedValue(makePage([makeProject({ id: 3, name: 'Альфа' })]));
    vi.mocked(usersApi).list.mockResolvedValue(makePage([makeUser({ id: 7 })]));
});

async function mountForm(props: Record<string, unknown> = {}) {
    const wrapper = mount(TaskForm, { props });
    await flushPromises();

    return wrapper;
}

describe('TaskForm (manageable caller)', () => {
    it('loads the project and assignee pickers on mount', async () => {
        await mountForm();

        expect(projectsApi.list).toHaveBeenCalled();
        expect(usersApi.list).toHaveBeenCalled();
    });

    it('emits the complete payload even when only the status changed', async () => {
        const wrapper = await mountForm({
            task: makeTask({
                id: 1,
                title: 'Существующая',
                description: 'Текст',
                status: 'pending',
                priority: 'high',
                project_id: 3,
                assigned_to: 7,
                due_date: '2026-08-10',
            }),
        });

        await chooseOption(wrapper, 0, 'Завершена');
        await wrapper.find('form').trigger('submit');

        expect(wrapper.emitted('submit')![0]![0]).toEqual({
            title: 'Существующая',
            description: 'Текст',
            status: 'completed',
            priority: 'high',
            project_id: 3,
            assigned_to: 7,
            due_date: '2026-08-10',
        });
    });

    it('walks additional pages to fill the pickers', async () => {
        vi.mocked(projectsApi).list.mockImplementation(async (filters) => ({
            items: [makeProject({ id: filters?.page ?? 1 })],
            meta: makeMeta({ current_page: filters?.page ?? 1, last_page: 3 }),
        }));

        await mountForm();

        expect(vi.mocked(projectsApi).list).toHaveBeenCalledTimes(3);
    });

    it('stops at the page cap and says the list was truncated', async () => {
        vi.mocked(projectsApi).list.mockImplementation(async (filters) => ({
            items: [makeProject({ id: filters?.page ?? 1 })],
            meta: makeMeta({ current_page: filters?.page ?? 1, last_page: 20 }),
        }));

        const wrapper = await mountForm();

        expect(vi.mocked(projectsApi).list).toHaveBeenCalledTimes(5);
        expect(wrapper.text()).toContain('Показаны первые 75 проектов.');
    });

    it('survives a 403 from the users endpoint', async () => {
        vi.mocked(usersApi).list.mockRejectedValue({ status: 403, message: 'Действие запрещено.' });

        const wrapper = await mountForm();

        expect(wrapper.find('form').exists()).toBe(true);
    });

    it('renders server field errors', async () => {
        const error: ApiError = {
            status: 422,
            message: 'Проверьте поля.',
            errors: { title: ['Название обязательно.'], assigned_to: ['Исполнитель не найден.'] },
            isValidation: true,
            isUnauthenticated: false,
            isForbidden: false,
            isNotFound: false,
            isThrottled: false,
            isNetwork: false,
            isAccountDisabled: false,
            retryAfter: null,
        };

        const wrapper = await mountForm({ error });

        expect(wrapper.text()).toContain('Название обязательно.');
        expect(wrapper.text()).toContain('Исполнитель не найден.');
    });
});

describe('TaskStatusOnlyForm (assignee)', () => {
    it('renders a single status control and no other field', () => {
        const wrapper = mount(TaskStatusOnlyForm, {
            props: { task: makeTask({ status: 'pending' }) },
        });

        expect(comboboxes(wrapper)).toHaveLength(1);
        expect(wrapper.findAll('input')).toHaveLength(0);
        expect(wrapper.findAll('textarea')).toHaveLength(0);
    });

    it('emits a payload containing only the status', async () => {
        const wrapper = mount(TaskStatusOnlyForm, {
            props: { task: makeTask({ status: 'pending' }) },
        });

        await chooseOption(wrapper, 0, 'В работе');
        await wrapper.find('form').trigger('submit');

        expect(wrapper.emitted('submit')![0]![0]).toEqual({ status: 'in_progress' });
    });

    it('explains why the other fields are missing', () => {
        const wrapper = mount(TaskStatusOnlyForm, { props: { task: makeTask() } });

        expect(wrapper.text()).toContain('только статус');
    });
});
