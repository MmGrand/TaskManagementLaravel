import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { useRetryAfter } from '@/composables/useRetryAfter';
import type { ApiError } from '@/types/api';

function throttled(retryAfter: number | null): ApiError {
    return {
        status: 429,
        message: 'Слишком много запросов. Попробуйте позже.',
        errors: {},
        isValidation: false,
        isUnauthenticated: false,
        isForbidden: false,
        isNotFound: false,
        isThrottled: true,
        isNetwork: false,
        isAccountDisabled: false,
        retryAfter,
    };
}

function mountHarness() {
    const error = ref<ApiError | null>(null);
    let api!: ReturnType<typeof useRetryAfter>;

    const wrapper = mount(
        defineComponent({
            setup() {
                api = useRetryAfter(error);

                return () => null;
            },
        }),
    );

    return { error, get api() { return api; }, wrapper };
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('useRetryAfter', () => {
    it('is idle without an error', () => {
        const harness = mountHarness();

        expect(harness.api.isWaiting.value).toBe(false);
        expect(harness.api.message.value).toBeNull();
    });

    it('counts down from Retry-After and re-enables at zero', async () => {
        const harness = mountHarness();

        harness.error.value = throttled(3);
        await harness.wrapper.vm.$nextTick();

        expect(harness.api.secondsLeft.value).toBe(3);
        expect(harness.api.message.value).toContain('через 3 с');

        vi.advanceTimersByTime(2000);
        expect(harness.api.secondsLeft.value).toBe(1);

        vi.advanceTimersByTime(1000);
        expect(harness.api.secondsLeft.value).toBe(0);
        expect(harness.api.isWaiting.value).toBe(false);
    });

    it('falls back to the limiter window when the header is missing', async () => {
        const harness = mountHarness();

        harness.error.value = throttled(null);
        await harness.wrapper.vm.$nextTick();

        expect(harness.api.secondsLeft.value).toBe(60);
    });

    it('ignores errors that are not throttles', async () => {
        const harness = mountHarness();

        harness.error.value = { ...throttled(30), status: 422, isThrottled: false };
        await harness.wrapper.vm.$nextTick();

        expect(harness.api.isWaiting.value).toBe(false);
    });

    it('clears the countdown when the error is reset', async () => {
        const harness = mountHarness();

        harness.error.value = throttled(10);
        await harness.wrapper.vm.$nextTick();

        harness.error.value = null;
        await harness.wrapper.vm.$nextTick();

        expect(harness.api.secondsLeft.value).toBe(0);
    });

    it('stops its interval on unmount', async () => {
        const harness = mountHarness();

        harness.error.value = throttled(10);
        await harness.wrapper.vm.$nextTick();
        harness.wrapper.unmount();

        vi.advanceTimersByTime(5000);

        expect(harness.api.secondsLeft.value).toBe(10);
    });
});
