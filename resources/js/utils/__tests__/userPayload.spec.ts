import { describe, expect, it } from 'vitest';
import { buildUserPayload, toFormData, validateAvatar } from '@/utils/userPayload';
import type { UserFormValues } from '@/utils/userPayload';

function values(overrides: Partial<UserFormValues> = {}): UserFormValues {
    return {
        first_name: 'Иван',
        last_name: 'Петров',
        email: 'ivan@example.com',
        phone: '+70000000000',
        status: 'active',
        role_id: '2',
        current_password: '',
        ...overrides,
    };
}

describe('buildUserPayload without users.update', () => {
    it('omits the prohibited keys entirely, not as undefined', () => {
        const payload = buildUserPayload(values(), false);
        const keys = Object.keys(payload);

        expect(keys).not.toContain('status');
        expect(keys).not.toContain('role_id');
        expect('status' in payload).toBe(false);
        expect('role_id' in payload).toBe(false);
    });

    it('still sends every always-required field', () => {
        expect(buildUserPayload(values(), false)).toEqual({
            first_name: 'Иван',
            last_name: 'Петров',
            email: 'ivan@example.com',
            phone: '+70000000000',
        });
    });
});

describe('buildUserPayload with users.update', () => {
    it('includes status and a numeric role_id', () => {
        const payload = buildUserPayload(values({ status: 'blocked', role_id: '3' }), true);

        expect(payload.status).toBe('blocked');
        expect(payload.role_id).toBe(3);
    });

    it('omits role_id when no role is selected', () => {
        const payload = buildUserPayload(values({ role_id: '' }), true);

        expect('role_id' in payload).toBe(false);
        expect(payload.status).toBe('active');
    });
});

describe('buildUserPayload trimming', () => {
    it('trims every text field', () => {
        const payload = buildUserPayload(
            values({ first_name: '  Иван ', last_name: ' Петров ', email: ' a@b.c ', phone: ' +7 ' }),
            false,
        );

        expect(payload).toEqual({
            first_name: 'Иван',
            last_name: 'Петров',
            email: 'a@b.c',
            phone: '+7',
        });
    });
});

describe('toFormData', () => {
    it('carries the file under `avatar` and adds no _method override', () => {
        const file = new File(['x'], 'a.png', { type: 'image/png' });
        const data = toFormData(buildUserPayload(values(), false), file);

        expect(data.get('avatar')).toBe(file);
        expect(data.get('first_name')).toBe('Иван');
        expect(data.has('_method')).toBe(false);
        expect(data.has('status')).toBe(false);
    });

    it('stringifies a numeric role_id', () => {
        const file = new File(['x'], 'a.png', { type: 'image/png' });
        const data = toFormData(buildUserPayload(values({ role_id: '3' }), true), file);

        expect(data.get('role_id')).toBe('3');
    });
});

describe('validateAvatar', () => {
    it('rejects a non-image', () => {
        const file = new File(['x'], 'a.txt', { type: 'text/plain' });

        expect(validateAvatar(file)).toBe('Аватар должен быть изображением.');
    });

    it('rejects a file over 2 MB', () => {
        const file = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' });

        expect(validateAvatar(file)).toBe('Размер аватара не должен превышать 2 МБ.');
    });

    it('accepts a valid image', () => {
        expect(validateAvatar(new File(['x'], 'a.png', { type: 'image/png' }))).toBeNull();
    });
});

describe('buildUserPayload current_password', () => {
    it('omits the key while the field is empty', () => {
        expect('current_password' in buildUserPayload(values(), false)).toBe(false);
    });

    it('sends the password as typed, without trimming', () => {
        const payload = buildUserPayload(values({ current_password: ' secret ' }), false);

        expect(payload.current_password).toBe(' secret ');
    });
});
