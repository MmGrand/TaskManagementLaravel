import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ProjectForm from '@/components/domain/projects/ProjectForm.vue';
import { makeProject } from '@/tests/fixtures';
import type { ApiError } from '@/types/api';

function validationError(errors: Record<string, string[]>): ApiError {
    return {
        status: 422,
        message: 'Проверьте поля.',
        errors,
        isValidation: true,
        isUnauthenticated: false,
        isForbidden: false,
        isNotFound: false,
        isThrottled: false,
        isNetwork: false,
        isAccountDisabled: false,
        retryAfter: null,
    };
}

describe('ProjectForm', () => {
    it('starts empty when creating', () => {
        const wrapper = mount(ProjectForm);

        expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');
        expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('active');
    });

    it('prefills from the project when editing', () => {
        const wrapper = mount(ProjectForm, {
            props: { project: makeProject({ name: 'Редакция', description: 'Текст', status: 'archived' }) },
        });

        expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Редакция');
        expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('Текст');
        expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('archived');
    });

    it('emits the full payload even when only the status changed', async () => {
        const wrapper = mount(ProjectForm, {
            props: { project: makeProject({ name: 'Проект', description: 'Описание', status: 'active' }) },
        });

        await wrapper.find('select').setValue('completed');
        await wrapper.find('form').trigger('submit');

        expect(wrapper.emitted('submit')![0]![0]).toEqual({
            name: 'Проект',
            description: 'Описание',
            status: 'completed',
        });
    });

    it('trims the name and sends null for an empty description', async () => {
        const wrapper = mount(ProjectForm);

        await wrapper.find('input').setValue('  Проект  ');
        await wrapper.find('form').trigger('submit');

        expect(wrapper.emitted('submit')![0]![0]).toEqual({
            name: 'Проект',
            description: null,
            status: 'active',
        });
    });

    it('renders the server field error next to the name input', () => {
        const wrapper = mount(ProjectForm, {
            props: { error: validationError({ name: ['Название обязательно.'] }) },
        });

        expect(wrapper.text()).toContain('Название обязательно.');
    });

    it('shows a banner for a non-validation failure', () => {
        const wrapper = mount(ProjectForm, {
            props: {
                error: { ...validationError({}), status: 403, isValidation: false, message: 'Действие запрещено.' },
            },
        });

        expect(wrapper.text()).toContain('Действие запрещено.');
    });

    it('disables the actions while a submit is in flight', () => {
        const wrapper = mount(ProjectForm, { props: { pending: true } });

        for (const button of wrapper.findAll('button')) {
            expect(button.attributes('disabled')).toBeDefined();
        }
    });
});
