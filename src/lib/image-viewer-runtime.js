import Viewer from 'viewerjs';
import { createFocusTrap } from '../ui/focus-trap.js';
import { getImageViewerMetadata } from './image-renderer.js';
import { closeImagePreview } from './image-preview-runtime.js';

const activeByDocument = new WeakMap();
let lastTouchEndAt = 0;

const openCollection = (items, trigger, owner) => {
    const doc = owner.ownerDocument;
    activeByDocument.get(doc)?.dispose(false);
    closeImagePreview(doc);

    const host = doc.createElement('div');
    host.hidden = true;
    host.className = 'amb-image-viewer-source';
    for (const item of items) {
        const image = doc.createElement('img');
        image.src = item.thumbnail || item.src;
        image.dataset.original = item.src;
        image.alt = item.alt;
        host.append(image);
    }
    doc.body.append(host);

    const aborter = new AbortController();
    const inertBefore = new Map();
    let disposed = false;
    let correctingMove = false;
    let trap;
    let status;
    const session = {
        owner,
        viewer: null,
        dispose(restore = true) {
            if (disposed) return;
            disposed = true;
            aborter.abort();
            trap?.deactivate({ restore: false });
            session.viewer?.destroy();
            host.remove();
            for (const [element, wasInert] of inertBefore) element.inert = wasInert;
            inertBefore.clear();
            if (activeByDocument.get(doc) === session) activeByDocument.delete(doc);
            if (restore) {
                const target = trigger?.isConnected ? trigger : owner.isConnected ? owner : null;
                if (target) {
                    const previousTabIndex = target.getAttribute('tabindex');
                    if (target === owner && previousTabIndex === null) {
                        target.tabIndex = -1;
                        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
                    }
                    target.focus({ preventScroll: true });
                }
            }
            trigger = null;
        }
    };
    activeByDocument.set(doc, session);

    const guardCompatibilityClick = () => {
        const root = session.viewer.viewer;
        let guardUntil = lastTouchEndAt > 0 && performance.now() - lastTouchEndAt < 350
            ? lastTouchEndAt + 350
            : 0;
        root.addEventListener('pointerdown', event => {
            if (event.pointerType !== 'touch') return;
            guardUntil = 0;
            if (session.viewer.viewed) {
                const { imageData, initialImageData } = session.viewer;
                session.viewer.options.slideOnTouch = imageData.ratio <= initialImageData.ratio + 0.001;
            }
        }, { capture: true, signal: aborter.signal });
        root.addEventListener('pointerup', event => {
            if (event.pointerType === 'touch') lastTouchEndAt = performance.now();
        }, { signal: aborter.signal });
        const settleTouch = event => {
            if (event.pointerType === 'touch' && root.contains(event.target)
                && !disposed && !session.viewer.viewing) correctPosition();
        };
        doc.addEventListener('pointerup', settleTouch, { signal: aborter.signal });
        doc.addEventListener('pointercancel', settleTouch, { signal: aborter.signal });
        root.addEventListener('click', event => {
            if (event.isTrusted
                && performance.now() < guardUntil
                && (event.pointerType === 'touch' || event.sourceCapabilities?.firesTouchEvents === true)) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        }, { capture: true, signal: aborter.signal });
    };

    const coordinateDialogFocus = () => {
        const root = session.viewer.viewer;
        const previousZIndex = root.style.zIndex;
        let suspended = false;
        doc.addEventListener('focusin', event => {
            if (disposed || !session.viewer?.isShown) return;
            if (root.contains(event.target)) {
                if (!suspended) return;
                suspended = false;
                session.viewer.options.keyboard = true;
                root.removeAttribute('aria-hidden');
                root.setAttribute('aria-modal', 'true');
                root.style.zIndex = previousZIndex;
                return;
            }
            const dialog = event.target.closest?.('.amb-lookup-dialog, .teh-confirm-dialog, [role="dialog"]');
            if (!dialog || dialog === root || root.contains(dialog) || suspended) return;
            suspended = true;
            session.viewer.options.keyboard = false;
            root.setAttribute('aria-hidden', 'true');
            root.removeAttribute('aria-modal');
            const dialogZIndex = Number(doc.defaultView.getComputedStyle(dialog).zIndex);
            root.style.zIndex = String(Number.isFinite(dialogZIndex) ? dialogZIndex - 1 : 9999);
        }, { capture: true, signal: aborter.signal });
    };

    const enhance = () => {
        const root = session.viewer.viewer;
        root.removeAttribute('aria-labelledby');
        root.setAttribute('aria-label', 'Raccolta immagini');
        for (const element of doc.body.children) {
            if (element !== root && element !== host) {
                inertBefore.set(element, element.inert);
                element.inert = true;
            }
        }
        const close = root.querySelector('.viewer-button');
        close.setAttribute('aria-label', 'Chiudi immagini');
        const labels = {
            'zoom-in': 'Ingrandisci', 'zoom-out': 'Riduci', 'one-to-one': 'Dimensione naturale / iniziale',
            reset: 'Fit / Reset', prev: 'Precedente', next: 'Successiva'
        };
        root.querySelectorAll('.viewer-toolbar [data-viewer-action]').forEach(element => {
            element.setAttribute('aria-label', labels[element.dataset.viewerAction]);
        });
        status = doc.createElement('p');
        status.className = 'amb-image-viewer-status';
        status.setAttribute('role', 'status');
        root.append(status);
        trap = createFocusTrap({
            container: root,
            initialFocus: close,
            fallbackFocus: root,
            getElements: () => [...root.querySelectorAll('[tabindex="0"]')].filter(element => (
                element.getClientRects().length && element.getAttribute('aria-disabled') !== 'true'
            ))
        });
        trap.activate();
        root.addEventListener('keydown', event => {
            if (trap.handleKeydown(event)) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                session.viewer.hide(true);
            } else if (event.key === ' ' && event.target.matches('[role="button"]')) {
                event.preventDefault();
                event.stopPropagation();
                event.target.click();
            }
        }, { signal: aborter.signal });
    };

    const sync = index => {
        if (disposed || !status) return;
        const root = session.viewer.viewer;
        const message = `Immagine ${index + 1} di ${items.length}${items[index]?.caption ? ' — ' + items[index].caption : ''}`;
        if (status.textContent !== message) status.textContent = message;
        for (const [action, disabled] of [['prev', index === 0], ['next', index === items.length - 1]]) {
            root.querySelectorAll(`[data-viewer-action="${action}"]`).forEach(element => {
                element.setAttribute('aria-disabled', String(disabled));
                element.tabIndex = disabled ? -1 : 0;
            });
        }
        const list = root.querySelector('.viewer-list');
        list.setAttribute('aria-label', 'Miniature delle immagini');
        list.querySelectorAll(':scope > li').forEach(element => {
            element.setAttribute('aria-label', `Immagine ${Number(element.dataset.index) + 1} di ${items.length}`);
            element.removeAttribute('aria-selected');
            if (Number(element.dataset.index) === index) element.setAttribute('aria-current', 'true');
            else element.removeAttribute('aria-current');
        });
    };

    const boundedPosition = (x, y) => {
        const { imageData, initialImageData, viewerData } = session.viewer;
        if (!imageData || !viewerData) return { x, y };
        const bound = (position, size, extent, initialPosition, initialSize) => (
            size <= extent
                ? initialPosition + (initialSize - size) / 2
                : Math.max(extent - size, Math.min(0, position))
        );
        return {
            x: bound(x, imageData.width, viewerData.width, initialImageData.x, initialImageData.width),
            y: bound(y, imageData.height, viewerData.height, initialImageData.y, initialImageData.height)
        };
    };

    const correctPosition = () => {
        if (disposed || !session.viewer?.viewed) return;
        const { x, y } = session.viewer.imageData;
        const bounded = boundedPosition(x, y);
        if (Math.abs(bounded.x - x) > 0.5 || Math.abs(bounded.y - y) > 0.5) {
            session.viewer.moveTo(bounded.x, bounded.y);
        }
    };

    const viewer = new Viewer(host, {
        url: 'data-original', initialViewIndex: 0, loop: false, preload: false,
        rotatable: false, scalable: false, rotateOnGesture: false, rotateOnTouch: false,
        autoplay: false, fullscreen: false, transition: false, focus: false,
        keyboard: true, zIndex: 11000, slideOnWheel: false,
        toolbar: { zoomIn: true, zoomOut: true, oneToOne: true, reset: true, prev: true, next: true },
        title: image => image.alt,
        shown() { guardCompatibilityClick(); enhance(); coordinateDialogFocus(); },
        view(event) {
            sync(event.detail.index);
            event.detail.image.addEventListener('error', () => {
                if (!disposed) {
                    sync(event.detail.index);
                    status.textContent = `Immagine ${event.detail.index + 1}: originale non disponibile`;
                }
            }, { once: true, signal: aborter.signal });
        },
        viewed(event) { sync(event.detail.index); },
        move(event) {
            if (disposed || correctingMove) return;
            const { x, y, oldX, oldY, originalEvent } = event.detail;
            const { imageData, viewerData } = session.viewer;
            const touchMove = originalEvent?.pointerType === 'touch' || originalEvent?.type === 'touchmove';
            if (touchMove && session.viewer.options.slideOnTouch
                && imageData.width <= viewerData.width && imageData.height <= viewerData.height) return;
            const bounded = boundedPosition(x, y);
            if (Math.abs(bounded.x - x) <= 0.5 && Math.abs(bounded.y - y) <= 0.5) return;
            event.preventDefault();
            if (Math.abs(bounded.x - oldX) <= 0.5 && Math.abs(bounded.y - oldY) <= 0.5) return;
            correctingMove = true;
            try {
                session.viewer.moveTo(bounded.x, bounded.y);
            } finally {
                correctingMove = false;
            }
        },
        zoomed() { correctPosition(); },
        hidden() { session.dispose(); }
    });
    session.viewer = viewer;
    viewer.show(true);
    return session;
};

export const createImageViewerRuntime = tableElement => {
    if (!tableElement) return { destroy() {} };
    const aborter = new AbortController();
    const doc = tableElement.ownerDocument;
    tableElement.addEventListener('keydown', event => {
        const trigger = event.target.closest?.('.amb-image--viewable');
        if (!trigger || !tableElement.contains(trigger) || !['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        trigger.click();
    }, { capture: true, signal: aborter.signal });
    tableElement.addEventListener('click', event => {
        const trigger = event.target.closest?.('.amb-image--viewable');
        if (!trigger || !tableElement.contains(trigger)) return;
        const items = getImageViewerMetadata(trigger);
        if (!items?.length) return;
        openCollection(items, trigger, tableElement);
    }, { signal: aborter.signal });

    return {
        destroy() {
            aborter.abort();
            const active = activeByDocument.get(doc);
            if (active && active.owner === tableElement) active.dispose(false);
        }
    };
};
