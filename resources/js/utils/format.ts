import { intlLocale } from '@/i18n/locale-state';
import type { User } from '@/types/models';
import { maskPhone } from '@/utils/phone';

export function formatDate(value: string | null | undefined): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(intlLocale.value, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
        date,
    );
}

export function formatDateTime(value: string | null | undefined): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(intlLocale.value, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

export function formatPhone(value: string | null | undefined): string {
    if (!value) {
        return '—';
    }

    return maskPhone(value) || value;
}

export function fullName(user: Pick<User, 'first_name' | 'last_name'> | null | undefined): string {
    if (!user) {
        return '—';
    }

    return `${user.first_name} ${user.last_name}`.trim() || '—';
}

export function initials(user: Pick<User, 'first_name' | 'last_name'> | null | undefined): string {
    if (!user) {
        return '?';
    }

    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase() || '?';
}
