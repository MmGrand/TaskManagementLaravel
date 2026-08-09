export function countDigits(text: string): number {
    return text.replace(/\D/g, '').length;
}

export function caretAfterDigits(text: string, count: number): number {
    if (count === 0) {
        return 0;
    }

    let seen = 0;

    for (let index = 0; index < text.length; index += 1) {
        if (/\d/.test(text[index]!)) {
            seen += 1;

            if (seen === count) {
                return index + 1;
            }
        }
    }

    return text.length;
}
