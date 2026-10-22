import { normalizeImages } from './image-model.js';

const previewMetadata = new WeakMap();
const viewerMetadata = new WeakMap();

export const getImagePreviewMetadata = element => previewMetadata.get(element);
export const getImageViewerMetadata = element => viewerMetadata.get(element);

const createPlaceholder = (label, extraClass = '') => {
    const placeholder = document.createElement('span');
    placeholder.className = `amb-image-placeholder${extraClass}`;
    placeholder.textContent = label;
    return placeholder;
};

export const renderImage = (value, { width, height, fit, preview, viewer }) => {
    const images = normalizeImages(value);
    const root = document.createElement(viewer && images.length ? 'button' : 'span');
    root.className = 'amb-image';
    root.style.width = `${width}px`;
    root.style.height = `${height}px`;

    if (images.length === 0) {
        root.append(createPlaceholder('Nessuna immagine'));
        return root;
    }

    const first = images[0];
    if (viewer) {
        root.type = 'button';
        root.className += ' amb-image--viewable';
        root.setAttribute('aria-label', images.length > 1
            ? `Apri raccolta di ${images.length} immagini${first.alt ? ': ' + first.alt : ''}`
            : `Apri immagine${first.alt ? ': ' + first.alt : ''}`);
        viewerMetadata.set(root, images);
    }
    if (preview) {
        if (!viewer) root.tabIndex = 0;
        root.className += ' amb-image--previewable';
        previewMetadata.set(root, first);
    }
    const image = document.createElement('img');
    image.className = 'amb-image-thumbnail';
    image.alt = first.alt;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.style.objectFit = fit;

    let retried = false;
    image.addEventListener('error', () => {
        if (!retried && first.thumbnail && first.thumbnail !== first.src) {
            retried = true;
            image.src = first.src;
            return;
        }

        image.replaceWith(createPlaceholder('Immagine non disponibile', ' amb-image-placeholder--error'));
    });
    image.src = first.thumbnail || first.src;
    root.append(image);

    if (images.length > 1) {
        const badge = document.createElement('span');
        badge.className = 'amb-image-count';
        badge.textContent = `+${images.length - 1}`;
        badge.setAttribute('aria-label', `${images.length - 1} immagini aggiuntive`);
        root.append(badge);
    }

    return root;
};
