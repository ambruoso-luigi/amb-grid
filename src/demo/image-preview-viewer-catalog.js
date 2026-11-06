import cityNewYorkBrooklynBridge from './assets/image-preview-viewer/citta-new-york-brooklyn-bridge.png';
import cityTokyoShibuyaCrossing from './assets/image-preview-viewer/citta-tokyo-shibuya-crossing.png';
import cityHongKongMongKok from './assets/image-preview-viewer/citta-hong-kong-mong-kok.png';
import cityOsakaDotonbori from './assets/image-preview-viewer/citta-osaka-dotonbori.png';
import seaCalaBrandinchi from './assets/image-preview-viewer/mare-cala-brandinchi.png';
import seaFiordoFurore from './assets/image-preview-viewer/mare-fiordo-furore.png';
import seaSenigalliaRotonda from './assets/image-preview-viewer/mare-senigallia-rotonda.png';
import seaTorreOrsoDueSorelle from './assets/image-preview-viewer/mare-torre-orso-due-sorelle.png';
import seaAtraniCostieraAmalfitana from './assets/image-preview-viewer/mare-atrani-costiera-amalfitana.png';
import retroPiaggioCiaoPubblicita from './assets/image-preview-viewer/vintage-piaggio-ciao-pubblicita.png';
import retroSonyWalkmanPubblicita from './assets/image-preview-viewer/vintage-sony-walkman-pubblicita.png';
import retroCommodore64 from './assets/image-preview-viewer/vintage-commodore-64.png';
import retroMotorolaDynatac8000x from './assets/image-preview-viewer/vintage-motorola-dynatac-8000x.png';

const photoKey = id => `examples.imagePreviewViewer.catalog.photo.${id}`;

const photograph = (id, filename, format, assetUrl) => {
    const key = photoKey(id);
    return {
        id,
        filename,
        assetUrl,
        name: `${key}.name`,
        location: `${key}.location`,
        shortDescription: `${key}.shortDescription`,
        caption: `${key}.caption`,
        tags: `${key}.tags`,
        format,
        formatter: {
            altKey: `${key}.name`,
            captionKey: `${key}.caption`
        }
    };
};

export const imagePreviewViewerCatalog = {
    collections: [
        {
            id: 'CITY-001',
            subjectKey: 'examples.imagePreviewViewer.catalog.city.subject',
            descriptionKey: 'examples.imagePreviewViewer.catalog.city.description',
            photoIds: [
                'cityNewYorkBrooklynBridge',
                'cityTokyoShibuyaCrossing',
                'cityHongKongMongKok',
                'cityOsakaDotonbori'
            ]
        },
        {
            id: 'SEA-001',
            subjectKey: 'examples.imagePreviewViewer.catalog.sea.subject',
            descriptionKey: 'examples.imagePreviewViewer.catalog.sea.description',
            photoIds: [
                'seaCalaBrandinchi',
                'seaFiordoFurore',
                'seaSenigalliaRotonda',
                'seaTorreOrsoDueSorelle',
                'seaAtraniCostieraAmalfitana'
            ]
        },
        {
            id: 'RETRO-001',
            subjectKey: 'examples.imagePreviewViewer.catalog.retro.subject',
            descriptionKey: 'examples.imagePreviewViewer.catalog.retro.description',
            photoIds: [
                'retroPiaggioCiaoPubblicita',
                'retroSonyWalkmanPubblicita',
                'retroCommodore64',
                'retroMotorolaDynatac8000x'
            ]
        }
    ],
    photographs: {
        cityNewYorkBrooklynBridge: photograph('cityNewYorkBrooklynBridge', 'citta-new-york-brooklyn-bridge.png', 'panoramic', cityNewYorkBrooklynBridge),
        cityTokyoShibuyaCrossing: photograph('cityTokyoShibuyaCrossing', 'citta-tokyo-shibuya-crossing.png', 'panoramic', cityTokyoShibuyaCrossing),
        cityHongKongMongKok: photograph('cityHongKongMongKok', 'citta-hong-kong-mong-kok.png', 'panoramic', cityHongKongMongKok),
        cityOsakaDotonbori: photograph('cityOsakaDotonbori', 'citta-osaka-dotonbori.png', 'square', cityOsakaDotonbori),
        seaCalaBrandinchi: photograph('seaCalaBrandinchi', 'mare-cala-brandinchi.png', 'ultrawide', seaCalaBrandinchi),
        seaFiordoFurore: photograph('seaFiordoFurore', 'mare-fiordo-furore.png', 'portrait', seaFiordoFurore),
        seaSenigalliaRotonda: photograph('seaSenigalliaRotonda', 'mare-senigallia-rotonda.png', 'landscape', seaSenigalliaRotonda),
        seaTorreOrsoDueSorelle: photograph('seaTorreOrsoDueSorelle', 'mare-torre-orso-due-sorelle.png', 'panoramic', seaTorreOrsoDueSorelle),
        seaAtraniCostieraAmalfitana: photograph('seaAtraniCostieraAmalfitana', 'mare-atrani-costiera-amalfitana.png', 'panoramic', seaAtraniCostieraAmalfitana),
        retroPiaggioCiaoPubblicita: photograph('retroPiaggioCiaoPubblicita', 'vintage-piaggio-ciao-pubblicita.png', 'portrait', retroPiaggioCiaoPubblicita),
        retroSonyWalkmanPubblicita: photograph('retroSonyWalkmanPubblicita', 'vintage-sony-walkman-pubblicita.png', 'portrait', retroSonyWalkmanPubblicita),
        retroCommodore64: photograph('retroCommodore64', 'vintage-commodore-64.png', 'square', retroCommodore64),
        retroMotorolaDynatac8000x: photograph('retroMotorolaDynatac8000x', 'vintage-motorola-dynatac-8000x.png', 'portrait', retroMotorolaDynatac8000x)
    }
};
