import fs from 'node:fs';
import path from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';

const DEFAULT_INPUT = 'Elenco-comuni-italiani.xlsx';
const DEFAULT_OUTPUT = 'public/demo/data/italian-municipalities.demo.json';
const DEFAULT_POSTAL_CODES_INPUT = 'comuni.json';
const POSTAL_CODE_OVERRIDES = {
    '001272': '10121',
    '015146': '20121',
    '027042': '30121',
    '037006': '40121',
    '048017': '50121',
    '058091': '00118',
    '063049': '80121',
    '065078': '84014',
    '065116': '84121',
    '072006': '70121',
    '082053': '90121'
};

const decodeXml = value => String(value || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'");

const getColumnName = reference => {
    return String(reference || '').replace(/\d+/g, '');
};

const readSharedStrings = archive => {
    const source = archive['xl/sharedStrings.xml'];

    if (!source) return [];

    return [...strFromU8(source).matchAll(/<si>([\s\S]*?)<\/si>/g)]
        .map(match => decodeXml(match[1]));
};

const readRows = (archive, sharedStrings) => {
    const source = archive['xl/worksheets/sheet1.xml'];

    if (!source) {
        throw new Error('The ISTAT workbook does not contain xl/worksheets/sheet1.xml');
    }

    return [...strFromU8(source).matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)]
        .map(rowMatch => {
            const row = {};

            for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
                const attributes = cellMatch[1];
                const reference = attributes.match(/\br="([^"]+)"/)?.[1];
                const type = attributes.match(/\bt="([^"]+)"/)?.[1];
                const rawValue = cellMatch[2].match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? '';
                const value = type === 's'
                    ? sharedStrings[Number(rawValue)] ?? ''
                    : decodeXml(rawValue);

                row[getColumnName(reference)] = value;
            }

            return row;
        });
};

const findHeader = rows => {
    const rowIndex = rows.findIndex(row => {
        return Object.values(row).some(value => {
            return String(value).includes('Codice Comune formato alfanumerico');
        });
    });

    if (rowIndex < 0) {
        throw new Error('Unable to find the municipality header row in the ISTAT workbook');
    }

    const fields = {};

    Object.entries(rows[rowIndex]).forEach(([column, label]) => {
        fields[String(label).trim()] = column;
    });

    return { fields, rowIndex };
};

const findColumn = (fields, matcher, description) => {
    const entry = Object.entries(fields).find(([label]) => matcher(label));

    if (!entry) {
        throw new Error(`Unable to find the ISTAT column for ${description}`);
    }

    return entry[1];
};

const getFirstPostalCode = record => {
    const values = Array.isArray(record.cap) ? record.cap : [];
    const postalCode = values.find(value => /^\d{5}$/.test(String(value)));

    return postalCode ? String(postalCode) : '';
};

const createPostalCodeIndex = source => {
    const records = JSON.parse(fs.readFileSync(source, 'utf8'));
    const byIstatCode = new Map();
    const byCadastralCode = new Map();
    const byProvince = new Map();

    records.forEach(record => {
        const postalCode = getFirstPostalCode(record);

        if (!postalCode) return;

        byIstatCode.set(
            String(record.codice || '').padStart(6, '0'),
            postalCode
        );

        if (record.codiceCatastale) {
            byCadastralCode.set(String(record.codiceCatastale), postalCode);
        }

        if (record.sigla && !byProvince.has(record.sigla)) {
            byProvince.set(String(record.sigla), postalCode);
        }
    });

    return {
        byIstatCode,
        byCadastralCode,
        byProvince
    };
};

const normalizeRecords = (rows, postalCodeIndex) => {
    const { fields, rowIndex } = findHeader(rows);
    const columns = {
        istatCode: findColumn(
            fields,
            label => label === 'Codice Comune formato alfanumerico',
            'ISTAT code'
        ),
        cadastralCode: findColumn(
            fields,
            label => label.includes('Codice Catastale'),
            'cadastral code'
        ),
        municipalityName: findColumn(
            fields,
            label => label === 'Denominazione in italiano',
            'municipality name'
        ),
        province: findColumn(
            fields,
            label => label.includes('Sigla automobilistica'),
            'province abbreviation'
        ),
        region: findColumn(
            fields,
            label => label === 'Denominazione Regione',
            'region'
        )
    };

    return rows.slice(rowIndex + 1)
        .map(row => {
            const istatCode = String(row[columns.istatCode] || '').padStart(6, '0');
            const cadastralCode = String(row[columns.cadastralCode] || '');
            const province = String(row[columns.province] || '');

            return {
                istatCode,
                cadastralCode,
                municipalityName: String(row[columns.municipalityName] || ''),
                province,
                region: String(row[columns.region] || '').toUpperCase(),
                postalCode: POSTAL_CODE_OVERRIDES[istatCode]
                    || postalCodeIndex.byIstatCode.get(istatCode)
                    || postalCodeIndex.byCadastralCode.get(cadastralCode)
                    || postalCodeIndex.byProvince.get(province)
                    || '00000'
            };
        })
        .filter(record => record.istatCode !== '000000' && record.municipalityName)
        .sort((left, right) => {
            return left.municipalityName.localeCompare(right.municipalityName, 'it');
        });
};

const inputPath = path.resolve(process.argv[2] || DEFAULT_INPUT);
const outputPath = path.resolve(process.argv[3] || DEFAULT_OUTPUT);
const postalCodesInputPath = path.resolve(process.argv[4] || DEFAULT_POSTAL_CODES_INPUT);
const archive = unzipSync(fs.readFileSync(inputPath));
const postalCodeIndex = createPostalCodeIndex(postalCodesInputPath);
const records = normalizeRecords(
    readRows(archive, readSharedStrings(archive)),
    postalCodeIndex
);
const invalidPostalCode = records.find(record => {
    return !/^\d{5}$/.test(record.postalCode);
});

if (invalidPostalCode) {
    throw new Error(
        `Invalid demo postal code for ${invalidPostalCode.istatCode}: `
        + `"${invalidPostalCode.postalCode}"`
    );
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(records, null, 2)}\n`);

console.log(
    `Generated ${records.length} demo municipality records `
    + `(all with one postal code) in ${outputPath}`
);
