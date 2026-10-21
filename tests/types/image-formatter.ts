import { AMB } from '../../dist-lib/index.js';

const formatImage = AMB.formatters.image({
    width: 48,
    height: 68,
    fit: 'contain',
    preview: true,
    viewer: true
});

const result: HTMLElement = formatImage({
    getValue: () => [
        { src: '/first.jpg', thumbnail: '/first-small.jpg', alt: 'First', caption: 'Caption' },
        { src: 'https://example.test/second.jpg' }
    ]
});
void result;

// @ts-expect-error Fit only accepts contain or cover.
AMB.formatters.image({ fit: 'stretch' });
// @ts-expect-error Width must be numeric.
AMB.formatters.image({ width: '48' });
// @ts-expect-error A source URL must be a string.
formatImage({ getValue: () => ({ src: 42 }) });
