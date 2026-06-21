import { describe, expect, test } from 'vitest';
import { escapeHtmlText, formatters } from '../src/lib/formatters.js';

const createCell = (value, field = 'notes') => {
    const element = { dataset: {} };

    return {
        getValue: () => value,
        getField: () => field,
        getElement: () => element,
        element
    };
};

describe('escapeHtmlText', () => {
    test('converts nullish values to an empty string', () => {
        expect(escapeHtmlText(null)).toBe('');
        expect(escapeHtmlText(undefined)).toBe('');
    });

    test('stringifies numbers and booleans', () => {
        expect(escapeHtmlText(42)).toBe('42');
        expect(escapeHtmlText(false)).toBe('false');
    });

    test('escapes HTML-sensitive characters', () => {
        expect(escapeHtmlText('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#39;');
    });

    test('escapes HTML injection payloads as text', () => {
        expect(escapeHtmlText('<img src=x onerror=alert(1)>'))
            .toBe('&lt;img src=x onerror=alert(1)&gt;');
    });
});

describe('safe textual formatters', () => {
    test('text escapes cell values', () => {
        expect(formatters.text()(createCell('<img src=x onerror=alert(1)>')))
            .toBe('&lt;img src=x onerror=alert(1)&gt;');
    });

    test('uppercase transforms text and escapes output', () => {
        expect(formatters.uppercase()(createCell('<b>test</b>')))
            .toBe('&lt;B&gt;TEST&lt;/B&gt;');
    });

    test('lowercase transforms text and escapes output', () => {
        expect(formatters.lowercase()(createCell('<B>TEST</B>')))
            .toBe('&lt;b&gt;test&lt;/b&gt;');
    });

    test('decimal escapes non-numeric fallback values', () => {
        expect(formatters.decimal(2)(createCell('<b>NaN</b>')))
            .toBe('&lt;b&gt;NaN&lt;/b&gt;');
    });

    test('decimal still formats valid numbers', () => {
        expect(formatters.decimal(2, { locale: 'en-US' })(createCell(12.3)))
            .toBe('12.30');
    });

    test('percent supports optional trailing decimals without changing fixed defaults', () => {
        const compactPercent = formatters.percent(1, {
            locale: 'it-IT',
            minimumFractionDigits: 0
        });

        expect(compactPercent(createCell(0.016))).toBe('1,6%');
        expect(compactPercent(createCell(0.125))).toBe('12,5%');
        expect(compactPercent(createCell(0.805))).toBe('80,5%');
        expect(compactPercent(createCell(0.01))).toBe('1%');
        expect(formatters.percent(3, { locale: 'it-IT' })(createCell(0.016)))
            .toBe('1,600%');
    });

    test('emptyPlaceholder escapes placeholder and non-empty values', () => {
        expect(formatters.emptyPlaceholder('<none>')(createCell('')))
            .toBe('&lt;none&gt;');
        expect(formatters.emptyPlaceholder('-')(createCell('<b>value</b>')))
            .toBe('&lt;b&gt;value&lt;/b&gt;');
    });

    test('checkbox escapes custom labels and symbols', () => {
        const formatter = formatters.checkbox({
            checkedLabel: '<yes>',
            checkedSymbol: '<x>'
        });

        expect(formatter(createCell(true))).toBe('&lt;x&gt; &lt;yes&gt;');
    });

    test('largeTextPreview truncates text before escaping output', () => {
        const cell = createCell('<b>test</b>');

        expect(formatters.largeTextPreview({ maxLength: 8 })(cell))
            .toBe('&lt;b&gt;test&lt;...');
        expect(cell.element.dataset.largeTextField).toBe('notes');
    });
});
