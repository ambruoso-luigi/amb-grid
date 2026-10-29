import { AMB } from '../index.js';
import { createDemoColumnGuide } from './utils/demo-column-guide.js';
import { createDemoCommandGuideToolbar } from './utils/demo-command-guide-toolbar.js';
import { createDemoActionTutorial } from './components/demo-action-tutorial.js';
import { publicExampleTranslations } from './example-copy.js';
import lake from '../../test/images/landscape-01.jpg';
import lakeThumbnail from '../../test/images/thumb-landscape-01.jpg';
import sunflowers from '../../test/images/landscape-02.jpg';
import toucan from '../../test/images/portrait-01.jpg';
import village from '../../test/images/portrait-02.jpg';
import travel from '../../test/images/square-01.jpg';
import skyline from '../../test/images/panorama-01.jpg';
import market from '../../test/images/large-01.jpg';
import './image-preview-viewer.css';

const prefix = 'examples.imagePreviewViewer';
const photoSources = { lake, sunflowers, toucan, village, travel, skyline, market };
const photoThumbnails = { lake: lakeThumbnail };
const language = () => document.documentElement.lang === 'en' ? 'en' : 'it';
const translate = (locale, key) => publicExampleTranslations[locale][`${prefix}.${key}`];
const photo = (locale, key) => ({
    src: photoSources[key],
    ...(photoThumbnails[key] ? { thumbnail: photoThumbnails[key] } : {}),
    alt: translate(locale, `photo.${key}`),
    caption: translate(locale, `photo.${key}`)
});

const imageRows = locale => [
    { id: 'TRV-001', subject: translate(locale, 'row.horizons'), description: translate(locale, 'rowDescription.horizons'), images: ['lake', 'toucan', 'skyline'].map(key => photo(locale, key)) },
    { id: 'TRV-002', subject: translate(locale, 'row.wildlife'), description: translate(locale, 'rowDescription.wildlife'), images: ['toucan', 'village'].map(key => photo(locale, key)) },
    { id: 'TRV-003', subject: translate(locale, 'row.details'), description: translate(locale, 'rowDescription.details'), images: ['travel', 'market'].map(key => photo(locale, key)) },
    { id: 'TRV-004', subject: translate(locale, 'row.countryside'), description: translate(locale, 'rowDescription.countryside'), images: ['sunflowers', 'lake'].map(key => photo(locale, key)) },
    { id: 'CITY-001', subject: translate(locale, 'row.skyline'), description: translate(locale, 'rowDescription.skyline'), images: ['skyline', 'village'].map(key => photo(locale, key)) },
    { id: 'CITY-002', subject: translate(locale, 'row.market'), description: translate(locale, 'rowDescription.market'), images: [photo(locale, 'market')] },
    { id: 'CITY-003', subject: translate(locale, 'row.walk'), description: translate(locale, 'rowDescription.walk'), images: ['village', 'travel'].map(key => photo(locale, key)) }
];

const imageFormatter = () => AMB.formatters.image({ width: 152, height: 96, fit: 'contain', preview: true, viewer: true });

export default function imagePreviewViewer(app) {
    app.innerHTML = `
        <div class="demo-image-example">
            <h2 data-i18n="${prefix}.title">Image Preview & Viewer</h2>
            <p class="demo-note" data-i18n="${prefix}.intro">Explore seven photo collections in one read-only table. Hover for a preview or open the viewer to browse, zoom and pan.</p>
            ${createDemoColumnGuide({
                summary: 'How this table works', summaryKey: `${prefix}.detailsTitle`,
                summaryMeta: 'Images · preview · viewer', summaryMetaKey: `${prefix}.guideMeta`, summaryIcon: 'help', variant: 'technical',
                intro: 'One read-only AMB.table uses the public image formatter to show local photos and galleries. The viewer and its controls are native to AMB Grid.', introKey: `${prefix}.detailsText`,
                points: [
                    { title: 'Image formatter', titleKey: `${prefix}.point1Title`, description: 'AMB.formatters.image() renders thumbnails without changing their proportions; each value can contain one photo or a collection.', descriptionKey: `${prefix}.detail1` },
                    { title: 'Preview and viewer', titleKey: `${prefix}.point2Title`, description: 'Hover shows a preview. Click or press Enter to open the viewer, with zoom, pan, browsing and keyboard dismissal.', descriptionKey: `${prefix}.detail2` },
                    { title: 'Galleries', titleKey: `${prefix}.point3Title`, description: 'The badge counts additional photos. Browsing stays within the open collection.', descriptionKey: `${prefix}.detail3` },
                    { title: 'Cleanup', titleKey: `${prefix}.point4Title`, description: 'Changing examples destroys the grid and command guide; the native runtime removes the preview and viewer.', descriptionKey: `${prefix}.detail4` }
                ],
                columns: [
                    { title: 'Record ID', badge: 'ID', description: 'Unique identifier for each collection.', descriptionKey: `${prefix}.column.idDescription` },
                    { title: 'Subject', badge: 'TEXT', description: 'Short subject of the photo collection.', descriptionKey: `${prefix}.column.subjectDescription` },
                    { title: 'Images', badge: 'IMAGE', description: 'Thumbnail, preview and native viewer for one or more photos.', descriptionKey: `${prefix}.column.imagesDescription` },
                    { title: 'Description', badge: 'TEXT', description: 'Brief context for the photograph or group.', descriptionKey: `${prefix}.column.descriptionDescription` }
                ]
            })}
            <div class="demo-table-workbench">
                <div class="demo-action-tutorial-host"></div>
                <div class="demo-command-guide-host"></div>
                <div id="image-preview-viewer-table" class="demo-business-grid demo-business-grid--viewport demo-image-grid"></div>
            </div>
        </div>
    `;

    let currentLocale = language();
    let destroyed = false;
    let activeSession = null;
    const tutorial = createDemoActionTutorial({
        host: app.querySelector('.demo-action-tutorial-host'),
        locale: currentLocale,
        titleKey: `${prefix}.tutorialTitle`,
        completedKey: `${prefix}.tutorialCompleted`,
        steps: [
            {
                id: 'explore-gallery', actionId: 'viewer-closed', instructionKey: `${prefix}.tutorialGallery`,
                isComplete: ({ galleryId, navigated }) => galleryId === 'TRV-001' && navigated === true
            },
            {
                id: 'explore-portrait', actionId: 'viewer-closed', instructionKey: `${prefix}.tutorialPortrait`,
                isComplete: ({ galleryId, portraitViewed, focusRestored }) => galleryId === 'TRV-002'
                    && portraitViewed === true && focusRestored === true
            }
        ]
    });
    const commandGuideToolbar = createDemoCommandGuideToolbar(app, { profile: 'imageReadonly' });
    const grid = AMB.table({
        selector: '#image-preview-viewer-table', toolbar: { buttons: [commandGuideToolbar.button] }, layout: 'fitColumns', data: imageRows(currentLocale),
        columns: [
            { title: translate(currentLocale, 'column.id'), field: 'id', minWidth: 78, widthGrow: 0.55, cssClass: 'demo-cell--passive' },
            { title: translate(currentLocale, 'column.subject'), field: 'subject', minWidth: 112, widthGrow: 1.15, cssClass: 'demo-cell--passive' },
            { title: translate(currentLocale, 'column.images'), field: 'images', minWidth: 180, widthGrow: 1.2, formatter: imageFormatter() },
            { title: translate(currentLocale, 'column.description'), field: 'description', minWidth: 175, widthGrow: 1.65, cssClass: 'demo-cell--passive' }
        ]
    });
    commandGuideToolbar.mount();

    const gallerySources = new Map([
        ['TRV-001', [lake, toucan, skyline]],
        ['TRV-002', [toucan, village]]
    ]);
    const galleryForSource = source => {
        if (!(source instanceof HTMLElement) || !source.children.length) return null;
        const sources = Array.from(source.children, image => image.tagName === 'IMG' ? image.dataset.original : null);
        for (const [id, expected] of gallerySources) {
            if (sources.length === expected.length && sources.every((src, index) => src === expected[index])) return id;
        }
        return null;
    };
    const onViewerShown = event => {
        const galleryId = galleryForSource(event.target);
        if (!galleryId) {
            activeSession = null;
            return;
        }
        activeSession = {
            source: event.target,
            galleryId,
            context: tutorial.capture(),
            firstViewedIndex: null,
            navigated: false,
            portraitViewed: false
        };
    };
    const onViewerViewed = event => {
        const session = activeSession;
        if (!session || session.source !== event.target) return;
        const index = event.detail?.index;
        const image = event.detail?.image;
        if (!Number.isInteger(index) || !image?.naturalWidth || !image?.naturalHeight) return;
        if (session.firstViewedIndex === null) session.firstViewedIndex = index;
        else if (index !== session.firstViewedIndex) session.navigated = true;
        if (session.galleryId === 'TRV-002' && image.naturalHeight > image.naturalWidth) {
            session.portraitViewed = true;
        }
    };
    const onViewerHidden = event => {
        const session = activeSession;
        if (!session || session.source !== event.target) return;
        activeSession = null;
        if (session.galleryId === 'TRV-001' && session.navigated) {
            tutorial.notify('viewer-closed', { galleryId: session.galleryId, navigated: true }, session.context);
        }
        if (session.galleryId === 'TRV-002' && session.portraitViewed) {
            queueMicrotask(() => {
                if (destroyed || activeSession) return;
                const owner = app.querySelector('#image-preview-viewer-table');
                const focusRestored = owner === document.activeElement || owner?.contains(document.activeElement);
                tutorial.notify('viewer-closed', { galleryId: session.galleryId, portraitViewed: true, focusRestored }, session.context);
            });
        }
    };
    document.addEventListener('shown', onViewerShown, true);
    document.addEventListener('viewed', onViewerViewed, true);
    document.addEventListener('hidden', onViewerHidden, true);

    const updateHeader = (field, key) => {
        const title = app.querySelector(`#image-preview-viewer-table .tabulator-col[tabulator-field="${field}"] .tabulator-col-title`);
        if (title) title.textContent = translate(currentLocale, key);
    };
    const onLanguageChange = event => {
        const nextLocale = event.detail?.language === 'en' ? 'en' : 'it';
        if (destroyed || nextLocale === currentLocale) return;
        currentLocale = nextLocale;
        const headers = [['id', 'column.id'], ['subject', 'column.subject'], ['description', 'column.description'], ['images', 'column.images']];
        headers.forEach(([field, key]) => updateHeader(field, key));
        void grid.setData(imageRows(currentLocale));
    };
    window.addEventListener('amb-demo-language-change', onLanguageChange);

    return {
        destroy() {
            if (destroyed) return;
            destroyed = true;
            document.removeEventListener('shown', onViewerShown, true);
            document.removeEventListener('viewed', onViewerViewed, true);
            document.removeEventListener('hidden', onViewerHidden, true);
            activeSession = null;
            window.removeEventListener('amb-demo-language-change', onLanguageChange);
            commandGuideToolbar.destroy();
            tutorial.destroy();
            grid.destroy();
        }
    };
}
