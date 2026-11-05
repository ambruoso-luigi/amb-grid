// Preparatory catalog. Image sources and editorial translations are added in IMG 03 B.
const photoKey = id => `examples.imagePreviewViewer.catalog.photo.${id}`;

const photograph = (id, filename, format) => {
    const key = photoKey(id);
    return {
        id,
        filename,
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
        cityNewYorkBrooklynBridge: photograph('cityNewYorkBrooklynBridge', 'citta-new-york-brooklyn-bridge.png', 'panoramic'),
        cityTokyoShibuyaCrossing: photograph('cityTokyoShibuyaCrossing', 'citta-tokyo-shibuya-crossing.png', 'panoramic'),
        cityHongKongMongKok: photograph('cityHongKongMongKok', 'citta-hong-kong-mong-kok.png', 'panoramic'),
        cityOsakaDotonbori: photograph('cityOsakaDotonbori', 'citta-osaka-dotonbori.png', 'square'),
        seaCalaBrandinchi: photograph('seaCalaBrandinchi', 'mare-cala-brandinchi.png', 'ultrawide'),
        seaFiordoFurore: photograph('seaFiordoFurore', 'mare-fiordo-furore.png', 'portrait'),
        seaSenigalliaRotonda: photograph('seaSenigalliaRotonda', 'mare-senigallia-rotonda.png', 'landscape'),
        seaTorreOrsoDueSorelle: photograph('seaTorreOrsoDueSorelle', 'mare-torre-orso-due-sorelle.png', 'panoramic'),
        seaAtraniCostieraAmalfitana: photograph('seaAtraniCostieraAmalfitana', 'mare-atrani-costiera-amalfitana.png', 'panoramic'),
        retroPiaggioCiaoPubblicita: photograph('retroPiaggioCiaoPubblicita', 'vintage-piaggio-ciao-pubblicita.png', 'portrait'),
        retroSonyWalkmanPubblicita: photograph('retroSonyWalkmanPubblicita', 'vintage-sony-walkman-pubblicita.png', 'portrait'),
        retroCommodore64: photograph('retroCommodore64', 'vintage-commodore-64.png', 'square'),
        retroMotorolaDynatac8000x: photograph('retroMotorolaDynatac8000x', 'vintage-motorola-dynatac-8000x.png', 'portrait')
    }
};
