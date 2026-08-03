import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AvatarUploader from '@/components/domain/users/AvatarUploader.vue';
import { makeUser } from '@/tests/fixtures';

beforeEach(() => {
    // В jsdom нет реализации object URL.
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
});

function mountUploader() {
    return mount(AvatarUploader, { props: { user: makeUser({ avatar: null }) } });
}

async function selectFile(wrapper: ReturnType<typeof mountUploader>, file: File): Promise<void> {
    const input = wrapper.find('input[type="file"]');

    Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
    await input.trigger('change');
}

describe('AvatarUploader', () => {
    it('emits a valid image and shows a preview', async () => {
        const wrapper = mountUploader();
        const file = new File(['x'], 'a.png', { type: 'image/png' });

        await selectFile(wrapper, file);

        expect(wrapper.emitted('change')![0]![0]).toBe(file);
        expect(wrapper.find('img[alt="Предпросмотр аватара"]').exists()).toBe(true);
    });

    it('rejects a file over 2 MB without emitting it', async () => {
        const wrapper = mountUploader();
        const file = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' });

        await selectFile(wrapper, file);

        expect(wrapper.text()).toContain('не должен превышать 2 МБ');
        expect(wrapper.emitted('change')![0]![0]).toBeNull();
    });

    it('rejects a non-image', async () => {
        const wrapper = mountUploader();

        await selectFile(wrapper, new File(['x'], 'a.txt', { type: 'text/plain' }));

        expect(wrapper.text()).toContain('должен быть изображением');
        expect(wrapper.emitted('change')![0]![0]).toBeNull();
    });

    it('falls back to initials when there is no avatar', () => {
        expect(mountUploader().text()).toContain('ИП');
    });

    it('labels the picker itself instead of leaning on the browser chrome', () => {
        const wrapper = mountUploader();

        // Нативный виджет рисует свою надпись по локали ОС, поэтому кнопкой
        // служит <label>, а сам input визуально скрыт, но остаётся фокусируемым.
        expect(wrapper.find('label[for="avatar-input"]').text()).toBe('Выбрать файл');
        expect(wrapper.text()).toContain('Файл не выбран');
        expect(wrapper.find('input[type="file"]').classes()).toContain('sr-only');
    });

    it('shows the chosen file name once a valid image is picked', async () => {
        const wrapper = mountUploader();

        await selectFile(wrapper, new File(['x'], 'аватар.png', { type: 'image/png' }));

        expect(wrapper.text()).toContain('аватар.png');
        expect(wrapper.text()).not.toContain('Файл не выбран');
    });

    it('goes back to the placeholder when the file is rejected', async () => {
        const wrapper = mountUploader();

        await selectFile(wrapper, new File(['x'], 'заметка.txt', { type: 'text/plain' }));

        expect(wrapper.text()).toContain('Файл не выбран');
        expect(wrapper.text()).not.toContain('заметка.txt');
    });

    it('revokes the preview URL on unmount', async () => {
        const wrapper = mountUploader();

        await selectFile(wrapper, new File(['x'], 'a.png', { type: 'image/png' }));
        wrapper.unmount();

        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
    });
});
