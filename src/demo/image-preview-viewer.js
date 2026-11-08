import { AMB } from '../index.js';
import { createDemoColumnGuide } from './utils/demo-column-guide.js';
import { createDemoCommandGuideToolbar } from './utils/demo-command-guide-toolbar.js';
import { createDemoActionTutorial } from './components/demo-action-tutorial.js';
import { publicExampleTranslations } from './example-copy.js';
import { demoIcon } from './demo-icons.js';
import { imagePreviewViewerCatalog } from './image-preview-viewer-catalog.js';
import './image-preview-viewer.css';

const prefix = 'examples.imagePreviewViewer';
const language = () => document.documentElement.lang === 'en' ? 'en' : 'it';
const translate = (locale, key) => publicExampleTranslations[locale][`${prefix}.${key}`];
const translateKey = (locale, key) => publicExampleTranslations[locale][key];
const photo = (locale, id) => {
    const entry = imagePreviewViewerCatalog.photographs[id];
    return {
        src: entry.assetUrl,
        alt: translateKey(locale, entry.formatter.altKey),
        caption: translateKey(locale, entry.formatter.captionKey)
    };
};
const imageRows = locale => imagePreviewViewerCatalog.collections.map(collection => ({
    id: collection.id,
    subject: translateKey(locale, collection.subjectKey),
    description: translateKey(locale, collection.descriptionKey),
    images: collection.photoIds.map(id => photo(locale, id))
}));

const imageFormatter = () => AMB.formatters.image({ width: 152, height: 96, fit: 'contain', preview: true, viewer: true });

export default function imagePreviewViewer(app) {
    app.innerHTML = `
        <div class="demo-image-example">
            <div class="demo-crud-heading">
                <h2 data-i18n="${prefix}.title">Image Preview & Viewer</h2>
                <div class="demo-crud-heading__commands">
                    <button type="button" class="demo-crud-tutorial-launch" data-action="tutorial-launch" aria-controls="image-preview-viewer-tutorial" aria-expanded="false">${demoIcon('tutorialPlay', { size: 21, strokeWidth: 2.6 })}<span>Start tutorial</span></button>
            ${createDemoColumnGuide({
                summary: 'Image Preview & Viewer technical guide', summaryKey: `${prefix}.detailsTitle`,
                summaryIcon: 'guideText', variant: 'technical',
                intro: 'One read-only AMB.table uses the public image formatter to show local photos and galleries. The viewer and its controls are native to AMB Grid.', introKey: `${prefix}.detailsText`,
                points: [
                    { title: 'Preview and opening', titleKey: `${prefix}.point1Title`, description: 'Hover for a preview. Select the image cell and double-click or press Enter or Space to open the viewer.', descriptionKey: `${prefix}.detail1` },
                    { title: 'Gallery navigation', titleKey: `${prefix}.point2Title`, description: 'Browse the collection with the navigation buttons or left and right arrows.', descriptionKey: `${prefix}.detail2` },
                    { title: 'Zoom and natural size', titleKey: `${prefix}.point3Title`, description: 'Zoom using the controls, mouse wheel or arrow keys; use 1:1 for natural size and Reset for the fitted view.', descriptionKey: `${prefix}.detail3` },
                    { title: 'Captions', titleKey: `${prefix}.point4Title`, description: 'Each photo has a caption and image number.', descriptionKey: `${prefix}.detail4` },
                    { title: 'Keyboard and closing', titleKey: `${prefix}.point5Title`, description: 'Use Tab and Enter for controls; Esc closes the viewer and restores focus.', descriptionKey: `${prefix}.detail5` }
                ],
                columns: [
                    { title: 'Record ID', badge: 'ID', description: 'Unique identifier for each collection.', descriptionKey: `${prefix}.column.idDescription` },
                    { title: 'Subject', badge: 'TEXT', description: 'Short subject of the photo collection.', descriptionKey: `${prefix}.column.subjectDescription` },
                    { title: 'Images', badge: 'IMAGE', description: 'Thumbnail, preview and native viewer for one or more photos.', descriptionKey: `${prefix}.column.imagesDescription` },
                    { title: 'Description', badge: 'TEXT', description: 'Brief context for the photograph or group.', descriptionKey: `${prefix}.column.descriptionDescription` }
                ]
            })}
                </div>
            </div>
            <p class="demo-note" data-i18n="${prefix}.intro">Explore three photo collections featuring thirteen images of great cities, Italian landscapes, and vintage objects. Select an image cell, then double-click or press Enter or Space to open its gallery.</p>
            <div class="demo-action-tutorial-host"></div>
            <div class="demo-table-workbench">
                <div class="demo-command-guide-host"></div>
                <div id="image-preview-viewer-table" class="demo-business-grid demo-business-grid--viewport demo-image-grid"></div>
            </div>
        </div>
    `;

    let currentLocale = language();
    let destroyed = false;
    let grid = null;
    let tutorialState = null;
    let tutorialStarted = false;
    let highlightedControl = null;
    let scenarioGeneration = 0;
    const tutorialLaunch = app.querySelector('[data-action="tutorial-launch"]');
    const tutorialLaunchLabel = tutorialLaunch.querySelector('span');
    const technicalGuide = app.querySelector('.demo-crud-heading .demo-disclosure--technical');
    let activeSession = null;
    const tutorial = createDemoActionTutorial({
        host: app.querySelector('.demo-action-tutorial-host'),
        variant: 'crud', tutorialCopyPrefix: prefix,
        initiallyHidden: true, externalOpenButton: tutorialLaunch, panelId: 'image-preview-viewer-tutorial',
        locale: currentLocale,
        titleKey: `${prefix}.tutorialTitle`,
        completedKey: `${prefix}.tutorialCompleted`,
        onRestart: resetTutorialScenario,
        onCompleteAction: () => true,
        onCompleteSuccess: finishTutorial,
        onStateChange: state => {
            tutorialState = state;
            tutorialLaunch.hidden = !state.hidden;
            tutorialLaunch.setAttribute('aria-expanded', String(!state.hidden));
            syncTutorialLaunchLabel();
            syncTutorialHighlight();
        },
        steps: [
            {
                id: 'navigate-city', actionId: 'viewer-closed', instructionKey: `${prefix}.tutorialGallery`,
                isComplete: ({ galleryId, tokyoAfterNewYork }) => galleryId === 'CITY-001' && tokyoAfterNewYork === true
            },
            {
                id: 'zoom-seaside', actionId: 'viewer-closed', instructionKey: `${prefix}.tutorialZoom`,
                isComplete: ({ galleryId, zoomed }) => galleryId === 'SEA-001' && zoomed === true
            },
            {
                id: 'natural-size-retro', actionId: 'viewer-closed', instructionKey: `${prefix}.tutorialNaturalSize`,
                isComplete: ({ galleryId, naturalSize }) => galleryId === 'RETRO-001' && naturalSize === true
            }
        ]
    });
    const commandGuideToolbar = createDemoCommandGuideToolbar(app, { profile: 'imageReadonly' });
    grid = AMB.table({
        selector: '#image-preview-viewer-table', toolbar: { buttons: [commandGuideToolbar.button] }, layout: 'fitColumns', data: imageRows(currentLocale),
        columns: [
            { title: translate(currentLocale, 'column.id'), field: 'id', minWidth: 78, widthGrow: 0.55, cssClass: 'demo-cell--passive' },
            { title: translate(currentLocale, 'column.subject'), field: 'subject', minWidth: 112, widthGrow: 1.15, cssClass: 'demo-cell--passive' },
            { title: translate(currentLocale, 'column.images'), field: 'images', minWidth: 180, widthGrow: 1.2, formatter: imageFormatter() },
            { title: translate(currentLocale, 'column.description'), field: 'description', minWidth: 175, widthGrow: 1.65, cssClass: 'demo-cell--passive' }
        ]
    });
    commandGuideToolbar.mount();
    tutorialLaunch.addEventListener('click', handleTutorialLaunch);
    grid.table.on('renderComplete', syncTutorialHighlight);
    grid.table.on('scrollVertical', syncTutorialHighlight);
    grid.table.on('scrollHorizontal', syncTutorialHighlight);
    syncTutorialHighlight();

    const gallerySources = new Map(imagePreviewViewerCatalog.collections.map(collection => [
        collection.id,
        collection.photoIds.map(id => imagePreviewViewerCatalog.photographs[id].assetUrl)
    ]));
    const galleryForSource = source => {
        if (!(source instanceof HTMLElement) || !source.children.length) return null;
        const sources = Array.from(source.children, image => image.tagName === 'IMG' ? image.dataset.original : null);
        for (const [id, expected] of gallerySources) {
            if (sources.length === expected.length && sources.every((src, index) => src === expected[index])) return id;
        }
        return null;
    };
    const onViewerShown = event => {
        activeSession?.aborter.abort();
        activeSession?.resizeObserver?.disconnect();
        const galleryId = galleryForSource(event.target);
        if (!galleryId) {
            activeSession = null;
            return;
        }
        activeSession = {
            source: event.target,
            galleryId,
            context: tutorial.capture(),
            generation: scenarioGeneration,
            newYorkViewed: false,
            tokyoAfterNewYork: false,
            currentIndex: null,
            currentImage: null,
            initialRatio: null,
            zoomed: false,
            naturalSize: false,
            pendingNaturalAction: null,
            aborter: new AbortController(),
            resizeObserver: null
        };
        clearTutorialHighlight();
        const session = activeSession;
        queueMicrotask(() => {
            if (destroyed || activeSession !== session) return;
            const root = session.source.ownerDocument.querySelector('.amb-image-viewer');
            if (!root) return;
            root.classList.add('demo-image-example-viewer');
            const updateCaptionOffset = () => {
                const rootBounds = root.getBoundingClientRect();
                const controls = [...root.querySelectorAll('.viewer-footer, .viewer-toolbar, .viewer-navbar, .viewer-title')];
                const occupied = controls.filter(element => element.getClientRects().length)
                    .map(element => rootBounds.bottom - element.getBoundingClientRect().top);
                root.style.setProperty('--demo-image-controls-height', `${Math.max(0, ...occupied)}px`);
            };
            session.resizeObserver = new ResizeObserver(updateCaptionOffset);
            session.resizeObserver.observe(root);
            root.querySelectorAll('.viewer-footer, .viewer-toolbar, .viewer-navbar, .viewer-title')
                .forEach(element => session.resizeObserver.observe(element));
            updateCaptionOffset();
            const trackNaturalAction = event => {
                const control = event.target.closest?.('[data-viewer-action="one-to-one"]');
                if (!control || !root.contains(control) || session.galleryId !== 'RETRO-001'
                    || session.context?.stepId !== 'natural-size-retro' || session.currentIndex !== 0
                    || (event.type === 'keydown' && event.key !== 'Enter')) return;
                session.pendingNaturalAction = { event, image: session.currentImage, index: session.currentIndex };
            };
            root.addEventListener('click', trackNaturalAction, { capture: true, signal: session.aborter.signal });
            root.addEventListener('keydown', trackNaturalAction, { capture: true, signal: session.aborter.signal });
        });
    };
    const onViewerViewed = event => {
        const session = activeSession;
        if (!session || session.source !== event.target) return;
        const index = event.detail?.index;
        const image = event.detail?.image;
        if (!Number.isInteger(index) || !image?.naturalWidth || !image?.naturalHeight) return;
        session.currentIndex = index;
        session.currentImage = image;
        session.initialRatio = parseFloat(image.style.width) / image.naturalWidth;
        session.pendingNaturalAction = null;
        if (session.galleryId === 'CITY-001') {
            if (index === 0) session.newYorkViewed = true;
            if (index === 1 && session.newYorkViewed) session.tokyoAfterNewYork = true;
        }
    };
    const onViewerZoomed = event => {
        const session = activeSession;
        if (!session || destroyed || session.source !== event.target || session.generation !== scenarioGeneration) return;
        const { ratio, oldRatio, originalEvent } = event.detail || {};
        if (!Number.isFinite(ratio) || !session.currentImage || !Number.isInteger(session.currentIndex)) return;
        if (session.context?.stepId === 'zoom-seaside' && session.galleryId === 'SEA-001'
            && originalEvent && Number.isFinite(session.initialRatio) && ratio > oldRatio
            && ratio > session.initialRatio + 0.001) session.zoomed = true;
        const pending = session.pendingNaturalAction;
        if (session.context?.stepId === 'natural-size-retro' && session.galleryId === 'RETRO-001'
            && pending?.event === originalEvent && pending.index === 0 && pending.image === session.currentImage
            && Math.abs(ratio - 1) < 0.001
            && Math.abs(parseFloat(session.currentImage.style.width) / session.currentImage.naturalWidth - 1) < 0.001) {
            session.naturalSize = true;
        }
        session.pendingNaturalAction = null;
    };
    const onViewerHidden = event => {
        const session = activeSession;
        if (!session || session.source !== event.target) return;
        activeSession = null;
        session.aborter.abort();
        session.resizeObserver?.disconnect();
        tutorial.notify('viewer-closed', { galleryId: session.galleryId, tokyoAfterNewYork: session.tokyoAfterNewYork,
            zoomed: session.zoomed, naturalSize: session.naturalSize }, session.context);
        syncTutorialHighlight();
    };
    document.addEventListener('shown', onViewerShown, true);
    document.addEventListener('viewed', onViewerViewed, true);
    document.addEventListener('zoomed', onViewerZoomed, true);
    document.addEventListener('hidden', onViewerHidden, true);

    const updateHeader = (field, key) => {
        const title = app.querySelector(`#image-preview-viewer-table .tabulator-col[tabulator-field="${field}"] .tabulator-col-title`);
        if (title) title.textContent = translate(currentLocale, key);
    };
    const onLanguageChange = event => {
        const nextLocale = event.detail?.language === 'en' ? 'en' : 'it';
        if (destroyed || nextLocale === currentLocale) return;
        currentLocale = nextLocale;
        syncTutorialLaunchLabel();
        const headers = [['id', 'column.id'], ['subject', 'column.subject'], ['description', 'column.description'], ['images', 'column.images']];
        headers.forEach(([field, key]) => updateHeader(field, key));
        void grid.setData(imageRows(currentLocale));
    };
    window.addEventListener('amb-demo-language-change', onLanguageChange);

    return {
        destroy() {
            if (destroyed) return;
            destroyed = true;
            scenarioGeneration += 1;
            clearTutorialHighlight();
            tutorialLaunch.removeEventListener('click', handleTutorialLaunch);
            grid.table.off('renderComplete', syncTutorialHighlight);
            grid.table.off('scrollVertical', syncTutorialHighlight);
            grid.table.off('scrollHorizontal', syncTutorialHighlight);
            document.removeEventListener('shown', onViewerShown, true);
            document.removeEventListener('viewed', onViewerViewed, true);
            document.removeEventListener('zoomed', onViewerZoomed, true);
            document.removeEventListener('hidden', onViewerHidden, true);
            activeSession?.aborter.abort();
            activeSession?.resizeObserver?.disconnect();
            activeSession = null;
            window.removeEventListener('amb-demo-language-change', onLanguageChange);
            commandGuideToolbar.destroy();
            tutorial.destroy();
            grid.destroy();
        }
    };

    function syncTutorialLaunchLabel() {
        tutorialLaunchLabel.textContent = translate(language(), tutorialStarted ? 'tutorialResume' : 'tutorialStart');
    }

    function handleTutorialLaunch() {
        if (destroyed || !tutorialState?.hidden) return;
        tutorialLaunch.setAttribute('data-demo-crud-rays-consumed', '');
        const resuming = tutorialStarted;
        tutorialStarted = true;
        if (resuming) tutorial.reopen();
        else void tutorial.restart();
    }

    async function resetTutorialScenario() {
        const generation = ++scenarioGeneration;
        const session = activeSession;
        activeSession = null;
        session?.aborter.abort();
        session?.resizeObserver?.disconnect();
        clearTutorialHighlight();
        session?.source.ownerDocument.querySelector('.amb-image-viewer .viewer-button')?.click();
        try {
            await grid.setData(imageRows(currentLocale));
            if (destroyed || generation !== scenarioGeneration) return false;
            syncTutorialHighlight();
            return true;
        } catch { return false; }
    }

    function finishTutorial({ openGuide }) {
        tutorialStarted = false;
        syncTutorialLaunchLabel();
        if (openGuide) {
            technicalGuide.open = true;
            technicalGuide.querySelector('summary').focus({ preventScroll: true });
        } else tutorialLaunch.focus({ preventScroll: true });
    }

    function clearTutorialHighlight() {
        highlightedControl?.classList.remove('demo-crud-tutorial-target', 'demo-crud-tutorial-target--pulse', 'demo-crud-tutorial-target--rays');
        highlightedControl = null;
    }

    function syncTutorialHighlight() {
        if (!grid || destroyed || activeSession || !tutorialState || tutorialState.hidden || tutorialState.complete || tutorialState.resetting || tutorialState.restartFailed || tutorialState.destroyed) {
            clearTutorialHighlight();
            return;
        }
        const id = { 'navigate-city': 'CITY-001', 'zoom-seaside': 'SEA-001', 'natural-size-retro': 'RETRO-001' }[tutorialState.stepId];
        const target = grid.table.getRow(id)?.getCell('images')?.getElement()?.querySelector('.amb-image--viewable');
        if (target?.isConnected && target.getClientRects().length > 0) {
            if (highlightedControl === target && target.classList.contains('demo-crud-tutorial-target--pulse')) return;
            clearTutorialHighlight();
            target.classList.add('demo-crud-tutorial-target', 'demo-crud-tutorial-target--pulse', 'demo-crud-tutorial-target--rays');
            highlightedControl = target;
        } else clearTutorialHighlight();
    }
}
