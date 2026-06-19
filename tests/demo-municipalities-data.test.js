import fs from 'node:fs';
import { describe, expect, test } from 'vitest';

const datasetPath = new URL(
    '../public/demo/data/italian-municipalities.demo.json',
    import.meta.url
);
const municipalities = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
const demoSource = fs.readFileSync(
    new URL('../src/demo/multifield-lookup.js', import.meta.url),
    'utf8'
);
const demoMenuSource = fs.readFileSync(
    new URL('../src/demo/main.js', import.meta.url),
    'utf8'
);

describe('Italian municipalities demo dataset', () => {
    test('contains a realistic, uniquely keyed municipality list', () => {
        const keys = municipalities.map(record => record.istatCode);

        expect(municipalities.length).toBeGreaterThan(7000);
        expect(new Set(keys).size).toBe(municipalities.length);
        expect(municipalities.every(record => {
            return typeof record.istatCode === 'string'
                && record.istatCode.length === 6
                && typeof record.cadastralCode === 'string'
                && typeof record.municipalityName === 'string'
                && typeof record.province === 'string'
                && typeof record.region === 'string'
                && typeof record.postalCode === 'string';
        })).toBe(true);
    });

    test('contains the documented Nocera Inferiore mapping', () => {
        const municipality = municipalities.find(record => {
            return record.istatCode === '065078';
        });

        expect(municipality).toEqual({
            istatCode: '065078',
            cadastralCode: 'F912',
            municipalityName: 'Nocera Inferiore',
            province: 'SA',
            region: 'CAMPANIA',
            postalCode: '84014'
        });
    });

    test('keeps the public demo reachable and free of hardcoded row rollback', () => {
        expect(demoMenuSource).toContain("import multifieldLookup from './multifield-lookup.js'");
        expect(demoMenuSource).toContain("label: 'Multifield lookup'");
        expect(demoSource).not.toContain('Rollback first row');
        expect(demoSource).not.toContain('rollbackRow(1)');
        expect(demoSource).toContain('This dataset is provided for demonstration purposes only.');
    });
});
