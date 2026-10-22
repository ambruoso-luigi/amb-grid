import { getImagePreviewMetadata } from './image-renderer.js';

const activeByDocument = new WeakMap();
export const closeImagePreview = doc => activeByDocument.get(doc)?.close();
const DELAY_MS = 250;
const GAP = 10;
const MARGIN = 12;
let previewId = 0;

export const hasImagePreviewFormatter = columns => (columns || []).some(column => (
    column?.formatter?._ambFormatterType === 'image'
    || hasImagePreviewFormatter(column?.columns)
));

export const getImagePreviewPosition = (target, overlay, viewport) => {
    const maxLeft = Math.max(MARGIN, viewport.width - overlay.width - MARGIN);
    const maxTop = Math.max(MARGIN, viewport.height - overlay.height - MARGIN);
    const rightSpace = viewport.width - target.right - GAP - MARGIN;
    const leftSpace = target.left - GAP - MARGIN;
    const belowSpace = viewport.height - target.bottom - GAP - MARGIN;
    const aboveSpace = target.top - GAP - MARGIN;
    const left = rightSpace >= overlay.width
        ? target.right + GAP
        : leftSpace >= overlay.width
            ? target.left - GAP - overlay.width
            : rightSpace >= leftSpace
                ? target.right + GAP
                : target.left - GAP - overlay.width;
    const top = belowSpace >= overlay.height
        ? target.bottom + GAP
        : aboveSpace >= overlay.height
            ? target.top - GAP - overlay.height
            : target.top;

    return {
        left: Math.min(maxLeft, Math.max(MARGIN, left)),
        top: Math.min(maxTop, Math.max(MARGIN, top))
    };
};

export const createImagePreviewRuntime = tableElement => {
    if (!tableElement) return { destroy() {} };

    const doc = tableElement.ownerDocument;
    const win = doc.defaultView;
    const delegated = new AbortController();
    let session = null;
    let destroyed = false;

    const close = () => {
        if (!session) return;
        const old = session;
        session = null;
        clearTimeout(old.timer);
        old.aborter.abort();
        old.observer?.disconnect();
        old.overlay?.remove();
        if (old.previousDescription === null) old.root.removeAttribute('aria-describedby');
        else if (old.previousDescription !== undefined) old.root.setAttribute('aria-describedby', old.previousDescription);
        if (activeByDocument.get(doc) === old) activeByDocument.delete(doc);
    };

    const isCurrent = candidate => session === candidate
        && !destroyed
        && candidate.root.isConnected
        && tableElement.contains(candidate.root);

    const position = candidate => {
        if (!isCurrent(candidate) || !candidate.overlay) return;
        const box = candidate.overlay.getBoundingClientRect();
        const coords = getImagePreviewPosition(
            candidate.root.getBoundingClientRect(),
            box,
            { width: win.innerWidth, height: win.innerHeight }
        );
        candidate.overlay.style.left = `${coords.left}px`;
        candidate.overlay.style.top = `${coords.top}px`;
    };

    const show = candidate => {
        if (!isCurrent(candidate)) { close(); return; }
        if (candidate.overlay) return;

        const { src, thumbnail, alt, caption } = candidate.data;
        const overlay = doc.createElement('div');
        overlay.className = 'amb-image-preview';
        overlay.id = `amb-image-preview-${++previewId}`;
        overlay.setAttribute('role', 'tooltip');
        overlay.style.maxWidth = `${Math.max(1, Math.min(260, win.innerWidth - 2 * MARGIN))}px`;
        overlay.style.maxHeight = `${Math.max(1, win.innerHeight - 2 * MARGIN)}px`;
        const image = doc.createElement('img');
        image.className = 'amb-image-preview__image';
        image.alt = alt;
        image.hidden = true;
        image.style.maxHeight = `${Math.max(1, Math.min(300, win.innerHeight - 80))}px`;
        const status = doc.createElement('span');
        status.className = 'amb-image-preview__status';
        status.textContent = 'Caricamento immagine';
        overlay.append(image, status);
        if (caption) {
            const label = doc.createElement('span');
            label.className = 'amb-image-preview__caption';
            label.textContent = caption;
            overlay.append(label);
        }

        candidate.overlay = overlay;
        candidate.previousDescription = candidate.root.getAttribute('aria-describedby');
        candidate.root.setAttribute('aria-describedby', overlay.id);
        doc.body.append(overlay);
        position(candidate);

        let fallbackUsed = false;
        image.addEventListener('load', () => {
            if (!isCurrent(candidate)) return;
            image.hidden = false;
            status.remove();
            position(candidate);
        }, { signal: candidate.aborter.signal });
        image.addEventListener('error', () => {
            if (!isCurrent(candidate)) return;
            if (!fallbackUsed && thumbnail && thumbnail !== src) {
                fallbackUsed = true;
                image.src = thumbnail;
                return;
            }
            image.remove();
            status.textContent = 'Immagine non disponibile';
            position(candidate);
        }, { signal: candidate.aborter.signal });
        image.src = src;
    };

    const start = (root, immediate) => {
        const data = getImagePreviewMetadata(root);
        if (destroyed || !data || !root.isConnected || !tableElement.contains(root)) return;
        if (session?.root === root) {
            if (immediate && !session.overlay) {
                clearTimeout(session.timer);
                show(session);
            }
            return;
        }

        const previous = activeByDocument.get(doc);
        if (previous) previous.close();
        const candidate = { root, data, aborter: new AbortController(), close, timer: null, overlay: null, observer: null, previousDescription: undefined };
        session = candidate;
        activeByDocument.set(doc, candidate);
        const signal = candidate.aborter.signal;
        doc.addEventListener('scroll', close, { capture: true, signal });
        win.addEventListener('resize', close, { signal });
        doc.addEventListener('focusin', event => {
            if (!root.contains(event.target)) close();
        }, { capture: true, signal });
        doc.addEventListener('keydown', event => {
            if (event.key !== 'Escape') return;
            const visible = Boolean(candidate.overlay);
            close();
            if (visible) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        }, { capture: true, signal });
        if (win.MutationObserver) {
            candidate.observer = new win.MutationObserver(() => {
                if (!isCurrent(candidate)) close();
            });
            candidate.observer.observe(doc.body, { childList: true, subtree: true });
        }
        if (immediate) show(candidate);
        else candidate.timer = setTimeout(() => show(candidate), DELAY_MS);
    };

    const getRoot = target => target?.closest?.('.amb-image--previewable');
    tableElement.addEventListener('pointerover', event => {
        if (event.pointerType !== 'mouse') return;
        const root = getRoot(event.target);
        if (root && !root.contains(event.relatedTarget)) start(root, false);
    }, { signal: delegated.signal });
    tableElement.addEventListener('pointerout', event => {
        if (event.pointerType !== 'mouse') return;
        const root = getRoot(event.target);
        if (root && !root.contains(event.relatedTarget) && session?.root === root) close();
    }, { signal: delegated.signal });
    tableElement.addEventListener('focusin', event => {
        const root = getRoot(event.target);
        if (root) start(root, true);
    }, { signal: delegated.signal });
    tableElement.addEventListener('focusout', event => {
        const root = getRoot(event.target);
        if (root && !root.contains(event.relatedTarget) && session?.root === root) close();
    }, { signal: delegated.signal });

    return {
        destroy() {
            if (destroyed) return;
            destroyed = true;
            close();
            delegated.abort();
        }
    };
};
