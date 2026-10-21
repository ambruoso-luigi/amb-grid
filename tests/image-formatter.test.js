import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { formatters } from '../src/lib/formatters.js';
import { normalizeImages } from '../src/lib/image-model.js';

const createElement = tagName => ({
    tagName: tagName.toUpperCase(),
    children: [],
    style: {},
    attributes: {},
    listeners: {},
    className: '',
    textContent: '',
    append(...children) {
        children.forEach(child => {
            child.parent = this;
            this.children.push(child);
        });
    },
    addEventListener(type, handler) { this.listeners[type] = handler; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    getAttribute(name) { return this.attributes[name] ?? null; },
    replaceWith(replacement) {
        const index = this.parent.children.indexOf(this);
        replacement.parent = this.parent;
        this.parent.children[index] = replacement;
    },
    dispatch(type) { this.listeners[type]?.(); }
});

const cell = value => ({ getValue: () => value });
let originalDocument;

beforeEach(() => {
    originalDocument = globalThis.document;
    globalThis.document = { createElement };
});

afterEach(() => {
    globalThis.document = originalDocument;
});

describe('public image formatter', () => {
    test('validates options without accessing the DOM', () => {
        delete globalThis.document;
        expect(() => formatters.image()).not.toThrow();
        expect(() => formatters.image({ width: 24, height: 32, fit: 'cover', preview: false, viewer: false })).not.toThrow();
        for (const options of [null, [], { width: 0 }, { height: Infinity }, { fit: 'fill' }, { preview: 1 }, { viewer: 'yes' }, { unknown: true }]) {
            expect(() => formatters.image(options)).toThrow(TypeError);
        }
    });

    test('normalizes supported values, filters invalid entries and preserves source data and order', () => {
        const source = Object.freeze([
            Object.freeze({ src: '/first.jpg', thumbnail: './thumb.jpg', alt: '<b>first</b>', caption: '<script>x</script>' }),
            Object.freeze({ src: 'javascript:alert(1)' }),
            Object.freeze({ src: 'https://example.test/second.jpg' }),
            Object.freeze({ src: 'ftp://example.test/third.jpg' }),
            '/array-string.jpg',
            Object.freeze({ src: '/third.jpg', thumbnail: 'data:image/svg+xml,bad' })
        ]);
        const normalized = normalizeImages(source);
        expect(normalized.map(item => item.src)).toEqual(['/first.jpg', 'https://example.test/second.jpg', '/third.jpg']);
        expect(normalized[0]).toEqual({ src: '/first.jpg', thumbnail: './thumb.jpg', alt: '<b>first</b>', caption: '<script>x</script>' });
        expect(normalized[2]).toEqual({ src: '/third.jpg', alt: '', caption: '' });
        expect(normalized[0]).not.toBe(source[0]);
        expect(source[0].caption).toBe('<script>x</script>');
        expect(normalizeImages('/single.jpg')).toHaveLength(1);
        expect(normalizeImages({ src: 'http://example.test/a.jpg' })).toHaveLength(1);
        for (const value of [null, undefined, [], '', 'javascript:alert(1)', 'data:image/png,broken', { src: 7 }]) {
            expect(normalizeImages(value)).toEqual([]);
        }
    });

    test('renders first valid thumbnail, textual metadata and count without eager loading other originals', () => {
        const value = [
            { src: 'javascript:alert(1)' },
            { src: '/first.jpg', thumbnail: '/thumb.jpg', alt: '<img onerror=alert(1)>', caption: '<b>caption</b>' },
            { src: '/second.jpg' },
            { src: '/third.jpg' },
            { src: '/fourth.jpg' }
        ];
        const result = formatters.image()(cell(value));
        expect(result.tagName).toBe('SPAN');
        expect(result.style).toMatchObject({ width: '48px', height: '68px' });
        const [image, badge] = result.children;
        expect(image.src).toBe('/thumb.jpg');
        expect(image.loading).toBe('lazy');
        expect(image.style.objectFit).toBe('contain');
        expect(image.alt).toBe('<img onerror=alert(1)>');
        expect(badge.textContent).toBe('+3');
        expect(badge.getAttribute('aria-label')).toBe('3 immagini aggiuntive');
        expect(result.children).toHaveLength(2);
        expect(result.children.filter(child => child.tagName === 'IMG').map(child => child.src)).toEqual(['/thumb.jpg']);
    });

    test('uses one fallback from thumbnail to original, then shows an error', () => {
        const result = formatters.image({ width: 60, height: 40, fit: 'cover' })(cell({ src: '/original.jpg', thumbnail: '/missing.jpg' }));
        const image = result.children[0];
        expect(image.style.objectFit).toBe('cover');
        image.dispatch('error');
        expect(image.src).toBe('/original.jpg');
        image.dispatch('error');
        expect(result.children[0].textContent).toBe('Immagine non disponibile');
        expect(result.children[0].className).toContain('amb-image-placeholder--error');
        const noRetry = formatters.image()(cell('/missing.jpg'));
        noRetry.children[0].dispatch('error');
        expect(noRetry.children[0].textContent).toBe('Immagine non disponibile');
    });

    test('returns fresh non-interactive nodes on rerender and a placeholder for empty values', () => {
        const formatter = formatters.image();
        const first = formatter(cell([]));
        const second = formatter(cell(null));
        const one = formatter(cell('/one.jpg'));
        expect(first).not.toBe(second);
        expect(first.children[0].textContent).toBe('Nessuna immagine');
        expect(first.children[0].tagName).toBe('SPAN');
        expect(one.children).toHaveLength(1);
        expect(one.children[0].tagName).toBe('IMG');
        expect(one.children[0].getAttribute('tabindex')).toBeNull();
    });
});
