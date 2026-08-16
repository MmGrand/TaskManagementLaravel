import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';
import { useFormValidation } from '@/composables/useFormValidation';
import { maxLength, required } from '@/utils/validation';

function setup(name = '') {
    const values = reactive({ name, note: '' });
    const validation = useFormValidation(values, { name: [required(), maxLength(5)] });

    return { values, validation };
}

describe('useFormValidation', () => {
    it('stays quiet until the field is touched or the form is submitted', () => {
        const { validation } = setup();

        expect(validation.fieldError('name')).toBeNull();

        validation.touch('name');

        expect(validation.fieldError('name')).toBe('Заполните это поле.');
    });

    it('reveals every field at once on submit and refuses to pass', () => {
        const { validation } = setup();

        expect(validation.validate()).toBe(false);
        expect(validation.fieldError('name')).toBe('Заполните это поле.');
    });

    it('lets a valid form through', () => {
        const { validation } = setup('Имя');

        expect(validation.validate()).toBe(true);
        expect(validation.fieldError('name')).toBeNull();
    });

    it('reports only the first failed rule of a field', () => {
        const { values, validation } = setup('слишком длинное');

        validation.touch('name');

        expect(validation.fieldError('name')).toBe('Не длиннее 5 символов.');

        values.name = '';

        expect(validation.fieldError('name')).toBe('Заполните это поле.');
    });

    it('clears the message as soon as the value becomes valid', () => {
        const { values, validation } = setup();

        validation.validate();
        values.name = 'Имя';

        expect(validation.fieldError('name')).toBeNull();
        expect(validation.isValid.value).toBe(true);
    });

    it('has nothing to say about a field without rules', () => {
        const { validation } = setup('Имя');

        validation.touch('note');

        expect(validation.fieldError('note')).toBeNull();
    });

    it('hides the messages again after a reset', () => {
        const { validation } = setup();

        validation.validate();
        validation.touch('name');
        validation.reset();

        expect(validation.fieldError('name')).toBeNull();
    });

    describe('server-side message from a previous submit', () => {
        it('shows it when the field has no client-side complaint', () => {
            const { validation } = setup('Имя');

            expect(validation.fieldError('name', 'Уже занято.')).toBe('Уже занято.');
        });

        it('lets the client-side message take priority over it', () => {
            const { validation } = setup('слишком длинное');
            validation.touch('name');

            expect(validation.fieldError('name', 'Уже занято.')).toBe('Не длиннее 5 символов.');
        });

        it('goes stale once the field is touched again after a submit', () => {
            const { validation } = setup('Имя');

            validation.validate();
            expect(validation.fieldError('name', 'Уже занято.')).toBe('Уже занято.');

            validation.touch('name');

            expect(validation.fieldError('name', 'Уже занято.')).toBeNull();
        });

        it('stays visible if the retry never reached the server (client validation failed)', () => {
            const { values, validation } = setup('Имя');

            validation.validate();
            validation.touch('name');

            // Пользователь портит другое поле и снова жмёт submit — до сервера
            // попытка не доходит, значит отметка "тронуто после отправки" не должна сбрасываться.
            values.name = '';
            expect(validation.validate()).toBe(false);

            values.name = 'Имя';
            expect(validation.fieldError('name', 'Уже занято.')).toBeNull();
        });
    });
});
