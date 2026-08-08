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

    test('formats stored ratios with derived percentage precision', () => {
        const threeDigitRatio = formatters.percentFromRatio(3);

        expect(threeDigitRatio(createCell(0.016))).toBe('1,6%');
        expect(threeDigitRatio(createCell(0.125))).toBe('12,5%');
        expect(threeDigitRatio(createCell(0.805))).toBe('80,5%');
        expect(threeDigitRatio(createCell(0.01))).toBe('1%');
        expect(formatters.percentFromRatio(2)(createCell(0.12))).toBe('12%');
        expect(formatters.percentFromRatio(2)(createCell(0.01))).toBe('1%');
        expect(formatters.percentFromRatio(4)(createCell(0.1234))).toBe('12,34%');
        expect(formatters.percentFromRatio(3)(createCell(null))).toBe('');
        expect(formatters.percentFromRatio(3)(createCell(undefined))).toBe('');
        expect(formatters.percentFromRatio(3)(createCell(''))).toBe('');
        expect(formatters.percentFromRatio(3)(createCell('<bad>')))
            .toBe('&lt;bad&gt;');
        expect(formatters.percentFromRatio(3, {
            locale: 'it-IT',
            minimumFractionDigits: 1
        })(createCell(0.01))).toBe('1,0%');
    });

    test('keeps explicit percent precision fixed', () => {
        expect(formatters.percent(3, { locale: 'it-IT' })(createCell(0.016)))
            .toBe('1,600%');
    });

    test('emptyPlaceholder escapes placeholder and non-empty values', () => {
        expect(formatters.emptyPlaceholder('<none>')(createCell('')))
            .toBe('&lt;none&gt;');
        expect(formatters.emptyPlaceholder('-')(createCell('<b>value</b>')))
            .toBe('&lt;b&gt;value&lt;/b&gt;');
    });

    test('checkbox defaults to symbols without labels or trailing spaces', () => {
        const defaultChecked = formatters.checkbox()(createCell(true));
        const defaultUnchecked = formatters.checkbox()(createCell(false));
        const customSymbols = formatters.checkbox({
            checkedSymbol: 'X',
            uncheckedSymbol: 'O'
        });

        expect(defaultChecked).not.toContain('Yes');
        expect(defaultUnchecked).not.toContain('No');
        expect(defaultChecked).not.toMatch(/\s$/);
        expect(defaultUnchecked).not.toMatch(/\s$/);
        expect(customSymbols(createCell(true))).toBe('X');
        expect(customSymbols(createCell(false))).toBe('O');
    });

    test('checkbox escapes explicit custom labels and symbols', () => {
        const formatter = formatters.checkbox({
            checkedLabel: '<yes>',
            uncheckedLabel: '<no>',
            checkedSymbol: '<x>',
            uncheckedSymbol: '<o>'
        });

        expect(formatter(createCell(true))).toBe('&lt;x&gt; &lt;yes&gt;');
        expect(formatter(createCell(false))).toBe('&lt;o&gt; &lt;no&gt;');
    });

    test('largeTextPreview truncates text before escaping output', () => {
        const cell = createCell('<b>test</b>');

        expect(formatters.largeTextPreview({ maxLength: 8 })(cell))
            .toBe('&lt;b&gt;test&lt;...');
        expect(cell.element.dataset.largeTextField).toBe('notes');
    });
});

describe('calculation formatter', () => {
    test('renders a label, formatted value, and normalized application classes', () => {
        const formatter = formatters.calculation({
            label: 'AVG:',
            className: '  my-average   highlighted  ',
            formatValue: value => Number(value).toFixed(2)
        });

        expect(formatter(createCell(83.812)))
            .toBe('<span class="amb-calc-content my-average highlighted"><span class="amb-calc-label">AVG:</span><span class="amb-calc-value">83.81</span></span>');
        expect(formatter._ambFormatterType).toBe('calculation');
    });

    test('escapes label, raw and formatted values, and className', () => {
        expect(formatters.calculation({
            label: '<img src=x onerror=alert(1)>',
            className: 'safe" onclick="alert(1)'
        })(createCell('<b>value</b>')))
            .toBe('<span class="amb-calc-content safe&quot; onclick=&quot;alert(1)"><span class="amb-calc-label">&lt;img src=x onerror=alert(1)&gt;</span><span class="amb-calc-value">&lt;b&gt;value&lt;/b&gt;</span></span>');

        expect(formatters.calculation({
            formatValue: () => '<script>alert(1)</script>'
        })(createCell('ignored')))
            .toBe('<span class="amb-calc-content"><span class="amb-calc-value">&lt;script&gt;alert(1)&lt;/script&gt;</span></span>');
    });

    test('preserves false and zero while rendering nullish values as empty text', () => {
        const formatter = formatters.calculation();

        expect(formatter(createCell(0))).toContain('<span class="amb-calc-value">0</span>');
        expect(formatter(createCell(false))).toContain('<span class="amb-calc-value">false</span>');
        expect(formatter(createCell(''))).toContain('<span class="amb-calc-value"></span>');
        expect(formatter(createCell(null))).toContain('<span class="amb-calc-value"></span>');
        expect(formatter(createCell(undefined))).toContain('<span class="amb-calc-value"></span>');
        expect(formatter(createCell(null))).not.toContain('amb-calc-label');
    });

    test('does not mutate options and propagates formatValue errors', () => {
        const options = {
            label: 'SUM:',
            className: 'total',
            formatValue: () => {
                throw new Error('format failed');
            }
        };
        const originalOptions = { ...options };
        const formatter = formatters.calculation(options);

        expect(options).toEqual(originalOptions);
        expect(() => formatter(createCell(10))).toThrow('format failed');
    });
});
